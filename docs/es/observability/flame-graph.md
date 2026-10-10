# Profiling con un flame graph (MP-OBS-4)

> English version: [docs/en/observability/flame-graph.md](../../en/observability/flame-graph.md) · Versão em português: [docs/pt/observability/flame-graph.md](../../pt/observability/flame-graph.md)

Miniproyecto: [`projects/observability/flame-graph`](../../../projects/observability/flame-graph/README.es.md). Temas del quiz: `profiling`, `three-signals`.

## El problema

Las métricas dicen que un servicio está lento. Un trace dice qué servicio y qué span de una petición. Ninguno dice qué **función** dentro del proceso quema la CPU. Leer el código tampoco ayuda mucho, porque las líneas caras suelen parecer baratas:

```go
match := compileRegex(linePattern).FindStringSubmatch(line)
```

```ts
return quote(order, (sku) => buildPriceIndex(catalog).get(sku));
```

Ambas parecen una consulta. Ambas hacen, para cada elemento de un bucle, un trabajo que solo hace falta hacer una vez. Adivinar a dónde se va el tiempo no es confiable; un profiler lo mide.

## 1. Un profiler de CPU por muestreo

Un profiler por muestreo no cronometra cada llamada. Muchas veces por segundo (unas 100 en Go, hasta unas 1000 en el motor JavaScript de Bun) interrumpe el programa y anota la **pila de llamadas** de lo que se estaba ejecutando. Una función que usa mucha CPU simplemente se encuentra en la pila más a menudo.

Dos consecuencias:

- La sobrecarga es baja y constante, así que se puede tomar un perfil de un servicio que está atendiendo carga real. Esa es la idea detrás del continuous profiling.
- El resultado es estadístico. Diez muestras no prueban nada; el laboratorio se niega a concluir algo con menos de 50 muestras dentro del handler. Un perfil de un servicio ocioso muestra solo al runtime esperando, así que el laboratorio inicia la carga **antes** de pedir el perfil.

Cada runtime expone su profiler mediante un endpoint HTTP que perfila el proceso en ejecución durante N segundos:

| | Go | TypeScript (Bun) |
| --- | --- | --- |
| Endpoint en el laboratorio | `GET /debug/pprof/profile?seconds=5` | `GET /debug/cpuprofile?seconds=5` |
| Mecanismo | `net/http/pprof`, biblioteca estándar | `node:inspector`: `Profiler.start`, `Profiler.stop` |
| Salida | pprof (protocol buffer comprimido con gzip) | `.cpuprofile` (árbol de llamadas JSON, el formato de DevTools) |

Estos endpoints revelan detalles internos. En el laboratorio solo son alcanzables en una red interna de docker-compose.

## 2. Pilas plegadas

Ambos formatos se reducen al mismo texto plano, una línea por pila de llamadas distinta:

```text
net/http.(*conn).serve;...;main.handleReportBefore;...;flame-graph/report.compileRegex;regexp.MustCompile;... 37
```

Los cuadros de la raíz a la hoja, unidos por `;`, y luego el número de muestras que tenían exactamente esa pila.

- Go: `go tool pprof -traces -sample_index=samples` imprime cada grupo de muestras empezando por la hoja; `go/fold` invierte cada bloque y suma las pilas repetidas. No hace falta ninguna biblioteca para decodificar el perfil.
- TypeScript: un `.cpuprofile` es un árbol en el que cada nodo tiene un `hitCount`, las muestras que encontraron la CPU exactamente ahí. Subir desde un nodo hasta la raíz reconstruye su pila.

## 3. Dibujar el flame graph

El renderizador (`ts/src/svg.ts`) fusiona las pilas en un árbol. Las pilas que empiezan con los mismos cuadros comparten esas cajas, y esa fusión es todo el truco: miles de muestras se condensan en una imagen en la que una función caliente es una caja ancha.

![Go, antes de la corrección](../../../projects/observability/flame-graph/results/flame-go-before.svg)

Reglas de lectura:

| Lo que ves | Qué significa |
| --- | --- |
| Una caja | Una función |
| La caja encima de ella | Una función que ella llamó. Una columna es una pila de llamadas, con la raíz abajo |
| Ancho | Porción de las muestras: la función más todo lo que llamó (`cum` en pprof) |
| Una caja ancha sin nada encima | Tiempo propio (`flat` en pprof): la CPU estaba en el código de esa función |
| De izquierda a derecha | Nada. Los hermanos se ordenan por nombre. **El eje x no es tiempo** |
| Color | Nada. Solo distingue a los vecinos. Una función se resalta en morado |

En la imagen de arriba las mesetas están dentro de `regexp/syntax` y del asignador de memoria, código de la biblioteca estándar que no se puede "optimizar" desde la aplicación. La pregunta útil es: bajando por la torre, ¿cuál es la primera caja que pertenece a la aplicación y que no debería ser tan ancha? Es `compileRegex`, con el 90.5% de las muestras del handler.

## 4. La corrección

El paso caro se saca del bucle y se hace una sola vez.

```go
var lineRegex = regexp.MustCompile(linePattern) // once, at start-up

match := lineRegex.FindStringSubmatch(line)
```

```ts
const priceIndex = buildPriceIndex(catalog); // once, at start-up

return quote(order, (sku) => index.get(sku));
```

Una prueba en cada lenguaje comprueba que las dos variantes devuelven exactamente el mismo resultado: una corrección debe cambiar el costo y nada más.

Después de la corrección la función caliente está ausente del perfil (0 muestras en ambos lenguajes), y la imagen cambia de forma:

![Go, después de la corrección](../../../projects/observability/flame-graph/results/flame-go-after.svg)

## 5. Medir lo que vale la corrección

El perfil responde "dónde". No responde "cuánto más rápido será el servicio": quitar una función que concentra el 90% de la CPU del handler no hace que cada petición sea diez veces más rápida si el resto de la petición es red y planificación. Por eso el laboratorio mide el throughput antes y después, con la misma carga de lazo cerrado (16 conexiones, 1 CPU por servidor, calentamiento descartado, mediana de 5 ejecuciones):

| Servicio | Antes (req/s) | Después (req/s) | Factor |
| --- | --- | --- | --- |
| Go | 222 | 3133 | **14.1x** |
| TypeScript (Bun) | 405 | 22894 | **56.5x** |

La máquina se compartió con otras cargas y la dispersión entre ejecuciones fue grande (hasta el 42% de la mediana). Otras dos ejecuciones completas dieron 14.7x y 24.3x para Go y 57.7x y 44.0x para TypeScript. Tabla completa, dispersión y máquina: [results/results.md](../../../projects/observability/flame-graph/results/results.md).

## Perfil, trace, métrica

| Pregunta | Señal |
| --- | --- |
| ¿El servicio está más lento que la semana pasada? | Métrica (histograma de latencia) |
| ¿Qué servicio y qué paso de esta petición fue lento? | Trace |
| ¿Qué función de este proceso usa la CPU? | Perfil |

Un trace cubre una petición a través de los procesos e incluye el tiempo de espera. Un perfil de CPU cubre todas las peticiones de un proceso e incluye solo el tiempo en la CPU: una petición que espera 800 ms a una base de datos es larga en un trace e invisible en un perfil de CPU. El miniproyecto [three-signals](three-signals.md) muestra las dos primeras filas.

## Lo que el runtime hace con tus pilas

- Go incrusta (inline) las funciones pequeñas. `compileRegex` se incrusta en quien la llama, y el perfil aun así la muestra como un cuadro, porque el formato del perfil registra las llamadas incrustadas. `go/fold` las conserva.
- En la imagen "before" de TypeScript, `quoteBefore` no aparece entre `handleQuoteBefore` y `quote`: su última acción es una llamada en posición de cola, y JavaScriptCore puede reutilizar el marco de pila para una llamada así. Un profiler muestra las pilas que existen en tiempo de ejecución.
- El profiler de JavaScript reporta solo funciones de JavaScript. El código nativo de `Map` dentro de `buildPriceIndex` se cuenta como su tiempo propio, por eso la imagen de TypeScript es una torre corta.

## Ejecutar

```sh
cd projects/observability/flame-graph
./setup-unix-flame-graph.sh       # or .\setup-windows-flame-graph.ps1: build, tests, live profile check
docker compose run --rm flame     # regenerate the profiles and the four SVG files in results/
docker compose run --rm bench     # regenerate the before/after table
docker compose down -v
```

Versiones: `golang:1.27.1-bookworm` (solo biblioteca estándar), `oven/bun:1.4.2`, `zod` 4.6.5.
