package deadlock

import (
	"reflect"
	"testing"
)

// EN: Known graphs, classified as documented: which processes are deadlocked (on a cycle) and
// which are only blocked behind the cycle.
// PT: Grafos conhecidos, classificados como documentado: quais processos estão em impasse (em
// um ciclo) e quais estão apenas bloqueados atrás do ciclo.
// ES: Grafos conocidos, clasificados como está documentado: qué procesos están en deadlock (en
// un ciclo) y cuáles solo están bloqueados detrás del ciclo.
func TestGraphsAreClassifiedAsDocumented(t *testing.T) {
	cases := []struct {
		name       string
		graph      *Graph
		deadlocked []string
		blocked    []string
	}{
		{"textbook", TextbookGraph(), []string{"D", "E", "G"}, []string{"B"}},
		{"quiz", QuizGraph(), []string{"A", "B", "C"}, nil},
		{"chain without cycle", ChainGraph(), nil, nil},
		{"empty", NewGraph(), nil, nil},
	}
	for _, c := range cases {
		if got := c.graph.Deadlocked(); !reflect.DeepEqual(got, c.deadlocked) {
			t.Errorf("%s: Deadlocked() = %v, want %v", c.name, got, c.deadlocked)
		}
		if got := c.graph.Blocked(); !reflect.DeepEqual(got, c.blocked) {
			t.Errorf("%s: Blocked() = %v, want %v", c.name, got, c.blocked)
		}
	}
}

func TestTwoProcessesWaitingForEachOther(t *testing.T) {
	g := NewGraph()
	for _, step := range [][2]string{{"P1", "R1"}, {"P2", "R2"}} {
		if err := g.Hold(step[0], step[1]); err != nil {
			t.Fatal(err)
		}
	}
	g.Request("P1", "R2")
	if got := g.Deadlocked(); got != nil {
		t.Fatalf("one process waiting is not a deadlock, got %v", got)
	}
	g.Request("P2", "R1")
	if got := g.Deadlocked(); !reflect.DeepEqual(got, []string{"P1", "P2"}) {
		t.Fatalf("Deadlocked() = %v, want [P1 P2]", got)
	}
}

func TestResourceHasASingleInstance(t *testing.T) {
	g := NewGraph()
	if err := g.Hold("A", "R"); err != nil {
		t.Fatal(err)
	}
	if err := g.Hold("A", "R"); err != nil {
		t.Fatalf("holding the same resource twice should be accepted: %v", err)
	}
	if err := g.Hold("B", "R"); err == nil {
		t.Fatal("a second holder of R should be rejected")
	}
	// EN: Asking for a resource you already hold, or for a free one, blocks nobody.
	// PT: Pedir um recurso que você já segura, ou um recurso livre, não bloqueia ninguém.
	// ES: Pedir un recurso que ya retienes, o uno libre, no bloquea a nadie.
	g.Request("A", "R")
	g.Request("A", "free")
	if got := g.Deadlocked(); got != nil {
		t.Fatalf("Deadlocked() = %v, want none", got)
	}
}

// EN: Textbook states, classified safe or unsafe as documented.
// PT: Estados de livro, classificados como seguros ou inseguros conforme documentado.
// ES: Estados de libro de texto, clasificados como seguros o inseguros según está documentado.
func TestStatesAreClassifiedAsDocumented(t *testing.T) {
	cases := []struct {
		name  string
		state State
		order []int
	}{
		{"single resource", SingleResourceState(), []int{1, 2, 0}},
		{"four resources", FourResourceState(), []int{3, 4, 0, 1, 2}},
		{"three resources", ThreeResourceState(), []int{1, 3, 4, 0, 2}},
		{"quiz", QuizState(), []int{1, 3, 0, 2}},
	}
	for _, c := range cases {
		if err := c.state.Validate(); err != nil {
			t.Errorf("%s: %v", c.name, err)
		}
		order, safe := c.state.SafeSequence()
		if !safe || !reflect.DeepEqual(order, c.order) {
			t.Errorf("%s: SafeSequence() = %v, %v, want %v, true", c.name, order, safe, c.order)
		}
	}
}

func TestSingleResourceRequests(t *testing.T) {
	state := SingleResourceState()
	// EN: A asks for one more unit: 2 stay free, B can still finish (needs 2) and leaves 4,
	//     but then neither A (needs 5) nor C (needs 5) fits. Unsafe, so denied.
	// PT: A pede mais uma unidade: sobram 2 livres, B ainda consegue terminar (precisa de 2) e
	//     deixa 4, mas depois nem A (precisa de 5) nem C (precisa de 5) cabem. Inseguro, negado.
	// ES: A pide una unidad más: quedan 2 libres, B todavía puede terminar (necesita 2) y deja 4,
	//     pero entonces ni A (necesita 5) ni C (necesita 5) caben. Inseguro, así que se deniega.
	if _, decision := state.Request(0, []int{1}); decision != DeniedUnsafe {
		t.Errorf("A asks for 1: %v, want denied as unsafe", decision)
	}
	next, decision := state.Request(1, []int{1})
	if decision != Granted || next.Available[0] != 2 || next.Allocation[1][0] != 3 {
		t.Errorf("B asks for 1: %v with state %+v, want granted", decision, next)
	}
	if state.Available[0] != 3 || state.Allocation[1][0] != 2 {
		t.Error("Request must not change the original state")
	}
}

func TestFourResourceRequests(t *testing.T) {
	state := FourResourceState()
	printer := []int{0, 0, 1, 0}
	afterB, decision := state.Request(1, printer)
	if decision != Granted {
		t.Fatalf("B asks for a printer: %v, want granted", decision)
	}
	if _, decision := afterB.Request(4, printer); decision != DeniedUnsafe {
		t.Errorf("E asks for the last printer: %v, want denied as unsafe", decision)
	}
}

func TestThreeResourceRequests(t *testing.T) {
	state := ThreeResourceState()
	afterP1, decision := state.Request(1, []int{1, 0, 2})
	if decision != Granted {
		t.Fatalf("P1 asks for (1,0,2): %v, want granted", decision)
	}
	if _, decision := afterP1.Request(4, []int{3, 3, 0}); decision != DeniedNotAvailable {
		t.Errorf("P4 asks for (3,3,0): %v, want denied as not available", decision)
	}
	if _, decision := afterP1.Request(0, []int{0, 2, 0}); decision != DeniedUnsafe {
		t.Errorf("P0 asks for (0,2,0): %v, want denied as unsafe", decision)
	}
	if _, decision := afterP1.Request(1, []int{0, 3, 0}); decision != DeniedExceedsMax {
		t.Errorf("P1 asks beyond its maximum: %v, want denied", decision)
	}
}

func TestQuizSequences(t *testing.T) {
	// EN: The quiz lists five orders and only P1, P3, P2, P0 is safe. Check each by replaying it.
	// PT: O quiz lista cinco ordens, e só P1, P3, P2, P0 é segura. Confere cada uma reexecutando.
	// ES: El quiz lista cinco órdenes, y solo P1, P3, P2, P0 es segura. Comprueba cada una reproduciéndola.
	state := QuizState()
	replay := func(order []int) bool {
		work := append([]int{}, state.Available...)
		need := state.Need()
		for _, process := range order {
			if !fits(need[process], work) {
				return false
			}
			for j := range work {
				work[j] += state.Allocation[process][j]
			}
		}
		return true
	}
	cases := map[string]struct {
		order []int
		safe  bool
	}{
		"P1 P3 P2 P0": {[]int{1, 3, 2, 0}, true},
		"P0 P1 P3 P2": {[]int{0, 1, 3, 2}, false},
		"P1 P2 P0 P3": {[]int{1, 2, 0, 3}, false},
		"P1 P0 P2 P3": {[]int{1, 0, 2, 3}, false},
		"P3 P1 P0 P2": {[]int{3, 1, 0, 2}, false},
	}
	for name, c := range cases {
		if got := replay(c.order); got != c.safe {
			t.Errorf("%s: safe = %v, want %v", name, got, c.safe)
		}
	}
}

func TestDetectionWithSeveralInstances(t *testing.T) {
	available, allocation, request := DetectionExample(false)
	if stuck := Detect(available, allocation, request); stuck != nil {
		t.Errorf("original requests: deadlocked %v, want none", stuck)
	}
	available, allocation, request = DetectionExample(true)
	if stuck := Detect(available, allocation, request); !reflect.DeepEqual(stuck, []int{0, 1, 2}) {
		t.Errorf("variant: deadlocked %v, want [0 1 2]", stuck)
	}
}

func TestValidateRejectsInconsistentStates(t *testing.T) {
	bad := []State{
		{Available: []int{1}, Allocation: [][]int{{1}}, Max: [][]int{}},
		{Available: []int{1}, Allocation: [][]int{{1, 2}}, Max: [][]int{{1, 2}}},
		{Available: []int{1}, Allocation: [][]int{{3}}, Max: [][]int{{2}}},
		{Available: []int{-1}, Allocation: [][]int{{1}}, Max: [][]int{{2}}},
	}
	for i, state := range bad {
		if err := state.Validate(); err == nil {
			t.Errorf("state %d should be rejected", i)
		}
	}
}

func TestDecisionNames(t *testing.T) {
	for decision := Granted; decision <= DeniedUnsafe+1; decision++ {
		if decision.String() == "" {
			t.Errorf("decision %d has no name", decision)
		}
	}
}
