/**
 * 企业专属站上下文：从定制首页进入子页后，返回链接应回到 `/{slug}`，
 * 而不是通用首页 `/`。通过查询参数 `e` 在子路由间传递。
 */

export const ENTERPRISE_QUERY_KEY = "e";

const RESERVED_FIRST_SEGMENTS = new Set([
  "",
  "about",
  "articles",
  "audios",
  "confidentiality",
  "contact",
  "counselors",
  "eap-services",
  "onboarding",
  "privacy",
  "api",
  "_next",
  "static",
  "assets",
  "favicon.ico",
]);

export function normalizeEnterpriseSlug(raw?: string | null): string {
  const value = String(raw || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
  if (!value || RESERVED_FIRST_SEGMENTS.has(value)) return "";
  if (!/^[a-z0-9][a-z0-9_-]{1,80}$/i.test(value)) return "";
  return value;
}

export function enterpriseSlugFromHomeHref(homeHref?: string | null): string {
  if (!homeHref || homeHref === "/") return "";
  const path = String(homeHref).split(/[?#]/)[0];
  const first = path.replace(/^\//, "").split("/")[0];
  return normalizeEnterpriseSlug(first);
}

export function homeHrefFromEnterpriseSlug(slug?: string | null): string {
  const value = normalizeEnterpriseSlug(slug);
  return value ? `/${value}` : "/";
}

export function onboardingHrefFromEnterpriseSlug(slug?: string | null): string {
  const value = normalizeEnterpriseSlug(slug);
  return value ? `/${value}/onboarding` : "/onboarding";
}

export function readEnterpriseSlug(
  searchParams?:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null,
): string {
  if (!searchParams) return "";
  if (typeof URLSearchParams !== "undefined" && searchParams instanceof URLSearchParams) {
    return normalizeEnterpriseSlug(searchParams.get(ENTERPRISE_QUERY_KEY));
  }
  const raw = (searchParams as Record<string, string | string[] | undefined>)[
    ENTERPRISE_QUERY_KEY
  ];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return normalizeEnterpriseSlug(value);
}

/** 给站内路径追加企业上下文；hash-only / 外链 / 已是企业首页路径则按规则处理。 */
export function withEnterpriseQuery(
  href: string,
  enterpriseSlug?: string | null,
): string {
  const slug = normalizeEnterpriseSlug(enterpriseSlug);
  if (!slug || !href) return href;

  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }

  if (href.startsWith("#")) {
    return `/${slug}${href}`;
  }

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";

  // 已是企业首页或企业测评路径，不再叠 query
  if (path === `/${slug}` || path === `/${slug}/onboarding`) {
    return `${path}${hash}`;
  }

  const params = new URLSearchParams(query);
  params.set(ENTERPRISE_QUERY_KEY, slug);
  const nextQuery = params.toString();
  return `${path}?${nextQuery}${hash}`;
}

export function resolveEnterpriseNav(
  searchParams?:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null,
) {
  const enterpriseSlug = readEnterpriseSlug(searchParams);
  return {
    enterpriseSlug,
    homeHref: homeHrefFromEnterpriseSlug(enterpriseSlug),
    onboardingHref: onboardingHrefFromEnterpriseSlug(enterpriseSlug),
    link: (href: string) => withEnterpriseQuery(href, enterpriseSlug),
  };
}
