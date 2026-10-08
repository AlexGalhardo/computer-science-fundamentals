# queue-comparison

> English version: [README.md](README.md)

O que muda quando a mesma tarefa roda em quatro brokers diferentes? Uma mensagem "pedido realizado" dispara um e-mail de confirmação simulado, e o mesmo código de produtor e consumidor roda em **BullMQ (Redis)**, **RabbitMQ**, **Kafka** e **SQS (LocalStack)** por meio de uma única interface TypeScript. O código é o mesmo; o comportamento não: a ordem, o que acontece quando um consumidor morre com uma mensagem nas mãos e a velocidade mudam, e os testes e o benchmark mostram como.

Código: MP-MSG-1. Explicação completa: [docs/pt/messaging/queue-comparison.md](../../../docs/pt/messaging/queue-comparison.md). Reconstrói o projeto legado `references/projects/message-queues-pubsub` dentro das regras deste repositório.

```
produtor --send(orders)--> [ BullMQ | RabbitMQ | Kafka | SQS ] --handler(order)--> e-mail simulado
            OrderProducer            QueueAdapter                 OrderConsumer
```

## Resultados

Gerados por `docker compose run --rm demo`, versionados em [results/results.md](results/results.md).

### Experimentos de comportamento

Ordem: 200 pedidos enviados em sequência, um consumidor tratando uma mensagem por vez. O Kafka usa um tópico com 3 partições e o id do cliente como chave; os outros brokers usam uma fila. Reentrega: um **processo** consumidor recebe a mensagem e é morto com `SIGKILL` antes de confirmar; um segundo consumidor espera pela mensagem.

| Broker | Recebidas na ordem de envio | Em ordem por cliente (chave) | Reentregue depois da queda | Atraso até a reentrega | Sinal do broker |
| --- | --- | --- | --- | --- | --- |
| BullMQ sobre Redis | sim | sim | sim | 3,0 s (expiração do lock) | `attemptsStarted` acima de 1 |
| RabbitMQ | sim | sim | sim | 0,0 s (conexão fechada) | flag `redelivered` |
| Kafka | **não** (148 de 200 fora de ordem) | sim | sim | 6,0 s (session timeout) | nenhum: o offset apenas não foi confirmado |
| SQS no LocalStack | sim (melhor esforço, sem garantia) | sim (sem garantia) | sim | 5,7 s (visibility timeout) | `ApproximateReceiveCount` acima de 1 |

Os mesmos experimentos são testes de integração (`ts/tests/integration.test.ts`): as garantias de cada broker estão escritas em `ts/src/expected.ts` e são conferidas, então a tabela é sustentada por um teste, não por uma execução de sorte. Nas filas standard do SQS a ordem é apenas observada, nunca conferida, porque o serviço não a promete.

### Vazão

5.000 mensagens por rodada, 3 rodadas medidas depois de um aquecimento descartado. Mensagens por segundo: média (menor rodada a maior rodada).

| Broker | Produção, msg/s | Consumo, msg/s |
| --- | --- | --- |
| BullMQ sobre Redis | 14.311 (12.464 a 15.824) | 6.175 (4.170 a 7.551) |
| RabbitMQ | 31.186 (28.138 a 35.463) | 14.516 (11.391 a 17.047) |
| Kafka | 52.408 (45.995 a 56.779) | 157.782 (154.176 a 161.883) |
| SQS no LocalStack | 2.645 (2.435 a 2.890) | 1.920 (1.765 a 2.032) |

Máquina: AMD Ryzen 7 5700X3D, 16 núcleos lógicos, 15,6 GiB visíveis ao Docker (WSL2), Bun 1.4.2. Imagens: `redis:8.10.2-alpine`, `rabbitmq:4.3.6-alpine`, `apache/kafka:4.3.1`, `localstack/localstack:4.14.0`. Clientes: bullmq 6.3.11, amqplib 2.2.0, kafkajs 2.2.4, @aws-sdk/client-sqs 3.1147.0.

Leia os números com cuidado:

- Eles comparam **cliente mais broker em um notebook**, com um nó só e sem replicação. Não são um ranking dos produtos.
- A linha do SQS mede o LocalStack, um emulador escrito em Python, por HTTP com no máximo 10 mensagens por chamada. Não diz nada sobre a velocidade do serviço real.
- O Kafka lê rápido porque o consumidor busca lotes grandes de um log sequencial e confirma um offset para todos; as filas confirmam cada mensagem.
- Cada adaptador usa o agrupamento que a sua API oferece (500 jobs por `addBulk`, confirms a cada 1.000 publicações, 500 registros por requisição Kafka, 10 mensagens por chamada SQS), que é como cada um seria usado na prática.

## Tópicos do quiz que ele demonstra

- `messaging` / `queue-pubsub-stream`: fila contra log, o que um consumidor lento custa em cada um
- `messaging` / `delivery-guarantees`: at-least-once, confirmar depois do trabalho, configurações de durabilidade
- `messaging` / `ordering-partitioning`: ordem por partição e por chave, ordem por melhor esforço no SQS
- `messaging` / `ack-retry-dlq`: mensagens sem confirmação voltando depois de uma queda, visibility timeout
- `messaging` / `rabbitmq-exchanges-routing`: exchange padrão, fila durável, prefetch
- `messaging` / `kafka-topics-partitions-offsets`: partições, chaves, consumer groups, offsets confirmados
- `messaging` / `bullmq-redis`: `Queue`, `Worker`, concorrência, jobs stalled
- `messaging` / `sqs-sns`: polling, visibility timeout, delete explícito

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-queue-comparison.sh        # Linux e macOS
./setup-windows-queue-comparison.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos e os testes unitários sem rede, e depois testa os brokers **um por vez** em uma rede interna (sobe o broker, roda os testes de integração dele, remove), então Redis, RabbitMQ, Kafka e LocalStack nunca ficam no ar juntos.

## Testes

```sh
docker compose run --rm ts-test          # checagem de tipos (os quatro adaptadores implementam QueueAdapter) e testes unitários
docker compose run --rm test-bullmq      # também: test-rabbitmq, test-kafka, test-sqs
docker compose down -v
```

Cada serviço de teste de integração sobe só o seu broker. Por broker: 1.000 mensagens enviadas e 1.000 recebidas, o experimento de ordem e o experimento de reentrega.

## Demo e benchmark

```sh
docker compose run --rm demo
docker compose down -v
```

Sobe os quatro brokers de uma vez (o Kafka roda com heap de 256 MiB), roda os experimentos e o benchmark em cada um, mostra as tabelas e reescreve `results/results.md` e `results/results.json`. `BROKERS=kafka,rabbitmq`, `BENCH_MESSAGES=20000` e `BENCH_RUNS=5` alteram a execução.

## Tudo é local

- A rede do docker-compose é `internal`: nenhum contêiner alcança a internet e nenhuma porta é publicada no host.
- O SQS é o LocalStack. As credenciais são as strings falsas `fake-lab-access-key` e `fake-lab-secret-key`, e nada chega à AWS.
- `ts/src/config.ts` se recusa a iniciar quando o endereço de um broker não é o loopback nem um nome de serviço do docker-compose, então o benchmark não pode ser apontado para o broker de outra pessoa.
- O LocalStack está fixado em 4.14.0, a última imagem que inicia sem token de conta. As imagens mais novas exigem uma credencial real e um servidor de licença na internet.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/queue.ts` | O contrato: `OrderProducer`, `OrderConsumer`, `QueueAdapter` |
| `ts/src/adapters/` | Um adaptador por broker, e o registro que o compilador confere |
| `ts/src/experiments.ts` | Ida e volta, ordem, reentrega e vazão, escritos uma vez para todos os brokers |
| `ts/src/crash-consumer.ts` | O processo consumidor que é morto no experimento de reentrega |
| `ts/src/expected.ts` | O que cada broker garante, conferido pelos testes de integração |
| `ts/src/demo.ts`, `ts/src/report.ts` | A demo e o relatório em Markdown |
