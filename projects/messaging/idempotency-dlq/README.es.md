# idempotency-dlq

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cómo sobrevive un consumidor a los mensajes que llegan dos veces y a los mensajes que nunca podrán procesarse? Los brokers entregan **al menos una vez**, así que los duplicados son normales, y un mensaje malo reintentado para siempre puede detener una cola. Este mini-proyecto muestra primero el daño (un consumidor sin protección acredita una cuenta 2,5 veces de más) y luego las dos defensas estándar: un **almacén de claves de idempotencia** escrito en la misma transacción que el efecto, y **reintentos con backoff exponencial** que terminan en una **dead-letter queue**.

Código: MP-MSG-2. Explicación completa: [docs/es/messaging/idempotency-dlq.md](../../../docs/es/messaging/idempotency-dlq.md).

```text
publisher --> [work] --> consumer --ok--> ack
                ^           |
                |           +--failed, attempts left--> [retry.N]  waits base x 2^(N-1)
                +------ TTL expired, dead-lettered back ----+
                            |
                            +--invalid, or no attempts left--> reject --> [dlq]
```

## Dos lenguajes, dos mitades de la lección

| Carpeta | Qué muestra | Necesita |
| --- | --- | --- |
| `ts/` | La versión duradera: reentrega de RabbitMQ, una tabla `processed_messages` con clave primaria insertada en la misma transacción de PostgreSQL que el crédito, colas de espera con un TTL por cada paso del backoff, y el dead-letter exchange de RabbitMQ | RabbitMQ y PostgreSQL en docker-compose |
| `go/` | La concurrencia detrás de esto: dos goroutines que sostienen el mismo mensaje en el mismo instante, un almacén que verifica y marca en dos pasos (incorrecto) frente a uno que hace ambos en una sola sección crítica (correcto), sobre un broker at-least-once en memoria | Nada: solo la biblioteca estándar, sin red |

## Resultados

TypeScript, generado por `docker compose run --rm demo`, guardado en [results/results.md](results/results.md). Cada mensaje se publica dos veces y el consumidor pierde la confirmación del 20% de las entregas después de aplicar el efecto. Cada mensaje acredita 1.00.

| Consumidor | Mensajes | Entregas | Menor número de entregas de un mensaje | Efectos aplicados | Saldo | Saldo esperado |
| --- | --- | --- | --- | --- | --- | --- |
| `naive` | 1000 | 2521 | 2 | **2521** | **2521.00** | 1000.00 |
| `idempotent` | 1000 | 2521 | 2 | 1000 | 1000.00 | 1000.00 |

Un mensaje envenenado (forma válida, cuenta desconocida) con 4 intentos y un backoff que empieza en 200 ms, más uno malformado, entre 20 mensajes sanos:

| Intento del mensaje envenenado | Espera desde el intento anterior |
| --- | --- |
| 1 | primera entrega |
| 2 | 203 ms |
| 3 | 403 ms |
| 4 | 803 ms |

| Mensaje en la dead-letter queue | Se rindió en el intento | Motivo registrado por RabbitMQ |
| --- | --- | --- |
| `malformed` | 1 | rejected |
| `poison` | 4 | rejected |

El mensaje malformado es un fallo **permanente**, por eso va a la dead-letter queue de inmediato sin gastar intentos. Los 20 mensajes sanos se aplicaron todos: los malos no bloquearon la cola.

Go, impreso por `docker compose run --rm go-demo`:

```text
store          deliveries    effects    balance
none                 2494       2494    2494.00
racy                 2494       1019    1019.00
atomic               2494       1000    1000.00
```

El almacén con condición de carrera acierta la mayor parte del tiempo, y eso es lo que hace peligroso el bug: solo falla cuando dos workers sostienen el mismo id a la vez, por eso su número cambia de una ejecución a otra. Una prueba fuerza ese entrelazado y obtiene 2 efectos siempre.

## Temas del quiz que demuestra

- `messaging` / `idempotent-consumers`: operaciones idempotentes, la tabla de deduplicación en la misma transacción, la carrera check-then-act, la clave de idempotencia
- `messaging` / `ack-retry-dlq`: confirmación (acknowledgement), mensaje envenenado, backoff exponencial, fallo transitorio frente a permanente, dead-letter queue
- `messaging` / `delivery-guarantees`: at-least-once, la ventana entre el efecto y el ack, efecto exactly-once
- `messaging` / `rabbitmq-exchanges-routing`: dead-letter exchange, TTL de cola, routing keys
- `messaging` / `kafka-topics-partitions-offsets`, `bullmq-redis`, `sqs-sns`: las preguntas sobre reentrega y deduplicación apuntan aquí, porque la defensa es la misma en cada broker

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-idempotency-dlq.sh        # Linux and macOS
./setup-windows-idempotency-dlq.ps1    # Windows
```

El script construye las imágenes, ejecuta la verificación de tipos y las pruebas unitarias de TypeScript y las comprobaciones de Go sin red, luego inicia RabbitMQ y PostgreSQL en una red interna para las pruebas de extremo a extremo, y lo elimina todo al final.

## Pruebas

```sh
docker compose run --rm ts-test   # type check and unit tests (backoff, schema, report)
docker compose run --rm ts-e2e    # the three acceptance tests, against RabbitMQ and PostgreSQL
docker compose run --rm go-test   # gofmt, go vet, golangci-lint, go test -race
docker compose down -v
```

Las pruebas de aceptación (`ts/tests/e2e.test.ts`, replicadas en `go/idempotency_test.go`):

1. Sin protección, el efecto secundario se aplica más de una vez (un efecto por entrega).
2. Con el almacén, 1,000 mensajes entregados al menos dos veces producen exactamente 1,000 efectos.
3. Un mensaje envenenado termina en la dead-letter queue tras los intentos configurados, y cada reintento espera al menos su paso de backoff.

## Demo

```sh
docker compose run --rm demo      # TypeScript: prints the tables and rewrites results/results.md
docker compose run --rm go-demo   # Go: prints the comparison of the three stores
docker compose down -v
```

## Límites que conviene conocer

- El "crash" entre el efecto y el ack se simula con un acuse negativo con reencolado, que es lo que hace el broker cuando un consumidor muere. Una terminación real del proceso se muestra en [queue-comparison](../queue-comparison/README.es.md).
- Publicar la copia de reintento y confirmar el original son dos pasos. Un fallo entre ambos duplica el mensaje, lo cual es aceptable solo porque el handler es idempotente.
- `processed_messages` crece para siempre aquí. Un sistema real expira los ids antiguos, y la ventana debe ser más larga que el mayor retraso posible de reentrega.
- PostgreSQL se ejecuta con `synchronous_commit=off` porque la base de datos del laboratorio es desechable. Las transacciones siguen siendo atómicas; no copies esa configuración para datos que importan.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/core.ts` | Esquema del mensaje, fórmula de backoff, aleatorio con semilla, configuración |
| `ts/src/db.ts` | El crédito, el handler ingenuo y el handler idempotente |
| `ts/src/pipeline.ts` | Topología de RabbitMQ, consumidor con reintento, backoff y dead-lettering |
| `ts/src/scenarios.ts`, `ts/src/demo.ts` | Los escenarios y el reporte |
| `go/store.go` | `NoStore`, `RacyStore`, `AtomicStore` |
| `go/broker.go` | Broker at-least-once en memoria con backoff y dead-letter queue |
