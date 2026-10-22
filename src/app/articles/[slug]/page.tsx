import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleDetailPage } from '@/components/articles/ArticleDetailPage';
import { ARTICLES, articlesFromApi, getAllArticleSlugs } from '@/lib/articles';
import { fetchDefaultBranding, fetchEnterpriseAssessments, fetchPublicArticles } from '@/lib/enterprise-assessments';
import { resolveEnterpriseNav } from '@/lib/enterprise-context';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

async function loadArticlePage(slug: string, searchParams: Record<string, string | string[] | undefined>) {
  const nav = resolveEnterpriseNav(searchParams);
  const [branding, articlePayload] = await Promise.all([
    nav.enterpriseSlug
      ? fetchEnterpriseAssessments(nav.enterpriseSlug).then((item) => item || fetchDefaultBranding())
      : fetchDefaultBranding(),
    fetchPublicArticles(nav.enterpriseSlug || undefined),
  ]);
  const articles = articlesFromApi(articlePayload) ?? ARTICLES;
  const article = articles.find((item) => item.slug === slug);
  return { nav, branding, articles, article };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await loadArticlePage(slug, await searchParams);
  if (!article) return {};
  return {
    title: `${article.title} · 心理图文`,
    description: article.excerpt,
  };
}

export default async function ArticleSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { nav, branding, articles, article } = await loadArticlePage(slug, await searchParams);
  if (!article) notFound();

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <ArticleDetailPage
      article={article}
      related={related}
      siteName={branding.siteName}
      homeHref={nav.homeHref}
      listHref={nav.link('/articles')}
      enterpriseSlug={nav.enterpriseSlug}
    />
  );
}
