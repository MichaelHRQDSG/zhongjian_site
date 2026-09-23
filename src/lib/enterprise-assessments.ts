export interface EnterpriseAssessmentPayload {
  companyName: string;
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
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function fetchEnterpriseAssessments(slug: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/web/assessment-enterprises/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return undefined;
  return response.json() as Promise<EnterpriseAssessmentPayload>;
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
