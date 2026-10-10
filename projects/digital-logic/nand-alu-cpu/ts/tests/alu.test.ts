import { describe, expect, test } from "bun:test";
import { ALU_OPERATIONS, type AluOperation, alu, increment } from "../src/alu";
import { type Bit, fromWord, toWord } from "../src/nand";

const signed = (value: number): number => (value >= 8 ? value - 16 : value);

// EN: The reference model: what each operation must produce, written with ordinary arithmetic
//     and no gates. The ALU made of NANDs is compared with it.
// PT: O modelo de referência: o que cada operação precisa produzir, escrito com aritmética
//     comum e sem portas. A ALU feita de NANDs é comparada com ele.
// ES: El modelo de referencia: lo que cada operación debe producir, escrito con aritmética
//     común y sin compuertas. La ALU hecha de NAND se compara con él.
function reference(
	x: number,
	y: number,
	operation: AluOperation,
): { result: number; zero: number; negative: number; carry: number; overflow: number } {
	let result = 0;
	let carry = 0;
	let overflow = 0;
	if (operation === "ADD") {
		result = (x + y) % 16;
		carry = x + y > 15 ? 1 : 0;
		const exact = signed(x) + signed(y);
		overflow = exact < -8 || exact > 7 ? 1 : 0;
	} else if (operation === "SUB") {
		result = (x - y + 16) % 16;
		// Carry after a subtraction means "no borrow".
		carry = x >= y ? 1 : 0;
		const exact = signed(x) - signed(y);
		overflow = exact < -8 || exact > 7 ? 1 : 0;
	} else if (operation === "AND") {
		result = x & y;
	} else {
		result = x | y;
	}
	return { result, zero: result === 0 ? 1 : 0, negative: result >> 3, carry, overflow };
}

function run(x: number, y: number, operation: AluOperation): ReturnType<typeof reference> {
	const code = ALU_OPERATIONS[operation];
	const op1: Bit = code >> 1 === 1 ? 1 : 0;
	const op0: Bit = (code & 1) === 1 ? 1 : 0;
	const output = alu(toWord(x, 4), toWord(y, 4), op1, op0);
	return { result: fromWord(output.result), ...output.flags };
}

describe("ALU", () => {
	// EN: Acceptance criterion MP-DL-2.2: exhaustive test over all 4-bit inputs and operations,
	//     16 x 16 x 4 = 1,024 cases, result and the four flags.
	// PT: Critério de aceite MP-DL-2.2: teste exaustivo sobre todas as entradas de 4 bits e
	//     operações, 16 x 16 x 4 = 1.024 casos, resultado e as quatro flags.
	// ES: Criterio de aceptación MP-DL-2.2: prueba exhaustiva sobre todas las entradas de 4 bits
	//     y operaciones, 16 x 16 x 4 = 1.024 casos, resultado y las cuatro flags.
	test("all 1,024 combinations of x, y and operation", () => {
		let checked = 0;
		for (const operation of Object.keys(ALU_OPERATIONS) as AluOperation[]) {
			for (let x = 0; x < 16; x++) {
				for (let y = 0; y < 16; y++) {
					expect({ x, y, operation, ...run(x, y, operation) }).toEqual({
						x,
						y,
						operation,
						...reference(x, y, operation),
					});
					checked += 1;
				}
			}
		}
		expect(checked).toBe(1024);
	});

	test("the cases of the quiz", () => {
		// 0101 - 0011 = 0010 with carry-out 1 (no borrow).
		expect(run(0b0101, 0b0011, "SUB")).toMatchObject({ result: 0b0010, carry: 1, overflow: 0 });
		// 3 - 5: no carry-out means that a borrow happened, the result is -2.
		expect(run(3, 5, "SUB")).toMatchObject({ result: 0b1110, carry: 0, negative: 1 });
		// 0111 + 0001 overflows: two positives give a negative, and there is no carry-out.
		expect(run(0b0111, 0b0001, "ADD")).toMatchObject({ result: 0b1000, carry: 0, overflow: 1 });
		// 1111 + 0001 has a carry-out but no overflow: -1 + 1 = 0.
		expect(run(0b1111, 0b0001, "ADD")).toMatchObject({ result: 0, carry: 1, overflow: 0, zero: 1 });
	});

	test("increment wraps around after 1111", () => {
		for (let value = 0; value < 16; value++) {
			expect(fromWord(increment(toWord(value, 4)))).toBe((value + 1) % 16);
		}
	});
});
