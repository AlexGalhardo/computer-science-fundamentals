package deadlock

import (
	"errors"
	"fmt"
)

// State describes resource allocation with several instances per resource type.
//
// EN: Row i of Allocation is what process i holds now, and row i of Max is the most it may
// ever need, declared in advance. Available is what is free. All vectors have one entry per
// resource type.
//
// PT: A linha i de Allocation é o que o processo i segura agora, e a linha i de Max é o máximo
// de que ele pode precisar, declarado de antemão. Available é o que está livre. Todos os
// vetores têm uma entrada por tipo de recurso.
//
// ES: La fila i de Allocation es lo que el proceso i retiene ahora, y la fila i de Max es lo
// máximo que podría llegar a necesitar, declarado de antemano. Available es lo que está libre.
// Todos los vectores tienen una entrada por tipo de recurso.
type State struct {
	Available  []int
	Allocation [][]int
	Max        [][]int
}

// Decision is the answer of the banker to a request.
type Decision int

// The possible answers to a request.
const (
	// Granted means the resulting state is safe, so the resources are handed over.
	Granted Decision = iota
	// DeniedExceedsMax means the process asked for more than the maximum it declared.
	DeniedExceedsMax
	// DeniedNotAvailable means the resources are not free now, so the process has to wait.
	DeniedNotAvailable
	// DeniedUnsafe means the resources are free, but granting them would lead to an unsafe state.
	DeniedUnsafe
)

func (d Decision) String() string {
	switch d {
	case Granted:
		return "granted"
	case DeniedExceedsMax:
		return "denied: exceeds the declared maximum"
	case DeniedNotAvailable:
		return "denied: not enough free resources, the process must wait"
	case DeniedUnsafe:
		return "denied: the resulting state would be unsafe"
	default:
		return "unknown"
	}
}

// Validate checks that the matrices have consistent shapes and that no process holds more
// than its declared maximum.
func (s State) Validate() error {
	if len(s.Allocation) != len(s.Max) {
		return errors.New("allocation and max must have one row per process")
	}
	for i := range s.Allocation {
		if len(s.Allocation[i]) != len(s.Available) || len(s.Max[i]) != len(s.Available) {
			return fmt.Errorf("process %d: rows must have one entry per resource type", i)
		}
		for j := range s.Available {
			if s.Allocation[i][j] < 0 || s.Allocation[i][j] > s.Max[i][j] {
				return fmt.Errorf("process %d holds more of resource %d than its maximum", i, j)
			}
		}
	}
	for j, free := range s.Available {
		if free < 0 {
			return fmt.Errorf("resource %d has a negative number of free instances", j)
		}
	}
	return nil
}

// Need returns Max minus Allocation: what each process may still ask for.
func (s State) Need() [][]int {
	need := make([][]int, len(s.Max))
	for i := range s.Max {
		need[i] = make([]int, len(s.Max[i]))
		for j := range s.Max[i] {
			need[i][j] = s.Max[i][j] - s.Allocation[i][j]
		}
	}
	return need
}

func fits(want, have []int) bool {
	for j := range want {
		if want[j] > have[j] {
			return false
		}
	}
	return true
}

// finishOrder is the core shared by the banker's algorithm and by deadlock detection.
//
// EN: Pretend to run the processes. Look for one whose remaining demand fits in what is free.
// Assume it runs to the end and gives back everything it holds, which can only help the
// others. Repeat until no process fits. The processes that were never picked are the ones
// that cannot be guaranteed to finish.
//
// PT: Finja executar os processos. Procure um cuja demanda restante caiba no que está livre.
// Suponha que ele execute até o fim e devolva tudo o que segura, o que só pode ajudar os
// outros. Repita até nenhum processo caber. Os processos que nunca foram escolhidos são os
// que não têm garantia de terminar.
//
// ES: Finge ejecutar los procesos. Busca uno cuya demanda restante quepa en lo que está libre.
// Supón que se ejecuta hasta el final y devuelve todo lo que retiene, lo cual solo puede ayudar
// a los demás. Repite hasta que ningún proceso quepa. Los procesos que nunca fueron elegidos son
// los que no tienen garantía de terminar.
func finishOrder(available []int, allocation, demand [][]int) (order, stuck []int) {
	work := append([]int{}, available...)
	finished := make([]bool, len(allocation))
	for progress := true; progress; {
		progress = false
		for i := range allocation {
			if finished[i] || !fits(demand[i], work) {
				continue
			}
			for j := range work {
				work[j] += allocation[i][j]
			}
			finished[i] = true
			order = append(order, i)
			progress = true
		}
	}
	for i, done := range finished {
		if !done {
			stuck = append(stuck, i)
		}
	}
	return order, stuck
}

// SafeSequence reports whether the state is safe and, if so, one order in which every process
// can finish.
//
// EN: A state is safe when some order exists in which all processes finish even if each one
// asks for its whole maximum. Unsafe does not mean deadlocked: it means that the system can
// no longer guarantee that a deadlock will be avoided.
//
// PT: Um estado é seguro quando existe alguma ordem em que todos os processos terminam mesmo
// que cada um peça o seu máximo inteiro. Inseguro não significa em impasse: significa que o
// sistema não consegue mais garantir que o impasse será evitado.
//
// ES: Un estado es seguro cuando existe algún orden en el que todos los procesos terminan aunque
// cada uno pida su máximo completo. Inseguro no significa en deadlock: significa que el sistema
// ya no puede garantizar que se evitará el deadlock.
func (s State) SafeSequence() ([]int, bool) {
	order, stuck := finishOrder(s.Available, s.Allocation, s.Need())
	return order, len(stuck) == 0
}

// Request decides whether process may receive request. The returned state is the new state
// when the request is granted and the unchanged state otherwise.
//
// EN: The banker's algorithm: tentatively hand over the resources and test whether the new
// state is safe. If it is not, the request is postponed, even though the resources are free.
//
// PT: O algoritmo do banqueiro: entregue os recursos provisoriamente e teste se o novo estado
// é seguro. Se não for, o pedido é adiado, mesmo com os recursos livres.
//
// ES: El algoritmo del banquero: entrega los recursos provisionalmente y prueba si el nuevo
// estado es seguro. Si no lo es, la solicitud se pospone, aunque los recursos estén libres.
func (s State) Request(process int, request []int) (State, Decision) {
	if !fits(request, s.Need()[process]) {
		return s, DeniedExceedsMax
	}
	if !fits(request, s.Available) {
		return s, DeniedNotAvailable
	}
	next := State{
		Available:  append([]int{}, s.Available...),
		Allocation: make([][]int, len(s.Allocation)),
		Max:        s.Max,
	}
	for i := range s.Allocation {
		next.Allocation[i] = append([]int{}, s.Allocation[i]...)
	}
	for j, amount := range request {
		next.Available[j] -= amount
		next.Allocation[process][j] += amount
	}
	if _, safe := next.SafeSequence(); !safe {
		return s, DeniedUnsafe
	}
	return next, Granted
}

// Detect returns the processes that are deadlocked now, given what each one holds and what
// each one is currently requesting.
//
// EN: Detection looks at the present, not at the worst case: it uses the current requests
// instead of the declared maximum. A process whose request cannot be met even after every
// other process that can finish has finished is deadlocked.
//
// PT: A detecção olha para o presente, não para o pior caso: ela usa os pedidos atuais no
// lugar do máximo declarado. Um processo cujo pedido não pode ser atendido mesmo depois que
// todos os outros que conseguem terminar terminaram está em impasse.
//
// ES: La detección mira el presente, no el peor caso: usa las solicitudes actuales en lugar del
// máximo declarado. Un proceso cuya solicitud no puede atenderse ni siquiera después de que
// todos los demás que pueden terminar hayan terminado está en deadlock.
func Detect(available []int, allocation, request [][]int) []int {
	_, stuck := finishOrder(available, allocation, request)
	return stuck
}
