# pubsub-backpressure

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Dos preguntas que todo diseño de mensajería debe responder. **¿Quién recibe un mensaje?** Uno de varios workers (una cola de trabajo, consumidores concurrentes) o todos los suscriptores (publish/subscribe, fan-out). **¿Qué ocurre cuando el productor es más rápido que el consumidor?** O un buffer crece hasta agotar la memoria, o el consumidor presiona hacia atrás y el productor se ralentiza: contrapresión (backpressure). Este mini-proyecto responde ambas con experimentos en RabbitMQ, con un productor y un consumidor dentro de un mismo proceso, y con un pipeline de GenStage en Elixir.

Código: MP-MSG-3. Explicación completa: [docs/es/messaging/pubsub-backpressure.md](../../../docs/es/messaging/pubsub-backpressure.md).

```text
work queue:  producer -> [tasks] -> worker A | worker B | worker C      each message once
fan-out:     producer -> (fanout exchange) -> [q.A] -> subscriber A
                                           -> [q.B] -> subscriber B      a copy for each

no backpressure:  producer ==push==> [ buffer grows ... ] --> slow consumer
backpressure:     producer <--demand / full queue--  [ bounded ] --> slow consumer
```

## Dos lenguajes

| Carpeta | Qué muestra | Necesita |
| --- | --- | --- |
| `ts/` | Cola de trabajo frente a fan-out en RabbitMQ; el prefetch como contrapresión entre el broker y el consumidor; una cola acotada frente a una no acotada en un solo proceso, con la memoria medida | RabbitMQ en docker-compose (el experimento de memoria no necesita nada) |
| `elixir/` | Un pipeline de GenStage: el consumidor pide eventos y el productor envía solo lo pedido, frente a un `send/2` simple a un mailbox | Nada en tiempo de ejecución (GenStage se descarga al construir la imagen) |

## Resultados

TypeScript, generado por `docker compose run --rm demo`, guardado en [results/results.md](results/results.md).

### Cola de trabajo frente a fan-out

| Topología | Colas | Consumidores | Mensajes publicados | Recibidos por cada consumidor | Total de entregas |
| --- | --- | --- | --- | --- | --- |
| Cola de trabajo: una cola, consumidores concurrentes | 1 | 3 | 300 | 102, 100, 98 | 300 |
| Fan-out: una cola por suscriptor | 3 | 3 | 300 | 300, 300, 300 | 900 |
| Fan-out a 2 servicios, 3 instancias cada uno | 2 | 6 | 300 | 97, 99, 104, 102, 102, 96 | 600 |

El número de **colas** decide el número de copias, no el número de consumidores. La tercera fila es la forma habitual en producción: difusión entre servicios, competencia dentro de cada servicio.

### Dónde vive el backlog: el prefetch de RabbitMQ

Una cola empieza con 3,000 mensajes y un consumidor que tarda 2 ms por mensaje, observado durante 600 ms.

| Prefetch | Máximo de mensajes retenidos por el consumidor a la vez | Quedan en el broker | Procesados |
| --- | --- | --- | --- |
| sin límite | 2908 | 0 | 230 |
| 10 | 10 | 2758 | 232 |

Ambos consumidores procesaron la misma cantidad. Sin límite, el broker empujó todo el backlog al proceso del consumidor: la cola parece vacía, la memoria del consumidor lo contiene todo, y un segundo consumidor no recibiría nada. Con `prefetch(10)` el backlog se queda en el broker, que está hecho para almacenarlo.

### Productor más rápido que el consumidor, en un solo proceso

El productor intenta enviar 20 mensajes de 4 KiB por milisegundo; el consumidor procesa uno por milisegundo. La única diferencia entre las ejecuciones es la capacidad de la cola entre ellos.

| Buffer | Producidos | Consumidos | Pico de mensajes en espera | Crecimiento de la memoria del proceso (RSS) |
| --- | --- | --- | --- | --- |
| cola no acotada | 25920 | 1297 | 24623 | 103.3 MiB |
| cola acotada, capacidad 100 | 1388 | 1288 | 100 | -6.7 MiB |

| Tiempo | cola no acotada | cola acotada, capacidad 100 |
| --- | --- | --- |
| 5 ms | 0 (0.0 MiB) | 0 (0.0 MiB) |
| 432 ms | 4882 (19.1 MiB) | 100 (0.4 MiB) |
| 872 ms | 8644 (33.8 MiB) | 100 (0.4 MiB) |
| 1292 ms | 13983 (54.6 MiB) | 100 (0.4 MiB) |
| 1709 ms | 20101 (78.5 MiB) | 100 (0.4 MiB) |

El buffer no acotado crece en línea recta mientras dure la ejecución: unos 45 MiB por segundo aquí, sin más techo que la memoria de la máquina. El acotado se queda en su capacidad, y el productor, obligado a esperar por `await queue.push()`, produjo exactamente tan rápido como el consumidor consumió. La ejecución dura 2 segundos: "sin límite" se muestra como un crecimiento que nunca se ralentiza, no agotando la memoria de la máquina.

### GenStage (Elixir)

Impreso por `docker compose run --rm elixir-demo`. El consumidor tarda 1 ms por evento.

```text
pipeline                            events   peak buffer
push, no backpressure                 1000           999
push, no backpressure                10000          9997
push, no backpressure               100000         99983
GenStage, max_demand 10               1000            10
GenStage, max_demand 10               3000            10
GenStage, max_demand 100              3000           100
```

Con `send/2` el buffer es el mailbox del consumidor y sigue al número de eventos. Con GenStage sigue a la configuración: `max_demand`, sea cual sea el número de eventos.

## Temas del quiz que demuestra

- `messaging` / `queue-pubsub-stream`: consumidores concurrentes frente a publish/subscribe, cuántas veces se procesa un mensaje
- `messaging` / `rabbitmq-exchanges-routing`: fanout exchange, bindings, una cola por suscriptor, round-robin entre los consumidores de una cola
- `messaging` / `backpressure`: buffers no acotados, colas acotadas, prefetch, flujo guiado por la demanda con GenStage
- `messaging` / `sqs-sns`: el fan-out de SNS a SQS tiene la misma forma que el fanout exchange con una cola por servicio

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-pubsub-backpressure.sh        # Linux and macOS
./setup-windows-pubsub-backpressure.ps1    # Windows
```

El script construye las imágenes, ejecuta la verificación de tipos y las pruebas unitarias de TypeScript (que incluyen el experimento de memoria) y las pruebas de Elixir sin red, luego inicia RabbitMQ en una red interna para las pruebas de extremo a extremo, y lo elimina todo al final.

## Pruebas

```sh
docker compose run --rm ts-test       # type check, bounded queue, memory with and without backpressure
docker compose run --rm ts-e2e        # work queue, fan-out and prefetch, against RabbitMQ
docker compose run --rm elixir-test   # mix format --check-formatted and the GenStage tests
docker compose down -v
```

Lo que verifican las pruebas:

1. Una cola entrega cada mensaje una vez: 300 mensajes, 300 entregas, repartidas entre 3 workers. Un fan-out lo entrega a cada suscriptor: 300 mensajes, 300 para cada uno de los 3 suscriptores.
2. Sin contrapresión el buffer es mayor al final de cada cuarto de la ejecución y la memoria residente crece más de 15 MiB; con una capacidad de 100 el buffer nunca pasa de 100 mensajes y la memoria residente crece menos de 10 MiB.
3. Un consumidor GenStage con `max_demand: 10` nunca tiene más de 10 eventos en vuelo mientras pasan 2,000 eventos; un `send/2` simple deja todo el flujo en el mailbox.

## Demo

```sh
docker compose run --rm demo          # TypeScript: prints the tables and rewrites results/results.md
docker compose run --rm elixir-demo   # Elixir: push against GenStage
docker compose down -v
```

## Notas

- RabbitMQ 4.3 rechaza las colas transitorias que no son exclusivas, por eso las colas del laboratorio se declaran durables y auto-delete.
- La imagen de Elixir es `elixir:1.20.4-otp-28-alpine`: la variante slim de Debian no tiene certificados CA y no puede llegar a Hex durante la construcción.
- `gen_stage` está fijado en 1.3.2 en `mix.exs` y `mix.lock`, y la construcción usa `mix deps.get --check-locked`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/rabbit.ts` | Cola de trabajo, fan-out y el experimento de prefetch |
| `ts/src/backpressure.ts` | `BoundedQueue` y la ejecución productor/consumidor con muestras de memoria |
| `ts/src/demo.ts` | La demo y el reporte |
| `elixir/lib/pubsub_backpressure/stages.ex` | Productor y consumidor de GenStage |
| `elixir/lib/pubsub_backpressure/meter.ex` | Cuenta los eventos en vuelo y guarda el pico |
| `elixir/lib/pubsub_backpressure.ex` | `demand/2`, `push/2` y la demo |
