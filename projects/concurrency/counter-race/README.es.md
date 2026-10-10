# counter-race

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Ocho workers suman 1 al mismo contador, 125,000 veces cada uno. La respuesta debería ser 1,000,000. Sin sincronización no lo es, porque `counter++` son tres pasos (leer, sumar, escribir) y dos workers pueden leer el mismo valor antiguo. Este mini-proyecto muestra esa actualización perdida en Go, Rust, Java y TypeScript, y luego la corrige de cuatro formas: un mutex, una operación atómica, paso de mensajes y un actor.

La explicación más larga está en [docs/es/concurrency/counter-race.md](../../../docs/es/concurrency/counter-race.md).

> Los contadores con bug son **deliberadamente incorrectos** y están marcados así en el código. El de Rust usa `unsafe` para desactivar la verificación del compilador que, de otro modo, se negaría a compilarlo.

## Temas del quiz que demuestra

- `concurrency` / `race-conditions`: actualizaciones perdidas, secciones críticas, detectores de carreras
- `concurrency` / `mutexes-and-locks`: la corrección con mutex
- `concurrency` / `atomics-and-memory-models`: la corrección atómica, y por qué `volatile` no lo es
- `concurrency` / `message-passing-and-channels`: un único dueño del estado detrás de un canal
- `concurrency` / `actor-model-and-beam`: un proceso de Elixir como dueño del estado

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-counter-race.sh        # Linux y macOS
./setup-windows-counter-race.ps1    # Windows
```

El script construye las cinco imágenes y ejecuta todas las pruebas. Tarda unos minutos, porque cada corrección se ejecuta 100 veces.

## Estructura

| Carpeta | Versión con bug | Correcciones |
| --- | --- | --- |
| `go/` | `BuggyCounter` (`c.n++`) | `sync.Mutex`, `atomic.Int64`, una goroutine dueña del número detrás de un canal |
| `rust/` | `BuggyCounter` (`UnsafeCell` y un `unsafe impl Sync` falso) | `Mutex<u64>`, `AtomicU64`, un thread dueño del número detrás de un canal `mpsc` |
| `java/` | `BuggyCounter` (`count++` en un campo `volatile`) | `synchronized`, `AtomicLong`, un thread dueño del número detrás de una `BlockingQueue` |
| `ts/` | `incBuggy` sobre un `SharedArrayBuffer` compartido por worker threads | un mutex hecho con `Atomics.compareExchange` y `Atomics.wait`, `Atomics.add`, `postMessage` al thread principal |
| `elixir/` | `get_then_set` (dos mensajes, así que la actualización se pierde de nuevo) | `inc`: un proceso es dueño del número y atiende un mensaje a la vez |

Cada carpeta tiene su propio Dockerfile sobre una imagen fijada. Los contenedores se ejecutan sin red.

## Pruebas

```sh
docker compose run --rm go-test      # también: rust-test, java-test, ts-test, elixir-test
```

| Qué se prueba | Dónde |
| --- | --- |
| El contador con bug termina por debajo de 1,000,000 en al menos 24 de 30 ejecuciones | Go, Rust, Java, TypeScript |
| Toda corrección llega exactamente a 1,000,000 en 100 ejecuciones seguidas | los cinco lenguajes |
| El detector de carreras de Go (`-race`) señala el contador con bug y calla en las tres correcciones | `go/counter_test.go` |
| Error Prone (verificación `GuardedBy`) señala el contador con bug en Java y calla en las tres correcciones | `java/check-guarded-by.sh` |
| En Elixir, `get` seguido de `set` pierde actualizaciones incluso con un actor | `elixir/test/` |

`FIXED_RUNS=10` reduce el número de repeticiones en una máquina lenta, por ejemplo `docker compose run --rm -e FIXED_RUNS=10 ts-test`.

La salida de los detectores en ambos casos está en el log de pruebas, y hay una copia versionada en [results/race-detector-go.txt](results/race-detector-go.txt) y [results/race-detector-java.txt](results/race-detector-java.txt).

Los linters y formateadores se ejecutan dentro de los mismos contenedores, antes de las pruebas: `gofmt` y `go vet`, `cargo fmt` y `clippy`, Spotless con google-java-format y `javac -Xlint:all -Werror`, `mix format`. Biome y golangci-lint usan la configuración de la raíz del repositorio:

```sh
bunx biome check projects/concurrency/counter-race
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Demo

```sh
docker compose run --rm go-demo      # también: rust-demo, java-demo, ts-demo, elixir-demo
```

Salida de la demo en Go en la máquina descrita en [results/results.md](results/results.md):

```text
variant       final       lost         ms
buggy        230786     769214        5.4
mutex       1000000          0       30.7
atomic      1000000          0       13.1
channel     1000000          0      393.6
```

La versión con bug es la más rápida y pierde tres cuartos del trabajo.

## Benchmark

```sh
bun run bench -- --project projects/concurrency/counter-race
bun run projects/concurrency/counter-race/throughput.ts
```

El primer comando mide cada implementación con 1, 2, 4 y 8 workers y escribe [results/results.md](results/results.md). El segundo deriva [results/throughput.md](results/throughput.md), en millones de incrementos por segundo. `dashboard/index.html` muestra los mismos datos como gráfico y se abre directamente desde el disco.

Lo que muestra la tabla:

- Más workers **no** hacen más rápido un contador compartido. Todos pelean por una sola posición de memoria, así que los núcleos pasan el tiempo pasándose esa línea de caché de uno a otro. El rendimiento cae de 1 a 8 workers en casi todas las filas.
- Una operación atómica le gana a un mutex en la mayoría de las filas, y el paso de mensajes es la corrección más lenta en todos los lenguajes, hasta por dos órdenes de magnitud. Un mensaje cuesta una operación de cola y, muchas veces, un cambio de contexto.
- El paso de mensajes y los actores compensan su costo cuando el estado es más grande que un número y las reglas para cambiarlo son más que una suma.

Los números provienen de una máquina compartida, con otros contenedores en ejecución, así que léelos como órdenes de magnitud.
