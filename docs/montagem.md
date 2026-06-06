# Guia de Montagem — Protoboard

> Antes de começar, revise o mapa de pinos em [esquematico.md](esquematico.md) e a lista de materiais em [bom.md](bom.md).

## Passo 1 — Preparar a protoboard

1. Centralize o ESP32 na protoboard ocupando as duas metades.
2. Conecte **3.3V** do ESP32 ao trilho positivo (+) superior.
3. Conecte **GND** ao trilho negativo (-) inferior.
4. Conecte **VIN (5V)** ao trilho positivo (+) da outra fileira (para dispositivos 5V).

## Passo 2 — DHT22 (Temp + Umidade)

| DHT22 | Conexão |
|---|---|
| Pino 1 (VCC) | Trilho 3.3V |
| Pino 2 (DATA) | GPIO 2 |
| — | Resistor **10kΩ** entre DATA e 3.3V (pull-up) |
| Pino 3 (NC) | Não conectar |
| Pino 4 (GND) | Trilho GND |

## Passo 3 — LDR (Luminosidade)

```
 3.3V ── LDR ──┬── GPIO 34
               │
             10kΩ
               │
              GND
```

## Passo 4 — HC-SR04 (ultrassônico: presença/distância)

| HC-SR04 | Conexão |
|---|---|
| VCC | Trilho 5V (VIN) |
| TRIG | GPIO 27 |
| ECHO | GPIO 14 |
| GND | Trilho GND |

> O firmware calcula a distância pelo tempo de eco e considera **presença/invasão** quando o objeto está a **≤100 cm**. A distância é enviada no `field8`. *(O ECHO do HC-SR04 é 5V; para uma montagem real rigorosa, use um divisor de tensão no ECHO para proteger o GPIO de 3.3V.)*

## Passo 5 — Potenciômetro (tensão AC simulada)

| Potenciômetro | Conexão |
|---|---|
| Terminal 1 | Trilho 3.3V |
| Cursor (wiper) | GPIO 35 (ADC1) |
| Terminal 2 | Trilho GND |

> A tensão AC é **simulada**: o firmware mapeia a leitura do cursor para 0–250 V. Para medir a rede elétrica de verdade, substitua por um **ZMPT101B** (lado DC em 5V/OUT=GPIO35; lado AC em paralelo com fase/neutro). ⚠ **PERIGO** — instalação AC só por eletricista qualificado.

## Passo 6 — Buzzer com driver BC547

```
 GPIO 25 ── 1kΩ ── Base (BC547)
                     │
                 Coletor ── Buzzer(-) ── 5V
                     │
                 Emissor ── GND
```

O buzzer positivo vai direto ao 5V; o BC547 chaveia o negativo.

## Passo 7 — Relés

| Relé 1 (Solar) | | Relé 2 (Diesel) |
|---|---|---|
| IN → GPIO 26 | | IN → GPIO 33 |
| VCC → 5V | | VCC → 5V |
| GND → GND | | GND → GND |
| COM → entrada solar | | COM → entrada diesel |
| NO → saída para carga | | NO → saída para carga |

## Passo 8 — Verificação final

- [ ] Todos os GNDs no mesmo trilho
- [ ] Nenhum fio solto ou cruzado
- [ ] DHT22 (GPIO2) e LDR alimentados em 3.3V; potenciômetro em 3.3V
- [ ] HC-SR04 e relés alimentados em 5V (VIN)
- [ ] Nenhum analógico em ADC2 (só GPIOs 34 e 35)
- [ ] Buzzer via BC547 (não direto no GPIO)
- [ ] Se usar ZMPT101B real: lado AC isolado e protegido (eletricista)
