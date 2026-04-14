/*
 * ================================================================
 *  SISTEMA IoT — AUTOMAÇÃO PARA DATACENTER
 *  Microcontrolador: ESP32-WROOM DevKit V1
 *
 *  Sensores (5 grandezas):
 *    1. DHT22      → Temperatura    (GPIO 4)
 *    2. DHT22      → Umidade        (GPIO 4, mesmo sensor)
 *    3. LDR        → Luz solar      (GPIO 34 / ADC1)
 *    4. HC-SR501   → Movimento/PIR  (GPIO 27)
 *    5. ZMPT101B   → Tensão AC      (GPIO 35 / ADC1)
 *
 *  Atuadores:
 *    - Buzzer ativo  (GPIO 25, via BC547)
 *    - Relé Solar    (GPIO 26)
 *    - Relé Diesel   (GPIO 33)
 *    - LED onboard   (GPIO 2)
 *
 *  Nuvem: Firebase Realtime Database (REST API, HTTPS)
 * ================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <math.h>
#include "config.h"

// ================================================================
// DEFINIÇÃO DE PINOS
// ================================================================

// Sensores
#define PIN_DHT          4
#define PIN_LDR          34
#define PIN_PIR          27
#define PIN_VOLTAGE      35

// Atuadores
#define PIN_BUZZER       25
#define PIN_RELAY_SOLAR  26
#define PIN_RELAY_DIESEL 33
#define PIN_LED          2

// DHT
#define DHT_TYPE         DHT22
DHT dht(PIN_DHT, DHT_TYPE);

// ================================================================
// VARIÁVEIS GLOBAIS
// ================================================================

// Leituras
float temperature    = 0.0;
float humidity       = 0.0;
float lightLevel     = 0.0;
bool  motionDetected = false;
float voltageAC      = 0.0;

// Estados dos atuadores
bool   alarmActive  = false;
bool   solarActive  = true;
bool   dieselActive = false;
String energySource = "solar";

// Controle de tempo
unsigned long lastSendTime   = 0;
unsigned long alarmStartTime = 0;
unsigned long lastMotionTime = 0;

// Controle de comutação
bool lastDayState = true;

// Calibração ZMPT101B
const float ZMPT_CALIBRATION = 0.489;
const int   ZMPT_SAMPLES     = 1000;

// ================================================================
// SETUP
// ================================================================
void setup() {
    Serial.begin(115200);
    Serial.println("\n========================================");
    Serial.println("  DATACENTER IoT - Inicializando...");
    Serial.println("========================================\n");

    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_RELAY_SOLAR, OUTPUT);
    pinMode(PIN_RELAY_DIESEL, OUTPUT);
    pinMode(PIN_LED, OUTPUT);

    pinMode(PIN_PIR, INPUT);
    pinMode(PIN_LDR, INPUT);
    pinMode(PIN_VOLTAGE, INPUT);

    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_RELAY_SOLAR, HIGH);
    digitalWrite(PIN_RELAY_DIESEL, LOW);
    digitalWrite(PIN_LED, LOW);

    dht.begin();
    Serial.println("[OK] DHT22 inicializado");

    connectWiFi();

    Serial.println("[INFO] Aguardando estabilizacao do PIR (15s)...");
    for (int i = 15; i > 0; i--) {
        Serial.printf("  %d segundos...\n", i);
        delay(1000);
        digitalWrite(PIN_LED, !digitalRead(PIN_LED));
    }
    digitalWrite(PIN_LED, LOW);
    Serial.println("[OK] Sistema pronto!\n");
}

// ================================================================
// LOOP PRINCIPAL
// ================================================================
void loop() {
    readAllSensors();

    handleEnergySource();
    handleMotionAlarm();

    if (millis() - lastSendTime >= SEND_INTERVAL) {
        sendDataToFirebase();
        lastSendTime = millis();
    }

    printSensorData();
    delay(1000);
}

// ================================================================
// LEITURA DE SENSORES
// ================================================================
void readAllSensors() {
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity = h;

    int ldrRaw = analogRead(PIN_LDR);
    lightLevel = map(ldrRaw, 0, 4095, 0, 100);

    motionDetected = digitalRead(PIN_PIR) == HIGH;
    if (motionDetected) {
        lastMotionTime = millis();
    }

    voltageAC = readVoltageRMS();
}

float readVoltageRMS() {
    long  sumSquares = 0;
    int   zeroPoint  = 2048;

    for (int i = 0; i < ZMPT_SAMPLES; i++) {
        int raw = analogRead(PIN_VOLTAGE);
        int centered = raw - zeroPoint;
        sumSquares += (long)centered * centered;
        delayMicroseconds(100);
    }

    float rms = sqrt((float)sumSquares / ZMPT_SAMPLES);
    float voltage = rms * ZMPT_CALIBRATION;

    if (voltage < 5.0) voltage = 0.0;
    return voltage;
}

// ================================================================
// LÓGICA DE AUTOMAÇÃO
// ================================================================
void handleEnergySource() {
    bool isDaytime = (lightLevel > LIGHT_DAY_THRESHOLD);

    if (isDaytime != lastDayState) {
        Serial.println("\n[ENERGIA] Mudanca detectada!");

        if (isDaytime) {
            Serial.println("[ENERGIA] -> Ativando PAINEL SOLAR");
            digitalWrite(PIN_RELAY_DIESEL, LOW);
            delay(ENERGY_SWITCH_DELAY);
            digitalWrite(PIN_RELAY_SOLAR, HIGH);
            energySource = "solar";
            solarActive  = true;
            dieselActive = false;
        } else {
            Serial.println("[ENERGIA] -> Ativando GERADOR DIESEL");
            digitalWrite(PIN_RELAY_SOLAR, LOW);
            delay(ENERGY_SWITCH_DELAY);
            digitalWrite(PIN_RELAY_DIESEL, HIGH);
            energySource = "diesel";
            solarActive  = false;
            dieselActive = true;
        }

        lastDayState = isDaytime;
    }
}

void handleMotionAlarm() {
    if (motionDetected && !alarmActive) {
        Serial.println("\n[!!! ALERTA !!!] MOVIMENTO DETECTADO - INVASAO!");
        alarmActive = true;
        alarmStartTime = millis();
        digitalWrite(PIN_BUZZER, HIGH);
        digitalWrite(PIN_LED, HIGH);

        sendIntrusionEvent("motion_detected",
                           "Movimento detectado pelo sensor PIR no datacenter");
    }

    if (alarmActive) {
        if ((millis() / 250) % 2 == 0) {
            digitalWrite(PIN_LED, HIGH);
        } else {
            digitalWrite(PIN_LED, LOW);
        }

        if (millis() - alarmStartTime >= ALARM_DURATION) {
            if (!motionDetected) {
                alarmActive = false;
                digitalWrite(PIN_BUZZER, LOW);
                digitalWrite(PIN_LED, LOW);
                Serial.println("[ALERTA] Alarme desativado - sem movimento");
                sendIntrusionEvent("alarm_stopped",
                                   "Alarme desativado automaticamente");
            } else {
                alarmStartTime = millis();
            }
        }
    }
}

// ================================================================
// COMUNICAÇÃO COM FIREBASE
// ================================================================
void sendDataToFirebase() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[ERRO] Wi-Fi desconectado!");
        connectWiFi();
        return;
    }

    StaticJsonDocument<512> doc;
    doc["temperature"]     = round(temperature * 10) / 10.0;
    doc["humidity"]        = round(humidity * 10) / 10.0;
    doc["light_level"]     = round(lightLevel * 10) / 10.0;
    doc["motion_detected"] = motionDetected;
    doc["voltage_ac"]      = round(voltageAC * 10) / 10.0;
    doc["energy_source"]   = energySource;
    doc["alarm_active"]    = alarmActive;
    doc["relay_solar"]     = solarActive;
    doc["relay_diesel"]    = dieselActive;
    doc["uptime_ms"]       = millis();

    JsonObject tsObj = doc.createNestedObject("timestamp");
    tsObj[".sv"] = "timestamp";

    String jsonBody;
    serializeJson(doc, jsonBody);

    // 1) Estado atual (PUT sobrescreve)
    {
        HTTPClient http;
        String url = "https://" + String(FIREBASE_HOST)
                     + "/datacenter/devices/" + String(DEVICE_ID)
                     + "/current.json?auth=" + String(FIREBASE_AUTH);
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        int code = http.PUT(jsonBody);
        if (code == 200) {
            Serial.println("[FIREBASE] Estado atual atualizado");
        } else {
            Serial.printf("[FIREBASE] Erro ao atualizar estado: %d\n", code);
            Serial.println("[FIREBASE] " + http.getString());
        }
        http.end();
    }

    // 2) Histórico (POST gera ID único)
    {
        HTTPClient http;
        String url = "https://" + String(FIREBASE_HOST)
                     + "/datacenter/readings/" + String(DEVICE_ID)
                     + ".json?auth=" + String(FIREBASE_AUTH);
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        int code = http.POST(jsonBody);
        if (code == 200) {
            Serial.println("[FIREBASE] Historico salvo: " + http.getString());
        } else {
            Serial.printf("[FIREBASE] Erro ao salvar historico: %d\n", code);
        }
        http.end();
    }

    // 3) Info do dispositivo (last_seen)
    {
        HTTPClient http;
        String url = "https://" + String(FIREBASE_HOST)
                     + "/datacenter/devices/" + String(DEVICE_ID)
                     + "/info.json?auth=" + String(FIREBASE_AUTH);

        StaticJsonDocument<192> info;
        info["name"]     = "Datacenter Principal";
        info["location"] = "Sala de Servidores";
        info["ip"]       = WiFi.localIP().toString();
        info["rssi"]     = WiFi.RSSI();
        JsonObject ls = info.createNestedObject("last_seen");
        ls[".sv"] = "timestamp";

        String body;
        serializeJson(info, body);

        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        http.PUT(body);
        http.end();
    }
}

void sendIntrusionEvent(const char* eventType, const char* description) {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;
    String url = "https://" + String(FIREBASE_HOST)
                 + "/datacenter/intrusion_events/" + String(DEVICE_ID)
                 + ".json?auth=" + String(FIREBASE_AUTH);

    StaticJsonDocument<256> doc;
    doc["event_type"]   = eventType;
    doc["description"]  = description;
    doc["acknowledged"] = false;
    JsonObject ts = doc.createNestedObject("timestamp");
    ts[".sv"] = "timestamp";

    String body;
    serializeJson(doc, body);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(body);

    if (code == 200) {
        Serial.printf("[FIREBASE] Evento '%s' registrado\n", eventType);
    } else {
        Serial.printf("[FIREBASE] Erro ao registrar evento: %d\n", code);
    }
    http.end();
}

// ================================================================
// CONEXÃO Wi-Fi
// ================================================================
void connectWiFi() {
    Serial.printf("[Wi-Fi] Conectando a '%s'", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[Wi-Fi] Conectado!");
        Serial.printf("[Wi-Fi] IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[Wi-Fi] RSSI: %d dBm\n", WiFi.RSSI());
    } else {
        Serial.println("\n[Wi-Fi] Falha. Tentando novamente em 5s...");
        delay(5000);
        connectWiFi();
    }
}

// ================================================================
// MONITOR SERIAL
// ================================================================
void printSensorData() {
    Serial.println("+--------------------------------------+");
    Serial.println("|     DATACENTER IoT - Leituras        |");
    Serial.println("+--------------------------------------+");
    Serial.printf("| Temperatura:  %5.1f C                 \n", temperature);
    Serial.printf("| Umidade:      %5.1f %%                 \n", humidity);
    Serial.printf("| Luminosidade: %5.0f %%                 \n", lightLevel);
    Serial.printf("| Movimento:    %-10s                 \n", motionDetected ? "DETECTADO!" : "Nenhum");
    Serial.printf("| Tensao AC:    %5.1f V                 \n", voltageAC);
    Serial.println("+--------------------------------------+");
    Serial.printf("| Fonte:        %-10s                 \n", energySource.c_str());
    Serial.printf("| Alarme:       %-10s                 \n", alarmActive ? "ATIVO!" : "Desligado");
    Serial.println("+--------------------------------------+\n");
}
