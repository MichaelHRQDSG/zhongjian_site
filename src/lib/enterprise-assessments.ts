import { resolveApiBaseUrl } from "@/lib/backend-env";

export interface SiteHeroSlide {
  imageUrl: string;
  title: string;
  desc: string;
}

export interface SiteBranding {
  companyName: string;
  siteName: string;
  logoUrl: string;
  slogan: string;
  /** EAP 首页心理测评入口文案（导航 + 主按钮） */
  onboardingEntryLabel: string;
  /** EAP 首页右侧三张轮播 */
  heroSlides: SiteHeroSlide[];
  /** 仅定制化企业：为 true 时隐藏预约心理咨询及相关图片 */
  hideConsultation?: boolean;
}

export interface CustomEmployeeInfoField {
  id: string;
  label: string;
}

export interface EnterpriseAssessmentPayload extends SiteBranding {
  slug: string;
  /** 企业链接需展示的员工基本信息字段 ID；未返回时前端按全部字段处理 */
  employeeInfoFields?: string[];
  /** 仅当前企业新增的字段定义，未勾选的不会出现在 employeeInfoFields 里 */
  customEmployeeInfoFields?: CustomEmployeeInfoField[];
  articles?: unknown;
  assessments: Array<{
    id: string;
    version?: number;
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

export interface EnterpriseReportSubmitItem {
  clientSubmissionId: string;
  assessmentId: string;
  assessmentVersion: number;
  answers: Record<string, string>;
}

export interface EnterpriseReportsSubmitPayload {
  visitorKey: string;
  employeeInfo: Record<string, unknown>;
  reports: EnterpriseReportSubmitItem[];
}

/** 与后台默认员工信息模板一致的字段顺序 */
export const DEFAULT_EMPLOYEE_INFO_FIELD_IDS = [
  "empNo",
  "name",
  "gender",
  "age",
  "edu",
  "joinDate",
  "dept",
  "post",
  "category",
  "workLoc",
  "livingStatus",
  "hasFamily",
] as const;

const CUSTOM_EMPLOYEE_INFO_FIELD_ID = /^custom-[a-f0-9]{12}$/;

export function normalizeCustomEmployeeInfoFields(
  value?: Array<{ id?: string; label?: string }> | null,
): CustomEmployeeInfoField[] {
  if (!Array.isArray(value)) return [];
  const result: CustomEmployeeInfoField[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const id = String(raw?.id || "").trim().toLowerCase();
    const label = String(raw?.label || "").trim().slice(0, 40);
    if (!CUSTOM_EMPLOYEE_INFO_FIELD_ID.test(id) || !label || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, label });
    if (result.length >= 20) break;
  }
  return result;
}

export function resolveEmployeeInfoFields(payload?: {
  employeeInfoFields?: string[] | null;
  customEmployeeInfoFields?: Array<{ id?: string; label?: string }> | null;
}) {
  const customIds = normalizeCustomEmployeeInfoFields(payload?.customEmployeeInfoFields).map((field) => field.id);
  const raw = payload?.employeeInfoFields;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_EMPLOYEE_INFO_FIELD_IDS];
  }
  const allowed = new Set<string>([...DEFAULT_EMPLOYEE_INFO_FIELD_IDS, ...customIds]);
  const selected = new Set(
    raw.map((value) => String(value || "").trim()).filter((value) => allowed.has(value)),
  );
  if (selected.size === 0) {
    return [...DEFAULT_EMPLOYEE_INFO_FIELD_IDS];
  }
  return [
    ...DEFAULT_EMPLOYEE_INFO_FIELD_IDS.filter((id) => selected.has(id)),
    ...customIds.filter((id) => selected.has(id)),
  ];
}

const API_BASE_URL = resolveApiBaseUrl({ preferAssessment: true });

const FALLBACK_HERO_SLIDES: SiteHeroSlide[] = [
  {
    imageUrl: "/assets/hero-site.jpg",
    title: "心理测评",
    desc: "专业量表，帮助你更好认识自己",
  },
  {
    imageUrl: "/assets/hero-office.jpg",
    title: "职场支持",
    desc: "关注工作压力与情绪健康",
  },
  {
    imageUrl: "/assets/hero-family.jpg",
    title: "生活与家庭",
    desc: "陪伴你与家人共同成长",
  },
];

const FALLBACK_BRANDING: SiteBranding = {
  siteName: "心安 EAP",
  companyName: "",
  logoUrl: "/static/uploads/eap-default-logo.png",
  slogan: "专业测评，贴心陪伴",
  onboardingEntryLabel: "员工心理测评",
  heroSlides: FALLBACK_HERO_SLIDES,
};

/** 兼容后端 ApiResponseEnvelope：优先取 data，再回退顶层字段 */
function unwrapPayload<T extends object>(raw: unknown): T | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  const nested = obj.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as T;
  }
  return obj as T;
}

function normalizeMediaUrl(url: string | undefined, fallback: string): string {
  const value = (url || "").trim();
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/static/")) {
    return `${API_BASE_URL}${value}`;
  }
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizeLogoUrl(logoUrl: string | undefined): string {
  return normalizeMediaUrl(logoUrl, FALLBACK_BRANDING.logoUrl);
}

function normalizeHeroSlides(raw: unknown): SiteHeroSlide[] {
  const list = Array.isArray(raw) ? raw : [];
  return FALLBACK_HERO_SLIDES.map((fallback, index) => {
    const item = list[index];
    const source = item && typeof item === "object" && !Array.isArray(item)
      ? (item as Partial<SiteHeroSlide>)
      : {};
    return {
      imageUrl: normalizeMediaUrl(source.imageUrl, fallback.imageUrl),
      title: String(source.title || fallback.title).trim() || fallback.title,
      desc: String(source.desc || fallback.desc).trim() || fallback.desc,
    };
  });
}

function normalizeBranding(raw: unknown): SiteBranding {
  const payload = unwrapPayload<Partial<SiteBranding>>(raw) || {};
  return {
    siteName: String(payload.siteName || FALLBACK_BRANDING.siteName).trim() || FALLBACK_BRANDING.siteName,
    // 公司名允许为空，不回填默认企业名
    companyName: String(payload.companyName ?? "").trim(),
    logoUrl: normalizeLogoUrl(payload.logoUrl),
    slogan: String(payload.slogan || FALLBACK_BRANDING.slogan).trim() || FALLBACK_BRANDING.slogan,
    onboardingEntryLabel:
      String(payload.onboardingEntryLabel || FALLBACK_BRANDING.onboardingEntryLabel).trim()
      || FALLBACK_BRANDING.onboardingEntryLabel,
    heroSlides: normalizeHeroSlides(payload.heroSlides),
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
      employeeInfoFields: resolveEmployeeInfoFields(payload),
      customEmployeeInfoFields: normalizeCustomEmployeeInfoFields(payload.customEmployeeInfoFields),
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

/** 读取通用或某企业解析后的心理图文。请求失败返回 null，空列表表示确实没有图文。 */
export async function fetchPublicArticles(slug?: string): Promise<unknown[] | null> {
  try {
    const url = slug
      ? `${API_BASE_URL}/api/web/assessment-enterprises/${encodeURIComponent(slug)}`
      : `${API_BASE_URL}/api/web/assessment-enterprises/default`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = unwrapPayload<{ articles?: unknown }>(await response.json());
    return Array.isArray(payload?.articles) ? payload.articles : null;
  } catch {
    return null;
  }
}

export function toOnboardingScales(payload: EnterpriseAssessmentPayload) {
  return (payload.assessments || []).map((assessment) => {
    const questions = Array.isArray(assessment.questions) ? assessment.questions : [];
    return {
      id: assessment.id,
      version: Number(assessment.version) > 0 ? Number(assessment.version) : 1,
      name: assessment.title || assessment.id,
      subtitle: assessment.subtitle || assessment.description || "企业专属量表",
      dur: `${assessment.duration || 0} 分钟`,
      total: questions.length,
      demoTotal: questions.length,
      scale: "dynamic" as const,
      question: assessment.instructions || "请根据你的实际情况完成以下题目",
      items: questions.map((question) => ({
        id: question.id,
        text: question.text,
        options: (Array.isArray(question.options) ? question.options : []).map((option) => ({
          ...option,
          label: option.text,
        })),
      })),
    };
  });
}

/** 服务端可读的 API 根地址，供页面 props 传给客户端提交。 */
export function getAssessmentApiBaseUrl() {
  return API_BASE_URL;
}

export async function submitEnterpriseOnboardingReports(
  apiBaseUrl: string,
  slug: string,
  body: EnterpriseReportsSubmitPayload,
) {
  const base = (apiBaseUrl || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("未配置测评 API 地址");
  }
  const response = await fetch(
    `${base}/api/web/assessment-enterprises/${encodeURIComponent(slug)}/reports`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    const envelope = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const detail = envelope.msg || envelope.detail || envelope.message || `提交失败（${response.status}）`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return unwrapPayload(raw) || raw;
}
