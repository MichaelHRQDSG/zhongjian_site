// @ts-nocheck
'use client';

import React from 'react';
import { Icon } from '@/components/shared/data';
import type { ThemeTweaks } from '@/lib/tokens';

// 新员工入职测评 · 完整流程页面
// 6 个步骤：欢迎 → 说明 → 基础信息 → 量表答题 → 提交完成 → 报告预览

const OnboardingAssessment = ({ tweaks }: { tweaks?: ThemeTweaks }) => {
  const primary = tweaks?.primary || '#1E4C9A';
  const primaryDark = tweaks?.primaryDark || '#0F2E5F';
  const accent = tweaks?.accent || '#C8161D';
  const warm = tweaks?.warm || '#F5EFE6';

  // step: 'welcome' | 'consent' | 'basic' | 'scale' | 'complete' | 'report'
  const [step, setStep] = React.useState(() => {
    try {
      if (typeof window === 'undefined') return 'welcome';
      return localStorage.getItem('onb-step') || 'welcome';
    } catch {
      return 'welcome';
    }
  });
  const [scaleIdx, setScaleIdx] = React.useState(0); // 0-4 五个量表
  const [answers, setAnswers] = React.useState({});

  React.useEffect(() => {
    try { localStorage.setItem('onb-step', step); } catch {}
  }, [step]);

  const goto = (s) => { setStep(s); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${warm} 0%, #FBF7F0 40%, #fff 100%)`,
      color: '#1A2846',
      fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif',
    }}>
      {/* 顶部导航 */}
      <OnbHeader primary={primary} primaryDark={primaryDark} step={step}/>

      {/* 步骤条 */}
      {step !== 'welcome' && step !== 'complete' && step !== 'report' && (
        <OnbStepper primary={primary} step={step} scaleIdx={scaleIdx}/>
      )}

      {/* 主内容区 */}
      <main className="gxa-onb-main" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 40px 120px' }}>
        {step === 'welcome' && <StepWelcome primary={primary} primaryDark={primaryDark} accent={accent} onNext={() => goto('consent')}/>}
        {step === 'consent' && <StepConsent primary={primary} primaryDark={primaryDark} accent={accent} onNext={() => goto('basic')} onBack={() => goto('welcome')}/>}
        {step === 'basic' && <StepBasic primary={primary} primaryDark={primaryDark} onNext={() => { setScaleIdx(0); goto('scale'); }} onBack={() => goto('consent')}/>}
        {step === 'scale' && <StepScale primary={primary} primaryDark={primaryDark} scaleIdx={scaleIdx} setScaleIdx={setScaleIdx} onComplete={() => goto('complete')} onBack={() => goto('basic')}/>}
        {step === 'complete' && <StepComplete primary={primary} primaryDark={primaryDark} accent={accent} onNext={() => goto('report')}/>}
        {step === 'report' && <StepReport primary={primary} primaryDark={primaryDark} accent={accent} warm={warm}/>}
      </main>

      {/* 底部 */}
      <OnbFooter primary={primary} accent={accent}/>
    </div>
  );
};

// ==================== 顶部导航 ====================
const OnbHeader = ({ primary, primaryDark, step }) => (
  <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF3', position: 'sticky', top: 0, zIndex: 50 }}>
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit' }}>
        <img src="/assets/guangsha-xinan-logo.jpg" alt="" style={{ height: 44, width: 44, borderRadius: 6 }}/>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: primary, fontFamily: '"Noto Serif SC", serif' }}>广厦心安</div>
          <div style={{ fontSize: 11, color: '#4A5A78', letterSpacing: 1, marginTop: 2 }}>新员工入职测评</div>
        </div>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4A5A78' }}>
          <Icon name="lock" size={14} color={primary}/>
          结果严格保密，不影响录用与晋升
        </div>
        <a href="/" style={{ fontSize: 13, color: '#4A5A78', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          退出 · 进度自动保存
        </a>
      </div>
    </div>
  </header>
);

// ==================== 步骤条 ====================
const STEP_ORDER = ['consent', 'basic', 'scale', 'complete'];
const STEP_LABELS = ['知情同意', '基础信息', '量表作答', '完成提交'];

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
              <div style={{ fontSize: 14, fontWeight: i === currentIdx ? 600 : 500, color: i === currentIdx ? '#0F2E5F' : (i < currentIdx ? '#4A5A78' : '#8B96A8') }}>{label}</div>
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
const OnbFooter = ({ primary, accent }) => (
  <footer style={{ background: '#0A1E42', color: 'rgba(255,255,255,.7)', padding: '30px 0', fontSize: 12 }}>
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>© 2026 中建三局集团有限公司 · 广厦心安 EAP 项目组</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="phone" size={12}/>
          遇到问题：400-880-6666
        </span>
      </div>
    </div>
  </footer>
);

// ==================== Step 1: 欢迎页 ====================
const StepWelcome = ({ primary, primaryDark, accent, onNext }) => (
  <div className="gxa-onb-welcome" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 80, alignItems: 'center', minHeight: 620 }}>
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${primary}20`, padding: '8px 16px', borderRadius: 40, fontSize: 13, color: primary, marginBottom: 32 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          background: accent, color: '#fff',
          padding: '2px 8px', borderRadius: 3,
        }}>NEW</span>
        中建三局员工心理关爱 · 入职专项
      </div>

      <h1 className="gxa-onb-title" style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 56, fontWeight: 700, lineHeight: 1.2, letterSpacing: 2, margin: 0, color: '#0F2E5F' }}>
        欢迎加入中建三局
      </h1>
      <h2 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 30, fontWeight: 500, lineHeight: 1.4, letterSpacing: 1, margin: '20px 0 0', color: primary }}>
        30 分钟，为你建立心理基线档案
      </h2>

      <p style={{ fontSize: 16, lineHeight: 1.95, color: '#4A5A78', marginTop: 32, maxWidth: 540 }}>
        新的旅程开始了。在正式投入工作之前，我们邀请你完成一份专业的入职心理测评。
        <br/><br/>
        这不是考核，也不是筛选 —— 而是<strong style={{ color: '#0F2E5F', fontWeight: 600 }}>为你建立个人心理档案</strong>的起点。
        你将获得：一份可视化的心理画像、个性化的成长建议、一次免费的入职心理咨询机会。
      </p>

      {/* 四个亮点 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 40 }}>
        {[
          { icon: 'clock', title: '仅需 30 分钟', desc: '可分次完成' },
          { icon: 'lock', title: '严格保密', desc: '不进入人事档案' },
          { icon: 'chart', title: '专业量表', desc: '5 个国际标准工具' },
          { icon: 'sparkle', title: '个性化报告', desc: '含咨询师匹配' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${primary}0C`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={f.icon} size={18}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F' }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#4A5A78' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 44, alignItems: 'center' }}>
        <button onClick={onNext} style={{
          background: primary, color: '#fff', border: 'none',
          padding: '16px 40px', fontSize: 15, borderRadius: 4, cursor: 'pointer',
          fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 10px 24px -10px ${primary}66`,
        }}>
          开始测评 <Icon name="arrow" size={16}/>
        </button>
        <div style={{ fontSize: 13, color: '#4A5A78' }}>
          <div>预计时长 30-35 分钟</div>
          <div style={{ marginTop: 2 }}>由第三方 EAP 机构 · 连心心理 提供服务</div>
        </div>
      </div>
    </div>

    {/* 右：可视化插图 —— 抽象的心理雷达图 */}
    <div style={{ position: 'relative', aspectRatio: '1/1', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 50% 45%, ${primary}20, transparent 70%)` }}/>
      <svg viewBox="-140 -140 280 280" style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      {/* 浮标 */}
      <div style={{
        position: 'absolute', top: '10%', right: '-4%',
        background: '#fff', padding: '10px 14px', borderRadius: 6,
        boxShadow: '0 10px 30px rgba(15,46,95,.15)',
        fontSize: 12, color: '#4A5A78',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: primary, fontFamily: '"Noto Serif SC", serif' }}>78</div>
        <div>你的心理健康分</div>
      </div>
      <div style={{
        position: 'absolute', bottom: '15%', left: '-6%',
        background: primaryDark, color: '#fff', padding: '10px 14px', borderRadius: 6,
        boxShadow: '0 10px 30px rgba(15,46,95,.25)',
        fontSize: 12,
      }}>
        <div style={{ opacity: .7 }}>推荐咨询师</div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: '"Noto Serif SC", serif', marginTop: 2 }}>林晚晴 · 匹配度 92%</div>
      </div>
    </div>
  </div>
);

// ==================== Step 2: 知情同意 ====================
const StepConsent = ({ primary, primaryDark, accent, onNext, onBack }) => {
  const [checked, setChecked] = React.useState(false);
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <StepIntro
        eyebrow="第 1 步 · 阅读并同意"
        title="心理测评知情同意书"
        desc="请仔细阅读以下内容，同意后开始测评"
        primary={primary}
      />

      <div style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        {/* 四大承诺 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: 'lock', title: '完全保密', desc: '测评结果仅您本人可见，不进入人事档案、不影响录用晋升' },
            { icon: 'shield', title: '第三方托管', desc: '数据由独立 EAP 机构（连心心理）加密存储，物理隔离于人事系统' },
            { icon: 'edit', title: '匿名 ID', desc: '数据以匿名 ID 保存，聚合分析时脱敏，管理者仅见部门级汇总' },
            { icon: 'check', title: '自愿参与', desc: '您可随时中止测评，进度自动保存；也可随时申请删除全部数据' },
          ].map(c => (
            <div key={c.title} style={{ display: 'flex', gap: 14, padding: 20, background: '#FBFAF7', borderRadius: 6 }}>
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

        {/* 完整条款 */}
        <div style={{ border: '1px solid #E8ECF3', borderRadius: 6, padding: '24px 28px', maxHeight: 260, overflowY: 'auto', fontSize: 13, color: '#4A5A78', lineHeight: 1.9 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F', marginBottom: 12 }}>《心理测评知情同意书》</div>
          <p style={{ margin: '0 0 12px' }}><strong>一、测评目的</strong><br/>本次测评旨在帮助您了解自身心理健康状态，建立个人心理基线档案，并为您提供个性化的心理支持建议。</p>
          <p style={{ margin: '0 0 12px' }}><strong>二、保密条款</strong><br/>1. 您的测评结果仅您本人可见；<br/>2. 数据由第三方 EAP 机构（连心心理）独立存储，中建三局人事、行政、您的直接上级均无权访问原始数据；<br/>3. 仅在您签署额外授权后，才可向指定咨询师分享测评结果；<br/>4. 聚合数据（部门/项目部级别）会用于内部心理健康趋势分析，但已完全脱敏。</p>
          <p style={{ margin: '0 0 12px' }}><strong>三、异常情况处理</strong><br/>若测评结果显示您可能存在严重的心理困扰或自伤自杀风险，EAP 咨询师将主动通过系统内消息联系您，此过程<strong>不会通知任何管理者</strong>。</p>
          <p style={{ margin: '0 0 12px' }}><strong>四、您的权利</strong><br/>1. 随时中止测评；<br/>2. 随时申请删除您的全部数据；<br/>3. 申请导出个人测评报告；<br/>4. 对结果解读申请免费复议咨询。</p>
          <p style={{ margin: '0 0 12px' }}><strong>五、数据保存期限</strong><br/>您的原始测评数据保存 3 年，之后自动匿名化归档。</p>
          <p style={{ margin: 0 }}>如有疑问，请联系 EAP 服务电话 400-880-6666，或发送邮件至 privacy@guangsha-xinan.com。</p>
        </div>

        {/* 确认框 */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 24, cursor: 'pointer', padding: 16, background: checked ? `${primary}08` : '#FBFAF7', borderRadius: 6, border: checked ? `1.5px solid ${primary}40` : '1.5px solid transparent', transition: 'all .2s' }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: primary, flexShrink: 0 }}/>
          <div style={{ fontSize: 14, color: '#0F2E5F', lineHeight: 1.7 }}>
            我已仔细阅读并<strong>同意</strong>《心理测评知情同意书》全部条款。我理解本次测评的目的、保密原则、我的权利，并自愿参与本次测评。
          </div>
        </label>
      </div>

      <StepActions onBack={onBack} onNext={onNext} nextDisabled={!checked} primary={primary} nextLabel="同意并开始"/>
    </div>
  );
};

// ==================== Step 3: 基础信息 ====================
const StepBasic = ({ primary, primaryDark, onNext, onBack }) => {
  const [form, setForm] = React.useState({
    empNo: '', name: '', gender: '', age: '', edu: '',
    dept: '', post: '', category: '',
    workLoc: '', joinDate: '',
    livingStatus: '', hasFamily: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const required = ['empNo', 'name', 'gender', 'age', 'dept', 'post', 'category', 'workLoc'];
  const isValid = required.every(k => form[k]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <StepIntro
        eyebrow="第 2 步 · 基础信息（3 分钟）"
        title="填写你的基本信息"
        desc="这些信息将用于生成更精准的适配报告 · 已脱敏加密存储"
        primary={primary}
      />

      <div style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        {/* 个人信息 */}
        <FormGroupTitle primary={primary} icon="edit">个人信息</FormGroupTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="工号" required>
            <input type="text" placeholder="例如 CSCEC-3B-20260901" value={form.empNo} onChange={e => set('empNo', e.target.value)} style={fieldStyle}/>
          </FormField>
          <FormField label="姓名" required>
            <input type="text" placeholder="请输入真实姓名" value={form.name} onChange={e => set('name', e.target.value)} style={fieldStyle}/>
          </FormField>
          <FormField label="性别" required>
            <SegmentedControl options={['男', '女', '不愿透露']} value={form.gender} onChange={v => set('gender', v)} primary={primary}/>
          </FormField>
          <FormField label="年龄" required>
            <SegmentedControl options={['≤22', '23-28', '29-35', '36-45', '46+']} value={form.age} onChange={v => set('age', v)} primary={primary}/>
          </FormField>
          <FormField label="学历">
            <Select value={form.edu} onChange={v => set('edu', v)} options={['大专', '本科', '硕士', '博士', '其他']}/>
          </FormField>
          <FormField label="入职日期">
            <input type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} style={fieldStyle}/>
          </FormField>
        </div>

        {/* 岗位信息 */}
        <FormGroupTitle primary={primary} icon="building" style={{ marginTop: 32 }}>岗位信息</FormGroupTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="所属部门 / 项目部" required>
            <input type="text" placeholder="例如 三公司深圳湾一号项目部" value={form.dept} onChange={e => set('dept', e.target.value)} style={fieldStyle}/>
          </FormField>
          <FormField label="岗位" required>
            <input type="text" placeholder="例如 土建施工员" value={form.post} onChange={e => set('post', e.target.value)} style={fieldStyle}/>
          </FormField>
          <FormField label="岗位类别" required>
            <SegmentedControl options={['一线施工', '项目管理', '机关职能', '技术研发']} value={form.category} onChange={v => set('category', v)} primary={primary}/>
          </FormField>
          <FormField label="工作地" required>
            <SegmentedControl options={['项目现场', '公司机关', '总部']} value={form.workLoc} onChange={v => set('workLoc', v)} primary={primary}/>
          </FormField>
        </div>

        {/* 生活信息（可选） */}
        <FormGroupTitle primary={primary} icon="heart" style={{ marginTop: 32 }}>生活情况 <span style={{ fontSize: 11, color: '#8B96A8', fontWeight: 400, marginLeft: 8 }}>选填 · 用于识别支持系统</span></FormGroupTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="居住状况">
            <SegmentedControl options={['与家人同住', '独居', '项目部宿舍', '合租']} value={form.livingStatus} onChange={v => set('livingStatus', v)} primary={primary}/>
          </FormField>
          <FormField label="是否与家人异地">
            <SegmentedControl options={['同城', '异地', '暂无家人']} value={form.hasFamily} onChange={v => set('hasFamily', v)} primary={primary}/>
          </FormField>
        </div>
      </div>

      <StepActions onBack={onBack} onNext={onNext} nextDisabled={!isValid} primary={primary} nextLabel="进入量表作答 →"/>

      {!isValid && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#8B96A8' }}>
          请完成所有带 * 的必填项
        </div>
      )}
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
    subtitle: '中建定制 · 岗位适应度评估',
    dur: '5 分钟',
    total: 20,
    demoTotal: 5,
    scale: 'likert5',
    scaleLabels: ['完全不同意', '不太同意', '一般', '比较同意', '完全同意'],
    question: '请评估你对以下描述的认同程度',
    items: [
      '我对未来 3 个月的工作内容有比较清晰的了解',
      '我认为我目前的岗位与我的能力和兴趣相匹配',
      '我能适应项目部/工作现场的工作节奏',
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

const StepScale = ({ primary, primaryDark, scaleIdx, setScaleIdx, onComplete, onBack }) => {
  const scale = SCALES[scaleIdx];
  const [answers, setAnswers] = React.useState({});
  const answered = Object.keys(answers).length;
  const isComplete = answered >= scale.demoTotal;

  const setAns = (i, v) => setAnswers(a => ({ ...a, [i]: v }));

  React.useEffect(() => { setAnswers({}); }, [scaleIdx]);

  const nextScale = () => {
    if (scaleIdx < SCALES.length - 1) {
      setScaleIdx(scaleIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete();
    }
  };
  const prevScale = () => {
    if (scaleIdx > 0) {
      setScaleIdx(scaleIdx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 量表切换指示 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SCALES.map((s, i) => (
          <div key={s.id} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < scaleIdx ? primary : (i === scaleIdx ? `linear-gradient(90deg, ${primary} ${(answered / scale.demoTotal) * 100}%, #E8ECF3 ${(answered / scale.demoTotal) * 100}%)` : '#E8ECF3'),
          }}/>
        ))}
      </div>

      <StepIntro
        eyebrow={`第 3 步 · 量表 ${scaleIdx + 1} / ${SCALES.length}`}
        title={scale.name}
        desc={`${scale.subtitle} · 演示版仅展示 ${scale.demoTotal} 题，实际 ${scale.total} 题 · 约 ${scale.dur}`}
        primary={primary}
      />

      <div style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        <div style={{ fontSize: 15, color: '#0F2E5F', fontWeight: 600, marginBottom: 24, padding: '14px 18px', background: `${primary}08`, borderLeft: `3px solid ${primary}`, borderRadius: 4 }}>
          {scale.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {scale.items.map((item, i) => (
            <div key={i} style={{ padding: '20px 20px 24px', background: '#FBFAF7', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {i + 1}
                </div>
                {scale.scale === 'binary' ? (
                  <div style={{ flex: 1, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7 }}>请选择更符合你的选项</div>
                ) : (
                  <div style={{ flex: 1, fontSize: 15, color: '#0F2E5F', lineHeight: 1.7 }}>{item}</div>
                )}
              </div>

              {scale.scale === 'binary' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[item.a, item.b].map((opt, oi) => (
                    <button key={oi} onClick={() => setAns(i, oi)} style={{
                      padding: '18px 20px', textAlign: 'left',
                      background: answers[i] === oi ? `${primary}12` : '#fff',
                      border: answers[i] === oi ? `1.5px solid ${primary}` : '1.5px solid #E8ECF3',
                      color: answers[i] === oi ? '#0F2E5F' : '#4A5A78',
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 14, lineHeight: 1.7,
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      transition: 'all .2s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${answers[i] === oi ? primary : '#D0D6E0'}`,
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}>
                        {answers[i] === oi && <div style={{ width: 10, height: 10, borderRadius: '50%', background: primary }}/>}
                      </div>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scale.scaleLabels.length}, 1fr)`, gap: 8, paddingLeft: 38 }}>
                  {scale.scaleLabels.map((lbl, li) => (
                    <button key={li} onClick={() => setAns(i, li)} style={{
                      padding: '12px 8px', textAlign: 'center',
                      background: answers[i] === li ? primary : '#fff',
                      color: answers[i] === li ? '#fff' : '#4A5A78',
                      border: answers[i] === li ? `1.5px solid ${primary}` : '1.5px solid #E8ECF3',
                      borderRadius: 4, cursor: 'pointer',
                      fontSize: 13, fontWeight: answers[i] === li ? 600 : 400,
                      transition: 'all .2s',
                    }}>
                      <div style={{ fontSize: 15, marginBottom: 4, fontWeight: 600 }}>{li + 1}</div>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: `${primary}08`, borderRadius: 4, fontSize: 12, color: '#4A5A78', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={14} color={primary}/>
          进度自动保存 · 已答 {answered} / {scale.demoTotal} 题
        </div>
      </div>

      <StepActions
        onBack={prevScale}
        onNext={nextScale}
        nextDisabled={!isComplete}
        primary={primary}
        backLabel={scaleIdx === 0 ? '返回基础信息' : `上一个量表`}
        nextLabel={scaleIdx === SCALES.length - 1 ? '完成所有量表 →' : `下一个量表 →`}
      />
    </div>
  );
};

// ==================== Step 5: 完成提交 ====================
const StepComplete = ({ primary, primaryDark, accent, onNext }) => {
  React.useEffect(() => {
    const t = setTimeout(onNext, 3000);
    return () => clearTimeout(t);
  }, [onNext]);
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

      <h1 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 42, fontWeight: 700, color: '#0F2E5F', margin: 0, letterSpacing: 2 }}>
        测评已完成，感谢你的信任
      </h1>
      <p style={{ fontSize: 16, color: '#4A5A78', margin: '16px 0 8px', lineHeight: 1.8 }}>
        你的心理档案正在生成中，请稍候……
      </p>
      <p style={{ fontSize: 13, color: '#8B96A8' }}>
        通常需要 3-5 秒 · 报告将展示 4 大维度可视化图表与个性化建议
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

// ==================== Step 6: 报告预览 ====================
const StepReport = ({ primary, primaryDark, accent, warm }) => {
  const dimensions = [
    { name: '心理健康', score: 82, level: '良好', color: '#22A879', angle: -90, note: '整体情绪平稳，抗压能力较强' },
    { name: '性格倾向', score: 76, level: 'ENFJ', color: primary, angle: -30, note: '主人公型 · 富有共情力的团队协作者' },
    { name: '工作适应', score: 68, level: '一般', color: '#F5B547', angle: 30, note: '对新岗位仍需适应期，建议加强导师沟通' },
    { name: '睡眠质量', score: 62, level: '偏低', color: accent, angle: 90, note: '入睡时间较长，建议关注作息' },
    { name: '社会支持', score: 78, level: '良好', color: '#22A879', angle: 150, note: '家庭与同事支持系统完善' },
    { name: '压力承受', score: 74, level: '良好', color: primary, angle: 210, note: '整体压力适应度良好' },
  ];

  const overallScore = 73;

  const suggestions = [
    { icon: 'clock', title: '关注睡眠质量', desc: '你的入睡时间偏长，推荐每天固定 20 分钟"睡前锚点"仪式，尝试收听《睡前冥想：放下今天的疲惫》', action: '预约睡眠专题咨询' },
    { icon: 'group', title: '主动建立支持网络', desc: '新入职阶段建议主动参加项目部下周三的"新员工沙龙"，扩展社交支持圈', action: '查看近期活动' },
    { icon: 'sparkle', title: '发挥你的优势', desc: '你的共情力与协作意愿是宝贵资源，可以主动承担团队沟通与协调工作', action: '了解 ENFJ 详解' },
  ];

  const recommendedCounselors = [
    { name: '林晚晴', title: '国家二级心理咨询师', tags: ['职场焦虑', '失眠', '一线员工'], match: 92 },
    { name: '陈牧之', title: '婚姻家庭治疗师', tags: ['异地情感', '亲子关系'], match: 78 },
  ];

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {/* 报告头 */}
      <div style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`, borderRadius: 8, padding: '44px 44px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }}/>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)' }}/>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, opacity: .8, letterSpacing: 3, marginBottom: 12 }}>YOUR PSYCHOLOGICAL BASELINE · 你的心理基线档案</div>
            <h1 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: 1, lineHeight: 1.3 }}>
              嗨，欢迎加入中建三局
              <br/>
              <span style={{ opacity: .85, fontSize: 22, fontWeight: 500 }}>这是我们初次认识 · 报告编号 GXA-2026-091108</span>
            </h1>
            <div style={{ display: 'flex', gap: 24, marginTop: 24, fontSize: 13, opacity: .85 }}>
              <span>生成于 2026-09-11 14:32</span>
              <span>•</span>
              <span>基于 5 大量表 · 118 项作答</span>
              <span>•</span>
              <span>加密存储于 EAP 独立系统</span>
            </div>
          </div>
          {/* 综合分环 */}
          <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
              <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10"/>
              <circle cx="80" cy="80" r="66" fill="none" stroke="#fff" strokeWidth="10"
                strokeDasharray={`${(overallScore / 100) * 414} 414`}
                strokeLinecap="round" transform="rotate(-90 80 80)"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 700, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>{overallScore}</div>
              <div style={{ fontSize: 11, opacity: .8, letterSpacing: 2, marginTop: 4 }}>综合评分 / 100</div>
              <div style={{ fontSize: 11, marginTop: 4, background: 'rgba(255,255,255,.15)', padding: '2px 10px', borderRadius: 3 }}>良好</div>
            </div>
          </div>
        </div>
      </div>

      {/* 雷达图 + 维度详情 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 24 }}>
        {/* 雷达图 */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>六维心理画像</h3>
          <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>分数越高，该维度表现越积极</p>
          <RadarChart dimensions={dimensions} primary={primary}/>
        </div>

        {/* 维度分数列表 */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>各维度详解</h3>
          <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>点击可查看完整解读</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dimensions.map(d => (
              <div key={d.name} style={{ padding: '14px 0', borderBottom: '1px solid #F0EBE0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }}/>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2E5F' }}>{d.name}</span>
                    <span style={{ fontSize: 11, color: d.color, background: `${d.color}12`, padding: '2px 8px', borderRadius: 3 }}>{d.level}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: d.color, fontFamily: '"Noto Serif SC", serif' }}>{d.score}</span>
                </div>
                <div style={{ fontSize: 12, color: '#4A5A78', lineHeight: 1.6, paddingLeft: 18 }}>{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 个性化建议 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 40, marginTop: 24, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Icon name="sparkle" size={22} color={primary}/>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>给你的 3 条个性化建议</h3>
        </div>
        <p style={{ fontSize: 13, color: '#4A5A78', margin: '0 0 24px' }}>基于你的测评结果自动生成 · 无标准答案，请按需选择</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: 24, background: warm, borderRadius: 6, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 42, opacity: .1, color: primary, fontFamily: '"Noto Serif SC", serif', lineHeight: 1 }}>{i + 1}</div>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name={s.icon} size={22}/>
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: '#4A5A78', lineHeight: 1.8, marginTop: 8 }}>{s.desc}</p>
              <a href="#" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: primary, fontWeight: 500, textDecoration: 'none' }}>
                {s.action} <Icon name="arrow" size={12}/>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 推荐咨询师 + 预约 CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 24 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 2px 20px rgba(15,46,95,.04)' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>为你匹配的咨询师</h3>
          <p style={{ fontSize: 13, color: '#4A5A78', margin: '6px 0 20px' }}>基于你的测评结果与专业方向智能匹配</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recommendedCounselors.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#FBFAF7', borderRadius: 6 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 4,
                  background: `linear-gradient(135deg, ${primary}, ${primaryDark})`,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 600, fontFamily: '"Noto Serif SC", serif', flexShrink: 0,
                }}>{c.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F2E5F', fontFamily: '"Noto Serif SC", serif' }}>{c.name}</h4>
                    <span style={{ fontSize: 11, color: '#4A5A78' }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: primary, fontWeight: 600, background: `${primary}12`, padding: '2px 8px', borderRadius: 3 }}>匹配度 {c.match}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {c.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, color: '#4A5A78', border: '1px solid #E0E4EC', padding: '2px 8px', borderRadius: 3 }}>{t}</span>
                    ))}
                  </div>
                </div>
                <button style={{ background: primary, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                  预约咨询
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 免费咨询 CTA */}
        <div style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`, borderRadius: 8, padding: 32, color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }}/>
          <div style={{ fontSize: 11, opacity: .8, letterSpacing: 2, marginBottom: 8, position: 'relative' }}>新员工专属福利</div>
          <h3 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1.4, position: 'relative' }}>
            首次入职咨询<br/>免费预约（50 分钟）
          </h3>
          <p style={{ fontSize: 13, opacity: .85, lineHeight: 1.8, marginTop: 12, position: 'relative' }}>
            无论你现在是否有困扰，都建议使用这次免费机会与咨询师建立初步联系
          </p>
          <button style={{
            marginTop: 20, background: '#fff', color: primary, border: 'none',
            padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
            position: 'relative',
          }}>
            立即预约 <Icon name="arrow" size={14} color={primary}/>
          </button>
        </div>
      </div>

      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
        <button style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="edit" size={14}/> 下载完整报告 PDF
        </button>
        <button style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="chat" size={14}/> 就报告结果咨询
        </button>
        <a href="/" style={{ background: '#fff', color: '#0F2E5F', border: '1px solid #E0E4EC', padding: '12px 22px', borderRadius: 4, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          返回广厦心安首页 <Icon name="arrow" size={14}/>
        </a>
      </div>

      {/* 保密提示 */}
      <div style={{ marginTop: 32, padding: '20px 24px', background: '#FBFAF7', borderRadius: 6, borderLeft: `3px solid ${primary}`, fontSize: 13, color: '#4A5A78', lineHeight: 1.8 }}>
        <strong style={{ color: '#0F2E5F' }}>关于本报告 · </strong>
        本报告为你的私人心理档案，仅你本人可见。EAP 咨询师团队仅在你主动预约时才能查阅相关内容。
        中建三局人事、行政、你的直接上级<strong>均无权访问</strong>本报告的任何原始数据。
        你可以随时申请导出或删除全部数据。如有疑问，请拨打 400-880-6666。
      </div>
    </div>
  );
};

// ==================== 雷达图组件 ====================
const RadarChart = ({ dimensions, primary }) => {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 130;
  const angles = dimensions.map(d => (d.angle * Math.PI) / 180);

  const points = dimensions.map((d, i) => {
    const r = (d.score / 100) * maxR;
    return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
  });
  const pointsStr = points.map(p => p.join(',')).join(' ');

  const axisEnd = angles.map(a => [cx + maxR * Math.cos(a), cy + maxR * Math.sin(a)]);
  const labelPos = angles.map(a => [cx + (maxR + 24) * Math.cos(a), cy + (maxR + 24) * Math.sin(a)]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto' }}>
        {/* 背景圆 */}
        {[100, 75, 50, 25].map(v => {
          const r = (v / 100) * maxR;
          const grid = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          return <polygon key={v} points={grid.map(p => p.join(',')).join(' ')} fill="none" stroke="#E8ECF3" strokeWidth="0.7"/>;
        })}
        {/* 分数刻度 */}
        <text x={cx + 3} y={cy - maxR + 4} fontSize="9" fill="#8B96A8">100</text>
        <text x={cx + 3} y={cy - maxR*0.5 + 4} fontSize="9" fill="#8B96A8">50</text>
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
        {points.map((p, i) => (
          <text key={i} x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill={primary}>{dimensions[i].score}</text>
        ))}
        {/* 维度名 */}
        {labelPos.map((p, i) => (
          <text key={i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600" fill="#0F2E5F">{dimensions[i].name}</text>
        ))}
      </svg>
    </div>
  );
};

// ==================== 复用小组件 ====================
const StepIntro = ({ eyebrow, title, desc, primary }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 12, color: primary, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{eyebrow.toUpperCase()}</div>
    <h1 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: 34, fontWeight: 700, margin: 0, color: '#0F2E5F', letterSpacing: 2, lineHeight: 1.3 }}>{title}</h1>
    {desc && <p style={{ fontSize: 14, color: '#4A5A78', marginTop: 12, lineHeight: 1.8 }}>{desc}</p>}
  </div>
);

const StepActions = ({ onBack, onNext, nextDisabled, primary, backLabel = '上一步', nextLabel = '下一步 →' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 16 }}>
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
