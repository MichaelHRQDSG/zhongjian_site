import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import type { SitePageContent } from '@/lib/site-content';
import { tokens } from '@/lib/tokens';

export function BrandIntroPage({
  content,
  homeHref = '/',
  siteName = '心安 EAP',
}: {
  content: SitePageContent;
  homeHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;
  const primaryDark = tokens.primaryDark;

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link href={homeHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回首页
          </Link>
          <div style={{ fontSize: 14, color: '#4A5A78' }}>{siteName} · 品牌介绍</div>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
          borderRadius: 12,
          padding: '40px 36px',
          color: '#fff',
          boxShadow: `0 18px 40px -24px ${primary}88`,
        }}>
          <div style={{ fontSize: 13, letterSpacing: 3, opacity: 0.85, fontWeight: 500, marginBottom: 12 }}>ABOUT</div>
          <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 36, letterSpacing: 2 }}>{content.title}</h1>
          {content.subtitle ? (
            <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.7, opacity: 0.92 }}>{content.subtitle}</p>
          ) : null}
        </div>

        <section style={{ marginTop: 24, background: '#fff', border: '1px solid #E8ECF3', borderRadius: 12, padding: '32px 28px' }}>
          {content.paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`} style={paragraphStyle(index === 0)}>
              {paragraph}
            </p>
          ))}
        </section>
      </main>
    </div>
  );
}

function paragraphStyle(isFirst: boolean): CSSProperties {
  return {
    margin: isFirst ? 0 : '18px 0 0',
    fontSize: 15,
    lineHeight: 1.9,
    color: '#4A5A78',
  };
}
