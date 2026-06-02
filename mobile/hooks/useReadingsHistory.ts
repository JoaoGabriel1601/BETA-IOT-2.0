import { useEffect, useState } from 'react';

import { config } from '@/constants/config';
import { subscribeReadingsHistory } from '@/services/thingspeak';
import type { HistoricalReading } from '@/types/iot';

export interface ReadingsHistory {
  readings: HistoricalReading[];
  loading: boolean;
}

export function useReadingsHistory(
  deviceId: string = config.deviceId,
  limit: number = config.maxHistoryPoints
): ReadingsHistory {
  const [readings, setReadings] = useState<HistoricalReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeReadingsHistory(deviceId, limit, (values) => {
      setReadings(values);
      setLoading(false);
    });
    return unsubscribe;
  }, [deviceId, limit]);

  return { readings, loading };
}
