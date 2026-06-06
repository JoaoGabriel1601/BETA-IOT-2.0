import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RealtimeLineChart } from '@/components/iot/RealtimeLineChart';
import { useReadingsHistory } from '@/hooks/useReadingsHistory';
import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { typography } from '@/theme/typography';

export default function ChartsScreen() {
  const { readings, loading } = useReadingsHistory();

  const { temp, hum, light, volt, dist } = useMemo(() => {
    const temp: number[] = [];
    const hum: number[] = [];
    const light: number[] = [];
    const volt: number[] = [];
    const dist: number[] = [];
    for (const r of readings) {
      if (typeof r.temperature === 'number') temp.push(r.temperature);
      if (typeof r.humidity === 'number') hum.push(r.humidity);
      if (typeof r.light_level === 'number') light.push(r.light_level);
      if (typeof r.voltage_ac === 'number') volt.push(r.voltage_ac);
      if (typeof r.distance_cm === 'number') dist.push(r.distance_cm);
    }
    return { temp, hum, light, volt, dist };
  }, [readings]);

  return (
    <LinearGradient colors={gradients.bgScreen} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View>
            <Text style={styles.title}>Gráficos</Text>
            <Text style={styles.subtitle}>
              {readings.length > 0
                ? `Últimas ${readings.length} leituras`
                : loading
                ? 'Carregando...'
                : 'Sem histórico ainda'}
            </Text>
          </View>

          <RealtimeLineChart
            title="Temperatura"
            unit="°C"
            color={colors.danger}
            values={temp}
            decimals={1}
          />
          <RealtimeLineChart
            title="Umidade"
            unit="%"
            color={colors.info}
            values={hum}
            decimals={1}
          />
          <RealtimeLineChart
            title="Luminosidade"
            unit="%"
            color={colors.warn}
            values={light}
            decimals={0}
          />
          <RealtimeLineChart
            title="Tensão AC"
            unit="V"
            color={colors.brand2}
            values={volt}
            decimals={1}
          />
          <RealtimeLineChart
            title="Distância"
            unit="cm"
            color={colors.info}
            values={dist}
            decimals={1}
          />
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
  subtitle: { ...typography.body, color: colors.textDim, marginTop: 2 },
});
