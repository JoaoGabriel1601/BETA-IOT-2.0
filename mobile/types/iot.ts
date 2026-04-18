export type EnergySource = 'solar' | 'diesel';

export interface DeviceInfo {
  name: string;
  location: string;
  ip?: string;
  rssi?: number;
  last_seen?: number;
  firmware_version?: string;
}

export interface CurrentReading {
  temperature: number;
  humidity: number;
  light_level: number;
  motion_detected: boolean;
  voltage_ac: number;
  energy_source: EnergySource;
  alarm_active: boolean;
  relay_solar?: boolean;
  relay_diesel?: boolean;
  uptime_ms?: number;
  timestamp: number;
}

export interface HistoricalReading extends CurrentReading {}

export interface IntrusionEvent {
  event_type: string;
  description: string;
  acknowledged: boolean;
  timestamp: number;
  acknowledged_at?: number;
  acknowledged_by?: string;
}

export interface IntrusionEventRecord extends IntrusionEvent {
  id: string;
}

export interface DeviceSnapshot {
  current: CurrentReading | null;
  info: DeviceInfo | null;
  online: boolean;
}
