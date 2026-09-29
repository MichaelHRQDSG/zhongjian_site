'use client';

import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import { ARTICLES, type Article } from '@/lib/articles';
import { tokens } from '@/lib/tokens';

export function ArticlesIndexPage({
  homeHref = '/',
  siteName = '心安 EAP',
}: {
  homeHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link href={homeHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回首页
          </Link>
          <div style={{ fontSize: 14, color: '#4A5A78' }}>{siteName} · 心理图文</div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 13, color: primary, letterSpacing: 3, fontWeight: 500, marginBottom: 12 }}>心理知识库</div>
        <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 36, color: '#0F2E5F', letterSpacing: 2 }}>心理图文</h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.8, color: '#4A5A78', maxWidth: 640 }}>
          围绕职场压力、情绪调节、人际沟通与自我关怀，为你准备可马上读完的实用图文。点击标题即可阅读全文。
        </p>

        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ARTICLES.map((article) => (
            <ArticleCard key={article.slug} article={article} primary={primary} />
          ))}
        </div>
      </main>
    </div>
  );
}

function ArticleCard({ article, primary }: { article: Article; primary: string }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 20,
        background: '#fff',
        border: '1px solid #E8ECF3',
        borderRadius: 8,
        padding: 16,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow .2s, transform .2s',
      }}
      className="article-list-card"
    >
      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 6, overflow: 'hidden', background: '#EEF2F7' }}>
        <img src={article.img} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {article.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, color: primary, background: `${primary}0C`, padding: '2px 8px', borderRadius: 3 }}>{tag}</span>
          ))}
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontFamily: '"Noto Serif SC", serif', color: '#0F2E5F', letterSpacing: 1, lineHeight: 1.4 }}>
          {article.title}
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#4A5A78' }}>{article.excerpt}</p>
        <div style={{ marginTop: 12, fontSize: 12, color: '#8B96A8' }}>{article.duration} · {article.publishedAt}</div>
      </div>
      <style>{`
        .article-list-card:hover {
          box-shadow: 0 10px 28px -16px rgba(15,46,95,.25);
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .article-list-card {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Link>
  );
}
