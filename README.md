# Sistema IoT — Automação para Datacenter

Sistema embarcado baseado em **ESP32-WROOM** para automação e monitoramento de um datacenter. Mede **5 grandezas físicas**, comuta automaticamente a fonte de energia (**solar ↔ diesel**) conforme a luminosidade, detecta invasão via sensor **PIR** com alarme sonoro, monitora a **tensão AC** do quadro elétrico e transmite tudo para a nuvem via **ThingSpeak**, consumido por um dashboard web e um app mobile.

> **Modo de operação:** o projeto roda em **simulação online no [Wokwi](https://wokwi.com)** (sem necessidade de montar o hardware), enviando os dados por **HTTP** para um canal do **ThingSpeak**. O esquemático e o guia de montagem física continuam disponíveis para quem quiser reproduzir o protótipo real.

## Estrutura do projeto

```
BETA IOT 2.0/
├── firmware/datacenter_iot/   # Sketch Arduino + Wokwi
├── dashboard/                 # Dashboard web (HTML + CSS + JS)
├── mobile/                    # App mobile (Expo / React Native)
├── docs/                      # Guia de montagem, BOM, esquemático, Wokwi
└── README.md
```

## Grandezas monitoradas

| # | Grandeza | Sensor | Pino | Campo ThingSpeak |
|---|---|---|---|---|
| 1 | Temperatura | DHT22 | GPIO 4 | field1 |
| 2 | Umidade | DHT22 (mesmo sensor) | GPIO 4 | field2 |
| 3 | Luz solar | LDR + 10kΩ | GPIO 34 (ADC1) | field3 |
| 4 | Tensão AC | ZMPT101B | GPIO 35 (ADC1) | field4 |
| 5 | Movimento | HC-SR501 (PIR) | GPIO 27 | field5 |

Campos auxiliares: `field6` = fonte de energia (1=solar, 0=diesel), `field7` = alarme (0/1), `field8` = uptime (s). O campo **status** carrega a descrição da invasão.

Veja [docs/esquematico.md](docs/esquematico.md) para o mapa de pinagem completo.

## Setup — passo a passo

### 1. ThingSpeak (nuvem)

1. Crie uma conta gratuita em [thingspeak.com](https://thingspeak.com).
2. **Channels → New Channel** e habilite os 8 campos (`field1`..`field8`) conforme a tabela acima.
3. Salve. Na aba **API Keys**, anote:
   - **Write API Key** → usada pelo firmware.
   - **Channel ID** + **Read API Key** → usados pelo dashboard e pelo app.
4. (Opcional) Em **Channel Settings**, marque *Make Public* para que dashboard/app leiam sem a Read API Key.

> ⚠️ Conta gratuita aceita **1 envio a cada 15s** por canal. O firmware usa intervalo de 20s.

### 2. Firmware (ESP32 no Wokwi)

1. Abra [firmware/datacenter_iot/](firmware/datacenter_iot/).
2. Copie `config.example.h` → `config.local.h` (gitignored) e preencha:
   - `WIFI_SSID` = `"Wokwi-GUEST"`, `WIFI_PASSWORD` = `""` (rede do Wokwi)
   - `THINGSPEAK_WRITE_API_KEY` = sua Write API Key
   - `THINGSPEAK_CHANNEL_ID` = número do canal
3. Bibliotecas necessárias (Library Manager): `DHT sensor library` (Adafruit) + `Adafruit Unified Sensor`.
4. Rode no Wokwi (▶) e acompanhe o Serial Monitor. Detalhes em [docs/wokwi.md](docs/wokwi.md).

> Para hardware real, use o Arduino IDE com a placa **ESP32 Dev Module** e o SSID/senha da sua rede no lugar do `Wokwi-GUEST`.

### 3. Dashboard web

1. Em [dashboard/](dashboard/), copie `thingspeak-config.example.js` → `thingspeak-config.local.js` e preencha `channelId` (e `readApiKey` se o canal for privado).
2. Abra [dashboard/index.html](dashboard/index.html) no navegador, ou sirva a pasta `dashboard/` em qualquer host estático (GitHub Pages, Netlify, Vercel, `python -m http.server`, etc.).

### 4. App mobile (Expo)

1. Em [mobile/](mobile/), copie `.env.example` → `.env` e preencha `EXPO_PUBLIC_THINGSPEAK_CHANNEL_ID` (e `EXPO_PUBLIC_THINGSPEAK_READ_API_KEY` se privado).
2. `npm install` e `npx expo start`.

## Fluxo de dados

```mermaid
sequenceDiagram
    participant ESP as ESP32 (Wokwi)
    participant TS as ThingSpeak
    participant APP as Dashboard / App

    loop A cada 20s
        ESP->>ESP: Lê 5 sensores
        ESP->>TS: GET /update?field1=..&field8=..
    end

    alt Invasão detectada
        ESP->>TS: field7=1 + status="motion_detected: ..."
    end

    loop Polling a cada ~15s
        APP->>TS: GET /channels/ID/feeds.json
        TS-->>APP: últimas leituras + status
    end
```

## Lógica de automação

- **Comutação solar/diesel**: `lightLevel > 40%` → painel solar ativo; senão, gerador diesel. Delay de 3s entre desligar uma fonte e ligar a outra (segurança).
- **Alarme anti-invasão**: PIR em HIGH → buzzer por 10s + LED piscando + `field7=1` e descrição no `status`. Se houver novo movimento durante o alarme, o contador de 10s reinicia.
- **Tensão AC**: leitura RMS com 1000 amostras a ~10kHz, subtrai offset DC e aplica fator de calibração (0.489 padrão; ajuste se necessário com multímetro em paralelo).

## Considerações sobre o ThingSpeak

- **Sem tempo real / sem login**: o ThingSpeak é série-temporal e *append-only*. O dashboard e o app fazem **polling** (~15s) da Read API; não há autenticação de usuário nem push via WebSocket.
- **Eventos de invasão**: são reconstruídos a partir do campo `status` do feed (preenchido pelo firmware só quando há evento). O botão **Reconhecer** é **local** (localStorage no web, AsyncStorage no app) — o ThingSpeak não persiste o estado de reconhecimento.

## Avisos de segurança

- ⚠ **Alta tensão (ZMPT101B)**: a conexão do lado AC (110/220V) deve ser feita por um eletricista qualificado. Para testes didáticos, use uma extensão cortada com terminais fixos.
- Não exponha sua **Write API Key** — ela fica apenas em `config.local.h` (gitignored). Se vazar, gere uma nova na aba *API Keys* do ThingSpeak.
- Os relés do projeto **simulam** a lógica de comutação; em um datacenter real, use um **ATS (Automatic Transfer Switch)** industrial e use o ESP32 apenas para sinalização.

## Documentação adicional

- [Guia de simulação no Wokwi + ThingSpeak](docs/wokwi.md)
- [Guia de montagem passo a passo](docs/montagem.md)
- [Lista de materiais](docs/bom.md)
- [Esquemático e mapa de pinagem](docs/esquematico.md)
