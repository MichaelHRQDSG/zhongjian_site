import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import { tokens } from '@/lib/tokens';

export function LegalDocPage({
  eyebrow,
  title,
  description,
  sections,
  homeHref = '/',
  siteName = '心安 EAP',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  homeHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;

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
          <div style={{ fontSize: 14, color: '#4A5A78' }}>{siteName} · {title}</div>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 13, color: primary, letterSpacing: 3, fontWeight: 500, marginBottom: 12 }}>{eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 36, color: '#0F2E5F', letterSpacing: 2 }}>{title}</h1>
        {description ? (
          <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.85, color: '#4A5A78', maxWidth: 640 }}>{description}</p>
        ) : null}

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map((section) => (
            <section key={section.heading} style={{ background: '#fff', border: '1px solid #E8ECF3', borderRadius: 10, padding: '24px 26px' }}>
              <h2 style={headingStyle}>{section.heading}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.heading}-${index}`} style={paragraphStyle(index === 0)}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontFamily: '"Noto Serif SC", serif',
  color: '#0F2E5F',
  letterSpacing: 1,
};

function paragraphStyle(isFirst: boolean): CSSProperties {
  return {
    margin: isFirst ? '14px 0 0' : '12px 0 0',
    fontSize: 14,
    lineHeight: 1.85,
    color: '#4A5A78',
  };
}

export function privacySections() {
  return [
    {
      heading: '信息收集与用途',
      paragraphs: [
        '我们仅在提供心理测评、预约咨询与相关服务所必需的范围内收集个人信息。',
        '收集的信息用于完成预约、服务通知、质量改进与安全保障，不会用于与服务无关的用途。',
      ],
    },
    {
      heading: '信息存储与访问',
      paragraphs: [
        '个人信息不进入企业人事档案；数据由本平台独立保存与管理。',
        '仅经授权的专业服务人员可在履职所需范围内访问相关信息。',
      ],
    },
    {
      heading: '您的权利',
      paragraphs: [
        '您可依法查询、更正与您相关的个人信息，或在符合法规与服务约定的前提下申请删除。',
        '如有隐私相关问题，可通过「联系我们」与咨询助理沟通。',
      ],
    },
  ];
}

export function confidentialitySections() {
  return [
    {
      heading: '保密原则',
      paragraphs: [
        '咨询与测评内容以保密为第一原则。未经您的授权，服务人员不会向第三方透露会谈或测评细节。',
        '一切个人求助记录不进入人事档案，不影响录用、晋升与日常考核。',
      ],
    },
    {
      heading: '保密例外',
      paragraphs: [
        '在法律法规要求，或存在伤害自己/他人的紧急风险等专业伦理规定情形下，服务人员可能采取必要保护措施，并可能依法向相关方披露有限信息。',
        '除上述情形外，我们会尽力在保护安全的同时尊重您的知情与选择。',
      ],
    },
    {
      heading: '数据与协作',
      paragraphs: [
        '用于趋势分析的统计数据会做脱敏处理，不以可识别个人的方式对外提供。',
        '如需向指定咨询师分享测评结果，须另行获得您的明确授权。',
      ],
    },
  ];
}
