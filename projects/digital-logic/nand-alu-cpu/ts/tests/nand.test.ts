import { describe, expect, test } from "bun:test";
import { fullAdder } from "../src/alu";
import {
	and,
	type Bit,
	decoder,
	fromWord,
	mux,
	muxTree,
	nand,
	nandCount,
	nor,
	not,
	or,
	orAll,
	resetNandCount,
	toWord,
	xnor,
	xor,
} from "../src/nand";

const BITS: Bit[] = [0, 1];
const column = (gate: (a: Bit, b: Bit) => Bit): string => BITS.flatMap((a) => BITS.map((b) => gate(a, b))).join("");

function cost(run: () => void): number {
	resetNandCount();
	run();
	return nandCount();
}

// EN: Acceptance criterion MP-DL-2.1: every derived gate matches its truth table. The expected
//     columns are the textbook ones, for inputs 00, 01, 10, 11.
// PT: Critério de aceite MP-DL-2.1: toda porta derivada coincide com a sua tabela-verdade. As
//     colunas esperadas são as dos livros, para as entradas 00, 01, 10, 11.
// ES: Criterio de aceptación MP-DL-2.1: toda compuerta derivada coincide con su tabla de
//     verdad. Las columnas esperadas son las de los libros, para las entradas 00, 01, 10, 11.
describe("gates derived from NAND", () => {
	test("NAND itself", () => {
		expect(column(nand)).toBe("1110");
	});

	test("NOT, AND, OR, NOR, XOR and XNOR match their truth tables", () => {
		expect([not(0), not(1)]).toEqual([1, 0]);
		expect(column(and)).toBe("0001");
		expect(column(or)).toBe("0111");
		expect(column(nor)).toBe("1000");
		expect(column(xor)).toBe("0110");
		expect(column(xnor)).toBe("1001");
	});

	test("the multiplexer outputs the selected input", () => {
		for (const select of BITS) {
			for (const whenZero of BITS) {
				for (const whenOne of BITS) {
					expect(mux(select, whenZero, whenOne)).toBe(select === 1 ? whenOne : whenZero);
				}
			}
		}
	});

	test("each gate uses the known number of NANDs", () => {
		expect(cost(() => not(1))).toBe(1);
		expect(cost(() => and(1, 1))).toBe(2);
		expect(cost(() => or(1, 1))).toBe(3);
		expect(cost(() => nor(1, 1))).toBe(4);
		expect(cost(() => xor(1, 1))).toBe(4);
		expect(cost(() => xnor(1, 1))).toBe(5);
		expect(cost(() => mux(1, 0, 1))).toBe(4);
		expect(cost(() => fullAdder(1, 1, 1))).toBe(9);
	});

	test("the full adder outputs spell the number of inputs at 1", () => {
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

describe("multiplexer tree and decoder", () => {
	test("a 16-to-1 tree returns the word at the selected address", () => {
		const inputs = Array.from({ length: 16 }, (_, index) => toWord((index * 7 + 3) % 16, 4));
		for (let address = 0; address < 16; address++) {
			expect(fromWord(muxTree(toWord(address, 4), inputs))).toBe((address * 7 + 3) % 16);
		}
		expect(() => muxTree(toWord(0, 2), inputs)).toThrow(RangeError);
	});

	test("the decoder activates exactly the line of its code", () => {
		for (let code = 0; code < 16; code++) {
			const lines = decoder(toWord(code, 4));
			expect(lines.map((line, index) => (line === 1 ? index : -1)).filter((index) => index >= 0)).toEqual([code]);
		}
	});

	test("with enable at 0 no line is active", () => {
		expect(decoder(toWord(5, 4), 0)).toEqual(new Array<Bit>(16).fill(0));
	});

	test("orAll is 1 when any signal is 1", () => {
		expect(orAll(0, 0, 0)).toBe(0);
		expect(orAll(0, 1, 0)).toBe(1);
		expect(orAll()).toBe(0);
	});

	test("words reject values that do not fit", () => {
		expect(() => toWord(16, 4)).toThrow(RangeError);
		expect(fromWord(toWord(11, 4))).toBe(11);
	});
});
