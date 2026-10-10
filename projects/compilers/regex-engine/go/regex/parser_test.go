package regex

import (
	"errors"
	"testing"
)

// EN: Precedence is checked on the shape of the tree, printed in prefix form: the operator that
// binds the least must be at the top.
// PT: A precedência é conferida na forma da árvore, impressa em forma prefixa: o operador que
// liga menos precisa estar no topo.
// ES: La precedencia se comprueba en la forma del árbol, impreso en forma prefija: el operador
// que enlaza menos debe estar en lo alto.
func TestPrecedence(t *testing.T) {
	cases := []struct{ pattern, tree string }{
		{"a", "a"},
		{"ab", "(cat a b)"},
		{"abc", "(cat (cat a b) c)"},
		// Alternation binds less than concatenation.
		{"ab|cd", "(alt (cat a b) (cat c d))"},
		{"a|b|c", "(alt (alt a b) c)"},
		// Repetition binds more than concatenation: it applies to one atom only.
		{"ab*", "(cat a (star b))"},
		{"ab+c?", "(cat (cat a (plus b)) (opt c))"},
		{"a|b*", "(alt a (star b))"},
		// Parentheses override both.
		{"(ab)*", "(star (cat a b))"},
		{"a(b|c)d", "(cat (cat a (alt b c)) d)"},
		{"(a|b)+", "(plus (alt a b))"},
		// Repetitions stack.
		{"a*?", "(opt (star a))"},
		// Empty branches match the empty string.
		{"", "empty"},
		{"a|", "(alt a empty)"},
		{"()", "empty"},
		{"()*a", "(cat (star empty) a)"},
	}
	for _, c := range cases {
		tree, err := Parse(c.pattern)
		if err != nil {
			t.Errorf("Parse(%q): unexpected error %v", c.pattern, err)
			continue
		}
		if got := tree.String(); got != c.tree {
			t.Errorf("Parse(%q) = %s, want %s", c.pattern, got, c.tree)
		}
	}
}

func TestClassesAndEscapes(t *testing.T) {
	cases := []struct{ pattern, tree string }{
		{"[abc]", "[a-c]"},
		{"[a-cx]", "[a-cx]"},
		{"[a-c0-2]", "[0-2a-c]"},
		{"[x]", "x"},
		{"[a-]", "[-a]"},
		{"[\\]]", "]"},
		{".", "."},
		{"\\.", "."},
		{"\\*a", "(cat * a)"},
		{"[a-c]*", "(star [a-c])"},
	}
	for _, c := range cases {
		tree, err := Parse(c.pattern)
		if err != nil {
			t.Errorf("Parse(%q): unexpected error %v", c.pattern, err)
			continue
		}
		if got := tree.String(); got != c.tree {
			t.Errorf("Parse(%q) = %s, want %s", c.pattern, got, c.tree)
		}
	}

	negated, err := Parse("[^a-y]")
	if err != nil {
		t.Fatal(err)
	}
	if negated.Set.Has('a') || negated.Set.Has('m') || !negated.Set.Has('z') || !negated.Set.Has('0') {
		t.Errorf("[^a-y] must reject a and m and accept z and 0")
	}
	// `\.` is the literal dot, `.` is every byte: the printed form is the same, the sets are not.
	literal, _ := Parse("\\.")
	if literal.Set.Has('a') {
		t.Errorf("an escaped dot must not match a")
	}
}

func TestInvalidPatterns(t *testing.T) {
	cases := []struct {
		pattern string
		offset  int
		message string
	}{
		{"*a", 0, "nothing to repeat before '*'"},
		{"a|+", 2, "nothing to repeat before '+'"},
		{"(?a)", 1, "nothing to repeat before '?'"},
		{"(ab", 3, "missing ')'"},
		{"a(b(c)", 6, "missing ')'"},
		{"ab)", 2, "unexpected ')'"},
		{")", 0, "unexpected ')'"},
		{"[abc", 0, "missing ']'"},
		{"a[", 1, "missing ']'"},
		{"[]", 0, "empty class"},
		{"[^]", 0, "empty class"},
		{"[z-a]", 4, "range 'z-a' is out of order"},
		{"ab\\", 3, "nothing to escape after '\\'"},
	}
	for _, c := range cases {
		_, err := Parse(c.pattern)
		var syntax *SyntaxError
		if !errors.As(err, &syntax) {
			t.Errorf("Parse(%q): want a *SyntaxError, got %v", c.pattern, err)
			continue
		}
		if syntax.Offset != c.offset || syntax.Message != c.message {
			t.Errorf("Parse(%q) = offset %d, %q; want offset %d, %q",
				c.pattern, syntax.Offset, syntax.Message, c.offset, c.message)
		}
	}
	if _, err := New("(a"); err == nil {
		t.Errorf("New must reject an invalid pattern")
	}
}
