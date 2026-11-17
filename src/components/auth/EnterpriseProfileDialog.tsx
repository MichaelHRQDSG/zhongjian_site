'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import { readEnterpriseToken } from '@/lib/enterprise-auth';
import { getBrowserAssessmentApiBaseUrl } from '@/lib/enterprise-assessments';
import {
  EMPTY_EMPLOYEE_INFO_FORM,
  isEmployeeInfoComplete,
  requiredEmployeeInfoFields,
} from '@/lib/enterprise-employee-info';
import {
  fetchEnterpriseOnboardingProgress,
  OnboardingProgressConflictError,
  putEnterpriseOnboardingProgressWithRetry,
  type OnboardingProgressSnapshot,
} from '@/lib/enterprise-onboarding-progress';

async function fetchEnterpriseFieldConfig(apiBaseUrl: string, slug: string) {
  const base = (apiBaseUrl || '').replace(/\/$/, '');
  const token = readEnterpriseToken(slug);
  const response = await fetch(
    `${base}/api/web/assessment-enterprises/${encodeURIComponent(slug)}`,
    {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (!response.ok) return null;
  const raw = await response.json().catch(() => ({}));
  const payload =
    raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object'
      ? raw.data
      : raw;
  return payload && typeof payload === 'object' ? payload : null;
}

const DEFAULT_VISIBLE = [
  'empNo', 'name', 'gender', 'age', 'edu', 'joinDate',
  'dept', 'post', 'category', 'workLoc', 'livingStatus', 'hasFamily',
];

const fieldStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #D8DEE9',
  borderRadius: 6,
  fontSize: 14,
  color: '#0F2E5F',
  background: '#fff',
};

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 13, color: '#4A5A78', fontWeight: 500 }}>
        {label}
        {required ? <span style={{ color: '#C8161D', marginLeft: 4 }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
  primary,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  primary: string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              border: active ? `1.5px solid ${primary}` : '1.5px solid #D8DEE9',
              background: active ? `${primary}12` : '#fff',
              color: active ? primary : '#4A5A78',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={fieldStyle}
    >
      <option value="">请选择</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

/**
 * 右上角账号名打开：编辑已同步到服务端进度里的员工基本信息。
 */
export function EnterpriseProfileDialog({
  apiBaseUrl,
  slug,
  open,
  onClose,
  primary = '#1E4C9A',
}: {
  apiBaseUrl?: string;
  slug: string;
  open: boolean;
  onClose: () => void;
  primary?: string;
}) {
  const base = apiBaseUrl ?? getBrowserAssessmentApiBaseUrl();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [visibleFields, setVisibleFields] = useState<string[]>(DEFAULT_VISIBLE);
  const [customFields, setCustomFields] = useState<Array<{ id: string; label: string }>>([]);
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY_EMPLOYEE_INFO_FORM });
  const [progressBase, setProgressBase] = useState<OnboardingProgressSnapshot | null>(null);

  useEffect(() => {
    if (!open || !slug) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    setNotice('');
    (async () => {
      try {
        const [enterprise, progress] = await Promise.all([
          fetchEnterpriseFieldConfig(base, slug),
          fetchEnterpriseOnboardingProgress(base, slug),
        ]);
        if (cancelled) return;
        const fields = Array.isArray(enterprise?.employeeInfoFields)
          ? enterprise.employeeInfoFields.map(String)
          : [];
        if (fields.length) setVisibleFields(fields);
        const customs = Array.isArray(enterprise?.customEmployeeInfoFields)
          ? enterprise.customEmployeeInfoFields
          : [];
        if (customs.length) {
          setCustomFields(
            customs
              .filter((f: { id?: string; label?: string }) => f?.id && f?.label)
              .map((f: { id: string; label: string }) => ({
                id: String(f.id),
                label: String(f.label),
              })),
          );
        }
        const basic =
          progress?.basicInfo && typeof progress.basicInfo === 'object'
            ? (progress.basicInfo as Record<string, unknown>)
            : {};
        const nextForm = {
          ...EMPTY_EMPLOYEE_INFO_FORM,
          ...Object.fromEntries(
            Object.entries(basic).map(([k, v]) => [k, v == null ? '' : String(v)]),
          ),
        };
        setForm(nextForm);
        setProgressBase(progress);
        const hasBasic = Object.values(nextForm).some((value) => String(value || '').trim());
        if (hasBasic) {
          setNotice('已载入云端保存的个人信息');
        } else if (progress?.exists) {
          setNotice('云端暂无基本信息，请填写后保存，之后换设备可自动带入');
        } else {
          setNotice('尚未同步过个人信息，请填写并保存');
        }
      } catch {
        if (!cancelled) setError('加载个人信息失败，请稍后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [base, open, slug]);

  const shown = useMemo(() => {
    if (visibleFields.length > 0) {
      return DEFAULT_VISIBLE.filter((id) => visibleFields.includes(id));
    }
    return DEFAULT_VISIBLE;
  }, [visibleFields]);
  const show = (id: string) => shown.includes(id);
  const required = requiredEmployeeInfoFields(visibleFields);
  const shownCustom = customFields.filter((f) => visibleFields.includes(f.id));
  const canSave = isEmployeeInfoComplete(form, visibleFields);

  const set = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const remote = await fetchEnterpriseOnboardingProgress(base, slug);
      const source = remote || progressBase;
      if (remote) setProgressBase(remote);
      const saved = await putEnterpriseOnboardingProgressWithRetry(base, slug, {
        step: String(source?.step || 'select'),
        activeScaleId: String(source?.activeScaleId || ''),
        answersByScale:
          source?.answersByScale && typeof source.answersByScale === 'object'
            ? source.answersByScale
            : {},
        basicInfo: form,
        completedScaleIds: Array.isArray(source?.completedScaleIds)
          ? source.completedScaleIds.map(String)
          : [],
        resultsByScale:
          source?.resultsByScale && typeof source.resultsByScale === 'object'
            ? source.resultsByScale
            : {},
        status: source?.status === 'completed' ? 'completed' : 'in_progress',
        clientUpdatedAt:
          typeof source?.updatedAt === 'string' ? source.updatedAt : null,
      });
      if (saved) {
        setProgressBase(saved);
        setNotice('已保存，换设备登录后会自动带入');
        window.setTimeout(() => onClose(), 600);
      } else {
        setError('保存失败，请稍后重试');
      }
    } catch (err) {
      if (err instanceof OnboardingProgressConflictError) {
        setProgressBase(err.progress);
        const basic = err.progress.basicInfo && typeof err.progress.basicInfo === 'object'
          ? err.progress.basicInfo
          : {};
        setForm({
          ...EMPTY_EMPLOYEE_INFO_FORM,
          ...Object.fromEntries(Object.entries(basic).map(([k, v]) => [k, v == null ? '' : String(v)])),
        });
        setError('其他设备刚更新了进度，已载入最新基本信息，请确认后再保存');
      } else {
        setError(err instanceof Error ? err.message : '保存失败，请稍后重试');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="zj-profile-dialog-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(10, 30, 66, 0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(720px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 16px 48px rgba(15,46,95,.18)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 22px',
          borderBottom: '1px solid #E8ECF3',
        }}>
          <div>
            <div id="zj-profile-dialog-title" style={{ fontSize: 18, fontWeight: 700, color: '#0F2E5F' }}>
              管理个人信息
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#8B96A8' }}>
              首次填写后，测评流程将自动跳过基本信息页；可在此随时修改。
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8B96A8',
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
            }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div style={{ padding: 22 }}>
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#8B96A8', fontSize: 14 }}>
              正在加载…
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {show('empNo') && (
                  <FormField label="工号" required={required.includes('empNo')}>
                    <input value={form.empNo || ''} onChange={(e) => set('empNo', e.target.value)} style={fieldStyle} />
                  </FormField>
                )}
                {show('name') && (
                  <FormField label="姓名" required={required.includes('name')}>
                    <input value={form.name || ''} onChange={(e) => set('name', e.target.value)} style={fieldStyle} />
                  </FormField>
                )}
                {show('gender') && (
                  <FormField label="性别" required={required.includes('gender')}>
                    <SegmentedControl options={['男', '女', '不愿透露']} value={form.gender || ''} onChange={(v) => set('gender', v)} primary={primary} />
                  </FormField>
                )}
                {show('age') && (
                  <FormField label="年龄" required={required.includes('age')}>
                    <SegmentedControl options={['≤22', '23-28', '29-35', '36-45', '46+']} value={form.age || ''} onChange={(v) => set('age', v)} primary={primary} />
                  </FormField>
                )}
                {show('edu') && (
                  <FormField label="学历">
                    <Select value={form.edu || ''} onChange={(v) => set('edu', v)} options={['大专', '本科', '硕士', '博士', '其他']} />
                  </FormField>
                )}
                {show('joinDate') && (
                  <FormField label="到岗日期">
                    <input type="date" value={form.joinDate || ''} onChange={(e) => set('joinDate', e.target.value)} style={fieldStyle} />
                  </FormField>
                )}
                {show('dept') && (
                  <FormField label="所属部门" required={required.includes('dept')}>
                    <input value={form.dept || ''} onChange={(e) => set('dept', e.target.value)} style={fieldStyle} />
                  </FormField>
                )}
                {show('post') && (
                  <FormField label="岗位" required={required.includes('post')}>
                    <input value={form.post || ''} onChange={(e) => set('post', e.target.value)} style={fieldStyle} />
                  </FormField>
                )}
                {show('category') && (
                  <FormField label="岗位类别" required={required.includes('category')}>
                    <SegmentedControl options={['一线业务', '项目管理', '职能支持', '技术研发']} value={form.category || ''} onChange={(v) => set('category', v)} primary={primary} />
                  </FormField>
                )}
                {show('workLoc') && (
                  <FormField label="工作地" required={required.includes('workLoc')}>
                    <SegmentedControl options={['办公现场', '公司本部', '远程办公']} value={form.workLoc || ''} onChange={(v) => set('workLoc', v)} primary={primary} />
                  </FormField>
                )}
                {show('livingStatus') && (
                  <FormField label="居住状况">
                    <SegmentedControl options={['与家人同住', '独居', '单位宿舍', '合租']} value={form.livingStatus || ''} onChange={(v) => set('livingStatus', v)} primary={primary} />
                  </FormField>
                )}
                {show('hasFamily') && (
                  <FormField label="是否与家人异地">
                    <SegmentedControl options={['同城', '异地', '暂无家人']} value={form.hasFamily || ''} onChange={(v) => set('hasFamily', v)} primary={primary} />
                  </FormField>
                )}
                {shownCustom.map((field) => (
                  <FormField key={field.id} label={field.label}>
                    <input
                      value={form[field.id] || ''}
                      onChange={(e) => set(field.id, e.target.value)}
                      style={fieldStyle}
                    />
                  </FormField>
                ))}
              </div>

              {error ? <div style={{ color: '#C8161D', fontSize: 13 }}>{error}</div> : null}
              {notice ? <div style={{ color: '#1E7A46', fontSize: 13 }}>{notice}</div> : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    border: '1px solid #D8DEE9',
                    background: '#fff',
                    borderRadius: 6,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: '#4A5A78',
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!canSave || saving}
                  onClick={() => void handleSave()}
                  style={{
                    border: 'none',
                    background: canSave && !saving ? primary : '#A8B3C7',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '10px 18px',
                    cursor: canSave && !saving ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                  }}
                >
                  {saving ? '保存中…' : '保存'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
