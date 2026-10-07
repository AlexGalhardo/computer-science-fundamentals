#pragma once

#include <algorithm>
#include <functional>
#include <numeric>
#include <optional>
#include <queue>
#include <stdexcept>
#include <tuple>
#include <utility>
#include <vector>

#include "graph.hpp"

namespace graphs {

// EN: Result of a single-source shortest path algorithm. `previous[v]` is the vertex that comes
//     right before v on the best path found, or -1. Following it backwards rebuilds the path.
// PT: Resultado de um algoritmo de caminho mínimo a partir de uma origem. `previous[v]` é o
//     vértice que vem logo antes de v no melhor caminho achado, ou -1. Segui-lo de trás para a
//     frente reconstrói o caminho.
struct PathResult {
	std::vector<Weight> distance;
	std::vector<int> previous;
	bool negative_cycle = false;
};

inline std::vector<int> path_to(const PathResult& result, int target) {
	std::vector<int> path;
	if (result.distance[static_cast<std::size_t>(target)] == kInfinity) {
		return path;
	}
	for (int v = target; v != -1; v = result.previous[static_cast<std::size_t>(v)]) {
		path.push_back(v);
	}
	std::reverse(path.begin(), path.end());
	return path;
}

// EN: Dijkstra. Greedy: always settle the unsettled vertex with the smallest known distance,
//     then relax its outgoing arcs. A min-heap delivers that vertex in O(log n). The greedy
//     choice is only safe when no weight is negative, because then a longer path can never
//     become cheaper later. With a negative arc the function refuses to run.
// PT: Dijkstra. Guloso: sempre finaliza o vértice não finalizado de menor distância conhecida e
//     relaxa os arcos que saem dele. Um heap de mínimo entrega esse vértice em O(log n). A
//     escolha gulosa só é segura quando nenhum peso é negativo, pois aí um caminho mais longo
//     nunca fica mais barato depois. Com um arco negativo a função se recusa a rodar.
inline PathResult dijkstra(const Graph& graph, int source) {
	const auto n = static_cast<std::size_t>(graph.vertex_count());
	PathResult result{std::vector<Weight>(n, kInfinity), std::vector<int>(n, -1)};
	using Item = std::pair<Weight, int>;
	std::priority_queue<Item, std::vector<Item>, std::greater<>> heap;
	result.distance[static_cast<std::size_t>(source)] = 0;
	heap.emplace(0, source);
	while (!heap.empty()) {
		const auto [distance, u] = heap.top();
		heap.pop();
		// EN: The heap may hold stale entries for a vertex whose distance improved later.
		//     They are skipped instead of being removed from the middle of the heap.
		// PT: O heap pode guardar entradas velhas de um vértice cuja distância melhorou depois.
		//     Elas são puladas em vez de serem removidas do meio do heap.
		if (distance > result.distance[static_cast<std::size_t>(u)]) {
			continue;
		}
		for (const Edge& edge : graph.neighbors(u)) {
			if (edge.weight < 0) {
				throw std::invalid_argument("dijkstra: negative weight");
			}
			const auto to = static_cast<std::size_t>(edge.to);
			if (distance + edge.weight < result.distance[to]) {
				result.distance[to] = distance + edge.weight;
				result.previous[to] = u;
				heap.emplace(result.distance[to], edge.to);
			}
		}
	}
	return result;
}

// EN: Bellman-Ford. A shortest path has at most V - 1 arcs, so relaxing every arc V - 1 times
//     is enough to settle all distances, even with negative weights. If one more round still
//     improves something, a cycle of negative total weight is reachable and "shortest" has no
//     meaning: going round the cycle again always costs less.
// PT: Bellman-Ford. Um caminho mínimo tem no máximo V - 1 arcos, então relaxar todos os arcos
//     V - 1 vezes basta para fechar todas as distâncias, mesmo com pesos negativos. Se mais uma
//     rodada ainda melhora algo, há um ciclo de peso total negativo alcançável e "mais curto"
//     perde o sentido: dar outra volta no ciclo sempre custa menos.
inline PathResult bellman_ford(const Graph& graph, int source) {
	const auto n = static_cast<std::size_t>(graph.vertex_count());
	PathResult result{std::vector<Weight>(n, kInfinity), std::vector<int>(n, -1)};
	const std::vector<Arc> arcs = graph.arcs();
	result.distance[static_cast<std::size_t>(source)] = 0;
	const auto relax_all = [&]() {
		bool changed = false;
		for (const Arc& arc : arcs) {
			const Weight from = result.distance[static_cast<std::size_t>(arc.from)];
			const auto to = static_cast<std::size_t>(arc.to);
			if (from != kInfinity && from + arc.weight < result.distance[to]) {
				result.distance[to] = from + arc.weight;
				result.previous[to] = arc.from;
				changed = true;
			}
		}
		return changed;
	};
	bool changed = true;
	for (std::size_t round = 1; round < n && changed; ++round) {
		changed = relax_all();
	}
	result.negative_cycle = changed && relax_all();
	return result;
}

// EN: Topological sort (Kahn). A vertex can be listed once all of its prerequisites were
//     listed, that is, when its count of incoming arcs drops to zero. The ready vertices wait
//     in a min-heap, so the smallest label always goes first and the order is the
//     lexicographically smallest one. A vertex that is on a cycle, or that depends on one, is
//     never ready. So when the order comes out shorter than V the graph has a cycle:
//     `has_cycle` reports it, and `order` holds only the vertices that could be ordered.
// PT: Ordenação topológica (Kahn). Um vértice pode ser listado quando todos os seus
//     pré-requisitos já foram, isto é, quando sua contagem de arcos de entrada chega a zero. Os
//     vértices prontos esperam em um heap de mínimo, então o menor rótulo sai sempre primeiro e
//     a ordem é a lexicograficamente menor. Um vértice que está em um ciclo, ou que depende de
//     um, nunca fica pronto. Então, quando a ordem sai menor que V, o grafo tem ciclo:
//     `has_cycle` avisa, e `order` guarda só os vértices que puderam ser ordenados.
struct TopologicalOrder {
	std::vector<int> order;
	bool has_cycle = false;
};

inline TopologicalOrder topological_sort(const Graph& graph) {
	const int n = graph.vertex_count();
	std::vector<int> incoming(static_cast<std::size_t>(n), 0);
	std::vector<std::vector<Edge>> neighbors(static_cast<std::size_t>(n));
	for (int v = 0; v < n; ++v) {
		neighbors[static_cast<std::size_t>(v)] = graph.neighbors(v);
		for (const Edge& edge : neighbors[static_cast<std::size_t>(v)]) {
			++incoming[static_cast<std::size_t>(edge.to)];
		}
	}
	std::priority_queue<int, std::vector<int>, std::greater<>> ready;
	for (int v = 0; v < n; ++v) {
		if (incoming[static_cast<std::size_t>(v)] == 0) {
			ready.push(v);
		}
	}
	std::vector<int> order;
	while (!ready.empty()) {
		const int v = ready.top();
		ready.pop();
		order.push_back(v);
		for (const Edge& edge : neighbors[static_cast<std::size_t>(v)]) {
			if (--incoming[static_cast<std::size_t>(edge.to)] == 0) {
				ready.push(edge.to);
			}
		}
	}
	const bool has_cycle = static_cast<int>(order.size()) != n;
	return TopologicalOrder{std::move(order), has_cycle};
}

// EN: Shortest paths in a directed acyclic graph. In topological order every arc points
//     forward, so when a vertex is reached its distance is already final and one pass over the
//     arcs is enough: O(V + E), negative weights allowed. Many dynamic programming problems
//     are this algorithm in disguise: states are vertices and choices are arcs.
// PT: Caminhos mínimos em um grafo dirigido acíclico. Na ordem topológica todo arco aponta para
//     a frente, então ao chegar em um vértice a distância dele já é final e uma passada pelos
//     arcos basta: O(V + E), com pesos negativos permitidos. Muitos problemas de programação
//     dinâmica são este algoritmo disfarçado: estados são vértices e escolhas são arcos.
inline PathResult dag_shortest_paths(const Graph& graph, int source) {
	const TopologicalOrder sorted = topological_sort(graph);
	if (sorted.has_cycle) {
		throw std::invalid_argument("dag_shortest_paths: the graph has a cycle");
	}
	const auto n = static_cast<std::size_t>(graph.vertex_count());
	PathResult result{std::vector<Weight>(n, kInfinity), std::vector<int>(n, -1)};
	result.distance[static_cast<std::size_t>(source)] = 0;
	for (const int u : sorted.order) {
		const Weight distance = result.distance[static_cast<std::size_t>(u)];
		if (distance == kInfinity) {
			continue;
		}
		for (const Edge& edge : graph.neighbors(u)) {
			const auto to = static_cast<std::size_t>(edge.to);
			if (distance + edge.weight < result.distance[to]) {
				result.distance[to] = distance + edge.weight;
				result.previous[to] = u;
			}
		}
	}
	return result;
}

// EN: A spanning tree connects every vertex with V - 1 edges and no cycle. The minimum one has
//     the smallest total weight. `connected` is false when the graph has more than one
//     component, in which case no spanning tree exists.
// PT: Uma árvore geradora liga todos os vértices com V - 1 arestas e nenhum ciclo. A mínima tem
//     o menor peso total. `connected` é false quando o grafo tem mais de um componente, caso em
//     que não existe árvore geradora.
struct SpanningTree {
	Weight total = 0;
	std::vector<Arc> edges;
	bool connected = false;
};

// EN: Prim grows one tree from a start vertex. At each step it adds the lightest edge that
//     leaves the tree, taken from a min-heap of candidate edges.
// PT: Prim faz uma única árvore crescer a partir de um vértice inicial. A cada passo ele
//     acrescenta a aresta mais leve que sai da árvore, tirada de um heap de mínimo de candidatas.
inline SpanningTree prim(const Graph& graph, int start = 0) {
	const auto n = static_cast<std::size_t>(graph.vertex_count());
	SpanningTree tree;
	std::vector<bool> in_tree(n, false);
	using Item = std::pair<Weight, std::pair<int, int>>;
	std::priority_queue<Item, std::vector<Item>, std::greater<>> heap;
	heap.push({0, {start, -1}});
	std::size_t reached = 0;
	while (!heap.empty()) {
		const auto [weight, ends] = heap.top();
		const auto [to, from] = ends;
		heap.pop();
		if (in_tree[static_cast<std::size_t>(to)]) {
			continue;
		}
		in_tree[static_cast<std::size_t>(to)] = true;
		++reached;
		if (from != -1) {
			tree.total += weight;
			tree.edges.push_back(Arc{from, to, weight});
		}
		for (const Edge& edge : graph.neighbors(to)) {
			if (!in_tree[static_cast<std::size_t>(edge.to)]) {
				heap.push({edge.weight, {edge.to, to}});
			}
		}
	}
	tree.connected = reached == n;
	return tree;
}

// EN: Union-find keeps a forest of sets. `find` returns the representative of a set and
//     flattens the path on the way (path compression). `unite` hangs the shallower tree under
//     the deeper one (union by rank). Together they make both operations almost O(1).
// PT: O union-find mantém uma floresta de conjuntos. `find` devolve o representante de um
//     conjunto e achata o caminho na passagem (compressão de caminho). `unite` pendura a árvore
//     mais rasa na mais funda (união por rank). Juntas, as duas técnicas deixam as operações
//     quase O(1).
class UnionFind {
public:
	explicit UnionFind(std::size_t size) : parent_(size), rank_(size, 0) {
		std::iota(parent_.begin(), parent_.end(), 0);
	}

	int find(int v) {
		while (parent_[static_cast<std::size_t>(v)] != v) {
			auto& parent = parent_[static_cast<std::size_t>(v)];
			parent = parent_[static_cast<std::size_t>(parent)];
			v = parent;
		}
		return v;
	}

	bool unite(int a, int b) {
		auto root_a = static_cast<std::size_t>(find(a));
		auto root_b = static_cast<std::size_t>(find(b));
		if (root_a == root_b) {
			return false;
		}
		if (rank_[root_a] < rank_[root_b]) {
			std::swap(root_a, root_b);
		}
		parent_[root_b] = static_cast<int>(root_a);
		if (rank_[root_a] == rank_[root_b]) {
			++rank_[root_a];
		}
		return true;
	}

private:
	std::vector<int> parent_;
	std::vector<int> rank_;
};

// EN: Kruskal looks at the edges from lightest to heaviest and keeps an edge whenever its two
//     ends are still in different components. Union-find answers that question, and an edge
//     whose ends are already connected would close a cycle, so it is skipped.
// PT: Kruskal olha as arestas da mais leve para a mais pesada e fica com uma aresta sempre que
//     as duas pontas ainda estão em componentes diferentes. O union-find responde essa pergunta,
//     e uma aresta cujas pontas já estão ligadas fecharia um ciclo, então é pulada.
inline SpanningTree kruskal(const Graph& graph) {
	const auto n = static_cast<std::size_t>(graph.vertex_count());
	std::vector<Arc> edges;
	for (const Arc& arc : graph.arcs()) {
		if (arc.from < arc.to) {
			edges.push_back(arc);
		}
	}
	std::sort(edges.begin(), edges.end(), [](const Arc& a, const Arc& b) {
		return std::tie(a.weight, a.from, a.to) < std::tie(b.weight, b.from, b.to);
	});
	SpanningTree tree;
	UnionFind sets(n);
	for (const Arc& edge : edges) {
		if (sets.unite(edge.from, edge.to)) {
			tree.total += edge.weight;
			tree.edges.push_back(edge);
		}
	}
	tree.connected = n == 0 || tree.edges.size() == n - 1;
	return tree;
}

}  // namespace graphs
