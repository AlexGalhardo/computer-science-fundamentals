# Comparación de colas (MP-MSG-1)

> English version: [docs/en/messaging/queue-comparison.md](../../en/messaging/queue-comparison.md) · Versão em português: [docs/pt/messaging/queue-comparison.md](../../pt/messaging/queue-comparison.md)

Mini-proyecto: [`projects/messaging/queue-comparison`](../../../projects/messaging/queue-comparison/README.es.md). Temas del quiz: `queue-pubsub-stream`, `delivery-guarantees`, `ordering-partitioning`, `ack-retry-dlq`, `rabbitmq-exchanges-routing`, `kafka-topics-partitions-offsets`, `bullmq-redis`, `sqs-sns`.

## La pregunta

"Usa una cola" esconde una elección. BullMQ, RabbitMQ, Kafka y SQS mueven un mensaje de un productor a un consumidor, y una interfaz pequeña puede ocultar cuál se está usando. Lo que la interfaz no puede ocultar es el comportamiento: en qué orden llegan los mensajes, qué ocurre con un mensaje cuyo consumidor murió y qué tan rápido va todo. Este mini-proyecto ejecuta una tarea en los cuatro y mide esas tres cosas.

## Una tarea, una interfaz

La tarea: un mensaje `OrderPlaced` hace que un consumidor envíe un correo de confirmación (simulado).

```ts
interface OrderProducer { send(orders: OrderPlaced[]): Promise<void>; close(): Promise<void> }
interface OrderConsumer { stop(): Promise<void> }
interface QueueAdapter {
  prepare(options?: { partitions?: number }): Promise<void>;
  createProducer(): Promise<OrderProducer>;
  consume(handler: OrderHandler, options: { parallelism: number }): Promise<OrderConsumer>;
}
```

`send` se resuelve cuando el broker confirmó los mensajes. Un mensaje se confirma solo después de que la promesa del handler se resuelve, así que todos los adaptadores son **at-least-once**. Cada clase de adaptador se declara `implements QueueAdapter` y el registro se tipa `satisfies Record<BrokerName, ...>`: un adaptador faltante o incompleto es un error de compilación.

## Cuatro modelos detrás de la interfaz

| | Dónde vive un mensaje | Cómo lo obtiene un consumidor | Qué es "confirmar" | Cómo se detecta un consumidor muerto |
| --- | --- | --- | --- | --- |
| BullMQ | Listas, conjuntos ordenados y hashes en Redis | El worker se bloquea en Redis y mueve el job a `active` | El job se mueve a `completed` | El lock del job no se renueva y expira (job estancado, stalled) |
| RabbitMQ | Una cola dentro del broker | El broker empuja por un canal abierto, hasta el prefetch | `ack` del delivery tag | La conexión se cierra |
| Kafka | Una partición de un log, conservada por la retención | El consumidor lee (fetch) desde un offset | Un commit de "el siguiente offset a leer" para el grupo | Los heartbeats se detienen y la sesión expira |
| SQS | Una cola detrás de una API HTTP | El consumidor hace polling (`ReceiveMessage`) | `DeleteMessage` con el receipt handle | Nada lo detecta: el visibility timeout simplemente termina |

## Experimento 1: orden

Se envían 200 pedidos en secuencia y los lee un consumidor que procesa un mensaje a la vez.

- **BullMQ y RabbitMQ**: una cola, un consumidor, primero en entrar primero en salir. Se conserva el orden.
- **Kafka**: el topic tiene 3 particiones y la clave es el id del cliente. El orden existe solo dentro de una partición, así que el consumidor ve los pedidos de cada cliente en orden, y los clientes intercalados de la manera en que se leyeron las particiones. En la ejecución guardada, 148 de 200 mensajes llegaron después de un mensaje enviado más tarde. Es el diseño: las particiones compran paralelismo y renuncian al orden total.
- **SQS estándar**: el orden es de mejor esfuerzo. LocalStack entregó en orden por casualidad; el servicio real no lo promete, así que la prueba registra el resultado y no verifica nada. El orden estricto necesita una cola FIFO y un `MessageGroupId`.

Un duplicado puede pasar por un reordenamiento. Una versión anterior de este laboratorio vio los pedidos de un cliente llegar como 0, 4, 8, 0, 4, 8, 12: la primera solicitud de producción a un topic recién creado recibió "not the leader" para una de sus tres particiones, el cliente reintentó toda la solicitud, y las otras particiones almacenaron su lote dos veces. La corrección fue un productor idempotente (el broker descarta un número de lote que ya almacenó) y esperar a que cada partición responda antes de usar el topic. El README cuenta toda la historia.

El experimento mantiene un solo consumidor a propósito. Con varios consumidores en una cola, los mensajes se procesan en paralelo y los efectos pueden ocurrir fuera de orden en cualquier broker, sea FIFO o no.

## Experimento 2: el consumidor falla antes de confirmar

Un consumidor en un proceso separado recibe el mensaje y se mata con `SIGKILL` mientras el handler aún se está ejecutando. Los cuatro brokers entregan el mensaje de nuevo, que es lo que significa at-least-once, pero detectan la muerte de formas distintas y a velocidades distintas:

- **RabbitMQ**: la conexión TCP se cierra con el proceso, la entrega sin confirmar vuelve a la cola de inmediato, y la segunda entrega lleva `redelivered = true`.
- **BullMQ**: nadie renueva el lock del job. Cuando expira (3 s en este laboratorio, 30 s por defecto) el job se declara estancado y vuelve a esperar.
- **Kafka**: el group coordinator deja de recibir heartbeats y, tras el session timeout (6 s aquí), elimina al miembro y reequilibra (rebalance). El nuevo dueño de la partición empieza desde el último offset confirmado. No hay un indicador "redelivered": desde el punto de vista de Kafka no se reentregó nada, simplemente nunca se confirmó un offset.
- **SQS**: el servicio no sabe que el consumidor murió. El mensaje reaparece cuando termina su visibility timeout (5 s aquí), con `ApproximateReceiveCount` igual a 2.

La consecuencia práctica es la misma en todos: un handler puede ejecutarse dos veces para un mensaje, así que su efecto debe ser idempotente. Ese es el tema de [idempotency-dlq](idempotency-dlq.md).

## Experimento 3: rendimiento (throughput)

Cada ejecución envía 5,000 mensajes, luego inicia un consumidor y espera a todos. Producir y consumir se cronometran por separado; el tiempo de consumo va de la primera a la última entrega, así que el arranque del consumidor (unirse a un grupo en Kafka toma segundos) queda excluido. Se descarta una ejecución de calentamiento, se miden tres, y la tabla reporta la media con la ejecución más baja y la más alta.

Los números guardados y la máquina están en el [README](../../../projects/messaging/queue-comparison/README.es.md) y en `results/results.md`. Describen un broker de un solo nodo y un cliente en un portátil:

- Kafka gana por un margen amplio en lectura por su modelo, no por ajustes: log secuencial, lecturas grandes, un commit por lote.
- RabbitMQ y BullMQ pagan la confirmación por mensaje. BullMQ además ejecuta un script Lua en Redis por cada cambio de estado de un job.
- SQS es una API HTTP con un máximo de 10 mensajes por llamada, y aquí es un emulador. El número es un límite inferior para "una cola HTTP consultada en lotes de 10", no una medida de AWS.

## Ejecutar todo localmente

Los brokers viven en una red `internal` de docker-compose sin puertos publicados. Cada servicio de pruebas de integración depende solo de su propio broker, y el script de setup los prueba uno a la vez, eliminando cada uno antes de iniciar el siguiente. El cargador de configuración rechaza cualquier dirección de broker que no sea el loopback o el nombre de un servicio de docker-compose.

LocalStack está fijado en 4.14.0. Desde las versiones siguientes la imagen se niega a iniciar sin un token de cuenta validado contra un servidor en internet, lo que contradice las reglas de este repositorio (sin credenciales reales, sin red externa). Consulta [el README](../../../projects/messaging/queue-comparison/README.es.md#todo-es-local).

## Qué llevarse

- Una interfaz puede unificar la API de los brokers, nunca sus garantías.
- El orden es una propiedad de una cola con un consumidor, o de una partición. Todo lo demás es de mejor esfuerzo.
- At-least-once es el terreno común de los cuatro. La diferencia es cuánto tiempo permanece perdido un mensaje perdido: de vuelta al instante en RabbitMQ, a un timeout de distancia en los otros tres.
- El rendimiento sigue al modelo de confirmación: por mensaje, por lote o por offset.
