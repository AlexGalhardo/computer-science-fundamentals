#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#include "algorithms.hpp"
#include "cases.hpp"
#include "graph.hpp"

using namespace graphs;

namespace {

int checks = 0;
int failures = 0;

void check(bool condition, const std::string& what) {
	++checks;
	if (!condition) {
		++failures;
		std::cerr << "FAIL: " << what << '\n';
	}
}

struct Random {
	std::uint64_t state;
	int below(int limit) {
		state ^= state << 13;
		state ^= state >> 7;
		state ^= state << 17;
		return static_cast<int>(state % static_cast<std::uint64_t>(limit));
	}
};

Weight path_cost(const Graph& graph, const std::vector<int>& path) {
	Weight total = 0;
	for (std::size_t i = 1; i < path.size(); ++i) {
		Weight best = kInfinity;
		for (const Edge& edge : graph.neighbors(path[i - 1])) {
			if (edge.to == path[i] && edge.weight < best) {
				best = edge.weight;
			}
		}
		total += best;
	}
	return total;
}

// EN: The same suite runs once per representation. This is the point of programming against
//     the Graph interface: if the list and the matrix pass identical tests, an algorithm cannot
//     tell them apart.
// PT: A mesma suíte roda uma vez por representação. Esse é o sentido de programar contra a
//     interface Graph: se a lista e a matriz passam em testes idênticos, um algoritmo não
//     consegue diferenciá-las.
void suite(Representation representation, const std::string& name) {
	{
		const auto graph = make_graph(representation, 5);
		graph->add_arc(0, 1, 4);
		graph->add_arc(0, 2, 1);
		graph->add_arc(2, 1, 2);
		graph->add_arc(1, 3, 1);
		graph->add_arc(2, 3, 5);
		check(graph->has_arc(2, 1) && !graph->has_arc(1, 2), name + ": arcs are directed");
		const PathResult result = dijkstra(*graph, 0);
		check(result.distance == std::vector<Weight>({0, 3, 1, 4, kInfinity}),
		      name + ": dijkstra distances");
		check(path_to(result, 3) == std::vector<int>({0, 2, 1, 3}), name + ": dijkstra path");
		check(path_to(result, 4).empty(), name + ": unreachable vertex has no path");
	}
	{
		const auto graph = make_graph(representation, 4);
		graph->add_arc(0, 1, 4);
		graph->add_arc(0, 2, 5);
		graph->add_arc(2, 1, -3);
		graph->add_arc(1, 3, 2);
		bool refused = false;
		try {
			dijkstra(*graph, 0);
		} catch (const std::invalid_argument&) {
			refused = true;
		}
		check(refused, name + ": dijkstra refuses a negative weight");
		const PathResult result = bellman_ford(*graph, 0);
		check(result.distance == std::vector<Weight>({0, 2, 5, 4}),
		      name + ": bellman-ford with negative weights");
		check(!result.negative_cycle, name + ": no negative cycle reported");
		check(dag_shortest_paths(*graph, 0).distance == result.distance,
		      name + ": DAG shortest paths agree with bellman-ford");
	}
	{
		const auto graph = make_graph(representation, 3);
		graph->add_arc(0, 1, 1);
		graph->add_arc(1, 2, -1);
		graph->add_arc(2, 1, -1);
		check(bellman_ford(*graph, 0).negative_cycle, name + ": negative cycle reported");
		const TopologicalOrder sorted = topological_sort(*graph);
		check(sorted.has_cycle, name + ": topological sort reports a cycle");
		check(sorted.order == std::vector<int>({0}),
		      name + ": only the vertex outside the cycle is ordered");
	}
	{
		const auto graph = make_graph(representation, 5);
		graph->add_arc(0, 1, 1);
		graph->add_arc(0, 2, 1);
		graph->add_arc(4, 3, 1);
		const TopologicalOrder sorted = topological_sort(*graph);
		check(!sorted.has_cycle && sorted.order == std::vector<int>({0, 1, 2, 4, 3}),
		      name + ": smallest topological order");
	}
	{
		const auto graph = make_graph(representation, 5);
		graph->add_edge(0, 1, 1);
		graph->add_edge(1, 2, 2);
		graph->add_edge(0, 2, 3);
		graph->add_edge(2, 3, 4);
		check(!prim(*graph).connected && !kruskal(*graph).connected,
		      name + ": a disconnected graph has no spanning tree");
		graph->add_edge(3, 4, 7);
		graph->add_edge(0, 4, 9);
		const SpanningTree by_prim = prim(*graph);
		const SpanningTree by_kruskal = kruskal(*graph);
		check(by_prim.connected && by_prim.total == 14 && by_prim.edges.size() == 4,
		      name + ": prim finds the minimum spanning tree");
		check(by_kruskal.connected && by_kruskal.total == 14 && by_kruskal.edges.size() == 4,
		      name + ": kruskal finds the minimum spanning tree");
	}
}

// EN: Random graphs compare the algorithms with each other and the two representations with
//     each other. Dijkstra and Bellman-Ford are different ideas, so when they agree on hundreds
//     of random graphs a shared bug is unlikely. The same holds for Prim and Kruskal.
// PT: Grafos aleatórios comparam os algoritmos entre si e as duas representações entre si.
//     Dijkstra e Bellman-Ford são ideias diferentes, então, quando concordam em centenas de
//     grafos aleatórios, um erro em comum é improvável. O mesmo vale para Prim e Kruskal.
void random_tests() {
	bool paths_agree = true;
	bool path_costs = true;
	bool trees_agree = true;
	bool orders_agree = true;
	bool orders_valid = true;
	Random random{2024};
	for (int round = 0; round < 200; ++round) {
		const int n = 2 + random.below(30);
		const int m = random.below(4 * n);
		AdjacencyList list(n);
		AdjacencyMatrix matrix(n);
		AdjacencyList dag_list(n);
		AdjacencyMatrix dag_matrix(n);
		AdjacencyList tree_list(n);
		AdjacencyMatrix tree_matrix(n);
		for (int v = 1; v < n; ++v) {
			const int other = random.below(v);
			const Weight weight = 1 + random.below(50);
			tree_list.add_edge(v, other, weight);
			tree_matrix.add_edge(v, other, weight);
		}
		for (int i = 0; i < m; ++i) {
			const int a = random.below(n);
			const int b = random.below(n);
			const Weight weight = random.below(50);
			list.add_arc(a, b, weight);
			matrix.add_arc(a, b, weight);
			if (a != b) {
				tree_list.add_edge(a, b, weight);
				tree_matrix.add_edge(a, b, weight);
				// EN: Arcs that always go from the smaller to the larger label cannot form a
				//     cycle, which is an easy way of generating a random acyclic graph.
				// PT: Arcos que sempre vão do rótulo menor para o maior não formam ciclo, um
				//     jeito fácil de gerar um grafo acíclico aleatório.
				dag_list.add_arc(std::min(a, b), std::max(a, b), weight);
				dag_matrix.add_arc(std::min(a, b), std::max(a, b), weight);
			}
		}
		const PathResult by_dijkstra = dijkstra(list, 0);
		paths_agree = paths_agree && by_dijkstra.distance == bellman_ford(list, 0).distance &&
		              by_dijkstra.distance == dijkstra(matrix, 0).distance &&
		              by_dijkstra.distance == bellman_ford(matrix, 0).distance &&
		              dag_shortest_paths(dag_list, 0).distance == dijkstra(dag_matrix, 0).distance;
		for (int v = 0; v < n; ++v) {
			const Weight distance = by_dijkstra.distance[static_cast<std::size_t>(v)];
			if (distance != kInfinity) {
				path_costs = path_costs && path_cost(list, path_to(by_dijkstra, v)) == distance;
			}
		}
		const Weight total = kruskal(tree_list).total;
		trees_agree = trees_agree && prim(tree_list).total == total &&
		              prim(tree_matrix).total == total && kruskal(tree_matrix).total == total &&
		              prim(tree_list).connected && kruskal(tree_matrix).connected;
		const std::vector<int> order = topological_sort(dag_list).order;
		orders_agree = orders_agree && static_cast<int>(order.size()) == n &&
		               order == topological_sort(dag_matrix).order;
		if (static_cast<int>(order.size()) == n) {
			std::vector<int> position(static_cast<std::size_t>(n));
			for (int i = 0; i < n; ++i) {
				position[static_cast<std::size_t>(order[static_cast<std::size_t>(i)])] = i;
			}
			for (const Arc& arc : dag_list.arcs()) {
				orders_valid = orders_valid && position[static_cast<std::size_t>(arc.from)] <
				                                   position[static_cast<std::size_t>(arc.to)];
			}
		}
	}
	check(paths_agree, "random: dijkstra, bellman-ford and DAG paths agree on list and matrix");
	check(path_costs, "random: the rebuilt path costs exactly the reported distance");
	check(trees_agree, "random: prim and kruskal agree on list and matrix");
	check(orders_agree, "random: list and matrix give the same topological order");
	check(orders_valid, "random: every arc goes forward in the topological order");
}

std::string normalise(std::istream& in) {
	std::string text;
	std::string token;
	while (in >> token) {
		text += (text.empty() ? "" : " ") + token;
	}
	return text;
}

// EN: The ten reference cases. The adjacency list has to solve all of them. The matrix solves
//     the ones whose graph fits its vertex limit and has to refuse the others, since a matrix
//     for 100,000 vertices would need 10^10 cells.
// PT: Os dez casos de referência. A lista de adjacência precisa resolver todos. A matriz resolve
//     os casos cujo grafo cabe no limite de vértices dela e precisa recusar os outros, pois uma
//     matriz para 100.000 vértices pediria 10^10 células.
void reference_cases() {
	const char* configured = std::getenv("GRAPH_CASES_DIR");
	const std::string dir = configured != nullptr ? configured : "/cases";
	int on_matrix = 0;
	for (int number = 1; number <= 10; ++number) {
		const std::string base = dir + "/" + std::to_string(number);
		std::ifstream expected_file(base + ".out");
		std::ifstream input(base + ".in");
		if (!expected_file || !input) {
			check(false, "case " + std::to_string(number) + ": files not found in " + dir);
			continue;
		}
		const std::string expected = normalise(expected_file);
		check(solve_case(input, Representation::List) == expected,
		      "case " + std::to_string(number) + " on the adjacency list");
		std::ifstream again(base + ".in");
		try {
			const bool same = solve_case(again, Representation::Matrix) == expected;
			check(same, "case " + std::to_string(number) + " on the adjacency matrix");
			++on_matrix;
		} catch (const std::length_error&) {
			std::cout << "case " << number << ": too large for the adjacency matrix, list only\n";
		}
	}
	check(on_matrix == 6, "the matrix solves the 6 cases that fit its vertex limit");
}

}  // namespace

int main() {
	suite(Representation::List, "list");
	suite(Representation::Matrix, "matrix");
	random_tests();
	reference_cases();
	if (failures > 0) {
		std::cerr << failures << " of " << checks << " checks failed\n";
		return EXIT_FAILURE;
	}
	std::cout << checks << " checks passed\n";
	return EXIT_SUCCESS;
}
