import { notFound } from "next/navigation";

import OnboardingAssessment from "@/components/onboarding/OnboardingAssessment";
import {
  fetchEnterpriseAssessments,
  getBrowserAssessmentApiBaseUrl,
  toOnboardingScales,
} from "@/lib/enterprise-assessments";

export default async function EnterpriseOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await fetchEnterpriseAssessments(slug);
  if (!payload) notFound();
  if (payload.loginRequired && !payload.authenticated) {
    return null;
  }
  if (payload.assessments.length === 0) notFound();

  return (
    <OnboardingAssessment
      companyName={payload.companyName}
      siteName={payload.siteName}
      logoUrl={payload.logoUrl}
      slogan={payload.slogan}
      homeHref={`/${slug}`}
      slug={slug}
      // 同源空串 → 浏览器打 /api/...，由 Next rewrite 到本机 backend（勿注 127.0.0.1）
      apiBaseUrl={getBrowserAssessmentApiBaseUrl()}
      scales={toOnboardingScales(payload)}
      employeeInfoFields={payload.employeeInfoFields}
      customEmployeeInfoFields={payload.customEmployeeInfoFields}
    />
  );
}
