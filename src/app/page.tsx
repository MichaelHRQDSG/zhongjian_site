import DesignV1 from '@/components/home/DesignV1';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `${branding.siteName} · ${branding.companyName}`,
    description: branding.slogan,
  };
}

export default async function HomePage() {
  const branding = await fetchDefaultBranding();
  return (
    <DesignV1
      branding={branding}
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
