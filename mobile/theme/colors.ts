export const colors = {
  bg0: '#0f1535',
  bg1: '#060b28',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  text: '#ffffff',
  textDim: '#a0aec0',
  textMuted: '#6b7280',
  accent: '#01b574',
  brand: '#4318ff',
  brand2: '#9f7aea',
  cyan: '#21d4fd',
  warn: '#ffb547',
  danger: '#ff5e7e',
  info: '#4da8ff',
} as const;

export type ColorToken = keyof typeof colors;
