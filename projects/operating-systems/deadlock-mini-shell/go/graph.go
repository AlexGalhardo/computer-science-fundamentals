// Package deadlock detects deadlocks on resource allocation graphs and decides, with the
// banker's algorithm, whether a state of resource allocation is safe.
//
// EN: A deadlock is a set of processes in which each one waits for something that only another
// process of the set can release. Nothing in the set will ever run again. This package shows
// the two classic ways of reasoning about it: a graph, when every resource has one instance,
// and matrices, when resources have several instances.
//
// PT: Um impasse (deadlock) é um conjunto de processos em que cada um espera por algo que só
// outro processo do conjunto pode liberar. Nada no conjunto volta a executar. Este pacote
// mostra as duas formas clássicas de raciocinar sobre isso: um grafo, quando cada recurso tem
// uma instância, e matrizes, quando os recursos têm várias instâncias.
package deadlock

import (
	"fmt"
	"sort"
)

// Graph is a resource allocation graph for resources with a single instance.
//
// EN: The graph has two kinds of arc. "Resource -> process" means the process holds the
// resource. "Process -> resource" means the process asked for it and is blocked waiting.
// With single-instance resources there is a deadlock exactly when the graph has a cycle.
//
// PT: O grafo tem dois tipos de arco. "Recurso -> processo" significa que o processo segura o
// recurso. "Processo -> recurso" significa que o processo o pediu e está bloqueado à espera.
// Com recursos de instância única, existe impasse exatamente quando o grafo tem um ciclo.
type Graph struct {
	holder    map[string]string
	wants     map[string][]string
	processes map[string]bool
}

// NewGraph returns an empty resource allocation graph.
func NewGraph() *Graph {
	return &Graph{
		holder:    map[string]string{},
		wants:     map[string][]string{},
		processes: map[string]bool{},
	}
}

// AddProcess registers a process that neither holds nor requests anything yet.
func (g *Graph) AddProcess(process string) {
	g.processes[process] = true
}

// Hold records that the process holds the resource. A resource has a single instance, so it
// is an error to give it to a second process.
func (g *Graph) Hold(process, resource string) error {
	if owner, taken := g.holder[resource]; taken && owner != process {
		return fmt.Errorf("resource %s is already held by %s", resource, owner)
	}
	g.processes[process] = true
	g.holder[resource] = process
	return nil
}

// Request records that the process is waiting for the resource.
func (g *Graph) Request(process, resource string) {
	g.processes[process] = true
	g.wants[process] = append(g.wants[process], resource)
}

// waitsFor reduces the graph to processes only.
//
// EN: The wait-for graph drops the resources: P waits for Q when P requests a resource that Q
// holds. A request for a free resource creates no arc, because it can be granted at once.
//
// PT: O grafo de espera elimina os recursos: P espera por Q quando P pede um recurso que Q
// segura. O pedido de um recurso livre não cria arco, porque pode ser atendido na hora.
func (g *Graph) waitsFor() map[string][]string {
	edges := map[string][]string{}
	for process, resources := range g.wants {
		for _, resource := range resources {
			if owner, taken := g.holder[resource]; taken && owner != process {
				edges[process] = append(edges[process], owner)
			}
		}
	}
	return edges
}

// reachable returns every process that can be reached from start by following the arcs.
func reachable(edges map[string][]string, start string) map[string]bool {
	seen := map[string]bool{}
	stack := append([]string{}, edges[start]...)
	for len(stack) > 0 {
		current := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if seen[current] {
			continue
		}
		seen[current] = true
		stack = append(stack, edges[current]...)
	}
	return seen
}

// Deadlocked returns, in alphabetical order, the processes that are part of a cycle.
//
// EN: A process is on a cycle when, following the "waits for" arcs from it, we come back to
// it. Those processes wait for each other, so none of them can ever be the first to release.
//
// PT: Um processo está em um ciclo quando, seguindo os arcos de "espera por" a partir dele,
// voltamos a ele. Esses processos esperam uns pelos outros, então nenhum deles pode ser o
// primeiro a liberar.
func (g *Graph) Deadlocked() []string {
	edges := g.waitsFor()
	var cycle []string
	for process := range g.processes {
		if reachable(edges, process)[process] {
			cycle = append(cycle, process)
		}
	}
	sort.Strings(cycle)
	return cycle
}

// Blocked returns the processes that are not on a cycle but wait, directly or not, for a
// process that is.
//
// EN: These processes are not part of the circular wait, and removing them would not break the
// deadlock. But they will also wait forever, because what they need is held inside the cycle.
//
// PT: Esses processos não fazem parte da espera circular, e removê-los não desfaria o impasse.
// Mas eles também vão esperar para sempre, porque o que precisam está preso dentro do ciclo.
func (g *Graph) Blocked() []string {
	edges := g.waitsFor()
	inCycle := map[string]bool{}
	for _, process := range g.Deadlocked() {
		inCycle[process] = true
	}
	var blocked []string
	for process := range g.processes {
		if inCycle[process] {
			continue
		}
		for other := range reachable(edges, process) {
			if inCycle[other] {
				blocked = append(blocked, process)
				break
			}
		}
	}
	sort.Strings(blocked)
	return blocked
}
