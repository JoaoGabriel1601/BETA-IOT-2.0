import AsyncStorage from '@react-native-async-storage/async-storage';

import { config } from '@/constants/config';
import type {
  CurrentReading,
  DeviceInfo,
  HistoricalReading,
  IntrusionEventRecord,
} from '@/types/iot';

type Unsubscribe = () => void;

// ----------------------------------------------------------------
// Tipos da resposta do ThingSpeak
// ----------------------------------------------------------------
interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1?: string | null;
  field2?: string | null;
  field3?: string | null;
  field4?: string | null;
  field5?: string | null;
  field6?: string | null;
  field7?: string | null;
  field8?: string | null;
  status?: string | null;
}

interface ThingSpeakResponse {
  channel?: { name?: string };
  feeds?: ThingSpeakFeed[];
}

// Leitura já mapeada (CurrentReading + extras de evento)
interface MappedReading extends CurrentReading {
  status: string;
  entry_id: number;
}

// ----------------------------------------------------------------
// Mapeamento field1..8 → grandezas
// ----------------------------------------------------------------
function num(v?: string | null): number {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
}

function mapFeed(f: ThingSpeakFeed): MappedReading {
  return {
    temperature: num(f.field1),
    humidity: num(f.field2),
    light_level: num(f.field3),
    voltage_ac: num(f.field4),
    motion_detected: f.field5 === '1',
    energy_source: f.field6 === '1' ? 'solar' : 'diesel',
    alarm_active: f.field7 === '1',
    uptime_ms: num(f.field8) * 1000,
    timestamp: Date.parse(f.created_at),
    status: (f.status ?? '').trim(),
    entry_id: f.entry_id,
  };
}

// ----------------------------------------------------------------
// Poller compartilhado — uma requisição por ciclo p/ todos os hooks
// ----------------------------------------------------------------
function feedsUrl(results: number): string {
  const { channelId, readApiKey } = config.thingspeak;
  let url =
    `https://api.thingspeak.com/channels/${channelId}/feeds.json` +
    `?results=${results}&status=true`;
  if (readApiKey) url += `&api_key=${readApiKey}`;
  return url;
}

let feeds: MappedReading[] = [];
let channelName: string | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

async function fetchOnce(): Promise<void> {
  if (!config.thingspeak.channelId) return;
  try {
    const res = await fetch(feedsUrl(config.maxHistoryPoints), {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as ThingSpeakResponse;
    feeds = (json.feeds ?? []).map(mapFeed).filter((r) => Number.isFinite(r.timestamp));
    channelName = json.channel?.name ?? null;
    notify();
  } catch (err) {
    console.warn('[ThingSpeak] Falha ao buscar feed:', err);
  }
}

function subscribeRaw(listener: () => void): Unsubscribe {
  listeners.add(listener);
  if (!timer) {
    fetchOnce();
    timer = setInterval(fetchOnce, config.pollIntervalMs);
  } else if (feeds.length || channelName) {
    listener(); // entrega dados já carregados imediatamente
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// ----------------------------------------------------------------
// Reconhecimento (ack) — local, via AsyncStorage
// (ThingSpeak é append-only e não persiste estado de ack)
// ----------------------------------------------------------------
const ACK_KEY = 'datacenter_acked_events';
let ackedIds = new Set<string>();

AsyncStorage.getItem(ACK_KEY)
  .then((v) => {
    if (!v) return;
    try {
      ackedIds = new Set(JSON.parse(v) as string[]);
      notify();
    } catch {
      /* ignora JSON inválido */
    }
  })
  .catch(() => {});

// ----------------------------------------------------------------
// API pública (mesma assinatura da antiga realtimeDatabase.ts)
// ----------------------------------------------------------------
export function subscribeCurrent(
  _deviceId: string,
  callback: (value: CurrentReading | null) => void
): Unsubscribe {
  return subscribeRaw(() => callback(feeds.length ? feeds[feeds.length - 1] : null));
}

export function subscribeDeviceInfo(
  _deviceId: string,
  callback: (value: DeviceInfo | null) => void
): Unsubscribe {
  return subscribeRaw(() => {
    const last = feeds[feeds.length - 1];
    callback({
      name: channelName ?? `Canal ${config.thingspeak.channelId}`,
      location: 'ThingSpeak',
      last_seen: last?.timestamp,
    });
  });
}

export function subscribeReadingsHistory(
  _deviceId: string,
  limit: number,
  callback: (readings: HistoricalReading[]) => void
): Unsubscribe {
  return subscribeRaw(() => callback(feeds.slice(-limit)));
}

export function subscribeIntrusionEvents(
  _deviceId: string,
  limit: number,
  callback: (events: IntrusionEventRecord[]) => void
): Unsubscribe {
  return subscribeRaw(() => callback(buildEvents(limit)));
}

function buildEvents(limit: number): IntrusionEventRecord[] {
  return feeds
    .filter((r) => r.status.length > 0)
    .map((r) => {
      const idx = r.status.indexOf(':');
      const id = String(r.entry_id);
      return {
        id,
        event_type: idx === -1 ? r.status : r.status.slice(0, idx).trim(),
        description: idx === -1 ? '' : r.status.slice(idx + 1).trim(),
        timestamp: r.timestamp,
        acknowledged: ackedIds.has(id),
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function acknowledgeEvent(
  _deviceId: string,
  eventId: string
): Promise<void> {
  ackedIds.add(eventId);
  await AsyncStorage.setItem(ACK_KEY, JSON.stringify([...ackedIds]));
  notify();
}
