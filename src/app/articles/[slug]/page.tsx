import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleDetailPage } from '@/components/articles/ArticleDetailPage';
import { ARTICLES, getArticleBySlug, getAllArticleSlugs } from '@/lib/articles';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';
import { resolveEnterpriseNav } from '@/lib/enterprise-context';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
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
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const branding = await fetchDefaultBranding();
  const related = ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);
  const nav = resolveEnterpriseNav(await searchParams);

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
