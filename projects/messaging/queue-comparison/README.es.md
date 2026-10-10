# queue-comparison

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Qué cambia cuando la misma tarea se ejecuta en cuatro brokers distintos? Un mensaje "pedido realizado" dispara un correo de confirmación simulado, y el mismo código de productor y consumidor se ejecuta en **BullMQ (Redis)**, **RabbitMQ**, **Kafka** y **SQS (LocalStack)** a través de una sola interfaz de TypeScript. El código es el mismo; el comportamiento no: el orden, lo que ocurre cuando un consumidor muere con un mensaje en las manos y la velocidad son distintos, y las pruebas y el benchmark muestran cómo.

Código: MP-MSG-1. Explicación completa: [docs/es/messaging/queue-comparison.md](../../../docs/es/messaging/queue-comparison.md). Reconstruye el proyecto heredado `references/projects/message-queues-pubsub` bajo las reglas de este repositorio.

```text
producer --send(orders)--> [ BullMQ | RabbitMQ | Kafka | SQS ] --handler(order)--> simulated e-mail
             OrderProducer            QueueAdapter                 OrderConsumer
```

## Resultados

Generados por `docker compose run --rm demo`, guardados en [results/results.md](results/results.md).

### Experimentos de comportamiento

Orden: 200 pedidos enviados en secuencia, un consumidor que procesa un mensaje a la vez. Kafka usa un topic con 3 particiones y el id del cliente como clave; los otros brokers usan una sola cola. Reentrega: un **proceso** consumidor recibe el mensaje y se mata con `SIGKILL` antes de confirmarlo; un segundo consumidor espera el mensaje.

| Broker | Recibido en el orden de envío | En orden por cliente (clave) | Reentregado tras la caída | Retraso hasta la reentrega | Señal del broker |
| --- | --- | --- | --- | --- | --- |
| BullMQ sobre Redis | sí | sí | sí | 3.0 s (expiración del lock) | `attemptsStarted` mayor que 1 |
| RabbitMQ | sí | sí | sí | 0.0 s (conexión cerrada) | indicador `redelivered` |
| Kafka | **no** (148 de 200 fuera de orden) | sí | sí | 6.0 s (session timeout) | ninguna: el offset simplemente no se confirmó |
| SQS en LocalStack | sí (mejor esfuerzo, no garantizado) | sí (no garantizado) | sí | 5.4 s (visibility timeout) | `ApproximateReceiveCount` mayor que 1 |

Los mismos experimentos son pruebas de integración (`ts/tests/integration.test.ts`): las garantías de cada broker están escritas en `ts/src/expected.ts` y se verifican, así que la tabla está respaldada por una prueba, no por una ejecución afortunada. En las colas estándar de SQS el orden solo se observa, nunca se verifica, porque el servicio no lo promete.

### Rendimiento (throughput)

5,000 mensajes por ejecución, 3 ejecuciones medidas tras un calentamiento descartado. Mensajes por segundo: media (de la ejecución más baja a la más alta).

| Broker | Producir, msg/s | Consumir, msg/s |
| --- | --- | --- |
| BullMQ sobre Redis | 15,572 (15,365 a 15,698) | 6,666 (5,676 a 7,850) |
| RabbitMQ | 19,480 (9,392 a 38,195) | 16,744 (13,166 a 19,665) |
| Kafka | 28,561 (26,429 a 29,780) | 87,057 (72,294 a 99,425) |
| SQS en LocalStack | 2,388 (2,186 a 2,580) | 1,356 (1,128 a 1,658) |

Máquina: AMD Ryzen 7 5700X3D, 16 núcleos lógicos, 15.6 GiB visibles para Docker (WSL2), Bun 1.4.2. Imágenes: `redis:8.10.2-alpine`, `rabbitmq:4.3.6-alpine`, `apache/kafka:4.3.1`, `localstack/localstack:4.14.0`. Clientes: bullmq 6.3.11, amqplib 2.2.0, kafkajs 2.2.4, @aws-sdk/client-sqs 3.1147.0.

Lee los números con cuidado:

- Comparan **cliente más broker en un solo portátil**, un solo nodo, sin replicación. No son un ranking de los productos.
- La fila de SQS mide LocalStack, un emulador escrito en Python, sobre HTTP con un máximo de 10 mensajes por llamada. No dice nada sobre la velocidad del servicio real.
- Kafka lee rápido porque un consumidor obtiene lotes grandes de un log secuencial y confirma un solo offset para todos; las colas confirman cada mensaje.
- La máquina se compartió con otras cargas durante la ejecución guardada, por eso algunas filas tienen una dispersión amplia (RabbitMQ produjo entre 9,392 y 38,195 msg/s). La dispersión es parte del resultado.
- El productor de Kafka es idempotente (`enable.idempotence`, una solicitud en vuelo, `acks=all`), que es la configuración segura y cuesta algo de rendimiento al producir.
- Cada adaptador usa el batching que ofrece su API (500 jobs por `addBulk`, confirmaciones cada 1,000 publicaciones, 500 registros por solicitud de Kafka, 10 mensajes por llamada de SQS), que es como se usaría cada uno en la práctica.

## Temas del quiz que demuestra

- `messaging` / `queue-pubsub-stream`: cola frente a log, lo que cuesta un consumidor lento en cada uno
- `messaging` / `delivery-guarantees`: at-least-once, confirmar después del trabajo, ajustes de durabilidad
- `messaging` / `ordering-partitioning`: orden por partición y por clave, orden de mejor esfuerzo en SQS
- `messaging` / `ack-retry-dlq`: mensajes sin confirmar que vuelven tras una caída, visibility timeout
- `messaging` / `rabbitmq-exchanges-routing`: default exchange, cola durable, prefetch
- `messaging` / `kafka-topics-partitions-offsets`: particiones, claves, consumer groups, offsets confirmados
- `messaging` / `bullmq-redis`: `Queue`, `Worker`, concurrencia, jobs estancados (stalled)
- `messaging` / `sqs-sns`: polling, visibility timeout, eliminación explícita

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-queue-comparison.sh        # Linux and macOS
./setup-windows-queue-comparison.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos y las pruebas unitarias sin red, y luego prueba los brokers **uno a la vez** en una red interna (inicia el broker, ejecuta sus pruebas de integración, lo elimina), así Redis, RabbitMQ, Kafka y LocalStack nunca están activos juntos.

## Pruebas

```sh
docker compose run --rm ts-test          # type check (the four adapters implement QueueAdapter) and unit tests
docker compose run --rm test-bullmq      # also: test-rabbitmq, test-kafka, test-sqs
docker compose down -v
```

Cada servicio de pruebas de integración inicia solo su propio broker. Por broker: 1,000 mensajes enviados y 1,000 recibidos, el experimento de orden y el experimento de reentrega.

## Demo y benchmark

```sh
docker compose run --rm demo
docker compose down -v
```

Inicia los cuatro brokers a la vez (Kafka se ejecuta con un heap de 256 MiB), ejecuta los experimentos y el benchmark en cada uno, imprime las tablas y reescribe `results/results.md` y `results/results.json`. `BROKERS=kafka,rabbitmq`, `BENCH_MESSAGES=20000` y `BENCH_RUNS=5` cambian la ejecución.

## Todo es local

- La red de docker-compose es `internal`: ningún contenedor llega a internet y no se publica ningún puerto en el host.
- SQS es LocalStack. Las credenciales son las cadenas falsas `fake-lab-access-key` y `fake-lab-secret-key`, y nada llega a AWS.
- `ts/src/config.ts` se niega a iniciar cuando la dirección de un broker no es el loopback ni el nombre de un servicio de docker-compose, así que el benchmark no puede apuntarse al broker de otra persona.
- LocalStack está fijado en 4.14.0, la última imagen que inicia sin un token de cuenta. Las imágenes más nuevas necesitan una credencial real y un servidor de licencias en internet.

## Un duplicado que parecía un orden roto

La primera versión del adaptador de Kafka fallaba la prueba de orden por clave aproximadamente una de cada siete ejecuciones: los pedidos de un cliente llegaban como 0, 4, 8, 0, 4, 8, 12. Kafka no había reordenado nada. La primera solicitud de producción a un topic recién creado llevaba lotes para tres particiones, el broker respondió "not the leader" para una de ellas porque aún la estaba abriendo, y el cliente reintentó **toda** la solicitud. Las particiones que ya habían almacenado su lote lo almacenaron por segunda vez. El duplicado estaba en el propio log, así que todos los consumidores lo leyeron.

Dos cambios arreglaron la causa, y la aserción no se relajó:

- El productor es **idempotente**: cada lote se numera por partición y el broker descarta un número que ya almacenó, así que un reintento no puede duplicar.
- `prepare()` espera hasta que cada partición responde a una solicitud de offsets antes de usar el topic. "Creado" no es "listo".

Tras la corrección, la prueba de integración de Kafka pasó 10 ejecuciones seguidas, otras 5 con 16 contenedores consumiendo CPU a su lado, y 80 rondas de orden consecutivas con 0 solicitudes de producción reintentadas. RabbitMQ y BullMQ no reintentan una publicación por su cuenta. El SDK de AWS sí reintenta una llamada HTTP fallida, y una cola estándar de SQS no tiene deduplicación, lo cual es una razón más para que su orden se observe y no se verifique.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/queue.ts` | El contrato: `OrderProducer`, `OrderConsumer`, `QueueAdapter` |
| `ts/src/adapters/` | Un adaptador por broker, y el registro que verifica el compilador |
| `ts/src/experiments.ts` | Viaje de ida y vuelta, orden, reentrega y rendimiento, escritos una sola vez para todos los brokers |
| `ts/src/crash-consumer.ts` | El proceso consumidor que se mata en el experimento de reentrega |
| `ts/src/expected.ts` | Lo que garantiza cada broker, verificado por las pruebas de integración |
| `ts/src/demo.ts`, `ts/src/report.ts` | La demo y el reporte en Markdown |
