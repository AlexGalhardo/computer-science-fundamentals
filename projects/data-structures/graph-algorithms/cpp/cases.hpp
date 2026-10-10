#pragma once

#include <istream>
#include <memory>
#include <optional>
#include <string>
#include <vector>

#include "algorithms.hpp"
#include "graph.hpp"

namespace graphs {

// EN: Problem 1 of the reference cases: print the lexicographically smallest topological order
//     of a directed graph. Vertices are numbered from 1 in the file and from 0 inside. Cases 4
//     and 5 are random graphs that do contain cycles, and their expected output lists only the
//     vertices that can be ordered, so the partial order is printed as it is.
// PT: Problema 1 dos casos de referência: imprimir a menor ordenação topológica, em ordem
//     lexicográfica, de um grafo dirigido. Os vértices são numerados a partir de 1 no arquivo e
//     a partir de 0 aqui dentro. Os casos 4 e 5 são grafos aleatórios que contêm ciclos, e a
//     saída esperada deles lista só os vértices que podem ser ordenados, então a ordem parcial
//     é impressa como está.
// ES: Problema 1 de los casos de referencia: imprimir el menor ordenamiento topológico, en orden
//     lexicográfico, de un grafo dirigido. Los vértices se numeran desde 1 en el archivo y
//     desde 0 aquí dentro. Los casos 4 y 5 son grafos aleatorios que contienen ciclos, y la
//     salida esperada de ellos lista solo los vértices que pueden ordenarse, así que el orden
//     parcial se imprime tal como está.
inline std::string solve_ordering(std::istream& in, Representation representation) {
	int vertices = 0;
	int arcs = 0;
	in >> vertices >> arcs;
	const std::unique_ptr<Graph> graph = make_graph(representation, vertices);
	for (int i = 0; i < arcs; ++i) {
		int from = 0;
		int to = 0;
		in >> from >> to;
		graph->add_arc(from - 1, to - 1, 1);
	}
	std::string text;
	for (const int v : topological_sort(*graph).order) {
		text += (text.empty() ? "" : " ") + std::to_string(v + 1);
	}
	return text;
}

// EN: Problem 2 of the reference cases: n objects, in the given order, go into exactly k boxes
//     of volume V. A box takes a consecutive run of objects (possibly none), and the cost is
//     the sum of the squares of the space left in each box. It is modelled as a shortest path:
//     the vertex (j, i) means "j boxes closed, i objects packed", and closing one more box that
//     takes the objects from i to i' is an arc to (j + 1, i') whose weight is the squared
//     leftover. Arcs only go from layer j to layer j + 1, so the graph is acyclic.
// PT: Problema 2 dos casos de referência: n objetos, na ordem dada, vão para exatamente k caixas
//     de volume V. Uma caixa recebe uma sequência consecutiva de objetos (talvez nenhum), e o
//     custo é a soma dos quadrados do espaço que sobra em cada caixa. O problema é modelado como
//     caminho mínimo: o vértice (j, i) significa "j caixas fechadas, i objetos guardados", e
//     fechar mais uma caixa com os objetos de i até i' é um arco para (j + 1, i') cujo peso é a
//     sobra ao quadrado. Os arcos só vão da camada j para a camada j + 1, então o grafo é acíclico.
// ES: Problema 2 de los casos de referencia: n objetos, en el orden dado, van a exactamente k
//     cajas de volumen V. Una caja recibe una secuencia consecutiva de objetos (quizá ninguno), y
//     el costo es la suma de los cuadrados del espacio que sobra en cada caja. El problema se
//     modela como camino mínimo: el vértice (j, i) significa "j cajas cerradas, i objetos
//     guardados", y cerrar una caja más con los objetos de i hasta i' es un arco hacia
//     (j + 1, i') cuyo peso es el sobrante al cuadrado. Los arcos solo van de la capa j a la capa
//     j + 1, así que el grafo es acíclico.
inline std::string solve_packing(std::istream& in, Representation representation) {
	int objects = 0;
	int boxes = 0;
	Weight volume = 0;
	in >> objects >> boxes >> volume;
	std::vector<Weight> sizes(static_cast<std::size_t>(objects));
	for (Weight& size : sizes) {
		in >> size;
	}
	const int width = objects + 1;
	const std::unique_ptr<Graph> graph = make_graph(representation, (boxes + 1) * width);
	for (int box = 0; box < boxes; ++box) {
		for (int first = 0; first <= objects; ++first) {
			Weight used = 0;
			for (int next = first; next <= objects; ++next) {
				const Weight left = volume - used;
				graph->add_arc(box * width + first, (box + 1) * width + next, left * left);
				if (next == objects) {
					break;
				}
				used += sizes[static_cast<std::size_t>(next)];
				if (used > volume) {
					break;
				}
			}
		}
	}
	const PathResult result = dag_shortest_paths(*graph, 0);
	const Weight best = result.distance[static_cast<std::size_t>(boxes * width + objects)];
	return best == kInfinity ? "-1" : std::to_string(best);
}

// EN: A case file starts with the number of the problem, then the data of that problem.
// PT: Um arquivo de caso começa com o número do problema, depois vêm os dados desse problema.
// ES: Un archivo de caso empieza con el número del problema, luego vienen los datos de ese
//     problema.
inline std::string solve_case(std::istream& in, Representation representation) {
	int problem = 0;
	in >> problem;
	if (problem == 1) {
		return solve_ordering(in, representation);
	}
	if (problem == 2) {
		return solve_packing(in, representation);
	}
	throw std::invalid_argument("unknown problem number in the case file");
}

// EN: A weighted directed graph in a text file: "V E" on the first line, then one "from to
//     weight" line per arc, vertices numbered from 0.
// PT: Um grafo dirigido com pesos em um arquivo texto: "V E" na primeira linha, depois uma
//     linha "origem destino peso" por arco, com vértices numerados a partir de 0.
// ES: Un grafo dirigido con pesos en un archivo de texto: "V E" en la primera línea, luego una
//     línea "origen destino peso" por arco, con vértices numerados desde 0.
inline std::unique_ptr<Graph> read_weighted_graph(std::istream& in, Representation representation) {
	int vertices = 0;
	int arcs = 0;
	in >> vertices >> arcs;
	std::unique_ptr<Graph> graph = make_graph(representation, vertices);
	for (int i = 0; i < arcs; ++i) {
		int from = 0;
		int to = 0;
		Weight weight = 0;
		in >> from >> to >> weight;
		graph->add_arc(from, to, weight);
	}
	return graph;
}

}  // namespace graphs
