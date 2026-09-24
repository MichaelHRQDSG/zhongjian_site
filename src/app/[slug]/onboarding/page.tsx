import { notFound } from "next/navigation";

import OnboardingAssessment from "@/components/onboarding/OnboardingAssessment";
import {
  fetchEnterpriseAssessments,
  toOnboardingScales,
} from "@/lib/enterprise-assessments";

export default async function EnterpriseOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await fetchEnterpriseAssessments(slug);
  if (!payload || payload.assessments.length === 0) notFound();

  return (
    <OnboardingAssessment
      companyName={payload.companyName}
      siteName={payload.siteName}
      logoUrl={payload.logoUrl}
      slogan={payload.slogan}
      homeHref={`/${slug}`}
      scales={toOnboardingScales(payload)}
    />
  );
}
