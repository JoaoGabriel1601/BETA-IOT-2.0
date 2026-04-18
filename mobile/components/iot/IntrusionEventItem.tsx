import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { typography } from '@/theme/typography';
import type { IntrusionEventRecord } from '@/types/iot';

import { GlassContainer } from './GlassContainer';

interface IntrusionEventItemProps {
  event: IntrusionEventRecord;
  onAcknowledge: (id: string) => void | Promise<void>;
  pending?: boolean;
}

function formatWhen(ts: number): string {
  if (!ts) return '--';
  try {
    return new Date(ts).toLocaleString('pt-BR');
  } catch {
    return '--';
  }
}

export function IntrusionEventItem({ event, onAcknowledge, pending }: IntrusionEventItemProps) {
  const acked = !!event.acknowledged;
  const variant = acked ? 'default' : 'danger';

  return (
    <Animated.View entering={FadeInRight.duration(320)}>
      <GlassContainer variant={variant} padding={14} radius={16} style={styles.container}>
        <View style={styles.row}>
        <LinearGradient
          colors={acked ? gradients.accent : gradients.danger}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.icon}
        >
          <Ionicons
            name={acked ? 'checkmark-done' : 'alert-circle'}
            size={18}
            color="#fff"
          />
        </LinearGradient>

        <View style={styles.info}>
          <Text style={styles.type} numberOfLines={1}>
            {event.event_type || 'evento'}
          </Text>
          {event.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {event.description}
            </Text>
          ) : null}
          <Text style={styles.time}>{formatWhen(event.timestamp)}</Text>
          {acked && event.acknowledged_by ? (
            <Text style={styles.ackedBy}>
              por {event.acknowledged_by}
              {event.acknowledged_at ? ` · ${formatWhen(event.acknowledged_at)}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      {acked ? (
        <View style={[styles.btn, styles.btnDone]}>
          <Ionicons name="checkmark" size={14} color={colors.accent} />
          <Text style={[styles.btnText, { color: colors.accent }]}>Reconhecido</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onAcknowledge(event.id)}
          disabled={pending}
          style={({ pressed }) => [
            styles.btn,
            styles.btnActive,
            (pressed || pending) && { opacity: 0.7 },
          ]}
        >
          {pending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.btnText}>Reconhecer</Text>
            </>
          )}
        </Pressable>
      )}
      </GlassContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  type: { ...typography.bodyStrong, color: colors.text },
  desc: { ...typography.body, color: colors.textDim },
  time: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  ackedBy: { ...typography.caption, color: colors.accent },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnActive: {
    backgroundColor: colors.danger,
  },
  btnDone: {
    backgroundColor: 'rgba(1, 181, 116, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(1, 181, 116, 0.35)',
  },
  btnText: {
    ...typography.bodyStrong,
    color: '#fff',
  },
});
