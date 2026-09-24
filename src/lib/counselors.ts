/**
 * 首页咨询师数据：可用环境变量切换「模拟数据 / mini-production 真实数据」。
 *
 * USE_REAL_COUNSELORS=true  → 请求 MINI_PRODUCTION_API_BASE_URL 的公开咨询师列表
 * USE_REAL_COUNSELORS=false → 使用下方 MOCK_COUNSELORS（默认）
 */

import { unstable_noStore as noStore } from 'next/cache';

export type CounselorCard = {
  name: string;
  title: string;
  tags: string[];
  years: string;
  cases: string;
  /** 右侧指标单位：模拟数据用「案例」，真实数据用「小时」 */
  casesUnit?: string;
  avatarUrl?: string;
};

export type CounselorsSource = 'real' | 'mock';

export type HomeCounselorsResult = {
  items: CounselorCard[];
  total: number;
  source: CounselorsSource;
};

/** 与 shared/data.tsx 中 COUNSELORS 保持一致，供服务端安全引用（不可 import 'use client' 模块）。 */
export const MOCK_COUNSELORS: CounselorCard[] = [
  {
    name: '林晚晴',
    title: '国家二级心理咨询师',
    tags: ['职场焦虑', '失眠', '一线员工'],
    years: '12 年',
    cases: '1200+',
    casesUnit: '案例',
  },
  {
    name: '苏雅文',
    title: 'EAP 高级顾问',
    tags: ['团队管理', '中层压力'],
    years: '15 年',
    cases: '1800+',
    casesUnit: '案例',
  },
  {
    name: '陈牧之',
    title: '婚姻家庭治疗师',
    tags: ['异地情感', '亲子关系'],
    years: '10 年',
    cases: '960+',
    casesUnit: '案例',
  },
  {
    name: '周航',
    title: '临床心理学博士',
    tags: ['创伤修复', '职业倦怠'],
    years: '18 年',
    cases: '2100+',
    casesUnit: '案例',
  },
];

function envFlagTrue(value: string | undefined): boolean {
  const v = (value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function splitTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean).slice(0, 3);
  }
  const text = String(raw || '').trim();
  if (!text) return [];
  return text
    .split(/[\s,，、/;|]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function absoluteMediaUrl(path: unknown, apiBase: string): string | undefined {
  const value = String(path || '').trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const origin = apiBase.replace(/\/$/, '');
  // 本机 API 时头像仍走公网静态域名，避免浏览器访问 127.0.0.1
  const publicOrigin =
    process.env.MINI_PRODUCTION_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    (origin.includes('127.0.0.1') || origin.includes('localhost')
      ? 'https://eap.ji-psy.com'
      : origin);
  return `${publicOrigin}${value.startsWith('/') ? value : `/${value}`}`;
}

function mapProductionItem(row: Record<string, unknown>, apiBase: string): CounselorCard {
  const name = String(row.name || row.Name || '咨询师').trim() || '咨询师';
  const title =
    String(row.title || row.Title || '').trim() ||
    String(row.specialty || row.Specialty || '').trim() ||
    '心理咨询师';
  const workYearsLabel = String(row.workYearsLabel || '').trim();
  const workYears = Number(row.workYears ?? row.WorkYears ?? 0);
  const years = workYearsLabel || (workYears > 0 ? `${workYears} 年` : '—');
  const hours = Number(row.consultHours ?? row.ConsultHours ?? 0);
  const cases = hours > 0 ? `${hours}+` : '—';
  const tags = splitTags(row.field || row.Field || row.specialty || row.Specialty);
  return {
    name,
    title: title.length > 24 ? `${title.slice(0, 24)}…` : title,
    tags: tags.length ? tags : ['心理咨询'],
    years,
    cases,
    casesUnit: '小时',
    avatarUrl: absoluteMediaUrl(row.avatarUrl || row.AvatarUrl, apiBase),
  };
}

function mockResult(): HomeCounselorsResult {
  return {
    items: MOCK_COUNSELORS,
    total: MOCK_COUNSELORS.length,
    source: 'mock',
  };
}

/** 服务端获取首页咨询师列表（仅在 Server Component / Route Handler 调用）。 */
export async function getCounselorsForHome(): Promise<HomeCounselorsResult> {
  // 禁止静态/ISR 缓存，确保 USE_REAL_COUNSELORS 等环境变量在进程重启后立即生效
  noStore();

  const useReal = envFlagTrue(process.env.USE_REAL_COUNSELORS);
  if (!useReal) {
    return mockResult();
  }

  const apiBase = (
    process.env.MINI_PRODUCTION_API_BASE_URL ||
    'http://127.0.0.1:28000'
  ).replace(/\/$/, '');
  const limit = Math.min(
    12,
    Math.max(1, Number(process.env.COUNSELORS_FETCH_LIMIT || 4) || 4),
  );

  const url = `${apiBase}/api/mini/common/counselors?page=1&page_size=${limit}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[counselors] production API HTTP', res.status, url);
      return mockResult();
    }
    const body = (await res.json()) as Record<string, unknown>;
    const itemsRaw = (body.items ||
      (body.data as Record<string, unknown> | undefined)?.items ||
      []) as unknown[];
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      console.warn('[counselors] production API returned empty list, fallback to mock');
      return mockResult();
    }
    const items = itemsRaw
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => mapProductionItem(row, apiBase));
    const total = Number(body.total ?? items.length) || items.length;
    return { items, total, source: 'real' };
  } catch (err) {
    console.error('[counselors] fetch production failed, fallback to mock', err);
    return mockResult();
  }
}
