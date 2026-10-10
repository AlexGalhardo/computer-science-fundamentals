# hash-map

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un mapa de dispersión (hash map) escrito desde cero, dos veces: con **encadenamiento separado** (una lista enlazada por cubeta) y con **direccionamiento abierto** (sondeo lineal dentro de un solo arreglo). Enseña cómo se resuelven las colisiones, por qué la eliminación en el direccionamiento abierto necesita lápidas (tombstones) y por qué el factor de carga decide la velocidad de una búsqueda.

Explicación completa: [docs/es/data-structures/hash-map.md](../../../docs/es/data-structures/hash-map.md).

## Temas del quiz que demuestra

- `data-structures` / `hash-tables`: colisiones, encadenamiento separado, sondeo lineal, lápidas, factor de carga, rehashing, agrupamiento primario.
- `data-structures` / `arrays-and-lists`: la lista enlazada dentro de cada cubeta y la eliminación de un nodo sin caso especial para la cabeza.

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-hash-map.sh        # Linux y macOS
./setup-windows-hash-map.ps1    # Windows
```

El script construye una imagen fijada por lenguaje y ejecuta las pruebas en cada una. Las imágenes de C++ y de Rust también ejecutan la revisión de formato y el linter (clang-format, rustfmt, clippy). TypeScript se formatea y analiza con Biome y se le verifican los tipos desde la raíz del repositorio: `bunx biome check projects/data-structures/hash-map` y `bunx tsc --noEmit -p projects/data-structures/hash-map/ts`.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/hash_map.hpp` | `ChainingMap` y `ProbingMap` en C++23, claves `uint64_t` |
| `rust/src/lib.rs` | los mismos dos mapas en Rust, claves `u64` |
| `ts/src/hash-map.ts` | los mismos dos mapas en TypeScript, claves enteras sin signo de 32 bits |
| `*/bench.*`, `rust/src/bench.rs` | programas de benchmark que siguen el contrato del repositorio |
| `bench.json` | la grilla del benchmark: 3 lenguajes, 2 estrategias, 4 factores de carga |
| `results/` | resultados versionados de la última ejecución del benchmark |
| `dashboard/` | página estática que dibuja `results/results.js` |

Las tres implementaciones exponen `put`, `get`, `remove`, tamaño, capacidad y factor de carga, y reciben la función de dispersión como parámetro, para que las pruebas puedan forzar colisiones.

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
docker compose run --rm ts-test
```

- **Pruebas de propiedad**: 5 semillas con 20,000 operaciones aleatorias de `put`, `get` y `remove` cada una, para las dos estrategias y para un hash bueno y uno deliberadamente débil. Cada respuesta se compara con el mapa del lenguaje (`std::unordered_map`, `HashMap`, `Map`).
- **Redimensionamiento**: 10,000 inserciones nunca dejan que el factor de carga pase del límite, y todas las claves sobreviven a los rehashes.
- **Lápidas**: después de eliminar una de tres claves que colisionan e insertar otra, `get` sigue devolviendo los valores correctos.

## Benchmark

```sh
bun run bench -- --project hash-map
```

Ejecútalo desde la raíz del repositorio. Cada fila arma una tabla con exactamente el factor de carga pedido (sin redimensionar) y cronometra 200,000 búsquedas de claves guardadas y 200,000 búsquedas de claves ausentes. Los resultados van a `results/`, y la página `dashboard/index.html` se abre directo desde el disco.

Lee [results/results.md](results/results.md) con la columna `section` y la columna `Variant` (el factor de carga). El límite de 200,000 claves mantiene la ejecución corta en una máquina compartida. Los números tienen ruido por debajo de la carga 0.75, así que la única conclusión segura es el salto del sondeo lineal en 0.9.
