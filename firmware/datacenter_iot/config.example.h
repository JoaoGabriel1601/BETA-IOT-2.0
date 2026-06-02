#ifndef CONFIG_LOCAL_H
#define CONFIG_LOCAL_H

// ================================================================
// TEMPLATE — copie este arquivo para config.local.h e preencha.
// config.local.h é gitignored e fornece as credenciais reais.
// ================================================================

// ----------------------------------------------------------------
// Wi-Fi
// ----------------------------------------------------------------
//   Na simulação do Wokwi use a rede aberta "Wokwi-GUEST" (sem senha):
//     #define WIFI_SSID      "Wokwi-GUEST"
//     #define WIFI_PASSWORD  ""
//   Em hardware real, use o SSID/senha da sua rede.
#define WIFI_SSID         "Wokwi-GUEST"
#define WIFI_PASSWORD     ""

// ----------------------------------------------------------------
// ThingSpeak (https://thingspeak.com)
// ----------------------------------------------------------------
//   1. Crie um canal com 8 campos (Channel Settings):
//        field1=temperature  field2=humidity   field3=light_level
//        field4=voltage_ac    field5=motion     field6=energy_source
//        field7=alarm         field8=uptime_s
//   2. THINGSPEAK_WRITE_API_KEY: aba "API Keys" → "Write API Key"
//   3. THINGSPEAK_CHANNEL_ID: número do canal (aparece na URL/topo do canal)
//   O firmware envia via HTTP simples (porta 80) — ideal para o Wokwi.
//   ATENÇÃO: conta gratuita aceita no máximo 1 envio a cada 15 segundos.
#define THINGSPEAK_WRITE_API_KEY  "SUA_WRITE_API_KEY_AQUI"
#define THINGSPEAK_CHANNEL_ID     0000000

// Identificador deste dispositivo (apenas rótulo nos logs)
#define DEVICE_ID         "esp32-datacenter-001"

#endif // CONFIG_LOCAL_H
