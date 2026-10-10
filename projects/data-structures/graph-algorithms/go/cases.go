package graphs

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
)

// ErrUnknownProblem is returned when a case file starts with an unknown problem number.
var ErrUnknownProblem = errors.New("unknown problem number in the case file")

// SolveCase reads a reference case and returns the answer in the expected format.
//
// EN: A case file starts with the number of the problem, then the data of that problem.
// PT: Um arquivo de caso começa com o número do problema, depois vêm os dados desse problema.
// ES: Un archivo de caso empieza con el número del problema, luego vienen los datos de ese
// problema.
func SolveCase(input io.Reader, representation Representation) (string, error) {
	reader := bufio.NewReader(input)
	var problem int
	if _, err := fmt.Fscan(reader, &problem); err != nil {
		return "", fmt.Errorf("reading the problem number: %w", err)
	}
	switch problem {
	case 1:
		return solveOrdering(reader, representation)
	case 2:
		return solvePacking(reader, representation)
	default:
		return "", ErrUnknownProblem
	}
}

// EN: Problem 1 of the reference cases: print the lexicographically smallest topological order
// of a directed graph. Vertices are numbered from 1 in the file and from 0 inside. Cases 4 and
// 5 are random graphs that do contain cycles, and their expected output lists only the
// vertices that can be ordered, so the partial order is printed as it is.
// PT: Problema 1 dos casos de referência: imprimir a menor ordenação topológica, em ordem
// lexicográfica, de um grafo dirigido. Os vértices são numerados a partir de 1 no arquivo e a
// partir de 0 aqui dentro. Os casos 4 e 5 são grafos aleatórios que contêm ciclos, e a saída
// esperada deles lista só os vértices que podem ser ordenados, então a ordem parcial é
// impressa como está.
// ES: Problema 1 de los casos de referencia: imprimir el menor ordenamiento topológico, en orden
// lexicográfico, de un grafo dirigido. Los vértices se numeran desde 1 en el archivo y desde 0
// aquí dentro. Los casos 4 y 5 son grafos aleatorios que contienen ciclos, y la salida esperada
// de ellos lista solo los vértices que pueden ordenarse, así que el orden parcial se imprime
// tal como está.
func solveOrdering(reader io.Reader, representation Representation) (string, error) {
	var vertices, arcs int
	if _, err := fmt.Fscan(reader, &vertices, &arcs); err != nil {
		return "", fmt.Errorf("reading the graph size: %w", err)
	}
	graph, err := NewGraph(representation, vertices)
	if err != nil {
		return "", err
	}
	for range arcs {
		var from, to int
		if _, err := fmt.Fscan(reader, &from, &to); err != nil {
			return "", fmt.Errorf("reading an arc: %w", err)
		}
		graph.AddArc(from-1, to-1, 1)
	}
	order := TopologicalSort(graph).Order
	labels := make([]string, len(order))
	for i, v := range order {
		labels[i] = strconv.Itoa(v + 1)
	}
	return strings.Join(labels, " "), nil
}

// EN: Problem 2 of the reference cases: n objects, in the given order, go into exactly k boxes
// of volume V. A box takes a consecutive run of objects (possibly none), and the cost is the
// sum of the squares of the space left in each box. It is modelled as a shortest path: the
// vertex (j, i) means "j boxes closed, i objects packed", and closing one more box that takes
// the objects from i to i' is an arc to (j + 1, i') whose weight is the squared leftover. Arcs
// only go from layer j to layer j + 1, so the graph is acyclic.
// PT: Problema 2 dos casos de referência: n objetos, na ordem dada, vão para exatamente k caixas
// de volume V. Uma caixa recebe uma sequência consecutiva de objetos (talvez nenhum), e o custo
// é a soma dos quadrados do espaço que sobra em cada caixa. O problema é modelado como caminho
// mínimo: o vértice (j, i) significa "j caixas fechadas, i objetos guardados", e fechar mais
// uma caixa com os objetos de i até i' é um arco para (j + 1, i') cujo peso é a sobra ao
// quadrado. Os arcos só vão da camada j para a camada j + 1, então o grafo é acíclico.
// ES: Problema 2 de los casos de referencia: n objetos, en el orden dado, van a exactamente k
// cajas de volumen V. Una caja recibe una secuencia consecutiva de objetos (quizá ninguno), y el
// costo es la suma de los cuadrados del espacio que sobra en cada caja. El problema se modela
// como camino mínimo: el vértice (j, i) significa "j cajas cerradas, i objetos guardados", y
// cerrar una caja más con los objetos de i hasta i' es un arco hacia (j + 1, i') cuyo peso es el
// sobrante al cuadrado. Los arcos solo van de la capa j a la capa j + 1, así que el grafo es
// acíclico.
func solvePacking(reader io.Reader, representation Representation) (string, error) {
	var objects, boxes int
	var volume Weight
	if _, err := fmt.Fscan(reader, &objects, &boxes, &volume); err != nil {
		return "", fmt.Errorf("reading the packing sizes: %w", err)
	}
	sizes := make([]Weight, objects)
	for i := range sizes {
		if _, err := fmt.Fscan(reader, &sizes[i]); err != nil {
			return "", fmt.Errorf("reading an object: %w", err)
		}
	}
	width := objects + 1
	graph, err := NewGraph(representation, (boxes+1)*width)
	if err != nil {
		return "", err
	}
	for box := range boxes {
		for first := 0; first <= objects; first++ {
			used := Weight(0)
			for next := first; next <= objects; next++ {
				left := volume - used
				graph.AddArc(box*width+first, (box+1)*width+next, left*left)
				if next == objects {
					break
				}
				used += sizes[next]
				if used > volume {
					break
				}
			}
		}
	}
	result, err := DagShortestPaths(graph, 0)
	if err != nil {
		return "", err
	}
	best := result.Distance[boxes*width+objects]
	if best == Infinity {
		return "-1", nil
	}
	return strconv.FormatInt(best, 10), nil
}

// ReadWeightedGraph reads a weighted directed graph from text.
//
// EN: "V E" on the first line, then one "from to weight" line per arc, vertices numbered from 0.
// PT: "V E" na primeira linha, depois uma linha "origem destino peso" por arco, com vértices
// numerados a partir de 0.
// ES: "V E" en la primera línea, luego una línea "origen destino peso" por arco, con vértices
// numerados desde 0.
func ReadWeightedGraph(input io.Reader, representation Representation) (Graph, error) {
	reader := bufio.NewReader(input)
	var vertices, arcs int
	if _, err := fmt.Fscan(reader, &vertices, &arcs); err != nil {
		return nil, fmt.Errorf("reading the graph size: %w", err)
	}
	graph, err := NewGraph(representation, vertices)
	if err != nil {
		return nil, err
	}
	for range arcs {
		var from, to int
		var weight Weight
		if _, err := fmt.Fscan(reader, &from, &to, &weight); err != nil {
			return nil, fmt.Errorf("reading an arc: %w", err)
		}
		graph.AddArc(from, to, weight)
	}
	return graph, nil
}
