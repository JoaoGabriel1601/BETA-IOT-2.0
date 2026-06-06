# Sistema IoT para Automação de Datacenters: monitoramento ambiental, comutação energética solar/diesel e detecção de invasão com ESP32 e ThingSpeak

[Nome do Autor 1]¹  
[Nome do Autor 2]²  
[Nome do Autor 3]³  
[Nome do Autor 4]⁴

---

## Resumo

Este artigo apresenta o projeto, a implementação e a validação de um sistema embarcado de Internet das Coisas (IoT) destinado à automação de datacenters de pequeno e médio porte. A solução utiliza o microcontrolador ESP32-WROOM como nó sensor responsável pela aquisição de cinco grandezas físicas — temperatura, umidade relativa do ar, luminosidade, distância/presença e tensão alternada — por meio dos sensores DHT22, LDR e HC-SR04 (ultrassônico), sendo a tensão alternada simulada por um potenciômetro. O firmware, desenvolvido em C/C++ na plataforma Arduino, implementa três rotinas principais: (i) leitura periódica dos sensores, (ii) comutação automática da fonte de energia entre painel solar e gerador diesel em função da luminosidade, e (iii) detecção de invasão com acionamento de buzzer e registro de evento. Os dados são transmitidos via Wi-Fi e protocolo HTTP para um canal do **ThingSpeak**, plataforma de IoT orientada a séries temporais, sendo consumidos por um dashboard web responsivo (HTML, CSS e JavaScript com Chart.js) e por um aplicativo móvel em React Native, ambos por meio de *polling* periódico da API REST. Os testes realizados em ambiente simulado (Wokwi) demonstraram leituras estáveis, atualização das interfaces a cada ciclo de aproximadamente 15 segundos e comutação de fonte de energia em até 3 segundos. Conclui-se que a integração entre hardware de baixo custo, automação local e nuvem viabiliza uma solução acessível para monitoramento contínuo de infraestrutura crítica, com custo estimado inferior a R$ 200,00.

**Palavras-chave:** Internet das Coisas. ESP32. Datacenter. ThingSpeak. Sistemas embarcados.

## Abstract

This paper presents the design, implementation and validation of an embedded Internet of Things (IoT) system aimed at automating small and medium-sized datacenters. The solution uses the ESP32-WROOM microcontroller as a sensor node responsible for acquiring five physical quantities — temperature, relative humidity, luminosity, distance/presence and AC voltage — through DHT22, LDR and an HC-SR04 ultrasonic sensor, with AC voltage simulated by a potentiometer. The firmware, developed in C/C++ on the Arduino platform, implements three main routines: (i) periodic sensor reading, (ii) automatic switching between solar panel and diesel generator according to luminosity, and (iii) intrusion detection with buzzer activation and event logging. Data is transmitted via Wi-Fi and HTTP to a **ThingSpeak** channel, a time-series oriented IoT platform, and consumed by a responsive web dashboard (HTML, CSS and JavaScript with Chart.js) and a React Native mobile application, both through periodic polling of the REST API. Tests performed in a simulated environment (Wokwi) showed stable readings, interface updates every cycle of approximately 15 seconds and energy source switching within 3 seconds. The integration between low-cost hardware, local automation and the cloud enables an accessible solution for continuous monitoring of critical infrastructure, with an estimated cost below R$ 200.00.

**Keywords:** Internet of Things. ESP32. Datacenter. ThingSpeak. Embedded systems.

---

## Introdução

A crescente digitalização dos serviços públicos e privados intensificou a dependência das organizações em relação à disponibilidade contínua de seus datacenters. Falhas de energia, variações fora dos limites ambientais aceitáveis ou tentativas de acesso não autorizado podem comprometer a integridade dos equipamentos e provocar perdas operacionais e financeiras significativas. Nesse contexto, soluções baseadas em Internet das Coisas (IoT) têm se mostrado uma alternativa viável para o monitoramento contínuo e a automação de infraestrutura crítica, especialmente para empresas de pequeno e médio porte que não dispõem de orçamento para sistemas comerciais proprietários.

Este artigo descreve o desenvolvimento de um sistema IoT de baixo custo, denominado **Datacenter IoT**, que integra sensoriamento ambiental, automação energética e detecção de intrusão em uma única plataforma embarcada baseada no microcontrolador ESP32-WROOM. O sistema é capaz de medir cinco grandezas físicas — temperatura, umidade, luminosidade, distância/presença e tensão alternada (AC) —, executar a comutação automática entre fontes de energia solar e diesel conforme a luminosidade do ambiente externo, disparar um alarme sonoro em caso de detecção de presença não autorizada e transmitir todas as informações em tempo real para um banco de dados em nuvem.

O problema central investigado é: **como integrar, em uma única plataforma de baixo custo, o monitoramento ambiental, a comutação automática de fontes de energia e a detecção de invasão de um datacenter, garantindo visualização remota em tempo real?**

O objetivo geral é desenvolver um protótipo funcional que atenda aos três requisitos descritos acima utilizando componentes de hardware acessíveis no mercado brasileiro e ferramentas de software gratuitas. Como objetivos específicos, destacam-se: (i) projetar o esquema eletrônico de aquisição e atuação; (ii) implementar o firmware embarcado responsável pela leitura dos sensores e pela lógica de automação; (iii) configurar o canal de dados em nuvem (ThingSpeak); e (iv) desenvolver interfaces (web e mobile) para visualização das informações.

A metodologia adotada é de natureza aplicada e exploratória, com abordagem quantitativa baseada nas leituras dos sensores. O desenvolvimento foi conduzido em três etapas: prototipação em ambiente de simulação Wokwi, montagem em protoboard e validação funcional. O artigo está estruturado da seguinte forma: a seção seguinte apresenta os fundamentos teóricos e a arquitetura proposta, detalhando o hardware, o firmware e a infraestrutura de nuvem. Em seguida, são discutidos os resultados obtidos nos testes. Por fim, são apresentadas as considerações finais e as oportunidades de evolução do trabalho.

## Arquitetura e desenvolvimento do sistema Datacenter IoT

### Visão geral da arquitetura

O sistema foi concebido sob uma arquitetura de três camadas, comum a soluções IoT modernas (ASHTON, 2009). A camada de **percepção** é composta pelo nó sensor (ESP32 e seus periféricos); a camada de **rede** corresponde à conectividade Wi-Fi e à comunicação HTTP com o canal do ThingSpeak; e a camada de **aplicação** é representada pelo dashboard web e pelo aplicativo móvel. A Figura 1 (referenciada no diagrama de blocos do projeto) ilustra essa organização.

O fluxo de dados é unidirecional do dispositivo para a nuvem, com leituras transmitidas a cada 16 segundos, respeitando o limite de uma mensagem a cada 15 segundos imposto pela conta gratuita do ThingSpeak. As interfaces de aplicação obtêm os dados por *polling* periódico (intervalo de aproximadamente 15 segundos) da API REST do ThingSpeak, uma vez que a plataforma, por ser orientada a séries temporais, não oferece notificação por *push*.

### Plataforma de hardware

O nó embarcado utiliza o **ESP32-WROOM DevKit V1**, um microcontrolador dual-core de 32 bits com Wi-Fi e Bluetooth integrados, ADC de 12 bits e tensão de operação de 3,3 V. A escolha desse componente justifica-se pelo seu baixo custo, ampla comunidade de desenvolvedores e suporte nativo à plataforma Arduino.

Os sensores conectados ao ESP32 foram selecionados de acordo com o conjunto de grandezas monitoradas:

- **DHT22 (AM2302)** — sensor digital de temperatura e umidade conectado ao GPIO 2, capaz de medir temperaturas entre -40 °C e +80 °C com precisão de ±0,5 °C;
- **LDR (Light Dependent Resistor)** — conectado a um divisor de tensão com resistor de 10 kΩ e lido pelo GPIO 34 (ADC1), responsável por inferir o nível de luminosidade externa em escala percentual;
- **HC-SR04 (ultrassônico)** — sensor de distância por ultrassom, com TRIG no GPIO 27 e ECHO no GPIO 14, alcance aproximado de 2 a 400 cm; a distância medida é usada tanto como grandeza monitorada quanto para inferir **presença/invasão** (objeto a ≤ 100 cm);
- **Tensão alternada (simulada)** — lida pelo GPIO 35 (ADC1) a partir de um potenciômetro que emula a variação da tensão da rede; em uma implantação real, esse potenciômetro é substituível por um sensor ZMPT101B com isolamento galvânico.

Os atuadores são representados por dois módulos de relé optoacoplados de 5 V (um para o painel solar e outro para o gerador diesel), um buzzer ativo controlado por um transistor BC547 e um LED de status. A lista completa de materiais, com preços médios praticados em marketplaces brasileiros em 2026, totaliza aproximadamente R$ 157,40, conforme detalhado na documentação do projeto.

### Firmware embarcado

O firmware foi desenvolvido em linguagem C/C++ utilizando o framework Arduino e organizado em três rotinas principais: leitura dos sensores, lógica de automação e comunicação com a nuvem. A medição de distância pelo HC-SR04 (`readDistanceCm()`) merece destaque: o microcontrolador emite um pulso no pino TRIG e mede, com `pulseIn()`, a largura do eco recebido no pino ECHO, convertendo o tempo em distância pela relação:

```
distancia_cm = (tempo_eco_us × 0,0343) / 2
```

A tensão alternada, por sua vez, é **simulada**: a leitura do potenciômetro no GPIO 35 é mapeada linearmente para a faixa de 0 a 250 V (`analogRead / 4095 × 250`), dispensando o cálculo de RMS que seria necessário com um sensor ZMPT101B real.

A comutação automática da fonte de energia é controlada pela função `handleEnergySource()`. Quando o nível de luminosidade supera o limiar de 50%, o sistema considera o ambiente diurno e ativa o relé do painel solar; abaixo desse valor, ativa o relé do gerador diesel. Para evitar curto-circuito entre as fontes, é aplicado um *delay* de segurança entre desligar uma fonte e ligar a outra. Esse comportamento é registrado por meio da variável de estado `lastDayState`, que evita comutações repetidas desnecessárias.

A rotina anti-invasão (`handleMotionAlarm()`) aciona o buzzer e o LED por um período mínimo de 10 segundos sempre que o HC-SR04 detecta um objeto a **≤ 100 cm**. Caso nova detecção ocorra durante o período de alarme, o contador é reiniciado, prolongando o aviso enquanto a presença for mantida.

### Persistência em nuvem com ThingSpeak

A escolha pelo **ThingSpeak**, plataforma de IoT da MathWorks, foi motivada pela sua simplicidade de integração via REST sobre HTTP simples — o que dispensa a sobrecarga de TLS no microcontrolador e confere excelente sinergia com o simulador Wokwi —, pelo armazenamento nativo de séries temporais e pelas ferramentas de visualização integradas ao canal. Diferentemente de um banco hierárquico, o ThingSpeak organiza os dados em um **canal com oito campos numéricos** (`field1` a `field8`) acrescidos de um campo textual de **status**. O ESP32 transmite, em uma única requisição `GET /update` por ciclo, o seguinte mapeamento:

1. `field1`..`field4` — grandezas analógicas (temperatura, umidade, luminosidade e tensão AC simulada);
2. `field5`..`field7` — estados discretos (presença/movimento, fonte de energia e alarme);
3. `field8` — distância medida pelo HC-SR04, em centímetros;
4. `status` — descrição textual do evento de invasão, preenchido apenas quando o alarme é disparado.

Conforme afirma Schwab (2016, p. 21), “a fusão entre as tecnologias e a sua interação entre os domínios físico, digital e biológico” constitui o cerne da quarta revolução industrial, da qual a IoT é peça central. A escolha por uma plataforma orientada a IoT como o ThingSpeak reduz drasticamente o esforço de desenvolvimento, eliminando a necessidade de provisionar e manter um servidor próprio para o tráfego típico de aplicações IoT educacionais e de pequeno porte.

### Dashboard web e aplicativo móvel

A camada de aplicação foi implementada em duas frentes. O **dashboard web** utiliza HTML5, CSS3 e JavaScript puro, sem dependência de frameworks reativos, priorizando o desempenho e a portabilidade. A biblioteca **Chart.js** renderiza cinco gráficos de linha (temperatura, umidade, luminosidade, tensão AC e distância), reconstruídos a cada ciclo de *polling* a partir das últimas leituras retornadas pela API REST do ThingSpeak. Cartões de indicadores apresentam os valores instantâneos das grandezas, com mudança de cor sempre que os limites configurados são ultrapassados. O **aplicativo móvel**, desenvolvido em React Native com Expo, replica essas funcionalidades e emite notificações locais quando uma invasão é detectada.

Os eventos de invasão são reconstruídos a partir do campo `status` do feed — preenchido pelo firmware apenas quando há ocorrência —, sendo listados em uma área dedicada. Como o ThingSpeak é uma plataforma *append-only*, o reconhecimento (*acknowledge*) de cada evento é persistido localmente no cliente (via `localStorage` no dashboard e `AsyncStorage` no aplicativo). No contexto educacional deste projeto, o canal foi configurado como **público**, de modo que as interfaces realizam a leitura sem necessidade de chave de API, dispensando uma camada de autenticação por usuário.

### Validação e resultados

A validação do sistema foi conduzida em ambiente de simulação **Wokwi**, no qual a distância/presença é obtida por um sensor HC-SR04 e a tensão alternada é emulada por um potenciômetro, permitindo a verificação completa da lógica de firmware sem a necessidade de montagem física e de exposição à rede elétrica. O ESP32 simulado conectou-se à rede `Wokwi-GUEST` e transmitiu as leituras para um canal real do ThingSpeak, podendo ser executado tanto no navegador quanto localmente por meio da Wokwi CLI.

Observou-se:

- Atualização das interfaces (dashboard e app) a cada ciclo de *polling*, de aproximadamente **15 segundos**, coerente com o intervalo de transmissão de 16 segundos do firmware e com o limite da conta gratuita do ThingSpeak;
- Tempo de comutação entre fontes de energia em conformidade com o *delay* de segurança configurado;
- Leituras de temperatura e umidade estáveis, com variação inferior a 0,5 °C e 2% UR, respectivamente;
- Detecção confiável de presença quando um objeto se encontra a **≤ 100 cm** do HC-SR04, com a distância registrada em centímetros no `field8`;
- Reconexão automática à rede Wi-Fi em caso de queda momentânea.

## Considerações Finais

Este artigo apresentou o desenvolvimento de um sistema embarcado de IoT voltado à automação de datacenters de pequeno e médio porte. A solução integrou cinco sensores ao microcontrolador ESP32-WROOM, implementou rotinas de automação local para comutação da fonte de energia e detecção de invasão, e disponibilizou as informações por meio de uma plataforma em nuvem (ThingSpeak), um dashboard web e um aplicativo móvel.

Os objetivos propostos na introdução foram integralmente atendidos: o esquema eletrônico foi projetado e documentado; o firmware foi implementado e validado em ambiente de simulação (Wokwi); o canal de dados em nuvem foi configurado; e as interfaces web e mobile foram desenvolvidas e testadas. Os resultados obtidos demonstram que o sistema apresenta latência adequada para o cenário de monitoramento contínuo e que o custo total de implementação, inferior a R$ 200,00, viabiliza a adoção da solução por organizações com restrições orçamentárias.

Como limitações do trabalho atual, destaca-se que os relés implementados apenas simulam a lógica de comutação entre fontes de energia. Em uma implantação real em datacenter, recomenda-se a utilização de um *Automatic Transfer Switch* (ATS) industrial certificado, ficando o ESP32 responsável exclusivamente pela sinalização e supervisão. Adicionalmente, a medição de tensão é simulada por um potenciômetro; caso se opte por uma medição real com um sensor ZMPT101B, sua instalação em circuitos da rede elétrica deve ser realizada por profissional qualificado, dado o risco envolvido.

Como oportunidades de evolução, sugerem-se: (i) a migração da camada de nuvem para uma instância dedicada com suporte a *time-series* (como o InfluxDB) ou para o plano pago do ThingSpeak, ampliando a frequência de envio e o volume de dados históricos; (ii) a implementação de notificações *push* remotas (por exemplo, via *webhooks*/React do ThingSpeak integrados a um serviço de mensageria) para alertas em smartphones, complementando as notificações locais já presentes no aplicativo; (iii) a reativação de uma camada de autenticação para o dashboard e o app, restringindo o acesso a usuários cadastrados; e (iv) a incorporação de algoritmos de aprendizado de máquina para detecção de anomalias nas séries temporais coletadas.

Conclui-se que a combinação entre hardware acessível, firmware otimizado e serviços em nuvem proporciona uma plataforma escalável e replicável para o monitoramento de infraestrutura crítica, contribuindo para a democratização do acesso a soluções de Internet das Coisas no contexto da Indústria 4.0.

## Referências

ASHTON, Kevin. **That 'Internet of Things' Thing**. In: RFID Journal. 22 de junho de 2009. Disponível em: https://www.rfidjournal.com/that-internet-of-things-thing. Acesso em 22 mai. 2026.

ESPRESSIF SYSTEMS. **ESP32 Series Datasheet**. Versão 4.1. Shanghai: Espressif Systems, 2023. Disponível em: https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf. Acesso em 22 mai. 2026.

THE MATHWORKS, INC. **ThingSpeak Documentation — Channels and Charts API**. In.: ThingSpeak Docs. Disponível em: https://www.mathworks.com/help/thingspeak/. Acesso em 22 mai. 2026.

MAGRANI, Eduardo. **A internet das coisas**. Rio de Janeiro: FGV Editora, 2018.

McEWEN, Adrian; CASSIMALLY, Hakim. **Designing the Internet of Things**. Chichester: John Wiley & Sons, 2014.

MONK, Simon. **Programming Arduino: getting started with sketches**. 2.ed. New York: McGraw-Hill Education, 2016.

SCHWAB, Klaus. **A quarta revolução industrial**. São Paulo: Edipro, 2016.

SOSINSKY, Barrie. **Cloud Computing Bible**. Indianapolis: Wiley Publishing, 2011.

---

¹ Graduando em Engenharia da Computação pela UniFECAF. E-mail: xxxxxxx@a.fecaf.com.br  
² Breve currículo do autor: colocar a graduação em que está e o e-mail institucional.  
³ Breve currículo do autor: colocar a graduação em que está e o e-mail institucional.  
⁴ Breve currículo do autor: colocar a graduação em que está e o e-mail institucional.
