// Package graphs is the Go implementation of the graph-algorithms mini-project: one Graph
// interface, two representations and the classic algorithms written against the interface.
package graphs

import (
	"errors"
	"math"
)

// Weight is the cost of an arc.
type Weight = int64

// Infinity marks a vertex that cannot be reached, and an empty cell of the matrix.
const Infinity Weight = math.MaxInt64

// MatrixVertexLimit is the largest graph the adjacency matrix accepts.
const MatrixVertexLimit = 4096

// ErrTooManyVertices is returned when a matrix is asked for more vertices than its limit.
var ErrTooManyVertices = errors.New("adjacency matrix: too many vertices")

// Edge is how a vertex sees one of its neighbours.
type Edge struct {
	To     int
	Weight Weight
}

// Arc is a full directed edge, used when an algorithm needs a flat list of every edge.
type Arc struct {
	From   int
	To     int
	Weight Weight
}

// Graph is the abstract data type of the library.
//
// EN: Every algorithm talks only to this interface, so it runs unchanged on an adjacency list
// or on an adjacency matrix. What changes is the cost of each operation, not the answer.
// PT: Todo algoritmo conversa só com esta interface, então roda sem mudanças em lista de
// adjacência ou em matriz de adjacência. O que muda é o custo de cada operação, não a resposta.
type Graph interface {
	VertexCount() int
	AddArc(from, to int, weight Weight)
	HasArc(from, to int) bool
	Neighbors(from int) []Edge
}

// AddEdge adds an undirected edge.
//
// EN: An undirected edge is stored as two arcs, one in each direction, so that it can be
// followed from either end.
// PT: Uma aresta não dirigida é guardada como dois arcos, um em cada sentido, para poder ser
// seguida a partir de qualquer uma das pontas.
func AddEdge(graph Graph, a, b int, weight Weight) {
	graph.AddArc(a, b, weight)
	graph.AddArc(b, a, weight)
}

// Arcs lists every arc of the graph.
func Arcs(graph Graph) []Arc {
	var all []Arc
	for from := range graph.VertexCount() {
		for _, edge := range graph.Neighbors(from) {
			all = append(all, Arc{From: from, To: edge.To, Weight: edge.Weight})
		}
	}
	return all
}

// AdjacencyList keeps one list of neighbours per vertex.
//
// EN: Memory is O(V + E) and walking the neighbours of a vertex costs its degree, which is why
// it suits sparse graphs. Testing whether one specific arc exists means walking a list.
// PT: A memória é O(V + E) e percorrer os vizinhos de um vértice custa o grau dele, por isso
// ela serve bem a grafos esparsos. Testar se um arco específico existe exige percorrer uma lista.
type AdjacencyList struct {
	lists [][]Edge
}

// NewAdjacencyList creates a graph with the given number of vertices and no arcs.
func NewAdjacencyList(vertices int) *AdjacencyList {
	return &AdjacencyList{lists: make([][]Edge, vertices)}
}

// VertexCount returns the number of vertices.
func (g *AdjacencyList) VertexCount() int { return len(g.lists) }

// AddArc adds a directed arc.
func (g *AdjacencyList) AddArc(from, to int, weight Weight) {
	g.lists[from] = append(g.lists[from], Edge{To: to, Weight: weight})
}

// HasArc walks the list of from, so it costs the degree of that vertex.
func (g *AdjacencyList) HasArc(from, to int) bool {
	for _, edge := range g.lists[from] {
		if edge.To == to {
			return true
		}
	}
	return false
}

// Neighbors returns the arcs that leave from.
func (g *AdjacencyList) Neighbors(from int) []Edge { return g.lists[from] }

// AdjacencyMatrix is a V x V table of weights.
//
// EN: Cell (i, j) holds the weight of the arc i -> j, or Infinity for "no arc". Testing an arc
// is one read, O(1), but memory is O(V^2) even with few edges, and listing the neighbours of a
// vertex always scans a whole row. A cell holds one value, so of two parallel arcs only the
// lighter one is kept.
// PT: A célula (i, j) guarda o peso do arco i -> j, ou Infinity para "sem arco". Testar um arco
// é uma leitura, O(1), mas a memória é O(V^2) mesmo com poucas arestas, e listar os vizinhos de
// um vértice sempre percorre uma linha inteira. Uma célula guarda um valor, então de dois arcos
// paralelos só o mais leve fica.
type AdjacencyMatrix struct {
	vertices int
	cells    []Weight
}

// NewAdjacencyMatrix creates a graph with the given number of vertices and no arcs.
//
// EN: 100,000 vertices would need 10^10 cells. Refusing early is better than exhausting the
// memory of the machine.
// PT: 100.000 vértices pediriam 10^10 células. Recusar cedo é melhor do que esgotar a memória
// da máquina.
func NewAdjacencyMatrix(vertices int) (*AdjacencyMatrix, error) {
	if vertices > MatrixVertexLimit {
		return nil, ErrTooManyVertices
	}
	cells := make([]Weight, vertices*vertices)
	for i := range cells {
		cells[i] = Infinity
	}
	return &AdjacencyMatrix{vertices: vertices, cells: cells}, nil
}

// VertexCount returns the number of vertices.
func (g *AdjacencyMatrix) VertexCount() int { return g.vertices }

// AddArc writes the weight in the cell, keeping the lighter of two parallel arcs.
func (g *AdjacencyMatrix) AddArc(from, to int, weight Weight) {
	if cell := &g.cells[from*g.vertices+to]; weight < *cell {
		*cell = weight
	}
}

// HasArc reads one cell, in O(1).
func (g *AdjacencyMatrix) HasArc(from, to int) bool {
	return g.cells[from*g.vertices+to] != Infinity
}

// Neighbors scans the whole row of from, in O(V).
func (g *AdjacencyMatrix) Neighbors(from int) []Edge {
	var row []Edge
	for to := range g.vertices {
		if weight := g.cells[from*g.vertices+to]; weight != Infinity {
			row = append(row, Edge{To: to, Weight: weight})
		}
	}
	return row
}

// Representation chooses how a graph is stored.
type Representation int

// The two representations of the library.
const (
	List Representation = iota
	Matrix
)

// NewGraph creates an empty graph in the chosen representation.
func NewGraph(representation Representation, vertices int) (Graph, error) {
	if representation == Matrix {
		matrix, err := NewAdjacencyMatrix(vertices)
		if err != nil {
			return nil, err
		}
		return matrix, nil
	}
	return NewAdjacencyList(vertices), nil
}
