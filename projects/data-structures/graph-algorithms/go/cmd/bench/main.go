// Command bench runs one algorithm on a generated graph and prints the benchmark contract line.
//
// EN: The name of the implementation is "<algorithm>-<representation>", for example
// "dijkstra-matrix". The graph has n vertices and about 8n arcs, and is built before the clock
// starts, so only the algorithm is timed. C++ and Go use the same generator and the same seed,
// and the checksum proves that both computed the same answer.
// PT: O nome da implementação é "<algoritmo>-<representação>", por exemplo "dijkstra-matrix". O
// grafo tem n vértices e cerca de 8n arcos, e é montado antes de o relógio começar, então só o
// algoritmo é cronometrado. C++ e Go usam o mesmo gerador e a mesma semente, e o checksum prova
// que os dois calcularam a mesma resposta.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	graphs "graph-algorithms"
)

var state uint64 = 42

func below(limit int) int {
	state ^= state << 13
	state ^= state >> 7
	state ^= state << 17
	return int(state % uint64(limit))
}

// EN: A chain 0 - 1 - ... - (n-1) guarantees that the graph is connected. The topological sort
// needs an acyclic graph, so there every arc goes from the smaller label to the larger one.
// PT: Uma cadeia 0 - 1 - ... - (n-1) garante que o grafo é conexo. A ordenação topológica
// precisa de um grafo acíclico, então nela todo arco vai do rótulo menor para o maior.
func fill(graph graphs.Graph, n int, acyclic bool) {
	add := func(a, b int, weight graphs.Weight) {
		if acyclic {
			graph.AddArc(min(a, b), max(a, b), weight)
		} else {
			graphs.AddEdge(graph, a, b, weight)
		}
	}
	for v := 1; v < n; v++ {
		add(v-1, v, graphs.Weight(1+below(1000)))
	}
	for range 3 * n {
		a := below(n)
		b := below(n)
		weight := graphs.Weight(1 + below(1000))
		if a != b {
			add(a, b, weight)
		}
	}
}

func sumOf(result graphs.PathResult) uint64 {
	total := uint64(0)
	for _, distance := range result.Distance {
		total += uint64(distance)
	}
	return total
}

// EN: Linux keeps the peak resident memory of a process in /proc/self/status (VmHWM, in kB).
// PT: O Linux guarda o pico de memória residente de um processo em /proc/self/status (VmHWM, em kB).
func peakMemoryKb() int {
	file, err := os.Open("/proc/self/status")
	if err != nil {
		return 0
	}
	defer file.Close() //nolint:errcheck // read-only file, nothing to flush
	for scanner := bufio.NewScanner(file); scanner.Scan(); {
		if fields := strings.Fields(scanner.Text()); len(fields) >= 2 && fields[0] == "VmHWM:" {
			value, _ := strconv.Atoi(fields[1])
			return value
		}
	}
	return 0
}

func run(implementation string, n int) (uint64, float64, error) {
	cut := strings.LastIndex(implementation, "-")
	if cut < 0 {
		return 0, 0, fmt.Errorf("unknown implementation: %s", implementation)
	}
	algorithm := implementation[:cut]
	representation := graphs.List
	if implementation[cut+1:] == "matrix" {
		representation = graphs.Matrix
	}
	graph, err := graphs.NewGraph(representation, n)
	if err != nil {
		return 0, 0, err
	}
	fill(graph, n, algorithm == "toposort")

	checksum := uint64(0)
	start := time.Now()
	switch algorithm {
	case "dijkstra":
		result, err := graphs.Dijkstra(graph, 0)
		if err != nil {
			return 0, 0, err
		}
		checksum = sumOf(result)
	case "bellman-ford":
		checksum = sumOf(graphs.BellmanFord(graph, 0))
	case "prim":
		checksum = uint64(graphs.Prim(graph, 0).Total)
	case "kruskal":
		checksum = uint64(graphs.Kruskal(graph).Total)
	case "toposort":
		for i, v := range graphs.TopologicalSort(graph).Order {
			checksum = (checksum + uint64(i+1)*uint64(v)) % 1000000007
		}
	default:
		return 0, 0, fmt.Errorf("unknown implementation: %s", implementation)
	}
	return checksum, float64(time.Since(start).Nanoseconds()) / 1e6, nil
}

func main() {
	implementation, n := "dijkstra-list", 1000
	if len(os.Args) > 1 {
		implementation = os.Args[1]
	}
	if len(os.Args) > 2 {
		n, _ = strconv.Atoi(os.Args[2])
	}
	checksum, elapsedMs, err := run(implementation, n)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	line, _ := json.Marshal(map[string]any{
		"n":              n,
		"elapsedMs":      elapsedMs,
		"memoryKb":       peakMemoryKb(),
		"language":       "go",
		"implementation": implementation,
		"checksum":       strconv.FormatUint(checksum, 10),
	})
	fmt.Println(string(line))
}
