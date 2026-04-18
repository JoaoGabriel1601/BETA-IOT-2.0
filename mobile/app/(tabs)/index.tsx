import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

import { GlassContainer } from '@/components/iot/GlassContainer';
import { SensorCard, type SensorVariant } from '@/components/iot/SensorCard';
import { StatusIndicator } from '@/components/iot/StatusIndicator';
import { thresholds } from '@/constants/thresholds';
import { useDeviceData } from '@/hooks/useDeviceData';
import { useIntrusionEvents } from '@/hooks/useIntrusionEvents';
import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { typography } from '@/theme/typography';

function tempVariant(t?: number): SensorVariant {
  if (t == null) return 'default';
  if (t >= thresholds.temperature.high || t <= thresholds.temperature.low) return 'warning';
  return 'default';
}

function humVariant(h?: number): SensorVariant {
  if (h == null) return 'default';
  if (h >= thresholds.humidity.high || h <= thresholds.humidity.low) return 'warning';
  return 'default';
}

function voltVariant(v?: number): SensorVariant {
  if (v == null) return 'default';
  if (v > thresholds.voltageAc.high) return 'danger';
  if (v > 0 && v < thresholds.voltageAc.low) return 'warning';
  return 'default';
}

function lastSeenLabel(ts?: number): string {
  if (!ts) return 'sem leituras';
  try {
    const d = new Date(ts);
    return `atualizado ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  } catch {
    return 'sem leituras';
  }
}

export default function DashboardScreen() {
  const { current, info, online, loading } = useDeviceData();
  const { unacknowledgedCount } = useIntrusionEvents();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const temp = current?.temperature;
  const hum = current?.humidity;
  const light = current?.light_level;
  const volt = current?.voltage_ac;
  const energy = current?.energy_source;
  const alarmActive = !!current?.alarm_active;

  return (
    <LinearGradient colors={gradients.bgScreen} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand2}
              colors={[colors.brand2]}
            />
          }
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Datacenter</Text>
              <Text style={styles.title}>{info?.name ?? 'esp32-datacenter-001'}</Text>
              {info?.location ? <Text style={styles.subtitle}>{info.location}</Text> : null}
            </View>
            <StatusIndicator online={online} />
          </View>

          <GlassContainer padding={14} radius={16}>
            <Text style={styles.updatedLabel}>{lastSeenLabel(current?.timestamp)}</Text>
            {unacknowledgedCount > 0 ? (
              <Text style={styles.alertCount}>
                {unacknowledgedCount} evento{unacknowledgedCount > 1 ? 's' : ''} não reconhecido
                {unacknowledgedCount > 1 ? 's' : ''}
              </Text>
            ) : (
              <Text style={styles.alertCountOk}>Nenhum alerta pendente</Text>
            )}
          </GlassContainer>

          <View style={styles.grid}>
            <View style={styles.col}>
              <SensorCard
                icon="thermometer"
                label="Temperatura"
                value={temp != null ? temp.toFixed(1) : '--'}
                unit="°C"
                variant={tempVariant(temp)}
                iconGradient={['#ff5e7e', '#a8327d']}
                animationDelay={0}
              />
            </View>
            <View style={styles.col}>
              <SensorCard
                icon="water"
                label="Umidade"
                value={hum != null ? hum.toFixed(1) : '--'}
                unit="%"
                variant={humVariant(hum)}
                iconGradient={['#4da8ff', '#21d4fd']}
                animationDelay={60}
              />
            </View>
            <View style={styles.col}>
              <SensorCard
                icon="sunny"
                label="Luminosidade"
                value={light != null ? light.toFixed(0) : '--'}
                unit="%"
                iconGradient={['#ffb547', '#ff7a59']}
                animationDelay={120}
              />
            </View>
            <View style={styles.col}>
              <SensorCard
                icon="flash"
                label="Tensão AC"
                value={volt != null ? volt.toFixed(1) : '--'}
                unit="V"
                variant={voltVariant(volt)}
                iconGradient={['#9f7aea', '#4318ff']}
                animationDelay={180}
              />
            </View>
            <View style={styles.col}>
              <SensorCard
                icon={energy === 'solar' ? 'sunny' : 'flame'}
                label="Fonte de Energia"
                value={energy === 'solar' ? 'SOLAR' : energy === 'diesel' ? 'DIESEL' : '--'}
                variant={energy === 'diesel' ? 'warning' : energy === 'solar' ? 'success' : 'default'}
                iconGradient={
                  energy === 'diesel' ? ['#ffb547', '#ff7a59'] : ['#01b574', '#21d4fd']
                }
                animationDelay={240}
              />
            </View>
            <View style={styles.col}>
              <SensorCard
                icon={alarmActive ? 'warning' : 'shield-checkmark'}
                label="Alarme"
                value={alarmActive ? 'INVASÃO' : 'OK'}
                variant={alarmActive ? 'danger' : 'success'}
                iconGradient={
                  alarmActive ? ['#ff5e7e', '#a8327d'] : ['#01b574', '#21d4fd']
                }
                animationDelay={300}
              />
            </View>
          </View>

          {loading ? <Text style={styles.loading}>Carregando leituras...</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hello: { ...typography.caption, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textDim, marginTop: 2 },
  updatedLabel: { ...typography.caption, color: colors.textDim },
  alertCount: { ...typography.bodyStrong, color: colors.danger, marginTop: 4 },
  alertCountOk: { ...typography.bodyStrong, color: colors.accent, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  col: {
    width: '48%',
    flexGrow: 1,
  },
  loading: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 12 },
});
