import type { Metadata } from 'next';
import { ContactAssistantPage } from '@/components/contact/ContactAssistantPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `联系助理 · ${branding.siteName}`,
    description: '咨询中心地址、助理微信二维码与联系电话，预约咨询请联系助理。',
  };
}

export default async function ContactPage() {
  const branding = await fetchDefaultBranding();
  return <ContactAssistantPage siteName={branding.siteName} homeHref="/" />;
}
