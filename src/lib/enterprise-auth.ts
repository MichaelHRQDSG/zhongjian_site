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
    const detail = envelope.msg || envelope.detail || envelope.message || `登录失败（${response.status}）`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  const payload = unwrap(raw);
  const token = String(payload.token || "");
  if (!token) throw new Error("登录失败");
  writeEnterpriseToken(slug, token);
  return payload;
}

function unwrap(raw: unknown): Record<string, any> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    return obj.data as Record<string, any>;
  }
  return obj;
}
