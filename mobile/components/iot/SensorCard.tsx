import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

import { GlassContainer } from './GlassContainer';

export type SensorVariant = 'default' | 'warning' | 'danger' | 'success';

interface SensorCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  variant?: SensorVariant;
  iconGradient?: readonly [string, string];
  footer?: string;
  animationDelay?: number;
}

const variantAccents: Record<SensorVariant, string> = {
  default: colors.cyan,
  warning: colors.warn,
  danger: colors.danger,
  success: colors.accent,
};

export function SensorCard({
  icon,
  label,
  value,
  unit,
  variant = 'default',
  iconGradient,
  footer,
  animationDelay = 0,
}: SensorCardProps) {
  const accent = variantAccents[variant];
  const gradient = iconGradient ?? ([accent, colors.brand] as const);

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(animationDelay)}>
      <GlassContainer variant={variant} padding={16} radius={20} style={styles.card}>
        <View style={styles.header}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <Ionicons name={icon} size={18} color="#fff" />
          </LinearGradient>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: variant === 'default' ? colors.text : accent }]}>
            {value}
          </Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>

        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </GlassContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
    gap: 6,
  },
  value: {
    ...typography.metric,
    fontSize: 28,
  },
  unit: {
    ...typography.bodyStrong,
    color: colors.textDim,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
  },
});
