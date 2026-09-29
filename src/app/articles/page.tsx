import type { Metadata } from 'next';
import { ArticlesIndexPage } from '@/components/articles/ArticlesIndexPage';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await fetchDefaultBranding();
  return {
    title: `心理图文 · ${branding.siteName}`,
    description: '职场压力、情绪调节、人际沟通与自我关怀——EAP 心理图文完整内容。',
  };
}

export default async function ArticlesPage() {
  const branding = await fetchDefaultBranding();
  return <ArticlesIndexPage siteName={branding.siteName} homeHref="/" />;
}
