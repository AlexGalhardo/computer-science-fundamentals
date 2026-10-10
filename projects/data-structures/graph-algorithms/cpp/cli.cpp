#include <cstdlib>
#include <exception>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

#include "algorithms.hpp"
#include "cases.hpp"
#include "graph.hpp"

// EN: Command line of the library.
//       graph_cli case <file> [list|matrix]              solves a reference case
//       graph_cli path <file> <from> <to> [list|matrix]  prints the cheapest path
//     `path` uses Bellman-Ford, which accepts negative weights and reports a negative cycle.
// PT: Linha de comando da biblioteca.
//       graph_cli case <arquivo> [list|matrix]                   resolve um caso de referência
//       graph_cli path <arquivo> <origem> <destino> [list|matrix] imprime o caminho mais barato
//     `path` usa Bellman-Ford, que aceita pesos negativos e avisa quando há ciclo negativo.
// ES: Línea de comandos de la biblioteca.
//       graph_cli case <archivo> [list|matrix]                   resuelve un caso de referencia
//       graph_cli path <archivo> <origen> <destino> [list|matrix] imprime el camino más barato
//     `path` usa Bellman-Ford, que acepta pesos negativos y avisa cuando hay ciclo negativo.
namespace {

int usage() {
	std::cerr << "usage: graph_cli case <file> [list|matrix]\n"
	             "       graph_cli path <file> <from> <to> [list|matrix]\n";
	return 2;
}

graphs::Representation representation_of(const std::string& name) {
	return name == "matrix" ? graphs::Representation::Matrix : graphs::Representation::List;
}

}  // namespace

int main(int argc, char** argv) {
	const std::vector<std::string> args(argv + 1, argv + argc);
	if (args.size() < 2) {
		return usage();
	}
	std::ifstream input(args[1]);
	if (!input) {
		std::cerr << "cannot open " << args[1] << '\n';
		return 1;
	}
	try {
		if (args[0] == "case") {
			const auto representation = representation_of(args.size() > 2 ? args[2] : "list");
			std::cout << graphs::solve_case(input, representation) << '\n';
			return 0;
		}
		if (args[0] == "path" && args.size() >= 4) {
			const auto representation = representation_of(args.size() > 4 ? args[4] : "list");
			const std::unique_ptr<graphs::Graph> graph =
			    graphs::read_weighted_graph(input, representation);
			const int from = std::stoi(args[2]);
			const int to = std::stoi(args[3]);
			const graphs::PathResult result = graphs::bellman_ford(*graph, from);
			if (result.negative_cycle) {
				std::cout << "negative cycle\n";
				return 0;
			}
			const std::vector<int> path = graphs::path_to(result, to);
			if (path.empty()) {
				std::cout << "unreachable\n";
				return 0;
			}
			std::cout << "distance: " << result.distance[static_cast<std::size_t>(to)] << "\npath:";
			for (std::size_t i = 0; i < path.size(); ++i) {
				std::cout << (i == 0 ? " " : " -> ") << path[i];
			}
			std::cout << '\n';
			return 0;
		}
	} catch (const std::exception& error) {
		std::cerr << "error: " << error.what() << '\n';
		return 1;
	}
	return usage();
}
