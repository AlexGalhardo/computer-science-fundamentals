# structured-logs

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cómo se sigue **una petición** a través de tres servicios cuando sus logs se mezclan con los logs de todas las demás peticiones? Este miniproyecto ejecuta el mismo sistema dos veces: una escribiendo **logs JSON estructurados con un correlation id**, y otra escribiendo **texto libre**. Una petición entra en `api`, va a `orders` por HTTP y llega a `worker` por una cola de RabbitMQ. Todas las líneas van a Loki, y luego se hace la misma pregunta a ambas variantes: "muéstrame todas las líneas de log de esta petición".

Código: MP-OBS-2. Explicación completa: [docs/es/observability/structured-logs.md](../../../docs/es/observability/structured-logs.md).

```text
client --X-Correlation-Id--> api --X-Correlation-Id--> orders --AMQP correlationId--> [queue] --> worker
                              |                          |                                          |
                              +--------------------------+------- log lines --> Loki <--------------+
```

## La misma búsqueda en ambas variantes

Salida real de `docker compose run --rm demo`, versionada en [results/results.md](results/results.md). Ambas variantes recibieron los mismos 4 checkouts concurrentes, y cada petición escribió 6 líneas (2 en cada servicio). La pregunta: todas las líneas de la primera petición (alice, 2 x blue-pen).

**Estructurado (JSON), por correlation id: 6 de 6 líneas, de los tres servicios.**

```logql
{format="json"} | json | correlation_id="req-json-1-9ef19148"
```

```text
{"customer":"alice","sku":"blue-pen","qty":2,"timestamp":"2026-10-08T01:40:47.437Z","level":"info","service":"api","message":"checkout received","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","customer":"alice","sku":"blue-pen","qty":2,"timestamp":"2026-10-08T01:40:47.439Z","level":"info","service":"orders","message":"order created","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","queue":"orders.json","timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"orders","message":"order queued","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"worker","message":"order picked up","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","status":201,"duration_ms":4,"timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"api","message":"checkout answered","correlation_id":"req-json-1-9ef19148"}
{"order_id":"ord-1244c436","customer":"alice","duration_ms":6,"timestamp":"2026-10-08T01:40:47.447Z","level":"info","service":"worker","message":"confirmation sent","correlation_id":"req-json-1-9ef19148"}
```

**No estructurado (texto), por id de pedido, el único id que tienen las frases: 3 de 6 líneas.** El punto de entrada (`api`) y el último paso del worker nunca escribieron el id del pedido, por eso no se encuentran.

```logql
{format="text"} |= "ord-1ed68350"
```

```text
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [orders] order ord-1ed68350 sent to queue
2026-10-08 01:40:47 INFO [worker] Processing ord-1ed68350
```

**No estructurado (texto), por nombre de cliente, para alcanzar las frases que faltan: 6 líneas de 2 peticiones distintas.** Alice compró dos veces, y nada en las líneas dice cuál es cuál.

```logql
{format="text"} |= "alice"
```

```text
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 1 x red-pen
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 2 x blue-pen
2026-10-08 01:40:47 INFO [orders] Created order ord-60eb4168 (alice, 1 x red-pen)
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
```

| | JSON estructurado | Texto libre |
| --- | --- | --- |
| Consulta | `\| json \| correlation_id="..."` | `\|= "substring"` |
| Líneas de la petición encontradas | 6 de 6 | 3 de 6 por id de pedido |
| Líneas de otras peticiones | ninguna | se mezclan al buscar por cliente |
| Cruza la cola | sí, las líneas del worker llevan el id | solo donde una frase repite el id del pedido |
| Otras preguntas (`duration_ms > 500`, `level="error"`) | un filtro por campo | una regex nueva por frase |

## Qué enseña

- Un **log estructurado** es un objeto JSON por línea: claves fijas (`timestamp` en UTC ISO 8601, `level`, `service`, `message`) más un campo por valor. Una máquina lo filtra por campo; el texto libre necesita una regex frágil por frase.
- Un **correlation id** se crea en el borde (o se acepta de quien llama cuando es válido), se escribe en cada línea, y se devuelve en el encabezado de la respuesta.
- **Propagación**: por HTTP en el encabezado `X-Correlation-Id`, y por la cola en la propiedad del mensaje AMQP `correlationId`. Si un salto lo olvida, el rastro termina ahí.
- **`AsyncLocalStorage`** conserva el id de la petición actual a través de `await`, así el logger lo agrega sin que cada función lo reciba como parámetro.
- **Los labels de Loki son para baja cardinalidad** (`service`, `format`). El correlation id se queda dentro de la línea: como label crearía un stream por petición.
- El id viene de fuera, así que se **valida** antes de llegar a una línea de log o a una consulta (log injection).

## Temas del quiz que demuestra

- `observability` / `structured-logs`: JSON frente a texto libre, correlation id, campos de log, qué va en un label de Loki, filtros de LogQL
- `observability` / `three-signals`: en qué son buenos los logs (el detalle de una petición) y qué cuestan
- `observability` / `distributed-tracing`: propagación de contexto por encabezados HTTP y por una cola de mensajes
- `observability` / `prometheus-grafana-loki-tempo`: Loki indexa solo labels; selector de stream de LogQL, filtro de línea y `| json`

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-structured-logs.sh        # Linux y macOS
./setup-windows-structured-logs.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas unitarias sin red, levanta ambas variantes de los tres servicios con el broker y Loki en una red interna, ejecuta la prueba de extremo a extremo, y lo elimina todo al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Envía los cuatro checkouts a ambas variantes, imprime las tres búsquedas de arriba y reescribe `results/results.md`.

## Pruebas

```sh
docker compose run --rm ts-test     # type check + 18 unit tests, no network
docker compose run --rm e2e-test    # 7 end-to-end tests against the running stack
docker compose down -v
```

- Unitarias: los dos formatos, validación y generación del id, `AsyncLocalStorage` manteniendo separadas las peticiones intercaladas, el id cruzando una cola falsa, el cuerpo del push a Loki, construcción de consultas.
- De extremo a extremo (MP-OBS-2.1): cuatro peticiones concurrentes por variante; **una consulta LogQL** devuelve las 6 líneas de una petición, de los tres servicios, y ninguna línea de otra petición. Como contraste, la búsqueda de texto por id de pedido encuentra 3 de 6 líneas y la búsqueda por cliente mezcla dos peticiones.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/correlation.ts` | Validación y generación del id, y el `AsyncLocalStorage` que lo lleva |
| `ts/src/logger.ts` | Un logger, dos formatos: `formatJson` y `formatText` |
| `ts/src/shipper.ts` | Agrupa las líneas en lotes y las envía a Loki (`POST /loki/api/v1/push`) |
| `ts/src/broker.ts` | RabbitMQ: el id viaja en la propiedad de mensaje `correlationId` |
| `ts/src/apps.ts` | Los tres servicios como funciones: `apiApp`, `ordersApp`, `workerHandler` |
| `ts/src/api.ts`, `orders.ts`, `worker.ts`, `runtime.ts` | Puntos de entrada e inicio compartido |
| `ts/src/lab.ts`, `ts/src/demo.ts` | El escenario, el cliente de consultas de Loki y la demo |
| `ts/tests/` | `unit.test.ts` y `e2e.test.ts` |
| `config/loki.yaml` | Loki en un solo proceso, con el reporte de uso desactivado |
| `docker-compose.yml` | Ambas variantes, broker y Loki en una red interna, sin puertos publicados |

## Versiones fijadas

| Qué | Versión |
| --- | --- |
| `oven/bun` | 1.4.2 |
| `grafana/loki` | 3.7.8 |
| `rabbitmq` | 4.3.6-alpine |
| `amqplib` / `@types/amqplib` | 2.2.0 / 0.10.8 |
| `zod` | 4.6.5 |
| `typescript` / `@types/bun` | 7.0.2 / 1.4.2 |

Todas están en el stack del repositorio; no se agregó ninguna otra dependencia.

## Límites del laboratorio

- El shipper vive dentro del proceso para mantener pequeño el laboratorio. En producción el servicio escribe en stdout y un agente (Grafana Alloy, el OpenTelemetry Collector) lo sigue y lo envía.
- Un correlation id enlaza líneas de log. No registra padre e hijo, ni duraciones por paso: eso es lo que hace un trace (ve [three-signals](../three-signals/README.es.md)).
- Todo es local: red interna, ningún puerto publicado, reporte de uso desactivado en Loki, credenciales falsas.
