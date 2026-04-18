import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassContainer } from '@/components/iot/GlassContainer';
import { IntrusionEventItem } from '@/components/iot/IntrusionEventItem';
import { useIntrusionEvents } from '@/hooks/useIntrusionEvents';
import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { typography } from '@/theme/typography';

export default function IntrusionScreen() {
  const { events, unacknowledgedCount, acknowledge, loading } = useIntrusionEvents();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onAck = useCallback(
    async (id: string) => {
      setPendingId(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      try {
        await acknowledge(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Alert.alert('Erro', 'Não foi possível reconhecer o evento.');
      } finally {
        setPendingId(null);
      }
    },
    [acknowledge]
  );

  return (
    <LinearGradient colors={gradients.bgScreen} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FlatList
          contentContainerStyle={styles.content}
          data={events}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Eventos de Intrusão</Text>
              <GlassContainer padding={14} radius={16} variant={unacknowledgedCount > 0 ? 'danger' : 'success'}>
                <View style={styles.summary}>
                  <Ionicons
                    name={unacknowledgedCount > 0 ? 'warning' : 'shield-checkmark'}
                    size={20}
                    color={unacknowledgedCount > 0 ? colors.danger : colors.accent}
                  />
                  <Text
                    style={[
                      styles.summaryText,
                      { color: unacknowledgedCount > 0 ? colors.danger : colors.accent },
                    ]}
                  >
                    {unacknowledgedCount > 0
                      ? `${unacknowledgedCount} não reconhecido${unacknowledgedCount > 1 ? 's' : ''}`
                      : 'Tudo reconhecido'}
                  </Text>
                  <Text style={styles.summaryTotal}>· {events.length} no total</Text>
                </View>
              </GlassContainer>
            </View>
          }
          renderItem={({ item }) => (
            <IntrusionEventItem event={item} onAcknowledge={onAck} pending={pendingId === item.id} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <GlassContainer padding={20} radius={16}>
              <Text style={styles.empty}>
                {loading ? 'Carregando eventos...' : 'Nenhum evento registrado.'}
              </Text>
            </GlassContainer>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  header: { gap: 12, marginBottom: 4 },
  title: { ...typography.display, color: colors.text },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: { ...typography.bodyStrong },
  summaryTotal: { ...typography.body, color: colors.textDim },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
