import type { Metadata } from 'next';
import { BrandIntroPage } from '@/components/about/BrandIntroPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';
import { FALLBACK_BRAND_CONTENT, fetchSitePageContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [branding, content] = await Promise.all([
    fetchDefaultBranding(),
    fetchSitePageContent('brand', FALLBACK_BRAND_CONTENT),
  ]);
  return {
    title: `${content.title} · ${branding.siteName}`,
    description: content.subtitle || content.paragraphs[0] || '品牌介绍',
  };
}

export default async function AboutPage() {
  const [branding, content] = await Promise.all([
    fetchDefaultBranding(),
    fetchSitePageContent('brand', FALLBACK_BRAND_CONTENT),
  ]);
  return (
    <BrandIntroPage
      content={content}
      siteName={branding.siteName}
      homeHref="/"
    />
  );
}
