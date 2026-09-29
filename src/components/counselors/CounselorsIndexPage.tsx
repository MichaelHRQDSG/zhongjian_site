'use client';

import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import type { CounselorProfile } from '@/lib/counselor-profiles';
import { tokens } from '@/lib/tokens';

export function CounselorsIndexPage({
  counselors,
  homeHref = '/',
  contactHref = '/contact',
  siteName = '心安 EAP',
}: {
  counselors: CounselorProfile[];
  homeHref?: string;
  contactHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;
  const primaryDark = tokens.primaryDark;

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Link href={homeHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回首页
          </Link>
          <div style={{ fontSize: 14, color: '#4A5A78' }}>{siteName} · 咨询师团队</div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 13, color: primary, letterSpacing: 3, fontWeight: 500, marginBottom: 12 }}>预约咨询</div>
        <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 36, color: '#0F2E5F', letterSpacing: 2 }}>咨询师团队</h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.85, color: '#4A5A78', maxWidth: 680 }}>
          浏览完整咨询师列表，了解擅长方向与从业背景。选定方向后，可通过「联系助理」完成预约。
        </p>

        <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }} className="counselor-list-grid">
          {counselors.map((c) => (
            <Link
              key={c.slug}
              href={`/counselors/${c.slug}`}
              style={{
                display: 'flex', gap: 18, alignItems: 'center',
                background: '#fff', border: '1px solid #E8ECF3', borderRadius: 8,
                padding: 22, textDecoration: 'none', color: 'inherit',
                transition: 'box-shadow .2s, transform .2s',
              }}
              className="counselor-list-card"
            >
              {c.avatarUrl ? (
                <img src={c.avatarUrl} alt={c.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: `0 8px 18px -10px ${primary}80` }} />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontFamily: '"Noto Serif SC", serif', fontWeight: 600,
                }}>{c.name.charAt(0)}</div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>{c.name}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#4A5A78' }}>{c.title}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {c.tags.map((t) => (
                    <span key={t} style={{ fontSize: 11, color: '#4A5A78', border: '1px solid #E0E4EC', padding: '2px 8px', borderRadius: 3 }}>{t}</span>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: '#8B96A8' }}>执业 {c.years} · {c.cases} {c.casesUnit || '案例'}</div>
              </div>
              <div style={{ color: primary, flexShrink: 0, fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                简介 <Icon name="arrow" size={14} />
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href={contactHref} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: primary, color: '#fff', padding: '14px 28px', borderRadius: 4,
            textDecoration: 'none', fontSize: 15, fontWeight: 500,
          }}>
            联系助理预约 <Icon name="arrow" size={16} />
          </Link>
        </div>
      </main>

      <style>{`
        .counselor-list-card:hover {
          box-shadow: 0 12px 28px -16px rgba(15,46,95,.28);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .counselor-list-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
