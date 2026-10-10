package regex

import "fmt"

// Regex is a compiled pattern: the three forms the pattern goes through, kept side by side so
// each one can be inspected, exported and timed.
type Regex struct {
	Pattern string
	Tree    *Node
	NFA     *NFA
	DFA     *DFA
}

// New compiles a pattern all the way: text to tree, tree to NFA, NFA to DFA.
//
// EN: This is the pipeline of a lexer generator in three lines. Each stage answers the same
// question, "does this text match?", in a form that is cheaper to execute and more expensive to
// build than the one before it.
// PT: Este é o pipeline de um gerador de analisadores léxicos em três linhas. Cada estágio
// responde à mesma pergunta, "este texto casa?", em uma forma mais barata de executar e mais cara
// de construir do que a anterior.
// ES: Este es el pipeline de un generador de analizadores léxicos en tres líneas. Cada etapa
// responde a la misma pregunta, "¿este texto empareja?", en una forma más barata de ejecutar y
// más cara de construir que la anterior.
func New(pattern string) (*Regex, error) {
	tree, err := Parse(pattern)
	if err != nil {
		return nil, err
	}
	nfa := Compile(tree)
	dfa, err := Determinize(nfa)
	if err != nil {
		return nil, fmt.Errorf("compiling %q: %w", pattern, err)
	}
	return &Regex{Pattern: pattern, Tree: tree, NFA: nfa, DFA: dfa}, nil
}

// Match reports whether the pattern matches the whole input, using the DFA.
func (r *Regex) Match(input string) bool {
	matched, _ := r.DFA.Match(input)
	return matched
}
