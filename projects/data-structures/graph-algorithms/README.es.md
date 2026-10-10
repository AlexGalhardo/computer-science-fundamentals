# graph-algorithms

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una pequeña biblioteca de grafos, escrita en C++ y en Go, con dos representaciones intercambiables (lista de adyacencia y matriz de adyacencia) y los algoritmos clásicos encima de ellas: Dijkstra, Bellman-Ford, ordenamiento topológico, Prim y Kruskal. Enseña que el algoritmo depende de la interfaz del grafo, no de cómo se almacena, y lo que cuesta cada representación.

Explicación completa: [docs/es/data-structures/graph-algorithms.md](../../../docs/es/data-structures/graph-algorithms.md).

## Temas del quiz que demuestra

- `data-structures` / `graphs`: lista de adyacencia y matriz de adyacencia, sus costos de memoria y de operación, orden de recorrido, detección de ciclos en grafos dirigidos, ordenamiento topológico.
- `data-structures` / `heaps-and-priority-queues`: el heap de mínimo que impulsa Dijkstra, Prim y el ordenamiento topológico.

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-graph-algorithms.sh        # Linux y macOS
./setup-windows-graph-algorithms.ps1    # Windows
```

El script construye una imagen fijada por lenguaje y ejecuta la revisión de formato, el linter y las pruebas en cada una. Los diez casos de referencia se montan como solo lectura desde `reference-cases/`, así que ejecútalo desde un checkout completo del repositorio.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/graph.hpp`, `go/graph.go` | la interfaz `Graph`, `AdjacencyList` y `AdjacencyMatrix` |
| `cpp/algorithms.hpp`, `go/algorithms.go` | Dijkstra, Bellman-Ford, ordenamiento topológico, caminos mínimos en DAG, Prim, Kruskal, union-find |
| `go/heap.go` | el heap binario de mínimo que usan los algoritmos de Go |
| `cpp/cases.hpp`, `go/cases.go` | lector y solucionador de los archivos de casos de referencia |
| `cpp/cli.cpp`, `go/cmd/graphcli` | línea de comandos: resolver un caso, imprimir un camino |
| `cpp/bench.cpp`, `go/cmd/bench` | programas de benchmark que siguen el contrato del repositorio |
| `cases/sample-path.in` | un pequeño grafo con pesos para el comando `path` |
| `results/`, `dashboard/` | resultados de benchmark versionados y la página estática que los dibuja |

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm go-test
```

- **Una suite, dos representaciones**: las mismas verificaciones corren en la lista y en la matriz (distancias y caminos conocidos, pesos negativos, ciclo negativo reportado, ciclo reportado por el ordenamiento topológico, menor orden topológico, árbol generador mínimo, grafo desconectado).
- **Grafos aleatorios**: en 200 grafos aleatorios, Dijkstra, Bellman-Ford y el algoritmo para DAG concuerdan entre sí, Prim concuerda con Kruskal, y la lista concuerda con la matriz.
- **Casos de referencia**: los 10 archivos `.in`/`.out` de la tarea del curso. La lista de adyacencia resuelve los 10. La matriz resuelve los 6 cuyo grafo tiene como máximo 4,096 vértices (casos 1, 2, 3, 6, 7 y 8) y rechaza los otros 4, que necesitarían hasta 10^10 celdas.

## Demo: un comando por caso

```sh
docker compose run --rm cpp-test graph_cli case /cases/1.in
docker compose run --rm go-test graphcli case /cases/8.in matrix
docker compose run --rm go-test graphcli path /samples/sample-path.in 0 4
```

`case` imprime la respuesta en el formato del archivo `.out`. `path` imprime la distancia y el camino, por ejemplo `distance: 2` y `path: 0 -> 2 -> 1 -> 3 -> 4`.

## Benchmark

```sh
bun run bench -- --project graph-algorithms
```

Ejecútalo desde la raíz del repositorio. Cada fila cronometra un algoritmo en un grafo conexo generado con n vértices y cerca de 8n arcos, para n = 1,000 y n = 4,000 (el límite de la matriz es 4,096 vértices, y el tope mantiene la ejecución corta en una máquina compartida). C++ y Go usan el mismo generador y la misma semilla, y el `checksum` de cada fila es igual en ambos lenguajes. Resultados: [results/results.md](results/results.md), página: `dashboard/index.html`.
