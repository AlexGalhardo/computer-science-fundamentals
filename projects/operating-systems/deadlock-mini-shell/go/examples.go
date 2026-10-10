package deadlock

// EN: The documented examples. They live in the package, not in the tests, so that the tests
// and the demo program use exactly the same data. Each one is worked out by hand in
// docs/en/operating-systems/deadlock-mini-shell.md.
//
// PT: Os exemplos documentados. Eles ficam no pacote, não nos testes, para que os testes e o
// programa de demonstração usem exatamente os mesmos dados. Cada um está resolvido à mão em
// docs/pt/operating-systems/deadlock-mini-shell.md.
//
// ES: Los ejemplos documentados. Viven en el paquete, no en las pruebas, para que las pruebas y
// el programa de demostración usen exactamente los mismos datos. Cada uno está resuelto a mano
// en docs/es/operating-systems/deadlock-mini-shell.md.

// mustHold builds the fixed examples below. Each resource appears once in them, so there is no
// conflict to report and the unchecked assignment is enough.
func mustHold(g *Graph, process, resource string) {
	g.processes[process] = true
	g.holder[resource] = process
}

// TextbookGraph is the classic seven-process example: D, E and G form a cycle, B waits for a
// resource held inside the cycle, and A, C and F only wait for S, which is free.
func TextbookGraph() *Graph {
	g := NewGraph()
	mustHold(g, "A", "R")
	g.Request("A", "S")
	g.Request("B", "T")
	g.Request("C", "S")
	mustHold(g, "D", "U")
	g.Request("D", "S")
	g.Request("D", "T")
	mustHold(g, "E", "T")
	g.Request("E", "V")
	mustHold(g, "F", "W")
	g.Request("F", "S")
	mustHold(g, "G", "V")
	g.Request("G", "U")
	return g
}

// QuizGraph is the graph of quiz question operating-systems-deadlocks-04: A, B and C form a
// cycle, D waits for a free resource and E waits for D, which can finish.
func QuizGraph() *Graph {
	g := NewGraph()
	mustHold(g, "A", "R")
	g.Request("A", "S")
	mustHold(g, "B", "S")
	g.Request("B", "T")
	mustHold(g, "C", "T")
	g.Request("C", "R")
	mustHold(g, "D", "U")
	g.Request("D", "V")
	g.Request("E", "U")
	return g
}

// ChainGraph has processes waiting in a line, with no cycle: C can finish, then B, then A.
func ChainGraph() *Graph {
	g := NewGraph()
	mustHold(g, "A", "R")
	g.Request("A", "S")
	mustHold(g, "B", "S")
	g.Request("B", "T")
	mustHold(g, "C", "T")
	return g
}

// SingleResourceState is a banker's example with one resource type and 10 units: A holds 3 of
// at most 9, B holds 2 of at most 4, C holds 2 of at most 7, and 3 units are free.
func SingleResourceState() State {
	return State{
		Available:  []int{3},
		Allocation: [][]int{{3}, {2}, {2}},
		Max:        [][]int{{9}, {4}, {7}},
	}
}

// FourResourceState is a banker's example with five processes and four resource types.
func FourResourceState() State {
	return State{
		Available:  []int{1, 0, 2, 0},
		Allocation: [][]int{{3, 0, 1, 1}, {0, 1, 0, 0}, {1, 1, 1, 0}, {1, 1, 0, 1}, {0, 0, 0, 0}},
		Max:        [][]int{{4, 1, 1, 1}, {0, 2, 1, 2}, {4, 2, 1, 0}, {1, 1, 1, 1}, {2, 1, 1, 0}},
	}
}

// ThreeResourceState is a banker's example with five processes and three resource types.
func ThreeResourceState() State {
	return State{
		Available:  []int{3, 3, 2},
		Allocation: [][]int{{0, 1, 0}, {2, 0, 0}, {3, 0, 2}, {2, 1, 1}, {0, 0, 2}},
		Max:        [][]int{{7, 5, 3}, {3, 2, 2}, {9, 0, 2}, {2, 2, 2}, {4, 3, 3}},
	}
}

// QuizState is the state of quiz question operating-systems-deadlocks-05.
func QuizState() State {
	return State{
		Available:  []int{2, 1, 2},
		Allocation: [][]int{{1, 0, 2}, {2, 1, 0}, {1, 1, 1}, {0, 2, 1}},
		Max:        [][]int{{3, 2, 4}, {4, 1, 1}, {2, 4, 3}, {3, 3, 2}},
	}
}

// DetectionExample returns the matrices of a detection example with three processes and four
// resource types. With the original requests nobody is deadlocked. With the variant, in which
// the third process also asks for one unit of the last resource, all three are.
func DetectionExample(variant bool) (available []int, allocation, request [][]int) {
	available = []int{2, 1, 0, 0}
	allocation = [][]int{{0, 0, 1, 0}, {2, 0, 0, 1}, {0, 1, 2, 0}}
	request = [][]int{{2, 0, 0, 1}, {1, 0, 1, 0}, {2, 1, 0, 0}}
	if variant {
		request[2] = []int{2, 1, 0, 1}
	}
	return available, allocation, request
}
