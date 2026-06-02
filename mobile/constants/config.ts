export const config = {
  deviceId: 'esp32-datacenter-001',
  maxHistoryPoints: 50,
  // ThingSpeak free: ~1 leitura a cada 15s é suficiente.
  pollIntervalMs: 15_000,
  thingspeak: {
    channelId: process.env.EXPO_PUBLIC_THINGSPEAK_CHANNEL_ID ?? '',
    // Só necessária se o canal for privado (público lê sem chave).
    readApiKey: process.env.EXPO_PUBLIC_THINGSPEAK_READ_API_KEY ?? '',
  },
} as const;
