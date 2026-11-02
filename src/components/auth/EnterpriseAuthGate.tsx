'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import {
  clearEnterpriseToken,
  fetchEnterpriseAuthStatus,
  loginEnterpriseSite,
  type EnterpriseAuthStatus,
} from '@/lib/enterprise-auth';
import {
  ENTERPRISE_QUERY_KEY,
  normalizeEnterpriseSlug,
} from '@/lib/enterprise-context';

export function EnterpriseAuthGate({
  apiBaseUrl,
  children,
}: {
  apiBaseUrl: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const slug = useMemo(() => {
    const first = pathname.replace(/^\//, '').split('/')[0];
    return normalizeEnterpriseSlug(first) || normalizeEnterpriseSlug(searchParams.get(ENTERPRISE_QUERY_KEY));
  }, [pathname, searchParams]);

  const [status, setStatus] = useState<EnterpriseAuthStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) {
      setStatus(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchEnterpriseAuthStatus(apiBaseUrl, slug)
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({
            loginRequired: false,
            authenticated: true,
            siteName: '',
            companyName: '',
            logoUrl: '',
            slogan: '',
            profile: null,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, slug]);

  if (!slug) return <>{children}</>;
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-warm-light)] text-sm text-[var(--color-text-muted)]">
        正在进入企业站点...
      </div>
    );
  }
  if (status?.loginRequired && !status.authenticated) {
    const siteName = status.siteName || '企业 EAP';
    return (
      <div className="min-h-screen bg-[var(--color-warm-light)]">
        <header className="bg-[var(--color-primary-dark)] px-6 py-5 text-white">
          <div className="mx-auto flex max-w-md items-center gap-3">
            {status.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="h-10 w-10 rounded bg-white object-contain p-1" src={status.logoUrl} />
            ) : null}
            <div>
              <div className="text-base font-medium">{siteName}</div>
              <div className="text-xs text-white/70">{status.companyName || '请使用企业下发的账号登录'}</div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-md px-6 py-12">
          <form
            className="rounded-2xl border border-[var(--color-border-1)] bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              setError('');
              setSubmitting(true);
              void loginEnterpriseSite(apiBaseUrl, slug, username.trim(), password)
                .then(() => window.location.reload())
                .catch((err) => setError(err instanceof Error ? err.message : '登录失败'))
                .finally(() => setSubmitting(false));
            }}
          >
            <h1 className="text-lg font-semibold text-[var(--color-text-strong)]">登录后进入站点</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              使用本企业人员表中的账号和密码。此登录仅对本企业定制网页有效。
            </p>
            <label className="mt-5 block text-xs text-[var(--color-text-muted)]">
              账号
              <input
                autoComplete="username"
                className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border-1)] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--color-text-muted)]">
              密码
              <input
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border-1)] px-3 text-sm outline-none focus:border-[var(--color-primary)]"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="mt-3 text-sm text-[var(--color-accent)]">{error}</p> : null}
            <button
              className="mt-6 h-11 w-full rounded-xl bg-[var(--color-primary)] text-sm font-medium text-white disabled:opacity-60"
              disabled={submitting || !username.trim() || !password}
              type="submit"
            >
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <>
      {status?.loginRequired && status.profile ? (
        <div className="flex items-center justify-end gap-3 bg-[var(--color-primary-dark)] px-4 py-2 text-xs text-white/80">
          <span>已登录：{status.profile.realName || status.profile.username}</span>
          <button
            className="underline decoration-white/40 underline-offset-2"
            type="button"
            onClick={() => {
              clearEnterpriseToken(slug);
              window.location.reload();
            }}
          >
            退出
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}
