// Package regex is a small regular expression engine built the textbook way: a pattern is parsed
// into a tree, the tree becomes a nondeterministic automaton (Thompson construction), and that
// automaton becomes a deterministic one (subset construction).
//
// EN: The engine works on bytes and matches the WHOLE input (as if the pattern were anchored at
// both ends). Supported: literals, `.`, classes such as `[a-z0-9]` and `[^x]`, grouping with
// parentheses, alternation `|`, and the repetitions `*`, `+` and `?`. A backslash makes the next
// character a literal.
//
// PT: O motor trabalha com bytes e casa a entrada INTEIRA (como se o padrão estivesse ancorado
// nas duas pontas). Suporta: literais, `.`, classes como `[a-z0-9]` e `[^x]`, agrupamento com
// parênteses, alternância `|`, e as repetições `*`, `+` e `?`. Uma barra invertida torna literal
// o caractere seguinte.
//
// ES: El motor trabaja con bytes y empareja la entrada COMPLETA (como si el patrón estuviera
// anclado en ambos extremos). Soporta: literales, `.`, clases como `[a-z0-9]` y `[^x]`,
// agrupación con paréntesis, alternancia `|`, y las repeticiones `*`, `+` y `?`. Una barra
// invertida vuelve literal el carácter siguiente.
package regex

import (
	"fmt"
	"strings"
)

// Kind is the kind of a node of the pattern tree.
type Kind int

// The kinds of node. Every pattern is built from these seven.
const (
	// Empty matches the empty string.
	Empty Kind = iota
	// Class matches one byte that belongs to a set. A literal is a class with a single byte.
	Class
	// Concat matches Left and then Right.
	Concat
	// Alternate matches Left or Right.
	Alternate
	// Star matches Left zero or more times.
	Star
	// Plus matches Left one or more times.
	Plus
	// Optional matches Left zero or one time.
	Optional
)

// ByteSet is a set of bytes, one bit per possible byte value.
type ByteSet [4]uint64

// Add puts b in the set.
func (s *ByteSet) Add(b byte) { s[b/64] |= 1 << (b % 64) }

// Has reports whether b is in the set.
func (s *ByteSet) Has(b byte) bool { return s[b/64]&(1<<(b%64)) != 0 }

// Node is a node of the pattern tree. Set is used by Class, Left by every operator and Right by
// the two binary ones.
type Node struct {
	Kind  Kind
	Set   ByteSet
	Left  *Node
	Right *Node
}

// SyntaxError is an invalid pattern, with the byte offset where the problem was found.
type SyntaxError struct {
	Offset  int
	Message string
}

func (e *SyntaxError) Error() string {
	return fmt.Sprintf("invalid pattern at offset %d: %s", e.Offset, e.Message)
}

// EN: The grammar of patterns, from the loosest operator to the tightest. Each rule is one method
// of the parser below, and the nesting of the rules IS the precedence: alternation is parsed
// first, so it ends up at the top of the tree and binds the least; repetition is parsed last, so
// it applies only to the single atom on its left. That is why `ab|cd*` means `(ab)|(c(d*))`.
//
//	alternation   = concatenation { "|" concatenation }
//	concatenation = { repetition }
//	repetition    = atom { "*" | "+" | "?" }
//	atom          = literal | "." | class | "(" alternation ")"
//
// PT: A gramática dos padrões, do operador mais fraco ao mais forte. Cada regra é um método do
// parser abaixo, e o aninhamento das regras É a precedência: a alternância é analisada primeiro,
// então fica no topo da árvore e liga menos; a repetição é analisada por último, então se aplica
// apenas ao único átomo à sua esquerda. É por isso que `ab|cd*` significa `(ab)|(c(d*))`.
//
// ES: La gramática de los patrones, del operador más débil al más fuerte. Cada regla es un
// método del parser de abajo, y el anidamiento de las reglas ES la precedencia: la alternancia
// se analiza primero, así que queda en lo alto del árbol y enlaza menos; la repetición se
// analiza al final, así que se aplica solo al único átomo a su izquierda. Por eso `ab|cd*`
// significa `(ab)|(c(d*))`.
type parser struct {
	pattern string
	pos     int
}

// Parse turns a pattern into its tree, or returns a *SyntaxError.
func Parse(pattern string) (*Node, error) {
	p := &parser{pattern: pattern}
	node, err := p.alternation()
	if err != nil {
		return nil, err
	}
	if p.pos < len(p.pattern) {
		// The only way to stop early is a `)` that no `(` opened.
		return nil, p.fail("unexpected ')'")
	}
	return node, nil
}

func (p *parser) fail(message string) error {
	return &SyntaxError{Offset: p.pos, Message: message}
}

func (p *parser) more() bool { return p.pos < len(p.pattern) }

func (p *parser) peek() byte { return p.pattern[p.pos] }

func (p *parser) alternation() (*Node, error) {
	left, err := p.concatenation()
	if err != nil {
		return nil, err
	}
	for p.more() && p.peek() == '|' {
		p.pos++
		right, err := p.concatenation()
		if err != nil {
			return nil, err
		}
		left = &Node{Kind: Alternate, Left: left, Right: right}
	}
	return left, nil
}

func (p *parser) concatenation() (*Node, error) {
	// An empty branch, as in `a|` or `()`, matches the empty string.
	result := &Node{Kind: Empty}
	for p.more() && p.peek() != '|' && p.peek() != ')' {
		next, err := p.repetition()
		if err != nil {
			return nil, err
		}
		if result.Kind == Empty {
			result = next
		} else {
			result = &Node{Kind: Concat, Left: result, Right: next}
		}
	}
	return result, nil
}

func (p *parser) repetition() (*Node, error) {
	node, err := p.atom()
	if err != nil {
		return nil, err
	}
	for p.more() {
		var kind Kind
		switch p.peek() {
		case '*':
			kind = Star
		case '+':
			kind = Plus
		case '?':
			kind = Optional
		default:
			return node, nil
		}
		p.pos++
		node = &Node{Kind: kind, Left: node}
	}
	return node, nil
}

func (p *parser) atom() (*Node, error) {
	c := p.peek()
	switch c {
	case '*', '+', '?':
		return nil, p.fail(fmt.Sprintf("nothing to repeat before '%c'", c))
	case '(':
		p.pos++
		inner, err := p.alternation()
		if err != nil {
			return nil, err
		}
		if !p.more() {
			return nil, p.fail("missing ')'")
		}
		p.pos++
		return inner, nil
	case '[':
		return p.class()
	case '.':
		p.pos++
		node := &Node{Kind: Class}
		for b := 0; b < 256; b++ {
			node.Set.Add(byte(b))
		}
		return node, nil
	case '\\':
		p.pos++
		if !p.more() {
			return nil, p.fail("nothing to escape after '\\'")
		}
	}
	node := &Node{Kind: Class}
	node.Set.Add(p.peek())
	p.pos++
	return node, nil
}

// EN: A class lists the accepted bytes one by one or as ranges (`a-z`), and `^` right after the
// bracket inverts it. Inside the brackets only `]`, `\` and a `-` between two bytes are special.
// PT: Uma classe lista os bytes aceitos um a um ou em intervalos (`a-z`), e `^` logo após o
// colchete a inverte. Dentro dos colchetes só `]`, `\` e um `-` entre dois bytes são especiais.
// ES: Una clase lista los bytes aceptados uno a uno o en rangos (`a-z`), y `^` justo después del
// corchete la invierte. Dentro de los corchetes solo `]`, `\` y un `-` entre dos bytes son
// especiales.
func (p *parser) class() (*Node, error) {
	start := p.pos
	p.pos++
	negated := p.more() && p.peek() == '^'
	if negated {
		p.pos++
	}
	var set ByteSet
	items := 0
	for {
		if !p.more() {
			p.pos = start
			return nil, p.fail("missing ']'")
		}
		if p.peek() == ']' {
			p.pos++
			break
		}
		low, err := p.classByte()
		if err != nil {
			return nil, err
		}
		high := low
		if p.pos+1 < len(p.pattern) && p.peek() == '-' && p.pattern[p.pos+1] != ']' {
			p.pos++
			if high, err = p.classByte(); err != nil {
				return nil, err
			}
			if high < low {
				return nil, p.fail(fmt.Sprintf("range '%c-%c' is out of order", low, high))
			}
		}
		for b := int(low); b <= int(high); b++ {
			set.Add(byte(b))
		}
		items++
	}
	if items == 0 {
		p.pos = start
		return nil, p.fail("empty class")
	}
	if negated {
		for i := range set {
			set[i] = ^set[i]
		}
	}
	return &Node{Kind: Class, Set: set}, nil
}

func (p *parser) classByte() (byte, error) {
	if p.peek() == '\\' {
		p.pos++
		if !p.more() {
			return 0, p.fail("nothing to escape after '\\'")
		}
	}
	b := p.peek()
	p.pos++
	return b, nil
}

// String prints the tree in prefix form, for example `(alt (cat a b) (star c))`. Tests use it to
// check which operator ended up above which.
func (n *Node) String() string {
	switch n.Kind {
	case Empty:
		return "empty"
	case Class:
		return n.Set.String()
	case Concat:
		return fmt.Sprintf("(cat %s %s)", n.Left, n.Right)
	case Alternate:
		return fmt.Sprintf("(alt %s %s)", n.Left, n.Right)
	case Star:
		return fmt.Sprintf("(star %s)", n.Left)
	case Plus:
		return fmt.Sprintf("(plus %s)", n.Left)
	default:
		return fmt.Sprintf("(opt %s)", n.Left)
	}
}

// String prints the set the way it would be written in a pattern: a single byte as itself, every
// byte as `.`, anything else as a class with ranges.
func (s ByteSet) String() string {
	var members []int
	for b := 0; b < 256; b++ {
		if s.Has(byte(b)) {
			members = append(members, b)
		}
	}
	switch len(members) {
	case 1:
		return printable(byte(members[0]))
	case 256:
		return "."
	}
	var out strings.Builder
	out.WriteByte('[')
	for i := 0; i < len(members); {
		j := i
		for j+1 < len(members) && members[j+1] == members[j]+1 {
			j++
		}
		out.WriteString(printable(byte(members[i])))
		if j > i {
			out.WriteByte('-')
			out.WriteString(printable(byte(members[j])))
		}
		i = j + 1
	}
	out.WriteByte(']')
	return out.String()
}

func printable(b byte) string {
	if b > 32 && b < 127 {
		return string(rune(b))
	}
	return fmt.Sprintf("\\x%02x", b)
}
