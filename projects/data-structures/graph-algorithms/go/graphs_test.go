package graphs

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

type random struct{ state uint64 }

func (r *random) below(limit int) int {
	r.state ^= r.state << 13
	r.state ^= r.state >> 7
	r.state ^= r.state << 17
	return int(r.state % uint64(limit))
}

func mustGraph(t *testing.T, representation Representation, vertices int) Graph {
	t.Helper()
	graph, err := NewGraph(representation, vertices)
	if err != nil {
		t.Fatalf("NewGraph: %v", err)
	}
	return graph
}

func pathCost(graph Graph, path []int) Weight {
	total := Weight(0)
	for i := 1; i < len(path); i++ {
		best := Infinity
		for _, edge := range graph.Neighbors(path[i-1]) {
			if edge.To == path[i] && edge.Weight < best {
				best = edge.Weight
			}
		}
		total += best
	}
	return total
}

// EN: The same suite runs once per representation. This is the point of programming against
// the Graph interface: if the list and the matrix pass identical tests, an algorithm cannot
// tell them apart.
// PT: A mesma suíte roda uma vez por representação. Esse é o sentido de programar contra a
// interface Graph: se a lista e a matriz passam em testes idênticos, um algoritmo não consegue
// diferenciá-las.
// ES: La misma suite corre una vez por representación. Ese es el sentido de programar contra la
// interfaz Graph: si la lista y la matriz pasan pruebas idénticas, un algoritmo no puede
// distinguirlas.
func TestSuiteOnBothRepresentations(t *testing.T) {
	for name, representation := range map[string]Representation{"list": List, "matrix": Matrix} {
		t.Run(name, func(t *testing.T) {
			t.Run("dijkstra", func(t *testing.T) {
				graph := mustGraph(t, representation, 5)
				graph.AddArc(0, 1, 4)
				graph.AddArc(0, 2, 1)
				graph.AddArc(2, 1, 2)
				graph.AddArc(1, 3, 1)
				graph.AddArc(2, 3, 5)
				if !graph.HasArc(2, 1) || graph.HasArc(1, 2) {
					t.Error("arcs must be directed")
				}
				result, err := Dijkstra(graph, 0)
				if err != nil {
					t.Fatal(err)
				}
				if want := []Weight{0, 3, 1, 4, Infinity}; !slices.Equal(result.Distance, want) {
					t.Errorf("distances = %v, want %v", result.Distance, want)
				}
				if want := []int{0, 2, 1, 3}; !slices.Equal(PathTo(result, 3), want) {
					t.Errorf("path = %v, want %v", PathTo(result, 3), want)
				}
				if PathTo(result, 4) != nil {
					t.Error("an unreachable vertex must have no path")
				}
			})
			t.Run("negative weights", func(t *testing.T) {
				graph := mustGraph(t, representation, 4)
				graph.AddArc(0, 1, 4)
				graph.AddArc(0, 2, 5)
				graph.AddArc(2, 1, -3)
				graph.AddArc(1, 3, 2)
				if _, err := Dijkstra(graph, 0); !errors.Is(err, ErrNegativeWeight) {
					t.Errorf("Dijkstra error = %v, want ErrNegativeWeight", err)
				}
				result := BellmanFord(graph, 0)
				if want := []Weight{0, 2, 5, 4}; !slices.Equal(result.Distance, want) {
					t.Errorf("bellman-ford = %v, want %v", result.Distance, want)
				}
				if result.NegativeCycle {
					t.Error("no negative cycle expected")
				}
				dag, err := DagShortestPaths(graph, 0)
				if err != nil || !slices.Equal(dag.Distance, result.Distance) {
					t.Errorf("DAG paths = %v (%v), want %v", dag.Distance, err, result.Distance)
				}
			})
			t.Run("cycles are reported", func(t *testing.T) {
				graph := mustGraph(t, representation, 3)
				graph.AddArc(0, 1, 1)
				graph.AddArc(1, 2, -1)
				graph.AddArc(2, 1, -1)
				if !BellmanFord(graph, 0).NegativeCycle {
					t.Error("bellman-ford must report the negative cycle")
				}
				sorted := TopologicalSort(graph)
				if !sorted.HasCycle || !slices.Equal(sorted.Order, []int{0}) {
					t.Errorf("topological sort = %+v, want cycle with order [0]", sorted)
				}
				if _, err := DagShortestPaths(graph, 0); !errors.Is(err, ErrCycle) {
					t.Errorf("DagShortestPaths error = %v, want ErrCycle", err)
				}
			})
			t.Run("smallest topological order", func(t *testing.T) {
				graph := mustGraph(t, representation, 5)
				graph.AddArc(0, 1, 1)
				graph.AddArc(0, 2, 1)
				graph.AddArc(4, 3, 1)
				sorted := TopologicalSort(graph)
				if want := []int{0, 1, 2, 4, 3}; sorted.HasCycle || !slices.Equal(sorted.Order, want) {
					t.Errorf("order = %+v, want %v", sorted, want)
				}
			})
			t.Run("minimum spanning tree", func(t *testing.T) {
				graph := mustGraph(t, representation, 5)
				AddEdge(graph, 0, 1, 1)
				AddEdge(graph, 1, 2, 2)
				AddEdge(graph, 0, 2, 3)
				AddEdge(graph, 2, 3, 4)
				if Prim(graph, 0).Connected || Kruskal(graph).Connected {
					t.Error("a disconnected graph has no spanning tree")
				}
				AddEdge(graph, 3, 4, 7)
				AddEdge(graph, 0, 4, 9)
				for algorithm, tree := range map[string]SpanningTree{"prim": Prim(graph, 0), "kruskal": Kruskal(graph)} {
					if !tree.Connected || tree.Total != 14 || len(tree.Edges) != 4 {
						t.Errorf("%s = %+v, want total 14 with 4 edges", algorithm, tree)
					}
				}
			})
		})
	}
}

// EN: Random graphs compare the algorithms with each other and the two representations with
// each other. Dijkstra and Bellman-Ford are different ideas, so when they agree on hundreds of
// random graphs a shared bug is unlikely. The same holds for Prim and Kruskal.
// PT: Grafos aleatórios comparam os algoritmos entre si e as duas representações entre si.
// Dijkstra e Bellman-Ford são ideias diferentes, então, quando concordam em centenas de grafos
// aleatórios, um erro em comum é improvável. O mesmo vale para Prim e Kruskal.
// ES: Los grafos aleatorios comparan los algoritmos entre sí y las dos representaciones entre
// sí. Dijkstra y Bellman-Ford son ideas distintas, así que, cuando coinciden en cientos de
// grafos aleatorios, un error común es improbable. Lo mismo vale para Prim y Kruskal.
func TestRandomGraphs(t *testing.T) {
	rng := &random{state: 2024}
	for round := range 200 {
		n := 2 + rng.below(30)
		m := rng.below(4 * n)
		graphs := make([]Graph, 6)
		for i := range graphs {
			graphs[i] = mustGraph(t, Representation(i%2), n)
		}
		list, matrix, dagList, dagMatrix, treeList, treeMatrix := graphs[0], graphs[1], graphs[2], graphs[3], graphs[4], graphs[5]
		for v := 1; v < n; v++ {
			other, weight := rng.below(v), Weight(1+rng.below(50))
			AddEdge(treeList, v, other, weight)
			AddEdge(treeMatrix, v, other, weight)
		}
		for range m {
			a, b, weight := rng.below(n), rng.below(n), Weight(rng.below(50))
			list.AddArc(a, b, weight)
			matrix.AddArc(a, b, weight)
			if a != b {
				AddEdge(treeList, a, b, weight)
				AddEdge(treeMatrix, a, b, weight)
				// EN: Arcs that always go from the smaller to the larger label cannot form a
				// cycle, which is an easy way of generating a random acyclic graph.
				// PT: Arcos que sempre vão do rótulo menor para o maior não formam ciclo, um
				// jeito fácil de gerar um grafo acíclico aleatório.
				// ES: Los arcos que siempre van de la etiqueta menor a la mayor no forman ciclo,
				// una forma fácil de generar un grafo acíclico aleatorio.
				dagList.AddArc(min(a, b), max(a, b), weight)
				dagMatrix.AddArc(min(a, b), max(a, b), weight)
			}
		}

		byDijkstra, err := Dijkstra(list, 0)
		if err != nil {
			t.Fatal(err)
		}
		onMatrix, _ := Dijkstra(matrix, 0)
		if !slices.Equal(byDijkstra.Distance, onMatrix.Distance) ||
			!slices.Equal(byDijkstra.Distance, BellmanFord(list, 0).Distance) ||
			!slices.Equal(byDijkstra.Distance, BellmanFord(matrix, 0).Distance) {
			t.Fatalf("round %d: shortest paths disagree", round)
		}
		for v := range n {
			if distance := byDijkstra.Distance[v]; distance != Infinity && pathCost(list, PathTo(byDijkstra, v)) != distance {
				t.Fatalf("round %d: the path to %d does not cost the reported distance", round, v)
			}
		}
		dagPaths, err := DagShortestPaths(dagList, 0)
		dagDijkstra, _ := Dijkstra(dagMatrix, 0)
		if err != nil || !slices.Equal(dagPaths.Distance, dagDijkstra.Distance) {
			t.Fatalf("round %d: DAG shortest paths disagree with dijkstra", round)
		}

		total := Kruskal(treeList).Total
		if Prim(treeList, 0).Total != total || Prim(treeMatrix, 0).Total != total || Kruskal(treeMatrix).Total != total {
			t.Fatalf("round %d: prim and kruskal disagree", round)
		}

		sorted := TopologicalSort(dagList)
		if sorted.HasCycle || !slices.Equal(sorted.Order, TopologicalSort(dagMatrix).Order) {
			t.Fatalf("round %d: topological orders disagree", round)
		}
		position := make([]int, n)
		for i, v := range sorted.Order {
			position[v] = i
		}
		for _, arc := range Arcs(dagList) {
			if position[arc.From] >= position[arc.To] {
				t.Fatalf("round %d: arc %d -> %d goes backwards in the order", round, arc.From, arc.To)
			}
		}
	}
}

// EN: The ten reference cases. The adjacency list has to solve all of them. The matrix solves
// the ones whose graph fits its vertex limit and has to refuse the others, since a matrix for
// 100,000 vertices would need 10^10 cells.
// PT: Os dez casos de referência. A lista de adjacência precisa resolver todos. A matriz resolve
// os casos cujo grafo cabe no limite de vértices dela e precisa recusar os outros, pois uma
// matriz para 100.000 vértices pediria 10^10 células.
// ES: Los diez casos de referencia. La lista de adyacencia debe resolverlos todos. La matriz
// resuelve los casos cuyo grafo cabe en su límite de vértices y debe rechazar los otros, pues
// una matriz para 100,000 vértices pediría 10^10 celdas.
func TestReferenceCases(t *testing.T) {
	dir := os.Getenv("GRAPH_CASES_DIR")
	if dir == "" {
		dir = "/cases"
	}
	onMatrix := 0
	for number := 1; number <= 10; number++ {
		t.Run(fmt.Sprintf("case %d", number), func(t *testing.T) {
			expectedBytes, err := os.ReadFile(filepath.Join(dir, fmt.Sprintf("%d.out", number)))
			if err != nil {
				t.Fatal(err)
			}
			expected := strings.Join(strings.Fields(string(expectedBytes)), " ")
			for _, representation := range []Representation{List, Matrix} {
				input, err := os.Open(filepath.Join(dir, fmt.Sprintf("%d.in", number)))
				if err != nil {
					t.Fatal(err)
				}
				got, err := SolveCase(input, representation)
				if closeErr := input.Close(); closeErr != nil {
					t.Fatal(closeErr)
				}
				if representation == Matrix && errors.Is(err, ErrTooManyVertices) {
					t.Log("too large for the adjacency matrix, list only")
					continue
				}
				if err != nil {
					t.Fatal(err)
				}
				if got != expected {
					t.Errorf("representation %d: wrong answer", representation)
				}
				if representation == Matrix {
					onMatrix++
				}
			}
		})
	}
	if onMatrix != 6 {
		t.Errorf("the matrix solved %d cases, want the 6 that fit its vertex limit", onMatrix)
	}
}
