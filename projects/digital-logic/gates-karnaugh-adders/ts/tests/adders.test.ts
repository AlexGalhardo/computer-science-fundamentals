import { describe, expect, test } from "bun:test";
import { addBytes, fromBits, fullAdder, halfAdder, rippleCarryAdder, toBits } from "../src/adders";
import type { Bit } from "../src/gates";

const BITS: Bit[] = [0, 1];

describe("half adder and full adder", () => {
	test("half adder: sum and carry for the four input pairs", () => {
		const rows = BITS.flatMap((a) => BITS.map((b) => `${a}${b}=${halfAdder(a, b).carry}${halfAdder(a, b).sum}`));
		expect(rows).toEqual(["00=00", "01=01", "10=01", "11=10"]);
	});

	test("full adder: the two output bits spell the number of inputs at 1", () => {
		for (const a of BITS) {
			for (const b of BITS) {
				for (const carryIn of BITS) {
					const { sum, carry } = fullAdder(a, b, carryIn);
					expect(2 * carry + sum).toBe(a + b + carryIn);
				}
			}
		}
	});
});

describe("ripple-carry adder", () => {
	// EN: Acceptance criterion MP-DL-1.3: the 8-bit adder built from gates agrees with native
	//     addition for all 256 x 256 = 65,536 input pairs. The carry-out is the ninth bit.
	// PT: Critério de aceite MP-DL-1.3: o somador de 8 bits feito de portas concorda com a soma
	//     nativa para todos os 256 x 256 = 65.536 pares de entrada. O vai-um é o nono bit.
	// ES: Criterio de aceptación MP-DL-1.3: el sumador de 8 bits hecho de compuertas coincide con
	//     la suma nativa para los 256 x 256 = 65.536 pares de entrada. El acarreo es el noveno bit.
	test("8 bits: agrees with native addition for all 65,536 input pairs", () => {
		let checked = 0;
		for (let a = 0; a < 256; a++) {
			for (let b = 0; b < 256; b++) {
				const { sum, carry } = addBytes(a, b);
				if (sum !== (a + b) % 256 || carry !== (a + b > 255 ? 1 : 0)) {
					throw new Error(`${a} + ${b} gave sum ${sum} and carry ${carry}`);
				}
				checked += 1;
			}
		}
		expect(checked).toBe(65536);
	});

	test("the carry-in adds one", () => {
		const result = rippleCarryAdder(toBits(0b0101, 4), toBits(0b1100, 4), 1);
		// 5 + 12 + 1 = 18 = 1 0010: this is 5 - 3 done with the one's complement of 3 plus 1.
		expect(fromBits(result.sum)).toBe(0b0010);
		expect(result.carry).toBe(1);
	});

	test("the carry ripples through every stage in the worst case", () => {
		const result = rippleCarryAdder(toBits(255, 8), toBits(1, 8));
		expect(result.carries).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
		expect(fromBits(result.sum)).toBe(0);
	});

	test("operands of different widths and values out of range are rejected", () => {
		expect(() => rippleCarryAdder([0, 1], [1])).toThrow(RangeError);
		expect(() => toBits(256, 8)).toThrow(RangeError);
		expect(() => toBits(-1, 8)).toThrow(RangeError);
	});
});
