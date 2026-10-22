import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CounselorDetailPage } from '@/components/counselors/CounselorDetailPage';
import { getCounselorBySlug, getMockCounselorProfiles } from '@/lib/counselor-profiles';
import { fetchDefaultBranding, fetchEnterpriseAssessments } from '@/lib/enterprise-assessments';
import { resolveEnterpriseNav } from '@/lib/enterprise-context';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return getMockCounselorProfiles().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const counselor = await getCounselorBySlug(slug);
  if (!counselor) return {};
  return {
    title: `${counselor.name} · 咨询师介绍`,
    description: counselor.approach,
  };
}

export default async function CounselorSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const [counselor, branding] = await Promise.all([
    getCounselorBySlug(slug),
    fetchDefaultBranding(),
  ]);
  if (!counselor) notFound();
  const nav = resolveEnterpriseNav(await searchParams);
  if (nav.enterpriseSlug) {
    const enterprise = await fetchEnterpriseAssessments(nav.enterpriseSlug);
    if (enterprise?.hideConsultation) redirect(nav.homeHref);
  }

  return (
    <CounselorDetailPage
      counselor={counselor}
      siteName={branding.siteName}
      homeHref={nav.homeHref}
      listHref={nav.link('/counselors')}
      contactHref={nav.link('/contact')}
    />
  );
}
