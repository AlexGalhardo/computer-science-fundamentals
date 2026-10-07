package graphs

import (
	"cmp"
	"errors"
	"slices"
)

// ErrNegativeWeight is returned by Dijkstra when the graph has an arc of negative weight.
var ErrNegativeWeight = errors.New("dijkstra: negative weight")

// ErrCycle is returned by DagShortestPaths when the graph is not acyclic.
var ErrCycle = errors.New("the graph has a cycle")

// PathResult is the answer of a single-source shortest path algorithm.
//
// EN: Previous[v] is the vertex that comes right before v on the best path found, or -1.
// Following it backwards rebuilds the path.
// PT: Previous[v] é o vértice que vem logo antes de v no melhor caminho achado, ou -1. Segui-lo
// de trás para a frente reconstrói o caminho.
type PathResult struct {
	Distance      []Weight
	Previous      []int
	NegativeCycle bool
}

func newPathResult(vertices, source int) PathResult {
	result := PathResult{Distance: make([]Weight, vertices), Previous: make([]int, vertices)}
	for v := range vertices {
		result.Distance[v] = Infinity
		result.Previous[v] = -1
	}
	result.Distance[source] = 0
	return result
}

// PathTo rebuilds the path from the source to target, or returns nil when it is unreachable.
func PathTo(result PathResult, target int) []int {
	if result.Distance[target] == Infinity {
		return nil
	}
	var path []int
	for v := target; v != -1; v = result.Previous[v] {
		path = append(path, v)
	}
	slices.Reverse(path)
	return path
}

type distanceItem struct {
	distance Weight
	vertex   int
}

// Dijkstra returns the shortest distances from source in a graph with no negative weight.
//
// EN: Greedy: always settle the unsettled vertex with the smallest known distance, then relax
// its outgoing arcs. A min-heap delivers that vertex in O(log n). The greedy choice is only
// safe when no weight is negative, because then a longer path can never become cheaper later.
// With a negative arc the function refuses to run.
// PT: Guloso: sempre finaliza o vértice não finalizado de menor distância conhecida e relaxa os
// arcos que saem dele. Um heap de mínimo entrega esse vértice em O(log n). A escolha gulosa só
// é segura quando nenhum peso é negativo, pois aí um caminho mais longo nunca fica mais barato
// depois. Com um arco negativo a função se recusa a rodar.
func Dijkstra(graph Graph, source int) (PathResult, error) {
	result := newPathResult(graph.VertexCount(), source)
	heap := newMinHeap(func(a, b distanceItem) bool { return a.distance < b.distance })
	heap.push(distanceItem{distance: 0, vertex: source})
	for !heap.empty() {
		item := heap.pop()
		// EN: The heap may hold stale entries for a vertex whose distance improved later.
		// They are skipped instead of being removed from the middle of the heap.
		// PT: O heap pode guardar entradas velhas de um vértice cuja distância melhorou depois.
		// Elas são puladas em vez de serem removidas do meio do heap.
		if item.distance > result.Distance[item.vertex] {
			continue
		}
		for _, edge := range graph.Neighbors(item.vertex) {
			if edge.Weight < 0 {
				return PathResult{}, ErrNegativeWeight
			}
			if candidate := item.distance + edge.Weight; candidate < result.Distance[edge.To] {
				result.Distance[edge.To] = candidate
				result.Previous[edge.To] = item.vertex
				heap.push(distanceItem{distance: candidate, vertex: edge.To})
			}
		}
	}
	return result, nil
}

// BellmanFord returns the shortest distances from source and reports negative cycles.
//
// EN: A shortest path has at most V - 1 arcs, so relaxing every arc V - 1 times is enough to
// settle all distances, even with negative weights. If one more round still improves
// something, a cycle of negative total weight is reachable and "shortest" has no meaning:
// going round the cycle again always costs less.
// PT: Um caminho mínimo tem no máximo V - 1 arcos, então relaxar todos os arcos V - 1 vezes
// basta para fechar todas as distâncias, mesmo com pesos negativos. Se mais uma rodada ainda
// melhora algo, há um ciclo de peso total negativo alcançável e "mais curto" perde o sentido:
// dar outra volta no ciclo sempre custa menos.
func BellmanFord(graph Graph, source int) PathResult {
	vertices := graph.VertexCount()
	result := newPathResult(vertices, source)
	arcs := Arcs(graph)
	relaxAll := func() bool {
		changed := false
		for _, arc := range arcs {
			from := result.Distance[arc.From]
			if from != Infinity && from+arc.Weight < result.Distance[arc.To] {
				result.Distance[arc.To] = from + arc.Weight
				result.Previous[arc.To] = arc.From
				changed = true
			}
		}
		return changed
	}
	changed := true
	for round := 1; round < vertices && changed; round++ {
		changed = relaxAll()
	}
	result.NegativeCycle = changed && relaxAll()
	return result
}

// TopologicalOrder is the answer of TopologicalSort.
type TopologicalOrder struct {
	Order    []int
	HasCycle bool
}

// TopologicalSort returns the lexicographically smallest topological order (Kahn).
//
// EN: A vertex can be listed once all of its prerequisites were listed, that is, when its
// count of incoming arcs drops to zero. The ready vertices wait in a min-heap, so the smallest
// label always goes first. A vertex that is on a cycle, or that depends on one, is never
// ready. So when the order comes out shorter than V the graph has a cycle: HasCycle reports
// it, and Order holds only the vertices that could be ordered.
// PT: Um vértice pode ser listado quando todos os seus pré-requisitos já foram, isto é, quando
// sua contagem de arcos de entrada chega a zero. Os vértices prontos esperam em um heap de
// mínimo, então o menor rótulo sai sempre primeiro. Um vértice que está em um ciclo, ou que
// depende de um, nunca fica pronto. Então, quando a ordem sai menor que V, o grafo tem ciclo:
// HasCycle avisa, e Order guarda só os vértices que puderam ser ordenados.
func TopologicalSort(graph Graph) TopologicalOrder {
	vertices := graph.VertexCount()
	incoming := make([]int, vertices)
	neighbors := make([][]Edge, vertices)
	for v := range vertices {
		neighbors[v] = graph.Neighbors(v)
		for _, edge := range neighbors[v] {
			incoming[edge.To]++
		}
	}
	ready := newMinHeap(func(a, b int) bool { return a < b })
	for v := range vertices {
		if incoming[v] == 0 {
			ready.push(v)
		}
	}
	order := make([]int, 0, vertices)
	for !ready.empty() {
		v := ready.pop()
		order = append(order, v)
		for _, edge := range neighbors[v] {
			incoming[edge.To]--
			if incoming[edge.To] == 0 {
				ready.push(edge.To)
			}
		}
	}
	return TopologicalOrder{Order: order, HasCycle: len(order) != vertices}
}

// DagShortestPaths returns the shortest distances from source in a directed acyclic graph.
//
// EN: In topological order every arc points forward, so when a vertex is reached its distance
// is already final and one pass over the arcs is enough: O(V + E), negative weights allowed.
// Many dynamic programming problems are this algorithm in disguise: states are vertices and
// choices are arcs.
// PT: Na ordem topológica todo arco aponta para a frente, então ao chegar em um vértice a
// distância dele já é final e uma passada pelos arcos basta: O(V + E), com pesos negativos
// permitidos. Muitos problemas de programação dinâmica são este algoritmo disfarçado: estados
// são vértices e escolhas são arcos.
func DagShortestPaths(graph Graph, source int) (PathResult, error) {
	sorted := TopologicalSort(graph)
	if sorted.HasCycle {
		return PathResult{}, ErrCycle
	}
	result := newPathResult(graph.VertexCount(), source)
	for _, u := range sorted.Order {
		distance := result.Distance[u]
		if distance == Infinity {
			continue
		}
		for _, edge := range graph.Neighbors(u) {
			if distance+edge.Weight < result.Distance[edge.To] {
				result.Distance[edge.To] = distance + edge.Weight
				result.Previous[edge.To] = u
			}
		}
	}
	return result, nil
}

// SpanningTree is a minimum spanning tree, or what could be built of it.
//
// EN: A spanning tree connects every vertex with V - 1 edges and no cycle. The minimum one has
// the smallest total weight. Connected is false when the graph has more than one component,
// in which case no spanning tree exists.
// PT: Uma árvore geradora liga todos os vértices com V - 1 arestas e nenhum ciclo. A mínima tem
// o menor peso total. Connected é false quando o grafo tem mais de um componente, caso em que
// não existe árvore geradora.
type SpanningTree struct {
	Total     Weight
	Edges     []Arc
	Connected bool
}

// Prim builds a minimum spanning tree growing from the start vertex.
//
// EN: At each step it adds the lightest edge that leaves the tree, taken from a min-heap of
// candidate edges.
// PT: A cada passo ele acrescenta a aresta mais leve que sai da árvore, tirada de um heap de
// mínimo de arestas candidatas.
func Prim(graph Graph, start int) SpanningTree {
	vertices := graph.VertexCount()
	var tree SpanningTree
	inTree := make([]bool, vertices)
	heap := newMinHeap(func(a, b Arc) bool { return a.Weight < b.Weight })
	heap.push(Arc{From: -1, To: start})
	reached := 0
	for !heap.empty() {
		candidate := heap.pop()
		if inTree[candidate.To] {
			continue
		}
		inTree[candidate.To] = true
		reached++
		if candidate.From != -1 {
			tree.Total += candidate.Weight
			tree.Edges = append(tree.Edges, candidate)
		}
		for _, edge := range graph.Neighbors(candidate.To) {
			if !inTree[edge.To] {
				heap.push(Arc{From: candidate.To, To: edge.To, Weight: edge.Weight})
			}
		}
	}
	tree.Connected = reached == vertices
	return tree
}

// UnionFind keeps a forest of disjoint sets.
//
// EN: Find returns the representative of a set and flattens the path on the way (path
// compression). Unite hangs the shallower tree under the deeper one (union by rank). Together
// they make both operations almost O(1).
// PT: Find devolve o representante de um conjunto e achata o caminho na passagem (compressão de
// caminho). Unite pendura a árvore mais rasa na mais funda (união por rank). Juntas, as duas
// técnicas deixam as operações quase O(1).
type UnionFind struct {
	parent []int
	rank   []int
}

// NewUnionFind creates size sets with one element each.
func NewUnionFind(size int) *UnionFind {
	sets := &UnionFind{parent: make([]int, size), rank: make([]int, size)}
	for v := range size {
		sets.parent[v] = v
	}
	return sets
}

// Find returns the representative of the set that holds v.
func (u *UnionFind) Find(v int) int {
	for u.parent[v] != v {
		u.parent[v] = u.parent[u.parent[v]]
		v = u.parent[v]
	}
	return v
}

// Unite merges the sets of a and b and reports whether they were different.
func (u *UnionFind) Unite(a, b int) bool {
	rootA, rootB := u.Find(a), u.Find(b)
	if rootA == rootB {
		return false
	}
	if u.rank[rootA] < u.rank[rootB] {
		rootA, rootB = rootB, rootA
	}
	u.parent[rootB] = rootA
	if u.rank[rootA] == u.rank[rootB] {
		u.rank[rootA]++
	}
	return true
}

// Kruskal builds a minimum spanning tree from the sorted list of edges.
//
// EN: It looks at the edges from lightest to heaviest and keeps an edge whenever its two ends
// are still in different components. Union-find answers that question, and an edge whose ends
// are already connected would close a cycle, so it is skipped.
// PT: Ele olha as arestas da mais leve para a mais pesada e fica com uma aresta sempre que as
// duas pontas ainda estão em componentes diferentes. O union-find responde essa pergunta, e uma
// aresta cujas pontas já estão ligadas fecharia um ciclo, então é pulada.
func Kruskal(graph Graph) SpanningTree {
	vertices := graph.VertexCount()
	var edges []Arc
	for _, arc := range Arcs(graph) {
		if arc.From < arc.To {
			edges = append(edges, arc)
		}
	}
	slices.SortFunc(edges, func(a, b Arc) int {
		return cmp.Or(cmp.Compare(a.Weight, b.Weight), cmp.Compare(a.From, b.From), cmp.Compare(a.To, b.To))
	})
	var tree SpanningTree
	sets := NewUnionFind(vertices)
	for _, edge := range edges {
		if sets.Unite(edge.From, edge.To) {
			tree.Total += edge.Weight
			tree.Edges = append(tree.Edges, edge)
		}
	}
	tree.Connected = vertices == 0 || len(tree.Edges) == vertices-1
	return tree
}
