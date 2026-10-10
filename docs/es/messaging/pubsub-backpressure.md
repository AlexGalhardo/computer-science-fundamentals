# Cola, pub/sub y backpressure (MP-MSG-3)

> English version: [docs/en/messaging/pubsub-backpressure.md](../../en/messaging/pubsub-backpressure.md) · Versão em português: [docs/pt/messaging/pubsub-backpressure.md](../../pt/messaging/pubsub-backpressure.md)

Mini-proyecto: [`projects/messaging/pubsub-backpressure`](../../../projects/messaging/pubsub-backpressure/README.es.md). Temas del quiz: `queue-pubsub-stream`, `rabbitmq-exchanges-routing`, `backpressure`, `sqs-sns`.

## Parte 1: ¿quién recibe un mensaje?

### Cola de trabajo: consumidores concurrentes

Una cola, varios consumidores. El broker entrega cada mensaje a **uno** de ellos, por turnos. Agregar un consumidor reparte el mismo trabajo entre más manos: el número total de entregas no cambia. Así se escala una tarea lógica (enviar el correo, redimensionar la imagen).

### Fan-out: publish/subscribe

Un exchange de tipo `fanout`, y **una cola por suscriptor**. El exchange copia cada mensaje en todas las colas enlazadas a él, así que cada suscriptor recibe todos. Agregar un suscriptor agrega una copia completa más del flujo. El productor nombra solo el exchange y no sabe quién escucha.

### La regla que cubre ambos

En RabbitMQ existe una copia **por cola**, nunca por consumidor. Que los suscriptores compartan o dupliquen un mensaje lo decide cuántas colas hay:

| Se quiere | Topología |
| --- | --- |
| Cada mensaje procesado una vez, por cualquiera de N workers | 1 cola, N consumidores |
| Cada uno de N servicios ve todos los mensajes | N colas enlazadas a un exchange, 1 consumidor cada una |
| Cada uno de N servicios ve todos los mensajes, y cada servicio ejecuta M instancias | N colas, M consumidores en cada una |

El laboratorio ejecuta las tres filas con 300 mensajes y verifica 300, 900 y 600 entregas. La misma regla vale en otros lugares con otros nombres: un consumer group de Kafka es "una cola", y un topic de SNS con una cola SQS por servicio es el fan-out.

## Parte 2: ¿y si el productor es más rápido?

Un buffer entre un productor y un consumidor absorbe ráfagas. No puede absorber una diferencia de velocidad sostenida: si llegan 20 mensajes por milisegundo y sale 1, el buffer crece 19 por milisegundo mientras dure la diferencia. Algo tiene que ceder, y solo hay tres opciones: crecer (hasta que se acabe la memoria), descartar, o **frenar al productor**. La tercera es la contrapresión (backpressure).

### En un solo proceso

```ts
await queue.push(message);   // resolves only when there is room
```

Ese `await` es todo el mecanismo. Con una cola no acotada la promesa siempre se resuelve de inmediato, el productor nunca espera, y el laboratorio mide un buffer que crece en línea recta (unos 45 MiB por segundo) junto con la memoria residente del proceso. Con una capacidad de 100 el buffer se queda en 100 mensajes, la memoria se mantiene plana, y el productor termina produciendo exactamente tan rápido como el consumidor consume. El costo también se ve en la tabla: el productor acotado envió 1,388 mensajes en lugar de 25,920. La contrapresión no hace el sistema más rápido; hace que la parte lenta sea visible para la parte rápida en lugar de esconderla en un buffer.

### Entre un broker y un consumidor: prefetch

Un broker también es un buffer, y un mejor lugar para un backlog que la memoria de un consumidor: puede guardarlo en disco y repartirlo entre consumidores. RabbitMQ empuja los mensajes a los consumidores, así que sin un límite empuja todo. El prefetch count (`basic.qos`) es el límite: como máximo esa cantidad de mensajes sin confirmar por consumidor, y el siguiente se envía solo cuando llega un ack.

El laboratorio empieza con 3,000 mensajes en cola y un consumidor lento. Sin prefetch el consumidor retuvo 2,908 a la vez y la cola quedó vacía; con `prefetch(10)` retuvo 10 y 2,758 se quedaron en el broker. La cantidad de trabajo realizado fue la misma.

### Entre etapas: demanda (GenStage)

GenStage incorpora la misma idea en el protocolo entre etapas. Los datos fluyen hacia abajo (downstream), **la demanda fluye hacia arriba (upstream)**:

```text
producer  <---- "send me 10" ----  consumer
producer  ----- 10 events ------>  consumer
```

Un productor implementa `handle_demand(demand, state)` y puede devolver como máximo `demand` eventos. Un consumidor se suscribe con `max_demand` (la mayor cantidad de eventos que acepta en vuelo) y `min_demand` (el nivel en el que pide más). Por lo tanto, la etapa más lenta marca el ritmo de todo el pipeline, y el buffer es un número en la configuración.

El lado de Elixir lo contrasta con un `send/2` simple, que nunca bloquea y no da ninguna señal al emisor: el mailbox del consumidor termina guardando todo el flujo (99,983 de 100,000 eventos). Con GenStage el pico es 10 para `max_demand: 10` y 100 para `max_demand: 100`, pasen 1,000 o 3,000 eventos.

## Qué llevarse

- Cuenta las colas, no los consumidores, para saber cuántas veces se procesa un mensaje.
- Un buffer no acotado no resuelve una diferencia de velocidad; pospone el fallo y lo hace mayor.
- La contrapresión es una señal que viaja contra los datos: una cola llena que hace esperar a `push`, una ventana de prefetch, un mensaje de demanda.
- Pon el backlog donde es más barato de guardar y más fácil de ver: en el broker, no en el heap del consumidor.
