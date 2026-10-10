import { describe, expect, test } from "bun:test";
import {
	buildDecisionTree,
	countLeaves,
	height,
	permutations,
	renderDecisionTree,
	totalLeafDepth,
} from "../src/decision-tree";
import { log2Factorial, minimumComparisons } from "../src/experiment";
import { COMPARISON_SORTS, heapSort, mergeSort } from "../src/sorts";

function factorial(n: number): number {
	return n <= 1 ? 1 : n * factorial(n - 1);
}

describe("decision tree", () => {
	// EN: Acceptance of MP-BIGO-3.1: the tree has n! leaves and its height equals the ceiling
	//     of lg(n!), for n = 3 and n = 4.
	// PT: Aceite de MP-BIGO-3.1: a árvore tem n! folhas e sua altura é igual ao teto de
	//     lg(n!), para n = 3 e n = 4.
	// ES: Aceptación de MP-BIGO-3.1: el árbol tiene n! hojas y su altura es igual al techo de
	//     lg(n!), para n = 3 y n = 4.
	test.each([
		[3, 6, 3],
		[4, 24, 5],
	])("merge sort, n = %i: %i leaves and height %i", (n, leaves, expectedHeight) => {
		const tree = buildDecisionTree(mergeSort, n);
		expect(countLeaves(tree)).toBe(leaves);
		expect(countLeaves(tree)).toBe(factorial(n));
		expect(height(tree)).toBe(expectedHeight);
		expect(height(tree)).toBe(Math.ceil(Math.log2(factorial(n))));
		expect(height(tree)).toBe(minimumComparisons(n));
	});

	// EN: Any correct comparison sort has exactly n! reachable leaves, and none can be shorter
	//     than the bound, in the worst case or on average.
	// PT: Qualquer ordenação por comparação correta tem exatamente n! folhas alcançáveis, e
	//     nenhuma pode ser mais baixa que o limite, no pior caso ou na média.
	// ES: Cualquier ordenación por comparación correcta tiene exactamente n! hojas alcanzables, y
	//     ninguna puede ser más baja que la cota, en el peor caso o en promedio.
	for (const { name, sort } of COMPARISON_SORTS) {
		test(`${name}: n! leaves and a height at or above the bound, for n = 1 to 6`, () => {
			for (let n = 1; n <= 6; n++) {
				const tree = buildDecisionTree(sort, n);
				expect(countLeaves(tree)).toBe(factorial(n));
				expect(height(tree)).toBeGreaterThanOrEqual(minimumComparisons(n));
				expect(totalLeafDepth(tree) / factorial(n)).toBeGreaterThanOrEqual(log2Factorial(n) - 1e-9);
			}
		});
	}

	test("heapsort is not optimal for n = 4: its tree is taller than the bound", () => {
		expect(height(buildDecisionTree(heapSort, 4))).toBe(7);
	});

	test("every leaf holds a different order", () => {
		const orders = new Set<string>();
		const collect = (tree: ReturnType<typeof buildDecisionTree> | null): void => {
			if (tree === null) {
				return;
			}
			if (tree.kind === "leaf") {
				orders.add(tree.order.join(","));
				return;
			}
			collect(tree.yes);
			collect(tree.no);
		};
		collect(buildDecisionTree(mergeSort, 4));
		expect(orders.size).toBe(24);
	});

	test("renders the tree as text", () => {
		const text = renderDecisionTree(buildDecisionTree(mergeSort, 3));
		expect(text.split("\n")[0]).toBe("c < b ?");
		expect(text).toContain("=> a < b < c");
		expect(text.match(/=>/g)).toHaveLength(6);
	});

	test("rejects sizes whose tree would be too large", () => {
		expect(() => buildDecisionTree(mergeSort, 8)).toThrow(RangeError);
		expect(() => buildDecisionTree(mergeSort, 0)).toThrow(RangeError);
	});

	test("permutations lists all n! orders once", () => {
		const all = permutations(4).map((item) => item.join(","));
		expect(all).toHaveLength(24);
		expect(new Set(all).size).toBe(24);
	});
});

describe("the bound", () => {
	test("log2(n!) and its ceiling", () => {
		expect(log2Factorial(4)).toBeCloseTo(Math.log2(24), 12);
		expect([1, 2, 3, 4, 5, 6].map(minimumComparisons)).toEqual([0, 1, 3, 5, 7, 10]);
	});

	test("log2(n!) is within n log2 n and (n/2) log2 (n/2)", () => {
		for (const n of [16, 256, 1000]) {
			expect(log2Factorial(n)).toBeLessThanOrEqual(n * Math.log2(n));
			expect(log2Factorial(n)).toBeGreaterThanOrEqual((n / 2) * Math.log2(n / 2));
		}
	});
});
