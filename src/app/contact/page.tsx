import type { Metadata } from 'next';
import { ContactAssistantPage } from '@/components/contact/ContactAssistantPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';
import { FALLBACK_CONTACT_INTRO, fetchSitePageContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [branding, intro] = await Promise.all([
    fetchDefaultBranding(),
    fetchSitePageContent('contact', FALLBACK_CONTACT_INTRO),
  ]);
  return {
    title: `${intro.title} · ${branding.siteName}`,
    description: intro.subtitle || intro.paragraphs[0] || '咨询中心地址、助理微信与联系电话。',
  };
}

export default async function ContactPage() {
  const [branding, intro] = await Promise.all([
    fetchDefaultBranding(),
    fetchSitePageContent('contact', FALLBACK_CONTACT_INTRO),
  ]);
  return (
    <ContactAssistantPage
      siteName={branding.siteName}
      homeHref="/"
      intro={intro}
    />
  );
}
