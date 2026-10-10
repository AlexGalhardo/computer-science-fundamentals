package regex

import (
	"fmt"
	"slices"
	"strings"
)

// MaxDFAStates is the largest deterministic automaton Determinize is willing to build.
//
// EN: A DFA state is a SET of NFA states, and an NFA with n states has up to 2^n sets. For most
// patterns only a few of them are reachable, but some patterns really need exponentially many
// (the classic one is "the k-th byte from the end is an a"). The limit turns that blow-up into
// an error instead of an exhausted memory.
// PT: Um estado do AFD é um CONJUNTO de estados do AFN, e um AFN com n estados tem até 2^n
// conjuntos. Para a maioria dos padrões só alguns deles são alcançáveis, mas alguns padrões
// realmente precisam de exponencialmente muitos (o clássico é "o k-ésimo byte a partir do fim é
// um a"). O limite transforma essa explosão em um erro em vez de memória esgotada.
// ES: Un estado del AFD es un CONJUNTO de estados del AFN, y un AFN con n estados tiene hasta 2^n
// conjuntos. Para la mayoría de los patrones solo unos pocos son alcanzables, pero algunos
// patrones realmente necesitan exponencialmente muchos (el clásico es "el k-ésimo byte desde el
// final es una a"). El límite convierte esa explosión en un error en lugar de memoria agotada.
const MaxDFAStates = 10000

// DFA is a deterministic finite automaton: from each state, each byte leads to exactly one state.
type DFA struct {
	// ClassOf maps a byte to its column in Next. Bytes that no part of the pattern tells apart
	// share a column, which keeps the table small.
	ClassOf [256]int
	// Classes is the number of columns.
	Classes int
	// Next[state*Classes+class] is the next state, or -1 when the input can no longer match.
	Next []int
	// Accepting[state] says whether the input read so far is a match.
	Accepting []bool
	// Sets[state] is the set of NFA states this DFA state stands for, sorted.
	Sets [][]int
}

// byteClasses groups the 256 bytes by which sets of the NFA contain them. Two bytes in the same
// group are indistinguishable to the pattern, so one transition serves both.
func byteClasses(nfa *NFA) (classOf [256]int, representatives []byte) {
	index := map[string]int{}
	for b := 0; b < 256; b++ {
		var signature strings.Builder
		for i := range nfa.States {
			if nfa.States[i].Next >= 0 && nfa.States[i].Set.Has(byte(b)) {
				fmt.Fprintf(&signature, "%d,", i)
			}
		}
		class, found := index[signature.String()]
		if !found {
			class = len(representatives)
			index[signature.String()] = class
			representatives = append(representatives, byte(b))
		}
		classOf[b] = class
	}
	return classOf, representatives
}

// Determinize builds the DFA equivalent to an NFA with the subset construction.
//
// EN: The idea is to do, once and ahead of time, everything the NFA simulation does at match
// time. The simulation moves from one set of NFA states to another; the subset construction
// names each such set and makes it a single DFA state.
//
//  1. The start state is the epsilon closure of the NFA start state.
//  2. Take a set not processed yet. For each byte class, collect where its NFA states go on
//     that byte and close the result under epsilon. That set is the target of the transition.
//  3. A set never seen before becomes a new DFA state and waits its turn. Repeat until no set
//     is waiting.
//  4. A DFA state accepts when its set contains the accepting state of the NFA.
//
// PT: A ideia é fazer, uma única vez e com antecedência, tudo o que a simulação do AFN faz na
// hora de casar. A simulação anda de um conjunto de estados do AFN para outro; a construção de
// subconjuntos dá um nome a cada um desses conjuntos e faz dele um único estado do AFD.
//
//  1. O estado inicial é o fecho épsilon do estado inicial do AFN.
//  2. Pegue um conjunto ainda não processado. Para cada classe de bytes, reúna para onde seus
//     estados do AFN vão com aquele byte e feche o resultado sob épsilon. Esse conjunto é o
//     destino da transição.
//  3. Um conjunto nunca visto vira um novo estado do AFD e espera a sua vez. Repita até não
//     haver conjunto esperando.
//  4. Um estado do AFD aceita quando seu conjunto contém o estado de aceitação do AFN.
//
// ES: La idea es hacer, una sola vez y por adelantado, todo lo que la simulación del AFN hace en
// el momento de emparejar. La simulación pasa de un conjunto de estados del AFN a otro; la
// construcción de subconjuntos le da un nombre a cada uno de esos conjuntos y lo convierte en un
// único estado del AFD.
//
//  1. El estado inicial es la clausura épsilon del estado inicial del AFN.
//  2. Toma un conjunto aún no procesado. Para cada clase de bytes, reúne a dónde van sus
//     estados del AFN con ese byte y cierra el resultado bajo épsilon. Ese conjunto es el
//     destino de la transición.
//  3. Un conjunto nunca visto se convierte en un nuevo estado del AFD y espera su turno. Repite
//     hasta que no haya conjuntos esperando.
//  4. Un estado del AFD acepta cuando su conjunto contiene el estado de aceptación del AFN.
func Determinize(nfa *NFA) (*DFA, error) {
	dfa := &DFA{}
	var representatives []byte
	dfa.ClassOf, representatives = byteClasses(nfa)
	dfa.Classes = len(representatives)

	known := map[string]int{}
	seen := make([]bool, len(nfa.States))
	// intern returns the DFA state of a set of NFA states, creating it on first sight.
	intern := func(set []int) int {
		slices.Sort(set)
		key := fmt.Sprint(set)
		if state, found := known[key]; found {
			return state
		}
		state := len(dfa.Sets)
		known[key] = state
		dfa.Sets = append(dfa.Sets, slices.Clone(set))
		dfa.Accepting = append(dfa.Accepting, slices.Contains(set, nfa.Accept))
		return state
	}

	intern(nfa.closure(nfa.Start, seen, nil))
	for state := 0; state < len(dfa.Sets); state++ {
		if state >= MaxDFAStates {
			return nil, fmt.Errorf("the DFA needs more than %d states", MaxDFAStates)
		}
		for _, b := range representatives {
			clear(seen)
			var target []int
			for _, from := range dfa.Sets[state] {
				s := &nfa.States[from]
				if s.Next >= 0 && s.Set.Has(b) {
					target = nfa.closure(s.Next, seen, target)
				}
			}
			// The empty set is the dead state: no continuation of the input can match.
			next := -1
			if len(target) > 0 {
				next = intern(target)
			}
			dfa.Next = append(dfa.Next, next)
		}
	}
	return dfa, nil
}

// Match reports whether the DFA accepts the whole input, and how many transitions it took.
//
// EN: This loop is the reason to build a DFA: one table lookup per input byte, no sets, no
// search. The time is O(len(input)) and does not depend on the pattern at all.
// PT: Este laço é o motivo de se construir um AFD: uma consulta à tabela por byte da entrada, sem
// conjuntos, sem busca. O tempo é O(len(entrada)) e não depende em nada do padrão.
// ES: Este bucle es la razón de construir un AFD: una consulta a la tabla por byte de la entrada,
// sin conjuntos, sin búsqueda. El tiempo es O(len(entrada)) y no depende en nada del patrón.
func (d *DFA) Match(input string) (matched bool, steps int) {
	state := 0
	for i := 0; i < len(input); i++ {
		steps++
		state = d.Next[state*d.Classes+d.ClassOf[input[i]]]
		if state < 0 {
			return false, steps
		}
	}
	return d.Accepting[state], steps
}
