# Benchmarks

> English version: [docs/en/benchmarks.md](../en/benchmarks.md) · Versão em português: [docs/pt/benchmarks.md](../pt/benchmarks.md)

Un contrato y un runner para todos los benchmarks del repositorio, de modo que un resultado en C++ y uno en Python puedan estar en la misma tabla. Reglas: [.claude/rules/load-tests.md](../../.claude/rules/load-tests.md).

## El contrato

Cada implementación lee su entrada, hace el trabajo e imprime **un objeto JSON en la última línea de su salida**:

```json
{ "n": 100000, "elapsedMs": 4.59, "memoryKb": 10040, "language": "python", "implementation": "sum-loop", "checksum": "5000050000" }
```

| Campo | Significado |
| --- | --- |
| `n` | tamaño de la entrada |
| `elapsedMs` | tiempo solo de la sección medida, sin el arranque del runtime ni el análisis de la entrada |
| `memoryKb` | memoria residente máxima del proceso, en KiB |
| `language` | `ts`, `python`, `go`, `rust`, `cpp`, `java` o `elixir` |
| `implementation` | nombre del algoritmo o variante |
| `checksum` | resumen opcional de la salida, para probar que las implementaciones coinciden |

El JSON Schema es `tools/bench/schema.json`, generado a partir del esquema de Zod en `tools/bench/src/contract.ts`. Los campos desconocidos se rechazan.

## `bench.json`

Cada mini-proyecto con un benchmark tiene un `bench.json` que describe una cuadrícula: cada destino (lenguaje e imagen) ejecuta cada implementación en cada tamaño, una vez por variante.

```json
{
	"project": "sample",
	"runs": 3,
	"warmup": 1,
	"sizes": [1000, 100000],
	"variants": ["default"],
	"maxN": { "bubble": 10000 },
	"targets": [
		{
			"language": "ts",
			"image": "oven/bun:1.4.2",
			"version": "bun --version",
			"implementations": ["sum-loop", "sum-formula"],
			"command": "bun run ts/bench.ts {implementation} {n}"
		}
	]
}
```

- `image` es una imagen fijada. Usa `dockerfile` en su lugar para construir una a partir del proyecto.
- `build` es un comando opcional que se ejecuta una vez en el contenedor antes de medir, por ejemplo un paso de compilación.
- `maxN` pone un tope a una implementación, que es como se mantiene a los algoritmos cuadráticos fuera de los tamaños más grandes.
- `{implementation}`, `{n}` y `{variant}` se reemplazan en `command`.

## Ejecución

```sh
bun run bench -- --project <name or path>
```

Para cada fila el runner inicia un contenedor de la imagen del lenguaje **sin red**, y dentro de él [hyperfine](https://github.com/sharkdp/hyperfine) ejecuta el comando `runs` veces después de `warmup` ejecuciones descartadas. Medir dentro del contenedor mantiene el costo de iniciar Docker fuera de los números.

Escribe, en `results/` del mini-proyecto:

| Archivo | Uso |
| --- | --- |
| `results.md` | la tabla para personas, con la máquina, las versiones de los runtimes y los comandos exactos |
| `results.json` | los mismos datos para herramientas |
| `results.js` | los mismos datos como script, para que el dashboard estático funcione al abrirse desde el disco |

Cada fila tiene el proceso completo medido por hyperfine (media, desviación estándar, rango, tiempo de CPU y memoria máxima) y la sección medida que reporta el programa. Un tiempo de CPU mayor que el tiempo de reloj significa que trabajó más de un núcleo.

## Cómo leer los números

- Compara lo comparable: la misma carga, el mismo tamaño, la misma máquina.
- Reporta la dispersión, no solo la mejor ejecución. Una diferencia menor que la desviación estándar no es una diferencia.
- `process` incluye el arranque del runtime, que domina en las entradas pequeñas. `section` no.
- Los resultados dependen de la máquina. Las tablas confirmadas en el repositorio registran dónde se midieron.

## Benchmarks de lenguajes

`benchmarks/`, en la raíz, es el mayor usuario de este contrato: las mismas ocho cargas de trabajo en los siete lenguajes, con un dashboard estático en `benchmarks/dashboard/index.html`. Detalles, tablas de resultados y límites: [benchmarks/README.md](../../benchmarks/README.md).

| Carga de trabajo | Qué mide | Cómo se mide |
| --- | --- | --- |
| `cpu-single` | n-body y criba de primos en un hilo | runner compartido |
| `parallelism` | el mismo trabajo con 1, 2, 4, 8 y 16 workers: aceleración, eficiencia, tiempo de CPU | runner, más `scripts/collect-sections.ts` para la aceleración |
| `concurrency` | 100 000 tareas en espera: tiempo total, memoria máxima, memoria por tarea | runner |
| `memory` | árboles binarios (memoria máxima, tiempo) y un proceso inactivo (arranque, memoria base) | runner |
| `http` | los mismos dos endpoints en 7 servidores bajo k6 local: peticiones por segundo, p50, p95, p99, CPU y memoria | `http/collect.ts` |
| `build-time` | tiempo de compilación en frío y en caliente, o el paso que existe en su lugar | `build-time/collect.ts` |
| `binary-size` | tamaño del artefacto y del runtime que necesita | `binary-size/collect.ts` |
| `database` | las mismas operaciones contra un PostgreSQL local, con y sin pool | `database/collect.ts` |

```sh
cd benchmarks
bun run bench -- --project cpu-single   # one runner workload
bun run all                              # everything, in order, retrying a step that fails
bun run data                             # dashboard data and README tables
./setup-unix-benchmarks.sh               # the full path, with the tests
```

Lo que cada carga de trabajo **no** mide, y por qué los números entre lenguajes requieren cuidado:

- Los programas son pequeños y están escritos de la forma más simple. Miden el runtime en una tarea acotada, no aplicaciones reales ni las bibliotecas que la gente usa para ir más rápido.
- Los tiempos del proceso completo incluyen el arranque del runtime, que domina en las ejecuciones cortas de los lenguajes compilados.
- `http` y `database` comparan stacks (servidor, driver), no solo lenguajes, y el cliente y el servidor comparten la máquina.
- Todo se midió en una sola máquina, en un solo día, con la configuración por defecto y otras cargas de trabajo ejecutándose al lado. Una diferencia menor que la dispersión reportada no es una diferencia.

Cuatro cosas que el runner no hace viven en recolectores dentro de `benchmarks/`, sin cambios en `tools/`: varias muestras de la sección medida, un paso antes de cada ejecución cronometrada, servicios de larga duración y tamaños en disco. Todos escriben los mismos `results.md`, `results.json` y `results.js`.
