import { useEffect, useState } from 'react';

import { config } from '@/constants/config';
import { thresholds } from '@/constants/thresholds';
import { subscribeCurrent, subscribeDeviceInfo } from '@/services/realtimeDatabase';
import type { CurrentReading, DeviceInfo } from '@/types/iot';

export interface DeviceData {
  current: CurrentReading | null;
  info: DeviceInfo | null;
  online: boolean;
  loading: boolean;
}

export function useDeviceData(deviceId: string = config.deviceId): DeviceData {
  const [current, setCurrent] = useState<CurrentReading | null>(null);
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCurrent = subscribeCurrent(deviceId, (value) => {
      setCurrent(value);
      setLoading(false);
    });
    const unsubInfo = subscribeDeviceInfo(deviceId, setInfo);
    return () => {
      unsubCurrent();
      unsubInfo();
    };
  }, [deviceId]);

  const lastTimestamp = current?.timestamp ?? info?.last_seen ?? 0;
  const online = lastTimestamp > 0 && Date.now() - lastTimestamp < thresholds.offlineAfterSeconds * 1000;

  return { current, info, online, loading };
}
