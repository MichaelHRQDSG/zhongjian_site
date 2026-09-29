'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import type { CounselorProfile } from '@/lib/counselor-profiles';
import { tokens } from '@/lib/tokens';

export function CounselorDetailPage({
  counselor,
  homeHref = '/',
  listHref = '/counselors',
  contactHref = '/contact',
  siteName = '心安 EAP',
}: {
  counselor: CounselorProfile;
  homeHref?: string;
  listHref?: string;
  contactHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;
  const primaryDark = tokens.primaryDark;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link href={listHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回咨询师列表
          </Link>
          <Link href={homeHref} style={{ fontSize: 13, color: '#4A5A78', textDecoration: 'none' }}>{siteName} 首页</Link>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {counselor.avatarUrl ? (
            <img src={counselor.avatarUrl} alt={counselor.name} style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', boxShadow: `0 12px 28px -14px ${primary}90` }} />
          ) : (
            <div style={{
              width: 112, height: 112, borderRadius: '50%',
              background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontFamily: '"Noto Serif SC", serif', fontWeight: 600,
              boxShadow: `0 12px 28px -14px ${primary}90`,
            }}>{counselor.name.charAt(0)}</div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontFamily: '"Noto Serif SC", serif', color: '#0F2E5F', letterSpacing: 1 }}>{counselor.name}</h1>
            <div style={{ marginTop: 8, fontSize: 15, color: '#4A5A78' }}>{counselor.title}</div>
            {counselor.education && (
              <div style={{ marginTop: 6, fontSize: 13, color: '#8B96A8' }}>{counselor.education}</div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {counselor.tags.map((t) => (
                <span key={t} style={{ fontSize: 12, color: primary, background: `${primary}0C`, padding: '3px 10px', borderRadius: 3 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28, display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 13, color: '#4A5A78', paddingBottom: 28, borderBottom: '1px solid #E8ECF3' }}>
          <span>执业 {counselor.years}</span>
          <span>{counselor.cases} {counselor.casesUnit || '案例'}</span>
          {counselor.languages?.length ? <span>语言 {counselor.languages.join(' / ')}</span> : null}
        </div>

        <section style={{ marginTop: 32 }}>
          <h2 style={h2Style}>咨询取向</h2>
          <p style={pStyle}>{counselor.approach}</p>
        </section>

        <section style={{ marginTop: 28 }}>
          <h2 style={h2Style}>个人介绍</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {counselor.bio.map((para, i) => (
              <p key={i} style={pStyle}>{para}</p>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={contactHref} style={{
            background: primary, color: '#fff', padding: '14px 26px', borderRadius: 4,
            textDecoration: 'none', fontSize: 15, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            联系助理预约 <Icon name="arrow" size={16} />
          </Link>
          <Link href={listHref} style={{
            background: '#fff', color: primary, border: `1.5px solid ${primary}`,
            padding: '14px 26px', borderRadius: 4, textDecoration: 'none', fontSize: 15, fontWeight: 500,
          }}>
            查看更多咨询师
          </Link>
        </div>
      </main>
    </div>
  );
}

const h2Style: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 18,
  fontFamily: '"Noto Serif SC", serif',
  color: '#0F2E5F',
  letterSpacing: 1,
};

const pStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.9,
  color: '#4A5A78',
};
