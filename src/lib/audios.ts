export type AudioTrack = {
  id: string;
  title: string;
  series: string;
  dur: string;
  plays: string;
  src: string;
  desc?: string;
};

/** 完整心理音画曲目（企业 EAP 主题） */
export const AUDIOS: AudioTrack[] = [
  {
    id: 'sleep-release',
    title: '睡前冥想：放下今天的疲惫',
    series: '晚安冥想',
    dur: '01:30',
    plays: '2.8万',
    src: '/assets/audio-sleep-new.mp3',
    desc: '睡前引导，帮助身体与思绪慢慢落地。',
  },
  {
    id: 'commute-breath',
    title: '通勤路上的呼吸练习',
    series: '每日五分钟',
    dur: '00:25',
    plays: '3.4万',
    src: '/assets/audio-breath.mp3',
    desc: '短时呼吸练习，适合上班途中快速稳定情绪。',
  },
  {
    id: 'inner-child',
    title: '与内在小孩对话',
    series: '深度疗愈',
    dur: '00:21',
    plays: '1.6万',
    src: '/assets/audio-inner-child.mp3',
    desc: '温柔关照内在需求，减少自我苛责。',
  },
  {
    id: 'emotion-release',
    title: '给悲伤一个出口：情绪释放练习',
    series: '深度疗愈',
    dur: '01:30',
    plays: '1.9万',
    src: '/assets/audio-emotion-release.mp3',
    desc: '允许情绪流动，而不是硬扛与压抑。',
  },
  {
    id: 'pre-meeting-calm',
    title: '开会前的三分钟安顿',
    series: '职场片刻',
    dur: '00:25',
    plays: '1.2万',
    src: '/assets/audio-breath.mp3',
    desc: '发言或汇报前，用呼吸把心跳慢慢放稳。',
  },
  {
    id: 'after-work-shutdown',
    title: '下班关机：把工作留在工位',
    series: '职场片刻',
    dur: '01:30',
    plays: '2.1万',
    src: '/assets/audio-sleep-new.mp3',
    desc: '用引导帮助大脑切换频道，减少「人下班了脑子还在加班」。',
  },
  {
    id: 'self-compassion',
    title: '给自己一点温柔：自我关怀练习',
    series: '自我关怀',
    dur: '00:21',
    plays: '1.5万',
    src: '/assets/audio-inner-child.mp3',
    desc: '在高压节奏里，练习用更友善的语气对自己说话。',
  },
  {
    id: 'stress-body-scan',
    title: '压力后的身体扫描',
    series: '身心放松',
    dur: '01:30',
    plays: '1.8万',
    src: '/assets/audio-emotion-release.mp3',
    desc: '从脚趾到头顶，觉察紧绷并慢慢松开。',
  },
  {
    id: 'lunch-reset',
    title: '午休重置：五分钟恢复专注',
    series: '每日五分钟',
    dur: '00:25',
    plays: '2.3万',
    src: '/assets/audio-breath.mp3',
    desc: '午后困倦或烦躁时，快速重置注意力。',
  },
  {
    id: 'boundary-breath',
    title: '建立边界前的稳定呼吸',
    series: '职场片刻',
    dur: '00:21',
    plays: '9800',
    src: '/assets/audio-inner-child.mp3',
    desc: '在需要表达拒绝或提出需求前，先稳住自己。',
  },
];

export const HOME_AUDIO_LIMIT = 4;

export function getHomeAudios() {
  return AUDIOS.slice(0, HOME_AUDIO_LIMIT);
}
