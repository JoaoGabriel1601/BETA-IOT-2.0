#ifndef CONFIG_H
#define CONFIG_H

// ================================================================
// Credenciais (Wi-Fi, ThingSpeak, DEVICE_ID) ficam em config.local.h,
// que é gitignored. Copie config.example.h → config.local.h e preencha.
// ================================================================
#include "config.local.h"

// ================================================================
// ENDPOINT THINGSPEAK (fixo — não é segredo)
// ================================================================
#define THINGSPEAK_HOST      "api.thingspeak.com"

// ================================================================
// INTERVALOS DE TEMPO (milissegundos)
// ================================================================
// ThingSpeak (conta free) aceita no máximo 1 envio a cada 15s.
// Usamos 20s para ter margem segura acima desse limite.
#define SEND_INTERVAL        20000   // Envia dados a cada 20s
#define ALARM_DURATION       10000   // Buzzer toca por 10s após invasão
#define ENERGY_SWITCH_DELAY  3000    // Delay na comutação solar↔diesel

// ================================================================
// LIMITES (THRESHOLDS)
// ================================================================
#define TEMP_ALERT_HIGH      28.0    // °C — alerta alta
#define TEMP_ALERT_LOW       15.0    // °C — alerta baixa
#define HUMIDITY_ALERT_HIGH  70.0    // % — alerta alta
#define HUMIDITY_ALERT_LOW   30.0    // % — alerta baixa
#define LIGHT_DAY_THRESHOLD  40      // % — acima = dia (solar), abaixo = noite (diesel)
#define VOLTAGE_ALERT_LOW    100.0   // V — subtensão
#define VOLTAGE_ALERT_HIGH   240.0   // V — sobretensão

#endif // CONFIG_H
