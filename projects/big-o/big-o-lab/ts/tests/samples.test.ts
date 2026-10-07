import { describe, expect, test } from "bun:test";
import { doublingSizes, pseudoRandom, SAMPLES } from "../src/samples";

describe("instrumented samples", () => {
	test("there is one sample per growth class", () => {
		expect(SAMPLES.map((sample) => sample.id)).toEqual([
			"constant",
			"logarithmic",
			"linear",
			"linearithmic",
			"quadratic",
			"exponential",
		]);
	});

	// EN: Acceptance of MP-BIGO-1.1: the counted operations equal the closed formula.
	// PT: Aceite de MP-BIGO-1.1: as operações contadas são iguais à fórmula fechada.
	for (const sample of SAMPLES) {
		test(`${sample.id}: operation counts match the closed formula`, () => {
			for (const n of sample.sizes) {
				expect(sample.run(sample.prepare(n)).operations).toBe(sample.formula(n));
			}
		});

		test(`${sample.id}: sizes double on every run`, () => {
			expect(sample.sizes.length).toBeGreaterThanOrEqual(4);
			for (let index = 1; index < sample.sizes.length; index++) {
				expect(sample.sizes[index]).toBe(2 * (sample.sizes[index - 1] ?? 0));
			}
		});
	}

	// EN: The merge sort formula also holds when n is not a power of two.
	// PT: A fórmula do merge sort também vale quando n não é potência de dois.
	test("linearithmic: the formula holds for every n from 1 to 200", () => {
		const sample = SAMPLES.find((item) => item.id === "linearithmic");
		for (let n = 1; n <= 200; n++) {
			expect(sample?.run(pseudoRandom(n)).operations).toBe(sample?.formula(n));
		}
	});

	test("doublingSizes starts at the given size and doubles", () => {
		expect(doublingSizes(3, 4)).toEqual([3, 6, 12, 24]);
	});
});

// EN: A counter is only worth trusting if the algorithm around it is right.
// PT: Um contador só merece confiança se o algoritmo ao redor dele estiver certo.
describe("the samples compute the right answer", () => {
	const run = (id: string, input: number[]): number => {
		const sample = SAMPLES.find((item) => item.id === id);
		if (sample === undefined) {
			throw new Error(`unknown sample ${id}`);
		}
		return sample.run(input).result;
	};

	test("constant reads the middle element", () => {
		expect(run("constant", [10, 20, 30, 40, 50])).toBe(30);
	});

	test("logarithmic reports a missing value", () => {
		expect(run("logarithmic", [0, 1, 2, 3])).toBe(-1);
	});

	test("linear adds every element", () => {
		expect(run("linear", [1, 2, 3, 4])).toBe(10);
	});

	test("linearithmic sorts", () => {
		expect(run("linearithmic", [5, 1, 4, 2, 3, 3])).toBe(1);
	});

	test("quadratic counts inversions", () => {
		expect(run("quadratic", [3, 1, 2])).toBe(2);
	});

	test("exponential finds the largest subset sum", () => {
		expect(run("exponential", [4, 0, 7])).toBe(11);
	});
});
