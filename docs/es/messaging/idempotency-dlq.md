# Idempotencia y dead-letter queue (MP-MSG-2)

> English version: [docs/en/messaging/idempotency-dlq.md](../../en/messaging/idempotency-dlq.md) · Versão em português: [docs/pt/messaging/idempotency-dlq.md](../../pt/messaging/idempotency-dlq.md)

Mini-proyecto: [`projects/messaging/idempotency-dlq`](../../../projects/messaging/idempotency-dlq/README.es.md). Temas del quiz: `idempotent-consumers`, `ack-retry-dlq`, `delivery-guarantees`, `rabbitmq-exchanges-routing`.

## El problema

Un broker que nunca pierde un mensaje a veces debe entregarlo dos veces. Cuando una confirmación (acknowledgement) no llega, el broker no puede distinguir "el consumidor murió antes del trabajo" de "el consumidor hizo el trabajo y murió antes de avisar", y entrega de nuevo. Los productores hacen lo mismo cuando se pierde una confirmación. Así, un consumidor ve dos tipos de problema que ninguna configuración elimina:

- **Duplicados**: el mismo mensaje más de una vez.
- **Veneno (poison)**: un mensaje que falla siempre, y que la reentrega convierte en un bucle sin fin.

## 1. El daño, medido

El efecto en este laboratorio es un crédito: `balance = balance + amount`. Es una actualización relativa, por lo tanto no es idempotente. Cada mensaje se publica dos veces, y el consumidor pierde la confirmación del 20% de las entregas después de confirmar (commit) el efecto.

```ts
await credit(payment);   // the effect is committed
// <- the acknowledgement is lost here
channel.ack(message);
```

El consumidor ingenuo aplica un efecto por entrega: 1,000 mensajes se convirtieron en 2,521 créditos. Nada falló y no se registró ningún error. Ese silencio es lo que hace caro el bug.

## 2. El almacén de claves de idempotencia

Cada mensaje lleva un id elegido una sola vez por el productor. El consumidor lo registra **en la misma transacción** que el efecto:

```sql
BEGIN;
INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING;
-- 0 rows inserted: a duplicate, stop here
UPDATE accounts SET balance_cents = balance_cents + $2 WHERE id = $3;
COMMIT;
```

Por qué importa cada detalle:

| Detalle | Sin él |
| --- | --- |
| Clave primaria en `message_id` | Dos copias que llegan juntas pasan ambas una verificación con `SELECT` y ambas se aplican (check-then-act) |
| Misma transacción que el efecto | Un fallo deja "marcado pero no aplicado" (el efecto se pierde para siempre) o "aplicado pero no marcado" (se aplica otra vez) |
| Id elegido por el productor | Un delivery tag del broker o una marca de tiempo cambia en cada entrega, así que ningún duplicado coincidiría jamás |

Con el almacén, las mismas 2,521 entregas produjeron exactamente 1,000 efectos. La entrega siguió siendo at-least-once; el **efecto** pasó a ser exactly-once.

### La misma carrera en Go

El lado de Go quita el broker y la base de datos para aislar la concurrencia. `RacyStore` verifica y marca en dos pasos, cada uno bajo un mutex. No hay data race y `go test -race` guarda silencio, y aun así dos goroutines que sostienen el mismo id pueden pasar ambas la verificación. Una prueba abre esa ventana con un hook y obtiene dos efectos siempre. `AtomicStore` hace la verificación, el efecto y la marca en una sola sección crítica, que es lo que hace la transacción de base de datos en TypeScript.

La lección que hay que conservar: un lock alrededor de cada paso no es un lock alrededor de la decisión.

## 3. Reintento con backoff

Un mensaje fallido no se reintenta de inmediato. Una dependencia caída no gana nada con que la llamen de nuevo un milisegundo después, y un mensaje que siempre fallará giraría tan rápido como el consumidor pueda fallar. La espera se duplica tras cada fallo:

```text
wait after failed attempt n = base x 2^(n-1)      base 200 ms: 200, 400, 800 ms
```

RabbitMQ no tiene "entregar más tarde", así que el retraso se construye con dos funciones:

- una cola de espera con un **TTL** y sin consumidor;
- un **dead-letter exchange** en esa cola que apunta de vuelta al exchange de trabajo.

El consumidor publica el mensaje fallido en la cola de espera de su intento, con la cabecera `x-attempt` incrementada, y luego confirma el original. Cuando termina el TTL, RabbitMQ envía el mensaje (dead-letter) de vuelta a la cola de trabajo.

Hay una cola de espera por cada paso del backoff porque RabbitMQ expira los mensajes solo en la cabeza de una cola: un mensaje de 200 ms detrás de un mensaje de 800 ms esperaría 800 ms. Y la cola de espera define `x-dead-letter-routing-key`: sin ella el mensaje conserva la routing key con la que se publicó, no coincide con ningún binding y se descarta en silencio. Ese error se cometió al construir este laboratorio, y la prueba lo detectó.

## 4. La dead-letter queue

Cuando se agotan los intentos, el consumidor rechaza el mensaje sin reencolarlo. La cola de trabajo tiene su propio dead-letter exchange, así que el mensaje pasa a la dead-letter queue con una cabecera `x-death` que registra el motivo. Allí ya no retrasa a los mensajes sanos, y espera a una persona.

No todo fallo merece los reintentos. El consumidor distingue:

- fallos **transitorios** (el handler lanzó una excepción): se reintentan con backoff;
- fallos **permanentes** (el payload no pasa el esquema): van a la dead-letter queue de inmediato, porque ninguna espera vuelve válido un mensaje inválido.

En la ejecución guardada, el mensaje envenenado se intentó 4 veces con esperas de 203, 403 y 803 ms y luego fue a la dead-letter queue; el malformado fue directo allí en el intento 1; los 20 mensajes sanos se aplicaron todos.

## Qué llevarse

- La entrega at-least-once más un consumidor idempotente es como se construye el "exactly once" en la práctica.
- La marca de deduplicación y el efecto deben confirmarse (commit) juntos. Dos almacenes no pueden hacerlo.
- Reintentar más tarde y con una espera creciente, un número limitado de veces, y luego dead-letter.
- Clasifica el error antes de reintentar: transitorio o permanente.
