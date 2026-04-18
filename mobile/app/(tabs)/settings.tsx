import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassContainer } from '@/components/iot/GlassContainer';
import { StatusIndicator } from '@/components/iot/StatusIndicator';
import { config } from '@/constants/config';
import { thresholds } from '@/constants/thresholds';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceData } from '@/hooks/useDeviceData';
import { signOut } from '@/services/auth';
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
  const { user } = useAuth();
  const { info, online } = useDeviceData();
  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          try {
            await signOut();
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const lastSeen = info?.last_seen
    ? new Date(info.last_seen).toLocaleString('pt-BR')
    : '--';

  return (
    <LinearGradient colors={gradients.bgScreen} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Configurações</Text>

          <GlassContainer padding={16} radius={20}>
            <Text style={styles.sectionLabel}>Conta</Text>
            <Row
              icon="person-circle"
              label="Email"
              value={user?.email ?? '--'}
              gradient={gradients.brand}
            />
            <Pressable
              onPress={confirmSignOut}
              disabled={signingOut}
              style={({ pressed }) => [
                styles.signOut,
                (pressed || signingOut) && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.signOutText}>
                {signingOut ? 'Saindo...' : 'Sair'}
              </Text>
            </Pressable>
          </GlassContainer>

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
              label="Nome"
              value={info?.name ?? '--'}
              gradient={gradients.accent}
            />
            <Row
              icon="location"
              label="Localização"
              value={info?.location ?? '--'}
              gradient={gradients.accent}
            />
            <Row
              icon="wifi"
              label="IP"
              value={info?.ip ?? '--'}
              gradient={gradients.accent}
            />
            <Row
              icon="cellular"
              label="RSSI"
              value={info?.rssi != null ? `${info.rssi} dBm` : '--'}
              gradient={gradients.accent}
            />
            <Row
              icon="code-working"
              label="Firmware"
              value={info?.firmware_version ?? '--'}
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
              value="Firebase Realtime Database"
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
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.danger,
  },
  signOutText: {
    ...typography.bodyStrong,
    color: '#fff',
  },
});
