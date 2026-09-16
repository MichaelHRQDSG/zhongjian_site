// @ts-nocheck
'use client';

import React from 'react';
import {
  EAP_MODULES, STATS, ARTICLES, AUDIOS, COUNSELORS, NAV_ITEMS,
  Icon, CitySkyline,
} from '@/components/shared/data';
import MobileNav from '@/components/layout/MobileNav';
import type { ThemeTweaks } from '@/lib/tokens';

// 方案一：稳重经典 —— 深蓝主导、央企气质
// 特点：顶部深色导航、大幅数据展示、卡片式网格、庄重的排版

const DesignV1 = ({ tweaks }: { tweaks?: ThemeTweaks }) => {
  const primary = tweaks?.primary || '#1E4C9A';
  const primaryDark = tweaks?.primaryDark || '#0F2E5F';
  const accent = tweaks?.accent || '#C8161D';
  const warm = tweaks?.warm || '#F5EFE6';
  const [heroSlide, setHeroSlide] = React.useState(0);
  const heroScenes = [
    { variant: 'site', img: '/assets/hero-site.jpg', title: '一线项目部', desc: '走进工地，倾听建设者的心声' },
    { variant: 'office', img: '/assets/hero-office.jpg', title: '机关办公室', desc: '关注职场人的日常心理健康' },
    { variant: 'family', img: '/assets/hero-family.jpg', title: '幸福小家', desc: '陪伴建设者的家人共同成长' },
  ];

  React.useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#FFFFFF', color: '#1A2846', fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif' }}>

      {/* ==================== 顶部通知条 ==================== */}
      <div style={{ background: primaryDark, color: '#fff', fontSize: 13, padding: '10px 0' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="gxa-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: .9 }}>
            <Icon name="shield" size={14} />
            <span>本平台严格执行保密协议 · 一切咨询记录不进入人事档案</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13 }}>
            <a href="#" style={{ color: '#fff', opacity: .85, textDecoration: 'none' }}>员工登录</a>
            <a href="tel:4008806666" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFC4A0', textDecoration: 'none' }}>
              <Icon name="phone" size={14} />
              <strong>24h 心理热线 400-880-6666</strong>
            </a>
          </div>
        </div>
      </div>

      {/* ==================== 主导航 ==================== */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit' }}>
            <img src="/assets/guangsha-xinan-logo.jpg" alt="广厦心安" style={{ height: 48, width: 48, borderRadius: 6, objectFit: 'cover' }}/>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, color: primary, fontFamily: '"Noto Serif SC", serif' }}>广厦心安</div>
              <div style={{ fontSize: 11, color: '#4A5A78', letterSpacing: 1, marginTop: 2 }}>中建三局员工心理关爱平台</div>
            </div>
          </a>

          <nav className="gxa-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {NAV_ITEMS.map(item => (
              <a key={item.label} href={item.href} style={{
                color: '#1A2846', textDecoration: 'none',
                fontSize: 15, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {item.label}
                {item.badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    background: accent, color: '#fff',
                    padding: '2px 5px', borderRadius: 2,
                  }}>{item.badge}</span>
                )}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="gxa-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{ background: 'transparent', border: '1px solid #D0D6E0', color: '#1A2846', padding: '10px 18px', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}>
                心理测评
              </button>
              <a href="#consultation" style={{ background: primary, border: 'none', color: '#fff', padding: '10px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
                预约咨询
              </a>
            </div>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* ==================== HERO 分屏 ==================== */}
      <section style={{ background: `linear-gradient(180deg, ${warm} 0%, #FBF7F0 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, color: primary }}>
          <CitySkyline color={primary} opacity={0.08} height={120} />
        </div>
        <div className="gxa-hero" style={{ maxWidth: 1360, margin: '0 auto', padding: '90px 40px 110px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80, alignItems: 'center', position: 'relative' }}>
          {/* 左：文案 */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${primary}20`, padding: '8px 16px', borderRadius: 40, fontSize: 13, color: primary, marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }}/>
              中建三局 · EAP 员工帮助计划
            </div>

            <h1 className="gxa-hero-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 62, fontWeight: 700, lineHeight: 1.15, letterSpacing: 2, margin: 0, color: '#0F2E5F' }}>
              建广厦万间
              <br/>
              <span style={{ color: primary }}>护心安一寸</span>
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.9, color: '#4A5A78', marginTop: 32, maxWidth: 520 }}>
              关爱员工身心健康，共建幸福企业。<br/>
              广厦心安为中建三局全体员工提供专业、保密、全天候的心理支持服务，
              让每一位建设者在追求卓越的同时，也能拥有内在的从容与力量。
            </p>

            <div style={{ display: 'flex', gap: 16, marginTop: 44 }}>
              <button style={{ background: primary, color: '#fff', border: 'none', padding: '16px 32px', fontSize: 15, borderRadius: 4, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                预约心理咨询 <Icon name="arrow" size={16} />
              </button>
              <button style={{ background: '#fff', color: primary, border: `1.5px solid ${primary}`, padding: '16px 32px', fontSize: 15, borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                了解 EAP 服务
              </button>
            </div>

            {/* 新员工入职测评横幅 —— NEW */}
            <a href="/onboarding" style={{
              display: 'flex', alignItems: 'center', gap: 20,
              marginTop: 40, padding: '20px 24px',
              background: '#fff',
              border: `1px solid ${primary}20`,
              borderLeft: `4px solid ${primary}`,
              borderRadius: 6,
              textDecoration: 'none',
              boxShadow: '0 8px 24px -12px rgba(15,46,95,.15)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all .3s',
            }} className="onboarding-banner">
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: `${primary}08`,
              }}/>
              <div style={{
                width: 52, height: 52, borderRadius: 8,
                background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, position: 'relative',
              }}>
                <Icon name="userCheck" size={22}/>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    background: accent, color: '#fff',
                    padding: '2px 8px', borderRadius: 3,
                  }}>NEW</span>
                  <span style={{ fontSize: 12, color: primary, letterSpacing: 1, fontWeight: 500 }}>入职测评 · 新功能上线</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>
                  新入职？30 分钟建立你的心理基线档案
                </div>
                <div style={{ fontSize: 13, color: '#4A5A78', marginTop: 4 }}>
                  5 个专业量表 · 结果严格保密 · 可获得个性化成长建议
                </div>
              </div>
              <div style={{ color: primary, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, position: 'relative', flexShrink: 0 }}>
                开始测评 <Icon name="arrow" size={16}/>
              </div>
            </a>

            {/* 信任标记 */}
            <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #E0D5C4', display: 'flex', gap: 40 }}>
              {[
                { icon: 'shield', text: '严格保密' },
                { icon: 'check', text: '专业资质' },
                { icon: 'clock', text: '全天候响应' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4A5A78', fontSize: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primary }}>
                    <Icon name={item.icon} size={18}/>
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* 右：轮播 */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 8, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(15,46,95,.25)' }}>
              {heroScenes.map((scene, i) => (
                <div key={i} style={{
                  position: 'absolute', inset: 0,
                  opacity: heroSlide === i ? 1 : 0,
                  transition: 'opacity 1.2s ease',
                }}>
                  <img
                    src={scene.img}
                    alt={scene.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* 底部说明卡 */}
                  <div style={{
                    position: 'absolute', bottom: 24, left: 24, right: 24,
                    background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(20px)',
                    padding: '18px 22px', borderRadius: 6,
                    borderLeft: `3px solid ${primary}`,
                  }}>
                    <div style={{ fontSize: 13, color: primary, fontWeight: 600, letterSpacing: 1 }}>{scene.title}</div>
                    <div style={{ fontSize: 14, color: '#4A5A78', marginTop: 4 }}>{scene.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 指示器 */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
              {heroScenes.map((_, i) => (
                <button key={i} onClick={() => setHeroSlide(i)} style={{
                  width: heroSlide === i ? 32 : 8, height: 8, borderRadius: 4,
                  background: heroSlide === i ? primary : '#D0D6E0',
                  border: 'none', cursor: 'pointer', transition: 'all .4s',
                }}/>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 数据条 ==================== */}
      <section style={{ background: primaryDark, color: '#fff', padding: '48px 0' }}>
        <div className="gxa-stats" style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', position: 'relative', paddingLeft: i > 0 ? 40 : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
              <div style={{ fontSize: 48, fontWeight: 700, fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>{s.num}</div>
              <div style={{ fontSize: 14, opacity: .75, marginTop: 6, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 核心服务 · 四大模块 ==================== */}
      <section id="services" style={{ padding: '110px 0', background: '#FBFAF7' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
          <SectionTitle
            eyebrow="核心服务"
            title="陪你走过每一段路"
            desc="从入职建档、日常陪伴到专业咨询 —— 三个入口，陪你走过每一段路"
            primary={primary}
          />

          <div className="gxa-services" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 64 }}>
            {EAP_MODULES.map(m => {
              const isNew = m.badge === 'NEW';
              const href = m.id === 'onboarding' ? '/onboarding' : `#${m.id}`;
              return (
                <a key={m.id} href={href} style={{
                  background: isNew
                    ? `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`
                    : '#fff',
                  color: isNew ? '#fff' : 'inherit',
                  padding: isNew ? '40px 36px' : '32px 24px', borderRadius: 6,
                  border: isNew ? 'none' : '1px solid #E8ECF3',
                  textDecoration: 'none',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all .3s',
                  position: 'relative', overflow: 'hidden',
                  gridColumn: isNew ? 'span 2' : 'span 1',
                  boxShadow: isNew ? `0 20px 40px -20px ${primary}66` : 'none',
                }}
                  className="module-card"
                >
                  {isNew && (
                    <>
                      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }}/>
                      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)' }}/>
                      <span style={{
                        position: 'absolute', top: 20, right: 20,
                        fontSize: 10, fontWeight: 700, letterSpacing: 1,
                        background: accent, color: '#fff',
                        padding: '3px 10px', borderRadius: 3,
                      }}>NEW</span>
                    </>
                  )}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: isNew ? 56 : 48, height: isNew ? 56 : 48, borderRadius: 6,
                      background: isNew ? 'rgba(255,255,255,.15)' : (m.urgent ? `${accent}12` : `${primary}0C`),
                      color: isNew ? '#fff' : (m.urgent ? accent : primary),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: isNew ? 24 : 16,
                    }}>
                      <Icon name={m.icon} size={isNew ? 28 : 22} stroke={1.5}/>
                    </div>
                    <h3 style={{
                      fontSize: isNew ? 24 : 17, fontWeight: 600, margin: 0,
                      color: isNew ? '#fff' : '#0F2E5F',
                      fontFamily: '"Noto Serif SC", serif', letterSpacing: 1,
                      lineHeight: 1.3,
                    }}>
                      {m.title}
                      {m.urgent && !isNew && <span style={{ fontSize: 11, color: accent, marginLeft: 8, padding: '2px 8px', background: `${accent}12`, borderRadius: 3, fontFamily: 'sans-serif', letterSpacing: 0 }}>紧急</span>}
                    </h3>
                    <p style={{
                      fontSize: isNew ? 14 : 13,
                      color: isNew ? 'rgba(255,255,255,.85)' : '#4A5A78',
                      lineHeight: 1.75, margin: isNew ? '14px 0 0' : '8px 0 0',
                      maxWidth: isNew ? 320 : 'auto',
                    }}>{m.desc}</p>
                  </div>
                  <div style={{
                    marginTop: isNew ? 28 : 16,
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: isNew ? '#fff' : primary,
                    fontSize: isNew ? 14 : 12, fontWeight: 500,
                    position: 'relative',
                  }}>
                    {isNew ? '立即开始测评' : '进入了解'} <Icon name="arrow" size={isNew ? 16 : 13}/>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 心理知识库（合并：故事 + 图文 + 音频） ==================== */}
      <section id="library" style={{ padding: '110px 0', background: warm }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
          <SectionTitle
            eyebrow="心理知识库"
            title="图文与音频  疑惑时先来看看"
            desc="心理图文的专业解读、伴你入眠的疗愈音频 —— 求助之前，你并不孤单"
            primary={primary}
          />

          {/* 心理图文 + 音频 —— 双栏紧凑呈现 */}
          <div className="gxa-library" style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* 图文 */}
            <div style={{ background: '#fff', padding: 32, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>
                  <span style={{ display: 'inline-block', width: 4, height: 18, background: primary, verticalAlign: 'middle', marginRight: 12, transform: 'translateY(-1px)' }}/>
                  心理图文
                </h3>
                <a href="#" style={{ fontSize: 12, color: primary, textDecoration: 'none' }}>更多 →</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ARTICLES.map((a, i) => (
                  <a key={i} href="#" style={{ display: 'flex', gap: 16, textDecoration: 'none', color: 'inherit', padding: '14px 8px', borderRadius: 4, transition: 'background .2s', borderBottom: i < ARTICLES.length - 1 ? '1px solid #F0EBE0' : 'none' }} className="article-row">
                    <div style={{ width: 100, height: 70, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                      <img src={a.img} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        {a.tags.slice(0, 2).map(t => (<span key={t} style={{ fontSize: 11, color: primary, background: `${primary}0C`, padding: '2px 8px', borderRadius: 3 }}>{t}</span>))}
                      </div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', lineHeight: 1.4 }}>{a.title}</h4>
                      <div style={{ fontSize: 12, color: '#8B96A8', marginTop: 6 }}>{a.duration}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* 音频 */}
            <div style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`, padding: 32, borderRadius: 6, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }}/>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)' }}/>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, position: 'relative' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#fff', fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>
                  <span style={{ display: 'inline-block', width: 4, height: 18, background: '#fff', verticalAlign: 'middle', marginRight: 12, transform: 'translateY(-1px)', opacity: .5 }}/>
                  心理音画
                </h3>
                <a href="#" style={{ fontSize: 12, color: '#fff', textDecoration: 'none', opacity: .8 }}>更多 →</a>
              </div>
              <AudioPlayerList audios={AUDIOS} primary={primary}/>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 预约咨询 · 咨询师团队 ==================== */}
      <section id="consultation" style={{ padding: '110px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
          <SectionTitle
            eyebrow="预约咨询"
            title="你可以选择你信任的咨询师"
            desc="58 位持证咨询师，涵盖情绪疏导、职场压力、婚姻家庭、创伤修复等方向"
            primary={primary}
          />

          {/* 咨询师团队 —— 4 张卡片横排 */}
          <div className="gxa-counselors" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 64 }}>
            {COUNSELORS.map((c, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #E8ECF3', padding: 28, borderRadius: 6,
                textAlign: 'center', transition: 'all .3s',
              }} className="counselor-card">
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 600, fontFamily: '"Noto Serif SC", serif',
                  letterSpacing: 1, margin: '0 auto 18px',
                  boxShadow: `0 8px 20px -8px ${primary}80`,
                }}>{c.name.charAt(0)}</div>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>{c.name}</h4>
                <div style={{ fontSize: 12, color: '#4A5A78', marginTop: 4 }}>{c.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {c.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, color: '#4A5A78', border: '1px solid #E0E4EC', padding: '2px 8px', borderRadius: 3 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14, fontSize: 12, color: '#8B96A8', paddingTop: 14, borderTop: '1px solid #F0EBE0' }}>
                  <span>执业 {c.years}</span>
                  <span>{c.cases} 案例</span>
                </div>
              </div>
            ))}
          </div>

          {/* 预约流程简说 + CTA */}
          <div style={{ marginTop: 56, background: warm, borderRadius: 8, padding: '40px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }} className="gxa-book-cta">
            <div>
              <div style={{ fontSize: 13, color: primary, letterSpacing: 2, marginBottom: 12, fontWeight: 500 }}>3 步完成预约</div>
              <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
                {[
                  { n: 1, title: '选择方向', desc: '按困扰或咨询师筛选' },
                  { n: 2, title: '选择时段', desc: '视频 / 电话 / 线下面谈' },
                  { n: 3, title: '完成预约', desc: '首次入职咨询免费' },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, fontFamily: '"Noto Serif SC", serif', flexShrink: 0, border: `1.5px solid ${primary}30` }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F' }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: '#4A5A78' }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button style={{ background: primary, color: '#fff', border: 'none', padding: '16px 32px', borderRadius: 4, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, boxShadow: `0 10px 24px -10px ${primary}66` }}>
              立即预约 <Icon name="arrow" size={16}/>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== 我们的理念 ==================== */}
      <section style={{ padding: '120px 0', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ fontSize: 40, color: primary, opacity: .3, fontFamily: '"Noto Serif SC", serif' }}>❝</div>
          <h2 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 34, fontWeight: 500, lineHeight: 1.7, color: '#0F2E5F', letterSpacing: 2, margin: '16px 0' }}>
            我们建的不只是楼宇，<br/>
            也是每一位建设者<span style={{ color: primary }}>心中的安稳</span>。
          </h2>
          <p style={{ fontSize: 15, color: '#4A5A78', lineHeight: 2, marginTop: 24, maxWidth: 640, margin: '24px auto 0' }}>
            广厦心安相信，中建三局的每一位员工都是伟大工程的书写者。
            在追求「建证美好生活」的征途上，我们同样值得被温柔以待。
            这里没有病人和医生，只有建设者与陪伴者。
          </p>
          <div style={{ marginTop: 40, fontSize: 14, color: primary, letterSpacing: 4 }}>—— 广厦心安 · EAP 服务团队 ——</div>
        </div>
      </section>

      {/* ==================== 页脚 ==================== */}
      <Footer primary={primary} primaryDark={primaryDark} accent={accent}/>

      <style>{`
        .module-card:hover {
          border-color: ${primary}60 !important;
          box-shadow: 0 10px 30px -10px ${primary}25;
          transform: translateY(-2px);
        }
        .article-row:hover {
          background: ${warm};
        }
        .onboarding-banner:hover {
          border-color: ${primary}50 !important;
          box-shadow: 0 14px 32px -14px ${primary}30 !important;
          transform: translateY(-2px);
        }
        .counselor-card:hover {
          border-color: ${primary}40 !important;
          box-shadow: 0 10px 30px -12px ${primary}25;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

// 通用 section 标题
const SectionTitle = ({ eyebrow, title, desc, primary, align = 'center' }) => (
  <div style={{ textAlign: align, maxWidth: align === 'center' ? 720 : undefined, margin: align === 'center' ? '0 auto' : 0 }}>
    <div style={{ fontSize: 13, color: primary, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{eyebrow.toUpperCase()}</div>
    <h2 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 40, fontWeight: 700, margin: 0, color: '#0F2E5F', letterSpacing: 2, lineHeight: 1.3 }}>
      {title}
    </h2>
    {desc && <p style={{ fontSize: 15, color: '#4A5A78', lineHeight: 1.9, marginTop: 20 }}>{desc}</p>}
  </div>
);

// 页脚组件
const Footer = ({ primary, primaryDark, accent }) => (
  <footer style={{ background: '#0A1E42', color: 'rgba(255,255,255,.7)', padding: '70px 0 30px' }}>
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 60, paddingBottom: 50, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <img src="/assets/guangsha-xinan-logo.jpg" alt="" style={{ height: 44, width: 44, borderRadius: 4 }}/>
            <div>
              <div style={{ fontSize: 18, color: '#fff', fontWeight: 600, fontFamily: '"Noto Serif SC", serif', letterSpacing: 2 }}>广厦心安</div>
              <div style={{ fontSize: 11, opacity: .6, marginTop: 3 }}>中建三局员工心理关爱平台</div>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 2, opacity: .7 }}>
            关爱员工身心健康 · 共建幸福企业<br/>
            为每一位建设者提供专业、保密、全天候的心理支持
          </p>
          <div style={{ marginTop: 24, padding: 20, background: 'rgba(200,22,29,.15)', borderLeft: `3px solid ${accent}`, borderRadius: 3 }}>
            <div style={{ fontSize: 12, color: '#fff', opacity: .85, marginBottom: 4 }}>24 小时心理热线</div>
            <div style={{ fontSize: 22, color: '#fff', fontWeight: 700, fontFamily: '"Noto Serif SC", serif' }}>400-880-6666</div>
          </div>
        </div>
        {[
          { title: '心理服务', items: ['新员工入职测评', '心理知识库', '预约咨询', '心理测评'] },
          { title: '专业支持', items: ['24h 心理热线', '首次入职咨询免费', '匿名保密承诺', 'EAP 机构 · 连心心理'] },
          { title: '关于我们', items: ['服务承诺', '咨询师团队', '合作机构', '常见问题'] },
          { title: '合规与安全', items: ['隐私保护政策', '保密协议', '服务条款', '资质证照'] },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ color: '#fff', fontSize: 14, margin: '0 0 20px', fontWeight: 600 }}>{col.title}</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.items.map(item => (
                <li key={item}><a href="#" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'none', fontSize: 13 }}>{item}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 30, fontSize: 12, opacity: .5 }}>
        <div>© 2026 中建三局集团有限公司 · 广厦心安 EAP 项目组 · 版权所有</div>
        <div>本平台由专业心理服务机构运营 · 严格遵守心理咨询行业伦理守则</div>
      </div>
    </div>
  </footer>
);

// ==================== 音频播放器组件 ====================
const AudioPlayerList = ({ audios, primary }) => {
  const [currentIdx, setCurrentIdx] = React.useState(-1); // -1 = 无
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0-1
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration) setProgress(el.currentTime / el.duration);
    };
    const onEnd = () => { setPlaying(false); setProgress(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, [currentIdx]);

  const safePlay = (el) => {
    // 包裹一层 catch，避免"play() interrupted by load"污染控制台
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  };

  const togglePlay = (i) => {
    const el = audioRef.current;
    if (currentIdx === i && el) {
      // 当前项 —— 切换播放/暂停
      if (playing) { el.pause(); setPlaying(false); }
      else { safePlay(el); setPlaying(true); }
    } else {
      // 切换到新项（或首次点击）—— 先暂停当前，切换 currentIdx，等新的 audio 元素挂载后自动播
      if (el) { try { el.pause(); } catch {} }
      setCurrentIdx(i);
      setProgress(0);
      setPlaying(true); // 触发下方 effect 自动播放
    }
  };

  // 当 currentIdx 变化 & audio 元素挂载后，自动播放
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el || currentIdx < 0 || !playing) return;
    // 用 canplay 事件确保音频可播
    if (el.readyState >= 2) {
      safePlay(el);
    } else {
      const onCanPlay = () => { safePlay(el); };
      el.addEventListener('canplay', onCanPlay, { once: true });
      return () => el.removeEventListener('canplay', onCanPlay);
    }
  }, [currentIdx]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
      {/* 只在选中时渲染 audio 元素，避免空 src 触发资源加载错误 */}
      {currentIdx >= 0 && (
        <audio ref={audioRef} src={audios[currentIdx].src} preload="auto"/>
      )}
      {audios.map((a, i) => {
        const active = currentIdx === i;
        const isPlaying = active && playing;
        return (
          <div key={i} onClick={() => togglePlay(i)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 12px', margin: '0 -12px',
            borderRadius: active ? 6 : 0,
            background: active ? 'rgba(255,255,255,.08)' : 'transparent',
            borderBottom: !active && i < audios.length - 1 ? '1px solid rgba(255,255,255,.1)' : 'none',
            cursor: 'pointer', transition: 'background .2s',
            position: 'relative',
          }}>
            <button style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isPlaying ? '#fff' : 'rgba(255,255,255,.15)',
              color: isPlaying ? primary : '#fff',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer',
              transition: 'all .2s',
            }}>
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={primary}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              ) : (
                <Icon name="play" size={12} color={isPlaying ? primary : '#fff'}/>
              )}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: '"Noto Serif SC", serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.title}
                {isPlaying && <PlayingBars/>}
              </div>
              <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>{a.series} · {a.dur} · {a.plays} 播放</div>
            </div>
            {/* 进度条 */}
            {active && (
              <div style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, background: 'rgba(255,255,255,.15)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${progress * 100}%`, height: '100%', background: '#fff', transition: 'width .2s' }}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// 播放中的动态音波条
const PlayingBars = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        display: 'inline-block', width: 2, height: 10, background: '#fff', borderRadius: 1,
        animation: `audiobar 1s ease-in-out ${i * 0.15}s infinite`,
        transformOrigin: 'bottom',
      }}/>
    ))}
    <style>{`@keyframes audiobar { 0%, 100% { transform: scaleY(.4); } 50% { transform: scaleY(1); } }`}</style>
  </div>
);

export default DesignV1;
export { DesignV1, SectionTitle, Footer, AudioPlayerList };
