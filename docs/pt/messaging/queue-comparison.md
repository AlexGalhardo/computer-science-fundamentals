# Comparação de filas (MP-MSG-1)

> English version: [docs/en/messaging/queue-comparison.md](../../en/messaging/queue-comparison.md)

Mini-projeto: [`projects/messaging/queue-comparison`](../../../projects/messaging/queue-comparison/README.pt-BR.md). Tópicos do quiz: `queue-pubsub-stream`, `delivery-guarantees`, `ordering-partitioning`, `ack-retry-dlq`, `rabbitmq-exchanges-routing`, `kafka-topics-partitions-offsets`, `bullmq-redis`, `sqs-sns`.

## A pergunta

"Use uma fila" esconde uma escolha. BullMQ, RabbitMQ, Kafka e SQS levam uma mensagem de um produtor a um consumidor, e uma interface pequena consegue esconder qual deles está em uso. O que a interface não esconde é o comportamento: em que ordem as mensagens chegam, o que acontece com a mensagem cujo consumidor morreu, e a velocidade de tudo isso. Este mini-projeto roda uma tarefa nos quatro e mede essas três coisas.

## Uma tarefa, uma interface

A tarefa: uma mensagem `OrderPlaced` faz um consumidor enviar um e-mail de confirmação (simulado).

```ts
interface OrderProducer { send(orders: OrderPlaced[]): Promise<void>; close(): Promise<void> }
interface OrderConsumer { stop(): Promise<void> }
interface QueueAdapter {
  prepare(options?: { partitions?: number }): Promise<void>;
  createProducer(): Promise<OrderProducer>;
  consume(handler: OrderHandler, options: { parallelism: number }): Promise<OrderConsumer>;
}
```

`send` resolve quando o broker confirmou as mensagens. Uma mensagem só é confirmada depois que a promise do handler resolve, então todo adaptador é **at-least-once**. Cada classe de adaptador é declarada `implements QueueAdapter` e o registro é tipado com `satisfies Record<BrokerName, ...>`: um adaptador faltando ou incompleto é erro de compilação.

## Quatro modelos atrás da interface

| | Onde a mensagem mora | Como o consumidor a recebe | O que é "confirmar" | Como um consumidor morto é percebido |
| --- | --- | --- | --- | --- |
| BullMQ | Listas, sorted sets e hashes no Redis | O worker bloqueia no Redis e move o job para `active` | O job é movido para `completed` | O lock do job não é renovado e expira (job stalled) |
| RabbitMQ | Uma fila dentro do broker | O broker empurra por um canal aberto, até o prefetch | `ack` do delivery tag | A conexão fecha |
| Kafka | Uma partição de um log, mantida pela retenção | O consumidor busca a partir de um offset | Um commit de "o próximo offset a ler" do grupo | Os heartbeats param e a sessão expira |
| SQS | Uma fila atrás de uma API HTTP | O consumidor consulta (`ReceiveMessage`) | `DeleteMessage` com o receipt handle | Ninguém percebe: o visibility timeout apenas acaba |

## Experimento 1: ordem

200 pedidos são enviados em sequência e lidos por um consumidor que trata uma mensagem por vez.

- **BullMQ e RabbitMQ**: uma fila, um consumidor, o primeiro a entrar é o primeiro a sair. A ordem é mantida.
- **Kafka**: o tópico tem 3 partições e a chave é o id do cliente. A ordem só existe dentro de uma partição, então o consumidor vê os pedidos de cada cliente em ordem, e os clientes intercalados do jeito que as partições foram buscadas. Na execução versionada, 148 de 200 mensagens chegaram depois de uma mensagem enviada mais tarde. Esse é o desenho: partições compram paralelismo e abrem mão da ordem total.
- **SQS standard**: a ordem é por melhor esforço. O LocalStack entregou em ordem; o serviço real não promete isso, então o teste registra o resultado e não confere nada. Ordem estrita exige uma fila FIFO e um `MessageGroupId`.

Uma duplicata pode se passar por reordenação. Uma versão anterior deste laboratório viu os pedidos de um cliente chegarem como 0, 4, 8, 0, 4, 8, 12: a primeira requisição de produção para um tópico recém-criado recebeu "não sou o líder" para uma das três partições, o cliente repetiu a requisição inteira, e as outras partições gravaram o lote duas vezes. A correção foi um produtor idempotente (o broker descarta um número de lote que já gravou) e esperar toda partição responder antes de usar o tópico. O README conta a história completa.

O experimento mantém um consumidor de propósito. Com vários consumidores em uma fila, as mensagens são processadas em paralelo e os efeitos podem acontecer fora de ordem em qualquer broker, FIFO ou não.

## Experimento 2: o consumidor cai antes de confirmar

Um consumidor em um processo separado recebe a mensagem e é morto com `SIGKILL` enquanto o handler ainda está rodando. Os quatro brokers entregam a mensagem de novo, que é o que at-least-once significa, mas percebem a morte de modos e em velocidades diferentes:

- **RabbitMQ**: a conexão TCP fecha junto com o processo, a entrega sem confirmação volta à fila na hora, e a segunda entrega traz `redelivered = true`.
- **BullMQ**: ninguém renova o lock do job. Quando ele expira (3 s neste laboratório, 30 s por padrão) o job é declarado stalled e volta para a espera.
- **Kafka**: o coordenador do grupo para de receber heartbeats e, depois do session timeout (6 s aqui), remove o membro e rebalanceia. O novo dono da partição começa do último offset confirmado. Não existe flag de "reentregue": do ponto de vista do Kafka nada foi reentregue, um offset apenas nunca foi confirmado.
- **SQS**: o serviço não sabe que o consumidor morreu. A mensagem reaparece quando o visibility timeout acaba (5 s aqui), com `ApproximateReceiveCount` igual a 2.

A consequência prática é a mesma em todos: um handler pode rodar duas vezes para uma mensagem, então o seu efeito precisa ser idempotente. Esse é o assunto de [idempotency-dlq](idempotency-dlq.md).

## Experimento 3: vazão

Cada rodada envia 5.000 mensagens, depois inicia um consumidor e espera por todas. Produção e consumo são cronometrados em separado; o tempo de consumo vai da primeira à última entrega, então a inicialização do consumidor (a entrada em um grupo no Kafka leva segundos) fica de fora. Uma rodada de aquecimento é descartada, três são medidas, e a tabela mostra a média com a menor e a maior rodada.

Os números versionados e a máquina estão no [README](../../../projects/messaging/queue-comparison/README.pt-BR.md) e em `results/results.md`. Eles descrevem um broker de um nó só e um cliente em um notebook:

- O Kafka ganha com folga na leitura por causa do modelo, não de ajuste fino: log sequencial, buscas grandes, um commit para um lote.
- RabbitMQ e BullMQ pagam pela confirmação por mensagem. O BullMQ ainda executa um script Lua no Redis a cada mudança de estado de um job.
- O SQS é uma API HTTP com no máximo 10 mensagens por chamada, e aqui é um emulador. O número é um piso para "uma fila HTTP consultada em lotes de 10", não uma medida da AWS.

## Rodando tudo localmente

Os brokers ficam em uma rede `internal` do docker-compose, sem porta publicada. Cada serviço de teste de integração depende só do seu broker, e o script de setup os testa um por vez, removendo cada um antes de subir o próximo. O carregador de configuração recusa qualquer endereço de broker que não seja o loopback ou um nome de serviço do docker-compose.

O LocalStack está fixado em 4.14.0. A partir das versões seguintes a imagem se recusa a iniciar sem um token de conta validado contra um servidor na internet, o que contraria as regras deste repositório (sem credenciais reais, sem rede externa). Veja [o README](../../../projects/messaging/queue-comparison/README.pt-BR.md#tudo-é-local).

## O que levar daqui

- Uma interface consegue unificar a API dos brokers, nunca as suas garantias.
- Ordem é propriedade de uma fila com um consumidor, ou de uma partição. Todo o resto é melhor esforço.
- At-least-once é o terreno comum dos quatro. A diferença é quanto tempo uma mensagem perdida fica perdida: volta na hora no RabbitMQ, e depois de um timeout nos outros três.
- A vazão acompanha o modelo de confirmação: por mensagem, por lote ou por offset.
