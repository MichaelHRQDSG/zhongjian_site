import type { Metadata } from 'next';
import { CounselorsIndexPage } from '@/components/counselors/CounselorsIndexPage';
import { getCounselorProfilesForList } from '@/lib/counselor-profiles';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `咨询师团队 · ${branding.siteName}`,
    description: '查看完整咨询师列表与擅长方向，联系助理完成预约。',
  };
}

export default async function CounselorsPage() {
  const [branding, counselors] = await Promise.all([
    fetchDefaultBranding(),
    getCounselorProfilesForList(),
  ]);
  return (
    <CounselorsIndexPage
      counselors={counselors}
      siteName={branding.siteName}
      homeHref="/"
      contactHref="/contact"
    />
  );
}
