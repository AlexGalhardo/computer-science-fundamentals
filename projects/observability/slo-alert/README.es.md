# slo-alert

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cómo una frase como "el 99% de las peticiones debe tener éxito" se convierte en una página (aviso a quien está de guardia) en el momento justo, y se detiene cuando el problema se detiene? Este miniproyecto lleva un pequeño servicio de tienda desde el objetivo hasta la alerta: indicadores, presupuesto de error, burn rate, reglas de Prometheus probadas con `promtool`, y una alerta que se dispara cuando k6 local sobrecarga el servicio y se resuelve después de que termina la carga.

Código: MP-OBS-3. Explicación completa: [docs/es/observability/slo-alert.md](../../../docs/es/observability/slo-alert.md).

```text
k6 (local only) --overload--> shop --/metrics--> Prometheus --alerts--> Alertmanager --webhook--> receiver
                               ^                    |
        normal users ----------+        recording rules: SLI -> burn rate -> alert (two windows)
```

## Los objetivos

| Objetivo (en 30 días) | Indicador (SLI) | Presupuesto de error | Avisa cuando el burn rate está por encima de |
| --- | --- | --- | --- |
| Disponibilidad: el 99% de las peticiones no falla | fallidas (5xx) / todas las peticiones | 1% | 14.4, en la ventana de 5 m **y** en la de 1 m |
| Latencia: el 95% de las peticiones exitosas tarda 100 ms o menos | 1 - bucket `le="0.1"` / count | 5% | 6, en la ventana de 5 m **y** en la de 1 m |

Burn rate = porción mala / presupuesto de error. Con un burn rate de 1 el presupuesto dura exactamente los 30 días. Con 14.4 se agota en 720 / 14.4 = 50 horas, y una hora a ese ritmo gasta 14.4 / 720 = 2% de él.

Las reglas de producción de este tipo usan ventanas de 1 hora y 5 minutos. El laboratorio usa 5 minutos y 1 minuto, doce veces más cortas, para que la demostración dure tres minutos. Los umbrales y su aritmética son los mismos.

## Resultados

Los genera `docker compose run --rm demo`, versionados en [results/results.md](results/results.md). k6 corrió 30 usuarios virtuales durante 60 segundos contra una tienda que atiende 8 peticiones a la vez; unas 5 peticiones por segundo de tráfico normal corrieron todo el tiempo.

| Medido | Valor |
| --- | --- |
| Tasa máxima de peticiones | 227 peticiones por segundo |
| Porción máxima de peticiones fallidas (ventana de 1 m) | 80.2% (objetivo: como máximo 1%) |
| Porción máxima de peticiones exitosas lentas (ventana de 1 m) | 100% (objetivo: como máximo 5%) |
| Alerta pending o firing antes de la carga | no |

| Alerta | Pending | Firing y receiver notificado | Resuelta después de que la carga se detuvo | Burn rate máximo | Burn rate de la ventana de 5 m en la resolución |
| --- | --- | --- | --- | --- | --- |
| `AvailabilityBudgetBurn` | 4 s después de que empezó la carga | 14 s | 53 s | 80.2 | 77.7 |
| `LatencyBudgetBurn` | 6 s | 16 s | 51 s | 20.0 | 17.3 |

**Tiempos documentados, verificados por la prueba de extremo a extremo:** el receiver es notificado **dentro de 60 segundos** de que empieza la carga, y la alerta se resuelve **dentro de 120 segundos** de que la carga se detiene.

La última columna es la lección de las dos ventanas. Cuando las alertas se resolvieron, la ventana de 5 minutos todavía quemaba muy por encima del umbral (77.7 frente a 14.4): aún recordaba el incidente. La ventana de 1 minuto ya lo había olvidado, y la regla necesita las dos. Con la ventana larga sola, la página habría seguido activa unos cinco minutos después de que el servicio volviera a estar sano.

## Temas del quiz que demuestra

- `observability` / `sli-slo-error-budgets`: SLI como eventos buenos o malos sobre eventos válidos, el objetivo, el presupuesto de error, un SLI de latencia como porción de peticiones bajo un umbral y no como promedio, burn rate
- `observability` / `alerting`: alertas basadas en síntomas sobre el consumo del presupuesto, dos ventanas, `for` con pending y firing, agrupación de Alertmanager y notificaciones de resuelto
- `observability` / `metric-types-cardinality`: un counter y un histograma clásico escritos a mano, buckets `le` acumulativos, `rate()`, por qué una serie debe empezar en 0
- `observability` / `prometheus-grafana-loki-tempo`: Prometheus extrayendo `/metrics`, PromQL en recording rules

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-slo-alert.sh        # Linux y macOS
./setup-windows-slo-alert.ps1    # Windows
```

El script construye la imagen y ejecuta, en orden: las pruebas unitarias, el probador de reglas de Prometheus, la prueba de que k6 rechaza un objetivo no local, y el incidente de extremo a extremo (unos tres minutos). Todo se elimina al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Levanta la pila y k6 (45 segundos tranquilos, 60 segundos de carga), imprime la línea de tiempo a medida que ocurre y reescribe `results/results.md` y `results/timeline.json`.

## Pruebas

```sh
docker compose run --rm ts-test             # typecheck + 22 unit tests, no network
docker compose run --rm rules-test          # promtool check config + promtool test rules, no network
docker compose run --rm load-refusal-test   # k6 must refuse https://example.com
docker compose run --rm e2e-test            # 8 tests: the alert fires and resolves within the documented times
docker compose down -v
```

### Las reglas y sus pruebas

[`prometheus/rules.yaml`](prometheus/rules.yaml) tiene 9 recording rules y 2 alerting rules, en tres capas dentro de un grupo de reglas (las reglas de un grupo se ejecutan en orden, así que cada capa lee lo que la capa de arriba acaba de registrar):

| Capa | Ejemplo | Significado |
| --- | --- | --- |
| Indicador | `job:slo_errors_per_request:ratio_rate5m` | Porción de peticiones fallidas en los últimos 5 minutos |
| Burn rate | `job:slo_availability_burn_rate:ratio_rate5m` | Esa porción dividida por el presupuesto de 1% |
| Presupuesto | `job:slo_availability_error_budget_remaining:ratio_1h` | 1 = intacto, 0 = gastado, negativo = agotado en exceso |
| Alerta | `AvailabilityBudgetBurn` | Ambos burn rates por encima de 14.4, sostenidos 10 s |

[`prometheus/rules.test.yaml`](prometheus/rules.test.yaml) lo ejecuta `promtool test rules` dentro de la imagen fijada de Prometheus. Simula cuatro historiales en milisegundos: un servicio sano, un 10% constante de fallos (burn rate 10: objetivo roto, pero por debajo del umbral de aviso), una caída de diez minutos (se dispara, y se resuelve 90 segundos después del final mientras la ventana de 5 minutos aún quema a 23.3), y un servicio que es lento pero nunca falla (avisa solo por latencia).

## Solo local

- k6 (`grafana/k6:2.3.0`) lee su objetivo de `TARGET`, que por defecto es una dirección local, y [`load/target.js`](load/target.js) rechaza cualquier host fuera de una lista cerrada (`localhost`, `127.0.0.1`, `[::1]`, `shop`). `load-refusal-test` lo demuestra, y las pruebas unitarias cubren imitaciones como `http://localhost@example.com`.
- La red de compose es `internal` y no se publica ningún puerto. Para mirar Prometheus a mano, usa `docker compose exec prometheus wget -qO- 'http://127.0.0.1:9090/api/v1/alerts'`.
- El "pager" es un webhook local que solo recuerda lo que recibió. El reporte de uso de k6 está desactivado; Prometheus y Alertmanager no envían ninguno.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/metrics.ts` | Un counter y un histograma a mano, en el formato de texto de Prometheus |
| `ts/src/shop.ts` | El servicio: capacidad fija, más lento con cada petición en curso, 503 cuando está lleno |
| `ts/src/slo.ts` | La aritmética: presupuesto de error, burn rate, tiempo hasta el agotamiento, la condición de dos ventanas |
| `ts/src/receiver.ts` | El webhook que recibe las notificaciones de Alertmanager |
| `ts/src/watch.ts`, `ts/src/demo.ts` | El observador que registra la línea de tiempo de un incidente, y la demo |
| `prometheus/` | Configuración de scrape, las reglas y sus pruebas con `promtool` |
| `alertmanager/` | Enrutamiento, agrupación y el webhook receiver |
| `load/` | El script de k6, la regla de objetivo local y su prueba de rechazo |
| `results/` | La línea de tiempo versionada |

## Versiones

| Componente | Versión |
| --- | --- |
| Prometheus (y `promtool`) | `prom/prometheus:v3.15.0` |
| Alertmanager | `prom/alertmanager:v0.34.1` |
| k6 | `grafana/k6:2.3.0` |
| Bun | `oven/bun:1.4.2` |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

Alertmanager es parte del proyecto Prometheus y es la única imagen aquí que la lista de stack del repositorio no nombra: Prometheus dispara alertas pero no las entrega, así que una alerta que "se dispara y se resuelve" para alguien lo necesita. No se usa ninguna biblioteca cliente de métricas; el formato de exposición se escribe a mano porque eso es parte de la lección.

## Notas

- Los intervalos de scrape y de evaluación son de 2 segundos y Alertmanager espera 1 segundo antes de la primera notificación. Los valores de producción son de 15 a 60 segundos y 30 segundos. Solo hacen rápido el laboratorio; no son una recomendación.
- La regla del presupuesto de error mira la última hora porque el laboratorio solo tiene minutos de datos. Una real mira toda la ventana del objetivo (`[30d]`).
- Los tiempos de los resultados dependen de la máquina, pero solo por unos pocos segundos: los dominan las ventanas (`for: 10s`, y la ventana de 1 minuto que debe vaciarse antes de que la alerta se resuelva).
- Sin ninguna petición en una ventana, una regla de razón graba `NaN` (0 / 0), y no 0. Eso ocurre en los primeros segundos del laboratorio, antes de que el tráfico normal se recolectara dos veces. La alerta sigue en silencio, porque toda comparación con `NaN` es falsa, y el observador lee `NaN` como "todavía sin valor" (`sampleValue` en `ts/src/watch.ts`): guardado como número, convertiría todo pico en `NaN`.
- "Alerta pending o firing antes de la carga" significa: una alerta quedó activa mientras el tráfico normal del propio observador era el único tráfico que la tienda había atendido. El observador lo responde leyendo directamente el counter de peticiones de la tienda y restando las peticiones que él mismo envió. La tasa de los últimos 10 segundos, que da el momento "la carga empezó" de la línea de tiempo, se retrasa una o dos recolecciones: una fracción de segundo de sobrecarga basta para dejar la alerta pending, así que la alerta puede verse pending un segundo antes de que la tasa cruce la línea de "carga activa". El observador imprime una línea cuando eso ocurre.
