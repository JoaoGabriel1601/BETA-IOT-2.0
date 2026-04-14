# Simulação no Wokwi

O projeto inclui arquivos `diagram.json` e `wokwi.toml` em [firmware/datacenter_iot/](../firmware/datacenter_iot/) para simular o circuito no [Wokwi](https://wokwi.com).

## Substituições de sensores

Alguns sensores do projeto real não existem no Wokwi. As substituições equivalentes são:

| Sensor Real | Substituto no Wokwi | Como usar |
|---|---|---|
| DHT22 | `wokwi-dht22` | Clique no sensor durante a simulação para ajustar temp/umidade |
| LDR | `wokwi-photoresistor-sensor` | Clique na parte brilhante para mudar a luminosidade |
| HC-SR501 (PIR) | `wokwi-pushbutton` (vermelho) | **Pressione o botão** para simular detecção de movimento |
| ZMPT101B | `wokwi-potentiometer` | Gire o knob para simular tensão AC variável |
| Buzzer ativo | `wokwi-buzzer` | Emite som quando GPIO 25 vai HIGH |
| Relés | `wokwi-led` (amarelo/laranja) | LEDs acendem quando os relés são ativados |

## Como rodar

### Opção A — Wokwi Online (recomendado)

1. Acesse [wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32)
2. Cole o conteúdo de `datacenter_iot.ino` no editor
3. Clique na aba "diagram.json" e cole o conteúdo do nosso `diagram.json`
4. Em "Library Manager", adicione:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
   - `ArduinoJson`
5. Clique em **Play** (▶)

### Opção B — Extensão VS Code

1. Instale a extensão `Wokwi for VS Code`
2. Abra o Arduino IDE, compile o sketch (gera `.bin` e `.elf`)
3. Copie os binários para a pasta `firmware/datacenter_iot/`
4. Pressione F1 → "Wokwi: Start Simulator"

## Limitações da simulação

- **Wi-Fi**: o Wokwi suporta Wi-Fi simulado via `Wokwi-GUEST` (sem senha). As requisições para o Firebase **funcionarão de verdade** — os dados aparecerão no seu Realtime Database real.
- **ZMPT101B**: a simulação com potenciômetro produz um valor DC; a fórmula RMS no firmware filtrará ruído menor que 5V. Para testar a lógica, ajuste o potenciômetro para produzir ~1.65V (50% do knob) e mova levemente.
- **Buzzer**: emite som no navegador; desligue se for incômodo.

## Dicas

- Para testar a **comutação solar↔diesel**, cubra parcialmente o LDR simulado (clique para abrir slider de luz) até cruzar o limiar de 40%.
- Para testar o **alarme**, pressione o pushbutton vermelho por ~1s.
- Abra o Serial Monitor (ícone de terminal na barra lateral do Wokwi) para ver os logs do firmware.
