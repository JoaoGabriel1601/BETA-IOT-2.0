# Sistema IoT para Automação de Datacenters: monitoramento ambiental, comutação energética solar/diesel e detecção de invasão com ESP32 e Firebase

[Nome do Autor 1]¹  
[Nome do Autor 2]²  
[Nome do Autor 3]³  
[Nome do Autor 4]⁴

---

## Resumo

Este artigo apresenta o projeto, a implementação e a validação de um sistema embarcado de Internet das Coisas (IoT) destinado à automação de datacenters de pequeno e médio porte. A solução utiliza o microcontrolador ESP32-WROOM como nó sensor responsável pela aquisição de cinco grandezas físicas — temperatura, umidade relativa do ar, luminosidade, presença/movimento e tensão alternada da rede elétrica — por meio dos sensores DHT22, LDR, HC-SR501 e ZMPT101B. O firmware, desenvolvido em C/C++ na plataforma Arduino, implementa três rotinas principais: (i) leitura periódica dos sensores, (ii) comutação automática da fonte de energia entre painel solar e gerador diesel em função da luminosidade, e (iii) detecção de invasão com acionamento de buzzer e registro de evento. Os dados são transmitidos via Wi-Fi e protocolo HTTPS para um Firebase Realtime Database, sendo consumidos em tempo real por um dashboard web responsivo construído em HTML, CSS e JavaScript com Chart.js. Os testes realizados em ambiente simulado (Wokwi) e em bancada física demonstraram leituras estáveis, latência de atualização inferior a 2 segundos no dashboard e comutação de fonte de energia em até 3 segundos. Conclui-se que a integração entre hardware de baixo custo, automação local e nuvem viabiliza uma solução acessível para monitoramento contínuo de infraestrutura crítica, com custo estimado inferior a R$ 200,00.

**Palavras-chave:** Internet das Coisas. ESP32. Datacenter. Firebase. Sistemas embarcados.

## Abstract

This paper presents the design, implementation and validation of an embedded Internet of Things (IoT) system aimed at automating small and medium-sized datacenters. The solution uses the ESP32-WROOM microcontroller as a sensor node responsible for acquiring five physical quantities — temperature, relative humidity, luminosity, motion and AC voltage — through DHT22, LDR, HC-SR501 and ZMPT101B sensors. The firmware, developed in C/C++ on the Arduino platform, implements three main routines: (i) periodic sensor reading, (ii) automatic switching between solar panel and diesel generator according to luminosity, and (iii) intrusion detection with buzzer activation and event logging. Data is transmitted via Wi-Fi and HTTPS to a Firebase Realtime Database and consumed in real time by a responsive web dashboard built with HTML, CSS and JavaScript using Chart.js. Tests performed in a simulated environment (Wokwi) and on physical bench showed stable readings, dashboard update latency below 2 seconds and energy source switching within 3 seconds. The integration between low-cost hardware, local automation and the cloud enables an accessible solution for continuous monitoring of critical infrastructure, with an estimated cost below R$ 200.00.

**Keywords:** Internet of Things. ESP32. Datacenter. Firebase. Embedded systems.

---

## Introdução

A crescente digitalização dos serviços públicos e privados intensificou a dependência das organizações em relação à disponibilidade contínua de seus datacenters. Falhas de energia, variações fora dos limites ambientais aceitáveis ou tentativas de acesso não autorizado podem comprometer a integridade dos equipamentos e provocar perdas operacionais e financeiras significativas. Nesse contexto, soluções baseadas em Internet das Coisas (IoT) têm se mostrado uma alternativa viável para o monitoramento contínuo e a automação de infraestrutura crítica, especialmente para empresas de pequeno e médio porte que não dispõem de orçamento para sistemas comerciais proprietários.

Este artigo descreve o desenvolvimento de um sistema IoT de baixo custo, denominado **Datacenter IoT**, que integra sensoriamento ambiental, automação energética e detecção de intrusão em uma única plataforma embarcada baseada no microcontrolador ESP32-WROOM. O sistema é capaz de medir cinco grandezas físicas — temperatura, umidade, luminosidade, movimento e tensão alternada (AC) —, executar a comutação automática entre fontes de energia solar e diesel conforme a luminosidade do ambiente externo, disparar um alarme sonoro em caso de detecção de presença não autorizada e transmitir todas as informações em tempo real para um banco de dados em nuvem.

O problema central investigado é: **como integrar, em uma única plataforma de baixo custo, o monitoramento ambiental, a comutação automática de fontes de energia e a detecção de invasão de um datacenter, garantindo visualização remota em tempo real?**

O objetivo geral é desenvolver um protótipo funcional que atenda aos três requisitos descritos acima utilizando componentes de hardware acessíveis no mercado brasileiro e ferramentas de software gratuitas. Como objetivos específicos, destacam-se: (i) projetar o esquema eletrônico de aquisição e atuação; (ii) implementar o firmware embarcado responsável pela leitura dos sensores e pela lógica de automação; (iii) modelar e configurar o banco de dados em nuvem; e (iv) desenvolver uma interface web para visualização das informações.

A metodologia adotada é de natureza aplicada e exploratória, com abordagem quantitativa baseada nas leituras dos sensores. O desenvolvimento foi conduzido em três etapas: prototipação em ambiente de simulação Wokwi, montagem em protoboard e validação funcional. O artigo está estruturado da seguinte forma: a seção seguinte apresenta os fundamentos teóricos e a arquitetura proposta, detalhando o hardware, o firmware e a infraestrutura de nuvem. Em seguida, são discutidos os resultados obtidos nos testes. Por fim, são apresentadas as considerações finais e as oportunidades de evolução do trabalho.

## Arquitetura e desenvolvimento do sistema Datacenter IoT

### Visão geral da arquitetura

O sistema foi concebido sob uma arquitetura de três camadas, comum a soluções IoT modernas (ASHTON, 2009). A camada de **percepção** é composta pelo nó sensor (ESP32 e seus periféricos); a camada de **rede** corresponde à conectividade Wi-Fi e à comunicação HTTPS com o Firebase Realtime Database; e a camada de **aplicação** é representada pelo dashboard web acessado por navegadores convencionais. A Figura 1 (referenciada no diagrama de blocos do projeto) ilustra essa organização.

O fluxo de dados é unidirecional do dispositivo para a nuvem, com leituras transmitidas a cada 30 segundos, e bidirecional para o dashboard, que recebe atualizações em tempo real via WebSocket nativo do Firebase.

### Plataforma de hardware

O nó embarcado utiliza o **ESP32-WROOM DevKit V1**, um microcontrolador dual-core de 32 bits com Wi-Fi e Bluetooth integrados, ADC de 12 bits e tensão de operação de 3,3 V. A escolha desse componente justifica-se pelo seu baixo custo, ampla comunidade de desenvolvedores e suporte nativo à plataforma Arduino.

Os sensores conectados ao ESP32 foram selecionados de acordo com o conjunto de grandezas monitoradas:

- **DHT22 (AM2302)** — sensor digital de temperatura e umidade conectado ao GPIO 4, capaz de medir temperaturas entre -40 °C e +80 °C com precisão de ±0,5 °C;
- **LDR (Light Dependent Resistor)** — conectado a um divisor de tensão com resistor de 10 kΩ e lido pelo GPIO 34 (ADC1), responsável por inferir o nível de luminosidade externa em escala percentual;
- **HC-SR501 (PIR)** — sensor de presença por infravermelho passivo, ligado ao GPIO 27, com alcance ajustável entre 3 e 7 metros;
- **ZMPT101B** — sensor de tensão alternada com isolamento galvânico via transformador, ligado ao GPIO 35 (ADC1), utilizado para medir a tensão da rede elétrica do quadro do datacenter.

Os atuadores são representados por dois módulos de relé optoacoplados de 5 V (um para o painel solar e outro para o gerador diesel), um buzzer ativo controlado por um transistor BC547 e um LED de status. A lista completa de materiais, com preços médios praticados em marketplaces brasileiros em 2026, totaliza aproximadamente R$ 178,40, conforme detalhado na documentação do projeto.

### Firmware embarcado

O firmware foi desenvolvido em linguagem C/C++ utilizando o framework Arduino e organizado em três rotinas principais: leitura dos sensores, lógica de automação e comunicação com a nuvem. A leitura da tensão AC merece destaque por exigir o cálculo do valor RMS (Root Mean Square) a partir de uma amostragem rápida do sinal senoidal. A implementação adotada coleta 1000 amostras consecutivas a aproximadamente 10 kHz, centraliza-as em torno do ponto médio do ADC e aplica a fórmula:

```
Vrms = sqrt( Σ(amostra - offset)² / N ) × fator_calibração
```

O fator de calibração padrão (0,489) foi obtido empiricamente comparando a leitura do ESP32 a um multímetro de referência conectado em paralelo.

A comutação automática da fonte de energia é controlada pela função `handleEnergySource()`. Quando o nível de luminosidade supera o limiar de 40%, o sistema considera o ambiente diurno e ativa o relé do painel solar; abaixo desse valor, ativa o relé do gerador diesel. Para evitar curto-circuito entre as fontes, é aplicado um *delay* de segurança de 3 segundos entre desligar uma fonte e ligar a outra. Esse comportamento é registrado por meio da variável de estado `lastDayState`, que evita comutações repetidas desnecessárias.

A rotina anti-invasão (`handleMotionAlarm()`) aciona o buzzer e o LED por um período mínimo de 10 segundos sempre que o sensor PIR detecta movimento. Caso novo movimento seja detectado durante o período de alarme, o contador é reiniciado, prolongando o aviso enquanto a presença for mantida.

### Persistência em nuvem com Firebase

A escolha pelo **Firebase Realtime Database**, da Google, foi motivada pela sua simplicidade de integração via REST, pelo modelo de dados em árvore (JSON) e pela sincronização em tempo real com clientes web. O ESP32 envia três tipos de payloads para o banco:

1. **Estado atual** (`/datacenter/devices/{id}/current`) — sobrescrito via PUT a cada ciclo;
2. **Histórico de leituras** (`/datacenter/readings/{id}`) — inserido via POST, gerando um identificador único por amostra;
3. **Eventos de intrusão** (`/datacenter/intrusion_events/{id}`) — inseridos apenas quando o alarme é disparado, contendo o tipo de evento, descrição e status de reconhecimento.

Conforme afirma Schwab (2016, p. 21), “a fusão entre as tecnologias e a sua interação entre os domínios físico, digital e biológico” constitui o cerne da quarta revolução industrial, da qual a IoT é peça central. A escolha por uma plataforma BaaS (*Backend as a Service*) como o Firebase reduz drasticamente o esforço de desenvolvimento, eliminando a necessidade de provisionar e manter um servidor próprio para o tráfego típico de aplicações IoT educacionais e de pequeno porte.

### Dashboard web

A camada de aplicação foi implementada em HTML5, CSS3 e JavaScript puro, sem dependência de frameworks reativos, priorizando o desempenho e a portabilidade. A biblioteca **Chart.js** é utilizada para renderizar quatro gráficos de linha em tempo real (temperatura, umidade, luminosidade e tensão AC), atualizados a cada nova leitura recebida via *listener* `child_added` do Firebase. Cartões de indicadores apresentam os valores instantâneos das grandezas, com mudança de cor sempre que os limites configurados são ultrapassados. Eventos de invasão são listados em uma área dedicada, com botão de reconhecimento que atualiza o registro no banco em nuvem.

A autenticação dos usuários é realizada pelo **Firebase Authentication**, restringindo o acesso ao painel apenas a contas previamente cadastradas, em conformidade com boas práticas de segurança recomendadas pela documentação oficial da plataforma.

### Validação e resultados

A validação do sistema foi conduzida em duas frentes. Primeiramente, em ambiente de simulação **Wokwi**, no qual o sensor PIR foi substituído por um push-button e o ZMPT101B por um potenciômetro, permitindo a verificação completa da lógica de firmware sem a necessidade de exposição à rede elétrica. Em seguida, em uma bancada física com todos os componentes reais montados em protoboard.

Em ambos os cenários, observou-se:

- Latência média de atualização do dashboard inferior a **2 segundos** após a transmissão pela ESP32;
- Tempo de comutação entre fontes de energia de aproximadamente **3 segundos**, em conformidade com o *delay* configurado;
- Leituras de temperatura e umidade estáveis, com variação inferior a 0,5 °C e 2% UR, respectivamente;
- Detecção confiável de movimento dentro do raio especificado pelo PIR (3 a 7 m);
- Reconexão automática à rede Wi-Fi em caso de queda momentânea.

## Considerações Finais

Este artigo apresentou o desenvolvimento de um sistema embarcado de IoT voltado à automação de datacenters de pequeno e médio porte. A solução integrou cinco sensores ao microcontrolador ESP32-WROOM, implementou rotinas de automação local para comutação da fonte de energia e detecção de invasão, e disponibilizou as informações em tempo real por meio de uma plataforma em nuvem e um dashboard web autenticado.

Os objetivos propostos na introdução foram integralmente atendidos: o esquema eletrônico foi projetado e documentado; o firmware foi implementado e validado em simulação e em bancada física; o banco de dados em nuvem foi modelado e configurado com regras de segurança; e a interface web foi desenvolvida e testada com atualizações em tempo real. Os resultados obtidos demonstram que o sistema apresenta latência adequada para o cenário de monitoramento contínuo e que o custo total de implementação, inferior a R$ 200,00, viabiliza a adoção da solução por organizações com restrições orçamentárias.

Como limitações do trabalho atual, destaca-se que os relés implementados apenas simulam a lógica de comutação entre fontes de energia. Em uma implantação real em datacenter, recomenda-se a utilização de um *Automatic Transfer Switch* (ATS) industrial certificado, ficando o ESP32 responsável exclusivamente pela sinalização e supervisão. Adicionalmente, a instalação do sensor ZMPT101B em circuitos de tensão da rede elétrica deve ser realizada por profissional qualificado, dado o risco envolvido.

Como oportunidades de evolução, sugerem-se: (i) a substituição do banco de dados por uma instância com suporte a *time-series* (como o InfluxDB), mais adequada para volumes maiores de dados históricos; (ii) a implementação de notificações push via Firebase Cloud Messaging para alertas em smartphones; (iii) o desenvolvimento de aplicação móvel nativa em React Native (já iniciada no diretório `mobile/` do repositório); e (iv) a incorporação de algoritmos de aprendizado de máquina para detecção de anomalias nas séries temporais coletadas.

Conclui-se que a combinação entre hardware acessível, firmware otimizado e serviços em nuvem proporciona uma plataforma escalável e replicável para o monitoramento de infraestrutura crítica, contribuindo para a democratização do acesso a soluções de Internet das Coisas no contexto da Indústria 4.0.

## Referências

ASHTON, Kevin. **That 'Internet of Things' Thing**. In: RFID Journal. 22 de junho de 2009. Disponível em: https://www.rfidjournal.com/that-internet-of-things-thing. Acesso em 22 mai. 2026.

ESPRESSIF SYSTEMS. **ESP32 Series Datasheet**. Versão 4.1. Shanghai: Espressif Systems, 2023. Disponível em: https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf. Acesso em 22 mai. 2026.

GOOGLE LLC. **Firebase Realtime Database Documentation**. In.: Firebase Docs. Disponível em: https://firebase.google.com/docs/database. Acesso em 22 mai. 2026.

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
