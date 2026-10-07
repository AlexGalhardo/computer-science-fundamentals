// Command graphcli solves a reference case or prints the cheapest path of a graph file.
//
// EN:
//
//	graphcli case <file> [list|matrix]              solves a reference case
//	graphcli path <file> <from> <to> [list|matrix]  prints the cheapest path
//
// `path` uses Bellman-Ford, which accepts negative weights and reports a negative cycle.
//
// PT:
//
//	graphcli case <arquivo> [list|matrix]                    resolve um caso de referência
//	graphcli path <arquivo> <origem> <destino> [list|matrix] imprime o caminho mais barato
//
// `path` usa Bellman-Ford, que aceita pesos negativos e avisa quando há ciclo negativo.
package main

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	graphs "graph-algorithms"
)

var errUsage = errors.New("usage: graphcli case <file> [list|matrix]\n       graphcli path <file> <from> <to> [list|matrix]")

func representationOf(args []string, index int) graphs.Representation {
	if len(args) > index && args[index] == "matrix" {
		return graphs.Matrix
	}
	return graphs.List
}

func run(args []string) (string, error) {
	if len(args) < 2 {
		return "", errUsage
	}
	input, err := os.Open(args[1])
	if err != nil {
		return "", fmt.Errorf("opening the input: %w", err)
	}
	defer input.Close() //nolint:errcheck // read-only file, nothing to flush

	switch {
	case args[0] == "case":
		return graphs.SolveCase(input, representationOf(args, 2))
	case args[0] == "path" && len(args) >= 4:
		from, errFrom := strconv.Atoi(args[2])
		to, errTo := strconv.Atoi(args[3])
		if err := errors.Join(errFrom, errTo); err != nil {
			return "", fmt.Errorf("reading the vertices: %w", err)
		}
		graph, err := graphs.ReadWeightedGraph(input, representationOf(args, 4))
		if err != nil {
			return "", err
		}
		result := graphs.BellmanFord(graph, from)
		if result.NegativeCycle {
			return "negative cycle", nil
		}
		path := graphs.PathTo(result, to)
		if path == nil {
			return "unreachable", nil
		}
		labels := make([]string, len(path))
		for i, v := range path {
			labels[i] = strconv.Itoa(v)
		}
		return fmt.Sprintf("distance: %d\npath: %s", result.Distance[to], strings.Join(labels, " -> ")), nil
	default:
		return "", errUsage
	}
}

func main() {
	output, err := run(os.Args[1:])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println(output)
}
