import DesignV1 from '@/components/home/DesignV1';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';
import { getCounselorsForHome } from '@/lib/counselors';
import type { Metadata } from 'next';

// 运行时读取 USE_REAL_COUNSELORS，避免改环境变量后仍吃构建期静态快照
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `${branding.siteName} · ${branding.companyName}`,
    description: branding.slogan,
  };
}

export default async function HomePage() {
  const [branding, counselors] = await Promise.all([
    fetchDefaultBranding(),
    getCounselorsForHome(),
  ]);

  return (
    <DesignV1
      branding={branding}
      counselors={counselors.items}
      homeHref="/"
      onboardingHref="/onboarding"
      tweaks={{
        primary: '#1E4C9A',
        primaryDark: '#0F2E5F',
        accent: '#C8161D',
        warm: '#F5EFE6',
      }}
    />
  );
}
