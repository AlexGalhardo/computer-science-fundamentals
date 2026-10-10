import { describe, expect, test } from "bun:test";
import { classify, formatGrowth, formatRecurrence } from "../src/classify";
import { run } from "../src/cli";
import { recursionTree, renderTree, treeShape } from "../src/tree";

// EN: Acceptance of MP-BIGO-2.1: one recurrence per case and one that does not fit.
// PT: Aceite de MP-BIGO-2.1: uma recorrência por caso e uma que não se encaixa.
// ES: Aceptación de MP-BIGO-2.1: una recurrencia por caso y una que no encaja.
describe("classifier", () => {
	test("case 1: Strassen, 7T(n/2) + n^2", () => {
		const result = classify({ a: 7, b: 2, d: 2 });
		expect(result.case).toBe("case-1");
		expect(result.solution).toBe("Θ(n^2.81)");
		expect(result.criticalExponent).toBeCloseTo(Math.log2(7), 12);
	});

	test("case 2: merge sort, 2T(n/2) + n", () => {
		const result = classify({ a: 2, b: 2, d: 1 });
		expect(result.case).toBe("case-2");
		expect(result.solution).toBe("Θ(n log n)");
	});

	test("case 3: 2T(n/2) + n^2", () => {
		const result = classify({ a: 2, b: 2, d: 2 });
		expect(result.case).toBe("case-3");
		expect(result.solution).toBe("Θ(n^2)");
	});

	test("does not apply: 2T(n/2) + n log n falls in the gap", () => {
		const result = classify({ a: 2, b: 2, d: 1, k: 1 });
		expect(result.case).toBe("not-applicable");
		expect(result.solution).toBeNull();
		expect(result.extendedSolution).toBe("Θ(n log^2 n)");
	});

	test("does not apply: 2T(n/2) + n / log n has no solution here at all", () => {
		const result = classify({ a: 2, b: 2, d: 1, k: -1 });
		expect(result.case).toBe("not-applicable");
		expect(result.extendedSolution).toBeNull();
	});

	test("other classic recurrences", () => {
		expect(classify({ a: 1, b: 2, d: 0 }).solution).toBe("Θ(log n)");
		expect(classify({ a: 2, b: 2, d: 0 }).solution).toBe("Θ(n)");
		expect(classify({ a: 4, b: 2, d: 1 }).solution).toBe("Θ(n^2)");
		expect(classify({ a: 4, b: 2, d: 2 }).solution).toBe("Θ(n^2 log n)");
		expect(classify({ a: 9, b: 3, d: 1 }).solution).toBe("Θ(n^2)");
		expect(classify({ a: 3, b: 2, d: 1 }).solution).toBe("Θ(n^1.58)");
		expect(classify({ a: 1, b: 2, d: 1 }).solution).toBe("Θ(n)");
		expect(classify({ a: 3, b: 4, d: 1, k: 1 }).solution).toBe("Θ(n log n)");
	});

	// EN: log_2(8) is exactly 3, even if floating point says 2.9999999999999996.
	// PT: log_2(8) é exatamente 3, mesmo que o ponto flutuante diga 2.9999999999999996.
	// ES: log_2(8) es exactamente 3, aunque el punto flotante diga 2.9999999999999996.
	test("an exact logarithm is not lost to floating point", () => {
		const result = classify({ a: 8, b: 2, d: 3 });
		expect(result.criticalExponent).toBe(3);
		expect(result.case).toBe("case-2");
		expect(classify({ a: 243, b: 3, d: 5 }).case).toBe("case-2");
	});

	test("rejects recurrences outside the hypotheses", () => {
		expect(() => classify({ a: 0, b: 2, d: 1 })).toThrow();
		expect(() => classify({ a: 2, b: 1, d: 1 })).toThrow();
		expect(() => classify({ a: 1.5, b: 2, d: 1 })).toThrow();
		expect(() => classify({ a: 2, b: 2, d: -1 })).toThrow();
	});

	test("formats growth and recurrences", () => {
		expect(formatGrowth(0, 0)).toBe("1");
		expect(formatGrowth(1, 2)).toBe("n log^2 n");
		expect(formatRecurrence(classify({ a: 1, b: 2, d: 0 }).recurrence)).toBe("T(n) = T(n/2) + 1");
		expect(formatRecurrence(classify({ a: 7, b: 2, d: 2 }).recurrence)).toBe("T(n) = 7T(n/2) + n^2");
	});
});

describe("recursion tree", () => {
	test("merge sort: every level costs n", () => {
		const levels = recursionTree(classify({ a: 2, b: 2, d: 1 }).recurrence, 16);
		expect(levels.map((level) => level.nodes)).toEqual([1, 2, 4, 8, 16]);
		expect(levels.map((level) => level.size)).toEqual([16, 8, 4, 2, 1]);
		expect(levels.map((level) => level.levelCost)).toEqual([16, 16, 16, 16, 16]);
	});

	// EN: The case of the theorem is the shape of the tree.
	// PT: O caso do teorema é o formato da árvore.
	// ES: El caso del teorema es la forma del árbol.
	test("the shape of the tree matches the case", () => {
		const shape = (a: number, b: number, d: number) =>
			treeShape(recursionTree(classify({ a, b, d }).recurrence, b ** 5));
		expect(shape(7, 2, 2)).toBe("leaf-heavy");
		expect(shape(2, 2, 1)).toBe("balanced");
		expect(shape(2, 2, 2)).toBe("root-heavy");
	});

	test("renders one line per level and the total", () => {
		const text = renderTree(recursionTree(classify({ a: 2, b: 2, d: 1 }).recurrence, 4));
		expect(text.split("\n")).toHaveLength(4);
		expect(text).toContain("total cost 12");
	});
});

// EN: Acceptance of MP-BIGO-2.3: one command prints the case.
// PT: Aceite de MP-BIGO-2.3: um comando imprime o caso.
// ES: Aceptación de MP-BIGO-2.3: un comando imprime el caso.
describe("command line", () => {
	test("prints the case, the solution and the tree", () => {
		const result = run(["7", "2", "2"]);
		expect(result.code).toBe(0);
		expect(result.output).toContain("T(n) = 7T(n/2) + n^2");
		expect(result.output).toContain("case 1");
		expect(result.output).toContain("T(n) = Θ(n^2.81)");
		expect(result.output).toContain("recursion tree for n = 16");
		expect(result.output).toContain("ES: f(n) = n^2 es polinomialmente menor que n^2.81");
	});

	test("reports when the theorem does not apply", () => {
		expect(run(["2", "2", "1", "1"]).output).toContain("the basic master theorem does not apply");
		const invalid = run(["2", "1", "1"]);
		expect(invalid.code).toBe(1);
		expect(invalid.output).toContain("b must be greater than 1");
	});

	test("rejects arguments that are not numbers", () => {
		expect(run(["two", "2", "1"]).code).toBe(2);
		expect(run(["2", "2"]).code).toBe(2);
		expect(run(["2", "2", "1", "0", "9"]).code).toBe(2);
	});
});
