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
   | field5 | Movimento | 0/1 |
   | field6 | Fonte_Energia | 1=solar, 0=diesel |
   | field7 | Alarme | 0/1 |
   | field8 | Uptime_s | segundos |

3. Salve o canal. Na aba **API Keys**, anote:
   - **Write API Key** → usada pelo firmware (ESP32).
   - **Read API Key** + **Channel ID** → usados pelo dashboard e pelo app mobile.

> A descrição da invasão é enviada no campo **status** do canal (texto), visível na aba *Channel Status* e via API.

## 2. Substituições de sensores no Wokwi

Alguns sensores reais não existem no Wokwi. As substituições equivalentes são:

| Sensor Real | Substituto no Wokwi | Como usar |
|---|---|---|
| DHT22 | `wokwi-dht22` | Clique no sensor durante a simulação para ajustar temp/umidade |
| LDR | `wokwi-photoresistor-sensor` | Clique na parte brilhante para mudar a luminosidade |
| HC-SR501 (PIR) | `wokwi-pushbutton` (vermelho) | **Pressione o botão** para simular detecção de movimento |
| ZMPT101B | `wokwi-potentiometer` | Gire o knob para simular tensão AC variável |
| Buzzer ativo | `wokwi-buzzer` | Emite som quando GPIO 25 vai HIGH |
| Relés | `wokwi-led` (amarelo/laranja) | LEDs acendem quando os relés são ativados |

## 3. Configurar credenciais

Copie [config.example.h](../firmware/datacenter_iot/config.example.h) para `config.local.h` (gitignored) e preencha:

```c
#define WIFI_SSID                "Wokwi-GUEST"
#define WIFI_PASSWORD            ""
#define THINGSPEAK_WRITE_API_KEY "SUA_WRITE_API_KEY"
#define THINGSPEAK_CHANNEL_ID    1234567
#define DEVICE_ID                "esp32-datacenter-001"
```

## 4. Rodar a simulação

### Opção A — Wokwi Online (recomendado)

1. Acesse [wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32).
2. Cole o conteúdo de `datacenter_iot.ino` no editor.
3. Crie os arquivos `config.h`, `config.local.h` e `diagram.json` (botão **+** → *New file*) e cole o conteúdo de cada um.
4. Em **Library Manager**, adicione:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
5. Clique em **Play** (▶) e abra o **Serial Monitor**.

### Opção B — Extensão VS Code

1. Instale a extensão `Wokwi for VS Code`.
2. No Arduino IDE, compile o sketch (gera `.bin` e `.elf`).
3. Copie os binários para `firmware/datacenter_iot/`.
4. Pressione F1 → "Wokwi: Start Simulator".

## 5. Verificar os dados

- No **Serial Monitor** do Wokwi, cada envio mostra `[THINGSPEAK] Dados enviados. Entry #N`.
- No site do ThingSpeak, abra o canal: os gráficos *Field Charts* atualizam a cada envio (~20s).
- O dashboard web e o app mobile leem o mesmo canal pela Read API Key (ver README).

## Limitações da simulação

- **Limite de envio**: conta gratuita do ThingSpeak aceita **1 mensagem a cada 15s** por canal. O firmware usa `SEND_INTERVAL = 20000` (20s) para ter margem. Envios mais rápidos retornam `Entry #0` (rejeitado).
- **Sem tempo real**: o ThingSpeak não tem push; o dashboard e o app fazem *polling* (~15s).
- **ZMPT101B**: o potenciômetro produz um valor DC; a fórmula RMS no firmware filtra ruído menor que 5V. Ajuste o knob para ~1.65V (50%) e mova levemente para simular tensão.
- **Buzzer**: emite som no navegador; desligue se for incômodo.

## Dicas

- Para testar a **comutação solar↔diesel**, ajuste o LDR simulado (clique para abrir o slider de luz) cruzando o limiar de 40%.
- Para testar o **alarme**, pressione o pushbutton vermelho por ~1s — o firmware envia `field7=1` e a descrição no `status`.
- Abra o Serial Monitor (ícone de terminal na barra lateral do Wokwi) para ver os logs do firmware.
