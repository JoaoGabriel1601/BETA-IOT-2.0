#ifndef CONFIG_H
#define CONFIG_H

// ================================================================
// CONFIGURAÇÕES Wi-Fi
// ================================================================
#define WIFI_SSID         "NOME_DA_SUA_REDE"
#define WIFI_PASSWORD     "SENHA_DA_SUA_REDE"

// ================================================================
// CONFIGURAÇÕES FIREBASE
// ================================================================
// FIREBASE_HOST: URL do Realtime Database SEM "https://" e SEM barra final
//   Exemplo: "datacenter-iot-default-rtdb.firebaseio.com"
//
// FIREBASE_AUTH: "Database Secret" em Firebase Console
//   → Configurações do Projeto → Contas de Serviço → Database Secrets
//
// DEVICE_ID: identificador único deste ESP32 (caracteres sem espaços)
// ================================================================
#define FIREBASE_HOST     "SEU_PROJETO-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH     "SUA_DATABASE_SECRET_AQUI"
#define DEVICE_ID         "esp32-datacenter-001"

// ================================================================
// INTERVALOS DE TEMPO (milissegundos)
// ================================================================
#define SEND_INTERVAL        30000   // Envia dados a cada 30s
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
