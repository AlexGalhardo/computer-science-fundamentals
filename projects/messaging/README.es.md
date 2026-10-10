# Mensajería

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La mensajería permite que los servicios cooperen sin llamarse directamente: un lado publica un mensaje y otro lo procesa después. Las colas, el publish/subscribe y los logs difieren en quién recibe un mensaje, en qué orden y cuántas veces, y esas diferencias deciden si un sistema sobrevive a una caída o a un consumidor lento. Las garantías de entrega, las confirmaciones, los reintentos, las colas de mensajes muertos y los consumidores idempotentes son el núcleo del tema.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| Comparación de colas (`queue-comparison`) | Qué cambia cuando la misma tarea se ejecuta en BullMQ, RabbitMQ, Kafka y SQS | planificado |
| Idempotencia y cola de mensajes muertos (`idempotency-dlq`) | Cómo sobrevivir a mensajes duplicados y envenenados | planificado |
| Cola, pub/sub y contrapresión (`pubsub-backpressure`) | La diferencia entre consumidores concurrentes y difusión, y qué ocurre cuando los productores son más rápidos | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/messaging/`).
- Documentación: planificada (`docs/es/messaging/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Cada enlace se verificó cuando se escribió la lista.

### Empieza aquí

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials), RabbitMQ. Gratis. Seis tutoriales cortos, en muchos lenguajes, desde una cola simple hasta enrutamiento, topics y RPC.
- [Apache Kafka: Introduction](https://kafka.apache.org/intro), Apache Software Foundation. Gratis. La visión general oficial de eventos, topics, particiones, productores y consumidores.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn. Gratis. El ensayo que explica el log de solo anexado (append-only) como la idea detrás de Kafka y del procesamiento de streams.

### Libros

- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/), Gregor Hohpe y Bobby Woolf. Gratis en línea, de pago en papel. El resumen gratuito en línea de los 65 patrones del libro: canales, enrutadores, dead letter channel, idempotent receiver.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. El capítulo sobre procesamiento de streams compara los message brokers con los logs y explica las semánticas de entrega.
- [The Optimal RabbitMQ Guide](https://www.cloudamqp.com/rabbitmq-ebook/), CloudAMQP. Gratis. Un e-book gratuito sobre exchanges, colas, bindings y buenas prácticas, una de las fuentes del quiz.
- [Kafka: The Definitive Guide](https://www.confluent.io/resources/ebook/kafka-the-definitive-guide/), Neha Narkhede, Gwen Shapira y Todd Palino. Gratis. El libro de referencia sobre el funcionamiento interno y la operación de Kafka, ofrecido por Confluent como e-book gratuito tras registrarse.

### Cursos y charlas

- [Confluent Developer courses](https://developer.confluent.io/courses/), Confluent. Gratis. Cursos cortos en video y gratuitos sobre fundamentos de Kafka, su funcionamiento interno, event sourcing y procesamiento de streams.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS. Gratis. La base necesaria para entender la replicación, el orden y los fallos en los brokers.

### Papers y especificaciones

- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts), RabbitMQ. Gratis. El modelo del protocolo en palabras sencillas: exchanges, colas, bindings, confirmaciones y prefetch.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat. Gratis. Un post corto sobre por qué la entrega es at-most-once o at-least-once, y qué aporta la idempotencia.
- [Exactly-Once Semantics Are Possible: Here's How Kafka Does It](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/), Neha Narkhede, Confluent. Gratis. El otro lado del argumento: productores idempotentes y transacciones dentro de Kafka.
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), Martin Fowler. Gratis. Separa cuatro patrones que comparten un mismo nombre: notificación, transferencia de estado, event sourcing y CQRS.
- [Reactive Streams](https://www.reactive-streams.org/), Reactive Streams initiative. Gratis. La pequeña especificación que estandarizó el procesamiento asíncrono de streams con contrapresión.

### Documentación oficial

- [RabbitMQ documentation](https://www.rabbitmq.com/docs), RabbitMQ. Gratis. Guías sobre colas, confirmaciones del consumidor, publisher confirms y dead-letter exchanges.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/), Apache Software Foundation. Gratis. La sección de diseño explica el log, la replicación, los consumer groups, los offsets y las garantías de entrega.
- [BullMQ documentation](https://docs.bullmq.io/), Taskforce.sh. Gratis. Colas de jobs sobre Redis: workers, reintentos con backoff, límite de tasa y flows.
- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html), Amazon Web Services. Gratis. Colas Standard y FIFO, visibility timeout y colas de mensajes muertos.
- [LocalStack documentation](https://docs.localstack.cloud/), LocalStack. Gratis. Cómo ejecutar SQS y SNS localmente en Docker, como hacen los mini-proyectos.
- [GenStage](https://hexdocs.pm/gen_stage/GenStage.html), The Elixir Team. Gratis. Productores y consumidores con contrapresión guiada por la demanda en Elixir.

### Videos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratis. Videos largos que comparan RabbitMQ, Kafka y Redis y explican las colas frente al publish/subscribe.

### Comunidades

- [Stack Overflow: rabbitmq tag](https://stackoverflow.com/questions/tagged/rabbitmq), Stack Overflow. Gratis. Preguntas respondidas sobre exchanges, confirmaciones y reentrega.
- [Stack Overflow: apache-kafka tag](https://stackoverflow.com/questions/tagged/apache-kafka), Stack Overflow. Gratis. Preguntas respondidas sobre particiones, consumer groups y offsets.
