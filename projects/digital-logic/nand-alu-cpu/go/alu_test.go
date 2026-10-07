package nandcpu

import "testing"

type aluResult struct {
	result   int
	zero     Bit
	negative Bit
	carry    Bit
	overflow Bit
}

func signed(value int) int {
	if value >= 8 {
		return value - 16
	}
	return value
}

func flag(condition bool) Bit {
	if condition {
		return 1
	}
	return 0
}

// EN: The reference model: what each operation must produce, written with ordinary arithmetic
// and no gates. The ALU made of NANDs is compared with it.
// PT: O modelo de referência: o que cada operação precisa produzir, escrito com aritmética
// comum e sem portas. A ALU feita de NANDs é comparada com ele.
func reference(x, y, operation int) aluResult {
	var want aluResult
	switch operation {
	case OpAdd:
		want.result = (x + y) % 16
		want.carry = flag(x+y > 15)
		exact := signed(x) + signed(y)
		want.overflow = flag(exact < -8 || exact > 7)
	case OpSub:
		want.result = (x - y + 16) % 16
		// Carry after a subtraction means "no borrow".
		want.carry = flag(x >= y)
		exact := signed(x) - signed(y)
		want.overflow = flag(exact < -8 || exact > 7)
	case OpAnd:
		want.result = x & y
	default:
		want.result = x | y
	}
	want.zero = flag(want.result == 0)
	want.negative = Bit(want.result >> 3)
	return want
}

func runALU(x, y, operation int) aluResult {
	result, flags := ALU(NibbleOf(x), NibbleOf(y), Bit(operation>>1), Bit(operation&1))
	return aluResult{result.Value(), flags.Zero, flags.Negative, flags.Carry, flags.Overflow}
}

// EN: Acceptance criterion MP-DL-2.2: exhaustive test over all 4-bit inputs and operations,
// 16 x 16 x 4 = 1,024 cases, result and the four flags.
// PT: Critério de aceite MP-DL-2.2: teste exaustivo sobre todas as entradas de 4 bits e
// operações, 16 x 16 x 4 = 1.024 casos, resultado e as quatro flags.
func TestALUForAll1024Combinations(t *testing.T) {
	checked := 0
	for _, operation := range []int{OpAdd, OpSub, OpAnd, OpOr} {
		for x := 0; x < 16; x++ {
			for y := 0; y < 16; y++ {
				if got, want := runALU(x, y, operation), reference(x, y, operation); got != want {
					t.Errorf("x=%d y=%d op=%02b: got %+v, want %+v", x, y, operation, got, want)
				}
				checked++
			}
		}
	}
	if checked != 1024 {
		t.Fatalf("checked %d cases, want 1024", checked)
	}
}

func TestALUCasesOfTheQuiz(t *testing.T) {
	cases := []struct {
		name      string
		x, y, op  int
		want      aluResult
		wantNoted string
	}{
		{"5 - 3", 0b0101, 0b0011, OpSub, aluResult{0b0010, 0, 0, 1, 0}, "carry-out 1 means no borrow"},
		{"3 - 5", 3, 5, OpSub, aluResult{0b1110, 0, 1, 0, 0}, "no carry-out means a borrow"},
		{"7 + 1", 0b0111, 0b0001, OpAdd, aluResult{0b1000, 0, 1, 0, 1}, "overflow without carry-out"},
		{"-1 + 1", 0b1111, 0b0001, OpAdd, aluResult{0, 1, 0, 1, 0}, "carry-out without overflow"},
	}
	for _, item := range cases {
		if got := runALU(item.x, item.y, item.op); got != item.want {
			t.Errorf("%s (%s): got %+v, want %+v", item.name, item.wantNoted, got, item.want)
		}
	}
}

func TestIncrementWrapsAround(t *testing.T) {
	for value := 0; value < 16; value++ {
		if got := Increment(NibbleOf(value)).Value(); got != (value+1)%16 {
			t.Errorf("Increment(%d) = %d", value, got)
		}
	}
}

func TestFullAdderCountsTheOnes(t *testing.T) {
	for _, a := range bits {
		for _, b := range bits {
			for _, carryIn := range bits {
				sum, carry := FullAdder(a, b, carryIn)
				if int(2*carry+sum) != int(a+b+carryIn) {
					t.Errorf("FullAdder(%d, %d, %d) = sum %d carry %d", a, b, carryIn, sum, carry)
				}
			}
		}
	}
}
