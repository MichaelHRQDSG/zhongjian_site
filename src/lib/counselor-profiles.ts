import type { CounselorCard } from '@/lib/counselors';
import { MOCK_COUNSELORS, getCounselorsForHome } from '@/lib/counselors';

export type CounselorProfile = CounselorCard & {
  slug: string;
  bio: string[];
  approach: string;
  education?: string;
  languages?: string[];
};

const PROFILE_EXTRAS: Record<string, Omit<CounselorProfile, keyof CounselorCard | 'slug'> & { slug: string }> = {
  林晚晴: {
    slug: 'lin-wanqing',
    education: '应用心理学硕士 · 国家二级心理咨询师',
    approach: '以人为中心疗法结合认知行为技术，重视安全关系中的情绪整理。',
    languages: ['普通话'],
    bio: [
      '深耕职场情绪与睡眠议题十余年，长期为高压岗位员工提供一对一咨询与团体支持。',
      '擅长帮助来访者识别焦虑背后的需求，重建可执行的作息与自我关怀节奏。',
      '咨询风格温和、清晰，注重在尊重节奏的前提下推进改变。',
    ],
  },
  苏雅文: {
    slug: 'su-yawen',
    education: '组织心理学背景 · EAP 高级顾问',
    approach: '系统视角看团队与个人互动，兼顾绩效压力与心理安全。',
    languages: ['普通话'],
    bio: [
      '长期服务企业中层与骨干员工，熟悉目标高压、角色冲突与情绪透支等问题。',
      '帮助管理者建立「情绪容器」能力，在稳住自己的同时稳住团队。',
      '咨询中强调可落地的沟通与边界策略，而不是空泛鼓励。',
    ],
  },
  陈牧之: {
    slug: 'chen-muzhi',
    education: '婚姻家庭治疗取向 · 注册咨询师',
    approach: '家庭治疗与情绪取向，关注关系中的互动循环。',
    languages: ['普通话'],
    bio: [
      '专注亲密关系、亲子沟通与异地/出差家庭的连接修复。',
      '善于把「指责—防御」转为可听见的需求表达，重建安全沟通。',
      '也支持员工处理工作外溢到家庭的压力与内疚感。',
    ],
  },
  周航: {
    slug: 'zhou-hang',
    education: '临床心理学博士',
    approach: '整合取向，重视创伤叙事与身体感受的稳定化。',
    languages: ['普通话', '英语'],
    bio: [
      '长期处理职业倦怠、重大压力事件后的情绪反应与自我价值议题。',
      '咨询节奏稳健，重视建立安全感后再进入深层议题。',
      '适合希望进行中长期深度整理的来访者。',
    ],
  },
};

function slugFromName(name: string) {
  const mapped = PROFILE_EXTRAS[name]?.slug;
  if (mapped) return mapped;
  return `c-${encodeURIComponent(name)}`;
}

export function getCounselorSlug(name: string) {
  return slugFromName(name);
}

function withProfile(card: CounselorCard): CounselorProfile {
  const extra = PROFILE_EXTRAS[card.name];
  if (extra) {
    return { ...card, ...extra };
  }
  return {
    ...card,
    slug: slugFromName(card.name),
    approach: '以尊重与保密为前提，根据来访者议题灵活选择合适方法。',
    bio: [
      `${card.name}为持证心理咨询从业者，擅长领域包括：${card.tags.join('、') || '心理咨询'}。`,
      `执业经验 ${card.years}，累计服务 ${card.cases} ${card.casesUnit || '案例'}。`,
      '如需预约，请联系咨询助理了解排班与咨询方式。',
    ],
    education: card.title,
    languages: ['普通话'],
  };
}

export function getMockCounselorProfiles(): CounselorProfile[] {
  return MOCK_COUNSELORS.map(withProfile);
}

export async function getCounselorProfilesForList(): Promise<CounselorProfile[]> {
  const result = await getCounselorsForHome();
  // 列表页尽量展示更多：真实数据不足时用 mock 补足到至少 4 人
  const base = result.items.length ? result.items : MOCK_COUNSELORS;
  const merged = [...base];
  for (const mock of MOCK_COUNSELORS) {
    if (merged.length >= 8) break;
    if (!merged.some((c) => c.name === mock.name)) merged.push(mock);
  }
  return merged.map(withProfile);
}

export async function getCounselorBySlug(slug: string): Promise<CounselorProfile | undefined> {
  const list = await getCounselorProfilesForList();
  return list.find((item) => item.slug === slug);
}

export function getHomeCounselorLimit() {
  return 4;
}
