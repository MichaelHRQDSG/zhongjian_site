export interface SiteBranding {
  companyName: string;
  siteName: string;
  logoUrl: string;
  slogan: string;
}

export interface EnterpriseAssessmentPayload extends SiteBranding {
  slug: string;
  assessments: Array<{
    id: string;
    title: string;
    subtitle?: string;
    instructions?: string;
    description?: string;
    duration: number;
    questions: Array<{
      id: string;
      text: string;
      options: Array<{ id: string; text: string }>;
    }>;
  }>;
}

const API_BASE_URL = (
  process.env.ASSESSMENT_API_BASE_URL
  || process.env.MINI_PRODUCTION_API_BASE_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const FALLBACK_BRANDING: SiteBranding = {
  siteName: "心安 EAP",
  companyName: "",
  logoUrl: "/assets/guangsha-xinan-logo.jpg",
  slogan: "专业测评，贴心陪伴",
};

/** 兼容后端 ApiResponseEnvelope：优先取 data，再回退顶层字段 */
function unwrapPayload<T extends Record<string, unknown>>(raw: unknown): T | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const nested = obj.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as T;
  }
  return obj as T;
}

function normalizeLogoUrl(logoUrl: string | undefined): string {
  const value = (logoUrl || "").trim();
  if (!value) return FALLBACK_BRANDING.logoUrl;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  // 后台上传文件在后端 /static/uploads；站点本地资源在 /assets
  if (value.startsWith("/static/")) {
    return `${API_BASE_URL}${value}`;
  }
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizeBranding(raw: unknown): SiteBranding {
  const payload = unwrapPayload<Partial<SiteBranding>>(raw) || {};
  return {
    siteName: String(payload.siteName || FALLBACK_BRANDING.siteName).trim() || FALLBACK_BRANDING.siteName,
    // 公司名允许为空，不回填默认企业名
    companyName: String(payload.companyName ?? "").trim(),
    logoUrl: normalizeLogoUrl(payload.logoUrl),
    slogan: String(payload.slogan || FALLBACK_BRANDING.slogan).trim() || FALLBACK_BRANDING.slogan,
  };
}

export async function fetchEnterpriseAssessments(slug: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/web/assessment-enterprises/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return undefined;
    const raw = await response.json();
    const payload = unwrapPayload<EnterpriseAssessmentPayload>(raw);
    if (!payload?.slug && !payload?.assessments) return undefined;
    const branding = normalizeBranding(payload);
    return {
      ...payload,
      ...branding,
      assessments: Array.isArray(payload.assessments) ? payload.assessments : [],
    } as EnterpriseAssessmentPayload;
  } catch (error) {
    console.error(
      `[enterprise-assessments] fetch failed for slug=${slug} base=${API_BASE_URL}`,
      error,
    );
    return undefined;
  }
}

export async function fetchDefaultBranding(): Promise<SiteBranding> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/web/assessment-enterprises/default`,
      { cache: "no-store" },
    );
    if (!response.ok) return FALLBACK_BRANDING;
    return normalizeBranding(await response.json());
  } catch {
    return FALLBACK_BRANDING;
  }
}

export function toOnboardingScales(payload: EnterpriseAssessmentPayload) {
  return payload.assessments.map((assessment) => ({
    id: assessment.id,
    name: assessment.title,
    subtitle: assessment.subtitle || assessment.description || "企业专属量表",
    dur: `${assessment.duration} 分钟`,
    total: assessment.questions.length,
    demoTotal: assessment.questions.length,
    scale: "dynamic",
    question: assessment.instructions || "请根据你的实际情况完成以下题目",
    items: assessment.questions.map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options.map((option) => ({ ...option, label: option.text })),
    })),
  }));
}
