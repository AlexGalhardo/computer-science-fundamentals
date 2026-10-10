package nandcpu

import "testing"

var bits = []Bit{0, 1}

func column(gate func(a, b Bit) Bit) string {
	text := ""
	for _, a := range bits {
		for _, b := range bits {
			text += string(rune('0' + gate(a, b)))
		}
	}
	return text
}

func cost(run func()) int {
	ResetNandCount()
	run()
	return NandCount()
}

// EN: Acceptance criterion MP-DL-2.1: every derived gate matches its truth table. The expected
// columns are the textbook ones, for inputs 00, 01, 10, 11.
// PT: Critério de aceite MP-DL-2.1: toda porta derivada coincide com a sua tabela-verdade. As
// colunas esperadas são as dos livros, para as entradas 00, 01, 10, 11.
// ES: Criterio de aceptación MP-DL-2.1: toda compuerta derivada coincide con su tabla de
// verdad. Las columnas esperadas son las de los libros, para las entradas 00, 01, 10, 11.
func TestDerivedGatesMatchTheirTruthTables(t *testing.T) {
	gates := []struct {
		name string
		gate func(a, b Bit) Bit
		want string
	}{
		{"NAND", Nand, "1110"},
		{"AND", And, "0001"},
		{"OR", Or, "0111"},
		{"NOR", Nor, "1000"},
		{"XOR", Xor, "0110"},
		{"XNOR", Xnor, "1001"},
	}
	for _, item := range gates {
		if got := column(item.gate); got != item.want {
			t.Errorf("%s: got %s, want %s", item.name, got, item.want)
		}
	}
	if Not(0) != 1 || Not(1) != 0 {
		t.Errorf("NOT: got %d %d, want 1 0", Not(0), Not(1))
	}
}

func TestMuxOutputsTheSelectedInput(t *testing.T) {
	for _, sel := range bits {
		for _, whenZero := range bits {
			for _, whenOne := range bits {
				want := whenZero
				if sel == 1 {
					want = whenOne
				}
				if got := Mux(sel, whenZero, whenOne); got != want {
					t.Errorf("Mux(%d, %d, %d) = %d, want %d", sel, whenZero, whenOne, got, want)
				}
			}
		}
	}
}

func TestEachGateUsesTheKnownNumberOfNands(t *testing.T) {
	costs := []struct {
		name string
		run  func()
		want int
	}{
		{"NOT", func() { Not(1) }, 1},
		{"AND", func() { And(1, 1) }, 2},
		{"OR", func() { Or(1, 1) }, 3},
		{"NOR", func() { Nor(1, 1) }, 4},
		{"XOR", func() { Xor(1, 1) }, 4},
		{"XNOR", func() { Xnor(1, 1) }, 5},
		{"MUX", func() { Mux(1, 0, 1) }, 4},
		{"full adder", func() { FullAdder(1, 1, 1) }, 9},
	}
	for _, item := range costs {
		if got := cost(item.run); got != item.want {
			t.Errorf("%s: %d NANDs, want %d", item.name, got, item.want)
		}
	}
}

func TestMux16AndDecoder16(t *testing.T) {
	var inputs [16]Nibble
	for i := range inputs {
		inputs[i] = NibbleOf((i*7 + 3) % 16)
	}
	for address := 0; address < 16; address++ {
		if got := Mux16(NibbleOf(address), &inputs).Value(); got != (address*7+3)%16 {
			t.Errorf("Mux16 at %d = %d", address, got)
		}
		lines := Decoder16(NibbleOf(address), 1)
		for line, active := range lines {
			if (active == 1) != (line == address) {
				t.Errorf("Decoder16(%d): line %d is %d", address, line, active)
			}
		}
		if Decoder16(NibbleOf(address), 0) != [16]Bit{} {
			t.Errorf("Decoder16(%d) with enable 0 has an active line", address)
		}
	}
}

func TestOrAll(t *testing.T) {
	if OrAll() != 0 || OrAll(0, 0, 0) != 0 || OrAll(0, 1, 0) != 1 {
		t.Error("OrAll must be 1 exactly when some signal is 1")
	}
}
