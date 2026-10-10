# Graph algorithms

> Versão em português: [docs/pt/data-structures/graph-algorithms.md](../../pt/data-structures/graph-algorithms.md) · Versión en español: [docs/es/data-structures/graph-algorithms.md](../../es/data-structures/graph-algorithms.md)

Mini-project: [projects/data-structures/graph-algorithms](../../../projects/data-structures/graph-algorithms). Languages: C++, Go. Quiz topic: `data-structures` / `graphs`.

## The idea

A graph is a set of vertices and a set of edges between them. Before any algorithm, there is a design decision: how to store it. This mini-project defines one small interface (`vertex count`, `add arc`, `has arc`, `neighbours`), implements it twice and writes every algorithm against the interface. The same test suite then runs on both implementations.

## Two representations

```text
arcs: 0->1 (4), 0->2 (1), 2->1 (2)

adjacency list               adjacency matrix
0: (1, 4) (2, 1)                  0    1    2
1:                           0    -    4    1
2: (1, 2)                    1    -    -    -
                             2    -    2    -
```

| Operation | Adjacency list | Adjacency matrix |
| --- | --- | --- |
| Memory | O(V + E) | O(V^2) |
| Does the arc (u, v) exist? | O(degree of u) | O(1) |
| Neighbours of u | O(degree of u) | O(V) |
| Visit every arc | O(V + E) | O(V^2) |
| Parallel arcs | all kept | only the lightest |

The list suits sparse graphs, which are the common case. The matrix pays off when the graph is dense or when the arc test dominates. Its vertex limit here is 4,096: a matrix for the 100,000 vertices of reference cases 4 and 5 would need 10^10 cells.

## The algorithms

| Algorithm | Problem | Idea | Cost with a list |
| --- | --- | --- | --- |
| Dijkstra | shortest paths from one source, no negative weight | settle the closest unsettled vertex, taken from a min-heap | O((V + E) log V) |
| Bellman-Ford | shortest paths with negative weights | relax every arc V - 1 times | O(V E) |
| Topological sort (Kahn) | an order where every arc goes forward | list a vertex when its incoming count reaches zero | O((V + E) log V) with the heap |
| DAG shortest paths | shortest paths in an acyclic graph | relax in topological order, once | O(V + E) |
| Prim | minimum spanning tree | grow one tree with the lightest edge leaving it | O(E log V) |
| Kruskal | minimum spanning tree | take edges from lightest to heaviest, skip the ones that close a cycle (union-find) | O(E log E) |

### What "reports" means

- **Dijkstra** refuses a graph with a negative weight, because its greedy choice would no longer be safe.
- **Bellman-Ford** sets `negative cycle` when one more round of relaxation still improves a distance. With such a cycle, "shortest path" has no meaning.
- **Topological sort** sets `has cycle` when fewer than V vertices could be listed. A vertex on a cycle, or one that depends on a cycle, never reaches an incoming count of zero. The partial order is still returned.
- **Prim and Kruskal** set `connected` to false when the graph has more than one component.

## The ten reference cases

The cases come from a course assignment and have two kinds of problem.

1. **Smallest topological order** (cases 1 to 5). The ready vertices wait in a min-heap, so the smallest label always goes first. Cases 4 and 5 are random graphs with 100,000 vertices that do contain cycles: 79 and 28 vertices respectively cannot be ordered, and the expected output lists only the others. The library reports the cycle and prints the partial order, which matches the expected files.
2. **Packing objects into boxes** (cases 6 to 10). n objects, in order, go into exactly k boxes of volume V, and the cost is the sum of the squared leftover of each box. This is solved as a shortest path in a layered acyclic graph: the vertex (j, i) means "j boxes closed, i objects packed". It is the same computation as the dynamic programming table, seen as a graph.

Both languages pass the 10 cases with the adjacency list. The matrix passes the 6 cases that fit its vertex limit.

## What the benchmark shows

`bun run bench -- --project graph-algorithms` runs each algorithm on generated graphs with 1,000 and 4,000 vertices and about 8 arcs per vertex. The committed table is [results/results.md](../../../projects/data-structures/graph-algorithms/results/results.md).

In the committed run, with 4,000 vertices, Dijkstra on the matrix took about 15 times longer than on the list in both languages (the `section` column), and the process used about 129 MiB instead of 5 MiB. The graph and the answer are the same: the checksum column is identical for list and matrix, and for C++ and Go. Times of a few milliseconds are noisy on a shared machine, so only large ratios like this one are conclusions.

## Run it

```sh
cd projects/data-structures/graph-algorithms
./setup-unix-graph-algorithms.sh          # or ./setup-windows-graph-algorithms.ps1
docker compose run --rm cpp-test graph_cli case /cases/1.in
```
