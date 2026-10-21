import type { CSSProperties, ReactNode } from 'react';

/** 底部备案信息：版权 + ICP + 公网安备（含警徽） */
export const SITE_OPERATOR = '上海连心心理咨询有限公司';
export const SITE_ICP_NO = '沪ICP备2022028778号';
export const SITE_GONGAN_NO = '沪公网安备31011002006015号';
export const SITE_ICP_HREF = 'https://beian.miit.gov.cn/';
/** 与官网页脚示例一致：#/query/webSearch?code=备案数字号，进入后自动填入 */
export const SITE_GONGAN_CODE = '31011002006015';
export const SITE_GONGAN_HREF = `https://beian.mps.gov.cn/#/query/webSearch?code=${SITE_GONGAN_CODE}`;

type SiteBeianProps = {
  /** 额外行（如电话），显示在版权上方 */
  extra?: ReactNode;
  className?: string;
  style?: CSSProperties;
  opacity?: number;
};

export function SiteBeian({
  extra,
  className = '',
  style,
  opacity = 0.55,
}: SiteBeianProps) {
  const linkStyle: CSSProperties = {
    color: 'inherit',
    textDecoration: 'none',
  };

  return (
    <div
      className={`gxa-site-beian ${className}`.trim()}
      style={{
        textAlign: 'center',
        fontSize: 12,
        opacity,
        lineHeight: 1.8,
        wordBreak: 'break-word',
        ...style,
      }}
    >
      {extra ? <div className="gxa-site-beian-extra">{extra}</div> : null}
      <div className="gxa-site-beian-copy">© 2026 {SITE_OPERATOR} 版权所有</div>
      <div
        className="gxa-site-beian-rows"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px 18px',
          marginTop: 4,
        }}
      >
        <a href={SITE_ICP_HREF} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {SITE_ICP_NO}
        </a>
        <a
          href={SITE_GONGAN_HREF}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...linkStyle,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/beian-gongan.png"
            alt=""
            width={16}
            height={16}
            style={{ display: 'inline-block', flexShrink: 0 }}
          />
          <span>{SITE_GONGAN_NO}</span>
        </a>
      </div>
    </div>
  );
}
