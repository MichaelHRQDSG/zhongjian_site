import type { Metadata } from 'next';
import { BrandIntroPage } from '@/components/about/BrandIntroPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';
import { resolveEnterpriseNav } from '@/lib/enterprise-context';
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

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [branding, content] = await Promise.all([
    fetchDefaultBranding(),
    fetchSitePageContent('brand', FALLBACK_BRAND_CONTENT),
  ]);
  const nav = resolveEnterpriseNav(await searchParams);
  return (
    <BrandIntroPage
      content={content}
      siteName={branding.siteName}
      homeHref={nav.homeHref}
    />
  );
}
