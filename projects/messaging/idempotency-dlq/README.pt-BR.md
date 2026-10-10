# idempotency-dlq

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Como um consumidor sobrevive a mensagens que chegam duas vezes e a mensagens que nunca poderão ser processadas? Brokers entregam **ao menos uma vez**, então duplicatas são normais, e uma mensagem ruim repetida para sempre pode parar uma fila. Este mini-projeto mostra primeiro o estrago (um consumidor sem proteção credita uma conta 2,5 vezes a mais), depois as duas defesas padrão: um **armazenamento de chaves de idempotência** gravado na mesma transação do efeito, e **retentativa com backoff exponencial** terminando em uma **dead-letter queue**.

Código: MP-MSG-2. Explicação completa: [docs/pt/messaging/idempotency-dlq.md](../../../docs/pt/messaging/idempotency-dlq.md).

```text
publicador --> [work] --> consumidor --ok--> ack
                 ^            |
                 |            +--falhou, restam tentativas--> [retry.N]  espera base x 2^(N-1)
                 +------ TTL expirou, volta por dead-letter ------+
                              |
                              +--inválida, ou sem tentativas--> reject --> [dlq]
```

## Duas linguagens, duas metades da lição

| Pasta | O que mostra | Precisa de |
| --- | --- | --- |
| `ts/` | A versão durável: reentrega do RabbitMQ, uma tabela `processed_messages` com chave primária inserida na mesma transação PostgreSQL do crédito, filas de espera com um TTL por degrau de backoff, e a dead-letter exchange do RabbitMQ | RabbitMQ e PostgreSQL no docker-compose |
| `go/` | A concorrência por trás disso: duas goroutines segurando a mesma mensagem no mesmo instante, um armazenamento que checa e marca em dois passos (errado) contra um que faz os dois em uma seção crítica (certo), sobre um broker at-least-once em memória | Nada: só biblioteca padrão, sem rede |

## Resultados

TypeScript, gerados por `docker compose run --rm demo`, versionados em [results/results.md](results/results.md). Toda mensagem é publicada duas vezes e o consumidor perde a confirmação de 20% das entregas depois de aplicar o efeito. Cada mensagem credita 1,00.

| Consumidor | Mensagens | Entregas | Menor número de entregas de uma mensagem | Efeitos aplicados | Saldo | Saldo esperado |
| --- | --- | --- | --- | --- | --- | --- |
| `naive` | 1000 | 2521 | 2 | **2521** | **2521,00** | 1000,00 |
| `idempotent` | 1000 | 2521 | 2 | 1000 | 1000,00 | 1000,00 |

Uma mensagem envenenada (formato válido, conta desconhecida) com 4 tentativas e backoff começando em 200 ms, mais uma malformada, entre 20 mensagens saudáveis:

| Tentativa da mensagem envenenada | Espera desde a tentativa anterior |
| --- | --- |
| 1 | primeira entrega |
| 2 | 203 ms |
| 3 | 403 ms |
| 4 | 803 ms |

| Mensagem na dead-letter queue | Desistência na tentativa | Motivo registrado pelo RabbitMQ |
| --- | --- | --- |
| `malformed` | 1 | rejected |
| `poison` | 4 | rejected |

A mensagem malformada é uma falha **permanente**, então vai para a dead-letter de imediato, sem gastar tentativas. As 20 mensagens saudáveis foram todas aplicadas: as ruins não travaram a fila.

Go, impresso por `docker compose run --rm go-demo`:

```text
store          deliveries    effects    balance
none                 2494       2494    2494.00
racy                 2494       1019    1019.00
atomic               2494       1000    1000.00
```

O armazenamento com corrida acerta na maior parte do tempo, e é isso que torna o bug perigoso: ele só erra quando dois workers seguram o mesmo id ao mesmo tempo, então o número muda de uma execução para outra. Um teste força esse entrelaçamento e obtém 2 efeitos todas as vezes.

## Tópicos do quiz que ele demonstra

- `messaging` / `idempotent-consumers`: operações idempotentes, a tabela de deduplicação na mesma transação, a corrida de checar e depois agir, a chave de idempotência
- `messaging` / `ack-retry-dlq`: confirmação, poison message, backoff exponencial, falha transitória contra permanente, dead-letter queue
- `messaging` / `delivery-guarantees`: at-least-once, a janela entre o efeito e o ack, efeito exactly-once
- `messaging` / `rabbitmq-exchanges-routing`: dead-letter exchange, TTL de fila, routing keys
- `messaging` / `kafka-topics-partitions-offsets`, `bullmq-redis`, `sqs-sns`: as questões sobre reentrega e deduplicação apontam para cá, porque a defesa é a mesma em qualquer broker

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-idempotency-dlq.sh        # Linux e macOS
./setup-windows-idempotency-dlq.ps1    # Windows
```

O script constrói as imagens, roda a checagem de tipos e os testes unitários em TypeScript e as verificações em Go sem rede, depois sobe o RabbitMQ e o PostgreSQL em uma rede interna para os testes de ponta a ponta, e remove tudo no fim.

## Testes

```sh
docker compose run --rm ts-test   # checagem de tipos e testes unitários (backoff, schema, relatório)
docker compose run --rm ts-e2e    # os três testes de aceitação, contra RabbitMQ e PostgreSQL
docker compose run --rm go-test   # gofmt, go vet, golangci-lint, go test -race
docker compose down -v
```

Os testes de aceitação (`ts/tests/e2e.test.ts`, espelhados em `go/idempotency_test.go`):

1. Sem proteção, o efeito colateral é aplicado mais de uma vez (um efeito por entrega).
2. Com o armazenamento, 1.000 mensagens entregues ao menos duas vezes produzem exatamente 1.000 efeitos.
3. Uma mensagem envenenada cai na dead-letter queue depois das tentativas configuradas, com cada retentativa esperando ao menos o seu degrau de backoff.

## Demo

```sh
docker compose run --rm demo      # TypeScript: mostra as tabelas e reescreve results/results.md
docker compose run --rm go-demo   # Go: mostra a comparação dos três armazenamentos
docker compose down -v
```

## Limites que vale conhecer

- A "queda" entre o efeito e o ack é simulada com uma confirmação negativa com requeue, que é o que o broker faz quando um consumidor morre. Uma morte real de processo aparece em [queue-comparison](../queue-comparison/README.pt-BR.md).
- Publicar a cópia de retentativa e confirmar a original são dois passos. Uma queda no meio duplica a mensagem, o que só é aceitável porque o handler é idempotente.
- `processed_messages` cresce para sempre aqui. Um sistema real expira ids antigos, e a janela precisa ser maior que o maior atraso possível de reentrega.
- O PostgreSQL roda com `synchronous_commit=off` porque o banco do laboratório é descartável. As transações continuam atômicas; não copie a configuração para dados que importam.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/core.ts` | Schema da mensagem, fórmula de backoff, aleatório com semente, configuração |
| `ts/src/db.ts` | O crédito, o handler ingênuo e o handler idempotente |
| `ts/src/pipeline.ts` | Topologia do RabbitMQ, consumidor com retentativa, backoff e dead-lettering |
| `ts/src/scenarios.ts`, `ts/src/demo.ts` | Os cenários e o relatório |
| `go/store.go` | `NoStore`, `RacyStore`, `AtomicStore` |
| `go/broker.go` | Broker at-least-once em memória, com backoff e dead-letter queue |
