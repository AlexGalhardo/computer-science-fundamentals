// EN: Memory workload in Go: `binary-trees` (allocate and discard many small nodes) and `idle`
// (start and exit). Go model: a concurrent mark-and-sweep garbage collector. The program only
// allocates. In the background the collector marks the nodes still reachable and frees the
// rest, starting a cycle each time the heap doubles (GOGC=100). It does not move objects and
// its pauses are very short, at the price of using other cores while the program runs.
// PT: Carga de memória em Go: `binary-trees` (aloca e descarta muitos nós pequenos) e `idle`
// (sobe e sai). Modelo do Go: coletor de lixo concorrente de marcação e varredura. O programa
// só aloca. Em segundo plano o coletor marca os nós ainda alcançáveis e libera o resto,
// começando um ciclo cada vez que o heap dobra (GOGC=100). Ele não move objetos e suas pausas
// são muito curtas, ao preço de usar outros núcleos enquanto o programa roda.
package main

import (
	"fmt"
	"os"
	"strconv"
	"syscall"
	"time"
)

type node struct {
	left, right *node
}

func build(depth int) *node {
	if depth == 0 {
		return &node{}
	}
	return &node{build(depth - 1), build(depth - 1)}
}

// EN: Walks the whole tree and counts its nodes.
// PT: Percorre a árvore inteira e conta os nós.
func (n *node) check() int {
	if n.left == nil {
		return 1
	}
	return 1 + n.left.check() + n.right.check()
}

func binaryTrees(n int) int {
	const minDepth = 4
	maxDepth := max(minDepth+2, n)
	total := build(maxDepth + 1).check()
	longLived := build(maxDepth)
	for depth := minDepth; depth <= maxDepth; depth += 2 {
		iterations := 1 << (maxDepth - depth + minDepth)
		for i := 0; i < iterations; i++ {
			// EN: Nothing frees this tree here. It becomes garbage and the collector finds it.
			// PT: Nada libera esta árvore aqui. Ela vira lixo e o coletor a encontra.
			total += build(depth).check()
		}
	}
	return total + longLived.check()
}

func peakMemoryKb() int64 {
	var usage syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &usage); err != nil {
		return 0
	}
	return usage.Maxrss
}

func main() {
	implementation, n := "binary-trees", 10
	if len(os.Args) > 1 {
		implementation = os.Args[1]
	}
	if len(os.Args) > 2 {
		n, _ = strconv.Atoi(os.Args[2])
	}

	start := time.Now()
	checksum := "idle"
	if implementation != "idle" {
		checksum = strconv.Itoa(binaryTrees(n))
	}
	elapsedMs := float64(time.Since(start).Nanoseconds()) / 1e6

	fmt.Printf("{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"go\",\"implementation\":%q,\"checksum\":%q}\n",
		n, elapsedMs, peakMemoryKb(), implementation, checksum)
}
