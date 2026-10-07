package regex

import (
	"math/rand/v2"
	"regexp"
	"strings"
	"testing"
)

func TestKnownMatches(t *testing.T) {
	cases := []struct {
		pattern, input string
		want           bool
	}{
		{"", "", true},
		{"", "a", false},
		{"abc", "abc", true},
		{"abc", "ab", false},
		{"abc", "abcd", false}, // the whole input must match
		{"a|b", "b", true},
		{"ab|cd", "cd", true},
		{"ab|cd", "ad", false},
		{"a*", "", true},
		{"a*", "aaaa", true},
		{"a+", "", false},
		{"a+", "aaa", true},
		{"colou?r", "color", true},
		{"colou?r", "colour", true},
		{"colou?r", "colouur", false},
		{"(ab)*c", "ababc", true},
		{"(a|b)*abb", "babbabb", true},
		{"(a|b)*abb", "babba", false},
		{"[a-z_][a-z0-9_]*", "total_2", true},
		{"[a-z_][a-z0-9_]*", "2total", false},
		{"[0-9]+(\\.[0-9]+)?", "3.25", true},
		{"[0-9]+(\\.[0-9]+)?", "3.", false},
		{"[^,]*,[^,]*", "left,right", true},
		{"a.c", "a-c", true},
		{"(a*)*b", "aaaa", false},
		{"(a*)*b", "aaaab", true},
		{"(a|)+", "", true},
	}
	for _, c := range cases {
		compiled, err := New(c.pattern)
		if err != nil {
			t.Errorf("New(%q): %v", c.pattern, err)
			continue
		}
		byNFA, _ := compiled.NFA.Match(c.input)
		byBacktracking, _ := BacktrackMatch(compiled.Tree, c.input)
		if got := compiled.Match(c.input); got != c.want || byNFA != c.want || byBacktracking != c.want {
			t.Errorf("%q on %q: DFA %t, NFA %t, backtracking %t, want %t",
				c.pattern, c.input, got, byNFA, byBacktracking, c.want)
		}
	}
}

const alphabet = "abc"

// randomTree builds a random pattern tree over a three-letter alphabet. A small alphabet makes
// random inputs match often enough to exercise the accepting paths.
func randomTree(r *rand.Rand, depth int) *Node {
	if depth == 0 || r.IntN(4) == 0 {
		node := &Node{Kind: Class}
		switch r.IntN(8) {
		case 0: // a class with two letters
			node.Set.Add(alphabet[r.IntN(3)])
			node.Set.Add(alphabet[r.IntN(3)])
		case 1: // any byte
			for b := 0; b < 256; b++ {
				node.Set.Add(byte(b))
			}
		case 2:
			return &Node{Kind: Empty}
		default:
			node.Set.Add(alphabet[r.IntN(3)])
		}
		return node
	}
	switch r.IntN(7) {
	case 0, 1, 2:
		return &Node{Kind: Concat, Left: randomTree(r, depth-1), Right: randomTree(r, depth-1)}
	case 3, 4:
		return &Node{Kind: Alternate, Left: randomTree(r, depth-1), Right: randomTree(r, depth-1)}
	default:
		return &Node{Kind: []Kind{Star, Plus, Optional}[r.IntN(3)], Left: randomTree(r, depth-1)}
	}
}

// source writes a tree back as a pattern, with a group around every operator so the text means
// exactly the tree whatever the precedence rules are.
func source(node *Node) string {
	switch node.Kind {
	case Empty:
		return "()"
	case Class:
		return node.Set.String()
	case Concat:
		return "(" + source(node.Left) + source(node.Right) + ")"
	case Alternate:
		return "(" + source(node.Left) + "|" + source(node.Right) + ")"
	case Star:
		return "(" + source(node.Left) + ")*"
	case Plus:
		return "(" + source(node.Left) + ")+"
	default:
		return "(" + source(node.Left) + ")?"
	}
}

// sample writes a random string that the tree matches.
func sample(r *rand.Rand, node *Node, out *strings.Builder) {
	switch node.Kind {
	case Class:
		for {
			if b := alphabet[r.IntN(3)]; node.Set.Has(b) {
				out.WriteByte(b)
				return
			}
		}
	case Concat:
		sample(r, node.Left, out)
		sample(r, node.Right, out)
	case Alternate:
		if r.IntN(2) == 0 {
			sample(r, node.Left, out)
		} else {
			sample(r, node.Right, out)
		}
	case Star, Plus, Optional:
		times := r.IntN(3)
		switch node.Kind {
		case Optional:
			times = r.IntN(2)
		case Plus:
			times++
		}
		for range times {
			sample(r, node.Left, out)
		}
	}
}

// EN: The differential test. Go's own `regexp` package is the oracle: 1,000 generated cases
// (random patterns, half of the inputs built to match and half purely random) must get the same
// answer from the NFA, from the DFA and from the backtracking matcher as from the standard
// library. The seed is fixed, so a failure is reproducible. `(?s)` makes the dot of `regexp`
// match every byte, as it does here, and `^(?:...)$` asks for a match of the whole input.
// PT: O teste diferencial. O próprio pacote `regexp` do Go é o oráculo: 1.000 casos gerados
// (padrões aleatórios, metade das entradas construídas para casar e metade puramente aleatórias)
// precisam receber do AFN, do AFD e do casador por backtracking a mesma resposta que recebem da
// biblioteca padrão. A semente é fixa, então uma falha é reproduzível. `(?s)` faz o ponto do
// `regexp` casar qualquer byte, como aqui, e `^(?:...)$` pede o casamento da entrada inteira.
func TestAgreesWithStandardLibraryOn1000GeneratedCases(t *testing.T) {
	r := rand.New(rand.NewPCG(2026, 4))
	const patterns, inputsPerPattern = 200, 5
	matches := 0
	for range patterns {
		tree := randomTree(r, 4)
		pattern := source(tree)
		oracle, err := regexp.Compile("(?s)^(?:" + pattern + ")$")
		if err != nil {
			t.Fatalf("the oracle rejected %q: %v", pattern, err)
		}
		// The pattern text goes through the real parser: the tree above is only the generator.
		compiled, err := New(pattern)
		if err != nil {
			t.Fatalf("New(%q): %v", pattern, err)
		}
		for i := range inputsPerPattern {
			var input strings.Builder
			if i%2 == 0 {
				sample(r, tree, &input)
			} else {
				for range r.IntN(7) {
					input.WriteByte(alphabet[r.IntN(3)])
				}
			}
			want := oracle.MatchString(input.String())
			byNFA, _ := compiled.NFA.Match(input.String())
			byDFA, _ := compiled.DFA.Match(input.String())
			byBacktracking, _ := BacktrackMatch(compiled.Tree, input.String())
			if byNFA != want || byDFA != want || byBacktracking != want {
				t.Errorf("%q on %q: NFA %t, DFA %t, backtracking %t, regexp %t",
					pattern, input.String(), byNFA, byDFA, byBacktracking, want)
			}
			if want {
				matches++
			}
		}
	}
	total := patterns * inputsPerPattern
	if total != 1000 {
		t.Fatalf("the suite has %d cases, want 1000", total)
	}
	// Both answers must be well represented, or the comparison proves little.
	if matches < total/4 || matches > total*3/4 {
		t.Errorf("%d of %d cases match: the generated suite is too one-sided", matches, total)
	}
	t.Logf("%d cases compared with regexp, %d matching and %d not", total, matches, total-matches)
}

// EN: Thompson's construction adds at most two states per node of the tree, so the NFA grows
// linearly with the pattern. The numbers below were counted from the rules, not from the output.
// PT: A construção de Thompson acrescenta no máximo dois estados por nó da árvore, então o AFN
// cresce linearmente com o padrão. Os números abaixo foram contados a partir das regras, não a
// partir da saída.
func TestAutomataSizes(t *testing.T) {
	cases := []struct {
		pattern          string
		nfaStates, dfaOK int
	}{
		// 1 class: 2 states. DFA: start and accept.
		{"a", 2, 2},
		// 2 classes (4 states), concatenation adds none. DFA: 0, after a, after ab.
		{"ab", 4, 3},
		// 2 classes (4) + alternation (2). DFA: start, after a, after b (two different sets).
		{"a|b", 6, 3},
		// 1 class (2) + star (2). DFA: start, after one or more a.
		{"a*", 4, 2},
		// 5 classes (10) + alternation (2) + star (2); the three concatenations add none.
		{"(a|b)*abb", 14, 5},
	}
	for _, c := range cases {
		compiled, err := New(c.pattern)
		if err != nil {
			t.Fatal(err)
		}
		if got := len(compiled.NFA.States); got != c.nfaStates {
			t.Errorf("%q: NFA has %d states, want %d", c.pattern, got, c.nfaStates)
		}
		if got := len(compiled.DFA.Sets); got != c.dfaOK {
			t.Errorf("%q: DFA has %d states, want %d", c.pattern, got, c.dfaOK)
		}
	}
}

// EN: The pattern "the 14th byte from the end is an a" needs a DFA that remembers the last 14
// bytes: 2^14 states. The construction must stop with an error instead of using all the memory,
// while the NFA, which has only a few dozen states, still answers.
// PT: O padrão "o 14º byte a partir do fim é um a" precisa de um AFD que lembre os últimos 14
// bytes: 2^14 estados. A construção precisa parar com um erro em vez de usar toda a memória,
// enquanto o AFN, que tem apenas algumas dezenas de estados, continua respondendo.
func TestExponentialDFAIsRefused(t *testing.T) {
	pattern := "(a|b)*a" + strings.Repeat("(a|b)", 13)
	if _, err := New(pattern); err == nil {
		t.Fatalf("New(%q) must fail: its DFA has more than %d states", pattern, MaxDFAStates)
	}
	tree, err := Parse(pattern)
	if err != nil {
		t.Fatal(err)
	}
	nfa := Compile(tree)
	if matched, _ := nfa.Match("b" + "a" + strings.Repeat("b", 13)); !matched {
		t.Errorf("the NFA must still match")
	}
	if matched, _ := nfa.Match(strings.Repeat("b", 15)); matched {
		t.Errorf("the NFA must still reject")
	}
}
