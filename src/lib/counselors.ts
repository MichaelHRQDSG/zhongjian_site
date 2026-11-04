/**
 * 首页 / 列表咨询师数据：可用环境变量切换「模拟数据 / 真实数据」。
 *
 * USE_REAL_COUNSELORS=true  → 按 BACKEND_ENV 代称请求对应后端公开咨询师列表
 * USE_REAL_COUNSELORS=false → 使用下方 MOCK_COUNSELORS（默认）
 *
 * 真实模式下失败时返回空列表，不再回退模拟咨询师。
 */

import { unstable_noStore as noStore } from 'next/cache';
import { resolveApiBaseUrl, resolvePublicBaseUrl } from '@/lib/backend-env';
export type CounselorCard = {
  name: string;
  title: string;
  tags: string[];
  years: string;
  cases: string;
  /** 右侧指标单位：模拟数据用「案例」，真实数据用「小时」 */
  casesUnit?: string;
  avatarUrl?: string;
  /** 咨询师账号 ID。企业勾选和介绍页都用它，不用姓名。 */
  accountId?: number;
  slug?: string;
  /** 简介，对应主档 Introduce；企业页可能已叠过本企业文案 */
  introduce?: string;
  /** 从业资质，对应主档 Qualification */
  qualification?: string;
  /** 咨询流派全文，对应主档 Specialty。卡片上的短标签仍用 tags */
  specialtyText?: string;
  /** 咨询领域全文，对应主档 Field */
  fieldText?: string;
  /** 受训背景，对应主档 TrainingExperience。主档该栏为空时才回退旧的 Career */
  trainingExperience?: string;
  /** 擅长人群，对应主档 TargetGroup */
  targetGroup?: string;
};

/** 定制企业首页只展示前 4 位，其余在「了解更多」。 */
export const ENTERPRISE_HOME_COUNSELOR_LIMIT = 4;

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
    resolvePublicBaseUrl() ||
    (origin.includes('127.0.0.1') || origin.includes('localhost')
      ? 'https://eap.ji-psy.com'
      : origin);
  return `${publicOrigin}${value.startsWith('/') ? value : `/${value}`}`;
}

function textField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] == null) continue;
    const value = String(row[key]).trim();
    if (value) return value;
  }
  return '';
}

/** 字段在响应里出现过（含空字符串）就用它，避免企业清空文案后又显示主档旧栏。 */
function explicitText(row: Record<string, unknown>, key: string, pascal: string, ...legacy: string[]): string {
  if (row[key] != null) return String(row[key]).trim();
  if (row[pascal] != null) return String(row[pascal]).trim();
  return legacy.length ? textField(row, ...legacy) : '';
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
  const accountIdRaw = Number(row.accountId ?? row.id ?? row.Id ?? 0);
  const accountId = Number.isFinite(accountIdRaw) && accountIdRaw > 0 ? Math.trunc(accountIdRaw) : undefined;
  const slug = String(row.slug || (accountId ? `c-${accountId}` : '')).trim() || undefined;
  return {
    name,
    title: title.length > 24 ? `${title.slice(0, 24)}…` : title,
    tags: tags.length ? tags : ['心理咨询'],
    years,
    cases,
    casesUnit: '小时',
    avatarUrl: absoluteMediaUrl(row.avatarUrl || row.AvatarUrl, apiBase),
    accountId,
    slug,
    introduce: explicitText(row, 'introduce', 'Introduce'),
    qualification: explicitText(row, 'qualification', 'Qualification'),
    specialtyText: explicitText(row, 'specialty', 'Specialty'),
    fieldText: explicitText(row, 'field', 'Field'),
    trainingExperience: explicitText(row, 'trainingExperience', 'TrainingExperience', 'career', 'Career'),
    targetGroup: explicitText(row, 'targetGroup', 'TargetGroup'),
  };
}

function readCounselorItems(body: Record<string, unknown>): unknown[] {
  const nested = body.data;
  const nestedItems =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>).items
      : undefined;
  const itemsRaw = body.items || nestedItems || [];
  return Array.isArray(itemsRaw) ? itemsRaw : [];
}

function mockResult(): HomeCounselorsResult {
  return {
    items: MOCK_COUNSELORS,
    total: MOCK_COUNSELORS.length,
    source: 'mock',
  };
}

function emptyRealResult(): HomeCounselorsResult {
  return { items: [], total: 0, source: 'real' };
}

function parseLimit(raw: string | undefined, fallback: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

type FetchCounselorsOptions = {
  /** 每页条数；首页默认 COUNSELORS_FETCH_LIMIT，列表默认 COUNSELORS_LIST_FETCH_LIMIT */
  limit?: number;
};

/** 服务端获取咨询师列表（仅在 Server Component / Route Handler 调用）。 */
export async function fetchCounselors(
  options: FetchCounselorsOptions = {},
): Promise<HomeCounselorsResult> {
  // 禁止静态/ISR 缓存，确保 USE_REAL_COUNSELORS 等环境变量在进程重启后立即生效
  noStore();

  const useReal = envFlagTrue(process.env.USE_REAL_COUNSELORS);
  if (!useReal) {
    return mockResult();
  }

  const apiBase = resolveApiBaseUrl({ preferAssessment: false });
  const limit =
    options.limit ??
    parseLimit(process.env.COUNSELORS_FETCH_LIMIT, 4, 100);

  const url = `${apiBase}/api/mini/common/counselors?page=1&page_size=${limit}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[counselors] production API HTTP', res.status, url);
      return emptyRealResult();
    }
    const body = (await res.json()) as Record<string, unknown>;
    const itemsRaw = readCounselorItems(body);
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      console.warn('[counselors] production API returned empty list');
      return emptyRealResult();
    }
    const items = itemsRaw
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => mapProductionItem(row, apiBase));
    const total = Number(body.total ?? items.length) || items.length;
    return { items, total, source: 'real' };
  } catch (err) {
    console.error('[counselors] fetch production failed', err);
    return emptyRealResult();
  }
}

/** 首页精选咨询师（条数受 COUNSELORS_FETCH_LIMIT 限制）。 */
export async function getCounselorsForHome(): Promise<HomeCounselorsResult> {
  return fetchCounselors({
    limit: parseLimit(process.env.COUNSELORS_FETCH_LIMIT, 4, 12),
  });
}

/** 「了解更多」完整列表（条数受 COUNSELORS_LIST_FETCH_LIMIT 限制）。 */
export async function getCounselorsForList(): Promise<HomeCounselorsResult> {
  return fetchCounselors({
    limit: parseLimit(process.env.COUNSELORS_LIST_FETCH_LIMIT, 50, 100),
  });
}

/**
 * 这家企业前台的咨询师。
 * 请求打到与企业配置相同的后端（ASSESSMENT_API_BASE_URL / BACKEND_ENV）。
 * 每个环境的这个地址要指到该环境自己的后端，勾选结果放在企业配置里，不放环境变量。
 */
export async function getEnterpriseCounselors(slug: string): Promise<HomeCounselorsResult> {
  noStore();
  const apiBase = resolveApiBaseUrl({ preferAssessment: true });
  const url = `${apiBase}/api/web/assessment-enterprises/${encodeURIComponent(slug)}/counselors`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[counselors] enterprise API HTTP', res.status, url);
      return emptyRealResult();
    }
    const body = (await res.json()) as Record<string, unknown>;
    const items = readCounselorItems(body)
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => mapProductionItem(row, apiBase));
    const nested = body.data;
    const nestedTotal =
      nested && typeof nested === 'object' && !Array.isArray(nested)
        ? (nested as Record<string, unknown>).total
        : undefined;
    const total = Number(body.total ?? nestedTotal ?? items.length) || items.length;
    return { items, total, source: 'real' };
  } catch (err) {
    console.error('[counselors] enterprise fetch failed', err);
    return emptyRealResult();
  }
}

/** 定制企业首页只取已勾选名单的前 4 位。 */
export async function getCounselorsForEnterpriseHome(slug: string): Promise<HomeCounselorsResult> {
  const all = await getEnterpriseCounselors(slug);
  return {
    ...all,
    items: all.items.slice(0, ENTERPRISE_HOME_COUNSELOR_LIMIT),
  };
}
