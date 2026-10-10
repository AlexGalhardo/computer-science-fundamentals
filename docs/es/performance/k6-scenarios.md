# Escenarios de prueba de carga con k6 (MP-PERF-2)

> English version: [docs/en/performance/k6-scenarios.md](../../en/performance/k6-scenarios.md) · Versão em português: [docs/pt/performance/k6-scenarios.md](../../pt/performance/k6-scenarios.md)

Miniproyecto: [`projects/performance/k6-scenarios`](../../../projects/performance/k6-scenarios/README.es.md). Temas del quiz: `load-test-types`, `k6-fundamentals`, `database-performance`, `capacity-planning-queueing`, `latency-throughput-percentiles`.

## El cuello de botella

`GET /products/:id` toma prestada una conexión de un pool, ejecuta una consulta que tarda 20 ms en PostgreSQL y devuelve la conexión. El pool tiene **2 conexiones**.

```text
request -> [ queue for a connection ] -> [ connection 1 ] -> PostgreSQL (20 ms)
                                         [ connection 2 ] -> PostgreSQL (20 ms)
```

Por la ley de utilización, 2 conexiones que están ocupadas 20 ms cada una por solicitud atienden como máximo 2 / 0.020 s = **100 solicitudes por segundo**. Por debajo de eso, una conexión casi siempre está libre. Por encima, las solicitudes llegan más rápido de lo que salen y la cola crece mientras dure la carga. La API espera como máximo 2 s por una conexión y luego responde `503` (load shedding), así que la cola no puede crecer sin límite.

Nada en un dashboard de los sospechosos habituales apunta a esto. La CPU de la API está ociosa (está esperando), la base de datos está ociosa (2 consultas a la vez no es nada) y cada consulta sigue tardando 20 ms. Solo la latencia vista por el cliente cuenta la historia, y por eso necesitas una prueba de carga para encontrarla.

La corrección es un número: `POOL_SIZE=20`, una capacidad de 1,000 solicitudes por segundo.

## Cuatro formas, cuatro preguntas

Los cuatro escenarios envían la misma solicitud. Solo difiere la forma de la tasa de llegada a lo largo del tiempo (`k6/profiles.js`).

| Escenario | Forma | La pregunta | Qué muestra el pool pequeño |
| --- | --- | --- | --- |
| Load | sube hasta el tráfico normal ocupado (150 req/s) y se mantiene | ¿Se cumple el nivel de servicio con la carga esperada? | No: la fase estable está por encima de la capacidad, el p95 llega al límite de espera de 2 s |
| Stress | escalones de 50 a 300 req/s | ¿Dónde está el límite, y qué pasa allí? | Latencia plana a 50 req/s, espera a 100, colapso desde 150: la rodilla |
| Spike | 40, luego 500 req/s durante 6 s, luego 40 otra vez | ¿Sobrevive a una ráfaga y se recupera? | La ráfaga se descarta con `503`, y los primeros segundos de la recuperación siguen lentos |
| Soak | 130 req/s, constante | ¿Qué se degrada con el tiempo? | Los primeros segundos se ven aceptables en la mediana, luego la cola llega al límite y se queda allí |

Una prueba soak real corre durante horas y busca un crecimiento lento: una fuga de memoria, una conexión que nunca se libera, un disco que se llena. Esta se reduce a un minuto, y lo que conserva de la idea es la comparación entre los primeros y los últimos segundos de la misma carga constante.

## Modelo abierto frente a modelo cerrado

Los escenarios usan el executor `ramping-arrival-rate`. k6 inicia un número fijo de iteraciones por segundo, hayan terminado o no las anteriores. Eso es un **modelo abierto**, y así se comporta el tráfico real: la gente no deja de llegar porque el sitio esté lento.

Un **modelo cerrado** (`ramping-vus`, `constant-vus`) tiene un número fijo de usuarios virtuales, cada uno esperando su respuesta antes de enviar de nuevo. Cuando el servidor se vuelve lento, los usuarios envían menos, la carga baja, y la prueba informa un rendimiento cómodo con una latencia terrible. El cuello de botella sigue siendo visible allí, pero la prueba nunca empuja más allá de la capacidad, así que no hay una rodilla que ver. Omisión coordinada (coordinated omission) es el nombre del error de medición que esto causa.

El precio del modelo abierto: toda solicitud en vuelo retiene un usuario virtual, así que `maxVUs` debe cubrir tasa × peor latencia. Cuando a k6 se le acaban los usuarios virtuales no envía la solicitud y la cuenta en `dropped_iterations`, que los resúmenes informan.

## Umbrales, checks y el código de salida

```js
thresholds: {
	http_req_duration: ["p(95)<250"],
	http_req_failed: ["rate<0.01"],
	"http_req_duration{phase:recovery}": ["p(95)<250"],
}
```

- Un **umbral** (threshold) es una regla de aprobación o falla sobre una métrica. Cuando se supera uno, k6 sale con el código 99, que es lo que hace utilizable una prueba de carga en un pipeline.
- Un **check** (`check(response, { "status is 200": ... })`) solo registra una tasa de aciertos. Un check fallido nunca hace fallar la ejecución por sí solo.
- Un **tag** (`{ tags: { phase } }`) divide una métrica. Cada fase de cada escenario tiene su propio p95, y su propio umbral.

## Resultados medidos

Los resúmenes versionados están en `results/`: [load](../../../projects/performance/k6-scenarios/results/load.md), [stress](../../../projects/performance/k6-scenarios/results/stress.md), [spike](../../../projects/performance/k6-scenarios/results/spike.md), [soak](../../../projects/performance/k6-scenarios/results/soak.md), con la máquina y las versiones en [results.md](../../../projects/performance/k6-scenarios/results/results.md).

La prueba de estrés de la ejecución versionada, antes de la corrección:

| Escalón | Solicitudes respondidas | Mediana | p95 |
| --- | --- | --- | --- |
| 50 req/s | 299 | 21 ms | 24 ms |
| 100 req/s | 575 | 127 ms | 224 ms |
| 150 req/s | 873 | 1736 ms | 2019 ms |
| 200 req/s | 1090 | 2014 ms | 2021 ms |
| 250 req/s | 1376 | 2001 ms | 2020 ms |
| 300 req/s | 1673 | 2001 ms | 2020 ms |

Cómo leerla:

- A 50 req/s el pool está usado a la mitad y la latencia es el tiempo de la consulta.
- A 100 req/s la tasa de llegada iguala la capacidad. La mediana ya es seis veces el tiempo de la consulta, porque las llegadas no son perfectamente regulares y dos solicitudes cualesquiera que llegan juntas deben esperar. El escalón es corto, así que el p95 sigue por debajo del presupuesto.
- Desde 150 req/s en adelante, la latencia se sitúa en el límite de espera de 2 s: esa es la rodilla. La latencia no crece más solo porque la API desiste a los 2 s y responde `503`. En toda la ejecución el 43% de las solicitudes falló.
- Después de la corrección cada escalón tiene un p95 de unos 21 ms. Los mismos seis escalones están ahora como máximo al 30% de la capacidad del pool.

En todos los escenarios el veredicto se invierte: los cuatro superan sus umbrales con el pool de 2 (código de salida 99 de k6) y no superan ninguno con el pool de 20 (código de salida 0).

## Por qué no simplemente hacer el pool enorme

Un pool es un límite a propósito. Cada conexión de PostgreSQL es un proceso del servidor con su propia memoria, y la base de datos tiene un límite `max_connections` compartido por todas las instancias de la aplicación. Un pool de 20 en 10 instancias ya pide 200 conexiones. El tamaño correcto sale de la aritmética de arriba (tasa de llegada × tiempo de retención, dividido por la utilización que aceptas), y acortar el tiempo que cada solicitud retiene una conexión sube la capacidad tanto como agregar conexiones.

## Método y límites

- Cada escenario corrió una vez antes y una vez después de la corrección, en una máquina compartida con otros programas. Las latencias tienen ruido. Los veredictos no: cada escenario pide más que la capacidad del pool pequeño y como máximo el 60% de la capacidad del grande (`ts/tests/unit/profiles.test.ts` verifica esta aritmética).
- Se inicia un proceso nuevo de la API para cada escenario, así que no se arrastra ninguna cola.
- k6 corre en la misma máquina que la API, lo cual está bien para una comparación de antes y después y mal para números absolutos de capacidad.

## Reglas de la prueba de carga

k6 corre desde la imagen fijada `grafana/k6:2.3.0` en la red interna de docker-compose. No se publica ningún puerto, y `k6/target.js` lanza una excepción antes de cualquier solicitud cuando `BASE_URL` no es `localhost`, `127.0.0.1`, `[::1]` ni `api`. `docker compose run --rm k6-refusal-test` lo prueba para los cuatro escenarios con `https://example.com`. La salida bruta de k6 va a `k6-results/`, que git ignora. Solo se versionan los resúmenes Markdown.

## Criterios de aceptación

| Elemento | Cómo se verifica |
| --- | --- |
| MP-PERF-2.1 el cuello de botella es visible como una rodilla de latencia en la prueba de carga | `./load-test-unix.sh` (o `.ps1`): la etapa de reporte falla a menos que el escenario de estrés tenga una rodilla antes de la corrección y ninguna después. La curva está en `results/stress.md`. En miniatura, sin k6: `ts/tests/integration/pool.test.ts` |
| MP-PERF-2.2 cada escenario falla su umbral antes de la corrección y pasa después | El mismo comando: la etapa de reporte falla a menos que cada uno de los cuatro escenarios haya superado un umbral con el pool pequeño y ninguno con el grande |
| MP-PERF-2.3 resumen Markdown por escenario versionado, salida bruta ignorada por git | `results/load.md`, `stress.md`, `spike.md`, `soak.md`, y `k6-results/` en `.gitignore` |

El plan dice "rodilla de latencia en la prueba de carga". La rodilla la muestra el escenario de estrés, cuyos escalones son la curva de latencia. El escenario de carga mantiene una sola tasa, así que muestra un punto por encima de la rodilla, no la curva.

## Ejecutar

```sh
cd projects/performance/k6-scenarios
./setup-unix-k6-scenarios.sh     # pruebas
./load-test-unix.sh              # los cuatro escenarios, antes y después, y los reportes
```
