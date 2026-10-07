package regex

import (
	"strings"
	"testing"
)

// EN: The pathological case, measured in steps instead of seconds so the test does not depend on
// the machine. `(a*)*b` cannot match n letters a. The backtracking matcher must at least double
// its work for each extra letter (exponential), while the automata do the same work per letter
// whatever n is (linear).
// PT: O caso patológico, medido em passos em vez de segundos para o teste não depender da
// máquina. `(a*)*b` não consegue casar n letras a. O casador por backtracking precisa pelo menos
// dobrar seu trabalho a cada letra a mais (exponencial), enquanto os autômatos fazem o mesmo
// trabalho por letra qualquer que seja n (linear).
func TestAutomataStayLinearWhereBacktrackingIsExponential(t *testing.T) {
	compiled, err := New("(a*)*b")
	if err != nil {
		t.Fatal(err)
	}

	previous := 0
	for n := 8; n <= 16; n++ {
		matched, steps := BacktrackMatch(compiled.Tree, strings.Repeat("a", n))
		if matched {
			t.Fatalf("n=%d: the pattern must not match", n)
		}
		if previous > 0 && steps < 2*previous {
			t.Errorf("n=%d: backtracking took %d steps after %d: expected at least twice as many",
				n, steps, previous)
		}
		previous = steps
	}

	_, nfaSmall := compiled.NFA.Match(strings.Repeat("a", 1000))
	_, dfaSmall := compiled.DFA.Match(strings.Repeat("a", 1000))
	for _, n := range []int{10000, 100000} {
		input := strings.Repeat("a", n)
		matchedNFA, nfaSteps := compiled.NFA.Match(input)
		matchedDFA, dfaSteps := compiled.DFA.Match(input)
		if matchedNFA || matchedDFA {
			t.Fatalf("n=%d: the pattern must not match", n)
		}
		// Linear: n times larger input, exactly n times more steps.
		if nfaSteps != nfaSmall*(n/1000) {
			t.Errorf("n=%d: NFA took %d steps, want %d", n, nfaSteps, nfaSmall*(n/1000))
		}
		if dfaSteps != dfaSmall*(n/1000) || dfaSteps != n {
			t.Errorf("n=%d: DFA took %d steps, want %d", n, dfaSteps, n)
		}
	}
}

func TestDotExport(t *testing.T) {
	compiled, err := New("a|b")
	if err != nil {
		t.Fatal(err)
	}
	wantNFA := `digraph NFA {
	rankdir=LR;
	node [shape=circle];
	start [shape=point];
	5 [shape=doublecircle];
	start -> 4;
	0 -> 1 [label="a"];
	1 -> 5 [label="ε"];
	2 -> 3 [label="b"];
	3 -> 5 [label="ε"];
	4 -> 0 [label="ε"];
	4 -> 2 [label="ε"];
}
`
	if got := compiled.NFA.Dot(); got != wantNFA {
		t.Errorf("NFA of a|b:\n%s\nwant:\n%s", got, wantNFA)
	}
	wantDFA := `digraph DFA {
	rankdir=LR;
	node [shape=circle];
	start [shape=point];
	start -> 0;
	0 [shape=circle, label="0\n{0,2,4}"];
	1 [shape=doublecircle, label="1\n{1,5}"];
	2 [shape=doublecircle, label="2\n{3,5}"];
	0 -> 1 [label="a"];
	0 -> 2 [label="b"];
}
`
	if got := compiled.DFA.Dot(); got != wantDFA {
		t.Errorf("DFA of a|b:\n%s\nwant:\n%s", got, wantDFA)
	}

	// A class is one arrow, and quotes and backslashes are escaped for Graphviz.
	classes, err := New("[a-c\"]\\\\")
	if err != nil {
		t.Fatal(err)
	}
	dot := classes.DFA.Dot()
	if !strings.Contains(dot, `0 -> 1 [label="[\"a-c]"];`) || !strings.Contains(dot, `1 -> 2 [label="\\"];`) {
		t.Errorf("unexpected labels in:\n%s", dot)
	}
}
