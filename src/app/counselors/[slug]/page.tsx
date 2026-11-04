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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nav = resolveEnterpriseNav(await searchParams);
  const counselor = await getCounselorBySlug(slug, nav.enterpriseSlug);
  if (!counselor) return {};
  return {
    title: `${counselor.name} · 咨询师介绍`,
    description: counselor.introduce,
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
  const nav = resolveEnterpriseNav(await searchParams);
  const [counselor, defaultBranding, enterprise] = await Promise.all([
    getCounselorBySlug(slug, nav.enterpriseSlug),
    fetchDefaultBranding(),
    nav.enterpriseSlug ? fetchEnterpriseAssessments(nav.enterpriseSlug) : Promise.resolve(undefined),
  ]);
  if (enterprise?.hideConsultation) redirect(nav.homeHref);
  if (!counselor) notFound();
  const branding = enterprise || defaultBranding;

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
