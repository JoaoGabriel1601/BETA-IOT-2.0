import {
  DataSnapshot,
  limitToLast,
  off,
  onValue,
  orderByChild,
  query,
  ref,
  update,
} from 'firebase/database';

import { config } from '@/constants/config';
import type {
  CurrentReading,
  DeviceInfo,
  HistoricalReading,
  IntrusionEventRecord,
} from '@/types/iot';

import { database } from './firebase';

type Unsubscribe = () => void;

export function subscribeCurrent(
  deviceId: string,
  callback: (value: CurrentReading | null) => void
): Unsubscribe {
  const r = ref(database, config.paths.current(deviceId));
  const handler = (snap: DataSnapshot) => callback((snap.val() as CurrentReading) ?? null);
  onValue(r, handler);
  return () => off(r, 'value', handler);
}

export function subscribeDeviceInfo(
  deviceId: string,
  callback: (value: DeviceInfo | null) => void
): Unsubscribe {
  const r = ref(database, config.paths.info(deviceId));
  const handler = (snap: DataSnapshot) => callback((snap.val() as DeviceInfo) ?? null);
  onValue(r, handler);
  return () => off(r, 'value', handler);
}

export function subscribeReadingsHistory(
  deviceId: string,
  limit: number,
  callback: (readings: HistoricalReading[]) => void
): Unsubscribe {
  const r = ref(database, config.paths.readings(deviceId));
  const q = query(r, orderByChild('timestamp'), limitToLast(limit));
  const handler = (snap: DataSnapshot) => {
    const out: HistoricalReading[] = [];
    snap.forEach((child) => {
      const v = child.val();
      if (v && typeof v.timestamp === 'number') out.push(v as HistoricalReading);
    });
    out.sort((a, b) => a.timestamp - b.timestamp);
    callback(out);
  };
  onValue(q, handler);
  return () => off(q, 'value', handler);
}

export function subscribeIntrusionEvents(
  deviceId: string,
  limit: number,
  callback: (events: IntrusionEventRecord[]) => void
): Unsubscribe {
  const r = ref(database, config.paths.intrusionEvents(deviceId));
  const q = query(r, orderByChild('timestamp'), limitToLast(limit));
  const handler = (snap: DataSnapshot) => {
    const out: IntrusionEventRecord[] = [];
    snap.forEach((child) => {
      const v = child.val();
      if (v && child.key) out.push({ id: child.key, ...v });
    });
    out.sort((a, b) => b.timestamp - a.timestamp);
    callback(out);
  };
  onValue(q, handler);
  return () => off(q, 'value', handler);
}

export async function acknowledgeEvent(
  deviceId: string,
  eventId: string,
  userEmail?: string | null
): Promise<void> {
  const path = `${config.paths.intrusionEvents(deviceId)}/${eventId}`;
  await update(ref(database, path), {
    acknowledged: true,
    acknowledged_at: Date.now(),
    acknowledged_by: userEmail ?? 'unknown',
  });
}
