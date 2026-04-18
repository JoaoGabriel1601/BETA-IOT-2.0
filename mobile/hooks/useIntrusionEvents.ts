import { useCallback, useEffect, useMemo, useState } from 'react';

import { config } from '@/constants/config';
import { acknowledgeEvent, subscribeIntrusionEvents } from '@/services/realtimeDatabase';
import type { IntrusionEventRecord } from '@/types/iot';

import { useAuth } from './useAuth';

export interface IntrusionEventsState {
  events: IntrusionEventRecord[];
  unacknowledgedCount: number;
  loading: boolean;
  acknowledge: (eventId: string) => Promise<void>;
}

export function useIntrusionEvents(
  deviceId: string = config.deviceId,
  limit: number = 20
): IntrusionEventsState {
  const { user } = useAuth();
  const [events, setEvents] = useState<IntrusionEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeIntrusionEvents(deviceId, limit, (values) => {
      setEvents(values);
      setLoading(false);
    });
    return unsubscribe;
  }, [deviceId, limit]);

  const acknowledge = useCallback(
    (eventId: string) => acknowledgeEvent(deviceId, eventId, user?.email ?? null),
    [deviceId, user?.email]
  );

  const unacknowledgedCount = useMemo(
    () => events.filter((e) => !e.acknowledged).length,
    [events]
  );

  return { events, unacknowledgedCount, loading, acknowledge };
}
