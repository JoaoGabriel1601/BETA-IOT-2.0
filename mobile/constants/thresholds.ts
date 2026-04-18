export const thresholds = {
  temperature: { low: 15, high: 28, unit: '°C' },
  humidity: { low: 30, high: 70, unit: '%' },
  lightLevel: { low: 0, high: 100, unit: '%' },
  voltageAc: { low: 100, high: 240, unit: 'V' },
  offlineAfterSeconds: 120,
} as const;

export type ThresholdKey = keyof Omit<typeof thresholds, 'offlineAfterSeconds'>;
