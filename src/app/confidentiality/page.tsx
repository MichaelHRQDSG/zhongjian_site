import type { Metadata } from 'next';
import {
  LegalDocPage,
  confidentialitySections,
} from '@/components/legal/LegalDocPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `保密协议 · ${branding.siteName}`,
    description: '了解咨询与测评服务的保密原则及例外情形。',
  };
}

export default async function ConfidentialityPage() {
  const branding = await fetchDefaultBranding();
  return (
    <LegalDocPage
      eyebrow="CONFIDENTIALITY"
      title="保密协议"
      description="本平台以保密为服务基础，保障来访者在安全、受尊重的环境中获得心理支持。"
      sections={confidentialitySections()}
      siteName={branding.siteName}
      homeHref="/"
    />
  );
}
