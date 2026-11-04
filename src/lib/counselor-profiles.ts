import type { CounselorCard } from '@/lib/counselors';
import { MOCK_COUNSELORS, getCounselorsForList, getEnterpriseCounselors } from '@/lib/counselors';

export type CounselorProfile = CounselorCard & {
  slug: string;
  introduce: string;
  qualification: string;
  specialty: string;
  field: string;
  trainingExperience: string;
  targetGroup: string;
};

type MockCounselorExtra = {
  slug: string;
  education: string;
  approach: string;
  bio: string[];
};

const PROFILE_EXTRAS: Record<string, MockCounselorExtra> = {
  林晚晴: {
    slug: 'lin-wanqing',
    education: '应用心理学硕士 · 国家二级心理咨询师',
    approach: '以人为中心疗法结合认知行为技术，重视安全关系中的情绪整理。',
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

export function counselorPublicSlug(card: Pick<CounselorCard, 'name' | 'slug' | 'accountId'>) {
  if (card.slug) return card.slug;
  if (card.accountId) return `c-${card.accountId}`;
  return slugFromName(card.name);
}

export function getCounselorSlug(name: string) {
  return slugFromName(name);
}

function withProfile(card: CounselorCard): CounselorProfile {
  if (card.accountId) {
    return {
      ...card,
      slug: counselorPublicSlug(card),
      introduce: (card.introduce || '').trim(),
      qualification: (card.qualification || '').trim(),
      specialty: (card.specialtyText || '').trim(),
      field: (card.fieldText || '').trim(),
      trainingExperience: (card.trainingExperience || '').trim(),
      targetGroup: (card.targetGroup || '').trim(),
    };
  }
  const extra = PROFILE_EXTRAS[card.name];
  return {
    ...card,
    slug: extra?.slug || slugFromName(card.name),
    introduce: extra
      ? extra.bio.join('\n')
      : `${card.name}为持证心理咨询从业者，擅长领域包括：${card.tags.join('、') || '心理咨询'}。`,
    qualification: extra?.education || '',
    specialty: extra?.approach || '',
    field: card.tags.join('、'),
    trainingExperience: '',
    targetGroup: '',
  };
}

export function getMockCounselorProfiles(): CounselorProfile[] {
  return MOCK_COUNSELORS.map(withProfile);
}

/** 「了解更多」咨询师列表：真实模式只展示 API 数据，不再混入模拟咨询师。 */
export async function getCounselorProfilesForList(): Promise<CounselorProfile[]> {
  const result = await getCounselorsForList();
  if (result.source === 'real') {
    return result.items.map(withProfile);
  }
  return MOCK_COUNSELORS.map(withProfile);
}

/** 这家企业勾选的全部咨询师。介绍文案已由后端叠好。 */
export async function getEnterpriseCounselorProfiles(slug: string): Promise<CounselorProfile[]> {
  const result = await getEnterpriseCounselors(slug);
  return result.items.map(withProfile);
}

export async function getCounselorBySlug(
  slug: string,
  enterpriseSlug?: string,
): Promise<CounselorProfile | undefined> {
  const list = enterpriseSlug
    ? await getEnterpriseCounselorProfiles(enterpriseSlug)
    : await getCounselorProfilesForList();
  return list.find((item) => item.slug === slug);
}

export function getHomeCounselorLimit() {
  return 4;
}
