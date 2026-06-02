import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassContainer } from '@/components/iot/GlassContainer';
import { StatusIndicator } from '@/components/iot/StatusIndicator';
import { config } from '@/constants/config';
import { thresholds } from '@/constants/thresholds';
import { useDeviceData } from '@/hooks/useDeviceData';
import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { typography } from '@/theme/typography';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  gradient?: readonly [string, string];
}

function Row({ icon, label, value, gradient = gradients.brand }: RowProps) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rowIcon}
      >
        <Ionicons name={icon} size={16} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { info, online } = useDeviceData();

  const lastSeen = info?.last_seen
    ? new Date(info.last_seen).toLocaleString('pt-BR')
    : '--';

  return (
    <LinearGradient colors={gradients.bgScreen} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Configurações</Text>

          <GlassContainer padding={16} radius={20}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Dispositivo</Text>
              <StatusIndicator online={online} />
            </View>
            <Row
              icon="hardware-chip"
              label="ID"
              value={config.deviceId}
              gradient={gradients.accent}
            />
            <Row
              icon="pricetag"
              label="Canal"
              value={info?.name ?? '--'}
              gradient={gradients.accent}
            />
            <Row
              icon="link"
              label="Channel ID"
              value={config.thingspeak.channelId || '--'}
              gradient={gradients.accent}
            />
            <Row
              icon="time"
              label="Última comunicação"
              value={lastSeen}
              gradient={gradients.accent}
            />
          </GlassContainer>

          <GlassContainer padding={16} radius={20}>
            <Text style={styles.sectionLabel}>Limites de Alerta</Text>
            <Row
              icon="thermometer"
              label="Temperatura"
              value={`${thresholds.temperature.low}–${thresholds.temperature.high} ${thresholds.temperature.unit}`}
              gradient={['#ff5e7e', '#a8327d']}
            />
            <Row
              icon="water"
              label="Umidade"
              value={`${thresholds.humidity.low}–${thresholds.humidity.high} ${thresholds.humidity.unit}`}
              gradient={['#4da8ff', '#21d4fd']}
            />
            <Row
              icon="flash"
              label="Tensão AC"
              value={`${thresholds.voltageAc.low}–${thresholds.voltageAc.high} ${thresholds.voltageAc.unit}`}
              gradient={['#9f7aea', '#4318ff']}
            />
            <Row
              icon="timer"
              label="Offline após"
              value={`${thresholds.offlineAfterSeconds}s sem leitura`}
              gradient={gradients.warn}
            />
          </GlassContainer>

          <GlassContainer padding={16} radius={20}>
            <Text style={styles.sectionLabel}>Sobre</Text>
            <Row
              icon="cube"
              label="Aplicativo"
              value="Datacenter IoT v1.0"
              gradient={gradients.brand}
            />
            <Row
              icon="cloud"
              label="Backend"
              value="ThingSpeak"
              gradient={gradients.brand}
            />
            <Row
              icon="notifications"
              label="Notificações"
              value="Locais (expo-notifications)"
              gradient={gradients.brand}
            />
          </GlassContainer>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { ...typography.display, color: colors.text },
  sectionLabel: {
    ...typography.caption,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...typography.caption, color: colors.textDim },
  rowValue: { ...typography.bodyStrong, color: colors.text, marginTop: 2 },
});
