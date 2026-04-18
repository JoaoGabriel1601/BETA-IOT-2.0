export const gradients = {
  brand: ['#4318ff', '#9f7aea'] as const,
  accent: ['#01b574', '#21d4fd'] as const,
  warn: ['#ffb547', '#ff7a59'] as const,
  danger: ['#ff5e7e', '#a8327d'] as const,
  card: ['rgba(6,11,40,0.74)', 'rgba(10,14,35,0.71)'] as const,
  bgScreen: ['#0f1535', '#060b28'] as const,
};

export type GradientToken = keyof typeof gradients;
