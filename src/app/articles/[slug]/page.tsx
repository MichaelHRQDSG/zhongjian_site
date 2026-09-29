import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleDetailPage } from '@/components/articles/ArticleDetailPage';
import { ARTICLES, getArticleBySlug, getAllArticleSlugs } from '@/lib/articles';
import { fetchDefaultBranding } from '@/lib/enterprise-assessments';

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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const branding = await fetchDefaultBranding();
  const related = ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <ArticleDetailPage
      article={article}
      related={related}
      siteName={branding.siteName}
      homeHref="/"
    />
  );
}
