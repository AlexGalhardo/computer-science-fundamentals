import { describe, expect, test } from "bun:test";
import { RANDOM_INPUTS, RANDOM_N, renderMarkdown, SEED, treeRows } from "../src/demo";
import { createRandom, exhaustive, minimumComparisons, randomExperiment, randomPermutation } from "../src/experiment";
import { countingSort, radixSort } from "../src/linear-sorts";
import { COMPARISON_SORTS, countComparisons } from "../src/sorts";

const report = randomExperiment(RANDOM_N, RANDOM_INPUTS, SEED);
const COMPARISON_NAMES = COMPARISON_SORTS.map((item) => item.name);

describe("comparison counters", () => {
	for (const { name, sort } of COMPARISON_SORTS) {
		test(`${name} sorts, including duplicates and the empty array`, () => {
			expect(countComparisons(sort, [5, 3, 8, 1, 9, 2, 7]).sorted).toEqual([1, 2, 3, 5, 7, 8, 9]);
			expect(countComparisons(sort, [2, 1, 2, 1, 0]).sorted).toEqual([0, 1, 1, 2, 2]);
			expect(countComparisons(sort, [])).toEqual({ sorted: [], comparisons: 0 });
		});
	}

	// EN: Acceptance of MP-BIGO-3.2: on 1,000 random inputs, the counted comparisons of merge
	//     sort, heapsort and quicksort never fall below lg(n!).
	// PT: Aceite de MP-BIGO-3.2: em 1.000 entradas aleatórias, as comparações contadas de merge
	//     sort, heapsort e quicksort nunca ficam abaixo de lg(n!).
	test("counted comparisons never fall below lg(n!) on 1,000 random inputs", () => {
		expect(report.inputs).toBe(1000);
		const rows = report.rows.filter((row) => COMPARISON_NAMES.includes(row.algorithm));
		expect(rows).toHaveLength(3);
		for (const row of rows) {
			expect(row.minimum).toBeGreaterThanOrEqual(report.log2Factorial);
			expect(row.sortedInputs).toBe(1000);
		}
	});

	// EN: What the theorem really promises, checked on every permutation: the worst case is at
	//     least ceil(lg n!). A single lucky input may need fewer comparisons, and it does.
	// PT: O que o teorema realmente promete, conferido em todas as permutações: o pior caso é
	//     pelo menos ceil(lg n!). Uma entrada de sorte pode precisar de menos comparações, e precisa.
	test("worst case over all permutations is at or above the bound", () => {
		for (const n of [2, 3, 4, 5, 6, 7]) {
			for (const row of exhaustive(n)) {
				expect(row.worst).toBeGreaterThanOrEqual(minimumComparisons(n));
			}
		}
		const mergeOnFive = exhaustive(5).find((row) => row.algorithm === "merge sort");
		expect(mergeOnFive?.best).toBeLessThan(minimumComparisons(5));
	});
});

describe("sorts without comparisons", () => {
	// EN: Acceptance of MP-BIGO-3.3: counting sort and radix sort sort the same inputs with
	//     zero element comparisons, in the same table.
	// PT: Aceite de MP-BIGO-3.3: counting sort e radix sort ordenam as mesmas entradas com
	//     zero comparações entre elementos, na mesma tabela.
	test("counting and radix sort are in the same table, sorted, with zero comparisons", () => {
		for (const name of ["counting sort", "radix sort"]) {
			const row = report.rows.find((item) => item.algorithm === name);
			expect(row?.sortedInputs).toBe(1000);
			expect(row?.maximum).toBe(0);
		}
		expect(report.rows.map((row) => row.algorithm)).toEqual([...COMPARISON_NAMES, "counting sort", "radix sort"]);
	});

	test("counting sort and radix sort agree with a comparison sort", () => {
		const random = createRandom(7);
		const values = Array.from({ length: 500 }, () => Math.floor(random() * 1000));
		const expected = [...values].sort((a, b) => a - b);
		expect(countingSort(values, 1000)).toEqual(expected);
		expect(radixSort(values)).toEqual(expected);
		expect(radixSort(values, 256)).toEqual(expected);
		expect(radixSort([])).toEqual([]);
		expect(radixSort([0, 0])).toEqual([0, 0]);
	});

	test("keys outside the range are refused", () => {
		expect(() => countingSort([1, 5], 5)).toThrow(RangeError);
		expect(() => countingSort([-1], 5)).toThrow(RangeError);
		expect(() => radixSort([1.5])).toThrow(RangeError);
	});
});

describe("reproducibility", () => {
	test("the same seed gives the same permutation, and it is a permutation", () => {
		const first = randomPermutation(50, createRandom(1));
		expect(randomPermutation(50, createRandom(1))).toEqual(first);
		expect([...first].sort((a, b) => a - b)).toEqual(Array.from({ length: 50 }, (_, index) => index));
	});

	test("the Markdown report has the three tables", () => {
		const markdown = renderMarkdown("2026-01-01T00:00:00.000Z", treeRows([3, 4]), exhaustive(3), report);
		expect(markdown).toContain("| merge sort | 4 | 24 | 24 | 5 | 5 |");
		expect(markdown).toContain("## 1,000 random inputs of n = 1,000");
		expect(markdown).toContain("| counting sort | 0 | 0 | 0 | 0.000 | 1000 of 1000 |");
	});
});
