package nandcpu

// FullAdder adds three bits and returns the sum bit and the carry. 9 NANDs.
//
// EN: It is two XORs in a row (sum = A xor B xor Cin) that expose their shared inner NANDs:
// those two signals are exactly (A·B)' and (Cin·(A xor B))', and one more NAND turns them into
// the carry A·B + Cin·(A xor B).
//
// PT: São duas XORs em sequência (soma = A xor B xor Cin) que expõem as suas NANDs internas
// compartilhadas: esses dois sinais são exatamente (A·B)' e (Cin·(A xor B))', e mais uma NAND
// os transforma no vai-um A·B + Cin·(A xor B).
// ES: Son dos XOR en secuencia (suma = A xor B xor Cin) que exponen sus NAND internas
// compartidas: esas dos señales son exactamente (A·B)' y (Cin·(A xor B))', y una NAND más las
// transforma en el acarreo A·B + Cin·(A xor B).
func FullAdder(a, b, carryIn Bit) (sum, carry Bit) {
	sharedAB := Nand(a, b)
	partial := Nand(Nand(a, sharedAB), Nand(b, sharedAB))
	sharedCarry := Nand(partial, carryIn)
	sum = Nand(Nand(partial, sharedCarry), Nand(carryIn, sharedCarry))
	return sum, Nand(sharedAB, sharedCarry)
}

// Operation codes of the ALU, as the two control wires op1 op0.
const (
	OpAdd = 0b00
	OpSub = 0b01
	OpAnd = 0b10
	OpOr  = 0b11
)

// Flags are the four status bits the ALU produces next to its result.
type Flags struct {
	// Zero is 1 when every bit of the result is 0.
	Zero Bit
	// Negative is the most significant bit of the result, the sign in two's complement.
	Negative Bit
	// Carry is the carry out of the adder. After a subtraction, 1 means "no borrow".
	Carry Bit
	// Overflow is 1 when the result does not fit in 4 signed bits.
	Overflow Bit
}

// ALU computes x op y for the operation selected by the control wires op1 and op0.
//
// EN: The ALU computes every operation at once and a multiplexer picks one result, which is how
// hardware works: there is no "if", only wires that are selected or ignored.
//   - Subtraction reuses the adder: X - Y = X + Y' + 1. The XOR gates invert Y when subtract is
//     1 (XOR with 1 inverts, XOR with 0 passes) and the same wire is the carry-in, the +1.
//   - Overflow is the carry into the sign bit differing from the carry out of it.
//   - Carry and overflow only make sense for ADD and SUB, so they are forced to 0 for AND, OR.
//
// PT: A ALU calcula todas as operações ao mesmo tempo e um multiplexador escolhe um resultado,
// que é como o hardware funciona: não existe "if", só fios que são selecionados ou ignorados.
//   - A subtração reaproveita o somador: X - Y = X + Y' + 1. As portas XOR invertem Y quando
//     subtract vale 1 (XOR com 1 inverte, XOR com 0 deixa passar) e o mesmo fio é o vai-um de
//     entrada, o +1.
//   - O estouro (overflow) é o vai-um que entra no bit de sinal ser diferente do que sai dele.
//   - Vai-um e estouro só fazem sentido em ADD e SUB, então são forçados a 0 em AND e OR.
//
// ES: La ALU calcula todas las operaciones al mismo tiempo y un multiplexor elige un resultado,
// que es como funciona el hardware: no existe el "if", solo cables que se seleccionan o se
// ignoran.
//   - La resta reutiliza el sumador: X - Y = X + Y' + 1. Las compuertas XOR invierten Y cuando
//     subtract vale 1 (XOR con 1 invierte, XOR con 0 deja pasar) y el mismo cable es el
//     acarreo de entrada, el +1.
//   - El desbordamiento (overflow) es que el acarreo que entra al bit de signo sea distinto del
//     que sale de él.
//   - Acarreo y desbordamiento solo tienen sentido en ADD y SUB, así que se fuerzan a 0 en AND
//     y OR.
func ALU(x, y Nibble, op1, op0 Bit) (Nibble, Flags) {
	arithmetic := Not(op1)
	subtract := And(arithmetic, op0)

	var sum Nibble
	carry := subtract
	var carryIntoSign Bit
	for i := range sum {
		if i == len(sum)-1 {
			carryIntoSign = carry
		}
		sum[i], carry = FullAdder(x[i], Xor(y[i], subtract), carry)
	}

	var result Nibble
	for i := range result {
		logic := Mux(op0, And(x[i], y[i]), Or(x[i], y[i]))
		result[i] = Mux(op1, sum[i], logic)
	}

	var anyBitSet Bit
	for _, bit := range result {
		anyBitSet = Or(anyBitSet, bit)
	}
	return result, Flags{
		Zero:     Not(anyBitSet),
		Negative: result[len(result)-1],
		Carry:    And(arithmetic, carry),
		Overflow: And(arithmetic, Xor(carryIntoSign, carry)),
	}
}

// Increment adds one to a word with a chain of half adders: the program counter's "+1".
func Increment(word Nibble) Nibble {
	var result Nibble
	carry := Bit(1)
	for i, bit := range word {
		result[i] = Xor(bit, carry)
		carry = And(bit, carry)
	}
	return result
}
