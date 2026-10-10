import { describe, expect, test } from "bun:test";
import { formatTruthTable, mintermsOf, parse, truthTable, variablesOf } from "../src/expression";
import { and, type Bit, nand, nor, not, or, xnor, xor } from "../src/gates";

// EN: Acceptance criterion MP-DL-1.1. These 20 tables were written by hand, row by row, before
//     the simulator ran. `outputs` is the output column read from row 00...0 to row 11...1, with
//     the first variable as the most significant bit. The generator must reproduce every one.
// PT: Critério de aceite MP-DL-1.1. Estas 20 tabelas foram escritas à mão, linha a linha, antes
//     de o simulador rodar. `outputs` é a coluna de saída lida da linha 00...0 à linha 11...1,
//     com a primeira variável como bit mais significativo. O gerador precisa reproduzir todas.
// ES: Criterio de aceptación MP-DL-1.1. Estas 20 tablas se escribieron a mano, fila por fila,
//     antes de ejecutar el simulador. `outputs` es la columna de salida leída de la fila 00...0
//     a la fila 11...1, con la primera variable como bit más significativo. El generador debe
//     reproducirlas todas.
const HAND_WRITTEN: { expression: string; variables?: string[]; outputs: string }[] = [
	{ expression: "A'", outputs: "10" },
	{ expression: "A·B", outputs: "0001" },
	{ expression: "A + B", outputs: "0111" },
	{ expression: "A ^ B", outputs: "0110" },
	{ expression: "(A·B)'", outputs: "1110" },
	{ expression: "(A + B)'", outputs: "1000" },
	{ expression: "A' + B'", outputs: "1110" },
	{ expression: "A'B + AB'", outputs: "0110" },
	{ expression: "A + A'B", outputs: "0111" },
	{ expression: "A·1 + B·0", outputs: "0011" },
	{ expression: "A·B + C'", outputs: "10101011" },
	{ expression: "AB + BC + AC", outputs: "00010111" },
	{ expression: "A ^ B ^ C", outputs: "01101001" },
	{ expression: "(A + B'·C)'", outputs: "10110000" },
	{ expression: "AB + A'C + BC", outputs: "01010011" },
	{ expression: "(A + B)(B + C')", outputs: "00111011" },
	{ expression: "C' + A·B'", outputs: "10101110" },
	{ expression: "!(A & B) | C", outputs: "11111101" },
	{ expression: "B'D' + BD", variables: ["A", "B", "C", "D"], outputs: "1010010110100101" },
	{ expression: "A ~B + C (D | !A)", outputs: "0011001111110001" },
];

describe("truth tables from expressions", () => {
	test("there are 20 hand-written tables", () => {
		expect(HAND_WRITTEN).toHaveLength(20);
	});

	for (const item of HAND_WRITTEN) {
		test(`${item.expression} matches its hand-written table`, () => {
			const table = truthTable(parse(item.expression), item.variables);
			expect(table.outputs.join("")).toBe(item.outputs);
		});
	}

	// EN: Two expressions are equivalent exactly when their output columns are equal. That turns
	//     every theorem of Boolean algebra into something that can be checked, not just trusted.
	// PT: Duas expressões são equivalentes exatamente quando as suas colunas de saída são iguais.
	//     Isso transforma cada teorema da álgebra booleana em algo que se confere, não só se aceita.
	// ES: Dos expresiones son equivalentes exactamente cuando sus columnas de salida son iguales.
	//     Esto convierte cada teorema del álgebra booleana en algo que se comprueba, no solo se
	//     acepta.
	test("theorems of Boolean algebra hold row by row", () => {
		const column = (text: string): string => truthTable(parse(text), ["A", "B", "C"]).outputs.join("");
		const theorems: [string, string][] = [
			["(A·B)'", "A' + B'"], // De Morgan
			["(A + B)'", "A'·B'"], // De Morgan
			["A + A·B", "A"], // absorption
			["A·(A + B)", "A"], // absorption, dual form
			["A + A'·B", "A + B"],
			["A·(B + C)", "A·B + A·C"], // distributive
			["A + B·C", "(A + B)·(A + C)"], // distributive, dual form
			["A·B + A'·C + B·C", "A·B + A'·C"], // consensus
			["A ^ B", "A'·B + A·B'"],
		];
		for (const [left, right] of theorems) {
			expect(column(left)).toBe(column(right));
		}
		expect(column("A + B")).not.toBe(column("A ^ B"));
	});

	test("variables are listed once, in alphabetical order", () => {
		expect(variablesOf(parse("C·A + B·A'"))).toEqual(["A", "B", "C"]);
	});

	test("NOT binds tighter than AND, AND tighter than XOR, XOR tighter than OR", () => {
		// A + B·C' is A + (B·(C')), not (A + B)·C'.
		expect(mintermsOf(truthTable(parse("A + B·C'")))).toEqual([2, 4, 5, 6, 7]);
		// A ^ B·C is A ^ (B·C).
		expect(mintermsOf(truthTable(parse("A ^ B·C")))).toEqual([3, 4, 5, 6]);
		// A + B ^ C is A + (B ^ C).
		expect(mintermsOf(truthTable(parse("A + B ^ C")))).toEqual([1, 2, 4, 5, 6, 7]);
	});

	test("the formatted table has one line per row", () => {
		expect(formatTruthTable(truthTable(parse("A·B")))).toBe(
			["A B | F", "-------", "0 0 | 0", "0 1 | 0", "1 0 | 0", "1 1 | 1"].join("\n"),
		);
	});

	test("malformed expressions are rejected", () => {
		for (const text of ["", "A +", "(A·B", "A)", "A # B", "+ A", "A''('"]) {
			expect(() => parse(text)).toThrow(SyntaxError);
		}
	});
});

describe("gates", () => {
	const pairs: [Bit, Bit][] = [
		[0, 0],
		[0, 1],
		[1, 0],
		[1, 1],
	];
	const column = (gate: (a: Bit, b: Bit) => Bit): string => pairs.map(([a, b]) => gate(a, b)).join("");

	test("each gate has its textbook truth table", () => {
		expect([not(0), not(1)]).toEqual([1, 0]);
		expect(column(and)).toBe("0001");
		expect(column(or)).toBe("0111");
		expect(column(nand)).toBe("1110");
		expect(column(nor)).toBe("1000");
		expect(column(xor)).toBe("0110");
		expect(column(xnor)).toBe("1001");
	});
});
