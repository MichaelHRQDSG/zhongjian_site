const TOKEN_PREFIX = "eap_ent_token_";
const COOKIE_PREFIX = "eap_ent_";

export interface EnterpriseSiteProfile {
  username: string;
  role: "employee" | "admin" | string;
  realName?: string;
  empNo?: string;
}

export interface EnterpriseAuthStatus {
  loginRequired: boolean;
  authenticated: boolean;
  siteName: string;
  companyName: string;
  logoUrl: string;
  slogan: string;
  profile: EnterpriseSiteProfile | null;
}

function canUseWindow() {
  return typeof window !== "undefined";
}

export function enterpriseTokenStorageKey(slug: string) {
  return `${TOKEN_PREFIX}${slug}`;
}

export function readEnterpriseToken(slug: string): string {
  if (!slug) return "";
  if (canUseWindow()) {
    return window.localStorage.getItem(enterpriseTokenStorageKey(slug)) || "";
  }
  return "";
}

export function writeEnterpriseToken(slug: string, token: string) {
  if (!slug || !canUseWindow()) return;
  window.localStorage.setItem(enterpriseTokenStorageKey(slug), token);
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${COOKIE_PREFIX}${slug}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearEnterpriseToken(slug: string) {
  if (!slug || !canUseWindow()) return;
  window.localStorage.removeItem(enterpriseTokenStorageKey(slug));
  document.cookie = `${COOKIE_PREFIX}${slug}=; path=/; max-age=0; SameSite=Lax`;
}

export function authHeaders(slug: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = readEnterpriseToken(slug);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export async function fetchEnterpriseAuthStatus(apiBaseUrl: string, slug: string) {
  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/api/web/assessment-enterprises/${encodeURIComponent(slug)}/auth/status`,
    {
      cache: "no-store",
      headers: authHeaders(slug),
    },
  );
  const raw = await response.json().catch(() => ({}));
  const payload = unwrap(raw);
  return {
    loginRequired: Boolean(payload.loginRequired),
    authenticated: payload.authenticated !== false,
    siteName: String(payload.siteName || ""),
    companyName: String(payload.companyName || ""),
    logoUrl: String(payload.logoUrl || ""),
    slogan: String(payload.slogan || ""),
    profile: payload.profile && typeof payload.profile === "object"
      ? (payload.profile as EnterpriseSiteProfile)
      : null,
  } as EnterpriseAuthStatus;
}

export async function loginEnterpriseSite(
  apiBaseUrl: string,
  slug: string,
  username: string,
  password: string,
) {
  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/api/web/assessment-enterprises/${encodeURIComponent(slug)}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
  );
  const raw = await response.json().catch(() => ({}));
  const envelope = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (!response.ok) {
    throw new Error(loginFailureText(envelope.msg || envelope.detail || envelope.message, response.status));
  }
  const payload = unwrap(raw);
  const token = String(payload.token || "");
  if (!token) throw new Error("登录失败，请稍后重试");
  writeEnterpriseToken(slug, token);
  return payload;
}

function loginFailureText(detail: unknown, status: number): string {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  // FastAPI 参数校验失败时 detail 是数组，统一成用户能看懂的提示
  if (Array.isArray(detail) && detail.length > 0) return "请输入账号和密码";
  if (status >= 500) return "服务暂时不可用，请稍后重试";
  return `登录失败（${status}）`;
}

/** 网络断开等 fetch 本身失败时给出可读提示，其余沿用后端返回的原因。 */
export function loginErrorText(error: unknown): string {
  if (error instanceof TypeError) return "网络连接失败，请检查网络后重试";
  if (error instanceof Error && error.message) return error.message;
  return "登录失败，请稍后重试";
}

/**
 * 企业首页 `/{slug}` 对未登录访客开放，其余企业页面（测评、图文、咨询师等二级页面）都需要登录。
 */
export function isEnterpriseHomePath(pathname: string, slug: string): boolean {
  if (!slug) return false;
  const path = (pathname || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path.toLowerCase() === `/${slug.toLowerCase()}`;
}

const NON_PAGE_PREFIXES = ["/api/", "/_next/", "/static/", "/assets/"];
const FILE_PATH = /\.[a-z0-9]{2,5}$/i;

/**
 * 首页点击站内链接时判断是否要先登录：返回登录后要前往的站内地址（路径 + 查询 + 锚点）；
 * 首页自身（含页内锚点）、外链、静态文件都返回空串，照常跳转。
 */
export function protectedNavigationTarget(href: string, slug: string, origin: string): string {
  if (!slug || !href) return "";
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return "";
  }
  if (url.origin !== origin || (url.protocol !== "http:" && url.protocol !== "https:")) return "";
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || isEnterpriseHomePath(path, slug)) return "";
  const lower = `${path.toLowerCase()}/`;
  if (NON_PAGE_PREFIXES.some((prefix) => lower.startsWith(prefix))) return "";
  if (FILE_PATH.test(path)) return "";
  return `${url.pathname}${url.search}${url.hash}`;
}

const TARGET_LABELS: Array<[RegExp, string]> = [
  [/^\/[^/]+\/onboarding$/i, "心理测评"],
  [/^\/articles(\/|$)/i, "心理图文"],
  [/^\/audios(\/|$)/i, "心理音画"],
  [/^\/counselors\/[^/]+$/i, "咨询师介绍"],
  [/^\/counselors$/i, "咨询师团队"],
  [/^\/eap-services(\/|$)/i, "EAP 服务"],
  [/^\/about(\/|$)/i, "品牌介绍"],
  [/^\/contact(\/|$)/i, "联系我们"],
  [/^\/privacy(\/|$)/i, "隐私保护政策"],
  [/^\/confidentiality(\/|$)/i, "保密协议"],
];

/** 登录提示里用的页面名称（“登录后将为你打开「心理测评」”）；认不出的页面返回空串。 */
export function describeEnterpriseTarget(target: string): string {
  const path = (target || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return TARGET_LABELS.find(([pattern]) => pattern.test(path))?.[1] || "";
}

/** 状态接口里的 logo 可能是后端回环地址，浏览器访问不到时改走同源 /static 转发。 */
export function browserLogoUrl(raw: string): string {
  const value = (raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(value)) {
    return value.replace(/^https?:\/\/[^/]+/i, "");
  }
  return value;
}

function unwrap(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data as Record<string, unknown>;
  }
  return obj;
}
