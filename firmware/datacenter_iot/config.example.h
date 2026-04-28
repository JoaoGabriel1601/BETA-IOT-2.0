#ifndef CONFIG_LOCAL_H
#define CONFIG_LOCAL_H

// ================================================================
// TEMPLATE — copie este arquivo para config.local.h e preencha.
// config.local.h é gitignored e fornece as credenciais reais.
// ================================================================

// Wi-Fi
#define WIFI_SSID         "NOME_DA_SUA_REDE"
#define WIFI_PASSWORD     "SENHA_DA_SUA_REDE"

// Firebase RTDB
//   FIREBASE_HOST: URL do Realtime Database SEM "https://" e SEM barra final
//     Exemplo: "datacenter-iot-default-rtdb.firebaseio.com"
//   FIREBASE_AUTH: "Database Secret" em Firebase Console
//     → Configurações do Projeto → Contas de Serviço → Database Secrets
//   DEVICE_ID: identificador único deste ESP32 (caracteres sem espaços)
#define FIREBASE_HOST     "SEU_PROJETO-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH     "SUA_DATABASE_SECRET_AQUI"
#define DEVICE_ID         "esp32-datacenter-001"

#endif // CONFIG_LOCAL_H
