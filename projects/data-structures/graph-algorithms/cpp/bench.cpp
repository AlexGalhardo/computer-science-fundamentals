#include <sys/resource.h>

#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <string>

#include "algorithms.hpp"
#include "graph.hpp"

// EN: Benchmark. The name of the implementation is "<algorithm>-<representation>", for example
//     "dijkstra-matrix". The graph has n vertices and about 8n arcs, and is built before the
//     clock starts, so only the algorithm is timed. C++ and Go use the same generator and the
//     same seed, and the checksum proves that both computed the same answer.
// PT: Benchmark. O nome da implementação é "<algoritmo>-<representação>", por exemplo
//     "dijkstra-matrix". O grafo tem n vértices e cerca de 8n arcos, e é montado antes de o
//     relógio começar, então só o algoritmo é cronometrado. C++ e Go usam o mesmo gerador e a
//     mesma semente, e o checksum prova que os dois calcularam a mesma resposta.
namespace {

std::uint64_t state = 42;

int below(int limit) {
	state ^= state << 13;
	state ^= state >> 7;
	state ^= state << 17;
	return static_cast<int>(state % static_cast<std::uint64_t>(limit));
}

// EN: A chain 0 - 1 - ... - (n-1) guarantees that the graph is connected. The topological sort
//     needs an acyclic graph, so there every arc goes from the smaller label to the larger one.
// PT: Uma cadeia 0 - 1 - ... - (n-1) garante que o grafo é conexo. A ordenação topológica
//     precisa de um grafo acíclico, então nela todo arco vai do rótulo menor para o maior.
void fill(graphs::Graph& graph, int n, bool acyclic) {
	for (int v = 1; v < n; ++v) {
		const graphs::Weight weight = 1 + below(1000);
		if (acyclic) {
			graph.add_arc(v - 1, v, weight);
		} else {
			graph.add_edge(v - 1, v, weight);
		}
	}
	for (int i = 0; i < 3 * n; ++i) {
		const int a = below(n);
		const int b = below(n);
		const graphs::Weight weight = 1 + below(1000);
		if (a == b) {
			continue;
		}
		if (acyclic) {
			graph.add_arc(std::min(a, b), std::max(a, b), weight);
		} else {
			graph.add_edge(a, b, weight);
		}
	}
}

std::uint64_t sum_of(const graphs::PathResult& result) {
	std::uint64_t total = 0;
	for (const graphs::Weight distance : result.distance) {
		total += static_cast<std::uint64_t>(distance);
	}
	return total;
}

}  // namespace

int main(int argc, char** argv) {
	const std::string implementation = argc > 1 ? argv[1] : "dijkstra-list";
	const int n = argc > 2 ? std::atoi(argv[2]) : 1000;
	const std::string algorithm = implementation.substr(0, implementation.rfind('-'));
	const bool matrix = implementation.ends_with("-matrix");

	const std::unique_ptr<graphs::Graph> graph = graphs::make_graph(
	    matrix ? graphs::Representation::Matrix : graphs::Representation::List, n);
	fill(*graph, n, algorithm == "toposort");

	std::uint64_t checksum = 0;
	const auto start = std::chrono::steady_clock::now();
	if (algorithm == "dijkstra") {
		checksum = sum_of(graphs::dijkstra(*graph, 0));
	} else if (algorithm == "bellman-ford") {
		checksum = sum_of(graphs::bellman_ford(*graph, 0));
	} else if (algorithm == "prim") {
		checksum = static_cast<std::uint64_t>(graphs::prim(*graph).total);
	} else if (algorithm == "kruskal") {
		checksum = static_cast<std::uint64_t>(graphs::kruskal(*graph).total);
	} else if (algorithm == "toposort") {
		std::uint64_t position = 0;
		for (const int v : graphs::topological_sort(*graph).order) {
			checksum = (checksum + ++position * static_cast<std::uint64_t>(v)) % 1000000007ULL;
		}
	} else {
		std::cerr << "unknown implementation: " << implementation << '\n';
		return 2;
	}
	const auto end = std::chrono::steady_clock::now();

	struct rusage usage{};
	getrusage(RUSAGE_SELF, &usage);
	std::cout << "{\"n\":" << n
	          << ",\"elapsedMs\":" << std::chrono::duration<double, std::milli>(end - start).count()
	          << ",\"memoryKb\":" << usage.ru_maxrss
	          << ",\"language\":\"cpp\",\"implementation\":\"" << implementation
	          << "\",\"checksum\":\"" << checksum << "\"}\n";
	return 0;
}
