// @ts-nocheck
'use client';

import React from 'react';
import { Icon } from '@/components/shared/data';
import { SiteBeian } from '@/components/shared/SiteBeian';
import { submitEnterpriseOnboardingReports } from '@/lib/enterprise-assessments';
import type { ThemeTweaks } from '@/lib/tokens';

// 员工心理测评 · 完整流程页面
// 步骤：欢迎 → 基础信息（含知情同意勾选）→ 量表答题 → 提交完成 → 报告预览

const EMPTY_BASIC_FORM = {
  empNo: '', name: '', gender: '', age: '', edu: '',
  dept: '', post: '', category: '',
  workLoc: '', joinDate: '',
  livingStatus: '', hasFamily: '',
};

function createVisitorKey() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch {}
  return `vk${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

function createSubmissionId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  const hex = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}000000000000`.slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const OnboardingAssessment = ({
  tweaks,
  scales,
  companyName = '员工心理关爱平台',
  siteName = '心安 EAP',
  logoUrl = '/static/uploads/eap-default-logo.png',
  slogan = '专业测评，贴心陪伴',
  homeHref = '/',
  slug,
  apiBaseUrl = '',
  employeeInfoFields,
  customEmployeeInfoFields,
}: {
  tweaks?: ThemeTweaks;
  scales?: unknown[];
  companyName?: string;
  siteName?: string;
  logoUrl?: string;
  slogan?: string;
  homeHref?: string;
  slug?: string;
  apiBaseUrl?: string;
  employeeInfoFields?: string[];
  customEmployeeInfoFields?: Array<{ id: string; label: string }>;
}) => {
  const primary = tweaks?.primary || '#1E4C9A';
  const primaryDark = tweaks?.primaryDark || '#0F2E5F';
  const accent = tweaks?.accent || '#C8161D';
  const warm = tweaks?.warm || '#F5EFE6';
  const activeScales = Array.isArray(scales) && scales.length > 0 ? scales : SCALES;
  const activeQuestionCount = activeScales.reduce((total, scale) => total + (scale.items?.length || 0), 0);
  const storageScope = slug || companyName || 'default';
  const progressKey = `onb-step-${storageScope}`;
  const answersKey = `onb-answers-${storageScope}`;
  const basicKey = `onb-basic-${storageScope}`;
  const visitorKeyStorage = `onb-visitor-${storageScope}`;
  const allowedSteps = new Set(['welcome', 'basic', 'scale', 'complete', 'report']);

  // 服务端与首屏客户端统一从 welcome 开始，避免 localStorage 造成 hydration 报错
  const [step, setStep] = React.useState('welcome');
  const [scaleIdx, setScaleIdx] = React.useState(0);
  const [answersByScale, setAnswersByScale] = React.useState({});
  const [basicForm, setBasicForm] = React.useState(EMPTY_BASIC_FORM);
  const [visitorKey, setVisitorKey] = React.useState('');
  const [progressReady, setProgressReady] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [submitDone, setSubmitDone] = React.useState(false);
  const submittingRef = React.useRef(false);

  React.useEffect(() => {
    try {
      let saved = localStorage.getItem(progressKey);
      // 旧版独立「知情同意」步骤并入基础信息
      if (saved === 'consent') saved = 'basic';
      if (saved && allowedSteps.has(saved) && saved !== 'complete' && saved !== 'report') {
        setStep(saved);
      }
      const savedAnswers = localStorage.getItem(answersKey);
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        if (parsed && typeof parsed === 'object') setAnswersByScale(parsed);
      }
      const savedBasic = localStorage.getItem(basicKey);
      if (savedBasic) {
        const parsed = JSON.parse(savedBasic);
        if (parsed && typeof parsed === 'object') {
          setBasicForm({ ...EMPTY_BASIC_FORM, ...parsed });
        }
      }
      let key = localStorage.getItem(visitorKeyStorage) || '';
      if (key.length < 8) {
        key = createVisitorKey();
        localStorage.setItem(visitorKeyStorage, key);
      }
      setVisitorKey(key);
    } catch {
      const key = createVisitorKey();
      setVisitorKey(key);
    }
    setProgressReady(true);
  }, [progressKey, answersKey, basicKey, visitorKeyStorage]);

  React.useEffect(() => {
    if (!progressReady) return;
    try { localStorage.setItem(progressKey, step); } catch {}
  }, [progressKey, step, progressReady]);

  React.useEffect(() => {
    if (!progressReady) return;
    try { localStorage.setItem(answersKey, JSON.stringify(answersByScale)); } catch {}
  }, [answersKey, answersByScale, progressReady]);

  React.useEffect(() => {
    if (!progressReady) return;
    try { localStorage.setItem(basicKey, JSON.stringify(basicForm)); } catch {}
  }, [basicKey, basicForm, progressReady]);

  React.useEffect(() => {
    try {
      const match = String(homeHref || '').match(/^\/([^/?#]+)/);
      const slugFromHome = match?.[1] || '';
      if (slugFromHome && slugFromHome !== 'onboarding') {
        sessionStorage.setItem('gxa-enterprise-slug', slugFromHome);
      }
    } catch {}
  }, [homeHref]);

  const goto = (s) => { setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const setScaleAnswer = React.useCallback((scaleId, questionKey, value) => {
    setAnswersByScale((current) => ({
      ...current,
      [scaleId]: {
        ...(current[scaleId] || {}),
        [questionKey]: value,
      },
    }));
  }, []);

  const finishWithMockReport = React.useCallback((saved) => {
    setSubmitDone(true);
    submittingRef.current = false;
    try {
      if (saved) {
        localStorage.removeItem(answersKey);
        localStorage.removeItem(basicKey);
      }
      localStorage.setItem(progressKey, 'report');
    } catch {}
    goto('complete');
  }, [answersKey, basicKey, progressKey]);

  const handleScalesComplete = React.useCallback(async () => {
    if (submittingRef.current || submitDone) {
      goto('complete');
      return;
    }
    if (!slug || !apiBaseUrl) {
      // 演示量表（无企业 slug）直接进入模拟报告
      setSubmitError('');
      finishWithMockReport(false);
      return;
    }
    submittingRef.current = true;
    setSubmitError('');
    goto('complete');
    try {
      const reports = activeScales
        .filter((scale) => scale?.id && scale.scale === 'dynamic')
        .map((scale) => {
          const raw = answersByScale[scale.id] || {};
          const answers = {};
          (scale.items || []).forEach((item, index) => {
            const questionId = item?.id || String(index);
            const value = raw[questionId] ?? raw[index];
            if (value != null && value !== '') {
              answers[questionId] = String(value);
            }
          });
          return {
            clientSubmissionId: createSubmissionId(),
            assessmentId: scale.id,
            assessmentVersion: Number(scale.version) > 0 ? Number(scale.version) : 1,
            answers,
          };
        })
        .filter((item) => Object.keys(item.answers).length > 0);

      if (reports.length === 0) {
        throw new Error('没有可提交的量表答案');
      }

      await submitEnterpriseOnboardingReports(apiBaseUrl, slug, {
        visitorKey: visitorKey || createVisitorKey(),
        employeeInfo: basicForm,
        reports,
      });
      finishWithMockReport(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '提交失败，请稍后重试');
      finishWithMockReport(false);
    }
  }, [
    activeScales,
    answersByScale,
    answersKey,
    apiBaseUrl,
    basicForm,
    basicKey,
    progressKey,
    slug,
    submitDone,
    visitorKey,
    finishWithMockReport,
  ]);

  return (
    <div className="gxa-onb-root" style={{
      minHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'visible',
      background: `linear-gradient(180deg, ${warm} 0%, #FBF7F0 40%, #fff 100%)`,
      color: '#1A2846',
      fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    }}>
      {/* 顶部导航 */}
      <OnbHeader primary={primary} primaryDark={primaryDark} step={step} companyName={companyName} siteName={siteName} logoUrl={logoUrl} homeHref={homeHref}/>

      {/* 步骤条 */}
      {step !== 'welcome' && step !== 'complete' && step !== 'report' && (
        <OnbStepper primary={primary} step={step} scaleIdx={scaleIdx}/>
      )}

      {/* 主内容区 */}
      <main className="gxa-onb-main" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 40px 120px' }}>
        {step === 'welcome' && <StepWelcome assessmentCount={activeScales.length} primary={primary} primaryDark={primaryDark} accent={accent} companyName={companyName} slogan={slogan} onNext={() => goto('basic')}/>}
        {step === 'basic' && (
          <StepBasic
            primary={primary}
            primaryDark={primaryDark}
            visibleFields={employeeInfoFields}
            customFields={customEmployeeInfoFields}
            form={basicForm}
            setForm={setBasicForm}
            onNext={() => { setScaleIdx(0); goto('scale'); }}
            onBack={() => goto('welcome')}
          />
        )}
        {step === 'scale' && (
          <StepScale
            scales={activeScales}
            primary={primary}
            primaryDark={primaryDark}
            scaleIdx={scaleIdx}
            setScaleIdx={setScaleIdx}
            answersByScale={answersByScale}
            setScaleAnswer={setScaleAnswer}
            onComplete={handleScalesComplete}
            onBack={() => goto('basic')}
          />
        )}
        {step === 'complete' && (
          <StepComplete
            primary={primary}
            primaryDark={primaryDark}
            accent={accent}
            error={submitError}
            onRetry={submitError ? handleScalesComplete : undefined}
            onNext={() => goto('report')}
            canProceed={submitDone || !slug || !apiBaseUrl}
          />
        )}
        {step === 'report' && <StepReport scales={activeScales} assessmentCount={activeScales.length} questionCount={activeQuestionCount} primary={primary} primaryDark={primaryDark} accent={accent} warm={warm} companyName={companyName} siteName={siteName} homeHref={homeHref} submitError={submitError}/>}
      </main>

      {/* 底部 */}
      <OnbFooter primary={primary} accent={accent} companyName={companyName} siteName={siteName}/>
    </div>
  );
};

// ==================== 顶部导航 ====================
const OnbHeader = ({ primary, primaryDark, step, companyName, siteName, logoUrl, homeHref }) => (
  <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 50 }}>
    <div className="gxa-onb-header-inner" style={{ maxWidth: 1360, margin: '0 auto', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <a href={homeHref} className="gxa-onb-brand-link" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit', minWidth: 0, flex: 1 }}>
        <img src={logoUrl} alt="" className="gxa-onb-brand-logo" style={{ height: 44, width: 44, borderRadius: 6, flexShrink: 0, objectFit: 'cover' }}/>
        <div style={{ minWidth: 0 }}>
          <div className="gxa-onb-brand-title" style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: primary, fontFamily: '"Noto Serif SC", serif', whiteSpace: 'nowrap' }}>{siteName}</div>
          <div className="gxa-onb-brand-sub" style={{ fontSize: 11, color: '#4A5A78', letterSpacing: 1, marginTop: 2 }}>{companyName ? `${companyName} · 员工心理测评` : '员工心理测评'}</div>
        </div>
      </a>
      <div className="gxa-onb-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        <div className="gxa-onb-header-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A5A78' }}>
          <Icon name="lock" size={14} color={primary}/>
          <span>结果严格保密，不影响录用与晋升</span>
        </div>
        <a href={homeHref} className="gxa-onb-header-exit" style={{ fontSize: 13, color: '#4A5A78', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          退出
        </a>
      </div>
    </div>
  </header>
);

// ==================== 步骤条 ====================
const STEP_ORDER = ['basic', 'scale', 'complete'];
const STEP_LABELS = ['基础信息', '量表作答', '完成提交'];

const OnbStepper = ({ primary, step, scaleIdx }) => {
  const currentIdx = STEP_ORDER.indexOf(step);
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF3' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 0 }} className="gxa-onb-stepper">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: i < currentIdx ? primary : (i === currentIdx ? '#fff' : '#F0F2F6'),
                color: i < currentIdx ? '#fff' : (i === currentIdx ? primary : '#8B96A8'),
                border: i === currentIdx ? `2px solid ${primary}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, transition: 'all .3s',
              }}>
                {i < currentIdx ? <Icon name="check" size={14}/> : i + 1}
              </div>
              <div className="gxa-onb-stepper-label" style={{ fontSize: 14, fontWeight: i === currentIdx ? 600 : 500, color: i === currentIdx ? '#0F2E5F' : (i < currentIdx ? '#4A5A78' : '#8B96A8') }}>{label}</div>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < currentIdx ? primary : '#E8ECF3', margin: '0 16px', transition: 'background .3s' }}/>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ==================== 底部 ====================
const OnbFooter = ({ primary, accent, companyName, siteName }) => (
  <footer className="gxa-onb-footer" style={{ background: '#0A1E42', color: 'rgba(255,255,255,.7)', padding: '30px 0', fontSize: 12 }}>
    <div className="gxa-onb-footer-inner" style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px' }}>
      <SiteBeian opacity={0.85} />
    </div>
  </footer>
);

// ==================== Step 1: 欢迎页 ====================
const StepWelcome = ({ assessmentCount, primary, primaryDark, accent, companyName, slogan, onNext }) => (
  <div className="gxa-onb-welcome" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 80, alignItems: 'start', minHeight: 'auto', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
    <div className="gxa-onb-welcome-copy" style={{ minWidth: 0, maxWidth: '100%' }}>
      <div className="gxa-onb-welcome-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${primary}20`, padding: '8px 16px', borderRadius: 40, fontSize: 13, color: primary, marginBottom: 32, maxWidth: '100%', boxSizing: 'border-box', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          background: accent, color: '#fff',
          padding: '2px 8px', borderRadius: 3, flexShrink: 0,
        }}>EAP</span>
        <span style={{ wordBreak: 'break-word' }}>{companyName} · 员工心理关爱</span>
      </div>

      <h1 className="gxa-onb-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 56, fontWeight: 700, lineHeight: 1.2, letterSpacing: 2, margin: 0, color: '#0F2E5F' }}>
        欢迎参与员工心理测评
      </h1>
      <h2 className="gxa-onb-welcome-slogan" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 30, fontWeight: 500, lineHeight: 1.4, letterSpacing: 1, margin: '20px 0 0', color: primary }}>
        {slogan}
      </h2>

      <p className="gxa-onb-welcome-desc" style={{ fontSize: 16, lineHeight: 1.95, color: '#4A5A78', marginTop: 32, maxWidth: 540 }}>
        这是一次面向员工的专业心理测评，帮助你了解当前的心理状态与支持需求。
        <br/><br/>
        这不是考核，也不是筛选 —— 而是<strong style={{ color: '#0F2E5F', fontWeight: 600 }}>为你提供心理关爱与支持</strong>的起点。
        完成后你将获得：一份可视化的心理画像、个性化的成长建议，以及可按需预约的 EAP 咨询资源。
      </p>

      {/* 四个亮点 */}
      <div className="gxa-onb-welcome-features gxa-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 40 }}>
        {[
          { icon: 'clock', title: '仅需 30 分钟', desc: '可分次完成' },
          { icon: 'lock', title: '严格保密', desc: '不进入人事档案' },
          { icon: 'chart', title: '专业量表', desc: `${assessmentCount} 个企业授权量表` },
          { icon: 'sparkle', title: '个性化报告', desc: '含成长建议' },
        ].map(f => (
          <div key={f.title} className="gxa-onb-welcome-feature" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${primary}0C`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={f.icon} size={18}/>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F' }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#4A5A78', wordBreak: 'break-word' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="gxa-onb-welcome-cta" style={{ display: 'flex', gap: 16, marginTop: 44, alignItems: 'center' }}>
        <button
          type="button"
          className="gxa-onb-welcome-start"
          onClick={onNext}
          style={{
            background: primary, color: '#fff', border: 'none',
            padding: '16px 40px', fontSize: 15, borderRadius: 4, cursor: 'pointer',
            fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: `0 10px 24px -10px ${primary}66`,
            whiteSpace: 'nowrap', flexShrink: 0, boxSizing: 'border-box',
          }}
        >
          开始测评 <Icon name="arrow" size={16}/>
        </button>
        <div className="gxa-onb-welcome-meta" style={{ fontSize: 13, color: '#4A5A78', lineHeight: 1.6, minWidth: 0 }}>
          <div>预计时长 30-35 分钟</div>
          <div style={{ marginTop: 2 }}>由第三方 EAP 机构 · 连心心理 提供服务</div>
        </div>
      </div>
    </div>

    {/* 右：可视化插图 —— 抽象的心理雷达图 */}
    <div className="gxa-onb-welcome-visual" style={{ position: 'relative', aspectRatio: '1/1', width: '100%', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 50% 45%, ${primary}20, transparent 70%)` }}/>
      <svg viewBox="-140 -140 280 280" style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}>
        {/* 装饰同心圆 */}
        {[120, 90, 60, 30].map(r => (
          <circle key={r} cx="0" cy="0" r={r} fill="none" stroke={`${primary}30`} strokeWidth="0.5" strokeDasharray="2 3"/>
        ))}
        {/* 主雷达六边形 */}
        {[100, 75, 50, 25].map(r => (
          <polygon key={r} points={`0,${-r} ${r*0.866},${-r/2} ${r*0.866},${r/2} 0,${r} ${-r*0.866},${r/2} ${-r*0.866},${-r/2}`}
            fill="none" stroke={`${primary}${r === 100 ? '80' : '30'}`} strokeWidth={r === 100 ? '1' : '0.5'}/>
        ))}
        {/* 数据 */}
        <polygon points="0,-82 68,-40 60,32 0,90 -73,-42 -68,-38"
          fill={`${primary}25`} stroke={primary} strokeWidth="1.5"/>
        {/* 数据点 */}
        {[[0,-82], [68,-40], [60,32], [0,90], [-73,-42], [-68,-38]].map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke={primary} strokeWidth="2"/>
        ))}
        {/* 标签 */}
        <text x="0" y="-115" textAnchor="middle" fontSize="11" fill="#0F2E5F" fontWeight="600">心理健康</text>
        <text x="105" y="-58" textAnchor="middle" fontSize="11" fill="#0F2E5F" fontWeight="600">性格倾向</text>
        <text x="105" y="72" textAnchor="middle" fontSize="11" fill="#0F2E5F" fontWeight="600">工作适应</text>
        <text x="0" y="120" textAnchor="middle" fontSize="11" fill="#0F2E5F" fontWeight="600">睡眠质量</text>
        <text x="-105" y="72" textAnchor="middle" fontSize="11" fill="#0F2E5F" fontWeight="600">社会支持</text>
        <text x="-105" y="-58" textAnchor="middle" fontSize="11" fill="#0F2E5F" fontWeight="600">压力承受</text>
      </svg>
    </div>
  </div>
);

// ==================== 知情同意书内容 / 弹层 ====================
const CONSENT_HIGHLIGHTS = [
  { icon: 'lock', title: '完全保密', desc: '测评结果仅您本人可见，不进入人事档案、不影响录用晋升' },
  { icon: 'shield', title: '第三方托管', desc: '数据由独立 EAP 机构（连心心理）加密存储，物理隔离于人事系统' },
  { icon: 'edit', title: '匿名 ID', desc: '数据以匿名 ID 保存，聚合分析时脱敏，管理者仅见部门级汇总' },
  { icon: 'check', title: '自愿参与', desc: '您可随时中止测评，进度自动保存；也可随时申请删除全部数据' },
];

const ConsentDocumentBody = ({ primary }) => (
  <>
    <div className="gxa-consent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
      {CONSENT_HIGHLIGHTS.map(c => (
        <div key={c.title} style={{ display: 'flex', gap: 14, padding: 16, background: '#FBFAF7', borderRadius: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={c.icon} size={18}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>{c.title}</div>
            <div style={{ fontSize: 13, color: '#4A5A78', lineHeight: 1.7, marginTop: 6 }}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ border: '1px solid #E8ECF3', borderRadius: 6, padding: '24px 28px', fontSize: 13, color: '#4A5A78', lineHeight: 1.9 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F', marginBottom: 12 }}>《心理测评知情同意书》</div>
      <p style={{ margin: '0 0 12px' }}><strong>一、测评目的</strong><br/>本次测评旨在帮助您了解自身心理健康状态，建立个人心理基线档案，并为您提供个性化的心理支持建议。</p>
      <p style={{ margin: '0 0 12px' }}><strong>二、保密条款</strong><br/>1. 您的测评结果仅您本人可见；<br/>2. 数据由第三方 EAP 机构独立存储，企业人事、行政、您的直接上级均无权访问原始数据；<br/>3. 仅在您签署额外授权后，才可向指定咨询师分享测评结果；<br/>4. 聚合数据（部门级别）会用于内部心理健康趋势分析，但已完全脱敏。</p>
      <p style={{ margin: '0 0 12px' }}><strong>三、异常情况处理</strong><br/>若测评结果显示您可能存在严重的心理困扰或自伤自杀风险，EAP 咨询师将主动通过系统内消息联系您，此过程<strong>不会通知任何管理者</strong>。</p>
      <p style={{ margin: '0 0 12px' }}><strong>四、您的权利</strong><br/>1. 随时中止测评；<br/>2. 随时申请删除您的全部数据；<br/>3. 申请导出个人测评报告；<br/>4. 对结果解读申请免费复议咨询。</p>
      <p style={{ margin: '0 0 12px' }}><strong>五、数据保存期限</strong><br/>您的原始测评数据保存 3 年，之后自动匿名化归档。</p>
      <p style={{ margin: 0 }}>如有疑问，请发送邮件至 privacy@eap-service.com。</p>
    </div>
  </>
);

const ConsentModal = ({ open, onClose, primary }) => {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gxa-consent-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10, 30, 66, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, boxSizing: 'border-box',
      }}
    >
      <div
        className="gxa-consent-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, maxHeight: 'min(88vh, 900px)',
          background: '#fff', borderRadius: 10, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(15,46,95,.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 22px', borderBottom: '1px solid #E8ECF3', flexShrink: 0 }}>
          <h3 id="gxa-consent-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>
            心理测评知情同意书
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              background: '#FBFAF7', border: '1px solid #E8ECF3', color: '#4A5A78',
              width: 36, height: 36, borderRadius: 6, cursor: 'pointer', fontSize: 18, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px 22px 28px', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <ConsentDocumentBody primary={primary}/>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #E8ECF3', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: primary, color: '#fff', border: 'none',
              padding: '10px 22px', borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            我已阅读
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Step 2: 基础信息（含知情同意勾选） ====================
const DEFAULT_REQUIRED_FIELDS = ['empNo', 'name', 'gender', 'age', 'dept', 'post', 'category', 'workLoc'];
const DEFAULT_VISIBLE_FIELDS = [
  'empNo', 'name', 'gender', 'age', 'edu', 'joinDate',
  'dept', 'post', 'category', 'workLoc',
  'livingStatus', 'hasFamily',
];

const StepBasic = ({ primary, primaryDark, onNext, onBack, visibleFields, customFields, form, setForm }) => {
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [consentOpen, setConsentOpen] = React.useState(false);
  const shown = Array.isArray(visibleFields) && visibleFields.length > 0
    ? DEFAULT_VISIBLE_FIELDS.filter((id) => visibleFields.includes(id))
    : DEFAULT_VISIBLE_FIELDS;
  const show = (id) => shown.includes(id);
  const showPersonal = ['empNo', 'name', 'gender', 'age', 'edu', 'joinDate'].some(show);
  const showJob = ['dept', 'post', 'category', 'workLoc'].some(show);
  const showLife = ['livingStatus', 'hasFamily'].some(show);
  const customList = Array.isArray(customFields) ? customFields : [];
  const shownCustom = Array.isArray(visibleFields)
    ? customList.filter((field) => field?.id && visibleFields.includes(field.id))
    : [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const required = DEFAULT_REQUIRED_FIELDS.filter((id) => show(id));
  const isValid = required.every(k => form[k]);
  const canProceed = isValid && consentChecked;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <StepIntro
        eyebrow="第 1 步 · 基础信息（约 3 分钟）"
        title="填写你的基本信息"
        desc="这些信息将用于生成更精准的适配报告 · 已脱敏加密存储"
        primary={primary}
      />

      <div className="gxa-consent-card" style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        {showPersonal && (
          <>
            <FormGroupTitle primary={primary} icon="edit">个人信息</FormGroupTitle>
            <div className="gxa-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {show('empNo') && (
                <FormField label="工号" required={required.includes('empNo')}>
                  <input type="text" placeholder="例如 CSCEC-3B-20260901" value={form.empNo} onChange={e => set('empNo', e.target.value)} style={fieldStyle}/>
                </FormField>
              )}
              {show('name') && (
                <FormField label="姓名" required={required.includes('name')}>
                  <input type="text" placeholder="请输入真实姓名" value={form.name} onChange={e => set('name', e.target.value)} style={fieldStyle}/>
                </FormField>
              )}
              {show('gender') && (
                <FormField label="性别" required={required.includes('gender')}>
                  <SegmentedControl options={['男', '女', '不愿透露']} value={form.gender} onChange={v => set('gender', v)} primary={primary}/>
                </FormField>
              )}
              {show('age') && (
                <FormField label="年龄" required={required.includes('age')}>
                  <SegmentedControl options={['≤22', '23-28', '29-35', '36-45', '46+']} value={form.age} onChange={v => set('age', v)} primary={primary}/>
                </FormField>
              )}
              {show('edu') && (
                <FormField label="学历">
                  <Select value={form.edu} onChange={v => set('edu', v)} options={['大专', '本科', '硕士', '博士', '其他']}/>
                </FormField>
              )}
              {show('joinDate') && (
                <FormField label="到岗日期">
                  <input type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} style={fieldStyle}/>
                </FormField>
              )}
            </div>
          </>
        )}

        {showJob && (
          <>
            <FormGroupTitle primary={primary} icon="building" style={{ marginTop: showPersonal ? 32 : 0 }}>岗位信息</FormGroupTitle>
            <div className="gxa-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {show('dept') && (
                <FormField label="所属部门" required={required.includes('dept')}>
                  <input type="text" placeholder="例如 人力资源部 / 产品研发部" value={form.dept} onChange={e => set('dept', e.target.value)} style={fieldStyle}/>
                </FormField>
              )}
              {show('post') && (
                <FormField label="岗位" required={required.includes('post')}>
                  <input type="text" placeholder="例如 产品经理 / 行政专员" value={form.post} onChange={e => set('post', e.target.value)} style={fieldStyle}/>
                </FormField>
              )}
              {show('category') && (
                <FormField label="岗位类别" required={required.includes('category')}>
                  <SegmentedControl options={['一线业务', '项目管理', '职能支持', '技术研发']} value={form.category} onChange={v => set('category', v)} primary={primary}/>
                </FormField>
              )}
              {show('workLoc') && (
                <FormField label="工作地" required={required.includes('workLoc')}>
                  <SegmentedControl options={['办公现场', '公司本部', '远程办公']} value={form.workLoc} onChange={v => set('workLoc', v)} primary={primary}/>
                </FormField>
              )}
            </div>
          </>
        )}

        {showLife && (
          <>
            <FormGroupTitle primary={primary} icon="heart" style={{ marginTop: (showPersonal || showJob) ? 32 : 0 }}>
              生活情况 <span style={{ fontSize: 11, color: '#8B96A8', fontWeight: 400, marginLeft: 8 }}>选填 · 用于识别支持系统</span>
            </FormGroupTitle>
            <div className="gxa-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {show('livingStatus') && (
                <FormField label="居住状况">
                  <SegmentedControl options={['与家人同住', '独居', '单位宿舍', '合租']} value={form.livingStatus} onChange={v => set('livingStatus', v)} primary={primary}/>
                </FormField>
              )}
              {show('hasFamily') && (
                <FormField label="是否与家人异地">
                  <SegmentedControl options={['同城', '异地', '暂无家人']} value={form.hasFamily} onChange={v => set('hasFamily', v)} primary={primary}/>
                </FormField>
              )}
            </div>
          </>
        )}

        {shownCustom.length > 0 && (
          <>
            <FormGroupTitle primary={primary} icon="edit" style={{ marginTop: (showPersonal || showJob || showLife) ? 32 : 0 }}>
              自定义字段
            </FormGroupTitle>
            <div className="gxa-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {shownCustom.map((field) => (
                <FormField key={field.id} label={field.label}>
                  <input
                    type="text"
                    placeholder={`请输入${field.label}`}
                    value={form[field.id] || ''}
                    onChange={e => set(field.id, e.target.value)}
                    style={fieldStyle}
                  />
                </FormField>
              ))}
            </div>
          </>
        )}

        {/* 知情同意：链接阅读 + 勾选确认 */}
        <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #E8ECF3' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F', marginBottom: 12 }}>知情同意</div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#4A5A78', lineHeight: 1.7 }}>
            请先阅读
            <button
              type="button"
              onClick={() => setConsentOpen(true)}
              style={{
                background: 'none', border: 'none', padding: 0, margin: '0 2px',
                color: primary, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}
            >
              《知情同意书》
            </button>
            ，了解测评目的、保密原则与您的权利后再勾选确认。
          </p>
          <label
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              padding: 16, background: consentChecked ? `${primary}08` : '#FBFAF7',
              borderRadius: 6,
              border: consentChecked ? `1.5px solid ${primary}40` : '1.5px solid transparent',
              transition: 'all .2s',
            }}
          >
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: primary, flexShrink: 0 }}
            />
            <div style={{ fontSize: 14, color: '#0F2E5F', lineHeight: 1.7 }}>
              我已仔细阅读并<strong>同意</strong>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConsentOpen(true); }}
                style={{
                  background: 'none', border: 'none', padding: 0, margin: '0 2px',
                  color: primary, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                《知情同意书》
              </button>
              全部条款。我理解本次测评的目的、保密原则、我的权利，并自愿参与本次测评。
            </div>
          </label>
        </div>
      </div>

      <StepActions onBack={onBack} onNext={onNext} nextDisabled={!canProceed} primary={primary} nextLabel="进入量表作答 →"/>

      {!canProceed && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#8B96A8' }}>
          {!isValid && required.length > 0 ? '请完成所有带 * 的必填项' : null}
          {!isValid && required.length > 0 && !consentChecked ? '，并' : null}
          {!consentChecked ? '勾选同意《知情同意书》后继续' : null}
        </div>
      )}

      <ConsentModal open={consentOpen} onClose={() => setConsentOpen(false)} primary={primary}/>
    </div>
  );
};

// ==================== Step 4: 量表作答 ====================
const SCALES = [
  {
    id: 'scl90',
    name: 'SCL-90 症状自评（简版）',
    subtitle: '整体心理健康筛查',
    dur: '12 分钟',
    total: 45,
    demoTotal: 6, // 页面展示的题数
    scale: 'likert5',
    scaleLabels: ['从无', '轻度', '中度', '偏重', '严重'],
    question: '在最近一个月内，你有以下感受吗？',
    items: [
      '感到紧张或容易紧张',
      '感到与他人格格不入，缺少支持',
      '容易担忧一些琐碎的事',
      '感到做事困难，注意力不集中',
      '入睡困难或睡眠质量差',
      '感到疲乏无力',
    ],
  },
  {
    id: 'mbti',
    name: 'MBTI 人格倾向（30 题精简版）',
    subtitle: '性格画像与团队协作风格',
    dur: '8 分钟',
    total: 30,
    demoTotal: 4,
    scale: 'binary',
    question: '在两个选项中，选择更接近你的一项',
    items: [
      { a: '我倾向于从与人交流中获得能量', b: '我倾向于独处后感觉充电' },
      { a: '我更关注具体的事实和细节', b: '我更关注可能性与整体图景' },
      { a: '我倾向于用逻辑分析做决定', b: '我倾向于考虑对人的影响做决定' },
      { a: '我喜欢有明确的计划和结论', b: '我喜欢保持开放和灵活' },
    ],
  },
  {
    id: 'adapt',
    name: '工作适应性问卷',
    subtitle: '岗位适应度评估',
    dur: '5 分钟',
    total: 20,
    demoTotal: 5,
    scale: 'likert5',
    scaleLabels: ['完全不同意', '不太同意', '一般', '比较同意', '完全同意'],
    question: '请评估你对以下描述的认同程度',
    items: [
      '我对未来 3 个月的工作内容有比较清晰的了解',
      '我认为我目前的岗位与我的能力和兴趣相匹配',
      '我能适应当前岗位的工作节奏',
      '我与同事的沟通与协作比较顺畅',
      '我感到我可以从领导那里获得必要的指导',
    ],
  },
  {
    id: 'ssrs',
    name: '社会支持评定量表 (SSRS)',
    subtitle: '家庭 / 同事 / 组织支持系统',
    dur: '4 分钟',
    total: 10,
    demoTotal: 4,
    scale: 'likert5',
    scaleLabels: ['完全没有', '很少', '一般', '较多', '非常多'],
    question: '当你遇到困难时，能获得以下方面的支持吗？',
    items: [
      '来自家人的情感支持',
      '来自密友或同事的倾听与理解',
      '来自单位/领导的关心与照顾',
      '来自专业机构（如 EAP、心理咨询）的帮助',
    ],
  },
  {
    id: 'psqi',
    name: 'PSQI 睡眠质量指数',
    subtitle: '一线员工重点关注 · 可选',
    dur: '3 分钟',
    total: 9,
    demoTotal: 4,
    scale: 'likert4',
    scaleLabels: ['很好', '较好', '较差', '很差'],
    question: '近一个月，请评价以下方面',
    items: [
      '你对整体睡眠质量的评价',
      '入睡通常需要的时间',
      '每晚实际睡眠时长',
      '白天精神状态与工作效率',
    ],
    optional: true,
  },
];

const StepScale = ({
  scales,
  primary,
  primaryDark,
  scaleIdx,
  setScaleIdx,
  answersByScale,
  setScaleAnswer,
  onComplete,
  onBack,
}) => {
  const safeIdx = Math.min(Math.max(scaleIdx, 0), Math.max(scales.length - 1, 0));
  const scale = scales[safeIdx];
  const scaleId = scale?.id || `scale-${safeIdx}`;
  const answers = answersByScale[scaleId] || {};
  const answerKey = (item, i) => (scale?.scale === 'dynamic' && item?.id != null ? item.id : i);
  const answered = (scale?.items || []).filter((item, i) => {
    const key = answerKey(item, i);
    return answers[key] != null && answers[key] !== '';
  }).length;
  const demoTotal = Math.max(Number(scale?.demoTotal) || 0, 1);
  const isComplete = answered >= demoTotal;

  const setAns = (item, i, v) => setScaleAnswer(scaleId, answerKey(item, i), v);

  React.useEffect(() => {
    if (safeIdx !== scaleIdx) setScaleIdx(safeIdx);
  }, [safeIdx, scaleIdx, setScaleIdx]);

  if (!scale) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 40, textAlign: 'center', color: '#8B96A8' }}>
        暂无可用量表，请返回上一页或联系管理员。
      </div>
    );
  }

  const nextScale = () => {
    if (safeIdx < scales.length - 1) {
      setScaleIdx(safeIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete();
    }
  };
  const prevScale = () => {
    if (safeIdx > 0) {
      setScaleIdx(safeIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 量表切换指示 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {scales.map((s, i) => (
          <div key={s.id || i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < safeIdx ? primary : (i === safeIdx ? `linear-gradient(90deg, ${primary} ${(answered / demoTotal) * 100}%, #E8ECF3 ${(answered / demoTotal) * 100}%)` : '#E8ECF3'),
          }}/>
        ))}
      </div>

      <StepIntro
        eyebrow={`第 3 步 · 量表 ${safeIdx + 1} / ${scales.length}`}
        title={scale.name}
        desc={scale.subtitle}
        meta={[`共 ${scale.total} 题`, `约 ${scale.dur}`]}
        primary={primary}
      />

      <div className="gxa-scale-card" style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        <div className="gxa-scale-prompt" style={{ fontSize: 15, color: '#0F2E5F', fontWeight: 600, marginBottom: 24, padding: '14px 18px', background: `${primary}08`, borderLeft: `3px solid ${primary}`, borderRadius: 4, lineHeight: 1.7 }}>
          {scale.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(scale.items || []).map((item, i) => {
            const qKey = answerKey(item, i);
            const selected = answers[qKey];
            const optionCount = Math.min((item.options || []).length || 1, 5);
            return (
            <div key={item?.id || i} style={{ padding: '20px 16px 24px', background: '#FBFAF7', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {i + 1}
                </div>
                {scale.scale === 'dynamic' ? (
                  <div className="gxa-scale-question-text" style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.text}</div>
                ) : scale.scale === 'binary' ? (
                  <div className="gxa-scale-question-text" style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7 }}>请选择更符合你的选项</div>
                ) : (
                  <div className="gxa-scale-question-text" style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item}</div>
                )}
              </div>

              {scale.scale === 'dynamic' ? (
                <div
                  className="gxa-scale-options"
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))`, gap: 8, paddingLeft: 38 }}
                >
                  {(item.options || []).map((option, oi) => (
                    <button key={option.id || oi} onClick={() => setAns(item, i, option.id || oi)} style={{
                      padding: '12px 8px', textAlign: 'center',
                      background: selected === (option.id || oi) ? primary : '#fff',
                      color: selected === (option.id || oi) ? '#fff' : '#4A5A78',
                      border: selected === (option.id || oi) ? `1.5px solid ${primary}` : '1.5px solid #E8ECF3',
                      borderRadius: 4, cursor: 'pointer', fontSize: 13,
                      whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.45,
                      minWidth: 0,
                    }}>
                      {option.label || option.text}
                    </button>
                  ))}
                </div>
              ) : scale.scale === 'binary' ? (
                <div className="gxa-scale-options-binary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[item.a, item.b].map((opt, oi) => (
                    <button key={oi} onClick={() => setAns(item, i, oi)} style={{
                      padding: '18px 20px', textAlign: 'left',
                      background: selected === oi ? `${primary}12` : '#fff',
                      border: selected === oi ? `1.5px solid ${primary}` : '1.5px solid #E8ECF3',
                      color: selected === oi ? '#0F2E5F' : '#4A5A78',
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 14, lineHeight: 1.7,
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      transition: 'all .2s',
                      minWidth: 0,
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${selected === oi ? primary : '#D0D6E0'}`,
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>
                        {selected === oi && <div style={{ width: 10, height: 10, borderRadius: '50%', background: primary }}/>}
                      </div>
                      <span style={{ minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="gxa-scale-options-likert"
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${scale.scaleLabels.length}, minmax(0, 1fr))`, gap: 8, paddingLeft: 38 }}
                >
                  {scale.scaleLabels.map((lbl, li) => (
                    <button key={li} onClick={() => setAns(item, i, li)} style={{
                      padding: '12px 8px', textAlign: 'center',
                      background: selected === li ? primary : '#fff',
                      color: selected === li ? '#fff' : '#4A5A78',
                      border: selected === li ? `1.5px solid ${primary}` : '1.5px solid #E8ECF3',
                      borderRadius: 4, cursor: 'pointer',
                      fontSize: 13, fontWeight: selected === li ? 600 : 400,
                      transition: 'all .2s',
                      whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.45,
                      minWidth: 0,
                    }}>
                      <div style={{ fontSize: 15, marginBottom: 4, fontWeight: 600 }}>{li + 1}</div>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: `${primary}08`, borderRadius: 4, fontSize: 12, color: '#4A5A78', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={14} color={primary}/>
          进度自动保存 · 已答 {answered} / {demoTotal} 题
        </div>
      </div>

      <StepActions
        onBack={prevScale}
        onNext={nextScale}
        nextDisabled={!isComplete}
        primary={primary}
        backLabel={safeIdx === 0 ? '返回基础信息' : `上一个量表`}
        nextLabel={safeIdx === scales.length - 1 ? '提交量表 →' : `下一个量表 →`}
      />
    </div>
  );
};

// ==================== Step 5: 完成提交 ====================
const StepComplete = ({ primary, primaryDark, accent, onNext, canProceed, error, onRetry }) => {
  React.useEffect(() => {
    if (!canProceed) return undefined;
    const t = setTimeout(onNext, error ? 1600 : 3000);
    return () => clearTimeout(t);
  }, [canProceed, onNext, error]);

  return (
    <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
      {/* 圆环动画 */}
      <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 32px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 20px 40px -10px ${primary}66`,
        }}>
          <Icon name="check" size={64} color="#fff"/>
        </div>
        <div style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          border: `2px solid ${primary}30`,
          animation: 'onbPulse 2s ease-out infinite',
        }}/>
      </div>

      <h1 className="gxa-step-intro-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 42, fontWeight: 700, color: '#0F2E5F', margin: 0, letterSpacing: 2, wordBreak: 'break-word', overflowWrap: 'anywhere', padding: '0 12px' }}>
        测评已完成，感谢你的信任
      </h1>
      <p style={{ fontSize: 16, color: '#4A5A78', margin: '16px 0 8px', lineHeight: 1.8 }}>
        {error
          ? '真实答卷未能保存到服务器，正在生成模拟报告预览……'
          : (canProceed ? '你的心理档案正在生成中，请稍候……' : '正在保存你的量表结果，请稍候……')}
      </p>
      <p style={{ fontSize: 13, color: error ? '#C8161D' : '#8B96A8' }}>
        {error
          ? `保存未成功：${error}。不影响查看模拟结果。`
          : '通常需要 3-5 秒 · 报告将展示模拟维度图表与建议'}
      </p>

      {/* Loading 进度条 */}
      <div style={{ maxWidth: 380, margin: '32px auto 0', height: 4, background: '#E8ECF3', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: `linear-gradient(90deg, ${primary}, ${primaryDark})`,
          animation: 'onbProgress 3s ease-out forwards',
        }}/>
      </div>

      <style>{`
        @keyframes onbPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes onbProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

function mockReportNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `DEMO-${y}${m}${d}`;
}

function mockReportTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function mockLevelByScore(score) {
  if (score >= 80) return { level: '良好', color: '#22A879' };
  if (score >= 70) return { level: '一般偏好', color: '#1E4C9A' };
  if (score >= 60) return { level: '一般', color: '#F5B547' };
  return { level: '需关注', color: '#C8161D' };
}

const MOCK_PORTRAIT_DIMENSIONS = [
  { name: '心理健康', score: 82, note: '模拟结果：整体情绪平稳，抗压能力较强。' },
  { name: '性格倾向', score: 76, note: '模拟结果：协作意愿较强，适合团队沟通角色。' },
  { name: '工作适应', score: 68, note: '模拟结果：对新岗位仍需适应期，建议加强导师沟通。' },
  { name: '睡眠质量', score: 62, note: '模拟结果：入睡时间较长，建议关注作息。' },
  { name: '社会支持', score: 78, note: '模拟结果：家庭与同事支持系统较完善。' },
  { name: '压力承受', score: 74, note: '模拟结果：整体压力适应度良好。' },
];

function wrapRadarLabel(name, maxChars = 5) {
  const text = String(name || '').trim() || '维度';
  const lines = [];
  for (let index = 0; index < text.length; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }
  return lines.slice(0, 2);
}

function buildMockDimensions(primary, accent) {
  return MOCK_PORTRAIT_DIMENSIONS.map((item, index) => {
    const tone = mockLevelByScore(item.score);
    return {
      name: item.name,
      score: item.score,
      level: tone.level,
      color: item.score >= 80 ? '#22A879' : item.score >= 70 ? primary : item.score >= 60 ? '#F5B547' : accent,
      angle: -90 + index * 60,
      note: item.note,
    };
  });
}

function buildMockSuggestions(dimensions) {
  const lowest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const highest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  return [
    {
      icon: 'clock',
      title: `关注${lowest?.name || '当前状态'}`,
      desc: `这是模拟报告。根据演示数据，${lowest?.name || '该维度'}相对偏低。建议先观察作息、压力与支持系统，再按需使用 EAP 资源。`,
      action: '查看自我调节建议',
    },
    {
      icon: 'group',
      title: '主动建立支持网络',
      desc: '这是模拟报告。建议主动参加团队活动或同事交流，扩展可求助的支持网络。',
      action: '查看近期活动',
    },
    {
      icon: 'sparkle',
      title: `发挥${highest?.name || '现有优势'}`,
      desc: `这是模拟报告。演示数据中${highest?.name || '该维度'}表现较好，可在岗位适应和团队协作中继续发挥。`,
      action: '了解优势用法',
    },
  ];
}

// ==================== Step 6: 报告预览 ====================
const StepReport = ({ scales, assessmentCount, questionCount, primary, primaryDark, accent, warm, companyName, siteName, homeHref, submitError }) => {
  const dimensions = buildMockDimensions(primary, accent);
  const overallScore = Math.round(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length);
  const overallTone = mockLevelByScore(overallScore);
  const suggestions = buildMockSuggestions(dimensions);
  const reportNo = mockReportNo();
  const reportTime = mockReportTime();

  return (
    <div className="gxa-report-page" style={{ maxWidth: 1080, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {submitError ? (
        <div className="gxa-report-alert" style={{ marginBottom: 16, padding: '14px 18px', background: '#FFF6F4', border: '1px solid #F3C6C2', borderRadius: 6, color: '#8A2F2A', fontSize: 13, lineHeight: 1.7, wordBreak: 'break-word' }}>
          真实答卷未能保存到服务器（{submitError}）。下面是模拟报告，分数和建议不根据本次作答计算。
        </div>
      ) : null}
      {/* 报告头 */}
      <div className="gxa-report-banner" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`, borderRadius: 8, padding: '44px 44px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }}/>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)' }}/>

        <div className="gxa-report-hero" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div className="gxa-report-hero-copy" style={{ minWidth: 0 }}>
            <div className="gxa-report-kicker" style={{ fontSize: 12, opacity: .8, letterSpacing: 1, marginBottom: 12, wordBreak: 'break-word' }}>YOUR PSYCHOLOGICAL BASELINE · 模拟报告预览</div>
            <h1 className="gxa-report-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: 1, lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              你的心理测评报告
            </h1>
            <div className="gxa-report-sub" style={{ opacity: .85, fontSize: 18, fontWeight: 500, marginTop: 10, lineHeight: 1.55, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              本页为模拟结果
              <span className="gxa-report-sub-sep"> · </span>
              <span className="gxa-report-no">报告编号 {reportNo}</span>
            </div>
            <div className="gxa-report-meta" style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 13, opacity: .85, flexWrap: 'wrap' }}>
              <span>生成于 {reportTime}</span>
              <span className="gxa-report-meta-dot">·</span>
              <span>基于 {assessmentCount} 个真实量表 · {questionCount} 项作答</span>
              <span className="gxa-report-meta-dot">·</span>
              <span>分数与解读为演示数据，不根据本次作答计分</span>
            </div>
          </div>
          {/* 综合分环 */}
          <div className="gxa-report-score" style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10"/>
              <circle cx="80" cy="80" r="66" fill="none" stroke="#fff" strokeWidth="10"
                strokeDasharray={`${(overallScore / 100) * 414} 414`}
                strokeLinecap="round" transform="rotate(-90 80 80)"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="gxa-report-score-num" style={{ fontSize: 42, fontWeight: 700, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>{overallScore}</div>
              <div style={{ fontSize: 11, opacity: .8, letterSpacing: 1, marginTop: 4 }}>综合评分 / 100</div>
              <div style={{ fontSize: 11, marginTop: 4, background: 'rgba(255,255,255,.15)', padding: '2px 10px', borderRadius: 3 }}>{overallTone.level}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 雷达图 + 维度详情 */}
      <div className="gxa-report-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 24 }}>
        {/* 雷达图 */}
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)', minWidth: 0, overflow: 'hidden' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>模拟心理画像</h3>
          <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>固定六维演示画像，分数为模拟数据</p>
          <div className="gxa-report-radar">
            <RadarChart dimensions={dimensions} primary={primary}/>
          </div>
        </div>

        {/* 维度分数列表 */}
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)', minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>各维度详解</h3>
          <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>解读为模拟文案，便于预览报告样式</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dimensions.map(d => (
              <div key={d.name} style={{ padding: '14px 0', borderBottom: '1px solid #F0EBE0' }}>
                <div className="gxa-report-dim-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }}/>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F' }}>{d.name}</span>
                    <span style={{ fontSize: 11, color: d.color, background: `${d.color}12`, padding: '2px 8px', borderRadius: 3 }}>{d.level}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: d.color, fontFamily: '"Noto Serif SC", serif', flexShrink: 0 }}>{d.score}</span>
                </div>
                <div style={{ fontSize: 12, color: '#4A5A78', lineHeight: 1.6, paddingLeft: 18, wordBreak: 'break-word' }}>{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {Array.isArray(scales) && scales.length > 0 ? (
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 24, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)', fontSize: 13, color: '#4A5A78', lineHeight: 1.8, wordBreak: 'break-word' }}>
          本次作答来自 {scales.length} 个真实量表：{scales.map((scale) => scale.name || scale.id).filter(Boolean).join('、')}。上方画像不按这些量表的真实计分规则计算。
        </div>
      ) : null}

      {/* 个性化建议 */}
      <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <Icon name="sparkle" size={22} color={primary}/>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>给你的 3 条个性化建议</h3>
        </div>
        <p style={{ fontSize: 13, color: '#4A5A78', margin: '0 0 24px' }}>建议内容为模拟生成，仅用于展示报告样式</p>

        <div className="gxa-report-tips" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: 24, background: warm, borderRadius: 6, position: 'relative', minWidth: 0 }}>
              <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 42, opacity: .1, color: primary, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>{i + 1}</div>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name={s.icon} size={22}/>
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', wordBreak: 'break-word' }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: '#4A5A78', lineHeight: 1.8, marginTop: 8, wordBreak: 'break-word' }}>{s.desc}</p>
              <a href="#" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: primary, fontWeight: 500, textDecoration: 'none' }}>
                {s.action} <Icon name="arrow" size={12}/>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 操作栏 */}
      <div className="gxa-report-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
        <button style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
          <Icon name="edit" size={14}/> 下载完整报告 PDF
        </button>
        <button style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
          <Icon name="chat" size={14}/> 就报告结果咨询
        </button>
        <a href={homeHref} style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', boxSizing: 'border-box' }}>
          返回{siteName}首页 <Icon name="arrow" size={14}/>
        </a>
      </div>

      {/* 保密提示 */}
      <div className="gxa-report-about" style={{ marginTop: 32, padding: '20px 24px', background: '#FBFAF7', borderRadius: 6, borderLeft: `3px solid ${primary}`, fontSize: 13, color: '#4A5A78', lineHeight: 1.8, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        <strong style={{ color: '#0F2E5F' }}>关于本报告 · </strong>
        本页分数、等级和建议为模拟结果，不根据本次真实作答计算。
      </div>
    </div>
  );
};

// ==================== 雷达图组件 ====================
const RadarChart = ({ dimensions, primary }) => {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 118;
  const angles = dimensions.map(d => (d.angle * Math.PI) / 180);

  const points = dimensions.map((d, i) => {
    const r = (d.score / 100) * maxR;
    return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
  });
  const pointsStr = points.map(p => p.join(',')).join(' ');

  const axisEnd = angles.map(a => [cx + maxR * Math.cos(a), cy + maxR * Math.sin(a)]);
  const labelPos = angles.map(a => [cx + (maxR + 36) * Math.cos(a), cy + (maxR + 36) * Math.sin(a)]);

  return (
    <div className="gxa-report-radar-inner" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block' }}>
        {/* 背景圆 */}
        {[100, 75, 50, 25].map(v => {
          const r = (v / 100) * maxR;
          const grid = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          return <polygon key={v} points={grid.map(p => p.join(',')).join(' ')} fill="none" stroke="#E8ECF3" strokeWidth="0.7"/>;
        })}
        {/* 分数刻度 */}
        <text x={cx + 6} y={cy - maxR + 4} fontSize="9" fill="#8B96A8">100</text>
        <text x={cx + 6} y={cy - maxR*0.5 + 4} fontSize="9" fill="#8B96A8">50</text>
        {/* 轴线 */}
        {axisEnd.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#E8ECF3" strokeWidth="0.7"/>
        ))}
        {/* 数据多边形 */}
        <polygon points={pointsStr} fill={`${primary}25`} stroke={primary} strokeWidth="2"/>
        {/* 数据点 */}
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#fff" stroke={primary} strokeWidth="2.5"/>
        ))}
        {/* 分数标签 */}
        {points.map((p, i) => {
          const outward = 16;
          const x = p[0] + Math.cos(angles[i]) * 4;
          const y = p[1] + Math.sin(angles[i]) * 4 - outward;
          return (
            <text key={i} x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="700" fill={primary}>{dimensions[i].score}</text>
          );
        })}
        {/* 维度名 */}
        {labelPos.map((p, i) => {
          const lines = wrapRadarLabel(dimensions[i].name);
          return (
            <text key={i} x={p[0]} y={p[1] - ((lines.length - 1) * 7)} textAnchor="middle" fontSize="12" fontWeight="600" fill="#0F2E5F">
              {lines.map((line, lineIndex) => (
                <tspan key={line} x={p[0]} dy={lineIndex === 0 ? 0 : 14}>{line}</tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// ==================== 复用小组件 ====================
const StepIntro = ({ eyebrow, title, desc, meta, primary }) => (
  <div className="gxa-step-intro" style={{ textAlign: 'center', padding: '0 4px' }}>
    <div className="gxa-step-intro-eyebrow" style={{ fontSize: 12, color: primary, letterSpacing: 1, marginBottom: 12, fontWeight: 500, wordBreak: 'break-word' }}>{eyebrow.toUpperCase()}</div>
    <h1 className="gxa-step-intro-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 34, fontWeight: 700, margin: 0, color: '#0F2E5F', letterSpacing: 2, lineHeight: 1.3, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{title}</h1>
    {desc ? (
      <p className="gxa-step-intro-desc" style={{ fontSize: 14, color: '#4A5A78', marginTop: 12, lineHeight: 1.8, wordBreak: 'break-word' }}>{desc}</p>
    ) : null}
    {Array.isArray(meta) && meta.length > 0 ? (
      <div className="gxa-step-intro-meta" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 14px', marginTop: desc ? 8 : 12, fontSize: 13, color: '#4A5A78', lineHeight: 1.6 }}>
        {meta.map((item, i) => (
          <React.Fragment key={`${item}-${i}`}>
            {i > 0 ? <span className="gxa-step-intro-meta-dot" aria-hidden="true">·</span> : null}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    ) : null}
  </div>
);

const StepActions = ({ onBack, onNext, nextDisabled, primary, backLabel = '上一步', nextLabel = '下一步 →' }) => (
  <div className="gxa-step-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 16 }}>
    <button onClick={onBack} style={{
      background: 'transparent', color: '#4A5A78', border: '1px solid #D0D6E0',
      padding: '14px 26px', borderRadius: 4, fontSize: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>← {backLabel}</button>
    <button onClick={onNext} disabled={nextDisabled} style={{
      background: nextDisabled ? '#D0D6E0' : primary, color: '#fff', border: 'none',
      padding: '14px 32px', borderRadius: 4, fontSize: 15, cursor: nextDisabled ? 'not-allowed' : 'pointer',
      fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: nextDisabled ? 'none' : `0 8px 20px -8px ${primary}66`,
      transition: 'all .2s',
    }}>{nextLabel}</button>
  </div>
);

const FormGroupTitle = ({ children, primary, icon, style = {} }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, ...style }}>
    <div style={{ width: 32, height: 32, borderRadius: 6, background: `${primary}0C`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={16}/>
    </div>
    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>{children}</h4>
  </div>
);

const FormField = ({ label, required, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, color: '#4A5A78', marginBottom: 6, fontWeight: 500 }}>
      {label}{required && <span style={{ color: '#C8161D', marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);

const fieldStyle = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid #E0E4EC',
  borderRadius: 4,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  color: '#0F2E5F',
  background: '#fff',
  boxSizing: 'border-box',
};

const SegmentedControl = ({ options, value, onChange, primary }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)} style={{
        background: value === opt ? primary : '#fff',
        color: value === opt ? '#fff' : '#4A5A78',
        border: value === opt ? `1px solid ${primary}` : '1px solid #E0E4EC',
        padding: '9px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
        fontWeight: value === opt ? 500 : 400,
        transition: 'all .15s',
      }}>{opt}</button>
    ))}
  </div>
);

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ ...fieldStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%234A5A78\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}>
    <option value="">请选择</option>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

export default OnboardingAssessment;
export { OnboardingAssessment };
