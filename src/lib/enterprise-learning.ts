/**
 * 企业站知识库学习记录回传。
 *
 * 只在企业专属上下文（有 slug）里上报：图文打开 / 阅读时长、音频开始播放 / 播放完成。
 * 访客标识与测评答卷共用 localStorage `onb-visitor-{slug}`，后台据此把学习记录
 * 和员工档案对上；启用人员表登录的企业还会带上站点登录 token，按账号归档。
 * 上报失败静默忽略，不影响阅读与播放。
 */
import { resolveBrowserApiBaseUrl } from "@/lib/backend-env";
import { readEnterpriseToken } from "@/lib/enterprise-auth";

export type LearningContentType = "article" | "audio";
export type LearningAction = "view" | "read" | "play" | "complete";

export interface LearningEventInput {
  contentType: LearningContentType;
  contentId: string;
  contentTitle?: string;
  action: LearningAction;
  durationSec?: number;
}

/** 与 OnboardingAssessment 的 `onb-visitor-${storageScope}` 保持一致（企业页 storageScope 即 slug）。 */
export function enterpriseVisitorStorageKey(slug: string) {
  return `onb-visitor-${slug}`;
}

export function createVisitorKey() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch {}
  return `vk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

/** 读取（必要时生成）当前浏览器在该企业站的访客标识；存储不可用时返回空串。 */
export function getEnterpriseVisitorKey(slug: string): string {
  if (!slug || typeof window === "undefined") return "";
  try {
    const storageKey = enterpriseVisitorStorageKey(slug);
    let key = window.localStorage.getItem(storageKey) || "";
    if (key.length < 8) {
      key = createVisitorKey();
      window.localStorage.setItem(storageKey, key);
    }
    return key;
  } catch {
    return "";
  }
}

export function trackEnterpriseLearning(slug: string, event: LearningEventInput) {
  if (!slug || typeof window === "undefined") return;
  const visitorKey = getEnterpriseVisitorKey(slug);
  const contentId = String(event.contentId || "").trim().slice(0, 120);
  if (!visitorKey || !contentId) return;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = readEnterpriseToken(slug);
  if (token) headers.Authorization = `Bearer ${token}`;

  const duration =
    typeof event.durationSec === "number" && Number.isFinite(event.durationSec)
      ? Math.max(0, Math.min(86400, Math.round(event.durationSec)))
      : undefined;
  const base = resolveBrowserApiBaseUrl().replace(/\/$/, "");
  try {
    void fetch(`${base}/api/web/assessment-enterprises/${encodeURIComponent(slug)}/learning-events`, {
      method: "POST",
      headers,
      // 页面关闭 / 切走时也尽量把阅读时长送出去
      keepalive: true,
      body: JSON.stringify({
        visitorKey,
        contentType: event.contentType,
        contentId,
        contentTitle: String(event.contentTitle || "").slice(0, 200),
        action: event.action,
        ...(duration !== undefined ? { durationSec: duration } : {}),
      }),
    }).catch(() => {});
  } catch {}
}
