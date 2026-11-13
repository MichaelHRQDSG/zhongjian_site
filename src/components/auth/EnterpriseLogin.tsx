'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';

import {
  browserLogoUrl,
  loginEnterpriseSite,
  loginErrorText,
  type EnterpriseAuthStatus,
  type EnterpriseSiteProfile,
} from '@/lib/enterprise-auth';

/**
 * 企业定制站的登录界面：
 * - EnterpriseLoginDialog：首页点二级页面时弹出（桌面居中弹窗，手机底部弹层），登录后直达目标页；
 * - EnterpriseLoginScreen：直接打开二级页面链接时的整页登录；
 * - EnterpriseSessionBar：顶部细条，显示登录入口或当前登录人。
 */

export interface EnterpriseLoginBrand {
  siteName: string;
  companyName: string;
  logoUrl: string;
  slogan: string;
}

export function brandFromStatus(status: EnterpriseAuthStatus | null): EnterpriseLoginBrand {
  return {
    siteName: (status?.siteName || '').trim() || '企业 EAP',
    companyName: (status?.companyName || '').trim(),
    logoUrl: browserLogoUrl(status?.logoUrl || ''),
    slogan: (status?.slogan || '').trim(),
  };
}

const SERIF: CSSProperties = { fontFamily: 'var(--font-serif)' };

// ==================== 图标 ====================

function Svg({ children, size = 18, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

const UserIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.6-3.6 4.4-5.4 8-5.4s6.4 1.8 8 5.4" />
  </Svg>
);
const LockIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <rect height="10" rx="2.5" width="15" x="4.5" y="10.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </Svg>
);
const EyeIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
const EyeOffIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 0 1-3.1 3.9M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);
const ShieldIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M12 3l7.5 3v5.6c0 4.6-3.2 8.3-7.5 9.4-4.3-1.1-7.5-4.8-7.5-9.4V6L12 3Z" />
    <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
  </Svg>
);
const CloseIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
const AlertIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </Svg>
);
const ArrowIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
const BackIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
const HeartIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.6 12 20 12 20Z" />
  </Svg>
);
const CompassIcon = (props: { size?: number; className?: string }) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" />
  </Svg>
);

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity="0.25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

// ==================== 品牌标识 ====================

function BrandMark({
  brand,
  size,
  variant = 'plain',
}: {
  brand: EnterpriseLoginBrand;
  size: number;
  variant?: 'plain' | 'tile';
}) {
  const [failedUrl, setFailedUrl] = useState('');
  const initial = Array.from(brand.siteName)[0] || '心';
  const frame = variant === 'tile' ? 'bg-white p-1 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.5)]' : '';
  if (brand.logoUrl && failedUrl !== brand.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className={`shrink-0 rounded-[10px] object-contain ${frame}`}
        height={size}
        src={brand.logoUrl}
        style={{ width: size, height: size }}
        width={size}
        onError={() => setFailedUrl(brand.logoUrl)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-[10px] bg-[var(--color-primary)] font-bold text-white"
      style={{ ...SERIF, width: size, height: size, fontSize: Math.round(size * 0.46) }}
    >
      {initial}
    </span>
  );
}

// ==================== 登录表单 ====================

const INPUT_CLASS =
  'h-12 w-full rounded-xl border border-[#D9DFEA] bg-[#F7F9FC] text-base text-[var(--color-text-body)] outline-none transition placeholder:text-[#A3ADBF] focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[rgba(30,76,154,0.12)]';

function prefersPointerFocus() {
  // 手机上自动聚焦会立刻弹出键盘、挡住说明文字，只在有鼠标的设备上自动聚焦
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;
}

export function EnterpriseLoginForm({
  apiBaseUrl,
  slug,
  autoFocus = false,
  onBusyChange,
  onSuccess,
}: {
  apiBaseUrl: string;
  slug: string;
  autoFocus?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onSuccess: () => void;
}) {
  const ids = useId();
  const usernameRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    if (autoFocus && prefersPointerFocus()) usernameRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const canSubmit = phase === 'idle' && Boolean(username.trim()) && Boolean(password);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError('');
    setPhase('submitting');
    onBusyChange?.(true);
    loginEnterpriseSite(apiBaseUrl, slug, username.trim(), password)
      .then(() => {
        setPhase('success');
        onSuccess();
      })
      .catch((err: unknown) => {
        setPhase('idle');
        onBusyChange?.(false);
        setError(loginErrorText(err));
      });
  };

  return (
    <form className="mt-6" noValidate onSubmit={submit}>
      <label className="block text-[13px] font-medium text-[var(--color-text-body)]" htmlFor={`${ids}-username`}>
        账号
      </label>
      <div className="group relative mt-2">
        <UserIcon
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] transition group-focus-within:text-[var(--color-primary)]"
        />
        <input
          ref={usernameRef}
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect="off"
          className={`${INPUT_CLASS} pl-11 pr-3`}
          disabled={phase !== 'idle'}
          id={`${ids}-username`}
          name="username"
          placeholder="请输入企业下发的账号"
          spellCheck={false}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (error) setError('');
          }}
        />
      </div>

      <label className="mt-5 block text-[13px] font-medium text-[var(--color-text-body)]" htmlFor={`${ids}-password`}>
        密码
      </label>
      <div className="group relative mt-2">
        <LockIcon
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] transition group-focus-within:text-[var(--color-primary)]"
        />
        <input
          autoComplete="current-password"
          className={`${INPUT_CLASS} pl-11 pr-12`}
          disabled={phase !== 'idle'}
          enterKeyHint="go"
          id={`${ids}-password`}
          name="password"
          placeholder="请输入密码"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError('');
          }}
        />
        <button
          aria-label={showPassword ? '隐藏密码' : '显示密码'}
          aria-pressed={showPassword}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--color-text-faint)] transition hover:bg-[#EDF1F7] hover:text-[var(--color-text-body)]"
          type="button"
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {error ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-xl border border-[rgba(200,22,29,0.18)] bg-[rgba(200,22,29,0.05)] px-3.5 py-2.5 text-[13px] leading-5 text-[var(--color-accent)]"
          role="alert"
        >
          <AlertIcon className="mt-px shrink-0" size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <button
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-[15px] font-semibold tracking-[0.12em] text-white shadow-[0_14px_28px_-14px_rgba(30,76,154,0.85)] transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:bg-[#9DB0D1] disabled:shadow-none"
        disabled={!canSubmit}
        type="submit"
      >
        {phase === 'submitting' ? (
          <>
            <Spinner /> 登录中…
          </>
        ) : phase === 'success' ? (
          <>
            <Spinner /> 登录成功，正在进入…
          </>
        ) : (
          '登录'
        )}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-[var(--color-text-faint)]">
        账号由所在企业统一发放；忘记密码或无法登录，请联系本企业 EAP 管理员
      </p>
    </form>
  );
}

function PrivacyNote({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl bg-[var(--color-warm-light)] px-3.5 py-3 text-xs leading-5 text-[var(--color-text-muted)] ${className}`}
    >
      <ShieldIcon className="mt-px shrink-0 text-[var(--color-primary)]" size={16} />
      <span>登录信息仅用于本企业 EAP 服务，你的个人信息与测评结果将被严格保密。</span>
    </div>
  );
}

function TargetHint({ label, compact = false }: { label: string; compact?: boolean }) {
  if (!label) {
    return (
      <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-muted)]">
        登录后即可使用本企业专属的全部 EAP 服务
      </p>
    );
  }
  return (
    <p
      className={`mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-[rgba(30,76,154,0.07)] text-[var(--color-primary)] ${
        compact ? 'px-3 py-1 text-[12.5px]' : 'px-3.5 py-1.5 text-[13px]'
      }`}
    >
      <ArrowIcon className="shrink-0" size={14} />
      <span className="truncate">
        登录后将为你打开「<strong className="font-semibold">{label}</strong>」
      </span>
    </p>
  );
}

// ==================== 首页弹窗 ====================

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function EnterpriseLoginDialog({
  apiBaseUrl,
  brand,
  slug,
  targetLabel,
  onClose,
  onSuccess,
}: {
  apiBaseUrl: string;
  brand: EnterpriseLoginBrand;
  slug: string;
  targetLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const requestClose = useCallback(() => {
    // 登录请求进行中不允许关闭，避免关掉后又突然跳转
    if (!busyRef.current) onClose();
  }, [onClose]);

  useEffect(() => {
    const root = document.documentElement;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }
      const panel = panelRef.current;
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [requestClose]);

  return (
    <div
      className="zj-login-overlay fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(10,30,66,0.5)] backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="zj-login-sheet relative max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-white px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_48px_rgba(10,30,66,0.28)] sm:max-w-[430px] sm:rounded-[22px] sm:px-9 sm:pb-8 sm:pt-8 sm:shadow-[0_40px_90px_-24px_rgba(10,30,66,0.55)]"
        role="dialog"
      >
        <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#D9DFEA] sm:hidden" />
        <button
          aria-label="关闭"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-[var(--color-text-faint)] transition hover:bg-[#F1F4F9] hover:text-[var(--color-text-body)] sm:right-4 sm:top-4"
          type="button"
          onClick={requestClose}
        >
          <CloseIcon />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <BrandMark brand={brand} size={42} />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-bold tracking-[0.08em] text-[var(--color-primary)]" style={SERIF}>
              {brand.siteName}
            </div>
            {brand.companyName ? (
              <div className="truncate text-[11.5px] text-[var(--color-text-muted)]">{brand.companyName}</div>
            ) : null}
          </div>
        </div>

        <h2 className="mt-6 text-[22px] font-bold leading-tight text-[var(--color-text-strong)]" id={titleId} style={SERIF}>
          员工登录
        </h2>
        <TargetHint compact label={targetLabel} />

        <EnterpriseLoginForm
          autoFocus
          apiBaseUrl={apiBaseUrl}
          slug={slug}
          onBusyChange={(busy) => {
            busyRef.current = busy;
          }}
          onSuccess={onSuccess}
        />
        <PrivacyNote className="mt-5" />
      </div>
    </div>
  );
}

// ==================== 二级页面整页登录 ====================

const FEATURES = [
  { icon: CompassIcon, title: '专业', text: '由专业心理服务机构运营，遵守行业伦理守则' },
  { icon: ShieldIcon, title: '保密', text: '个人信息与测评结果严格保密，仅用于 EAP 服务' },
  { icon: HeartIcon, title: '陪伴', text: '测评、心理知识与咨询支持，随时为你提供帮助' },
];

export function EnterpriseLoginScreen({
  apiBaseUrl,
  brand,
  homeHref,
  slug,
  targetLabel,
  onSuccess,
}: {
  apiBaseUrl: string;
  brand: EnterpriseLoginBrand;
  homeHref: string;
  slug: string;
  targetLabel: string;
  onSuccess: () => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-warm-light)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(30,76,154,0.12),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(200,22,29,0.07),transparent_38%)]"
      />
      <header className="relative mx-auto flex max-w-[1040px] items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-6">
        <a className="flex min-w-0 items-center gap-3 no-underline" href={homeHref}>
          <BrandMark brand={brand} size={38} />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-bold tracking-[0.1em] text-[var(--color-primary)]" style={SERIF}>
              {brand.siteName}
            </div>
            {brand.companyName ? (
              <div className="truncate text-[11px] text-[var(--color-text-muted)]">{brand.companyName}</div>
            ) : null}
          </div>
        </a>
        <a
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border-1)] bg-white/80 px-3.5 py-1.5 text-[13px] text-[var(--color-text-muted)] no-underline transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          href={homeHref}
        >
          <BackIcon size={15} />
          返回首页
        </a>
      </header>

      <main className="relative mx-auto max-w-[1040px] px-4 pb-12 sm:px-8 sm:pb-16 sm:pt-4">
        <div className="zj-login-rise mx-auto grid max-w-[940px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_90px_-40px_rgba(10,30,66,0.5)] md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <aside className="relative overflow-hidden bg-[linear-gradient(150deg,var(--color-primary)_0%,var(--color-primary-dark)_58%,var(--color-primary-deep)_100%)] px-6 py-7 text-white sm:px-10 md:py-12">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.05]" />
            <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="relative">
              <div className="text-[10.5px] tracking-[0.32em] text-white/55">EMPLOYEE ASSISTANCE PROGRAM</div>
              <div className="mt-4 flex items-center gap-3 md:mt-7 md:block">
                <span className="md:hidden">
                  <BrandMark brand={brand} size={44} variant="tile" />
                </span>
                <div className="min-w-0">
                  <div className="text-[24px] font-bold leading-snug tracking-[0.08em] md:text-[30px]" style={SERIF}>
                    {brand.siteName}
                  </div>
                  {brand.companyName ? (
                    <div className="mt-1 text-[13px] text-white/70 md:mt-2">{brand.companyName}</div>
                  ) : null}
                </div>
              </div>
              {brand.slogan ? (
                <p className="mt-4 text-[14px] leading-7 text-white/85 md:mt-6 md:text-[15px]" style={SERIF}>
                  「{brand.slogan}」
                </p>
              ) : null}
              <ul className="mt-10 hidden list-none space-y-5 p-0 md:block">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <li className="flex items-start gap-3.5" key={title}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white">
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold tracking-[0.1em]">{title}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-5 text-white/65">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="px-6 py-8 sm:px-10 md:py-12">
            <h1 className="text-[24px] font-bold leading-tight text-[var(--color-text-strong)] sm:text-[26px]" style={SERIF}>
              员工登录
            </h1>
            <TargetHint label={targetLabel} />
            <EnterpriseLoginForm autoFocus apiBaseUrl={apiBaseUrl} slug={slug} onSuccess={onSuccess} />
            <PrivacyNote className="mt-6" />
          </section>
        </div>
      </main>
    </div>
  );
}

// ==================== 顶部登录状态条 ====================

export function EnterpriseSessionBar({
  brand,
  profile,
  onLogin,
  onLogout,
}: {
  brand: EnterpriseLoginBrand;
  profile: EnterpriseSiteProfile | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const displayName = profile ? (profile.realName || profile.username || '').trim() || '员工' : '';
  return (
    <div className="zj-session-bar relative z-[60] bg-[var(--color-primary-deep)] text-white">
      <div className="mx-auto flex h-9 max-w-[1360px] items-center justify-between gap-3 px-4 text-xs sm:px-10">
        <div className="flex min-w-0 items-center gap-2 text-white/65">
          <ShieldIcon className="shrink-0 text-white/55" size={14} />
          <span className="truncate">{brand.companyName || brand.siteName} · 员工专属服务</span>
        </div>
        {profile ? (
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-[11px] font-semibold">
                {Array.from(displayName)[0]}
              </span>
              <span className="max-w-[8em] truncate text-white/90">{displayName}</span>
            </span>
            <button
              className="text-white/60 underline-offset-2 transition hover:text-white hover:underline"
              type="button"
              onClick={onLogout}
            >
              退出登录
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-white/55 md:inline">登录后即可使用全部服务</span>
            <button
              className="rounded-full bg-white px-3.5 py-1 text-[12px] font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-warm-base)]"
              type="button"
              onClick={onLogin}
            >
              登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EnterpriseGateLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--color-warm-light)]">
      <div className="flex flex-col items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
        <Spinner className="h-6 w-6 text-[var(--color-primary)]" />
        正在进入企业站点…
      </div>
    </div>
  );
}
