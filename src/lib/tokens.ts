export const tokens = {
  primary: '#1E4C9A',
  primaryDark: '#0F2E5F',
  primaryDeep: '#0A1E42',
  accent: '#C8161D',
  warm: '#F5EFE6',
  warmLight: '#FBF7F0',
  warmSection: '#FBFAF7',
} as const;

export type ThemeTweaks = {
  primary?: string;
  primaryDark?: string;
  accent?: string;
  warm?: string;
};
