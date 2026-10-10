# Logs estructurados e id de correlación (MP-OBS-2)

> English version: [docs/en/observability/structured-logs.md](../../en/observability/structured-logs.md) · Versão em português: [docs/pt/observability/structured-logs.md](../../pt/observability/structured-logs.md)

Miniproyecto: [`projects/observability/structured-logs`](../../../projects/observability/structured-logs/README.es.md). Temas del quiz: `structured-logs`, `three-signals`, `distributed-tracing`, `prometheus-grafana-loki-tempo`.

## El problema

Un checkout pasa por tres servicios: `api` lo recibe, `orders` crea el pedido, y `worker` lo toma de una cola y envía la confirmación. Cada servicio escribe su propio log, y en cualquier momento hay decenas de peticiones en curso, así que sus líneas se intercalan. Cuando un cliente se queja, la pregunta es simple, "¿qué pasó con esta petición?", y los logs deben responderla.

## 1. Texto libre: escrito para personas

```text
2026-10-08 01:40:47 INFO [api] Checkout request from alice for 2 x blue-pen
2026-10-08 01:40:47 INFO [orders] Created order ord-1ed68350 (alice, 2 x blue-pen)
2026-10-08 01:40:47 INFO [worker] Confirmation sent to alice
```

Cada línea es una frase que tenía sentido para quien la escribió. De ahí siguen tres problemas:

- **Ninguna clave común.** La primera línea no tiene id de pedido (todavía no existe), la última lo olvidó. Una búsqueda por id de pedido encuentra 3 de las 6 líneas de la petición.
- **Las demás claves son ambiguas.** El nombre del cliente llega a las otras líneas, pero Alice compró dos veces, y las líneas de ambas compras vuelven mezcladas.
- **Cada pregunta necesita una regex nueva.** "Peticiones más lentas que 500 ms" significa extraer un número del medio de una frase, con un patrón que se rompe cuando alguien reformula el texto.

## 2. Estructurado: escrito para máquinas

```json
{"order_id":"ord-1244c436","status":201,"duration_ms":4,"timestamp":"2026-10-08T01:40:47.441Z","level":"info","service":"api","message":"checkout answered","correlation_id":"req-json-1-9ef19148"}
```

Un objeto JSON por línea. Las reglas usadas en el laboratorio:

- **Claves fijas en cada línea**: `timestamp` (UTC, ISO 8601, así las líneas de máquinas en husos horarios distintos se ordenan como texto plano), `level`, `service`, `message`, `correlation_id`.
- **`message` es un nombre constante del evento**, nunca una frase con valores adentro. Los valores van en campos: `order_id`, `duration_ms`, `status`.
- **Un campo, un significado, un tipo** entre servicios: `duration_ms` es siempre un número de milisegundos.
- **Sin secretos y sin datos personales.** Un log se copia, se indexa y se conserva por mucho tiempo.

Ahora una pregunta es un filtro sobre un campo, y sigue funcionando cuando cambia la redacción de un mensaje.

## 3. El id de correlación

Un correlation id es un valor compartido por todo lo que causa una petición.

```ts
const correlationId = correlationIdFrom(request.headers.get("x-correlation-id"));
return runWithCorrelation(correlationId, async () => {
	const response = await handler();
	response.headers.set("x-correlation-id", correlationId);
	return response;
});
```

- Se **crea en el borde**, o se acepta de quien llama cuando es válido, así una cadena que empezó aguas arriba continúa.
- Se **valida** (`^[A-Za-z0-9._-]{8,64}$`). El valor viene de fuera: un salto de línea en él falsificaría una línea de log (log injection), y una comilla cambiaría una consulta construida con él.
- Se **devuelve en el encabezado de la respuesta**, para que quien llama pueda citarlo en un reporte de error.

### Llevarlo dentro del proceso

Pasar el id como parámetro a cada función no escala. `AsyncLocalStorage` es una variable ligada a una cadena de llamadas asíncronas: cualquier código alcanzado por `await` lee el id de su propia petición, incluso mientras otras peticiones corren intercaladas en el mismo thread. El logger lo lee ahí, así que el código que registra nunca menciona el id.

### Llevarlo entre procesos

El id debe salir del proceso junto con el trabajo, y cada transporte tiene su lugar para los metadatos:

| Salto | Por dónde viaja el id |
| --- | --- |
| `api` -> `orders` (HTTP) | el encabezado de petición `X-Correlation-Id` |
| `orders` -> `worker` (RabbitMQ) | la propiedad `correlationId` del mensaje AMQP |

```ts
channel.sendToQueue(queue, body, { correlationId: currentCorrelationId() });
// ... later, in another process:
const correlationId = correlationIdFrom(message.properties.correlationId);
runWithCorrelation(correlationId, () => handler(payload));
```

La cola es donde los rastros suelen romperse: el worker corre después, en otro proceso, sin ninguna petición HTTP de donde leer un encabezado. Si quien publica no adjunta el id, o quien consume no lo restaura, las líneas del worker no pertenecen a ninguna petición.

## 4. Encontrar la petición: LogQL

Loki indexa solo los **labels** de un stream, no el contenido de las líneas. Una consulta primero selecciona streams por label y luego filtra sus líneas:

```logql
{format="json"} | json | correlation_id="req-json-1-9ef19148"
```

| Parte | Qué hace |
| --- | --- |
| `{format="json"}` | selector de stream: usa el índice |
| `\| json` | analiza cada línea y convierte sus claves en campos |
| `correlation_id="..."` | conserva las líneas cuyo campo tiene ese valor |

En texto libre la mejor herramienta es el filtro de línea, que conserva las líneas que contienen una subcadena:

```logql
{format="text"} |= "ord-1ed68350"
```

La prueba de extremo a extremo envía cuatro checkouts concurrentes a cada variante y comprueba ambas: la consulta JSON devuelve las 6 líneas de una petición, de los tres servicios, y ninguna línea de otra petición; la búsqueda de texto devuelve 3 de 6.

### Por qué el id no es un label

Cada combinación distinta de valores de label es un stream separado, con su propia entrada en el índice y sus propios chunks. Un label debe, por lo tanto, tener pocos valores posibles: `service`, `format`, un entorno. Un correlation id tiene un valor por petición: como label crearía millones de streams diminutos y haría que Loki fuera lento y caro. Los valores de alta cardinalidad se quedan en la línea y se filtran en el momento de la consulta.

## 5. Cómo llegan las líneas a Loki

En el laboratorio cada servicio tiene un pequeño shipper que agrupa sus líneas en lotes y las envía a `POST /loki/api/v1/push`, reintentando mientras Loki arranca. Eso mantiene el laboratorio en una sola imagen. En producción el servicio solo escribe en stdout, y un agente externo (Grafana Alloy, el OpenTelemetry Collector) sigue la salida y la envía, así un almacén de logs lento no puede frenar la aplicación.

## Lo que un id de correlación no es

Agrupa líneas; no dice qué paso llamó a cuál, ni cuánto tardó cada uno. Esa estructura (spans padre e hijo, con duraciones) es un **trace**, y el id que cumple ese papel allí es el trace id, propagado en el encabezado `traceparent` de W3C. Ve [three-signals](three-signals.md), donde las líneas de log llevan el trace id y un clic va de una línea a su trace.

## Ejecútalo

```sh
cd projects/observability/structured-logs
./setup-unix-structured-logs.sh     # or ./setup-windows-structured-logs.ps1
docker compose run --rm demo        # the same search on both variants
docker compose down -v
```
