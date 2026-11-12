'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import type { Article } from '@/lib/articles';
import { withEnterpriseQuery } from '@/lib/enterprise-context';
import { trackEnterpriseLearning } from '@/lib/enterprise-learning';
import { tokens } from '@/lib/tokens';

/** 企业站内打开图文时上报一次阅读，离开页面时补报阅读时长（不足 5 秒后台忽略）。 */
function useArticleLearningTracker(enterpriseSlug: string, article: Article) {
  useEffect(() => {
    if (!enterpriseSlug) return;
    const base = { contentType: 'article' as const, contentId: article.slug, contentTitle: article.title };
    const startedAt = Date.now();
    let reported = false;
    trackEnterpriseLearning(enterpriseSlug, { ...base, action: 'view' });
    const reportReading = () => {
      if (reported) return;
      reported = true;
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds >= 5) {
        trackEnterpriseLearning(enterpriseSlug, { ...base, action: 'read', durationSec: seconds });
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') reportReading();
    };
    window.addEventListener('pagehide', reportReading);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', reportReading);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reportReading();
    };
  }, [enterpriseSlug, article.slug, article.title]);
}

export function ArticleDetailPage({
  article,
  related = [],
  homeHref = '/',
  listHref = '/articles',
  siteName = '心安 EAP',
  enterpriseSlug = '',
}: {
  article: Article;
  related?: Article[];
  homeHref?: string;
  listHref?: string;
  siteName?: string;
  enterpriseSlug?: string;
}) {
  const primary = tokens.primary;
  useArticleLearningTracker(enterpriseSlug, article);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link href={listHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回图文列表
          </Link>
          <Link href={homeHref} style={{ fontSize: 13, color: '#4A5A78', textDecoration: 'none' }}>{siteName} 首页</Link>
        </div>
      </header>

      <article style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 72px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {article.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 12, color: primary, background: `${primary}0C`, padding: '3px 10px', borderRadius: 3 }}>{tag}</span>
          ))}
        </div>
        <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 34, lineHeight: 1.35, color: '#0F2E5F', letterSpacing: 1 }}>
          {article.title}
        </h1>
        <div style={{ marginTop: 14, fontSize: 13, color: '#8B96A8' }}>
          {article.author} · {article.publishedAt} · {article.duration}
        </div>

        <div style={{ marginTop: 28, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: '#EEF2F7' }}>
          <img src={article.img} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {article.content.map((paragraph, index) => (
            <p key={index} style={{ margin: 0, fontSize: 16, lineHeight: 2, color: '#1A2846' }}>
              {paragraph}
            </p>
          ))}
        </div>

        <div style={{
          marginTop: 40,
          padding: '20px 22px',
          background: '#FBFAF7',
          border: '1px solid #E8ECF3',
          borderLeft: `4px solid ${primary}`,
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1.8,
          color: '#4A5A78',
        }}>
          如果你正在经历类似困扰，不必独自硬扛。可返回首页预约咨询。
        </div>

        {related.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: '"Noto Serif SC", serif', color: '#0F2E5F', letterSpacing: 1 }}>相关阅读</h2>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={withEnterpriseQuery(`/articles/${item.slug}`, enterpriseSlug)}
                  style={{
                    display: 'block',
                    padding: '14px 16px',
                    borderRadius: 6,
                    border: '1px solid #E8ECF3',
                    textDecoration: 'none',
                    color: '#0F2E5F',
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8B96A8', fontWeight: 400 }}>{item.duration}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
