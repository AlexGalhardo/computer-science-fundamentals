import { and, type Bit, mux, nand, not, or, type Word, xor } from "./nand";

export const WIDTH = 4;

// EN: Full adder in 9 NANDs. It is two XORs in a row (sum = A xor B xor Cin) that expose their
//     shared inner NANDs: those two signals are exactly (A·B)' and (Cin·(A xor B))', and one
//     more NAND turns them into the carry A·B + Cin·(A xor B).
// PT: Somador completo em 9 NANDs. São duas XORs em sequência (soma = A xor B xor Cin) que
//     expõem as suas NANDs internas compartilhadas: esses dois sinais são exatamente (A·B)' e
//     (Cin·(A xor B))', e mais uma NAND os transforma no vai-um A·B + Cin·(A xor B).
// ES: Sumador completo en 9 NAND. Son dos XOR en secuencia (suma = A xor B xor Cin) que
//     exponen sus NAND internas compartidas: esas dos señales son exactamente (A·B)' y
//     (Cin·(A xor B))', y una NAND más las transforma en el acarreo A·B + Cin·(A xor B).
export function fullAdder(a: Bit, b: Bit, carryIn: Bit): { sum: Bit; carry: Bit } {
	const sharedAB = nand(a, b);
	const partial = nand(nand(a, sharedAB), nand(b, sharedAB));
	const sharedCarry = nand(partial, carryIn);
	const sum = nand(nand(partial, sharedCarry), nand(carryIn, sharedCarry));
	return { sum, carry: nand(sharedAB, sharedCarry) };
}

// EN: The four operations, chosen by two control wires (op1 op0).
// PT: As quatro operações, escolhidas por dois fios de controle (op1 op0).
// ES: Las cuatro operaciones, elegidas por dos cables de control (op1 op0).
export const ALU_OPERATIONS = { ADD: 0b00, SUB: 0b01, AND: 0b10, OR: 0b11 } as const;
export type AluOperation = keyof typeof ALU_OPERATIONS;

export interface AluFlags {
	/** Z: every bit of the result is 0. */
	zero: Bit;
	/** N: the most significant bit of the result, the sign in two's complement. */
	negative: Bit;
	/** C: carry out of the adder. After a subtraction, 1 means "no borrow" (X >= Y unsigned). */
	carry: Bit;
	/** V: the result does not fit in 4 signed bits. */
	overflow: Bit;
}

export interface AluOutput {
	result: Word;
	flags: AluFlags;
}

// EN: The ALU computes every operation at once and a multiplexer picks one result, which is how
//     hardware works: there is no "if", only wires that are selected or ignored.
//     - Subtraction reuses the adder: X - Y = X + Y' + 1. The XOR gates invert Y when `subtract`
//       is 1 (XOR with 1 inverts, XOR with 0 passes) and the same wire is the carry-in, the +1.
//     - Overflow is the carry into the sign bit differing from the carry out of it.
//     - Carry and overflow only make sense for ADD and SUB, so they are forced to 0 for AND, OR.
// PT: A ALU calcula todas as operações ao mesmo tempo e um multiplexador escolhe um resultado,
//     que é como o hardware funciona: não existe "if", só fios que são selecionados ou ignorados.
//     - A subtração reaproveita o somador: X - Y = X + Y' + 1. As portas XOR invertem Y quando
//       `subtract` vale 1 (XOR com 1 inverte, XOR com 0 deixa passar) e o mesmo fio é o vai-um
//       de entrada, o +1.
//     - O estouro (overflow) é o vai-um que entra no bit de sinal ser diferente do que sai dele.
//     - Vai-um e estouro só fazem sentido em ADD e SUB, então são forçados a 0 em AND e OR.
// ES: La ALU calcula todas las operaciones al mismo tiempo y un multiplexor elige un resultado,
//     que es como funciona el hardware: no existe el "if", solo cables que se seleccionan o se
//     ignoran.
//     - La resta reutiliza el sumador: X - Y = X + Y' + 1. Las compuertas XOR invierten Y cuando
//       `subtract` vale 1 (XOR con 1 invierte, XOR con 0 deja pasar) y el mismo cable es el
//       acarreo de entrada, el +1.
//     - El desbordamiento (overflow) es que el acarreo que entra al bit de signo sea distinto
//       del que sale de él.
//     - Acarreo y desbordamiento solo tienen sentido en ADD y SUB, así que se fuerzan a 0 en
//       AND y OR.
export function alu(x: Word, y: Word, op1: Bit, op0: Bit): AluOutput {
	const arithmetic = not(op1);
	const subtract = and(arithmetic, op0);

	const sum: Word = [];
	let carry = subtract;
	let carryIntoSign: Bit = 0;
	for (let index = 0; index < WIDTH; index++) {
		if (index === WIDTH - 1) {
			carryIntoSign = carry;
		}
		const stage = fullAdder(x[index] ?? 0, xor(y[index] ?? 0, subtract), carry);
		sum.push(stage.sum);
		carry = stage.carry;
	}

	const result: Word = [];
	for (let index = 0; index < WIDTH; index++) {
		const xBit = x[index] ?? 0;
		const yBit = y[index] ?? 0;
		const logic = mux(op0, and(xBit, yBit), or(xBit, yBit));
		result.push(mux(op1, sum[index] ?? 0, logic));
	}

	const anyBitSet = result.reduce<Bit>((accumulated, bit) => or(accumulated, bit), 0);
	return {
		result,
		flags: {
			zero: not(anyBitSet),
			negative: result[WIDTH - 1] ?? 0,
			carry: and(arithmetic, carry),
			overflow: and(arithmetic, xor(carryIntoSign, carry)),
		},
	};
}

/** Adds one to a word with a chain of half adders: the program counter's "+1". */
export function increment(word: Word): Word {
	const result: Word = [];
	let carry: Bit = 1;
	for (const bit of word) {
		result.push(xor(bit, carry));
		carry = and(bit, carry);
	}
	return result;
}
