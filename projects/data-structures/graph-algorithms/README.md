# graph-algorithms

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

One small graph library, written in C++ and in Go, with two interchangeable representations (adjacency list and adjacency matrix) and the classic algorithms on top of them: Dijkstra, Bellman-Ford, topological sort, Prim and Kruskal. It teaches that the algorithm depends on the graph interface, not on how the graph is stored, and what each representation costs.

Full explanation: [docs/en/data-structures/graph-algorithms.md](../../../docs/en/data-structures/graph-algorithms.md).

## Quiz topics it demonstrates

- `data-structures` / `graphs`: adjacency list and adjacency matrix, their memory and operation costs, traversal order, cycle detection in directed graphs, topological ordering.
- `data-structures` / `heaps-and-priority-queues`: the min-heap that drives Dijkstra, Prim and the topological sort.

## Run

The only requirement is Docker.

```sh
./setup-unix-graph-algorithms.sh        # Linux and macOS
./setup-windows-graph-algorithms.ps1    # Windows
```

The script builds one pinned image per language and runs format check, linter and tests in each. The ten reference cases are mounted read-only from `reference-cases/`, so run it from a full checkout of the repository.

## Structure

| Path | Content |
| --- | --- |
| `cpp/graph.hpp`, `go/graph.go` | the `Graph` interface, `AdjacencyList` and `AdjacencyMatrix` |
| `cpp/algorithms.hpp`, `go/algorithms.go` | Dijkstra, Bellman-Ford, topological sort, DAG shortest paths, Prim, Kruskal, union-find |
| `go/heap.go` | the binary min-heap used by the Go algorithms |
| `cpp/cases.hpp`, `go/cases.go` | reader and solver of the reference case files |
| `cpp/cli.cpp`, `go/cmd/graphcli` | command line: solve a case, print a path |
| `cpp/bench.cpp`, `go/cmd/bench` | benchmark programs that honour the repository contract |
| `cases/sample-path.in` | a small weighted graph for the `path` command |
| `results/`, `dashboard/` | committed benchmark results and the static page that draws them |

## Tests

```sh
docker compose run --rm cpp-test
docker compose run --rm go-test
```

- **One suite, two representations**: the same checks run on the list and on the matrix (known distances and paths, negative weights, negative cycle reported, cycle reported by the topological sort, smallest topological order, minimum spanning tree, disconnected graph).
- **Random graphs**: on 200 random graphs, Dijkstra, Bellman-Ford and the DAG algorithm agree with each other, Prim agrees with Kruskal, and the list agrees with the matrix.
- **Reference cases**: the 10 `.in`/`.out` files of the course assignment. The adjacency list solves all 10. The matrix solves the 6 whose graph has at most 4,096 vertices (cases 1, 2, 3, 6, 7 and 8) and refuses the other 4, which would need up to 10^10 cells.

## Demo: one command per case

```sh
docker compose run --rm cpp-test graph_cli case /cases/1.in
docker compose run --rm go-test graphcli case /cases/8.in matrix
docker compose run --rm go-test graphcli path /samples/sample-path.in 0 4
```

`case` prints the answer in the format of the `.out` file. `path` prints the distance and the path, for example `distance: 2` and `path: 0 -> 2 -> 1 -> 3 -> 4`.

## Benchmark

```sh
bun run bench -- --project graph-algorithms
```

Run it from the repository root. Each row times one algorithm on a generated connected graph with n vertices and about 8n arcs, for n = 1,000 and n = 4,000 (the matrix limit is 4,096 vertices, and the cap keeps the run short on a shared machine). C++ and Go use the same generator and seed, and the `checksum` of each row is equal in both languages. Results: [results/results.md](results/results.md), page: `dashboard/index.html`.
