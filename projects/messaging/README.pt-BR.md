# Mensageria

> English version: [README.md](README.md)

A mensageria permite que serviços cooperem sem chamar uns aos outros diretamente: um lado publica uma mensagem e outro a processa depois. Filas, publish/subscribe e logs diferem em quem recebe uma mensagem, em que ordem e quantas vezes, e essas diferenças decidem se um sistema sobrevive a uma queda ou a um consumidor lento. Garantias de entrega, confirmações, retentativas, filas de mensagens mortas e consumidores idempotentes são o centro do assunto.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Comparação de filas (`queue-comparison`) | O que muda quando a mesma tarefa roda em BullMQ, RabbitMQ, Kafka e SQS | planejado |
| Idempotência e fila de mensagens mortas (`idempotency-dlq`) | Como sobreviver a mensagens duplicadas e envenenadas | planejado |
| Fila, pub/sub e contrapressão (`pubsub-backpressure`) | A diferença entre consumidores concorrentes e difusão, e o que acontece quando os produtores são mais rápidos | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/messaging/`).
- Documentação: planejada (`docs/pt/messaging/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials), RabbitMQ. Gratuito. Seis tutoriais curtos, em várias linguagens, de uma fila simples a roteamento, tópicos e RPC.
- [Apache Kafka: Introduction](https://kafka.apache.org/intro), Apache Software Foundation. Gratuito. A visão geral oficial de eventos, tópicos, partições, produtores e consumidores.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn. Gratuito. O ensaio que explica o log somente de acréscimo como a ideia por trás do Kafka e do processamento de streams.

### Livros

- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/), Gregor Hohpe and Bobby Woolf. Gratuito online, pago impresso. O resumo online gratuito dos 65 padrões do livro: canais, roteadores, canal de mensagens mortas, receptor idempotente.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. O capítulo sobre processamento de streams compara brokers de mensagens com logs e explica a semântica de entrega.
- [The Optimal RabbitMQ Guide](https://www.cloudamqp.com/rabbitmq-ebook/), CloudAMQP. Gratuito. E-book gratuito sobre exchanges, filas, bindings e boas práticas, uma das fontes do quiz.
- [Kafka: The Definitive Guide](https://www.confluent.io/resources/ebook/kafka-the-definitive-guide/), Neha Narkhede, Gwen Shapira and Todd Palino. Gratuito. O livro de referência sobre os internos e a operação do Kafka, oferecido como e-book gratuito pela Confluent mediante cadastro.

### Cursos e aulas

- [Confluent Developer courses](https://developer.confluent.io/courses/), Confluent. Gratuito. Cursos curtos e gratuitos em vídeo sobre fundamentos e internos do Kafka, event sourcing e processamento de streams.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS. Gratuito. A base necessária para entender replicação, ordenação e falhas em brokers.

### Artigos e especificações

- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts), RabbitMQ. Gratuito. O modelo do protocolo em linguagem simples: exchanges, filas, bindings, confirmações e prefetch.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat. Gratuito. Texto curto sobre por que a entrega é no máximo uma vez ou pelo menos uma vez, e o que a idempotência compra.
- [Exactly-Once Semantics Are Possible: Here's How Kafka Does It](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/), Neha Narkhede, Confluent. Gratuito. O outro lado do argumento: produtores idempotentes e transações dentro do Kafka.
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), Martin Fowler. Gratuito. Separa quatro padrões que dividem um mesmo nome: notificação, transferência de estado, event sourcing e CQRS.
- [Reactive Streams](https://www.reactive-streams.org/), Reactive Streams initiative. Gratuito. A pequena especificação que padronizou o processamento assíncrono de streams com contrapressão.

### Documentação oficial

- [RabbitMQ documentation](https://www.rabbitmq.com/docs), RabbitMQ. Gratuito. Guias sobre filas, confirmações de consumidores, confirmações de publicação e dead-letter exchanges.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/), Apache Software Foundation. Gratuito. A seção de projeto explica o log, a replicação, os grupos de consumidores, os offsets e as garantias de entrega.
- [BullMQ documentation](https://docs.bullmq.io/), Taskforce.sh. Gratuito. Filas de jobs sobre Redis: workers, retentativas com backoff, limitação de taxa e fluxos.
- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html), Amazon Web Services. Gratuito. Filas padrão e FIFO, tempo de visibilidade e filas de mensagens mortas.
- [LocalStack documentation](https://docs.localstack.cloud/), LocalStack. Gratuito. Como executar SQS e SNS localmente em Docker, como fazem os miniprojetos.
- [GenStage](https://hexdocs.pm/gen_stage/GenStage.html), The Elixir Team. Gratuito. Produtores e consumidores com contrapressão guiada por demanda em Elixir.

### Vídeos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratuito. Vídeos longos comparando RabbitMQ, Kafka e Redis e explicando filas em contraste com publish/subscribe.

### Comunidades

- [Stack Overflow: rabbitmq tag](https://stackoverflow.com/questions/tagged/rabbitmq), Stack Overflow. Gratuito. Perguntas respondidas sobre exchanges, confirmações e reentrega.
- [Stack Overflow: apache-kafka tag](https://stackoverflow.com/questions/tagged/apache-kafka), Stack Overflow. Gratuito. Perguntas respondidas sobre partições, grupos de consumidores e offsets.
