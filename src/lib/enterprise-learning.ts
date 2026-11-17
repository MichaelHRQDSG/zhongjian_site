/**
 * 企业站知识库学习记录回传。
 *
 * 只在企业专属上下文（有 slug）里上报：图文打开 / 阅读时长、音频开始播放 / 播放完成。
 * 访客标识与测评答卷共用 localStorage；启用人员表登录时按账号隔离 visitorKey，
 * 避免同浏览器换号共用底层 AppAccount。上报失败静默忽略。
 */
import { resolveBrowserApiBaseUrl } from "@/lib/backend-env";
import { readEnterpriseAccountId, readEnterpriseToken } from "@/lib/enterprise-auth";

export type LearningContentType = "article" | "audio";
export type LearningAction = "view" | "read" | "play" | "complete";

export interface LearningEventInput {
  contentType: LearningContentType;
  contentId: string;
  contentTitle?: string;
  action: LearningAction;
  durationSec?: number;
}

/** 访客标识：有账号时 `onb-visitor-{slug}-a-{accountId}`，否则退回 `onb-visitor-{slug}`。 */
export function enterpriseVisitorStorageKey(
  slug: string,
  accountId?: number | string | null,
) {
  const base = String(slug || "").trim();
  if (!base) return "onb-visitor-default";
  if (accountId != null && accountId !== "") {
    return `onb-visitor-${base}-a-${accountId}`;
  }
  return `onb-visitor-${base}`;
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
export function getEnterpriseVisitorKey(
  slug: string,
  accountId?: number | string | null,
): string {
  if (!slug || typeof window === "undefined") return "";
  try {
    const resolvedAccountId =
      accountId != null && accountId !== ""
        ? accountId
        : readEnterpriseAccountId(slug);
    const storageKey = enterpriseVisitorStorageKey(slug, resolvedAccountId);
    let key = window.localStorage.getItem(storageKey) || "";
    // 登录后优先用账号 key；若为空则迁移旧版 slug 共用 key 一次，再删除旧 key
    if (key.length < 8 && resolvedAccountId != null && resolvedAccountId !== "") {
      const legacy = window.localStorage.getItem(enterpriseVisitorStorageKey(slug));
      if (legacy && legacy.length >= 8) {
        key = legacy;
        window.localStorage.setItem(storageKey, key);
        window.localStorage.removeItem(enterpriseVisitorStorageKey(slug));
      }
    }
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
