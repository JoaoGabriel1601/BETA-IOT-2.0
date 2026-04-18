import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface StatusIndicatorProps {
  online: boolean;
  label?: string;
}

export function StatusIndicator({ online, label }: StatusIndicatorProps) {
  const color = online ? colors.accent : colors.danger;
  const text = label ?? (online ? 'ONLINE' : 'OFFLINE');

  return (
    <View style={styles.row}>
      <View style={[styles.dotOuter, { backgroundColor: color + '33' }]}>
        <View style={[styles.dotInner, { backgroundColor: color, shadowColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  label: {
    ...typography.caption,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
});
