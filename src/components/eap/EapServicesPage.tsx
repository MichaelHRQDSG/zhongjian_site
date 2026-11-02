'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import { tokens } from '@/lib/tokens';

const SERVICES = [
  {
    id: 'assessment',
    icon: 'userCheck' as const,
    title: '心理测评',
    summary: '用专业量表帮助你认识自己',
    points: [
      '提供标准化心理测评量表，覆盖情绪、压力、适应与社会支持等维度',
      '可通过心理测评建立个人心理基线档案',
      '测评结果仅用于个人了解与后续支持建议，不作为人事考核依据',
    ],
  },
  {
    id: 'library',
    icon: 'book' as const,
    title: '心理知识库',
    summary: '图文与音频，疑惑时先来看看',
    points: [
      '提供心理科普图文，帮助理解常见情绪与压力反应',
      '提供冥想、呼吸等疗愈音频，支持自我调节',
      '可在寻求咨询前，先获得基础认知与自助资源',
    ],
  },
  {
    id: 'consultation',
    icon: 'calendar' as const,
    title: '预约咨询',
    summary: '一对一专业陪伴，按需选择咨询师',
    points: [
      '支持预约持证心理咨询师，进行一对一深度交流',
      '覆盖职场压力、情绪疏导、人际关系、家庭沟通等常见议题',
      '可按时间与沟通方式选择合适时段，灵活安排',
    ],
  },
];

const PRIVACY_ITEMS = [
  {
    title: '本平台独立保存',
    desc: '测评与咨询数据由本 EAP 心理咨询平台独立存储与管理，与企业人事系统隔离，不会提供给无关第三方。',
  },
  {
    title: '可随时行使权利',
    desc: '你可以申请导出个人报告。',
  },
];

export default function EapServicesPage({
  homeHref = '/',
  onboardingHref = '/onboarding',
  siteName = '心安 EAP',
  hideConsultation = false,
  hideLibrary = false,
}: {
  homeHref?: string;
  onboardingHref?: string;
  siteName?: string;
  hideConsultation?: boolean;
  hideLibrary?: boolean;
}) {
  const primary = tokens.primary;
  const primaryDark = tokens.primaryDark;
  const accent = tokens.accent;
  const warm = tokens.warm;
  const visibleServices = SERVICES.filter((service) => {
    if (hideConsultation && service.id === 'consultation') return false;
    if (hideLibrary && service.id === 'library') return false;
    return true;
  });
  const serviceCountLabel =
    visibleServices.length === 1 ? '一类' : visibleServices.length === 2 ? '两类' : '三类';
  const pathCopy =
    !hideLibrary && !hideConsultation
      ? '本平台围绕「认识自己 → 自我调节 → 专业陪伴」设计服务路径，你可以根据当下状态选择合适入口。'
      : !hideLibrary && hideConsultation
        ? '本平台围绕「认识自己 → 自我调节」设计服务路径，你可以根据当下状态选择合适入口。'
        : hideLibrary && !hideConsultation
          ? '本平台围绕「认识自己 → 专业陪伴」设计服务路径，你可以根据当下状态选择合适入口。'
          : '本平台以心理测评帮助你认识自己，你可以根据当下状态开始测评。';
  const ctaCopy =
    !hideConsultation
      ? '无论是建立心理基线，还是预约一次倾谈，我们都在这里。'
      : !hideLibrary
        ? '可以从心理测评或知识库开始，我们都在这里。'
        : '可以从心理测评开始，我们都在这里。';

  return (
    <div style={{ background: '#FFFFFF', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif', minHeight: '100vh' }}>
      {/* 顶栏 */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href={homeHref} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: primary, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: `${primary}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={14} />
            </span>
            返回首页
          </Link>
          <div style={{ fontSize: 14, color: '#4A5A78', letterSpacing: 1 }}>{siteName} · 服务介绍</div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(180deg, ${warm} 0%, #FBF7F0 100%)`, padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${primary}20`, padding: '6px 14px', borderRadius: 40, fontSize: 12, color: primary, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
            Employee Assistance Program
          </div>
          <h1 className="eap-page-title" style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 28, fontWeight: 700, color: '#0F2E5F', letterSpacing: 0.5, lineHeight: 1.3 }}>
            了解 EAP 服务
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.75, color: '#4A5A78', maxWidth: 640 }}>
            EAP（员工帮助计划）是面向企业员工的专业心理支持体系。这里没有病人和医生，只有求助者与陪伴者——我们用测评、知识与咨询，陪你走过情绪与压力的每一程。
          </p>
        </div>
      </section>

      {/* 什么是 EAP */}
      <section style={{ padding: '40px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <SectionEyebrow primary={primary}>什么是 EAP</SectionEyebrow>
          <h2 className="eap-section-title" style={headingStyle}>专业、保密、可及的员工心理支持</h2>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <p style={bodyStyle}>
              EAP（Employee Assistance Program，员工帮助计划）是企业为员工提供的系统性心理健康服务。它关注工作压力、情绪困扰、人际沟通、家庭关系等现实议题，帮助员工在追求职业发展的同时，也能照顾好内在状态。
            </p>
            <p style={bodyStyle}>
              与传统「出了问题再就医」不同，EAP 更强调日常陪伴与早期支持：你可以通过心理测评了解自己，通过知识库先做自我调节，也可以在需要时预约一对一咨询。整套服务以尊重与保密为前提。
            </p>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="eap-intro-grid-3">
            {[
              { title: '专业', desc: '持证咨询师与标准化量表，服务流程规范可追溯' },
              { title: '保密', desc: '数据由本 EAP 平台独立保存，不向第三方提供' },
              { title: '可及', desc: '测评、知识、咨询多入口，按需选择即可' },
            ].map((item) => (
              <div key={item.title} style={{ background: '#FBFAF7', border: '1px solid #E8ECF3', borderRadius: 8, padding: '24px 20px' }}>
                <div style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 18, color: primary, fontWeight: 600, letterSpacing: 0.5 }}>{item.title}</div>
                <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.75, color: '#4A5A78' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EAP 包含哪些 */}
      <section style={{ padding: '40px 24px', background: '#FBFAF7' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <SectionEyebrow primary={primary}>EAP 服务包含哪些</SectionEyebrow>
          <h2 className="eap-section-title" style={headingStyle}>{`${serviceCountLabel}核心服务，覆盖从自助到求助`}</h2>
          <p style={{ ...bodyStyle, marginTop: 10, marginBottom: 20 }}>
            {pathCopy}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {visibleServices.map((service, index) => (
              <article
                key={service.id}
                id={service.id}
                style={{
                  background: '#fff',
                  border: '1px solid #E8ECF3',
                  borderRadius: 8,
                  padding: '28px 28px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={service.icon} size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: primary, letterSpacing: 1, fontWeight: 600 }}>0{index + 1}</span>
                      <h3 style={{ margin: 0, fontSize: 18, fontFamily: '"Noto Serif SC", serif', color: '#0F2E5F', letterSpacing: 0.5 }}>{service.title}</h3>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 14, color: '#4A5A78' }}>{service.summary}</p>
                    <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {service.points.map((point) => (
                        <li key={point} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.75, color: '#1A2846' }}>
                          <span style={{ color: primary, marginTop: 2, flexShrink: 0 }}>
                            <Icon name="check" size={16} />
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 隐私保护 */}
      <section style={{ padding: '40px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <SectionEyebrow primary={primary}>隐私与信息保护</SectionEyebrow>
          <h2 className="eap-section-title" style={headingStyle}>你的信息会被怎样保护？</h2>
          <p style={{ ...bodyStyle, marginTop: 10 }}>
            我们承诺：EAP 服务以保密为第一原则。个人求助不应成为顾虑，更不应影响你的职业发展。
          </p>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="eap-intro-grid-2">
            {PRIVACY_ITEMS.map((item) => (
              <div key={item.title} style={{ border: '1px solid #E8ECF3', borderRadius: 8, padding: '24px 22px', background: '#FBFAF7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: primary, marginBottom: 12 }}>
                  <Icon name="shield" size={18} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F2E5F' }}>{item.title}</h3>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#4A5A78' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '36px 24px 48px', background: warm }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="eap-section-title" style={{ ...headingStyle, textAlign: 'center' }}>准备好了，可以从这里开始</h2>
          <p style={{ ...bodyStyle, marginTop: 10, textAlign: 'center' }}>
            {ctaCopy}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <Link
              href={onboardingHref}
              style={{
                background: primary, color: '#fff', padding: '14px 28px', borderRadius: 4,
                fontSize: 15, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              开始心理测评 <Icon name="arrow" size={16} />
            </Link>
            {!hideConsultation && (
            <Link
              href={`${homeHref}#consultation`}
              style={{
                background: '#fff', color: primary, border: `1.5px solid ${primary}`, padding: '14px 28px', borderRadius: 4,
                fontSize: 15, fontWeight: 500, textDecoration: 'none',
              }}
            >
              预约心理咨询
            </Link>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .eap-page-title {
            font-size: 22px !important;
            letter-spacing: 0 !important;
          }
          .eap-section-title {
            font-size: 18px !important;
            letter-spacing: 0 !important;
          }
          .eap-intro-grid-3,
          .eap-intro-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function SectionEyebrow({ primary, children }: { primary: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: primary, letterSpacing: 1, marginBottom: 8, fontWeight: 500 }}>
      {children}
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: '"Noto Serif SC", serif',
  fontSize: 24,
  fontWeight: 700,
  color: '#0F2E5F',
  letterSpacing: 0.5,
  lineHeight: 1.35,
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.75,
  color: '#4A5A78',
};
