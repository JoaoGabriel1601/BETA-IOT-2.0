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
| Pino 2 (DATA) | GPIO 4 |
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

## Passo 4 — HC-SR501 (PIR)

| HC-SR501 | Conexão |
|---|---|
| VCC | Trilho 5V (VIN) |
| OUT | GPIO 27 |
| GND | Trilho GND |

**Ajustes no módulo:**
- Potenciômetro de **sensibilidade** → máximo (sentido horário)
- Potenciômetro de **tempo** → ~5s
- Jumper em posição **H** (modo retrigger)

## Passo 5 — ZMPT101B (Tensão AC)

| Lado DC | Conexão |
|---|---|
| VCC | Trilho 5V (VIN) |
| OUT | GPIO 35 |
| GND | Trilho GND |

| Lado AC | Conexão |
|---|---|
| Terminal 1 | Fase |
| Terminal 2 | Neutro |

> ⚠ **PERIGO** — instalação AC deve ser feita por eletricista qualificado. Para testes didáticos seguros, use uma extensão cortada com os fios expostos em terminais fixos (não toque em partes vivas com o sistema energizado).

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
- [ ] DHT22 e LDR alimentados em 3.3V
- [ ] PIR, ZMPT e relés alimentados em 5V (VIN)
- [ ] Nenhum analógico em ADC2 (só GPIOs 34 e 35)
- [ ] Buzzer via BC547 (não direto no GPIO)
- [ ] Lado AC do ZMPT isolado e protegido
