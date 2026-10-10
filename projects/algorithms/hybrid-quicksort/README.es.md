# hybrid-quicksort

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un quicksort con dos perillas: la estrategia de pivote (primer elemento, aleatorio, mediana de tres) y el umbral `k` por debajo del cual un tramo se ordena con insertion sort. El proyecto mide qué cambia cada perilla en la práctica: el pivote decide si la entrada ordenada es el mejor caso o el peor caso cuadrático, y el umbral reduce el factor constante.

Ítem del plan: MP-ALG-4. Lenguajes: C++ y Rust. Texto completo: [docs/es/algorithms/hybrid-quicksort.md](../../../docs/es/algorithms/hybrid-quicksort.md).

## Qué enseña

- Con el primer elemento como pivote, las entradas ordenadas e invertidas dividen cada tramo en "nada" y "todo lo demás": `n` niveles en lugar de `log n`, y un tiempo que crece 16 veces cuando `n` crece 4 veces.
- Un pivote aleatorio elimina la entrada mala: el peor caso pasa a depender de la suerte, no de los datos. La mediana de tres hace lo mismo para datos ordenados al precio de dos comparaciones.
- Recurrir sobre el lado menor mantiene la pila con profundidad `O(log n)` incluso cuando el tiempo es cuadrático.
- Cambiar a insertion sort en tramos pequeños mantiene el crecimiento `O(n log n)` y baja la constante. El mejor `k` se encuentra midiendo, y depende del lenguaje y de la máquina.

## Temas del quiz que demuestra

Área `algorithms`:

- `quicksort` (partición, peor caso, estrategias de pivote, pivote aleatorio, profundidad de pila, umbral de insertion sort)
- `elementary-sorts` (insertion sort en tramos pequeños o casi ordenados)
- `sorting-properties` (comportamiento adaptativo y formas de entrada)

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-hybrid-quicksort.sh        # Linux y macOS
./setup-windows-hybrid-quicksort.ps1    # Windows
```

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/quicksort.hpp` | El quicksort, las tres estrategias de pivote, las formas de entrada y el checksum |
| `cpp/main.cpp` | Entrada del benchmark y barrido del umbral |
| `cpp/test_quicksort.cpp` | Pruebas |
| `rust/src/lib.rs`, `rust/src/main.rs` | Lo mismo en Rust, con las pruebas dentro de `lib.rs` |
| `bench.json`, `results/` | Cuadrícula del benchmark y resultados versionados |
| `dashboard/` | Página estática que grafica `results/results.js` |

Una implementación se nombra `<pivote>-k<umbral>`, por ejemplo `median3-k10`. Las entradas se construyen en memoria a partir de una semilla fija: `random`, `sorted` y `reversed` contienen los mismos valores en un orden distinto.

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- Cada estrategia de pivote con cada umbral (0, 5, 10, 20, 50) ordena cada forma en seis tamaños, además de una entrada llena de duplicados. El oráculo es el ordenamiento de la biblioteca.
- Con el pivote del primer elemento sobre entrada ordenada, el tiempo debe crecer más de 8 veces cuando `n` crece 4 veces (el crecimiento cuadrático predice 16), mientras que la mediana de tres debe crecer menos de 8 veces (`n log n` predice cerca de 4.4).

Formateadores y linters (clang-format, rustfmt, clippy) se ejecutan en las imágenes base:

```sh
./lint.sh          # comprobar
./lint.sh --fix    # reescribir
```

## Benchmark

```sh
bun run bench -- --project projects/algorithms/hybrid-quicksort
```

La cuadrícula ejecuta siete implementaciones (`first-k0`, `random-k0`, `median3-k0`, `median3-k5`, `median3-k10`, `median3-k20`, `median3-k50`) sobre las tres formas con 4,000, 16,000 y 1,000,000 de valores, en ambos lenguajes. Dentro de cada programa la ordenación se repite 5 veces sobre copias nuevas y la mediana se informa como el tramo medido.

Límites: `first-k0` se detiene en 16,000 valores, porque con 1,000,000 su caso cuadrático tardaría minutos por ejecución. Todo lo demás corre en milisegundos.

### Barrido del umbral

Un comando por lenguaje ordena los mismos 1,000,000 de valores aleatorios con `k` = 0, 5, 10, 20 y 50 e imprime el mejor valor:

```sh
docker compose run --rm cpp-sweep
docker compose run --rm rust-sweep
```

La salida versionada está en `results/threshold-cpp.md` y `results/threshold-rust.md`.

### Dashboard

Abre `dashboard/index.html` en un navegador, directamente desde el disco. Lee el `results/results.js` versionado y dibuja el tiempo contra `n`, una línea por estrategia. Usa el selector "Variant" para alternar entre `random`, `sorted` y `reversed`: en `sorted` la línea de `first-k0` sube con pendiente 2 en el gráfico log-log mientras que las demás se mantienen cerca de la pendiente 1.

### Qué muestran los resultados versionados

Tramo medido en milisegundos (mediana de 5 ordenaciones), de `results/results.md` (120 filas, unos 4 minutos):

| Implementación | Forma | n | C++ | Rust |
| --- | --- | ---: | ---: | ---: |
| `first-k0` | sorted | 4,000 | 3.81 | 14.9 |
| `first-k0` | sorted | 16,000 | 51.4 | 212 |
| `median3-k0` | sorted | 4,000 | 0.04 | 0.06 |
| `median3-k0` | sorted | 16,000 | 0.17 | 0.19 |
| `random-k0` | sorted | 16,000 | 0.29 | 0.30 |
| `median3-k0` | random | 1,000,000 | 89.8 | 121 |
| `median3-k5` | random | 1,000,000 | 85.7 | 79.3 |
| `median3-k10` | random | 1,000,000 | 82.5 | 68.7 |
| `median3-k20` | random | 1,000,000 | 74.6 | 69.6 |
| `median3-k50` | random | 1,000,000 | 68.1 | 65.7 |

- **Pivote.** Con entrada ordenada, `first-k0` creció 13.5 veces (C++) y 14.2 veces (Rust) cuando `n` creció 4 veces: crecimiento cuadrático, que predice 16. La mediana de tres creció cerca de 4 veces. Con 16,000 valores el pivote del primer elemento ya es unas 300 veces (C++) y 1,100 veces (Rust) más lento que la mediana de tres.
- **Umbral.** El mejor valor registrado es **k = 50** en ambos lenguajes, en la cuadrícula de arriba y en el barrido dedicado (`results/threshold-cpp.md`: 56.7 ms contra 91.8 ms con k = 0, `results/threshold-rust.md`: 60.4 ms contra 67.7 ms). La ganancia es un factor constante, como se esperaba.
- Los rangos del barrido se superponen para umbrales vecinos, y la máquina era compartida, así que lee "k = 50 es lo mejor aquí" como "un umbral de unas pocas decenas de valores ayuda", no como una constante universal.
- Las 120 filas imprimen el mismo checksum para la misma forma y tamaño: cada estrategia, cada umbral y ambos lenguajes producen la misma salida ordenada.
