import { notFound } from "next/navigation";
import type { Metadata } from "next";

import DesignV1 from "@/components/home/DesignV1";
import { fetchEnterpriseAssessments } from "@/lib/enterprise-assessments";
import { getCounselorsForHome } from "@/lib/counselors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const branding = await fetchEnterpriseAssessments(slug);
  return branding
    ? { title: `${branding.siteName} · ${branding.companyName}`, description: branding.slogan }
    : {};
}

export default async function EnterpriseHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [branding, counselors] = await Promise.all([
    fetchEnterpriseAssessments(slug),
    getCounselorsForHome(),
  ]);
  if (!branding) notFound();

  return (
    <DesignV1
      branding={branding}
      counselors={counselors.items}
      homeHref={`/${slug}`}
      onboardingHref={`/${slug}/onboarding`}
    />
  );
}
