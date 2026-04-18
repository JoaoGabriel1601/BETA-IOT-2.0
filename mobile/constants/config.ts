export const config = {
  deviceId: 'esp32-datacenter-001',
  maxHistoryPoints: 50,
  paths: {
    current: (deviceId: string) => `datacenter/devices/${deviceId}/current`,
    info: (deviceId: string) => `datacenter/devices/${deviceId}/info`,
    readings: (deviceId: string) => `datacenter/readings/${deviceId}`,
    intrusionEvents: (deviceId: string) => `datacenter/intrusion_events/${deviceId}`,
  },
} as const;
