# flame-graph

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un servicio está lento y el código parece correcto. ¿A dónde se va el tiempo? Este miniproyecto tiene dos servicios HTTP pequeños, uno en Go y otro en TypeScript (Bun), cada uno con una **ruta caliente escondida**: una línea que parece una consulta barata y en realidad es la mayor parte del trabajo. Un **perfil de CPU** tomado bajo carga, dibujado como un **flame graph**, apunta a la función. Luego se aplica la corrección y un **benchmark de antes y después** mide cuánto valió.

Código: MP-OBS-4. Explicación completa: [docs/es/observability/flame-graph.md](../../../docs/es/observability/flame-graph.md).

```text
load generator --> go-server  GET /before/report   (compiles a regular expression for every log line)
                              GET /after/report    (compiled once)
                              GET /debug/pprof/profile?seconds=5      -> CPU profile (pprof)
               --> ts-server  GET /before/quote    (rebuilds a price index for every order line)
                              GET /after/quote     (built once)
                              GET /debug/cpuprofile?seconds=5         -> CPU profile (.cpuprofile)

CPU profile --> folded stacks (one line per call stack, with its sample count) --> SVG flame graph
```

## Qué muestran los flame graphs

Las cuatro imágenes las genera `docker compose run --rm flame` y están versionadas en [results/](results/), junto con las pilas plegadas a partir de las cuales se dibujaron.

Go, antes de la corrección. La caja morada es `compileRegex`: el 90.5% de las muestras tomadas dentro del handler.

![Go, antes de la corrección](results/flame-go-before.svg)

Go, después de la corrección. `compileRegex` desapareció y el handler es una torre delgada: casi todo lo que queda es comparar las líneas y escribir la respuesta.

![Go, después de la corrección](results/flame-go-after.svg)

TypeScript, antes de la corrección. `buildPriceIndex` concentra el 99.4% del handler.

![TypeScript, antes de la corrección](results/flame-ts-before.svg)

TypeScript, después de la corrección.

![TypeScript, después de la corrección](results/flame-ts-after.svg)

| Servicio | Variante | Muestras | Dentro del handler | Dentro de la función caliente | Porción del handler |
| --- | --- | --- | --- | --- | --- |
| Go | before | 414 | 296 | 268 | 90.5% |
| Go | after | 297 | 225 | 0 | 0.0% |
| TypeScript (Bun) | before | 2708 | 2689 | 2673 | 99.4% |
| TypeScript (Bun) | after | 238 | 148 | 0 | 0.0% |

Fuente: [results/profile.md](results/profile.md). Función caliente: `flame-graph/report.compileRegex` en Go, `buildPriceIndex` en TypeScript.

### Cómo leer un flame graph

- Cada caja es una función. La caja **encima** de ella es una función que ella llamó, así que una columna es una pila de llamadas, con la raíz abajo.
- El **ancho** de una caja es su porción de las muestras: la función misma más todo lo que llamó.
- El **eje x no es tiempo**. Las cajas hermanas se ordenan por nombre. Izquierda y derecha no significan nada, y una caja no "ocurre antes" que la que está a su derecha.
- Una caja ancha sin nada encima (una **meseta**) es donde la CPU realmente estaba: ese ancho es el tiempo propio de la función (self time, o `flat` en pprof). Una caja ancha cubierta por sus hijos solo pasó el tiempo hacia ellos (`cum` en pprof).
- Los colores no significan nada; solo distinguen a los vecinos. Aquí una función se pinta de morado, como un resultado de búsqueda.
- Busca la caja más ancha que sea tuya y que no esperabas que fuera ancha. En la imagen de Go las mesetas están dentro de `regexp/syntax`, la biblioteca estándar, que no puedes corregir. Bajando por la torre, la primera caja de la aplicación es `compileRegex`: esa es la llamada que hay que quitar.

Un perfil no es un trace. Un trace sigue **una petición** a través de los servicios y muestra a dónde se fue su tiempo de reloj, incluida la espera. Un perfil de CPU suma **todas las peticiones** de un proceso y muestra qué funciones estaban en la CPU; el tiempo que se pasa esperando una base de datos no aparece en él.

## Antes y después

Lo genera `docker compose run --rm bench`, versionado en [results/results.md](results/results.md) y [results/results.json](results/results.json). Peticiones por segundo: mediana de 5 ejecuciones de 5 s, con la ejecución más lenta y la más rápida.

| Servicio | Runtime | Antes | Después | Factor |
| --- | --- | --- | --- | --- |
| Go | go1.27.1 | 222 (191 a 246) | 3133 (2666 a 3994) | **14.1x** |
| TypeScript (Bun) | bun 1.4.2 | 405 (398 a 430) | 22894 (20947 a 24549) | **56.5x** |

La corrección hace que el servicio Go sea **14.1 veces** y el servicio TypeScript **56.5 veces** más rápido en esta carga de trabajo.

Cómo se midió: AMD Ryzen 7 5700X3D (16 CPUs lógicas, 15.6 GiB), Docker en WSL2, cada servidor limitado a 1 CPU y 256 MB, un generador de carga de lazo cerrado con 16 conexiones en la red interna de docker-compose, 2 s de calentamiento descartados. La máquina se compartió con otras cargas durante la medición, por eso la dispersión entre ejecuciones es grande (hasta el 42% de la mediana en Go). Otras dos ejecuciones completas en la misma máquina dieron 14.7x y 24.3x para Go y 57.7x y 44.0x para TypeScript: lee el factor como "más de diez veces", no como una constante. Pertenece a esta carga de trabajo (300 líneas de log, un pedido de 200 líneas sobre 400 productos) y a esta máquina.

## Temas del quiz que demuestra

- `observability` / `profiling`: qué mide un profiler de CPU por muestreo, cómo leer un flame graph (ancho, el eje x, mesetas), tiempo flat frente a acumulado, `net/http/pprof`
- `observability` / `three-signals`: un perfil frente a un trace, y qué puede y qué no puede responder cada uno

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-flame-graph.sh        # Linux y macOS
./setup-windows-flame-graph.ps1    # Windows
```

El script construye las dos imágenes, ejecuta las pruebas unitarias de ambos lenguajes, luego carga y perfila los dos servicios y comprueba que los flame graphs nuevos apuntan a la función caliente. Esa ejecución en vivo escribe en `out/`, que git ignora. Todo se elimina al final.

## Demo

```sh
docker compose run --rm flame     # load + CPU profiles + folded stacks + the four SVG flame graphs
docker compose run --rm bench     # before/after throughput
docker compose down -v
```

`flame` ejecuta tres pasos en orden (`capture`, `go-fold`, `flame`) y reescribe `results/*.folded`, `results/flame-*.svg` y `results/profile.md`. Termina con error cuando un perfil "before" no pone más del 50% de las muestras del handler en la función caliente, o cuando un perfil "after" aún tiene el 5% o más. `bench` reescribe `results/results.md` y `results/results.json`. Abre los archivos SVG en un navegador y pasa el cursor sobre una caja para ver su nombre, muestras y porción.

Los perfiles crudos se guardan en `profiles/` (ignorado por git). Los de Go se abren con la herramienta estándar, por ejemplo `go tool pprof -top profiles/go-before.pb.gz`, y los de TypeScript (`.cpuprofile`) se abren en el panel Performance de Chrome DevTools.

## Pruebas

```sh
docker compose run --rm go-test
docker compose run --rm ts-test
```

Ambas corren sin red.

- Go: `gofmt`, `go vet` y `go test`. Las dos variantes devuelven el mismo resumen; el parser de la salida de `go tool pprof -traces` invierte las pilas y suma las repetidas.
- TypeScript: `tsc --noEmit` y `bun test`. Las dos variantes devuelven la misma cotización; las pilas plegadas se leen y se vuelven a escribir; un árbol de llamadas `.cpuprofile` se convierte en pilas plegadas sin perder ninguna muestra; el SVG tiene una caja por cuadro con un ancho proporcional a sus muestras, la raíz abajo, nombres escapados y XML bien formado; el generador de carga rechaza un objetivo que no sea local; y, sobre los perfiles **versionados**, la función caliente concentra más del 50% del handler antes de la corrección y menos del 5% después, y cada SVG versionado es exactamente lo que el renderizador dibuja a partir de su perfil versionado.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `go/report/` | El resumen de logs en dos variantes, `SummarizeBefore` (ruta caliente en `compileRegex`) y `SummarizeAfter` |
| `go/cmd/server/` | Servidor HTTP con ambas rutas y `net/http/pprof` |
| `go/fold/`, `go/cmd/fold/` | Convierte un perfil de CPU de pprof en pilas plegadas, mediante `go tool pprof -traces` |
| `ts/src/pricing.ts` | La cotización del pedido en dos variantes, `quoteBefore` (ruta caliente en `buildPriceIndex`) y `quoteAfter` |
| `ts/src/app.ts`, `ts/src/profiler.ts` | Servidor HTTP con ambas rutas y un endpoint de perfil de CPU construido sobre `node:inspector` |
| `ts/src/folded.ts` | Pilas plegadas: parser, escritor y la conversión desde `.cpuprofile` |
| `ts/src/svg.ts` | El renderizador de flame graphs, usado para ambos lenguajes |
| `ts/src/load.ts`, `ts/src/target.ts` | Generador de carga de lazo cerrado que rechaza cualquier objetivo que no sea local |
| `ts/src/capture.ts`, `ts/src/flame.ts`, `ts/src/bench.ts` | Los tres comandos del laboratorio |
| `results/` | Pilas plegadas, flame graphs SVG, tabla de perfiles y benchmark versionados |

## Notas y límites

- La carga se envía solo a `go-server` y `ts-server` en una red interna de docker-compose. Los hosts permitidos son una lista cerrada en `ts/src/target.ts`, y no se publica ningún puerto en el host.
- Los endpoints de profiling revelan detalles internos. Solo son alcanzables dentro de la red interna del laboratorio; en un servicio real nunca deben ser públicos.
- En la imagen "before" de TypeScript, `quoteBefore` no aparece entre `handleQuoteBefore` y `quote`: su última acción es una llamada en posición de cola, y JavaScriptCore puede reutilizar el marco de pila para una llamada así. Un profiler muestra las pilas que existen en tiempo de ejecución, que no siempre son las del código fuente.
- Las imágenes de TypeScript son torres cortas porque el profiler de JavaScript reporta solo funciones de JavaScript: el código nativo de `Map` dentro de `buildPriceIndex` se cuenta como su tiempo propio. Además muestrea solo mientras corre JavaScript, así que el perfil "after" tiene pocas muestras: el servidor está casi siempre ocioso o dentro de E/S nativa.
- El profiling de CPU en Bun 1.4.2 se comprobó en el contenedor antes de usarlo: `node:inspector` con `Profiler.start` y `Profiler.stop` funciona y devuelve un árbol de llamadas `.cpuprofile`.

## Versiones y dependencias

| Qué | Versión |
| --- | --- |
| Imagen de Go | `golang:1.27.1-bookworm`, solo biblioteca estándar (sin dependencias de módulos) |
| Imagen de Bun | `oven/bun:1.4.2` |
| `zod` | 4.6.5 (validación del entorno, de la query string y del perfil) |
| `typescript`, `@types/bun` | 7.0.2, 1.4.2 (solo verificación de tipos) |

Ninguna dependencia fuera del stack del repositorio. El renderizador de flame graphs y el generador de carga están escritos aquí, a propósito: ambos son cortos, y leerlos es parte de la lección.
