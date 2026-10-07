#pragma once

#include <cstdint>
#include <limits>
#include <memory>
#include <stdexcept>
#include <vector>

namespace graphs {

using Weight = std::int64_t;
constexpr Weight kInfinity = std::numeric_limits<Weight>::max();

// EN: `Edge` is how a vertex sees one of its neighbours. `Arc` is a full directed edge, used
//     when an algorithm needs a flat list of every edge of the graph.
// PT: `Edge` é como um vértice enxerga um de seus vizinhos. `Arc` é uma aresta dirigida
//     completa, usada quando um algoritmo precisa de uma lista plana com todas as arestas.
struct Edge {
	int to;
	Weight weight;
};

struct Arc {
	int from;
	int to;
	Weight weight;
};

// EN: The abstract data type. Every algorithm of this library talks only to this interface,
//     so it runs unchanged on an adjacency list or on an adjacency matrix. What changes is the
//     cost of each operation, not the answer.
// PT: O tipo abstrato de dados. Todo algoritmo desta biblioteca conversa só com esta interface,
//     então roda sem mudanças em lista de adjacência ou em matriz de adjacência. O que muda é o
//     custo de cada operação, não a resposta.
class Graph {
public:
	virtual ~Graph() = default;
	virtual int vertex_count() const = 0;
	virtual void add_arc(int from, int to, Weight weight) = 0;
	virtual bool has_arc(int from, int to) const = 0;
	virtual std::vector<Edge> neighbors(int from) const = 0;

	// EN: An undirected edge is stored as two arcs, one in each direction, so that it can be
	//     followed from either end.
	// PT: Uma aresta não dirigida é guardada como dois arcos, um em cada sentido, para poder
	//     ser seguida a partir de qualquer uma das pontas.
	void add_edge(int a, int b, Weight weight) {
		add_arc(a, b, weight);
		add_arc(b, a, weight);
	}

	std::vector<Arc> arcs() const {
		std::vector<Arc> all;
		for (int from = 0; from < vertex_count(); ++from) {
			for (const Edge& edge : neighbors(from)) {
				all.push_back(Arc{from, edge.to, edge.weight});
			}
		}
		return all;
	}
};

// EN: Adjacency list: one list of neighbours per vertex. Memory is O(V + E) and walking the
//     neighbours of a vertex costs its degree, which is why it suits sparse graphs. Testing
//     whether one specific arc exists means walking a list.
// PT: Lista de adjacência: uma lista de vizinhos por vértice. A memória é O(V + E) e percorrer
//     os vizinhos de um vértice custa o grau dele, por isso ela serve bem a grafos esparsos.
//     Testar se um arco específico existe exige percorrer uma lista.
class AdjacencyList final : public Graph {
public:
	explicit AdjacencyList(int vertices) : lists_(static_cast<std::size_t>(vertices)) {}

	int vertex_count() const override { return static_cast<int>(lists_.size()); }

	void add_arc(int from, int to, Weight weight) override {
		lists_[static_cast<std::size_t>(from)].push_back(Edge{to, weight});
	}

	bool has_arc(int from, int to) const override {
		for (const Edge& edge : lists_[static_cast<std::size_t>(from)]) {
			if (edge.to == to) {
				return true;
			}
		}
		return false;
	}

	std::vector<Edge> neighbors(int from) const override {
		return lists_[static_cast<std::size_t>(from)];
	}

private:
	std::vector<std::vector<Edge>> lists_;
};

// EN: Adjacency matrix: a V x V table where cell (i, j) holds the weight of the arc i -> j, or
//     a marker for "no arc". Testing an arc is one read, O(1), but memory is O(V^2) even with
//     few edges, and listing the neighbours of a vertex always scans a whole row. A cell holds
//     one value, so of two parallel arcs only the lighter one is kept.
// PT: Matriz de adjacência: uma tabela V x V em que a célula (i, j) guarda o peso do arco
//     i -> j, ou uma marca de "sem arco". Testar um arco é uma leitura, O(1), mas a memória é
//     O(V^2) mesmo com poucas arestas, e listar os vizinhos de um vértice sempre percorre uma
//     linha inteira. Uma célula guarda um valor, então de dois arcos paralelos só o mais leve fica.
class AdjacencyMatrix final : public Graph {
public:
	static constexpr int kVertexLimit = 4096;

	explicit AdjacencyMatrix(int vertices) : vertices_(vertices) {
		// EN: 100,000 vertices would need 10^10 cells. Refusing early is better than
		//     exhausting the memory of the machine.
		// PT: 100.000 vértices pediriam 10^10 células. Recusar cedo é melhor do que esgotar a
		//     memória da máquina.
		if (vertices > kVertexLimit) {
			throw std::length_error("adjacency matrix: too many vertices");
		}
		cells_.assign(static_cast<std::size_t>(vertices) * static_cast<std::size_t>(vertices),
		              kInfinity);
	}

	int vertex_count() const override { return vertices_; }

	void add_arc(int from, int to, Weight weight) override {
		Weight& cell = cells_[index(from, to)];
		if (weight < cell) {
			cell = weight;
		}
	}

	bool has_arc(int from, int to) const override { return cells_[index(from, to)] != kInfinity; }

	std::vector<Edge> neighbors(int from) const override {
		std::vector<Edge> row;
		for (int to = 0; to < vertices_; ++to) {
			const Weight weight = cells_[index(from, to)];
			if (weight != kInfinity) {
				row.push_back(Edge{to, weight});
			}
		}
		return row;
	}

private:
	std::size_t index(int from, int to) const {
		return static_cast<std::size_t>(from) * static_cast<std::size_t>(vertices_) +
		       static_cast<std::size_t>(to);
	}

	int vertices_;
	std::vector<Weight> cells_;
};

enum class Representation { List, Matrix };

inline std::unique_ptr<Graph> make_graph(Representation representation, int vertices) {
	if (representation == Representation::Matrix) {
		return std::make_unique<AdjacencyMatrix>(vertices);
	}
	return std::make_unique<AdjacencyList>(vertices);
}

}  // namespace graphs
