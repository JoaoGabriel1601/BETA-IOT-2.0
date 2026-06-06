/*
 * DATACENTER IoT — versão com Adafruit DHT.h
 * libraries.txt:
 *   DHT sensor library
 *   Adafruit Unified Sensor
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// ================================================================
// DHT22 — biblioteca Adafruit
// ================================================================
#define DHTPIN   2        // pino DATA do DHT22  (GPIO 2)
#define DHTTYPE  DHT22
DHT dht(DHTPIN, DHTTYPE);

// ================================================================
// CONFIGURAÇÕES
// ================================================================
#define WIFI_SSID       "Wokwi-GUEST"
#define WIFI_PASSWORD   ""
#define THINGSPEAK_HOST           "api.thingspeak.com"
#define THINGSPEAK_WRITE_API_KEY  "177NQHD0TEF2ZOAW"

#define SEND_INTERVAL       16000UL
#define ENERGY_SWITCH_DELAY 500UL
#define ALARM_DURATION      10000UL
#define LIGHT_DAY_THRESHOLD 50.0
#define DISTANCE_THRESHOLD  100.0

// ================================================================
// PINOS  (GPIO2 agora é do DHT22 — LED movido para GPIO23)
// ================================================================
#define PIN_LDR          34
#define PIN_TRIG         27
#define PIN_ECHO         14
#define PIN_VOLTAGE      35

#define PIN_BUZZER       25
#define PIN_RELAY_SOLAR  26
#define PIN_RELAY_DIESEL 33
#define PIN_LED          23   // era GPIO2; liberado para o DHT22

// ================================================================
// VARIÁVEIS GLOBAIS
// ================================================================
float temperature    = -1.0;
float humidity       =  0.0;
float lightLevel     =  0.0;
float distanceCm     = -1.0;
bool  motionDetected = false;
float voltageAC      =  0.0;

bool   alarmActive  = false;
bool   solarActive  = true;
bool   dieselActive = false;
String energySource = "solar";

unsigned long lastSendTime   = 0;
unsigned long alarmStartTime = 0;
unsigned long lastMotionTime = 0;
String pendingStatus = "";
bool   lastDayState  = true;

// ================================================================
// SETUP
// ================================================================
void setup() {
    Serial.begin(115200);
    delay(300);
    Serial.println("\n========================================");
    Serial.println("  DATACENTER IoT - Inicializando...");
    Serial.println("========================================\n");

    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_RELAY_SOLAR, OUTPUT);
    pinMode(PIN_RELAY_DIESEL, OUTPUT);
    pinMode(PIN_LED, OUTPUT);
    pinMode(PIN_TRIG, OUTPUT);
    pinMode(PIN_ECHO, INPUT);
    pinMode(PIN_LDR, INPUT);
    pinMode(PIN_VOLTAGE, INPUT);

    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_RELAY_SOLAR, HIGH);
    digitalWrite(PIN_RELAY_DIESEL, LOW);
    digitalWrite(PIN_LED, LOW);
    digitalWrite(PIN_TRIG, LOW);

    analogReadResolution(12);

    dht.begin();
    Serial.println("[OK] DHT22 iniciado (Adafruit, pino GPIO2)");

    connectWiFi();

    Serial.println("[INFO] Preparando sensores (3s)...");
    for (int i = 3; i > 0; i--) {
        Serial.printf("  %d s...\n", i);
        delay(1000);
        digitalWrite(PIN_LED, !digitalRead(PIN_LED));
    }
    digitalWrite(PIN_LED, LOW);
    Serial.println("[OK] Sistema pronto!\n");
}

// ================================================================
// LOOP
// ================================================================
void loop() {
    readAllSensors();
    handleEnergySource();
    handleMotionAlarm();

    if (millis() - lastSendTime >= SEND_INTERVAL) {
        sendDataToThingSpeak();
        lastSendTime = millis();
    }

    printSensorData();
    delay(2000);
}

// ================================================================
// LEITURA DE SENSORES
// ================================================================
void readAllSensors() {
    // DHT22 — leitura Adafruit
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t)) temperature = t;
    else           Serial.println("[DHT] Falha na leitura de temperatura");

    if (!isnan(h)) humidity = h;
    else           Serial.println("[DHT] Falha na leitura de umidade");

    // LDR
    lightLevel = map(analogRead(PIN_LDR), 0, 4095, 0, 100);

    // HC-SR04
    distanceCm = readDistanceCm();
    motionDetected = (distanceCm > 0 && distanceCm <= DISTANCE_THRESHOLD);
    if (motionDetected) lastMotionTime = millis();

    // Tensão simulada
    voltageAC = readVoltageSim();
}

float readDistanceCm() {
    digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    unsigned long dur = pulseIn(PIN_ECHO, HIGH, 30000UL);
    if (dur == 0) return -1.0;
    return (float)dur * 0.0343 / 2.0;
}

float readVoltageSim() {
    return (analogRead(PIN_VOLTAGE) / 4095.0f) * 250.0f;
}

// ================================================================
// AUTOMAÇÃO
// ================================================================
void handleEnergySource() {
    bool isDaytime = (lightLevel > LIGHT_DAY_THRESHOLD);
    if (isDaytime != lastDayState) {
        if (isDaytime) {
            Serial.println("[ENERGIA] -> Solar");
            digitalWrite(PIN_RELAY_DIESEL, LOW); delay(ENERGY_SWITCH_DELAY);
            digitalWrite(PIN_RELAY_SOLAR, HIGH);
            energySource = "solar"; solarActive = true; dieselActive = false;
        } else {
            Serial.println("[ENERGIA] -> Diesel");
            digitalWrite(PIN_RELAY_SOLAR, LOW); delay(ENERGY_SWITCH_DELAY);
            digitalWrite(PIN_RELAY_DIESEL, HIGH);
            energySource = "diesel"; solarActive = false; dieselActive = true;
        }
        lastDayState = isDaytime;
    }
}

void handleMotionAlarm() {
    if (motionDetected && !alarmActive) {
        Serial.println("[!!! ALERTA !!!] INVASAO DETECTADA (HC-SR04)");
        alarmActive = true; alarmStartTime = millis();
        digitalWrite(PIN_BUZZER, HIGH); digitalWrite(PIN_LED, HIGH);
        sendIntrusionEvent("intrusion_detected", "Objeto detectado pelo HC-SR04");
    }
    if (alarmActive) {
        digitalWrite(PIN_LED, ((millis() / 250) % 2 == 0) ? HIGH : LOW);
        if (millis() - alarmStartTime >= ALARM_DURATION) {
            if (!motionDetected) {
                alarmActive = false;
                digitalWrite(PIN_BUZZER, LOW); digitalWrite(PIN_LED, LOW);
                Serial.println("[ALERTA] Desativado - area livre");
                sendIntrusionEvent("alarm_stopped", "Alarme desativado automaticamente");
            } else alarmStartTime = millis();
        }
    }
}

// ================================================================
// THINGSPEAK
// ================================================================
String urlEncode(const String &s) {
    String out = ""; char buf[4];
    for (size_t i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (isalnum((unsigned char)c)) out += c;
        else if (c == ' ') out += "%20";
        else { snprintf(buf, sizeof(buf), "%%%02X", (uint8_t)c); out += buf; }
    }
    return out;
}

void sendDataToThingSpeak() {
    if (WiFi.status() != WL_CONNECTED) { connectWiFi(); return; }

    String url = "http://" + String(THINGSPEAK_HOST) + "/update?api_key=" + String(THINGSPEAK_WRITE_API_KEY);
    url += "&field1=" + String(temperature, 1);
    url += "&field2=" + String(humidity, 1);
    url += "&field3=" + String(lightLevel, 1);
    url += "&field4=" + String(voltageAC, 1);
    url += "&field5=" + String(motionDetected ? 1 : 0);
    url += "&field6=" + String(energySource == "solar" ? 1 : 0);
    url += "&field7=" + String(alarmActive ? 1 : 0);
    url += "&field8=" + String(distanceCm, 1);   // <<< CORRIGIDO: distancia HC-SR04 (cm), era millis()/1000
    if (pendingStatus.length() > 0) url += "&status=" + urlEncode(pendingStatus);

    HTTPClient http; http.begin(url); int code = http.GET();
    if (code == 200) {
        String e = http.getString();
        if (e == "0") Serial.println("[TS] Rejeitado (15s/chave)");
        else { Serial.println("[TS] Enviado. Entry #" + e); pendingStatus = ""; }
    } else Serial.printf("[TS] Erro HTTP: %d\n", code);
    http.end();
}

void sendIntrusionEvent(const char* type, const char* desc) {
    pendingStatus = String(type) + ": " + String(desc);
    if (WiFi.status() == WL_CONNECTED && millis() - lastSendTime >= 15000) {
        sendDataToThingSpeak(); lastSendTime = millis();
    }
}

// ================================================================
// WIFI
// ================================================================
void connectWiFi() {
    WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("[Wi-Fi] Conectando");
    int t = 0;
    while (WiFi.status() != WL_CONNECTED && t++ < 40) { delay(300); Serial.print("."); }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("\n[Wi-Fi] IP: "); Serial.println(WiFi.localIP());
    } else Serial.println("\n[Wi-Fi] Sem conexao.");
}

// ================================================================
// SERIAL
// ================================================================
void printSensorData() {
    Serial.println("+--------------------------------------+");
    Serial.println("|     DATACENTER IoT - Leituras        |");
    Serial.println("+--------------------------------------+");
    Serial.printf("| Temperatura:  %5.1f C\n", temperature);
    Serial.printf("| Umidade:      %5.1f %%\n", humidity);
    Serial.printf("| Luminosidade: %5.0f %%\n", lightLevel);
    Serial.printf("| Distancia:    %5.1f cm\n", distanceCm);
    Serial.printf("| Invasao:      %s\n", motionDetected ? "DETECTADA!" : "Nenhuma");
    Serial.printf("| Tensao AC:    %5.1f V\n", voltageAC);
    Serial.printf("| Fonte:        %s\n", energySource.c_str());
    Serial.printf("| Alarme:       %s\n", alarmActive ? "ATIVO!" : "Desligado");
    Serial.println("+--------------------------------------+\n");
}
