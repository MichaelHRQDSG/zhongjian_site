import type { Metadata } from 'next';
import {
  LegalDocPage,
  privacySections,
} from '@/components/legal/LegalDocPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `隐私保护政策 · ${branding.siteName}`,
    description: '了解我们如何收集、使用与保护您的个人信息。',
  };
}

export default async function PrivacyPage() {
  const branding = await fetchDefaultBranding();
  return (
    <LegalDocPage
      eyebrow="PRIVACY"
      title="隐私保护政策"
      description="我们重视每一位来访者的信息安全，并以最小化、必要化为原则处理相关数据。"
      sections={privacySections()}
      siteName={branding.siteName}
      homeHref="/"
    />
  );
}
