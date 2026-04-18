import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

import { GlassContainer } from './GlassContainer';

interface RealtimeLineChartProps {
  title: string;
  unit?: string;
  color: string;
  values: number[];
  height?: number;
  decimals?: number;
}

export function RealtimeLineChart({
  title,
  unit,
  color,
  values,
  height = 180,
  decimals = 1,
}: RealtimeLineChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 80, 240);

  const data = useMemo(() => {
    if (values.length === 0) return [{ value: 0 }];
    return values.map((v) => ({ value: Number.isFinite(v) ? v : 0 }));
  }, [values]);

  const latest = values.length > 0 ? values[values.length - 1] : null;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min;
  const yMin = Math.max(0, min - span * 0.15);
  const yMax = max + span * 0.15 || max + 1;

  return (
    <GlassContainer padding={16} radius={20}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.latest, { color }]}>
          {latest !== null ? `${latest.toFixed(decimals)}${unit ? ' ' + unit : ''}` : '--'}
        </Text>
      </View>

      <View style={{ height, marginTop: 8 }}>
        {values.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aguardando leituras...</Text>
          </View>
        ) : (
          <LineChart
            data={data}
            width={chartWidth}
            height={height - 20}
            initialSpacing={6}
            endSpacing={6}
            spacing={Math.max(6, chartWidth / Math.max(data.length, 2))}
            thickness={2.5}
            color={color}
            curved
            areaChart
            startFillColor={color}
            endFillColor={color}
            startOpacity={0.35}
            endOpacity={0.02}
            hideDataPoints
            hideRules={false}
            rulesType="solid"
            rulesColor="rgba(255,255,255,0.05)"
            yAxisColor="transparent"
            xAxisColor="transparent"
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: 'transparent', fontSize: 0 }}
            noOfSections={3}
            maxValue={yMax}
            mostNegativeValue={yMin}
            backgroundColor="transparent"
            isAnimated
            animationDuration={350}
          />
        )}
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  latest: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
