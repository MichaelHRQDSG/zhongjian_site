import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/data';
import { ASSISTANT_CONTACT, CONTACT_CENTERS } from '@/lib/contact-info';
import { tokens } from '@/lib/tokens';

export function ContactAssistantPage({
  homeHref = '/',
  siteName = '心安 EAP',
}: {
  homeHref?: string;
  siteName?: string;
}) {
  const primary = tokens.primary;
  const primaryDark = tokens.primaryDark;
  const warm = tokens.warm;
  const assistant = ASSISTANT_CONTACT;

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
          <div style={{ fontSize: 14, color: '#4A5A78' }}>{siteName} · 联系助理</div>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 13, color: primary, letterSpacing: 3, fontWeight: 500, marginBottom: 12 }}>CONTACT</div>
        <h1 style={{ margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 36, color: '#0F2E5F', letterSpacing: 2 }}>联系助理</h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.85, color: '#4A5A78', maxWidth: 640 }}>
          预约咨询、改期与疑问，欢迎通过咨询中心地址、助理微信或电话与我们取得联系。
          我们会在工作时间内尽快回复您。
        </p>

        {/* 咨询中心 */}
        <section style={{ marginTop: 40, background: '#fff', border: '1px solid #E8ECF3', borderRadius: 8, padding: '28px 28px 24px' }}>
          <h2 style={sectionTitleStyle}>咨询中心地址</h2>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CONTACT_CENTERS.map((center) => (
              <div key={center.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${primary}10`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="building" size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0F2E5F' }}>{center.name}</div>
                  <div style={{ marginTop: 4, fontSize: 14, color: '#4A5A78', lineHeight: 1.7 }}>{center.address}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 二维码 + 电话 */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }} className="contact-grid">
          <section style={{ background: '#fff', border: '1px solid #E8ECF3', borderRadius: 8, padding: 28, textAlign: 'center' }}>
            <h2 style={{ ...sectionTitleStyle, textAlign: 'center' }}>助理微信二维码</h2>
            <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.7, color: '#4A5A78' }}>{assistant.hint}</p>
            <div style={{ margin: '22px auto 0', width: 220, height: 220, borderRadius: 8, overflow: 'hidden', border: '1px solid #E8ECF3', background: '#FBFAF7' }}>
              <img src={assistant.qrcodeSrc} alt="咨询助理微信二维码" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: '#8B96A8' }}>长按或扫码添加助理微信</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#4A5A78' }}>{assistant.workHours}</div>
          </section>

          <section style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
            borderRadius: 8, padding: 28, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>助理联系电话</h2>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>{assistant.name}</div>
            <a href={`tel:${assistant.phoneDial}`} style={{ marginTop: 28, fontSize: 32, fontWeight: 700, fontFamily: '"Noto Serif SC", serif', color: '#fff', textDecoration: 'none', letterSpacing: 1 }}>
              {assistant.phone}
            </a>
            <a
              href={`tel:${assistant.phoneDial}`}
              style={{
                marginTop: 24, alignSelf: 'flex-start',
                background: '#fff', color: primary, textDecoration: 'none',
                padding: '12px 20px', borderRadius: 4, fontSize: 14, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              <Icon name="phone" size={16} /> 点击拨打
            </a>
            <div style={{ marginTop: 20, fontSize: 12, opacity: 0.8, lineHeight: 1.7 }}>{assistant.workHours}</div>
          </section>
        </div>

        <div style={{ marginTop: 28, padding: '18px 20px', background: warm, borderRadius: 8, fontSize: 13, color: '#4A5A78', lineHeight: 1.8 }}>
          预约流程提示：了解咨询过程 → 填写预约表单 → 助理推送预约订单。如有疑问，优先添加助理微信沟通更高效。
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontFamily: '"Noto Serif SC", serif',
  color: '#0F2E5F',
  letterSpacing: 1,
};
