import type { Metadata } from 'next';
import { ArticlesIndexPage } from '@/components/articles/ArticlesIndexPage';
import { ARTICLES, articlesFromApi } from '@/lib/articles';
import { fetchDefaultBranding, fetchEnterpriseAssessments, fetchPublicArticles } from '@/lib/enterprise-assessments';
import { resolveEnterpriseNav } from '@/lib/enterprise-context';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const nav = resolveEnterpriseNav(await searchParams);
  const branding = nav.enterpriseSlug
    ? (await fetchEnterpriseAssessments(nav.enterpriseSlug)) || (await fetchDefaultBranding())
    : await fetchDefaultBranding();
  return {
    title: `心理图文 · ${branding.siteName}`,
    description: '职场压力、情绪调节、人际沟通与自我关怀——EAP 心理图文完整内容。',
  };
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nav = resolveEnterpriseNav(params);
  const [branding, articlePayload] = await Promise.all([
    nav.enterpriseSlug
      ? fetchEnterpriseAssessments(nav.enterpriseSlug).then((item) => item || fetchDefaultBranding())
      : fetchDefaultBranding(),
    fetchPublicArticles(nav.enterpriseSlug || undefined),
  ]);
  return (
    <ArticlesIndexPage
      articles={articlesFromApi(articlePayload) ?? ARTICLES}
      siteName={branding.siteName}
      homeHref={nav.homeHref}
      enterpriseSlug={nav.enterpriseSlug}
    />
  );
}
