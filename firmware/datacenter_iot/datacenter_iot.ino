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
 *  Nuvem: ThingSpeak (HTTP, API de canal — 8 campos)
 *    field1=temp  field2=umid  field3=luz   field4=tensao
 *    field5=mov.   field6=fonte field7=alarme field8=uptime_s
 *    status=descricao da invasao (quando houver)
 * ================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
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

// Texto de status (descrição da invasão) a enviar no próximo update.
// Só é limpo após o ThingSpeak confirmar o recebimento.
String pendingStatus = "";

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
        sendDataToThingSpeak();
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
// COMUNICAÇÃO COM THINGSPEAK
// ================================================================
// Codifica uma string para uso seguro em query string (status).
String urlEncode(const String &s) {
    String out = "";
    char buf[4];
    for (size_t i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (isalnum((unsigned char)c)) {
            out += c;
        } else if (c == ' ') {
            out += "%20";
        } else {
            snprintf(buf, sizeof(buf), "%%%02X", (uint8_t)c);
            out += buf;
        }
    }
    return out;
}

// Envia todas as grandezas em um único GET /update (8 campos + status).
void sendDataToThingSpeak() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[ERRO] Wi-Fi desconectado!");
        connectWiFi();
        return;
    }

    int motionFlag = motionDetected ? 1 : 0;
    int energyCode = (energySource == "solar") ? 1 : 0;  // 1=solar, 0=diesel
    int alarmFlag  = alarmActive ? 1 : 0;
    unsigned long uptimeS = millis() / 1000;

    String url = "http://" + String(THINGSPEAK_HOST) + "/update";
    url += "?api_key=" + String(THINGSPEAK_WRITE_API_KEY);
    url += "&field1=" + String(temperature, 1);
    url += "&field2=" + String(humidity, 1);
    url += "&field3=" + String(lightLevel, 1);
    url += "&field4=" + String(voltageAC, 1);
    url += "&field5=" + String(motionFlag);
    url += "&field6=" + String(energyCode);
    url += "&field7=" + String(alarmFlag);
    url += "&field8=" + String(uptimeS);
    if (pendingStatus.length() > 0) {
        url += "&status=" + urlEncode(pendingStatus);
    }

    HTTPClient http;
    http.begin(url);
    int code = http.GET();

    if (code == 200) {
        String entryId = http.getString();
        if (entryId == "0") {
            // ThingSpeak rejeita (geralmente por exceder 1 envio/15s)
            Serial.println("[THINGSPEAK] Envio rejeitado (limite de 15s)");
        } else {
            Serial.println("[THINGSPEAK] Dados enviados. Entry #" + entryId);
            pendingStatus = "";  // só limpa após confirmação
        }
    } else {
        Serial.printf("[THINGSPEAK] Erro HTTP: %d\n", code);
    }
    http.end();
}

// Registra um evento de invasão: marca o texto de status e tenta enviar
// imediatamente, desde que respeitado o limite de 15s do ThingSpeak.
void sendIntrusionEvent(const char* eventType, const char* description) {
    pendingStatus = String(eventType) + ": " + String(description);
    Serial.printf("[EVENTO] %s\n", pendingStatus.c_str());

    if (WiFi.status() == WL_CONNECTED && (millis() - lastSendTime >= 15000)) {
        sendDataToThingSpeak();
        lastSendTime = millis();
    } else {
        Serial.println("[EVENTO] Sera enviado no proximo ciclo (limite de 15s)");
    }
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
