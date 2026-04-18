import { useEffect, useRef } from 'react';

import { config } from '@/constants/config';
import { ensureNotificationSetup, sendAlert } from '@/services/notifications';
import { subscribeCurrent, subscribeIntrusionEvents } from '@/services/realtimeDatabase';

import { useAuth } from './useAuth';

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const FRESH_WINDOW_MS = 30_000;

export function useAlertNotifications(deviceId: string = config.deviceId): void {
  const { user } = useAuth();
  const lastAlarmRef = useRef<boolean | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const sessionStart = Date.now();
    let active = true;
    let unsubCurrent: (() => void) | null = null;
    let unsubEvents: (() => void) | null = null;

    (async () => {
      const granted = await ensureNotificationSetup();
      if (!granted || !active) return;

      unsubCurrent = subscribeCurrent(deviceId, (value) => {
        if (!value) return;
        const prev = lastAlarmRef.current;
        const now = !!value.alarm_active;

        const isTransition = prev === false && now === true;
        const isFreshInitial =
          prev === null &&
          now === true &&
          typeof value.timestamp === 'number' &&
          value.timestamp >= sessionStart - FRESH_WINDOW_MS;

        if (isTransition || isFreshInitial) {
          const when = formatTime(value.timestamp);
          sendAlert({
            title: '🚨 Intrusão detectada',
            body: when
              ? `Alarme ativado no datacenter às ${when}`
              : 'Alarme ativado no datacenter',
            data: { type: 'alarm', timestamp: value.timestamp },
          }).catch(() => {});
        }
        lastAlarmRef.current = now;
      });

      unsubEvents = subscribeIntrusionEvents(deviceId, 20, (events) => {
        const seen = seenEventIdsRef.current;
        if (seen.size === 0) {
          for (const e of events) seen.add(e.id);
          return;
        }
        for (const e of events) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          if (e.acknowledged) continue;
          const when = formatTime(e.timestamp);
          sendAlert({
            title: '⚠️ Novo evento de intrusão',
            body: [e.event_type, e.description, when].filter(Boolean).join(' · '),
            data: { type: 'intrusion', eventId: e.id },
          }).catch(() => {});
        }
      });
    })();

    return () => {
      active = false;
      unsubCurrent?.();
      unsubEvents?.();
    };
  }, [deviceId, user]);
}
