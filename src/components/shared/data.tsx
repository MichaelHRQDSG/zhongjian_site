// @ts-nocheck
'use client';

import React from 'react';

// 共享数据 —— 中建三局 EAP "广厦心安" 网站
// 所有方案共用此数据源

const EAP_MODULES = [
  { id: 'onboarding', title: '新员工入职测评', desc: '入职 30 天内完成心理基线建档，仅需 30 分钟', icon: 'userCheck', badge: 'NEW' },
  { id: 'library', title: '心理知识库', desc: '心理图文、疗愈音频，疑惑时可以先来看看', icon: 'book' },
  { id: 'consultation', title: '预约咨询', desc: '1v1 深度陪伴，选择你信任的咨询师与时段', icon: 'calendar' },
];

const STATS = [
  { num: '58', label: '项目部全量覆盖' },
  { num: '12,800+', label: '累计服务员工' },
  { num: '1000+', label: '专业心理咨询师' },
  { num: '24/7', label: '全天候热线支持' },
];

const QA_LIST = [
  {
    tags: ['项目一线', '压力', '失眠'],
    title: '常年驻守项目工地，长期失眠焦虑怎么办？',
    answer: '一线工作强度大、离家远，身体与情绪都在超负荷。先从建立稳定的「睡前锚点」开始——固定 20 分钟远离手机、做 3 分钟深呼吸……',
    author: '林晚晴',
    role: '国家二级心理咨询师',
    helpful: 428,
  },
  {
    tags: ['职场关系', '沟通', '中层管理'],
    title: '带团队时怎么平衡业绩压力与员工心理？',
    answer: '优秀的项目经理往往同时是「情绪容器」。给自己留出情绪缓冲区，是保护团队的第一步……',
    author: '苏雅文',
    role: 'EAP 高级咨询顾问',
    helpful: 356,
  },
  {
    tags: ['家庭', '异地', '亲子'],
    title: '常年在外驻守，如何维系家庭关系？',
    answer: '距离不必然带来疏远。规律的「非事务性沟通」——每周一次不谈工作也不谈账单的通话，才是关系的养分……',
    author: '陈牧之',
    role: '婚姻家庭治疗师',
    helpful: 312,
  },
];

const STORIES = [
  {
    tag: '一线故事',
    title: '在千米高的塔吊上，我学会了与焦虑共处',
    excerpt: '第一次登上 380 米高的塔吊时，我在夜里失眠了整整两周。EAP 咨询让我重新找回了对高度的掌控感。',
    tags: ['告别工作焦虑', '重建自我掌控'],
    author: '塔吊司机 · 老张',
    duration: '6 分钟',
    img: 'workers',
  },
  {
    tag: '管理者故事',
    title: '从「压不住脾气」到「稳得住团队」',
    excerpt: '作为项目经理，我曾经天天在工地上发火。心理咨询让我看见了愤怒背后真正的责任焦虑。',
    tags: ['情绪管理', '领导力提升'],
    author: '项目经理 · 王总',
    duration: '8 分钟',
    img: 'manager',
  },
  {
    tag: '家庭故事',
    title: '异地八年，我们没有走散',
    excerpt: '爱人在深圳，我在重庆的工地上。EAP 家庭咨询帮我们重新学会了「隔着屏幕也能靠近」。',
    tags: ['异地关系', '亲密沟通'],
    author: '技术员 · 小周',
    duration: '7 分钟',
    img: 'family',
  },
];

const ARTICLES = [
  {
    title: '深夜工棚的独处时刻',
    excerpt: '当整个工地陷入寂静，那些白天被压下去的情绪会悄悄浮出水面。你不孤单——这是常见的心理反应……',
    tags: ['独处', '一线员工'],
    duration: '8 分钟阅读',
    cover: 'night',
    img: '/assets/article-night.jpg',
  },
  {
    title: '给正在焦虑的自己写一封信',
    excerpt: '如果可以给三个月前的自己写一封信，你会说什么？书写是一种被证明有效的情绪整理方式……',
    tags: ['自我关怀', '情绪疏导'],
    duration: '6 分钟阅读',
    cover: 'letter',
    img: '/assets/article-letter.jpg',
  },
  {
    title: '开工日的心理调适指南',
    excerpt: '春节结束返回项目部，「开工综合症」是很正常的。用这 5 个方法平稳过渡……',
    tags: ['节后调适', '实用指南'],
    duration: '5 分钟阅读',
    cover: 'return',
    img: '/assets/article-return.jpg',
  },
];

const AUDIOS = [
  { title: '睡前冥想：放下今天的疲惫', series: '晚安工地', dur: '01:30', plays: '2.8万', src: '/assets/audio-sleep-new.mp3' },
  { title: '通勤路上的呼吸练习', series: '每日五分钟', dur: '00:25', plays: '3.4万', src: '/assets/audio-breath.mp3' },
  { title: '与内在小孩对话', series: '深度疗愈', dur: '00:21', plays: '1.6万', src: '/assets/audio-inner-child.mp3' },
  { title: '给悲伤一个出口：情绪释放练习', series: '深度疗愈', dur: '01:30', plays: '1.9万', src: '/assets/audio-emotion-release.mp3' },
];

const COUNSELORS = [
  { name: '林晚晴', title: '国家二级心理咨询师', tags: ['职场焦虑', '失眠', '一线员工'], years: '12 年', cases: '1200+' },
  { name: '苏雅文', title: 'EAP 高级顾问', tags: ['团队管理', '中层压力'], years: '15 年', cases: '1800+' },
  { name: '陈牧之', title: '婚姻家庭治疗师', tags: ['异地情感', '亲子关系'], years: '10 年', cases: '960+' },
  { name: '周航', title: '临床心理学博士', tags: ['创伤修复', '职业倦怠'], years: '18 年', cases: '2100+' },
];

const NAV_ITEMS = [
  { label: '新员工入职测评', href: '/onboarding', badge: 'NEW' },
  { label: '心理知识库', href: '#library' },
  { label: '预约咨询', href: '#consultation' },
];

// 简单的内联 SVG 图标系统 —— 线性风格，专业感
const Icon = ({ name, size = 24, color = 'currentColor', stroke = 1.6 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const icons = {
    book: <svg {...props}><path d="M4 5v14a1 1 0 0 0 1 1h6V4H5a1 1 0 0 0-1 1zM20 5v14a1 1 0 0 1-1 1h-6V4h6a1 1 0 0 1 1 1z"/><path d="M7 8h2M7 12h2M15 8h2M15 12h2"/></svg>,
    chat: <svg {...props}><path d="M21 12a8 8 0 0 1-11.4 7.2L3 21l1.8-6.6A8 8 0 1 1 21 12z"/><circle cx="9" cy="12" r=".5" fill={color}/><circle cx="12" cy="12" r=".5" fill={color}/><circle cx="15" cy="12" r=".5" fill={color}/></svg>,
    audio: <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>,
    calendar: <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
    chart: <svg {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
    phone: <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>,
    group: <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>,
    shield: <svg {...props}><path d="M12 2 4 5v7c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V5l-8-3z"/><path d="M12 8v4M12 16h.01"/></svg>,
    admin: <svg {...props}><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 12h.01M9 15h.01M9 18h.01M15 9h.01M15 12h.01M15 15h.01M15 18h.01"/></svg>,
    arrow: <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
    play: <svg {...props}><path d="M6 3l14 9-14 9V3z" fill={color}/></svg>,
    check: <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>,
    heart: <svg {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>,
    building: <svg {...props}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V11a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10M9 7h2M9 11h2M9 15h2"/></svg>,
    menu: <svg {...props}><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
    search: <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
    globe: <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>,
    quote: <svg {...props}><path d="M3 21c3 0 5-1 5-6V5H2v10h5M22 21c3 0 5-1 5-6V5h-6v10h5" transform="translate(-2)"/></svg>,
    star: <svg {...props}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1z"/></svg>,
    clock: <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    userCheck: <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="m17 11 2 2 4-4"/></svg>,
    sparkle: <svg {...props}><path d="M12 3l1.5 5L18 9l-4.5 1L12 15l-1.5-5L6 9l4.5-1zM19 3l.7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7zM5 16l.7 2.3L8 19l-2.3.7L5 22l-.7-2.3L2 19l2.3-.7z"/></svg>,
    edit: <svg {...props}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    lock: <svg {...props}><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  };
  return icons[name] || null;
};

// 简洁的建筑天际线 SVG（用于中建三局品牌感）
const CitySkyline = ({ color = 'currentColor', opacity = 0.15, height = 80 }) => (
  <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: '100%', height, display: 'block', opacity }}>
    <path fill={color} d="M0,120 L0,80 L60,80 L60,60 L100,60 L100,40 L140,40 L140,55 L180,55 L180,25 L220,25 L220,45 L260,45 L260,15 L290,15 L290,35 L330,35 L330,50 L380,50 L380,20 L420,20 L420,40 L460,40 L460,60 L510,60 L510,30 L550,30 L550,10 L590,10 L590,35 L630,35 L630,55 L680,55 L680,25 L720,25 L720,45 L760,45 L760,65 L810,65 L810,30 L850,30 L850,15 L890,15 L890,40 L930,40 L930,20 L970,20 L970,50 L1010,50 L1010,35 L1060,35 L1060,55 L1100,55 L1100,25 L1140,25 L1140,45 L1180,45 L1180,20 L1220,20 L1220,40 L1260,40 L1260,60 L1310,60 L1310,30 L1350,30 L1350,50 L1400,50 L1400,70 L1440,70 L1440,120 Z"/>
  </svg>
);

// 建筑元素占位图（当没有真实图片时用）—— 用 CSS 渐变 + SVG 抽象化
const PlaceholderImg = ({ variant = 'site', className = '', style = {} }) => {
  const gradients = {
    site: 'linear-gradient(135deg, #C8D6E5 0%, #8395A7 100%)', // 工地
    office: 'linear-gradient(135deg, #DFE4EA 0%, #A4B0BE 100%)', // 办公
    family: 'linear-gradient(135deg, #FADBD8 0%, #F5B7B1 100%)', // 家庭
    workers: 'linear-gradient(135deg, #FFB74D 0%, #F57C00 100%)',
    manager: 'linear-gradient(135deg, #90A4AE 0%, #455A64 100%)',
    night: 'linear-gradient(135deg, #1E3A5F 0%, #0D1B2A 100%)',
    letter: 'linear-gradient(135deg, #F5EFE6 0%, #E8DDCA 100%)',
    return: 'linear-gradient(135deg, #B8D4E3 0%, #6C8FB0 100%)',
    audio: 'linear-gradient(135deg, #7986CB 0%, #3F51B5 100%)',
  };
  const icons = {
    site: '🏗️', office: '🏢', family: '👨‍👩‍👧', workers: '👷', manager: '💼',
    night: '🌙', letter: '✉️', return: '🌤️', audio: '🎧',
  };
  return (
    <div className={className} style={{
      background: gradients[variant] || gradients.site,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,.15), transparent 60%)',
      }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(to top, rgba(0,0,0,.25), transparent)',
      }}/>
      <span style={{ fontSize: '3rem', opacity: .5, filter: 'grayscale(.3)' }}>
        {icons[variant] || '🏗️'}
      </span>
    </div>
  );
};

export {
  EAP_MODULES, STATS, QA_LIST, STORIES, ARTICLES, AUDIOS, COUNSELORS, NAV_ITEMS,
  Icon, CitySkyline, PlaceholderImg,
};
