/**
 * 入职测评的本机暂存（浏览器缓存）：
 * - 续答位置：关页 / 刷新时正在作答的量表，回来直接回到该量表并定位到第一道未答题；
 * - 重新作答草稿：已完成量表的重答单独存放，不覆盖原答案，提交成功前原结果不变；
 * - 待提交编号：同一份答案重试提交时沿用同一个 clientSubmissionId，避免网络超时后重复生成报告；
 * - 本机保存时间：与云端进度合并时判断谁更新，避免较旧的云端快照冲掉本机刚答的题。
 *
 * 所有 key 都带账号隔离后的 scope（见 enterprise-onboarding-progress.ts 的 onboardingStorageScope）。
 */
import { isDynamicQuestionAnswered } from "@/lib/onboarding-answers";

export type AnswerMap = Record<string, unknown>;
export type AnswersByScale = Record<string, AnswerMap>;

export interface OnboardingResumePoint {
  scaleId: string;
  /** 是否为已完成量表的重新作答 */
  retake: boolean;
  savedAt: string;
}

export interface RetakeDraft {
  attemptId: string;
  answers: AnswerMap;
  startedAt: string;
  savedAt: string;
}

export interface PendingSubmission {
  id: string;
  signature: string;
}

export function onboardingDraftKeys(scope: string) {
  return {
    resumeKey: `onb-resume-${scope}`,
    savedAtKey: `onb-saved-at-${scope}`,
    retakeKey: `onb-retake-${scope}`,
    pendingKey: `onb-pending-${scope}`,
  };
}

/** 退出登录 / 清缓存时与其它 onb-* 一起清掉的前缀 */
export const DRAFT_STORAGE_PREFIXES = ["onb-resume-", "onb-saved-at-", "onb-retake-", "onb-pending-"] as const;

export function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式 / 配额满：暂存失败不影响作答 */
  }
}

// ==================== 作答统计 ====================

interface DraftScaleItem {
  id?: string;
  [key: string]: unknown;
}

interface DraftScale {
  scale?: string;
  items?: unknown[];
  demoTotal?: number;
}

function answerKeyOf(scale: DraftScale, item: unknown, index: number): string | number {
  const id = item && typeof item === "object" ? (item as DraftScaleItem).id : undefined;
  return scale?.scale === "dynamic" && id != null ? String(id) : index;
}

function isAnswered(scale: DraftScale, answers: AnswerMap, item: unknown, index: number) {
  const value = answers[answerKeyOf(scale, item, index)];
  if (scale?.scale === "dynamic" && item && typeof item === "object") {
    return isDynamicQuestionAnswered(item as Parameters<typeof isDynamicQuestionAnswered>[0], value);
  }
  return value != null && value !== "";
}

/** 与作答页一致的“已答 / 总题数”（动态量表按当前题目定义校验，旧版本留下的无效选项不算已答）。 */
export function countAnsweredItems(scale: DraftScale, answers: AnswerMap | undefined | null) {
  const items = Array.isArray(scale?.items) ? scale.items : [];
  const map = answers && typeof answers === "object" ? answers : {};
  const answered = items.filter((item, index) => isAnswered(scale, map, item, index)).length;
  const total = Math.max(Number(scale?.demoTotal) || items.length || 0, 1);
  return { answered, total };
}

/** 第一道未答题的下标；全部答完返回 -1。 */
export function firstUnansweredIndex(scale: DraftScale, answers: AnswerMap | undefined | null) {
  const items = Array.isArray(scale?.items) ? scale.items : [];
  const map = answers && typeof answers === "object" ? answers : {};
  return items.findIndex((item, index) => !isAnswered(scale, map, item, index));
}

// ==================== 本机与云端合并 ====================

/** 本机最后一次保存是否晚于云端进度的 updatedAt（云端时间为 UTC ISO）。 */
export function isLocalDraftNewer(localSavedAt?: string | null, remoteUpdatedAt?: string | null) {
  const local = Date.parse(localSavedAt || "");
  if (!Number.isFinite(local)) return false;
  const remote = Date.parse(remoteUpdatedAt || "");
  if (!Number.isFinite(remote)) return true;
  return local > remote;
}

/** 逐题合并：overlay 覆盖 base；空量表不参与。返回新对象，不修改入参。 */
export function mergeAnswersByScale(base: unknown, overlay: unknown): AnswersByScale {
  const out: AnswersByScale = {};
  for (const source of [base, overlay]) {
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;
    for (const [scaleId, answers] of Object.entries(source as Record<string, unknown>)) {
      if (!answers || typeof answers !== "object" || Array.isArray(answers)) continue;
      if (!Object.keys(answers).length) continue;
      out[scaleId] = { ...(out[scaleId] || {}), ...(answers as AnswerMap) };
    }
  }
  return out;
}

/** 两份作答是否完全一致（用于判断合并后是否需要回写云端）。 */
export function sameAnswers(a: unknown, b: unknown) {
  return stableStringify(a ?? {}) === stableStringify(b ?? {});
}

// ==================== 提交幂等 ====================

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}

/** 同一量表、同一轮作答、同一份答案 → 同一个签名。 */
export function submissionSignature(answers: unknown, attemptId?: string | null) {
  return `${attemptId || "first"}|${stableStringify(answers ?? {})}`;
}

/**
 * 取本次提交用的 clientSubmissionId：答案没变就沿用上次失败时的编号（后端按编号去重，
 * 不会因为“其实已保存但前端超时”而多出一份报告）；答案变了就换新编号。
 */
export function resolveSubmissionId(
  pending: PendingSubmission | null | undefined,
  signature: string,
  createId: () => string,
): PendingSubmission {
  if (pending && pending.id && pending.signature === signature) return pending;
  return { id: createId(), signature };
}
