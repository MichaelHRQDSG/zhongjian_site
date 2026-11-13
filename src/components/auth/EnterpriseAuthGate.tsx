'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import {
  EnterpriseGateLoading,
  EnterpriseLoginDialog,
  EnterpriseLoginScreen,
  EnterpriseSessionBar,
  brandFromStatus,
} from '@/components/auth/EnterpriseLogin';
import {
  clearEnterpriseToken,
  describeEnterpriseTarget,
  fetchEnterpriseAuthStatus,
  isEnterpriseHomePath,
  protectedNavigationTarget,
  readEnterpriseToken,
  type EnterpriseAuthStatus,
} from '@/lib/enterprise-auth';
import {
  ENTERPRISE_QUERY_KEY,
  normalizeEnterpriseSlug,
} from '@/lib/enterprise-context';

/** 状态接口不可用时与原逻辑一致：放行页面，真正的数据仍由后端按登录态控制。 */
const UNREACHABLE_STATUS: EnterpriseAuthStatus = {
  loginRequired: false,
  authenticated: true,
  siteName: '',
  companyName: '',
  logoUrl: '',
  slogan: '',
  profile: null,
};

type LoadedAuth = { slug: string; status: EnterpriseAuthStatus; token: string };

/**
 * 企业定制站登录：
 * - 企业首页 `/{slug}` 不需要登录，直接展示；
 * - 在首页点击任何二级页面（测评、图文、咨询师、EAP 服务等）时弹出登录，登录后直达该页面；
 * - 直接打开二级页面链接（含刷新、分享链接）时显示整页登录。
 */
export function EnterpriseAuthGate({
  apiBaseUrl,
  children,
}: {
  apiBaseUrl: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const pathSlug = useMemo(
    () => normalizeEnterpriseSlug(pathname.replace(/^\//, '').split('/')[0]),
    [pathname],
  );
  const slug = pathSlug || normalizeEnterpriseSlug(searchParams.get(ENTERPRISE_QUERY_KEY));
  const isHome = Boolean(pathSlug) && isEnterpriseHomePath(pathname, pathSlug);

  const [auth, setAuth] = useState<LoadedAuth | null>(null);
  // undefined = 未打开；null = 从顶部“登录”按钮打开（无目标页）；字符串 = 登录后要前往的地址
  const [loginTarget, setLoginTarget] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    const token = readEnterpriseToken(slug);
    fetchEnterpriseAuthStatus(apiBaseUrl, slug)
      .then((status) => {
        if (!cancelled) setAuth({ slug, status, token });
      })
      .catch(() => {
        if (!cancelled) setAuth({ slug, status: UNREACHABLE_STATUS, token });
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, slug]);

  const status = auth && auth.slug === slug ? auth.status : null;
  const needsLogin = Boolean(status?.loginRequired && !status.authenticated);
  const loadedToken = auth && auth.slug === slug ? auth.token : '';

  // 首页：拦截指向二级页面的站内链接，先弹登录（新标签页打开等带修饰键的点击照常放行，由目标页整页登录兜底）
  useEffect(() => {
    if (!slug || !isHome || !needsLogin) return undefined;
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return;
      const target = (anchor.getAttribute('target') || '').toLowerCase();
      if (target && target !== '_self') return;
      const next = protectedNavigationTarget(anchor.href, slug, window.location.origin);
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      setLoginTarget(next);
    };
    // 捕获阶段挂在 window 上，先于页面里的链接 / React 事件处理
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [isHome, needsLogin, slug]);

  // 浏览器“后退”从往返缓存恢复页面时，弹窗可能还开着；若期间登录 / 退出过就整页刷新
  useEffect(() => {
    if (!slug) return undefined;
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setLoginTarget(undefined);
      if (readEnterpriseToken(slug) !== loadedToken) window.location.reload();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [loadedToken, slug]);

  const closeLogin = useCallback(() => setLoginTarget(undefined), []);

  if (!slug) return <>{children}</>;

  const brand = brandFromStatus(status);
  const homeHref = `/${slug}`;
  const logout = () => {
    clearEnterpriseToken(slug);
    // 二级页面都需要登录，退出后回到首页
    if (isHome) window.location.reload();
    else window.location.assign(homeHref);
  };

  if (isHome) {
    return (
      <>
        {status?.loginRequired ? (
          <EnterpriseSessionBar
            brand={brand}
            profile={status.authenticated ? status.profile : null}
            onLogin={() => setLoginTarget(null)}
            onLogout={logout}
          />
        ) : null}
        {children}
        {needsLogin && loginTarget !== undefined ? (
          <EnterpriseLoginDialog
            apiBaseUrl={apiBaseUrl}
            brand={brand}
            slug={slug}
            targetLabel={loginTarget ? describeEnterpriseTarget(loginTarget) : ''}
            onClose={closeLogin}
            onSuccess={() => {
              // 整页跳转，让服务端组件带上新的登录 Cookie 重新渲染
              if (loginTarget) window.location.assign(loginTarget);
              else window.location.reload();
            }}
          />
        ) : null}
      </>
    );
  }

  if (!status) return <EnterpriseGateLoading />;

  if (needsLogin) {
    return (
      <EnterpriseLoginScreen
        apiBaseUrl={apiBaseUrl}
        brand={brand}
        homeHref={homeHref}
        slug={slug}
        targetLabel={describeEnterpriseTarget(pathname)}
        onSuccess={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      {status.loginRequired && status.profile ? (
        <EnterpriseSessionBar
          brand={brand}
          profile={status.profile}
          onLogin={() => undefined}
          onLogout={logout}
        />
      ) : null}
      {children}
    </>
  );
}
