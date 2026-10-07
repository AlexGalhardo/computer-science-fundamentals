package regex

import (
	"fmt"
	"strings"
)

// EN: Both automata can be exported in the DOT language of Graphviz, which is plain text. Paste
// the output into any Graphviz viewer, or run `dot -Tsvg`, to see the drawing. The accepting
// states are double circles, and an arrow from nowhere marks the start state.
// PT: Os dois autômatos podem ser exportados na linguagem DOT do Graphviz, que é texto puro. Cole
// a saída em qualquer visualizador de Graphviz, ou rode `dot -Tsvg`, para ver o desenho. Os
// estados de aceitação são círculos duplos, e uma seta vinda do nada marca o estado inicial.
const dotHeader = "\trankdir=LR;\n\tnode [shape=circle];\n\tstart [shape=point];\n"

func dotLabel(text string) string {
	return strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(text)
}

// Dot returns the NFA as a Graphviz graph. Epsilon transitions are labelled ε.
func (n *NFA) Dot() string {
	var out strings.Builder
	out.WriteString("digraph NFA {\n" + dotHeader)
	fmt.Fprintf(&out, "\t%d [shape=doublecircle];\n\tstart -> %d;\n", n.Accept, n.Start)
	for from := range n.States {
		state := &n.States[from]
		if state.Next >= 0 {
			fmt.Fprintf(&out, "\t%d -> %d [label=\"%s\"];\n", from, state.Next, dotLabel(state.Set.String()))
		}
		for _, to := range state.Epsilon {
			fmt.Fprintf(&out, "\t%d -> %d [label=\"ε\"];\n", from, to)
		}
	}
	out.WriteString("}\n")
	return out.String()
}

// Dot returns the DFA as a Graphviz graph. Each state shows the set of NFA states it stands for,
// and the bytes that lead to the same target share one arrow.
func (d *DFA) Dot() string {
	var out strings.Builder
	out.WriteString("digraph DFA {\n" + dotHeader + "\tstart -> 0;\n")
	for state, set := range d.Sets {
		shape := "circle"
		if d.Accepting[state] {
			shape = "doublecircle"
		}
		members := strings.Trim(strings.ReplaceAll(fmt.Sprint(set), " ", ","), "[]")
		fmt.Fprintf(&out, "\t%d [shape=%s, label=\"%d\\n{%s}\"];\n", state, shape, state, members)
	}
	for state := range d.Sets {
		// Group the bytes by target, so `[a-z]` is one arrow and not twenty-six.
		labels := map[int]*ByteSet{}
		var targets []int
		for b := 0; b < 256; b++ {
			to := d.Next[state*d.Classes+d.ClassOf[b]]
			if to < 0 {
				continue
			}
			if labels[to] == nil {
				labels[to] = &ByteSet{}
				targets = append(targets, to)
			}
			labels[to].Add(byte(b))
		}
		for _, to := range targets {
			fmt.Fprintf(&out, "\t%d -> %d [label=\"%s\"];\n", state, to, dotLabel(labels[to].String()))
		}
	}
	out.WriteString("}\n")
	return out.String()
}
