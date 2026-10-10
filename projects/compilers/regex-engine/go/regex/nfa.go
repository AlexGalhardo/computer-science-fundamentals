package regex

// State is one state of the NFA. It has either one transition that consumes a byte of the set
// (Next >= 0), or up to two transitions that consume nothing (Epsilon), or nothing at all (the
// accepting state).
type State struct {
	Set     ByteSet
	Next    int
	Epsilon []int
}

// NFA is a nondeterministic finite automaton with epsilon transitions, with one start state and
// one accepting state.
type NFA struct {
	States []State
	Start  int
	Accept int
}

// fragment is a piece of automaton under construction: where it is entered and where it is left.
type fragment struct{ start, accept int }

// Compile builds the NFA of a pattern tree with the Thompson construction.
//
// EN: The construction is one small rule per kind of node. Every rule returns a fragment with
// exactly one entry and one exit, so fragments plug into each other like bricks, and the
// automaton has a number of states proportional to the size of the pattern (at most two per
// node). Epsilon transitions (drawn as ε, taken without reading input) are the glue.
//
//	a      (s) --a--> (f)
//	AB     A.exit --ε--> B.entry
//	A|B    (s) --ε--> A.entry, B.entry        A.exit, B.exit --ε--> (f)
//	A*     (s) --ε--> A.entry, (f)            A.exit --ε--> A.entry, (f)
//	A+     (s) --ε--> A.entry                 A.exit --ε--> A.entry, (f)
//	A?     (s) --ε--> A.entry, (f)            A.exit --ε--> (f)
//
// PT: A construção é uma regra pequena por tipo de nó. Toda regra devolve um fragmento com
// exatamente uma entrada e uma saída, então os fragmentos se encaixam como tijolos, e o autômato
// tem um número de estados proporcional ao tamanho do padrão (no máximo dois por nó). As
// transições épsilon (desenhadas como ε, tomadas sem ler a entrada) são a cola.
//
// ES: La construcción es una regla pequeña por tipo de nodo. Cada regla devuelve un fragmento
// con exactamente una entrada y una salida, así que los fragmentos encajan como ladrillos, y el
// autómata tiene un número de estados proporcional al tamaño del patrón (como máximo dos por
// nodo). Las transiciones épsilon (dibujadas como ε, tomadas sin leer la entrada) son el
// pegamento.
func Compile(node *Node) *NFA {
	nfa := &NFA{}
	whole := nfa.build(node)
	nfa.Start, nfa.Accept = whole.start, whole.accept
	return nfa
}

func (n *NFA) add() int {
	n.States = append(n.States, State{Next: -1})
	return len(n.States) - 1
}

func (n *NFA) link(from int, to ...int) {
	n.States[from].Epsilon = append(n.States[from].Epsilon, to...)
}

func (n *NFA) build(node *Node) fragment {
	switch node.Kind {
	case Class:
		start, accept := n.add(), n.add()
		n.States[start].Set = node.Set
		n.States[start].Next = accept
		return fragment{start, accept}
	case Concat:
		left := n.build(node.Left)
		right := n.build(node.Right)
		n.link(left.accept, right.start)
		return fragment{left.start, right.accept}
	case Alternate:
		left := n.build(node.Left)
		right := n.build(node.Right)
		start, accept := n.add(), n.add()
		n.link(start, left.start, right.start)
		n.link(left.accept, accept)
		n.link(right.accept, accept)
		return fragment{start, accept}
	case Star, Plus, Optional:
		inner := n.build(node.Left)
		start, accept := n.add(), n.add()
		n.link(start, inner.start)
		n.link(inner.accept, accept)
		if node.Kind != Plus {
			// Zero times: skip the inner fragment.
			n.link(start, accept)
		}
		if node.Kind != Optional {
			// Again: go back to the entry of the inner fragment.
			n.link(inner.accept, inner.start)
		}
		return fragment{start, accept}
	default:
		start, accept := n.add(), n.add()
		n.link(start, accept)
		return fragment{start, accept}
	}
}

// closure adds to the set every state reachable from `state` through epsilon transitions alone.
//
// EN: The epsilon closure answers "in which states can the automaton be without reading anything
// more?". It is a plain graph search, and the `seen` marks keep it from walking a cycle of ε
// transitions for ever.
// PT: O fecho épsilon responde "em quais estados o autômato pode estar sem ler mais nada?". É uma
// busca comum em grafo, e as marcas `seen` impedem que ela percorra para sempre um ciclo de
// transições ε.
// ES: La clausura épsilon responde "¿en qué estados puede estar el autómata sin leer nada más?".
// Es una búsqueda común en un grafo, y las marcas `seen` impiden que recorra para siempre un
// ciclo de transiciones ε.
func (n *NFA) closure(state int, seen []bool, set []int) []int {
	if seen[state] {
		return set
	}
	seen[state] = true
	set = append(set, state)
	for _, next := range n.States[state].Epsilon {
		set = n.closure(next, seen, set)
	}
	return set
}

// Match reports whether the NFA accepts the whole input, and how many state visits it made.
//
// EN: The simulation never guesses and never goes back. It keeps the SET of all states the
// automaton could be in, and each input byte turns that set into the next one. A set holds at
// most every state once, so the work per byte is bounded by the size of the pattern, and the
// total is O(len(input) x len(pattern)): linear in the input, whatever the pattern is.
// PT: A simulação nunca chuta e nunca volta atrás. Ela mantém o CONJUNTO de todos os estados em
// que o autômato poderia estar, e cada byte da entrada transforma esse conjunto no próximo. Um
// conjunto contém cada estado no máximo uma vez, então o trabalho por byte é limitado pelo
// tamanho do padrão, e o total é O(len(entrada) x len(padrão)): linear na entrada, qualquer que
// seja o padrão.
// ES: La simulación nunca adivina y nunca retrocede. Mantiene el CONJUNTO de todos los estados en
// los que el autómata podría estar, y cada byte de la entrada transforma ese conjunto en el
// siguiente. Un conjunto contiene cada estado como máximo una vez, así que el trabajo por byte
// está acotado por el tamaño del patrón, y el total es O(len(entrada) x len(patrón)): lineal en
// la entrada, sea cual sea el patrón.
func (n *NFA) Match(input string) (matched bool, steps int) {
	seen := make([]bool, len(n.States))
	current := n.closure(n.Start, seen, nil)
	var next []int
	for i := 0; i < len(input); i++ {
		clear(seen)
		next = next[:0]
		for _, state := range current {
			steps++
			s := &n.States[state]
			if s.Next >= 0 && s.Set.Has(input[i]) {
				next = n.closure(s.Next, seen, next)
			}
		}
		current, next = next, current
		if len(current) == 0 {
			return false, steps
		}
	}
	for _, state := range current {
		if state == n.Accept {
			return true, steps
		}
	}
	return false, steps
}
