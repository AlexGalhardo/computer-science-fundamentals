// Package nandcpu builds a 4-bit computer from a single primitive, the NAND gate.
//
// EN: This is the Go version of the nand-alu-cpu mini-project. It follows the same design as
// the TypeScript reference, with one difference that Go makes natural: a word is a fixed-size
// array (Nibble is [4]Bit), so a wire bundle of the wrong width is a compile error instead of
// a run-time check. Both versions must print the same trace, byte for byte.
//
// PT: Esta é a versão em Go do mini-projeto nand-alu-cpu. Ela segue o mesmo projeto da
// referência em TypeScript, com uma diferença que o Go torna natural: uma palavra é um array
// de tamanho fixo (Nibble é [4]Bit), então um feixe de fios com a largura errada é um erro de
// compilação, e não uma verificação em tempo de execução. As duas versões precisam imprimir o
// mesmo trace, byte a byte.
package nandcpu

// Bit is the value on one wire: 0 or 1.
type Bit uint8

// Nibble is a 4-bit word, least significant bit first: index i has weight 2^i.
type Nibble [4]Bit

var nandEvaluations int

// Nand is the one and only primitive: it is 0 only when both inputs are 1.
//
// EN: NAND is a universal gate. Every other function of this package, from Not up to the CPU,
// is a wiring of calls to Nand. The counter shows how many gate evaluations a job took. It is
// a plain package variable, so the simulator is meant to run on a single goroutine.
//
// PT: A NAND é uma porta universal. Todas as outras funções deste pacote, do Not até a CPU, são
// ligações de chamadas a Nand. O contador mostra quantas avaliações de porta um trabalho
// consumiu. Ele é uma variável comum do pacote, então o simulador roda em uma única goroutine.
func Nand(a, b Bit) Bit {
	nandEvaluations++
	if a == 1 && b == 1 {
		return 0
	}
	return 1
}

// NandCount returns how many times Nand ran since the last reset.
func NandCount() int {
	return nandEvaluations
}

// ResetNandCount sets the evaluation counter back to zero.
func ResetNandCount() {
	nandEvaluations = 0
}

// Not is a NAND with both inputs tied together: (A·A)' = A'. 1 NAND.
func Not(a Bit) Bit {
	return Nand(a, a)
}

// And is a NAND followed by an inverter, which cancels the inversion. 2 NANDs.
func And(a, b Bit) Bit {
	return Not(Nand(a, b))
}

// Or comes from De Morgan: A + B = (A'·B')', a NAND of the inverted inputs. 3 NANDs.
func Or(a, b Bit) Bit {
	return Nand(Not(a), Not(b))
}

// Nor is an OR followed by an inverter. 4 NANDs.
func Nor(a, b Bit) Bit {
	return Not(Or(a, b))
}

// Xor is 1 when the inputs differ. 4 NANDs, the minimum.
//
// EN: The trick is to share M = (A·B)': NAND(A, M) is (A·B')', NAND(B, M) is (A'·B)', and the
// last NAND joins the two: A·B' + A'·B.
//
// PT: O truque é compartilhar M = (A·B)': NAND(A, M) é (A·B')', NAND(B, M) é (A'·B)', e a
// última NAND junta os dois: A·B' + A'·B.
func Xor(a, b Bit) Bit {
	shared := Nand(a, b)
	return Nand(Nand(a, shared), Nand(b, shared))
}

// Xnor is XOR followed by an inverter: 1 when the inputs are equal. 5 NANDs.
func Xnor(a, b Bit) Bit {
	return Not(Xor(a, b))
}

// Mux is the 2-to-1 multiplexer: the select line chooses which input reaches the output.
//
// EN: Y = S'·whenZero + S·whenOne. With NANDs, the OR of two ANDs is NAND(NAND, NAND). 4 NANDs.
//
// PT: Y = S'·whenZero + S·whenOne. Com NANDs, a OR de duas ANDs é NAND(NAND, NAND). 4 NANDs.
func Mux(sel, whenZero, whenOne Bit) Bit {
	return Nand(Nand(Not(sel), whenZero), Nand(sel, whenOne))
}

// MuxNibble is one 2-to-1 multiplexer per bit: it chooses between two whole words.
func MuxNibble(sel Bit, whenZero, whenOne Nibble) Nibble {
	var out Nibble
	for i := range out {
		out[i] = Mux(sel, whenZero[i], whenOne[i])
	}
	return out
}

// Mux16 returns the word at the selected address, out of 16.
//
// EN: A multiplexer with 4 select lines is a tree of 2-to-1 multiplexers: the least significant
// select bit chooses inside each pair, the next bit chooses between pairs, and so on. This is
// how the CPU reads one memory cell out of 16.
//
// PT: Um multiplexador com 4 linhas de seleção é uma árvore de multiplexadores 2 para 1: o bit
// de seleção menos significativo escolhe dentro de cada par, o seguinte escolhe entre os pares,
// e assim por diante. É assim que a CPU lê uma célula de memória entre 16.
func Mux16(sel Nibble, inputs *[16]Nibble) Nibble {
	level := inputs[:]
	for _, selectBit := range sel {
		next := make([]Nibble, 0, len(level)/2)
		for i := 0; i < len(level); i += 2 {
			next = append(next, MuxNibble(selectBit, level[i], level[i+1]))
		}
		level = next
	}
	return level[0]
}

// Decoder16 turns a 4-bit code into 16 lines and activates only the line numbered by the code.
//
// EN: Each line is the AND of every code bit, plain or inverted: a minterm. The enable input
// turns all lines off, which makes the same circuit a demultiplexer.
//
// PT: Cada linha é a AND de todos os bits do código, diretos ou invertidos: um mintermo. A
// entrada de habilitação desliga todas as linhas, o que faz do mesmo circuito um
// demultiplexador.
func Decoder16(code Nibble, enable Bit) [16]Bit {
	var inverted Nibble
	for i, bit := range code {
		inverted[i] = Not(bit)
	}
	var lines [16]Bit
	for line := range lines {
		active := enable
		for i := range code {
			if (line>>i)&1 == 1 {
				active = And(active, code[i])
			} else {
				active = And(active, inverted[i])
			}
		}
		lines[line] = active
	}
	return lines
}

// OrAll is the OR of any number of signals, chained two at a time.
func OrAll(signals ...Bit) Bit {
	var result Bit
	for _, signal := range signals {
		result = Or(result, signal)
	}
	return result
}

// NibbleOf returns the 4 low bits of value as a word.
func NibbleOf(value int) Nibble {
	var out Nibble
	for i := range out {
		out[i] = Bit((value >> i) & 1)
	}
	return out
}

// Value returns the unsigned integer represented by the word.
func (n Nibble) Value() int {
	total := 0
	for i, bit := range n {
		total += int(bit) << i
	}
	return total
}
