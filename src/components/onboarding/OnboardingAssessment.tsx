// @ts-nocheck
'use client';

import React from 'react';
import { Icon } from '@/components/shared/data';
import { SiteBeian } from '@/components/shared/SiteBeian';
import { submitEnterpriseOnboardingReports } from '@/lib/enterprise-assessments';
// 访客标识与知识库学习回传共用（localStorage `onb-visitor-{slug}`），后台据此把学习记录归到同一份员工档案
import { createVisitorKey } from '@/lib/enterprise-learning';
import {
  getOnboardingQuestionInputType,
  isDynamicQuestionAnswered,
  isOnboardingQuestionRequired,
  onboardingFollowUpValue,
  selectedOnboardingOptionId,
  serializeDynamicQuestionAnswer,
} from '@/lib/onboarding-answers';
import type { ThemeTweaks } from '@/lib/tokens';

// 员工心理测评 · 完整流程页面
// 步骤：欢迎 → 基础信息（含知情同意）→ 量表选择 → 单量表作答 → 量表结果 → 返回继续选择

const EMPTY_BASIC_FORM = {
  empNo: '', name: '', gender: '', age: '', edu: '',
  dept: '', post: '', category: '',
  workLoc: '', joinDate: '',
  livingStatus: '', hasFamily: '',
};

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
  const storageScope = slug || companyName || 'default';
  const progressKey = `onb-step-${storageScope}`;
  const answersKey = `onb-answers-${storageScope}`;
  const basicKey = `onb-basic-${storageScope}`;
  const visitorKeyStorage = `onb-visitor-${storageScope}`;
  const completedKey = `onb-completed-${storageScope}`;
  const resultsKey = `onb-results-${storageScope}`;
  const allowedSteps = new Set(['welcome', 'basic', 'select', 'scale', 'scaleResult']);

  // 服务端与首屏客户端统一从 welcome 开始，避免 localStorage 造成 hydration 报错
  const [step, setStep] = React.useState('welcome');
  const [activeScaleId, setActiveScaleId] = React.useState('');
  const [answersByScale, setAnswersByScale] = React.useState({});
  const [completedScaleIds, setCompletedScaleIds] = React.useState([]);
  const [resultsByScale, setResultsByScale] = React.useState({});
  const [basicForm, setBasicForm] = React.useState(EMPTY_BASIC_FORM);
  const [visitorKey, setVisitorKey] = React.useState('');
  const [progressReady, setProgressReady] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const submittingRef = React.useRef(false);

  const activeScale = React.useMemo(
    () => activeScales.find((s) => s?.id === activeScaleId) || null,
    [activeScales, activeScaleId],
  );
  const currentResult = resultsByScale[activeScaleId] || null;
  const completedCount = completedScaleIds.length;
  const allDone = activeScales.length > 0 && completedCount >= activeScales.length;
  const reportScales = React.useMemo(() => {
    if (activeScale) return [activeScale];
    return activeScales;
  }, [activeScale, activeScales]);
  const reportQuestionCount = React.useMemo(
    () => reportScales.reduce((sum, scale) => sum + (Array.isArray(scale?.items) ? scale.items.length : Number(scale?.total) || 0), 0),
    [reportScales],
  );

  React.useEffect(() => {
    try {
      let saved = localStorage.getItem(progressKey);
      // 兼容旧流程步骤
      if (saved === 'consent') saved = 'basic';
      if (saved === 'complete' || saved === 'report' || saved === 'scale') saved = 'select';
      if (saved && allowedSteps.has(saved) && saved !== 'scale' && saved !== 'scaleResult') {
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
      const savedCompleted = localStorage.getItem(completedKey);
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        if (Array.isArray(parsed)) setCompletedScaleIds(parsed.map(String));
      }
      const savedResults = localStorage.getItem(resultsKey);
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        if (parsed && typeof parsed === 'object') setResultsByScale(parsed);
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
  }, [progressKey, answersKey, basicKey, visitorKeyStorage, completedKey, resultsKey]);

  React.useEffect(() => {
    if (!progressReady) return;
    try {
      // 作答/结果页不持久化步骤，刷新回到量表选择更安全
      if (step === 'scale' || step === 'scaleResult') {
        localStorage.setItem(progressKey, 'select');
      } else {
        localStorage.setItem(progressKey, step);
      }
    } catch {}
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
    if (!progressReady) return;
    try { localStorage.setItem(completedKey, JSON.stringify(completedScaleIds)); } catch {}
  }, [completedKey, completedScaleIds, progressReady]);

  React.useEffect(() => {
    if (!progressReady) return;
    try { localStorage.setItem(resultsKey, JSON.stringify(resultsByScale)); } catch {}
  }, [resultsKey, resultsByScale, progressReady]);

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
    setAnswersByScale((current) => {
      const nextForScale = { ...(current[scaleId] || {}) };
      if (value === undefined) {
        delete nextForScale[questionKey];
      } else {
        nextForScale[questionKey] = value;
      }
      return {
        ...current,
        [scaleId]: nextForScale,
      };
    });
  }, []);

  const openScale = React.useCallback((scaleId) => {
    setActiveScaleId(scaleId);
    setSubmitError('');
    goto('scale');
  }, []);

  const openScaleResult = React.useCallback((scaleId) => {
    setActiveScaleId(scaleId);
    setSubmitError('');
    goto('scaleResult');
  }, []);

  const buildAnswersForScale = React.useCallback((scale) => {
    const raw = answersByScale[scale.id] || {};
    const answers = {};
    (scale.items || []).forEach((item, index) => {
      const questionId = item?.id || String(index);
      const value = raw[questionId] ?? raw[index];
      if (scale?.scale === 'dynamic' && item && typeof item === 'object') {
        const serialized = serializeDynamicQuestionAnswer(item, value);
        if (serialized !== undefined) {
          answers[questionId] = serialized;
        }
        return;
      }
      if (value != null && value !== '') {
        answers[questionId] = String(value);
      }
    });
    return answers;
  }, [answersByScale]);

  const markScaleCompleted = React.useCallback((scaleId, reportPayload) => {
    setCompletedScaleIds((prev) => (prev.includes(scaleId) ? prev : [...prev, scaleId]));
    if (reportPayload) {
      setResultsByScale((prev) => ({ ...prev, [scaleId]: reportPayload }));
    }
  }, []);

  const handleSingleScaleSubmit = React.useCallback(async () => {
    if (!activeScale?.id || submittingRef.current) return;
    const scale = activeScale;
    const answers = buildAnswersForScale(scale);
    if (scale.scale === 'dynamic') {
      const missingRequired = (scale.items || []).find((item, index) => {
        if (!item || !isOnboardingQuestionRequired(item)) return false;
        const questionId = item.id || String(index);
        return answers[questionId] === undefined;
      });
      if (missingRequired) {
        setSubmitError(`请先完成题目：${missingRequired.text || missingRequired.id}`);
        return;
      }
    } else if (Object.keys(answers).length === 0) {
      setSubmitError('请先完成量表作答');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');

    try {
      // apiBaseUrl 允许为空（同源 /api + Next rewrite）；仅缺 slug 或非动态量表时走演示
      if (!slug || scale.scale !== 'dynamic') {
        const mock = {
          assessmentId: scale.id,
          assessmentTitle: scale.name,
          assessmentSubtitle: scale.subtitle,
          resultSummary: '演示环境：未连接企业测评接口，以下为示意结果。',
          result: {
            type: 'sum',
            totalScore: 72,
            level: '一般偏好',
            summary: '这是本地演示结果，不代表真实计分。连接企业 API 后将展示正式报告。',
          },
        };
        setSubmitError('');
        markScaleCompleted(scale.id, mock);
        goto('scaleResult');
        return;
      }

      const response = await submitEnterpriseOnboardingReports(apiBaseUrl, slug, {
        visitorKey: visitorKey || createVisitorKey(),
        employeeInfo: basicForm,
        reports: [{
          clientSubmissionId: createSubmissionId(),
          assessmentId: scale.id,
          assessmentVersion: Number(scale.version) > 0 ? Number(scale.version) : 1,
          answers,
        }],
      });
      const saved = Array.isArray(response?.reports) ? response.reports[0] : null;
      const reportPayload = {
        assessmentId: scale.id,
        publicId: saved?.publicId,
        assessmentTitle: saved?.assessmentTitle || scale.name,
        assessmentSubtitle: saved?.assessmentSubtitle || scale.subtitle,
        scoringType: saved?.scoringType,
        resultSummary: saved?.resultSummary || '',
        result: saved?.result || null,
      };
      setSubmitError('');
      markScaleCompleted(scale.id, reportPayload);
      goto('scaleResult');
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请稍后重试';
      setSubmitError(message);
      markScaleCompleted(scale.id, {
        assessmentId: scale.id,
        assessmentTitle: scale.name,
        assessmentSubtitle: scale.subtitle,
        resultSummary: '答卷保存失败。若下方有结果，仍可能来自本次本地计分返回。',
        result: null,
      });
      goto('scaleResult');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [
    activeScale,
    apiBaseUrl,
    basicForm,
    buildAnswersForScale,
    markScaleCompleted,
    slug,
    visitorKey,
  ]);

  const showStepper = step === 'basic' || step === 'select' || step === 'scale' || step === 'scaleResult';

  return (
    <div className="gxa-onb-root" style={{
      minHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'visible',
      background: `linear-gradient(180deg, ${warm} 0%, #FBF7F0 40%, #fff 100%)`,
      color: '#1A2846',
      fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    }}>
      <OnbHeader primary={primary} primaryDark={primaryDark} step={step} companyName={companyName} siteName={siteName} logoUrl={logoUrl} homeHref={homeHref}/>

      {showStepper && <OnbStepper primary={primary} step={step}/>}

      <main className="gxa-onb-main" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 40px 120px' }}>
        {step === 'welcome' && (
          <StepWelcome
            assessmentCount={activeScales.length}
            primary={primary}
            primaryDark={primaryDark}
            accent={accent}
            companyName={companyName}
            slogan={slogan}
            onNext={() => goto('basic')}
          />
        )}
        {step === 'basic' && (
          <StepBasic
            primary={primary}
            primaryDark={primaryDark}
            visibleFields={employeeInfoFields}
            customFields={customEmployeeInfoFields}
            form={basicForm}
            setForm={setBasicForm}
            onNext={() => goto('select')}
            onBack={() => goto('welcome')}
          />
        )}
        {step === 'select' && (
          <StepScaleSelect
            scales={activeScales}
            completedScaleIds={completedScaleIds}
            allDone={allDone}
            primary={primary}
            primaryDark={primaryDark}
            homeHref={homeHref}
            onBack={() => goto('basic')}
            onStart={openScale}
            onViewResult={openScaleResult}
          />
        )}
        {step === 'scale' && activeScale && (
          <StepScale
            scale={activeScale}
            primary={primary}
            primaryDark={primaryDark}
            answersByScale={answersByScale}
            setScaleAnswer={setScaleAnswer}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSingleScaleSubmit}
            onBack={() => { setSubmitError(''); goto('select'); }}
          />
        )}
        {step === 'scaleResult' && (
          <StepReport
            report={currentResult}
            scale={activeScale}
            scales={reportScales}
            assessmentCount={Math.max(reportScales.length, 1)}
            questionCount={Math.max(reportQuestionCount, 1)}
            primary={primary}
            primaryDark={primaryDark}
            accent={accent}
            warm={warm}
            companyName={companyName}
            siteName={siteName}
            homeHref={homeHref}
            submitError={submitError}
            onBack={() => { setSubmitError(''); goto('select'); }}
          />
        )}
      </main>

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
const STEP_ORDER = ['basic', 'select', 'scale', 'scaleResult'];
const STEP_LABELS = ['基础信息', '量表选择', '量表作答', '结果查看'];

const OnbStepper = ({ primary, step }) => {
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

// ==================== 量表选择 ====================
const StepScaleSelect = ({
  scales,
  completedScaleIds,
  allDone,
  primary,
  primaryDark,
  homeHref,
  onBack,
  onStart,
  onViewResult,
}) => {
  const doneSet = new Set(completedScaleIds || []);
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <StepIntro
        eyebrow="第 2 步 · 量表选择"
        title="选择要完成的量表"
        desc="以下为本企业授权的测评量表。可按任意顺序作答；完成并提交后可查看该量表结果，再返回继续完成其余量表。"
        meta={[`共 ${scales.length} 个量表`, `已完成 ${doneSet.size} 个`]}
        primary={primary}
      />

      {allDone ? (
        <div style={{
          marginTop: 24, padding: '16px 18px', borderRadius: 8,
          background: `${primary}0C`, border: `1px solid ${primary}30`,
          color: '#0F2E5F', fontSize: 14, lineHeight: 1.7,
        }}>
          全部量表已完成。你可以继续查看任一量表结果，或
          <a href={homeHref} style={{ color: primary, marginLeft: 4, fontWeight: 600 }}>返回首页</a>。
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
        {(scales || []).map((scale, index) => {
          const done = doneSet.has(scale.id);
          return (
            <div
              key={scale.id || index}
              style={{
                background: '#fff',
                borderRadius: 8,
                border: `1px solid ${done ? `${primary}40` : '#E8ECF3'}`,
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                boxShadow: '0 2px 16px rgba(15,46,95,.04)',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? primary : `${primary}12`,
                    color: done ? '#fff' : primary,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {done ? <Icon name="check" size={14}/> : index + 1}
                  </div>
                  <h3 style={{
                    margin: 0, fontSize: 18, fontWeight: 700, color: '#0F2E5F',
                    fontFamily: '"Noto Serif SC", serif', letterSpacing: 0.5,
                    wordBreak: 'break-word',
                  }}>
                    {scale.name}
                  </h3>
                  {done ? (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: primary,
                      background: `${primary}12`, padding: '3px 8px', borderRadius: 999,
                    }}>
                      已完成
                    </span>
                  ) : null}
                </div>
                {scale.subtitle ? (
                  <div style={{ marginTop: 8, marginLeft: 38, fontSize: 13, color: '#4A5A78', lineHeight: 1.6 }}>
                    {scale.subtitle}
                  </div>
                ) : null}
                <div style={{ marginTop: 10, marginLeft: 38, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: '#8B96A8' }}>
                  <span>共 {scale.total || scale.items?.length || 0} 题</span>
                  {scale.dur ? <span>约 {scale.dur}</span> : null}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                {done ? (
                  <button
                    type="button"
                    onClick={() => onViewResult(scale.id)}
                    style={{
                      background: '#fff', color: primary, border: `1.5px solid ${primary}`,
                      padding: '11px 18px', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    查看结果
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onStart(scale.id)}
                  style={{
                    background: done ? primaryDark : primary,
                    color: '#fff', border: 'none',
                    padding: '11px 18px', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {done ? '重新作答' : '开始作答'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent', color: '#4A5A78', border: '1px solid #D0D6E0',
            padding: '14px 26px', borderRadius: 4, fontSize: 14, cursor: 'pointer',
          }}
        >
          ← 返回基础信息
        </button>
      </div>
    </div>
  );
};

const StepScale = ({
  scale,
  primary,
  primaryDark,
  answersByScale,
  setScaleAnswer,
  submitting,
  submitError,
  onSubmit,
  onBack,
}) => {
  const scaleId = scale?.id || 'scale';
  const answers = answersByScale[scaleId] || {};
  const answerKey = (item, i) => (scale?.scale === 'dynamic' && item?.id != null ? item.id : i);
  const isItemAnswered = (item, i) => {
    const key = answerKey(item, i);
    const val = answers[key];
    if (scale?.scale === 'dynamic' && item && typeof item === 'object') {
      return isDynamicQuestionAnswered(item, val);
    }
    return val != null && val !== '';
  };
  const answered = (scale?.items || []).filter(isItemAnswered).length;
  const demoTotal = Math.max(Number(scale?.demoTotal) || (scale?.items || []).length || 0, 1);
  const isComplete = scale?.scale === 'dynamic'
    ? (scale?.items || []).length > 0 && (scale?.items || []).every(
      (item, i) => !isOnboardingQuestionRequired(item) || isItemAnswered(item, i),
    )
    : answered >= demoTotal;
  const setAns = (item, i, v) => setScaleAnswer(scaleId, answerKey(item, i), v);

  if (!scale) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 40, textAlign: 'center', color: '#8B96A8' }}>
        暂无可用量表，请返回上一页或联系管理员。
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{
        height: 4, borderRadius: 2, marginBottom: 20,
        background: `linear-gradient(90deg, ${primary} ${(answered / demoTotal) * 100}%, #E8ECF3 ${(answered / demoTotal) * 100}%)`,
      }}/>

      <StepIntro
        eyebrow="第 3 步 · 量表作答"
        title={scale.name}
        desc={scale.subtitle}
        meta={[`共 ${scale.total || demoTotal} 题`, scale.dur ? `约 ${scale.dur}` : null].filter(Boolean)}
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
            const inputType = scale.scale === 'dynamic'
              ? getOnboardingQuestionInputType(item)
              : 'choice';
            const selectedOptionId = selectedOnboardingOptionId(selected);
            const selectedOption = scale.scale === 'dynamic' && inputType === 'choice'
              ? (item.options || []).find((opt, oi) => (opt.id || oi) === selectedOptionId)
              : null;
            const followUp = selectedOption?.followUp;
            const followUpVal = onboardingFollowUpValue(selected);
            const optionCount = Math.min((item.options || []).length || 1, 5);
            return (
            <div key={item?.id || i} style={{ padding: '20px 16px 24px', background: '#FBFAF7', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {i + 1}
                </div>
                {scale.scale === 'dynamic' ? (
                  <div className="gxa-scale-question-text" style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {item.text}
                    {!isOnboardingQuestionRequired(item) ? (
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: '#8B96A8' }}>选填</span>
                    ) : null}
                  </div>
                ) : scale.scale === 'binary' ? (
                  <div className="gxa-scale-question-text" style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7 }}>请选择更符合你的选项</div>
                ) : (
                  <div className="gxa-scale-question-text" style={{ flex: 1, minWidth: 0, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item}</div>
                )}
              </div>

              {scale.scale === 'dynamic' && inputType === 'text' ? (
                <div style={{ paddingLeft: 38 }}>
                  <textarea
                    rows={3}
                    placeholder={item.helpText || '请填写'}
                    minLength={item.validation?.minLength}
                    maxLength={item.validation?.maxLength}
                    value={selected && typeof selected === 'object' && 'text' in selected ? selected.text : ''}
                    onChange={(event) => {
                      const text = event.target.value;
                      setAns(item, i, text.trim() ? { text } : undefined);
                    }}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                      background: '#fff', border: '1.5px solid #E8ECF3', borderRadius: 4,
                      fontSize: 14, color: '#1A2846', lineHeight: 1.6, fontFamily: 'inherit',
                      resize: 'vertical', outline: 'none',
                    }}
                  />
                </div>
              ) : scale.scale === 'dynamic' && inputType === 'number' ? (
                <div style={{ paddingLeft: 38 }}>
                  <input
                    type="number"
                    placeholder={item.helpText || '请填写数字'}
                    min={item.validation?.min}
                    max={item.validation?.max}
                    value={
                      selected && typeof selected === 'object' && 'number' in selected && Number.isFinite(selected.number)
                        ? selected.number
                        : ''
                    }
                    onChange={(event) => {
                      const raw = event.target.value;
                      if (raw === '') {
                        setAns(item, i, undefined);
                        return;
                      }
                      const parsed = Number(raw);
                      setAns(item, i, Number.isFinite(parsed) ? { number: parsed } : undefined);
                    }}
                    style={{
                      width: '100%', maxWidth: 280, boxSizing: 'border-box', height: 42, padding: '0 14px',
                      background: '#fff', border: '1.5px solid #E8ECF3', borderRadius: 4,
                      fontSize: 14, color: '#1A2846', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
              ) : scale.scale === 'dynamic' ? (
                <>
                  <div
                    className="gxa-scale-options"
                    style={{ display: 'grid', gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))`, gap: 8, paddingLeft: 38 }}
                  >
                    {(item.options || []).map((option, oi) => {
                      const optId = option.id || oi;
                      const isOptionSelected = selectedOptionId === optId;
                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={() => {
                            if (option.followUp) {
                              setAns(item, i, {
                                optionId: String(optId),
                                followUp: isOptionSelected ? followUpVal : undefined,
                              });
                              return;
                            }
                            setAns(item, i, optId);
                          }}
                          style={{
                            padding: '12px 8px', textAlign: 'center',
                            background: isOptionSelected ? primary : '#fff',
                            color: isOptionSelected ? '#fff' : '#4A5A78',
                            border: isOptionSelected ? `1.5px solid ${primary}` : '1.5px solid #E8ECF3',
                            borderRadius: 4, cursor: 'pointer', fontSize: 13,
                            whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.45,
                            minWidth: 0,
                          }}
                        >
                          {option.label || option.text}
                        </button>
                      );
                    })}
                  </div>
                  {followUp ? (
                    <div style={{ marginTop: 12, marginLeft: 38, padding: '12px 14px', background: '#fff', border: '1px dashed #D0D6E0', borderRadius: 4 }}>
                      <div style={{ marginBottom: 8, fontSize: 12, color: '#4A5A78' }}>
                        {followUp.label || '请补充填写'}
                        {followUp.required ? '（必填）' : ''}
                      </div>
                      {followUp.inputType === 'number' ? (
                        <input
                          type="number"
                          min={followUp.validation?.min}
                          max={followUp.validation?.max}
                          value={typeof followUpVal === 'number' && Number.isFinite(followUpVal) ? followUpVal : ''}
                          onChange={(event) => {
                            const raw = event.target.value;
                            const parsed = Number(raw);
                            setAns(item, i, {
                              optionId: String(selectedOptionId),
                              followUp: raw === '' || !Number.isFinite(parsed) ? undefined : parsed,
                            });
                          }}
                          style={{
                            width: '100%', maxWidth: 260, boxSizing: 'border-box', height: 38, padding: '0 12px',
                            background: '#fff', border: '1.5px solid #E8ECF3', borderRadius: 4,
                            fontSize: 13, color: '#1A2846', fontFamily: 'inherit', outline: 'none',
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          minLength={followUp.validation?.minLength}
                          maxLength={followUp.validation?.maxLength}
                          value={typeof followUpVal === 'string' ? followUpVal : ''}
                          onChange={(event) => {
                            const raw = event.target.value;
                            setAns(item, i, {
                              optionId: String(selectedOptionId),
                              followUp: raw === '' ? undefined : raw,
                            });
                          }}
                          style={{
                            width: '100%', boxSizing: 'border-box', height: 38, padding: '0 12px',
                            background: '#fff', border: '1.5px solid #E8ECF3', borderRadius: 4,
                            fontSize: 13, color: '#1A2846', fontFamily: 'inherit', outline: 'none',
                          }}
                        />
                      )}
                    </div>
                  ) : null}
                </>
              ) : scale.scale === 'binary' ? (
                <div className="gxa-scale-options-binary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[item.a, item.b].map((opt, oi) => (
                    <button key={oi} type="button" onClick={() => setAns(item, i, oi)} style={{
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
                    <button key={li} type="button" onClick={() => setAns(item, i, li)} style={{
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
        {submitError ? (
          <div style={{ marginTop: 12, padding: '12px 16px', background: '#FFF6F4', border: '1px solid #F3C6C2', borderRadius: 4, color: '#8A2F2A', fontSize: 13, lineHeight: 1.6 }}>
            {submitError}
          </div>
        ) : null}
      </div>

      <StepActions
        onBack={onBack}
        onNext={onSubmit}
        nextDisabled={!isComplete || submitting}
        primary={primary}
        backLabel="返回量表选择"
        nextLabel={submitting ? '提交中…' : '提交本量表 →'}
      />
    </div>
  );
};

function renderScaleResultBody(result, primary, accent) {
  if (!result || typeof result !== 'object') {
    return (
      <p style={{ margin: 0, fontSize: 14, color: '#4A5A78', lineHeight: 1.8 }}>
        已成功提交本量表。详细解读可在管理端量表结果中查看。
      </p>
    );
  }

  if (result.type === 'match') {
    return (
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', letterSpacing: 1 }}>
          {result.title || result.matchTitle || '匹配结果'}
        </div>
        {result.description || result.matchDescription ? (
          <p style={{ margin: '14px 0 0', fontSize: 15, color: '#4A5A78', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
            {result.description || result.matchDescription}
          </p>
        ) : null}
        {result.shareText ? (
          <div style={{ marginTop: 18, padding: '12px 14px', background: `${primary}08`, borderRadius: 6, fontSize: 13, color: primary, lineHeight: 1.7 }}>
            {result.shareText}
          </div>
        ) : null}
      </div>
    );
  }

  if (result.type === 'sum') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: primary, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>
            {result.totalScore ?? '—'}
          </div>
          {result.level ? (
            <span style={{ fontSize: 15, fontWeight: 600, color: accent || primary }}>{result.level}</span>
          ) : null}
        </div>
        {result.summary ? (
          <p style={{ margin: '16px 0 0', fontSize: 14, color: '#4A5A78', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
            {result.summary}
          </p>
        ) : null}
      </div>
    );
  }

  if (result.type === 'dimension' && Array.isArray(result.dimensions)) {
    return (
      <div>
        {result.summary ? (
          <p style={{ margin: '0 0 18px', fontSize: 14, color: '#4A5A78', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
            {result.summary}
          </p>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result.dimensions.map((dim, index) => (
            <div key={dim.id || dim.name || index} style={{ padding: '14px 16px', background: '#FBFAF7', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0F2E5F' }}>{dim.title || dim.name || `维度 ${index + 1}`}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: primary }}>{dim.score ?? dim.average ?? '—'}</div>
              </div>
              {dim.level ? <div style={{ marginTop: 6, fontSize: 12, color: '#8B96A8' }}>{dim.level}</div> : null}
              {dim.description ? (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#4A5A78', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{dim.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <p style={{ margin: 0, fontSize: 14, color: '#4A5A78', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
      {typeof result.summary === 'string' ? result.summary : '本量表已提交完成。'}
    </p>
  );
}

const StepScaleResult = ({ scale, report, primary, primaryDark, accent, onBack }) => {
  const title = report?.assessmentTitle || scale?.name || '量表结果';
  const subtitle = report?.assessmentSubtitle || scale?.subtitle || '';
  const result = report?.result;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
        borderRadius: 8, padding: '36px 40px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 1, marginBottom: 10 }}>SCALE RESULT · 量表结果</div>
        <h1 style={{
          margin: 0, fontFamily: '"Noto Serif SC", serif', fontSize: 32, fontWeight: 700,
          letterSpacing: 1, lineHeight: 1.35, wordBreak: 'break-word',
        }}>
          {title}
        </h1>
        {subtitle ? <p style={{ margin: '10px 0 0', fontSize: 14, opacity: 0.88, lineHeight: 1.7 }}>{subtitle}</p> : null}
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 32, marginTop: 20, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        {scale?.reportIntro ? (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: `${primary}08`, borderRadius: 6, fontSize: 13, color: '#4A5A78', lineHeight: 1.75 }}>
            {scale.reportIntro}
          </div>
        ) : null}
        {report?.resultSummary && !result ? (
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#4A5A78', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
            {report.resultSummary}
          </p>
        ) : null}
        {renderScaleResultBody(result, primary, accent)}
        {scale?.disclaimer ? (
          <p style={{ margin: '24px 0 0', fontSize: 12, color: '#8B96A8', lineHeight: 1.7 }}>{scale.disclaimer}</p>
        ) : (
          <p style={{ margin: '24px 0 0', fontSize: 12, color: '#8B96A8', lineHeight: 1.7 }}>
            本结果仅供参考，不作为临床诊断依据。
          </p>
        )}
      </div>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: '#fff', border: '1.5px solid #D0D6E0', color: '#1A2846',
            padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontWeight: 500,
          }}
        >
          ← 返回量表选择
        </button>
      </div>
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

function formatReportTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatReportNo(publicId) {
  if (publicId) return String(publicId);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `RPT-${y}${m}${d}`;
}

function levelToneByRadar(score) {
  if (score >= 80) return { level: '良好', color: '#22A879' };
  if (score >= 70) return { level: '一般偏好', color: '#1E4C9A' };
  if (score >= 60) return { level: '一般', color: '#F5B547' };
  return { level: '需关注', color: '#C8161D' };
}

function levelToneByLabel(level, fallbackColor) {
  const text = String(level || '');
  if (/良好|正常|优秀|较低|无|阴性|健康/.test(text)) return { level: text, color: '#22A879' };
  if (/轻|一般偏好|偏高|轻度/.test(text)) return { level: text, color: '#1E4C9A' };
  if (/中|一般|中度/.test(text)) return { level: text, color: '#F5B547' };
  if (/重|需关注|明显|阳性|严重/.test(text)) return { level: text, color: '#C8161D' };
  return { level: text || '—', color: fallbackColor || '#1E4C9A' };
}

function formatDisplayScore(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return '—';
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function inferScoreCeiling(values) {
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return 100;
  const max = Math.max(...nums);
  if (max <= 5.5) return 5;
  if (max <= 10.5) return 10;
  if (max <= 100) return 100;
  return Math.max(max, 100);
}

function toRadarScore(raw, ceiling) {
  const n = Number(raw);
  if (!Number.isFinite(n) || !(ceiling > 0)) return 0;
  return Math.max(0, Math.min(100, (n / ceiling) * 100));
}

function wrapRadarLabel(name, maxChars = 5) {
  const text = String(name || '').trim() || '维度';
  const lines = [];
  for (let index = 0; index < text.length; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }
  return lines.slice(0, 2);
}

function buildDimensionsFromResult(result, primary, accent) {
  if (!(result && typeof result === 'object')) return [];
  if (result.type === 'dimension' && Array.isArray(result.dimensions) && result.dimensions.length) {
    const all = result.dimensions.filter((dim) => dim && typeof dim === 'object');
    const withoutTotal = all.filter((dim) => !String(dim.id || '').endsWith('-total'));
    const source = withoutTotal.length >= 3 ? withoutTotal : all;
    const rawScores = source.map((dim) => Number(dim.score ?? dim.average));
    const ceiling = inferScoreCeiling(rawScores);
    const count = source.length;
    return source.map((dim, index) => {
      const raw = Number(dim.score ?? dim.average);
      const radarScore = toRadarScore(raw, ceiling);
      const tone = dim.level
        ? levelToneByLabel(dim.level, primary)
        : levelToneByRadar(radarScore);
      const suggestions = Array.isArray(dim.suggestions)
        ? dim.suggestions.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      return {
        name: dim.title || dim.name || `维度 ${index + 1}`,
        score: formatDisplayScore(raw),
        radarScore,
        level: dim.level || tone.level,
        color: tone.color || accent,
        angle: -90 + index * (360 / Math.max(count, 1)),
        note: dim.visitorDescription || dim.description || '',
        suggestions,
      };
    });
  }
  if (result.type === 'sum' && result.totalScore != null) {
    const raw = Number(result.totalScore);
    const ceiling = inferScoreCeiling([raw]);
    const radarScore = toRadarScore(raw, ceiling);
    const tone = result.level
      ? levelToneByLabel(result.level, primary)
      : levelToneByRadar(radarScore);
    return [{
      name: '综合得分',
      score: formatDisplayScore(raw),
      radarScore,
      level: result.level || tone.level,
      color: tone.color,
      angle: -90,
      note: result.summary || '',
      suggestions: [],
    }];
  }
  return [];
}

function buildSuggestionsFromDimensions(dimensions) {
  const fromBackend = [];
  for (const dim of dimensions) {
    for (const tip of dim.suggestions || []) {
      if (fromBackend.length >= 3) break;
      fromBackend.push({
        icon: fromBackend.length === 0 ? 'clock' : fromBackend.length === 1 ? 'group' : 'sparkle',
        title: dim.name ? `关于${dim.name}` : '个性化建议',
        desc: tip,
        action: '了解更多',
      });
    }
    if (fromBackend.length >= 3) break;
  }
  if (fromBackend.length >= 3) return fromBackend.slice(0, 3);

  if (!dimensions.length) {
    return [
      {
        icon: 'clock',
        title: '关注当下状态',
        desc: '建议结合近期作息、压力与情绪变化进行自我观察，如困扰持续可使用 EAP 资源。',
        action: '查看自我调节建议',
      },
      {
        icon: 'group',
        title: '主动建立支持网络',
        desc: '建议与信任的人保持沟通，或在需要时预约 EAP 咨询，扩展可求助的支持网络。',
        action: '查看近期活动',
      },
      {
        icon: 'sparkle',
        title: '持续关照自己',
        desc: '保持对内在感受的关注，在忙碌中给自己留出喘息与恢复的空间。',
        action: '了解更多',
      },
    ];
  }

  const attentionRank = (dim) => {
    const text = String(dim.level || '');
    if (/重|需关注|明显|阳性|严重/.test(text)) return 3;
    if (/中|中度/.test(text)) return 2;
    if (/轻|偏高|轻度/.test(text)) return 1;
    return 0;
  };
  const sortedByAttention = [...dimensions].sort((a, b) => {
    const diff = attentionRank(b) - attentionRank(a);
    if (diff !== 0) return diff;
    return (b.radarScore || 0) - (a.radarScore || 0);
  });
  const focus = sortedByAttention[0];
  const calm = [...dimensions].sort((a, b) => attentionRank(a) - attentionRank(b) || (a.radarScore || 0) - (b.radarScore || 0))[0];

  const filled = [...fromBackend];
  if (filled.length < 3 && focus) {
    filled.push({
      icon: 'clock',
      title: `关注${focus.name}`,
      desc: focus.note
        || `根据本次测评，${focus.name}相对需要关注。建议先观察作息、压力与支持系统，必要时使用 EAP 资源。`,
      action: '查看自我调节建议',
    });
  }
  if (filled.length < 3) {
    filled.push({
      icon: 'group',
      title: '主动建立支持网络',
      desc: '建议与信任的人保持沟通，或在需要时预约 EAP 咨询，扩展可求助的支持网络。',
      action: '查看近期活动',
    });
  }
  if (filled.length < 3 && calm) {
    filled.push({
      icon: 'sparkle',
      title: `保持${calm.name}`,
      desc: calm.note
        || `本次测评中${calm.name}相对平稳，可继续保持现有节奏与自我关照。`,
      action: '了解更多',
    });
  }
  return filled.slice(0, 3);
}

// ==================== Step 6: 报告预览（模拟版式 + 真实结果） ====================
const StepReport = ({
  report,
  scale,
  scales,
  assessmentCount,
  questionCount,
  primary,
  primaryDark,
  accent,
  warm,
  companyName,
  siteName,
  homeHref,
  submitError,
  onBack,
}) => {
  const result = report?.result && typeof report.result === 'object' ? report.result : null;
  const dimensions = buildDimensionsFromResult(result, primary, accent);
  const hasRadar = dimensions.length >= 3;
  const avgRadar = dimensions.length
    ? dimensions.reduce((sum, item) => sum + (item.radarScore || 0), 0) / dimensions.length
    : 0;
  const rawNums = dimensions
    .map((item) => Number(item.score))
    .filter((n) => Number.isFinite(n));
  const dimCeiling = inferScoreCeiling(rawNums);
  const symptomLike = result?.type === 'dimension' && dimCeiling <= 5.5;
  const ringProgressBase = result?.type === 'sum' && result.totalScore != null
    ? toRadarScore(result.totalScore, inferScoreCeiling([Number(result.totalScore)]))
    : avgRadar;
  // 症状类因子分越高越需关注：环进度按「越低越好」映射，避免高分误显为良好
  const ringProgress = symptomLike ? Math.max(0, 100 - ringProgressBase) : ringProgressBase;
  const overallTone = result?.type === 'sum' && result.level
    ? levelToneByLabel(result.level, primary)
    : levelToneByRadar(ringProgress);
  const ringLevel = (result?.type === 'sum' && result.level) || overallTone.level;
  const ringValue = result?.type === 'sum' && result.totalScore != null
    ? formatDisplayScore(result.totalScore)
    : (rawNums.length
      ? formatDisplayScore(rawNums.reduce((a, b) => a + b, 0) / rawNums.length)
      : (dimensions.length ? Math.round(avgRadar) : '—'));
  const ringCaption = result?.type === 'sum' ? '量表总分' : (symptomLike ? '因子均分' : '综合评分');
  const suggestions = buildSuggestionsFromDimensions(dimensions);
  const reportNo = formatReportNo(report?.publicId);
  const reportTime = formatReportTime();
  const title = report?.assessmentTitle || scale?.name || '你的心理测评报告';
  const subtitle = report?.assessmentSubtitle || scale?.subtitle || '';
  const summaryText = report?.resultSummary || result?.summary || '';
  const isMatch = result?.type === 'match';

  return (
    <div className="gxa-report-page" style={{ maxWidth: 1080, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {submitError ? (
        <div className="gxa-report-alert" style={{ marginBottom: 16, padding: '14px 18px', background: '#FFF6F4', border: '1px solid #F3C6C2', borderRadius: 6, color: '#8A2F2A', fontSize: 13, lineHeight: 1.7, wordBreak: 'break-word' }}>
          真实答卷未能完整保存到服务器（{submitError}）。若下方有结果，仍来自本次计分返回。
        </div>
      ) : null}

      <div className="gxa-report-banner" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`, borderRadius: 8, padding: '44px 44px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }}/>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)' }}/>

        <div className="gxa-report-hero" style={{ position: 'relative', display: 'grid', gridTemplateColumns: isMatch ? '1fr' : '1fr auto', gap: 40, alignItems: 'center' }}>
          <div className="gxa-report-hero-copy" style={{ minWidth: 0 }}>
            <div className="gxa-report-kicker" style={{ fontSize: 12, opacity: .8, letterSpacing: 1, marginBottom: 12, wordBreak: 'break-word' }}>YOUR PSYCHOLOGICAL BASELINE · 测评报告</div>
            <h1 className="gxa-report-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: 1, lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {isMatch ? (result.title || result.matchTitle || title) : title}
            </h1>
            <div className="gxa-report-sub" style={{ opacity: .85, fontSize: 18, fontWeight: 500, marginTop: 10, lineHeight: 1.55, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {subtitle || (result?.level ? `结果等级：${result.level}` : '基于本次真实作答生成')}
              <span className="gxa-report-sub-sep"> · </span>
              <span className="gxa-report-no">报告编号 {reportNo}</span>
            </div>
            <div className="gxa-report-meta" style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 13, opacity: .85, flexWrap: 'wrap' }}>
              <span>生成于 {reportTime}</span>
              <span className="gxa-report-meta-dot">·</span>
              <span>基于 {assessmentCount} 个量表 · {questionCount} 项作答</span>
              <span className="gxa-report-meta-dot">·</span>
              <span>分数与解读来自本次真实计分</span>
            </div>
          </div>

          {!isMatch ? (
            <div className="gxa-report-score" style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
              <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
                <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10"/>
                <circle cx="80" cy="80" r="66" fill="none" stroke="#fff" strokeWidth="10"
                  strokeDasharray={`${(Number(ringProgress) / 100) * 414} 414`}
                  strokeLinecap="round" transform="rotate(-90 80 80)"/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="gxa-report-score-num" style={{ fontSize: 42, fontWeight: 700, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>{ringValue}</div>
                <div style={{ fontSize: 11, opacity: .8, letterSpacing: 1, marginTop: 4 }}>{ringCaption}</div>
                <div style={{ fontSize: 11, marginTop: 4, background: 'rgba(255,255,255,.15)', padding: '2px 10px', borderRadius: 3 }}>{ringLevel}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {summaryText ? (
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 24, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)', fontSize: 14, color: '#4A5A78', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {summaryText}
        </div>
      ) : null}

      {isMatch ? (
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 32, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
          {(result.description || result.matchDescription) ? (
            <p style={{ margin: 0, fontSize: 15, color: '#4A5A78', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
              {result.description || result.matchDescription}
            </p>
          ) : null}
          {result.shareText ? (
            <div style={{ marginTop: 18, padding: '12px 14px', background: `${primary}08`, borderRadius: 6, fontSize: 13, color: primary, lineHeight: 1.7 }}>
              {result.shareText}
            </div>
          ) : null}
        </div>
      ) : null}

      {!isMatch && dimensions.length > 0 ? (
        <div className="gxa-report-grid" style={{ display: 'grid', gridTemplateColumns: hasRadar ? '1.2fr 1fr' : '1fr', gap: 24, marginTop: 24 }}>
          {hasRadar ? (
            <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)', minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>心理画像</h3>
              <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>根据本次真实计分生成的维度画像</p>
              <div className="gxa-report-radar">
                <RadarChart dimensions={dimensions} primary={primary}/>
              </div>
            </div>
          ) : null}

          <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)', minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>
              {hasRadar ? '各维度详解' : '结果详解'}
            </h3>
            <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>分数与解读来自本次真实作答</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dimensions.map((d) => (
                <div key={d.name} style={{ padding: '14px 0', borderBottom: '1px solid #F0EBE0' }}>
                  <div className="gxa-report-dim-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F' }}>{d.name}</span>
                      {d.level ? (
                        <span style={{ fontSize: 11, color: d.color, background: `${d.color}12`, padding: '2px 8px', borderRadius: 3 }}>{d.level}</span>
                      ) : null}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: d.color, fontFamily: '"Noto Serif SC", serif', flexShrink: 0 }}>{d.score}</span>
                  </div>
                  {d.note ? (
                    <div style={{ fontSize: 12, color: '#4A5A78', lineHeight: 1.6, paddingLeft: 18, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{d.note}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!isMatch && !dimensions.length ? (
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 32, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)', fontSize: 14, color: '#4A5A78', lineHeight: 1.8 }}>
          已成功提交本量表。详细解读可在管理端量表结果中查看，或稍后刷新本页。
        </div>
      ) : null}

      {Array.isArray(scales) && scales.length > 0 ? (
        <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 24, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)', fontSize: 13, color: '#4A5A78', lineHeight: 1.8, wordBreak: 'break-word' }}>
          本次结果来自：{scales.map((item) => item.name || item.id).filter(Boolean).join('、')}。
        </div>
      ) : null}

      <div className="gxa-report-panel" style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <Icon name="sparkle" size={22} color={primary}/>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>给你的 3 条个性化建议</h3>
        </div>
        <p style={{ fontSize: 13, color: '#4A5A78', margin: '0 0 24px' }}>根据本次测评结果整理的关注重点</p>

        <div className="gxa-report-tips" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: 24, background: warm, borderRadius: 6, position: 'relative', minWidth: 0 }}>
              <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 42, opacity: .1, color: primary, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>{i + 1}</div>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name={s.icon} size={22}/>
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif', wordBreak: 'break-word' }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: '#4A5A78', lineHeight: 1.8, marginTop: 8, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{s.desc}</p>
              <a href="#" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: primary, fontWeight: 500, textDecoration: 'none' }}>
                {s.action} <Icon name="arrow" size={12}/>
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="gxa-report-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
        {typeof onBack === 'function' ? (
          <button
            type="button"
            onClick={onBack}
            style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}
          >
            ← 返回量表选择
          </button>
        ) : null}
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

      <div className="gxa-report-about" style={{ marginTop: 32, padding: '20px 24px', background: '#FBFAF7', borderRadius: 6, borderLeft: `3px solid ${primary}`, fontSize: 13, color: '#4A5A78', lineHeight: 1.8, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        <strong style={{ color: '#0F2E5F' }}>关于本报告 · </strong>
        {scale?.disclaimer || '本结果仅供参考，不作为临床诊断依据。分数与解读根据本次真实作答计算。'}
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
    const radar = Number(d.radarScore);
    const normalized = Number.isFinite(radar) ? radar : Number(d.score);
    const r = (Math.max(0, Math.min(100, Number.isFinite(normalized) ? normalized : 0)) / 100) * maxR;
    return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
  });
  const pointsStr = points.map(p => p.join(',')).join(' ');

  const axisEnd = angles.map(a => [cx + maxR * Math.cos(a), cy + maxR * Math.sin(a)]);
  const labelPos = angles.map(a => [cx + (maxR + 36) * Math.cos(a), cy + (maxR + 36) * Math.sin(a)]);

  return (
    <div className="gxa-report-radar-inner" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block' }}>
        {[100, 75, 50, 25].map(v => {
          const r = (v / 100) * maxR;
          const grid = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          return <polygon key={v} points={grid.map(p => p.join(',')).join(' ')} fill="none" stroke="#E8ECF3" strokeWidth="0.7"/>;
        })}
        <text x={cx + 6} y={cy - maxR + 4} fontSize="9" fill="#8B96A8">100</text>
        <text x={cx + 6} y={cy - maxR*0.5 + 4} fontSize="9" fill="#8B96A8">50</text>
        {axisEnd.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#E8ECF3" strokeWidth="0.7"/>
        ))}
        <polygon points={pointsStr} fill={`${primary}25`} stroke={primary} strokeWidth="2"/>
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#fff" stroke={primary} strokeWidth="2.5"/>
        ))}
        {points.map((p, i) => {
          const outward = 16;
          const x = p[0] + Math.cos(angles[i]) * 4;
          const y = p[1] + Math.sin(angles[i]) * 4 - outward;
          return (
            <text key={i} x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="700" fill={primary}>{dimensions[i].score}</text>
          );
        })}
        {labelPos.map((p, i) => {
          const lines = wrapRadarLabel(dimensions[i].name);
          return (
            <text key={i} x={p[0]} y={p[1] - ((lines.length - 1) * 7)} textAnchor="middle" fontSize="12" fontWeight="600" fill="#0F2E5F">
              {lines.map((line, lineIndex) => (
                <tspan key={`${line}-${lineIndex}`} x={p[0]} dy={lineIndex === 0 ? 0 : 14}>{line}</tspan>
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
