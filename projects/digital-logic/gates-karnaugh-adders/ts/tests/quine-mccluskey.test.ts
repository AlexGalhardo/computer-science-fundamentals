import { describe, expect, test } from "bun:test";
import { mintermsOf, parse, truthTable } from "../src/expression";
import { covers, findPrimeImplicants, literalCount, minimise, toExpression } from "../src/quine-mccluskey";

const NAMES = ["A", "B", "C", "D", "E", "F"];

/** Minimises, writes the result as an expression, parses it again and returns its minterms. */
function roundTrip(variableCount: number, minterms: number[], dontCares: number[] = []): number[] {
	const variables = NAMES.slice(0, variableCount);
	const result = minimise(variableCount, minterms, dontCares);
	return mintermsOf(truthTable(parse(toExpression(result.cover, variables)), variables));
}

// EN: A small deterministic generator (mulberry32), so the random functions are the same on
//     every run and a failure can be reproduced.
// PT: Um gerador determinístico pequeno (mulberry32), para que as funções aleatórias sejam as
//     mesmas em toda execução e uma falha possa ser reproduzida.
function randomSource(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// EN: Acceptance criterion MP-DL-1.2: the minimised expression is equivalent to the original
//     for every input. "Every input" is taken literally: all 2^n rows are compared.
// PT: Critério de aceite MP-DL-1.2: a expressão minimizada é equivalente à original para toda
//     entrada. "Toda entrada" é levado ao pé da letra: as 2^n linhas são comparadas.
describe("equivalence of the minimised expression", () => {
	test("all 256 functions of 3 variables", () => {
		for (let code = 0; code < 256; code++) {
			const minterms = [0, 1, 2, 3, 4, 5, 6, 7].filter((row) => ((code >> row) & 1) === 1);
			expect(roundTrip(3, minterms)).toEqual(minterms);
		}
	});

	test("all 65,536 functions of 4 variables", () => {
		const rows = Array.from({ length: 16 }, (_, row) => row);
		for (let code = 0; code < 65536; code++) {
			const minterms = rows.filter((row) => ((code >> row) & 1) === 1);
			const variables = NAMES.slice(0, 4);
			const result = minimise(4, minterms);
			// Checked directly on the cover, which is much faster than parsing 65,536 expressions.
			const covered = rows.filter((row) => result.cover.some((term) => covers(term, row)));
			if (covered.join() !== minterms.join()) {
				throw new Error(`function ${code}: ${toExpression(result.cover, variables)} is not equivalent`);
			}
		}
	});

	test("300 random functions of 5 and 6 variables, through the parser", () => {
		const random = randomSource(2026);
		for (let round = 0; round < 300; round++) {
			const variableCount = 5 + (round % 2);
			const density = 0.15 + 0.7 * random();
			const minterms = Array.from({ length: 2 ** variableCount }, (_, row) => row).filter(
				() => random() < density,
			);
			expect(roundTrip(variableCount, minterms)).toEqual(minterms);
		}
	});

	test("with don't-care terms: equal on every required row, free on the don't-care rows", () => {
		const random = randomSource(7);
		for (let round = 0; round < 300; round++) {
			const variableCount = 3 + (round % 3);
			const minterms: number[] = [];
			const dontCares: number[] = [];
			for (let row = 0; row < 2 ** variableCount; row++) {
				const draw = random();
				if (draw < 0.35) {
					minterms.push(row);
				} else if (draw < 0.55) {
					dontCares.push(row);
				}
			}
			const produced = roundTrip(variableCount, minterms, dontCares);
			expect(produced.filter((row) => !dontCares.includes(row))).toEqual(minterms);
		}
	});
});

describe("minimal results known from the Karnaugh map", () => {
	const minimal = (variableCount: number, minterms: number[], dontCares: number[] = []): string =>
		toExpression(minimise(variableCount, minterms, dontCares).cover, NAMES.slice(0, variableCount));

	test("three variables", () => {
		expect(minimal(3, [0, 2, 4, 5, 6])).toBe("A·B' + C'");
		expect(minimal(3, [1, 3, 5, 6, 7])).toBe("A·B + C");
		// The chessboard pattern (odd parity) has no adjacent cells and cannot be reduced.
		expect(minimal(3, [1, 2, 4, 7])).toBe("A'·B'·C + A'·B·C' + A·B'·C' + A·B·C");
	});

	test("four variables, with groups that cross the borders of the map", () => {
		expect(minimal(4, [0, 2, 5, 7, 8, 10, 13, 15])).toBe("B'·D' + B·D");
		expect(minimal(4, [0, 1, 2, 5, 8, 9, 10])).toBe("A'·C'·D + B'·C' + B'·D'");
	});

	test("don't-care terms enlarge the groups", () => {
		expect(minimal(3, [1, 3, 7])).toBe("A'·C + B·C");
		expect(minimal(3, [1, 3, 7], [5])).toBe("C");
	});

	test("constant functions", () => {
		expect(minimal(3, [])).toBe("0");
		expect(minimal(3, [0, 1, 2, 3, 4, 5, 6, 7])).toBe("1");
	});

	test("the consensus term is a prime implicant but is left out of the cover", () => {
		// A·B + A'·C + B·C over A, B, C: minterms 1, 3, 6, 7.
		const result = minimise(3, [1, 3, 6, 7]);
		expect(result.primeImplicants).toHaveLength(3);
		expect(result.essentialPrimeImplicants).toHaveLength(2);
		expect(toExpression(result.cover, ["A", "B", "C"])).toBe("A·B + A'·C");
	});

	test("a cyclic map with no essential prime implicant still gets a minimal cover", () => {
		// Σm(0, 1, 2, 5, 6, 7): six prime implicants, none essential, three terms are enough.
		const result = minimise(3, [0, 1, 2, 5, 6, 7]);
		expect(result.primeImplicants).toHaveLength(6);
		expect(result.essentialPrimeImplicants).toHaveLength(0);
		expect(result.cover).toHaveLength(3);
		expect(result.cover.reduce((sum, term) => sum + literalCount(term, 3), 0)).toBe(6);
	});
});

describe("prime implicants", () => {
	test("every prime implicant covers only terms of the function", () => {
		const minterms = [0, 1, 2, 5, 8, 9, 10];
		for (const prime of findPrimeImplicants(minterms)) {
			for (let row = 0; row < 16; row++) {
				if (covers(prime, row)) {
					expect(minterms).toContain(row);
				}
			}
		}
	});

	test("terms outside the variable range are rejected", () => {
		expect(() => minimise(3, [8])).toThrow(RangeError);
		expect(() => minimise(3, [1], [-1])).toThrow(RangeError);
	});
});
