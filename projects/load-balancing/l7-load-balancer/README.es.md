# l7-load-balancer

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un balanceador de carga de capa 7 escrito a mano en Go, solo con la biblioteca estándar, en unas 350 líneas de código más los comentarios. Muestra lo que hace un balanceador de carga en cada solicitud: elegir un back end (round robin o menos conexiones), reenviar la solicitud por otra conexión, copiar la respuesta de vuelta, descubrir qué back ends están vivos (verificaciones de salud activas) y decidir cuándo una solicitud fallida puede enviarse a otro back end. Luego un benchmark local con k6 lo compara con NGINX frente a los mismos tres back ends.

La explicación de los conceptos está en [docs/es/load-balancing/l7-load-balancer.md](../../../docs/es/load-balancing/l7-load-balancer.md).

> **Solo local.** El script de k6 se niega a ejecutarse cuando el destino no es `localhost` ni uno de los tres proxies de este archivo docker-compose. Nunca apuntes una prueba de carga a un host que no sea tuyo.

## Temas del quiz que demuestra

- `load-balancing` / `layer-4-vs-layer-7`: el proxy termina la conexión del cliente y abre otra hacia el back end
- `load-balancing` / `balancing-algorithms`: round robin y menos conexiones, con un back end lento
- `load-balancing` / `health-checks-and-failover`: verificaciones activas y pasivas, tiempo de detección, reintentar solo cuando es seguro
- `load-balancing` / `reverse-proxy-load-balancer-api-gateway`: encabezados hop-by-hop y `X-Forwarded-For`

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-l7-load-balancer.sh        # Linux y macOS
./setup-windows-l7-load-balancer.ps1    # Windows
```

El script construye la imagen, ejecuta `gofmt`, `go vet` y las pruebas de Go con el detector de condiciones de carrera, envía 30 solicitudes por cada proxy dentro de docker-compose, comprueba que k6 rechaza un destino que no es local y lo elimina todo. Tarda cerca de un minuto.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `go/balancer/pool.go` | Los back ends y sus contadores: sano, solicitudes en curso, solicitudes atendidas |
| `go/balancer/strategy.go` | La elección: `RoundRobin` y `LeastConnections` |
| `go/balancer/proxy.go` | Una solicitud: reenviar, reescribir encabezados, copiar la respuesta, reintentar |
| `go/balancer/health.go` | La verificación de salud activa |
| `go/cmd/lb` | El balanceador como programa, configurado con variables de entorno |
| `go/cmd/backend` | El back end trivial que usa el benchmark |
| `go/cmd/report`, `go/report` | Convierte los resúmenes de k6 en `results/benchmark.md` |
| `load/bench.js`, `load/run-all.sh` | El escenario de k6 y las rondas del benchmark |
| `load/target.js` | La regla que rechaza destinos que no son locales |
| `nginx/nginx.conf` | La referencia: NGINX con round robin sobre los mismos back ends |

El balanceador se configura con `BACKENDS` (`http://host:port` separados por comas), `STRATEGY` (`round-robin` o `least-connections`), `HEALTH_PATH`, `HEALTH_INTERVAL` y `HEALTH_TIMEOUT`. Responde `GET /lb/status` por sí mismo, con el estado de cada back end, y reenvía todo lo demás.

Todo corre en una red docker marcada como `internal`, sin ruta al exterior y sin ningún puerto publicado en el host.

## Pruebas

```sh
docker compose run --rm go-test          # gofmt, go vet, 17 pruebas de Go con -race, sin red
docker compose run --rm smoke-test       # 30 solicitudes por cada proxy, 10 por back end
docker compose run --rm k6-refusal-test  # k6 debe rechazar 8 destinos que no son locales
docker compose --profile bench down -v
```

Las pruebas de Go son pruebas de integración en miniatura: servidores HTTP reales en la interfaz de loopback hacen el papel de los back ends, y las solicitudes pasan por el handler real del proxy.

| Qué se prueba | Prueba en `go/balancer/balancer_test.go` |
| --- | --- |
| Round robin: 300 solicitudes, exactamente 100 por back end, en el orden a, b, c | `TestRoundRobinSplitsRequestsEvenly` |
| Con un back end fuera, los otros dos reciben 50 cada uno | `TestRoundRobinSkipsUnhealthyBackend` |
| Menos conexiones elige el que tiene menos solicitudes en curso y rota en los empates | `TestLeastConnectionsPicksTheIdlestBackend`, `TestLeastConnectionsBreaksTiesInRotation` |
| Un back end cuatro veces más lento: menos conexiones le da 1/9, round robin 1/3, dentro de 5 puntos | `TestDistributionWithOneSlowBackend` |
| Un back end detenido se saca dentro del intervalo de verificación, sin tráfico de clientes | `TestActiveCheckRemovesStoppedBackendWithinTheInterval` |
| 3000 solicitudes mientras se detiene un back end: ninguna falla | `TestNoRequestFailsWhileABackendStops` |
| Un back end vuelve tras el número configurado de sondas exitosas | `TestBackendReturnsAfterASuccessfulProbe` |
| Después de enviada la solicitud, un GET se reintenta y un POST no | `TestRetryAfterSendingOnlyForIdempotentRequests` |
| Un POST se reintenta cuando la conexión fue rechazada | `TestPostIsRetriedWhenTheConnectionWasRefused` |
| Ningún back end sano: 503, y no se reenvía nada | `TestNoHealthyBackendAnswers503` |
| Los encabezados hop-by-hop se quitan en ambos sentidos, `X-Forwarded-For` se agrega | `TestHeadersAreRewrittenForTheNextHop` |

La primera versión del round robin falló `TestRoundRobinSkipsUnhealthyBackend` con 34 contra 66: empezaba en `counter % size` y saltaba los back ends caídos, así que el vecino de un back end caído también recibía su parte. El comentario en `strategy.go` conserva la historia.

Linters: `gofmt` y `go vet` corren en `go-test`. golangci-lint usa la configuración de la raíz del repositorio:

```sh
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Benchmark

```sh
docker compose --profile bench run --rm report   # unos tres minutos, escribe results/
docker compose --profile bench down -v
```

k6 mantiene 50 usuarios virtuales que envían `GET /work` durante 10 segundos por un proxy a la vez: este balanceador con round robin, este balanceador con menos conexiones, y NGINX con round robin. Tras un calentamiento descartado por proxy, la ronda de tres se repite cinco veces. `REPETITIONS`, `VUS` y `DURATION_S` cambian el escenario.

Ejecución confirmada en el repositorio, en la máquina descrita en [results/benchmark.md](results/benchmark.md). Mediana de cinco ejecuciones, con el menor y el mayor valor entre paréntesis:

| Proxy | Rendimiento (solicitudes/s) | Latencia p50 (ms) | Latencia p99 (ms) | Solicitudes fallidas |
| --- | ---: | ---: | ---: | ---: |
| Este balanceador, round robin | 10584 (7863 a 17198) | 3.08 (2.07 a 3.84) | 22.31 (12.15 a 34.70) | 0 |
| Este balanceador, menos conexiones | 9405 (7561 a 11521) | 3.19 (2.81 a 4.19) | 28.72 (21.88 a 40.73) | 0 |
| NGINX, round robin | 10129 (9983 a 12968) | 2.60 (1.98 a 2.77) | 26.47 (18.83 a 30.52) | 0 |

Cómo leerlo:

- **No se puede afirmar ninguna diferencia.** Los rangos se superponen por completo. La máquina se compartió con otras cargas de trabajo mientras esto corría, y k6 compite con los proxies por los mismos 16 núcleos. Dos ejecuciones anteriores el mismo día dieron medianas de 6185, 6579 y 9588 solicitudes por segundo (tres repeticiones) y luego 5586, 4974 y 5461 (cinco repeticiones), en el mismo orden de filas. La dispersión entre ejecuciones es mayor que cualquier diferencia entre proxies.
- **El orden de magnitud es el resultado.** Unos cientos de líneas de Go sobre `net/http` reenvían miles de solicitudes por segundo con un p99 de decenas de milisegundos, en el mismo rango que NGINX en esta configuración, sin ninguna solicitud fallida en ninguna ejecución.
- **Lo que no muestra.** El back end no hace nada, así que esto mide el costo del proxy con solicitudes pequeñas y conexiones reutilizadas. No dice nada sobre cuerpos grandes, TLS, miles de conexiones ociosas, memoria, ni una máquina tranquila con el generador de carga en otro lugar, donde se esperaría que un NGINX ajustado lo haga mejor.

Para comparar dos proxies en serio, ejecuta en una máquina inactiva, aumenta `REPETITIONS` y trata cualquier diferencia menor que el rango como ruido.
