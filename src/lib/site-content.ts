/** 与小程序站点文案对齐的公开内容拉取 */

const API_BASE_URL = (
  process.env.ASSESSMENT_API_BASE_URL
  || process.env.MINI_PRODUCTION_API_BASE_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export interface SitePageContent {
  title: string;
  subtitle: string;
  paragraphs: string[];
  assistantQrcodeUrl?: string;
}

interface SitePagePayload {
  title?: string;
  subtitle?: string | null;
  body?: string;
  assistantQrcodeUrl?: string | null;
}

interface PublicSiteContent {
  pages?: Record<string, SitePagePayload>;
}

function unwrapPayload<T extends object>(raw: unknown): T | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  const nested = obj.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as T;
  }
  return obj as T;
}

function bodyToParagraphs(body: string): string[] {
  const normalized = (body || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!normalized) return [];
  return normalized
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export const FALLBACK_BRAND_CONTENT: SitePageContent = {
  title: "品牌介绍",
  subtitle: "同心理 · 专业.温暖的心理服务平台",
  paragraphs: [
    "同心理致力于为来访者提供专业、温暖的心理服务，帮助每一位需要支持的人更好地理解自己、照顾自己。",
    "平台连接专业心理咨询师，以规范、安全和可信赖的服务陪伴来访者面对情绪、关系与成长中的困扰。",
    "提供心理咨询、心理测评、心理健康科普及相关支持服务。",
    "通过清晰的预约流程和持续的服务保障，让专业心理支持更容易获得。",
    "尊重每一份真实感受，重视每一次真诚连接，以专业守护信任，以温暖陪伴成长。",
  ],
};

export const FALLBACK_CONTACT_INTRO: SitePageContent = {
  title: "联系我们",
  subtitle: "上海连心心理咨询有限公司",
  paragraphs: [
    "欢迎通过下方咨询中心地址、助理微信或电话与我们取得联系。",
    "咨询助理工作时间为工作日 9:00–18:00，我们会在工作时间内尽快回复您的留言。",
  ],
};

function resolveAssistantQrcodeUrl(url?: string | null): string | undefined {
  const value = (url || "").trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/static/")) return `${API_BASE_URL}${value}`;
  return value.startsWith("/") ? value : `/${value}`;
}

function resolvePageContent(
  pages: Record<string, SitePagePayload> | undefined,
  key: string,
  fallback: SitePageContent,
): SitePageContent {
  const page = pages?.[key];
  if (page?.body?.trim()) {
    return {
      title: page.title || fallback.title,
      subtitle: page.subtitle?.trim() || fallback.subtitle,
      paragraphs: bodyToParagraphs(page.body),
      assistantQrcodeUrl: resolveAssistantQrcodeUrl(page.assistantQrcodeUrl),
    };
  }
  return {
    ...fallback,
    assistantQrcodeUrl: resolveAssistantQrcodeUrl(fallback.assistantQrcodeUrl),
  };
}

export async function fetchSitePageContent(
  key: "brand" | "contact",
  fallback: SitePageContent,
): Promise<SitePageContent> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mini/common/site-content`, {
      cache: "no-store",
    });
    if (!response.ok) return fallback;
    const payload = unwrapPayload<PublicSiteContent>(await response.json());
    return resolvePageContent(payload?.pages, key, fallback);
  } catch {
    return fallback;
  }
}
