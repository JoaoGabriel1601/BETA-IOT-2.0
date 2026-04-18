import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';

interface GlassContainerProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: number;
  radius?: number;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

export function GlassContainer({
  children,
  style,
  padding = 16,
  radius = 20,
  variant = 'default',
}: GlassContainerProps) {
  const borderColor = {
    default: colors.border,
    warning: 'rgba(255, 181, 71, 0.35)',
    danger: 'rgba(255, 94, 126, 0.4)',
    success: 'rgba(1, 181, 116, 0.35)',
  }[variant];

  return (
    <View style={[styles.wrapper, { borderRadius: radius, borderColor }, style]}>
      <LinearGradient
        colors={gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 11, 40, 0.35)',
  },
});
