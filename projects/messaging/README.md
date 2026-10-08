# Messaging

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Messaging lets services cooperate without calling each other directly: one side publishes a message and another processes it later. Queues, publish/subscribe and logs differ in who receives a message, in which order, and how many times, and those differences decide whether a system survives a crash or a slow consumer. Delivery guarantees, acknowledgements, retries, dead-letter queues and idempotent consumers are the core of the subject.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Queue comparison (`queue-comparison`) | What changes when the same task runs on BullMQ, RabbitMQ, Kafka and SQS | planned |
| Idempotency and dead-letter queue (`idempotency-dlq`) | How to survive duplicated and poisoned messages | planned |
| Queue, pub/sub and backpressure (`pubsub-backpressure`) | The difference between competing consumers and broadcast, and what happens when producers are faster | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/messaging/`).
- Documentation: planned (`docs/en/messaging/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials), RabbitMQ. Free. Six short tutorials, in many languages, from a simple queue to routing, topics and RPC.
- [Apache Kafka: Introduction](https://kafka.apache.org/intro), Apache Software Foundation. Free. The official overview of events, topics, partitions, producers and consumers.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn. Free. The essay that explains the append-only log as the idea behind Kafka and stream processing.

### Books

- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/), Gregor Hohpe and Bobby Woolf. Free online, paid in print. The free online summary of the book's 65 patterns: channels, routers, dead letter channel, idempotent receiver.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. The chapter on stream processing compares message brokers with logs and explains delivery semantics.
- [The Optimal RabbitMQ Guide](https://www.cloudamqp.com/rabbitmq-ebook/), CloudAMQP. Free. A free e-book on exchanges, queues, bindings and best practices, one of the sources of the quiz.
- [Kafka: The Definitive Guide](https://www.confluent.io/resources/ebook/kafka-the-definitive-guide/), Neha Narkhede, Gwen Shapira and Todd Palino. Free. The reference book on Kafka internals and operation, offered as a free e-book by Confluent after registration.

### Courses and lectures

- [Confluent Developer courses](https://developer.confluent.io/courses/), Confluent. Free. Free short video courses on Kafka fundamentals, internals, event sourcing and stream processing.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS. Free. The background needed to understand replication, ordering and failure in brokers.

### Papers and specifications

- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts), RabbitMQ. Free. The protocol model in plain words: exchanges, queues, bindings, acknowledgements and prefetch.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat. Free. A short post on why delivery is at-most-once or at-least-once, and what idempotency buys.
- [Exactly-Once Semantics Are Possible: Here's How Kafka Does It](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/), Neha Narkhede, Confluent. Free. The other side of the argument: idempotent producers and transactions inside Kafka.
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), Martin Fowler. Free. Separates four patterns that share one name: notification, state transfer, event sourcing and CQRS.
- [Reactive Streams](https://www.reactive-streams.org/), Reactive Streams initiative. Free. The small specification that standardised asynchronous stream processing with backpressure.

### Official documentation

- [RabbitMQ documentation](https://www.rabbitmq.com/docs), RabbitMQ. Free. Guides on queues, consumer acknowledgements, publisher confirms and dead-letter exchanges.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/), Apache Software Foundation. Free. The design section explains the log, replication, consumer groups, offsets and delivery guarantees.
- [BullMQ documentation](https://docs.bullmq.io/), Taskforce.sh. Free. Job queues on Redis: workers, retries with backoff, rate limiting and flows.
- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html), Amazon Web Services. Free. Standard and FIFO queues, visibility timeout and dead-letter queues.
- [LocalStack documentation](https://docs.localstack.cloud/), LocalStack. Free. How to run SQS and SNS locally in Docker, as the mini-projects do.
- [GenStage](https://hexdocs.pm/gen_stage/GenStage.html), The Elixir Team. Free. Producers and consumers with demand-driven backpressure in Elixir.

### Videos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Free. Long videos comparing RabbitMQ, Kafka and Redis and explaining queues against publish/subscribe.

### Communities

- [Stack Overflow: rabbitmq tag](https://stackoverflow.com/questions/tagged/rabbitmq), Stack Overflow. Free. Answered questions on exchanges, acknowledgements and redelivery.
- [Stack Overflow: apache-kafka tag](https://stackoverflow.com/questions/tagged/apache-kafka), Stack Overflow. Free. Answered questions on partitions, consumer groups and offsets.
