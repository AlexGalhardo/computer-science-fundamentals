# pubsub-backpressure

> English version: [README.md](README.md)

Duas perguntas que todo desenho de mensageria precisa responder. **Quem recebe uma mensagem?** Um entre vários workers (fila de trabalho, consumidores concorrentes) ou todo assinante (publish/subscribe, fan-out). **O que acontece quando o produtor é mais rápido que o consumidor?** Ou um buffer cresce até a memória acabar, ou o consumidor empurra de volta e o produtor desacelera: backpressure. Este mini-projeto responde às duas com experimentos no RabbitMQ, com um produtor e um consumidor dentro de um processo, e com um pipeline GenStage em Elixir.

Código: MP-MSG-3. Explicação completa: [docs/pt/messaging/pubsub-backpressure.md](../../../docs/pt/messaging/pubsub-backpressure.md).

```
fila de trabalho:  produtor -> [tasks] -> worker A | worker B | worker C     cada mensagem uma vez
fan-out:           produtor -> (exchange fanout) -> [q.A] -> assinante A
                                                 -> [q.B] -> assinante B     uma cópia para cada

sem backpressure:  produtor ==push==> [ buffer cresce ... ] --> consumidor lento
com backpressure:  produtor <--demanda / fila cheia--  [ limitado ] --> consumidor lento
```

## Duas linguagens

| Pasta | O que mostra | Precisa de |
| --- | --- | --- |
| `ts/` | Fila de trabalho contra fan-out no RabbitMQ; prefetch como backpressure entre broker e consumidor; uma fila limitada contra uma ilimitada em um processo, com a memória medida | RabbitMQ no docker-compose (o experimento de memória não precisa de nada) |
| `elixir/` | Um pipeline GenStage: o consumidor pede eventos e o produtor envia só o que foi pedido, contra `send/2` puro para uma caixa de mensagens | Nada na execução (o GenStage é baixado quando a imagem é construída) |

## Resultados

TypeScript, gerados por `docker compose run --rm demo`, versionados em [results/results.md](results/results.md).

### Fila de trabalho contra fan-out

| Topologia | Filas | Consumidores | Mensagens publicadas | Recebidas por cada consumidor | Total de entregas |
| --- | --- | --- | --- | --- | --- |
| Fila de trabalho: uma fila, consumidores concorrentes | 1 | 3 | 300 | 102, 100, 98 | 300 |
| Fan-out: uma fila por assinante | 3 | 3 | 300 | 300, 300, 300 | 900 |
| Fan-out para 2 serviços, 3 instâncias cada | 2 | 6 | 300 | 97, 99, 104, 102, 102, 96 | 600 |

O número de **filas** decide o número de cópias, não o número de consumidores. A terceira linha é o formato usual de produção: difusão entre serviços, competição dentro de cada serviço.

### Onde o acúmulo mora: prefetch do RabbitMQ

Uma fila começa com 3.000 mensagens e um consumidor que leva 2 ms por mensagem, observado por 600 ms.

| Prefetch | Máximo de mensagens seguradas pelo consumidor | Restantes no broker | Processadas |
| --- | --- | --- | --- |
| sem limite | 2908 | 0 | 230 |
| 10 | 10 | 2758 | 232 |

Os dois consumidores processaram a mesma quantidade. Sem limite o broker empurrou o acúmulo inteiro para o processo consumidor: a fila parece vazia, a memória do consumidor segura tudo, e um segundo consumidor não receberia nada. Com `prefetch(10)` o acúmulo fica no broker, que foi feito para guardá-lo.

### Produtor mais rápido que o consumidor, em um processo

O produtor tenta enviar 20 mensagens de 4 KiB por milissegundo; o consumidor trata uma por milissegundo. A única diferença entre as execuções é a capacidade da fila entre eles.

| Buffer | Produzidas | Consumidas | Pico de mensagens esperando | Crescimento da memória do processo (RSS) |
| --- | --- | --- | --- | --- |
| fila ilimitada | 25920 | 1297 | 24623 | 103,3 MiB |
| fila limitada, capacidade 100 | 1388 | 1288 | 100 | -6,7 MiB |

| Tempo | fila ilimitada | fila limitada, capacidade 100 |
| --- | --- | --- |
| 5 ms | 0 (0,0 MiB) | 0 (0,0 MiB) |
| 432 ms | 4882 (19,1 MiB) | 100 (0,4 MiB) |
| 872 ms | 8644 (33,8 MiB) | 100 (0,4 MiB) |
| 1292 ms | 13983 (54,6 MiB) | 100 (0,4 MiB) |
| 1709 ms | 20101 (78,5 MiB) | 100 (0,4 MiB) |

O buffer ilimitado cresce em linha reta enquanto a execução dura: cerca de 45 MiB por segundo aqui, sem teto além da memória da máquina. O limitado fica parado na sua capacidade, e o produtor, obrigado a esperar pelo `await queue.push()`, produziu exatamente na velocidade em que o consumidor consumiu. A execução dura 2 segundos: "sem limite" é mostrado como um crescimento que nunca desacelera, não esgotando a memória da máquina.

### GenStage (Elixir)

Impresso por `docker compose run --rm elixir-demo`. O consumidor leva 1 ms por evento.

```
pipeline                            events   peak buffer
push, no backpressure                 1000           999
push, no backpressure                10000          9997
push, no backpressure               100000         99983
GenStage, max_demand 10               1000            10
GenStage, max_demand 10               3000            10
GenStage, max_demand 100              3000           100
```

Com `send/2` o buffer é a caixa de mensagens do consumidor e acompanha o número de eventos. Com GenStage ele acompanha a configuração: `max_demand`, seja qual for o número de eventos.

## Tópicos do quiz que ele demonstra

- `messaging` / `queue-pubsub-stream`: consumidores concorrentes contra publish/subscribe, quantas vezes uma mensagem é processada
- `messaging` / `rabbitmq-exchanges-routing`: exchange fanout, bindings, uma fila por assinante, rodízio entre consumidores de uma fila
- `messaging` / `backpressure`: buffers ilimitados, filas limitadas, prefetch, fluxo guiado por demanda com GenStage
- `messaging` / `sqs-sns`: o fan-out de SNS para SQS tem o mesmo formato da exchange fanout com uma fila por serviço

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-pubsub-backpressure.sh        # Linux e macOS
./setup-windows-pubsub-backpressure.ps1    # Windows
```

O script constrói as imagens, roda a checagem de tipos e os testes unitários em TypeScript (que incluem o experimento de memória) e os testes em Elixir sem rede, depois sobe o RabbitMQ em uma rede interna para os testes de ponta a ponta, e remove tudo no fim.

## Testes

```sh
docker compose run --rm ts-test       # checagem de tipos, fila limitada, memória com e sem backpressure
docker compose run --rm ts-e2e        # fila de trabalho, fan-out e prefetch, contra o RabbitMQ
docker compose run --rm elixir-test   # mix format --check-formatted e os testes do GenStage
docker compose down -v
```

O que os testes conferem:

1. Uma fila entrega cada mensagem uma vez: 300 mensagens, 300 entregas, divididas entre 3 workers. Um fan-out a entrega a todo assinante: 300 mensagens, 300 para cada um dos 3 assinantes.
2. Sem backpressure o buffer está maior no fim de cada quarto da execução e a memória residente cresce mais de 15 MiB; com capacidade 100 o buffer nunca passa de 100 mensagens e a memória residente cresce menos de 10 MiB.
3. Um consumidor GenStage com `max_demand: 10` nunca tem mais de 10 eventos em andamento enquanto 2.000 eventos passam; o `send/2` puro deixa o fluxo inteiro na caixa de mensagens.

## Demo

```sh
docker compose run --rm demo          # TypeScript: mostra as tabelas e reescreve results/results.md
docker compose run --rm elixir-demo   # Elixir: push contra GenStage
docker compose down -v
```

## Observações

- O RabbitMQ 4.3 recusa filas transientes que não sejam exclusivas, então as filas do laboratório são declaradas duráveis e auto-delete.
- A imagem Elixir é `elixir:1.20.4-otp-28-alpine`: a variante Debian slim não tem certificados de CA e não alcança o Hex durante o build.
- O `gen_stage` está fixado em 1.3.2 no `mix.exs` e no `mix.lock`, e o build usa `mix deps.get --check-locked`.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/rabbit.ts` | Fila de trabalho, fan-out e o experimento de prefetch |
| `ts/src/backpressure.ts` | `BoundedQueue` e a execução produtor/consumidor com amostras de memória |
| `ts/src/demo.ts` | A demo e o relatório |
| `elixir/lib/pubsub_backpressure/stages.ex` | Produtor e consumidor GenStage |
| `elixir/lib/pubsub_backpressure/meter.ex` | Conta eventos em andamento e guarda o pico |
| `elixir/lib/pubsub_backpressure.ex` | `demand/2`, `push/2` e a demo |
