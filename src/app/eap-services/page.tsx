import type { Metadata } from 'next';
import EapServicesPage from '@/components/eap/EapServicesPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `了解 EAP 服务 · ${branding.siteName}`,
    description: '了解什么是 EAP、服务包含哪些内容，以及员工信息与隐私如何受到保护。',
  };
}

export default async function EapServicesRoutePage() {
  const branding = await fetchDefaultBranding();
  return (
    <EapServicesPage
      siteName={branding.siteName}
      homeHref="/"
      onboardingHref="/onboarding"
    />
  );
}
