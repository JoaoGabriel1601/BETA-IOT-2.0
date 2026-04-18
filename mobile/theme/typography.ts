import { Platform, TextStyle } from 'react-native';

const family = Platform.select({
  android: 'sans-serif',
  default: 'System',
});

const familyMedium = Platform.select({
  android: 'sans-serif-medium',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily: familyMedium,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: familyMedium,
    fontSize: 22,
    fontWeight: '700',
  },
  h2: {
    fontFamily: familyMedium,
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontFamily: family,
    fontSize: 14,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: familyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontFamily: family,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  metric: {
    fontFamily: familyMedium,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
} satisfies Record<string, TextStyle>;
