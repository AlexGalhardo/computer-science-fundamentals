# lru-bloom-trie

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Tres estructuras pequeñas que están detrás de sistemas del día a día, escritas en TypeScript y en Go: una **caché LRU** con `get` y `put` en O(1) (lo que hace una caché cuando se llena), un **filtro de Bloom** con tamaño y número de funciones de dispersión configurables (una prueba de pertenencia con pocos bits por clave, con falsos positivos y sin falsos negativos), y un **trie** (búsqueda por prefijo, como en el autocompletado).

Explicación completa: [docs/es/data-structures/lru-bloom-trie.md](../../../docs/es/data-structures/lru-bloom-trie.md).

## Temas del quiz que demuestra

- `data-structures` / `arrays-and-lists`: la lista doblemente enlazada, y por qué la caché LRU necesita ambos punteros para desenlazar un nodo en O(1).
- `data-structures` / `hash-tables`: el mapa de dispersión de la clave al nodo en la caché, y las funciones hash usadas como selectores de bits en el filtro de Bloom.
- `data-structures` / `binary-trees-and-traversals`: el trie es un árbol con muchos hijos por nodo, listado con un recorrido en profundidad.
- `data-structures` / `abstract-data-types`: cada estructura se prueba contra un modelo de referencia simple que tiene la misma interfaz.

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-lru-bloom-trie.sh        # Linux y macOS
./setup-windows-lru-bloom-trie.ps1    # Windows
```

El script construye una imagen fijada por lenguaje y ejecuta las pruebas en cada una. La imagen de Go también ejecuta `gofmt`, `go vet` y `golangci-lint`. TypeScript se formatea y analiza con Biome y se le verifican los tipos desde la raíz del repositorio: `bunx biome check projects/data-structures/lru-bloom-trie` y `bunx tsc --noEmit -p projects/data-structures/lru-bloom-trie/ts`.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/lru-cache.ts`, `go/lru.go` | caché LRU: mapa de dispersión más lista doblemente enlazada |
| `ts/src/bloom-filter.ts`, `go/bloom.go` | filtro de Bloom: arreglo de bits, doble hashing, fórmulas de dimensionamiento |
| `ts/src/trie.ts`, `go/trie.go` | trie: inserción, búsqueda exacta, listado por prefijo en orden alfabético |
| `ts/src/words.ts`, `go/words.go` | generador determinista de las 100,000 palabras de prueba |
| `ts/demo.ts`, `go/cmd/demo` | la demo |
| `results/demo-output.md` | salida versionada de la demo |

No hay dependencias en ninguno de los dos lenguajes.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm go-test
```

- **Caché LRU**: para capacidades de 1 a 8, 5,000 operaciones aleatorias de `get` y `put` cada una se comparan con un modelo de referencia (una lista simple mantenida en orden de uso). El valor devuelto, la clave expulsada y el orden entero de las claves deben coincidir después de cada operación.
- **Filtro de Bloom**: cuatro configuraciones, de 4 a 10 bits por clave. Ninguna clave agregada se reporta jamás como ausente, y la tasa de falsos positivos medida con 200,000 claves que nunca se agregaron se mantiene a menos de 20% de la tasa teórica (1 - e^(-kn/m))^k. En la ejecución versionada la diferencia fue menor que 3%.
- **Trie**: sobre 100,000 palabras generadas, 305 prefijos devuelven exactamente el mismo conjunto que un filtro lineal con `startsWith`.

## Demo

```sh
docker compose run --rm ts-test bun run demo.ts
docker compose run --rm go-test lbt_demo
```

Imprime una traza de LRU con expulsiones, la tasa de falsos positivos medida frente a la teórica del filtro de Bloom, y búsquedas por prefijo sobre 100,000 palabras. Salida versionada: [results/demo-output.md](results/demo-output.md).
