# Cenários de teste de carga com k6 (MP-PERF-2)

> English version: [docs/en/performance/k6-scenarios.md](../../en/performance/k6-scenarios.md)

Mini-projeto: [`projects/performance/k6-scenarios`](../../../projects/performance/k6-scenarios/README.pt-BR.md). Tópicos do quiz: `load-test-types`, `k6-fundamentals`, `database-performance`, `capacity-planning-queueing`, `latency-throughput-percentiles`.

## O gargalo

`GET /products/:id` pega emprestada uma conexão de um pool, roda uma consulta que leva 20 ms no PostgreSQL, e devolve a conexão. O pool tem **2 conexões**.

```
requisição -> [ fila por uma conexão ] -> [ conexão 1 ] -> PostgreSQL (20 ms)
                                          [ conexão 2 ] -> PostgreSQL (20 ms)
```

Pela lei da utilização, 2 conexões que ficam ocupadas por 20 ms a cada requisição atendem no máximo 2 / 0,020 s = **100 requisições por segundo**. Abaixo disso, quase sempre há uma conexão livre. Acima disso, as requisições chegam mais rápido do que saem e a fila cresce enquanto a carga durar. A API espera no máximo 2 s por uma conexão e então responde `503` (load shedding), para que a fila não cresça sem limite.

Nada em um painel com os suspeitos de sempre aponta para isso. A CPU da API está ociosa (ela está esperando), o banco está ocioso (2 consultas por vez não é nada), e cada consulta continua levando 20 ms. Só a latência vista pelo cliente conta a história, e é por isso que é preciso um teste de carga para achá-lo.

A correção é um número: `POOL_SIZE=20`, uma capacidade de 1.000 requisições por segundo.

## Quatro formas, quatro perguntas

Os quatro cenários enviam a mesma requisição. Só muda a forma da taxa de chegada ao longo do tempo (`k6/profiles.js`).

| Cenário | Forma | A pergunta | O que o pool pequeno mostra |
| --- | --- | --- | --- |
| Carga (load) | sobe até o tráfego movimentado normal (150 req/s) e mantém | O nível de serviço é cumprido na carga esperada? | Não: a fase estável fica acima da capacidade, o p95 bate no limite de espera de 2 s |
| Estresse (stress) | degraus de 50 a 300 req/s | Onde está o limite, e o que acontece ali? | Latência plana a 50 req/s, espera a 100, colapso de 150 em diante: o joelho |
| Pico (spike) | 40, depois 500 req/s por 6 s, depois 40 de novo | Sobrevive a uma rajada e se recupera? | A rajada é descartada com `503`, e os primeiros segundos da recuperação ainda são lentos |
| Resistência (soak) | 130 req/s, constante | O que degrada com o tempo? | Os primeiros segundos parecem aceitáveis na mediana, depois a fila chega ao limite e fica lá |

Um teste de resistência real roda por horas e procura crescimento lento: um vazamento de memória, uma conexão que nunca é devolvida, um disco enchendo. Este foi reduzido a um minuto, e o que ele guarda da ideia é a comparação entre os primeiros e os últimos segundos da mesma carga constante.

## Modelo aberto contra modelo fechado

Os cenários usam o executor `ramping-arrival-rate`. O k6 inicia um número fixo de iterações por segundo, tenham as anteriores terminado ou não. Isso é um **modelo aberto**, e é assim que o tráfego real se comporta: as pessoas não param de chegar porque o site está lento.

Um **modelo fechado** (`ramping-vus`, `constant-vus`) tem um número fixo de usuários virtuais, cada um esperando a sua resposta antes de enviar de novo. Quando o servidor fica lento, os usuários enviam menos, a carga cai, e o teste informa uma vazão confortável com uma latência péssima. O gargalo ainda aparece ali, mas o teste nunca passa da capacidade, então não há joelho para ver. Omissão coordenada é o nome do erro de medição que isso causa.

O preço do modelo aberto: toda requisição em andamento segura um usuário virtual, então `maxVUs` precisa cobrir taxa × pior latência. Quando o k6 fica sem usuários virtuais ele não envia a requisição e a conta em `dropped_iterations`, que os resumos informam.

## Thresholds, checks e o código de saída

```js
thresholds: {
	http_req_duration: ["p(95)<250"],
	http_req_failed: ["rate<0.01"],
	"http_req_duration{phase:recovery}": ["p(95)<250"],
}
```

- Um **threshold** é uma regra de aprovação sobre uma métrica. Quando um é ultrapassado, o k6 termina com código 99, e é isso que torna um teste de carga utilizável em um pipeline.
- Um **check** (`check(response, { "status is 200": ... })`) só registra uma taxa de acerto. Um check que falha nunca reprova a execução sozinho.
- Uma **tag** (`{ tags: { phase } }`) divide uma métrica. Cada fase de cada cenário tem o seu próprio p95, e o seu próprio threshold.

## Resultados medidos

Os resumos versionados estão em `results/` (em inglês): [load](../../../projects/performance/k6-scenarios/results/load.md), [stress](../../../projects/performance/k6-scenarios/results/stress.md), [spike](../../../projects/performance/k6-scenarios/results/spike.md), [soak](../../../projects/performance/k6-scenarios/results/soak.md), com a máquina e as versões em [results.md](../../../projects/performance/k6-scenarios/results/results.md).

O teste de estresse da execução versionada, antes da correção:

| Degrau | Requisições respondidas | Mediana | p95 |
| --- | --- | --- | --- |
| 50 req/s | 299 | 21 ms | 24 ms |
| 100 req/s | 575 | 127 ms | 224 ms |
| 150 req/s | 873 | 1736 ms | 2019 ms |
| 200 req/s | 1090 | 2014 ms | 2021 ms |
| 250 req/s | 1376 | 2001 ms | 2020 ms |
| 300 req/s | 1673 | 2001 ms | 2020 ms |

Como ler:

- A 50 req/s o pool está usado pela metade e a latência é o tempo da consulta.
- A 100 req/s a taxa de chegada é igual à capacidade. A mediana já é seis vezes o tempo da consulta, porque as chegadas não são perfeitamente regulares e duas requisições que chegam juntas precisam esperar. O degrau é curto, então o p95 ainda fica dentro do orçamento.
- De 150 req/s em diante a latência fica no limite de espera de 2 s: esse é o joelho. A latência só não cresce mais porque a API desiste em 2 s e responde `503`. Na execução inteira 43% das requisições falharam.
- Depois da correção todo degrau tem p95 de cerca de 21 ms. Os mesmos seis degraus agora são no máximo 30% da capacidade do pool.

Em todos os cenários o veredito se inverte: os quatro ultrapassam os seus thresholds com o pool de 2 (código de saída 99 do k6) e não ultrapassam nenhum com o pool de 20 (código de saída 0).

## Por que não deixar o pool enorme

Um pool é um limite de propósito. Cada conexão do PostgreSQL é um processo no servidor com a sua própria memória, e o banco tem um limite `max_connections` dividido por todas as instâncias da aplicação. Um pool de 20 em 10 instâncias já pede 200 conexões. O tamanho certo sai da aritmética acima (taxa de chegada × tempo de posse, dividido pela utilização que você aceita), e reduzir o tempo que cada requisição segura uma conexão aumenta a capacidade tanto quanto adicionar conexões.

## Método e limites

- Cada cenário rodou uma vez antes e uma vez depois da correção, em uma máquina compartilhada com outros programas. As latências têm ruído. Os vereditos não: todo cenário pede mais que a capacidade do pool pequeno e no máximo 60% da capacidade do grande (`ts/tests/unit/profiles.test.ts` confere essa aritmética).
- Um processo novo da API é iniciado para cada cenário, então nenhuma fila é herdada.
- O k6 roda na mesma máquina que a API, o que serve para uma comparação de antes e depois e não serve para números absolutos de capacidade.

## Regras do teste de carga

O k6 roda da imagem fixada `grafana/k6:2.3.0` na rede interna do docker-compose. Nenhuma porta é publicada, e `k6/target.js` lança um erro antes de qualquer requisição quando `BASE_URL` não é `localhost`, `127.0.0.1`, `[::1]` ou `api`. `docker compose run --rm k6-refusal-test` prova isso para os quatro cenários com `https://example.com`. A saída bruta do k6 vai para `k6-results/`, que o git ignora. Só os resumos em Markdown são versionados.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-PERF-2.1 o gargalo aparece como um joelho de latência no teste de carga | `./load-test-unix.sh` (ou `.ps1`): a etapa de relatório falha a menos que o cenário de estresse tenha um joelho antes da correção e nenhum depois. A curva está em `results/stress.md`. Em miniatura, sem k6: `ts/tests/integration/pool.test.ts` |
| MP-PERF-2.2 cada cenário falha no seu threshold antes da correção e passa depois | Mesmo comando: a etapa de relatório falha a menos que cada um dos quatro cenários tenha ultrapassado um threshold com o pool pequeno e nenhum com o grande |
| MP-PERF-2.3 resumo em Markdown por cenário versionado, saída bruta ignorada pelo git | `results/load.md`, `stress.md`, `spike.md`, `soak.md`, e `k6-results/` no `.gitignore` |

O plano diz "joelho de latência no teste de carga". O joelho é mostrado pelo cenário de estresse, cujos degraus são a curva de latência. O cenário de carga mantém uma taxa só, então mostra um ponto acima do joelho, não a curva.

## Como rodar

```sh
cd projects/performance/k6-scenarios
./setup-unix-k6-scenarios.sh     # testes
./load-test-unix.sh              # os quatro cenários, antes e depois, e os relatórios
```
