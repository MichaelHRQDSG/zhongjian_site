/**
 * 企业站入职测评进度：按登录账号分 localStorage key，并与服务端 GET/PUT 同步。
 * 正式答卷为准：服务端 GET/PUT 会用已提交报告校准 completed / publicId。
 */
import { resolveBrowserApiBaseUrl } from "@/lib/backend-env";
import { readEnterpriseToken } from "@/lib/enterprise-auth";
import { enterpriseVisitorStorageKey } from "@/lib/enterprise-learning";

export type OnboardingStep =
  | "welcome"
  | "basic"
  | "select"
  | "scale"
  | "scaleResult";

export interface OnboardingSubmittedReport {
  assessmentId: string;
  publicId?: string;
  assessmentTitle?: string;
  scoringType?: string;
  resultSummary?: string;
  result?: unknown;
  submittedAt?: string | null;
  completedAt?: string | null;
}

export interface OnboardingProgressSnapshot {
  exists: boolean;
  step: OnboardingStep | string;
  activeScaleId: string;
  answersByScale: Record<string, unknown>;
  basicInfo: Record<string, unknown>;
  completedScaleIds: string[];
  resultsByScale: Record<string, unknown>;
  status: "in_progress" | "completed" | string;
  updatedAt: string | null;
  personnelId?: number;
  submittedReports?: OnboardingSubmittedReport[];
  reconciled?: boolean;
}

export interface OnboardingProgressPutBody {
  step: string;
  activeScaleId?: string;
  answersByScale: Record<string, unknown>;
  basicInfo: Record<string, unknown>;
  completedScaleIds: string[];
  resultsByScale: Record<string, unknown>;
  status: "in_progress" | "completed";
  clientUpdatedAt?: string | null;
}

const PROGRESS_PREFIXES = [
  "onb-step-",
  "onb-answers-",
  "onb-basic-",
  "onb-completed-",
  "onb-results-",
] as const;

/** 登录账号隔离 scope；无账号时退回 slug（访客仅本机）。 */
export function onboardingStorageScope(
  slug: string,
  accountId?: number | string | null,
): string {
  const base = String(slug || "").trim() || "default";
  if (accountId == null || accountId === "") return base;
  return `${base}-a-${accountId}`;
}

export function onboardingStorageKeys(
  scope: string,
  slug?: string,
  accountId?: number | string | null,
) {
  const visitorSlug = String(slug || scope.replace(/-a-\d+$/, "") || scope);
  return {
    progressKey: `onb-step-${scope}`,
    answersKey: `onb-answers-${scope}`,
    basicKey: `onb-basic-${scope}`,
    completedKey: `onb-completed-${scope}`,
    resultsKey: `onb-results-${scope}`,
    visitorKeyStorage: enterpriseVisitorStorageKey(visitorSlug, accountId),
  };
}

/** 清除某企业下与测评进度相关的本机缓存（含旧版「仅 slug」共用 key）。 */
export function clearEnterpriseOnboardingLocal(
  slug: string,
  accountId?: number | string | null,
) {
  if (!slug || typeof window === "undefined") return;
  try {
    const scopes = new Set<string>([slug, onboardingStorageScope(slug, accountId)]);
    for (const scope of scopes) {
      for (const prefix of PROGRESS_PREFIXES) {
        window.localStorage.removeItem(`${prefix}${scope}`);
      }
    }
    window.localStorage.removeItem(enterpriseVisitorStorageKey(slug));
    if (accountId != null && accountId !== "") {
      window.localStorage.removeItem(enterpriseVisitorStorageKey(slug, accountId));
    }
    // 扫尾：同 slug 下其它账号残留的 onb-*-{slug}-a-*
    const needle = `${slug}-a-`;
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const isProgress = PROGRESS_PREFIXES.some((p) => key.startsWith(p));
      const isVisitor = key.startsWith(`onb-visitor-${slug}`);
      if (!isProgress && !isVisitor) continue;
      if (isVisitor) {
        toRemove.push(key);
        continue;
      }
      if (key.includes(needle) || key.endsWith(`-${slug}`) || key.endsWith(slug)) {
        const rest = PROGRESS_PREFIXES.reduce(
          (acc, p) => (acc.startsWith(p) ? acc.slice(p.length) : acc),
          key,
        );
        if (rest === slug || rest.startsWith(`${slug}-a-`)) {
          toRemove.push(key);
        }
      }
    }
    toRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

/** 登录后丢弃旧版「全站共用」进度，避免换号误读上一账号作答。 */
export function purgeLegacySharedOnboardingKeys(slug: string) {
  if (!slug || typeof window === "undefined") return;
  try {
    for (const prefix of PROGRESS_PREFIXES) {
      window.localStorage.removeItem(`${prefix}${slug}`);
    }
  } catch {
    /* ignore */
  }
}

function unwrap(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data as Record<string, unknown>;
  }
  return obj;
}

function normalizeSnapshot(raw: unknown): OnboardingProgressSnapshot | null {
  const payload = unwrap(raw);
  if (!payload || typeof payload !== "object") return null;
  const completed = Array.isArray(payload.completedScaleIds)
    ? payload.completedScaleIds.map(String)
    : [];
  const submittedReports = Array.isArray(payload.submittedReports)
    ? payload.submittedReports
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          assessmentId: String(item.assessmentId || ""),
          publicId: item.publicId ? String(item.publicId) : undefined,
          assessmentTitle: item.assessmentTitle
            ? String(item.assessmentTitle)
            : undefined,
          scoringType: item.scoringType ? String(item.scoringType) : undefined,
          resultSummary:
            item.resultSummary != null ? String(item.resultSummary) : undefined,
          result: item.result,
          submittedAt:
            typeof item.submittedAt === "string" ? item.submittedAt : null,
          completedAt:
            typeof item.completedAt === "string" ? item.completedAt : null,
        }))
        .filter((item) => item.assessmentId)
    : [];
  return {
    exists: Boolean(payload.exists),
    step: String(payload.step || "welcome"),
    activeScaleId: String(payload.activeScaleId || ""),
    answersByScale:
      payload.answersByScale && typeof payload.answersByScale === "object"
        ? (payload.answersByScale as Record<string, unknown>)
        : {},
    basicInfo:
      payload.basicInfo && typeof payload.basicInfo === "object"
        ? (payload.basicInfo as Record<string, unknown>)
        : {},
    completedScaleIds: completed,
    resultsByScale:
      payload.resultsByScale && typeof payload.resultsByScale === "object"
        ? (payload.resultsByScale as Record<string, unknown>)
        : {},
    status: String(payload.status || "in_progress"),
    updatedAt:
      typeof payload.updatedAt === "string" && payload.updatedAt
        ? payload.updatedAt
        : null,
    personnelId:
      typeof payload.personnelId === "number" ? payload.personnelId : undefined,
    submittedReports,
    reconciled: Boolean(payload.reconciled),
  };
}

function progressUrl(apiBaseUrl: string, slug: string) {
  const base = (apiBaseUrl || resolveBrowserApiBaseUrl() || "").replace(/\/$/, "");
  return `${base}/api/web/assessment-enterprises/${encodeURIComponent(slug)}/progress`;
}

export async function fetchEnterpriseOnboardingProgress(
  apiBaseUrl: string,
  slug: string,
): Promise<OnboardingProgressSnapshot | null> {
  if (!slug) return null;
  const token = readEnterpriseToken(slug);
  if (!token) return null;
  try {
    const response = await fetch(progressUrl(apiBaseUrl, slug), {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return null;
    const raw = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    return normalizeSnapshot(raw);
  } catch {
    return null;
  }
}

export class OnboardingProgressConflictError extends Error {
  progress: OnboardingProgressSnapshot;

  constructor(progress: OnboardingProgressSnapshot) {
    super("进度已被其他设备更新");
    this.name = "OnboardingProgressConflictError";
    this.progress = progress;
  }
}

export async function putEnterpriseOnboardingProgress(
  apiBaseUrl: string,
  slug: string,
  body: OnboardingProgressPutBody,
  options?: { keepalive?: boolean },
): Promise<OnboardingProgressSnapshot | null> {
  if (!slug) return null;
  const token = readEnterpriseToken(slug);
  if (!token) return null;
  try {
    const response = await fetch(progressUrl(apiBaseUrl, slug), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      keepalive: Boolean(options?.keepalive),
      body: JSON.stringify({
        step: body.step,
        activeScaleId: body.activeScaleId || "",
        answersByScale: body.answersByScale || {},
        basicInfo: body.basicInfo || {},
        completedScaleIds: body.completedScaleIds || [],
        resultsByScale: body.resultsByScale || {},
        status: body.status || "in_progress",
        ...(body.clientUpdatedAt
          ? { clientUpdatedAt: body.clientUpdatedAt }
          : {}),
      }),
    });
    const raw = await response.json().catch(() => ({}));
    if (response.status === 409) {
      const envelope = unwrap(raw);
      const detail =
        envelope.detail && typeof envelope.detail === "object"
          ? (envelope.detail as Record<string, unknown>)
          : envelope;
      const progress = normalizeSnapshot(
        detail.progress || detail,
      );
      if (progress) throw new OnboardingProgressConflictError(progress);
      throw new Error("进度冲突，请刷新后重试");
    }
    if (!response.ok) {
      const envelope = unwrap(raw);
      const msg = envelope.msg || envelope.detail || envelope.message;
      throw new Error(
        typeof msg === "string" ? msg : `保存进度失败（${response.status}）`,
      );
    }
    return normalizeSnapshot(raw);
  } catch (error) {
    if (error instanceof OnboardingProgressConflictError) throw error;
    if (error instanceof Error) throw error;
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** 正式提交后写回进度：失败重试，避免报告已存但进度未对齐。 */
export async function putEnterpriseOnboardingProgressWithRetry(
  apiBaseUrl: string,
  slug: string,
  body: OnboardingProgressPutBody,
  attempts = 3,
  options?: { keepalive?: boolean },
): Promise<OnboardingProgressSnapshot | null> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await putEnterpriseOnboardingProgress(apiBaseUrl, slug, body, options);
    } catch (error) {
      if (error instanceof OnboardingProgressConflictError) throw error;
      lastError = error;
      if (i < attempts - 1) await sleep(300 * (i + 1));
    }
  }
  if (lastError instanceof Error) throw lastError;
  return null;
}
