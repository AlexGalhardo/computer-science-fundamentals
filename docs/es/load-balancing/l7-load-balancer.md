# Balanceador de carga de capa 7 escrito a mano

> English version: [docs/en/load-balancing/l7-load-balancer.md](../../en/load-balancing/l7-load-balancer.md) · Versão em português: [docs/pt/load-balancing/l7-load-balancer.md](../../pt/load-balancing/l7-load-balancer.md)

Mini-proyecto: [projects/load-balancing/l7-load-balancer](../../../projects/load-balancing/l7-load-balancer/README.es.md) (MP-LB-2). Lenguaje: Go.

## El problema

NGINX y Caddy esconden el trabajo detrás de una línea de configuración. Escribir el balanceador a mano muestra que el trabajo es corto de describir y está lleno de decisiones:

```text
client ──TCP 1──> balancer ──TCP 2──> back end
                    │
                    ├─ 1. choose a back end          strategy.go
                    ├─ 2. rewrite the headers        proxy.go
                    ├─ 3. forward and copy back      proxy.go
                    ├─ 4. on failure: retry or not   proxy.go
                    └─ meanwhile: who is alive?      health.go
```

Es un balanceador de **capa 7** porque lee la solicitud HTTP. La conexión TCP del cliente termina en el balanceador, y la solicitud viaja por una segunda conexión, normalmente una que ya está abierta y se reutiliza. Un balanceador de capa 4 reenviaría los bytes de una conexión sin saber dónde empieza o termina una solicitud.

## 1. Elegir

**Round robin** es un solo contador: la solicitud número `n` va al back end utilizable `n mod count`. El detalle que importa es qué es "count". Rotar sobre la lista completa y saltar los caídos parece equivalente y no lo es: con B caído en A, B, C, cada turno que cae en B se desliza a C, y C recibe dos tercios. La rotación tiene que correr sobre los back ends utilizables.

**Menos conexiones** guarda, por back end, el número de solicitudes enviadas y aún no terminadas, y elige el menor. Con solicitudes de igual duración se comporta como el round robin. Con un back end cuatro veces más lento le da cerca de un noveno de las solicitudes en lugar de un tercio, porque cada back end termina solicitudes a una tasa de (solicitudes en curso) / (tiempo por solicitud):

```text
fast: 10 in flight / 20 ms = 500 requests/s   (twice)
slow: 10 in flight / 80 ms = 125 requests/s
slow share = 125 / 1125 = 1/9
```

El contador solo conoce las solicitudes de este balanceador. Dos balanceadores frente a los mismos back ends ven cada uno la mitad del panorama, por eso NGINX necesita una `zone` de memoria compartida para sus workers.

## 2. Reescribir los encabezados

- Los **encabezados hop-by-hop** (`Connection`, `Keep-Alive`, `Transfer-Encoding`, `Upgrade` y los nombrados dentro de `Connection`) describen una sola conexión. El balanceador tiene dos conexiones, así que los quita en ambos sentidos.
- **`X-Forwarded-For`**: el back end ve una conexión del balanceador, así que la dirección del cliente viaja en este encabezado, y cada proxy agrega el par del que recibió la solicitud. Un back end solo puede creerle cuando la conexión viene de un proxy en el que confía.

## 3 y 4. Reenviar, y qué hacer cuando falla

Un intento fallido plantea una pregunta: ¿puede enviarse la misma solicitud a otro back end?

| Qué pasó | ¿El back end vio la solicitud? | Reintento |
| --- | --- | --- |
| Conexión rechazada o timeout de conexión | No | Siempre, cualquier método |
| Enviada, luego la conexión se cortó o la respuesta agotó el tiempo | Quizá, y quizá se ejecutó | Solo GET, HEAD y OPTIONS |

Un POST que pudo haberse ejecutado se responde con 502, porque repetirlo podría crear el pedido dos veces. Es la misma regla que `proxy_next_upstream` sin `non_idempotent` en NGINX.

Un intento fallido también saca de inmediato al back end de la rotación. Eso es una **verificación de salud pasiva**: el tráfico real encontró la falla.

## Mientras tanto: quién está vivo

La **verificación de salud activa** pide `GET /health` a cada back end a un intervalo fijo y saca a los que no responden 200 a tiempo. El intervalo es el precio de la detección: un back end que muere justo después de una sonda exitosa permanece en rotación hasta un intervalo, multiplicado por el número de fallas consecutivas requeridas. Exigir varios resultados seguidos antes de cambiar el estado evita el flapping.

Las dos verificaciones se complementan. La pasiva es inmediata y necesita tráfico. La activa funciona sin tráfico y es la única que puede devolver un back end a la rotación, porque nadie envía solicitudes a un back end que está fuera.

La prueba de aceptación del mini-proyecto detiene uno de tres back ends en medio de 3000 solicitudes: ninguna falla, porque las solicitudes que llegan al back end moribundo se reintentan, y el back end sale de la rotación en la primera falla o en la siguiente sonda. Sin ningún tráfico, una verificación de 100 ms sacó a un back end detenido 54 ms después de que se detuvo, en una ejecución de la prueba.

## El benchmark

k6 envía `GET /work` con 50 usuarios virtuales por este balanceador y por NGINX, uno a la vez, cinco rondas. Resultado confirmado en el repositorio ([results/benchmark.md](../../../projects/load-balancing/l7-load-balancer/results/benchmark.md)), mediana y rango:

| Proxy | Rendimiento (solicitudes/s) | Latencia p99 (ms) |
| --- | ---: | ---: |
| Este balanceador, round robin | 10584 (7863 a 17198) | 22.31 (12.15 a 34.70) |
| Este balanceador, menos conexiones | 9405 (7561 a 11521) | 28.72 (21.88 a 40.73) |
| NGINX, round robin | 10129 (9983 a 12968) | 26.47 (18.83 a 30.52) |

La lectura honesta es que los rangos se superponen y no se puede nombrar un ganador. La máquina se compartió, el generador de carga corrió en los mismos núcleos, y otras dos ejecuciones el mismo día tuvieron medianas de entre unas 5000 y 9600 solicitudes por segundo. Lo que la tabla respalda es el orden de magnitud: reenviar solicitudes pequeñas por conexiones reutilizadas cuesta casi lo mismo en ambos.

### Lo que el balanceador escrito a mano deja fuera

Transmisión por partes de cuerpos grandes (guarda en búfer hasta 1 MiB para que un reintento pueda reenviar el cuerpo), TLS, upgrades de WebSocket, pesos, slow start, drenaje de conexiones de un back end retirado, recarga de configuración, métricas y logs de acceso. Cada uno es una razón para usar NGINX o Caddy en producción, y una razón por la que sus archivos de configuración tienen tantas directivas.

## Solo destinos locales

`load/target.js` acepta solo `localhost`, `127.0.0.1`, `[::1]` y los tres proxies del archivo compose, antes de que k6 envíe nada. `k6-refusal-test` ejecuta k6 con ocho destinos que no son locales y pasa solo si cada uno es rechazado. La red docker es `internal`.

## Quiz

Temas del área `load-balancing` que este mini-proyecto demuestra: `layer-4-vs-layer-7`, `balancing-algorithms`, `health-checks-and-failover` y `reverse-proxy-load-balancer-api-gateway`.
