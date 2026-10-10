# sorting-lower-bound

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **por qué ninguna ordenación por comparación supera Ω(n lg n) y cómo las ordenaciones por conteo escapan de ese límite**. Un generador construye el árbol de decisión de un algoritmo de ordenación real, contadores de comparaciones miden merge sort, heapsort y quicksort frente a lg(n!), y counting sort y radix sort ordenan las mismas entradas sin una sola comparación entre elementos.

Explicación completa: [docs/es/big-o/sorting-lower-bound.md](../../../docs/es/big-o/sorting-lower-bound.md).

## Temas del quiz que demuestra

- `big-o` / `sorting-lower-bound`: árboles de decisión, n! hojas, la altura ⌈lg n!⌉ y las ordenaciones que quedan fuera del modelo de comparación.
- `big-o` / `asymptotic-notation`: lg(n!) es Θ(n lg n).
- `big-o` / `best-worst-average-case`: la cota habla del peor caso y del promedio, no de toda entrada.

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-sorting-lower-bound.sh        # Linux y macOS
./setup-windows-sorting-lower-bound.ps1    # Windows
```

El script construye las dos imágenes, ejecuta las pruebas y ejecuta las demos.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/sorts.ts` | merge sort, heapsort y quicksort que reciben la comparación como función |
| `ts/src/decision-tree.ts` | construye el árbol de decisión de cualquiera de esas ordenaciones para n pequeño |
| `ts/src/linear-sorts.ts` | counting sort y radix sort |
| `ts/src/experiment.ts` | lg(n!), todas las permutaciones de entradas pequeñas, 1,000 entradas aleatorias |
| `ts/src/demo.ts` | `bun run demo`: imprime el árbol y las tablas, escribe `results/` |
| `python/lower_bound.py` | el mismo experimento con una clase de clave que sobrecarga los operadores de comparación |
| `python/demo.py` | `python demo.py`: imprime las tablas, escribe `results/results-python.md` |
| `results/` | resultados versionados: `results.md`, `results.json`, `results-python.md` |

TypeScript es la implementación de referencia (`oven/bun:1.4.2`). Python (`python:3.14.8-slim-trixie`) está aquí porque la lección cambia: la sobrecarga de operadores cuenta las comparaciones hechas dentro del `sorted` integrado, que no podemos editar, y demuestra que counting sort no hace ninguna. Ninguna de las dos implementaciones tiene dependencias de ejecución.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

El servicio de Python también ejecuta `ruff check` y `ruff format --check`.

## Demo

```sh
docker compose run --rm ts-demo        # bun run demo
docker compose run --rm python-demo    # python demo.py
```

La demo en TypeScript dibuja el árbol de decisión de merge sort para n = 3 e imprime tres tablas: los árboles para n = 3 y 4, todas las permutaciones para n hasta 8, y 1,000 entradas aleatorias de n = 1,000 con las ordenaciones por comparación junto a counting sort y radix sort. No hay dashboard: las tablas en [`results/results.md`](results/results.md) son el resultado.
