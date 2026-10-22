import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CounselorsIndexPage } from '@/components/counselors/CounselorsIndexPage';
import { getCounselorProfilesForList } from '@/lib/counselor-profiles';
import { fetchDefaultBranding, fetchEnterpriseAssessments } from '@/lib/enterprise-assessments';
import { resolveEnterpriseNav } from '@/lib/enterprise-context';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `咨询师团队 · ${branding.siteName}`,
    description: '查看完整咨询师列表与擅长方向，联系助理完成预约。',
  };
}

export default async function CounselorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [branding, counselors] = await Promise.all([
    fetchDefaultBranding(),
    getCounselorProfilesForList(),
  ]);
  const nav = resolveEnterpriseNav(await searchParams);
  if (nav.enterpriseSlug) {
    const enterprise = await fetchEnterpriseAssessments(nav.enterpriseSlug);
    if (enterprise?.hideConsultation) redirect(nav.homeHref);
  }
  return (
    <CounselorsIndexPage
      counselors={counselors}
      siteName={branding.siteName}
      homeHref={nav.homeHref}
      contactHref={nav.link('/contact')}
      enterpriseSlug={nav.enterpriseSlug}
    />
  );
}
