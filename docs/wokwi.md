# Simulação no Wokwi + ThingSpeak

O projeto roda inteiramente em simulação: o circuito é montado no [Wokwi](https://wokwi.com) e os dados são enviados, via **HTTP**, para um canal do [ThingSpeak](https://thingspeak.com). Os arquivos `diagram.json` e `wokwi.toml` estão em [firmware/datacenter_iot/](../firmware/datacenter_iot/).

> **Por que ThingSpeak?** Diferente do Firebase (que exige HTTPS/TLS), o ThingSpeak aceita requisições em **HTTP simples (porta 80)**, o que torna o envio muito mais estável dentro do Wokwi com a rede `Wokwi-GUEST`.

## 1. Criar o canal no ThingSpeak

1. Crie uma conta gratuita em [thingspeak.com](https://thingspeak.com).
2. **Channels → New Channel** e configure os 8 campos exatamente nesta ordem:

   | Campo | Nome sugerido | Conteúdo |
   |---|---|---|
   | field1 | Temperatura | °C |
   | field2 | Umidade | % |
   | field3 | Luminosidade | % |
   | field4 | Tensao_AC | V |
   | field5 | Movimento | 0/1 (objeto ≤100 cm) |
   | field6 | Fonte_Energia | 1=solar, 0=diesel |
   | field7 | Alarme | 0/1 |
   | field8 | Distancia | cm (HC-SR04) |

3. Salve o canal. Na aba **API Keys**, anote:
   - **Write API Key** → usada pelo firmware (ESP32).
   - **Read API Key** + **Channel ID** → usados pelo dashboard e pelo app mobile.

> A descrição da invasão é enviada no campo **status** do canal (texto), visível na aba *Channel Status* e via API.

## 2. Substituições de sensores no Wokwi

Alguns sensores reais não existem no Wokwi. As substituições equivalentes são:

| Sensor Real | Substituto no Wokwi | Como usar |
|---|---|---|
| DHT22 (GPIO2) | `wokwi-dht22` | Clique no sensor durante a simulação para ajustar temp/umidade |
| LDR | `wokwi-photoresistor-sensor` | Clique na parte brilhante para mudar a luminosidade |
| HC-SR04 (TRIG27/ECHO14) | `wokwi-hc-sr04` | **Arraste o controle de distância**; ≤100 cm dispara presença/alarme |
| ZMPT101B (tensão simulada) | `wokwi-potentiometer` | Gire o knob para simular a tensão AC |
| Buzzer ativo | `wokwi-buzzer` | Emite som quando GPIO 25 vai HIGH |
| Relés | `wokwi-led` (amarelo/laranja) | LEDs acendem quando os relés são ativados |

## 3. Configurar credenciais

As credenciais ficam direto no topo de [sketch.ino](../firmware/datacenter_iot/sketch.ino) (já preenchidas para a simulação):

```c
#define WIFI_SSID                 "Wokwi-GUEST"
#define WIFI_PASSWORD             ""
#define THINGSPEAK_WRITE_API_KEY  "SUA_WRITE_API_KEY"
```

O dashboard e o app leem o canal `3399683` (público) — não precisam de Read API Key.

## 4. Rodar a simulação

### Opção A — Wokwi Online (recomendado)

1. Acesse [wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32).
2. Cole o conteúdo de `sketch.ino` no editor.
3. Crie o arquivo `diagram.json` (botão **+** → *New file*) e cole o conteúdo.
4. Em **Library Manager**, adicione:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
5. Clique em **Play** (▶) e abra o **Serial Monitor**.

### Opção B — Wokwi CLI (local, headless)

A pasta [firmware/datacenter_iot/](../firmware/datacenter_iot/) já tem o `wokwi.toml`. Para rodar sem navegador:

1. Compile o sketch (ex.: `arduino-cli compile -b esp32:esp32:esp32 --output-dir build .`) para gerar os binários em `build/`.
2. Instale o [Wokwi CLI](https://docs.wokwi.com/wokwi-ci/getting-started) e gere um token em [wokwi.com/dashboard/ci](https://wokwi.com/dashboard/ci).
3. `WOKWI_CLI_TOKEN=... wokwi-cli . --timeout 60000 --serial-log-file sim.log`

### Opção C — Extensão VS Code

1. Instale a extensão `Wokwi for VS Code`.
2. Compile o sketch (gera `.bin` e `.elf`) e aponte o `wokwi.toml` para eles.
3. Pressione F1 → "Wokwi: Start Simulator".

## 5. Verificar os dados

- No **Serial Monitor** do Wokwi, cada envio mostra `[TS] Enviado. Entry #N`.
- No site do ThingSpeak, abra o canal: os gráficos *Field Charts* atualizam a cada envio (~16s).
- O dashboard web ([online no Vercel](https://datacenter-iot-dashboard.vercel.app)) e o app mobile leem o mesmo canal público (ver README).

## Limitações da simulação

- **Limite de envio**: conta gratuita do ThingSpeak aceita **1 mensagem a cada 15s** por canal. O firmware usa `SEND_INTERVAL = 16000` (16s) para ter margem. Envios mais rápidos retornam `Entry #0` (rejeitado).
- **Sem tempo real**: o ThingSpeak não tem push; o dashboard e o app fazem *polling* (~15s).
- **Tensão (simulada)**: o potenciômetro no GPIO35 é mapeado direto para 0–250 V (`analogRead/4095*250`) — não há cálculo RMS. Gire o knob para variar a "tensão AC".
- **Buzzer**: emite som no navegador; desligue se for incômodo.

## Dicas

- Para testar a **comutação solar↔diesel**, ajuste o LDR simulado (clique para abrir o slider de luz) cruzando o limiar de 50%.
- Para testar o **alarme**, clique no HC-SR04 e arraste a distância para **≤100 cm** — o firmware envia `field5=1`, `field7=1` e a descrição no `status`.
- Abra o Serial Monitor (ícone de terminal na barra lateral do Wokwi) para ver os logs do firmware.
