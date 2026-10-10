import { describe, expect, test } from "bun:test";
import { classify } from "../src/classify";
import { classificationGrid, EMPIRICAL, EXAMPLES, renderMarkdown } from "../src/demo";
import { empiricalCheck, generateRecursive } from "../src/empirical";

describe("generated recursive function", () => {
	test("merge sort makes 2n - 1 calls and n log2 n + n work", () => {
		const run = generateRecursive(classify({ a: 2, b: 2, d: 1 }).recurrence);
		expect(run(16)).toEqual({ calls: 31, work: 16 * 4 + 16 });
	});

	test("binary search makes log2 n + 1 calls", () => {
		const run = generateRecursive(classify({ a: 1, b: 2, d: 0 }).recurrence);
		expect(run(1024)).toEqual({ calls: 11, work: 11 });
	});

	test("a 7-way split of depth 3 makes 1 + 7 + 49 + 343 calls", () => {
		const run = generateRecursive(classify({ a: 7, b: 2, d: 2 }).recurrence);
		expect(run(8).calls).toBe(400);
	});
});

// EN: Acceptance of MP-BIGO-2.2: the measured growth agrees with the predicted class for
//     merge sort, binary search and a 7-way split.
// PT: Aceite de MP-BIGO-2.2: o crescimento medido concorda com a classe prevista para
//     merge sort, busca binária e uma divisão em 7.
// ES: Aceptación de MP-BIGO-2.2: el crecimiento medido concuerda con la clase predicha para
//     merge sort, búsqueda binaria y una división en 7.
describe("empirical check", () => {
	for (const item of EMPIRICAL) {
		test(`${item.name}: measured growth agrees with the predicted class`, () => {
			const report = empiricalCheck(item.input, item.depths);
			expect(report.agrees).toBe(true);
			expect(report.drift.predicted).toBeLessThan(0.05);
			expect(report.drift.predicted).toBeLessThan(report.drift.oneLogLess);
			expect(report.drift.predicted).toBeLessThan(report.drift.oneLogMore);
		});
	}

	test("the three recurrences of the criterion are the ones checked", () => {
		expect(EMPIRICAL.map((item) => classify(item.input).solution)).toEqual(["Θ(n log n)", "Θ(log n)", "Θ(n^2.81)"]);
	});

	// EN: The check must be able to fail: a wrong prediction does not pass it.
	// PT: A conferência precisa poder falhar: uma previsão errada não passa por ela.
	// ES: La comprobación debe poder fallar: una predicción equivocada no pasa por ella.
	test("a wrong class has a larger drift than the right one", () => {
		const report = empiricalCheck({ a: 2, b: 2, d: 1 }, [10, 12, 14, 15, 16]);
		expect(report.drift.oneLogLess).toBeGreaterThan(0.05);
		expect(report.drift.oneLogMore).toBeGreaterThan(0.05);
	});
});

describe("results", () => {
	test("the grid covers every combination offered by the page", () => {
		const grid = classificationGrid();
		expect(grid).toHaveLength(9 * 3 * 4 * 2);
		expect(grid.every((item) => item.case === "not-applicable" || item.solution !== null)).toBe(true);
	});

	test("the Markdown report has one row per example and one section per check", () => {
		const examples = EXAMPLES.map((example) => ({ name: example.name, classification: classify(example.input) }));
		const checks = EMPIRICAL.slice(1, 2).map((item) => ({
			name: item.name,
			report: empiricalCheck(item.input, item.depths),
		}));
		const markdown = renderMarkdown("2026-01-01T00:00:00.000Z", examples, checks);
		expect(markdown).toContain("| merge sort | `T(n) = 2T(n/2) + n` | 1.000 | case-2 | Θ(n log n) |");
		expect(markdown).toContain("none (extended case 2: Θ(n log^2 n))");
		expect(markdown).toContain("### binary search");
		expect(markdown).toContain("Agrees: **yes**");
	});
});
