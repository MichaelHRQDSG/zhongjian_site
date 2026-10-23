/**
 * 后端环境代称解析。
 *
 * 多环境推荐使用 `.env.local|.env.dev|.env.test|.env.prod`（见 ENVIRONMENTS.md），
 * 通过 ./scripts/corp-with-env.sh 注入。现网单实例仍可读 `.env.production`。
 *
 * BACKEND_ENV：eap | test | production（`dev` 作为 `eap` 别名）
 *
 * API 根地址优先级：
 *   ASSESSMENT_API_BASE_URL / MINI_API_BASE_URL /
 *   VITE_API_BASE_URL（团队约定名，Next 内映射）/
 *   旧名 MINI_PRODUCTION_* / NEXT_PUBLIC_API_BASE_URL /
 *   再回退 BACKEND_ENV 预设
 */

export type BackendEnvName = "eap" | "test" | "production";

type BackendPreset = {
  /** 与 compose 项目对应的内部名 */
  stack: "mini-dev" | "mini-test" | "mini-production";
  /** 本机后端根地址（服务端请求） */
  apiBaseUrl: string;
  /** 静态资源 / 公网前缀 */
  publicBaseUrl: string;
  label: string;
};

const PRESETS: Record<BackendEnvName, BackendPreset> = {
  /** 企业站常用调试栈：corp 默认对接 mini-dev */
  eap: {
    stack: "mini-dev",
    apiBaseUrl: "http://127.0.0.1:19000",
    publicBaseUrl: "https://dev.eap.ji-psy.com",
    label: "eap(mini-dev)",
  },
  test: {
    stack: "mini-test",
    apiBaseUrl: "http://127.0.0.1:18000",
    publicBaseUrl: "https://test.eap.ji-psy.com",
    label: "test(mini-test)",
  },
  production: {
    stack: "mini-production",
    apiBaseUrl: "http://127.0.0.1:28000",
    publicBaseUrl: "https://eap.ji-psy.com",
    label: "production(mini-production)",
  },
};

function normalizeEnvName(raw: string | undefined): BackendEnvName {
  const value = (raw || "").trim().toLowerCase();
  if (value === "production" || value === "prod" || value === "prd") {
    return "production";
  }
  if (value === "test" || value === "testing" || value === "staging") {
    return "test";
  }
  // eap / dev / development / 空 → 默认 eap（mini-dev）
  return "eap";
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** 当前 BACKEND_ENV 代称（已规范化） */
export function getBackendEnvName(): BackendEnvName {
  return normalizeEnvName(process.env.BACKEND_ENV);
}

export function getBackendPreset(): BackendPreset {
  return PRESETS[getBackendEnvName()];
}

/**
 * 服务端请求后端的根地址。
 * 显式 MINI_API_BASE_URL / ASSESSMENT_API_BASE_URL / 旧名优先于代称。
 */
export function resolveApiBaseUrl(options?: { preferAssessment?: boolean }): string {
  const preferAssessment = options?.preferAssessment !== false;
  const explicit = [
    preferAssessment ? process.env.ASSESSMENT_API_BASE_URL : undefined,
    process.env.MINI_API_BASE_URL,
    // 团队约定名（Vite 风格）；本仓库为 Next，在此映射为 API 根
    process.env.VITE_API_BASE_URL,
    process.env.MINI_PRODUCTION_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ]
    .map((v) => (v || "").trim())
    .find(Boolean);

  if (explicit) return stripSlash(explicit);
  return stripSlash(getBackendPreset().apiBaseUrl);
}

/** 头像等静态资源公网前缀 */
export function resolvePublicBaseUrl(): string {
  const explicit = [
    process.env.MINI_PUBLIC_BASE_URL,
    process.env.MINI_PRODUCTION_PUBLIC_BASE_URL,
  ]
    .map((v) => (v || "").trim())
    .find(Boolean);

  if (explicit) return stripSlash(explicit);
  return stripSlash(getBackendPreset().publicBaseUrl);
}
