import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "../src/demo";
import { CANDIDATES, fitCandidate, fitCurve, type Point } from "../src/fit";
import { runLab } from "../src/lab";
import { doublingSizes } from "../src/samples";

function points(sizes: number[], f: (n: number) => number): Point[] {
	return sizes.map((n) => ({ n, y: f(n) }));
}

describe("curve fitting", () => {
	// EN: Acceptance of MP-BIGO-1.2: the tool names the right class for all six samples.
	// PT: Aceite de MP-BIGO-1.2: a ferramenta nomeia a classe certa para as seis amostras.
	// ES: Aceptación de MP-BIGO-1.2: la herramienta nombra la clase correcta para las seis muestras.
	test("names the right class for all six samples", () => {
		const reports = runLab(1);
		expect(reports).toHaveLength(6);
		for (const report of reports) {
			expect(report.fit.best.id).toBe(report.id);
			expect(report.fit.candidates).toHaveLength(CANDIDATES.length);
		}
	});

	test("reports the error of the best fit, and it is small", () => {
		for (const report of runLab(1)) {
			expect(report.fit.best.error).toBeGreaterThanOrEqual(0);
			expect(report.fit.best.error).toBeLessThan(0.01);
		}
	});

	test("recovers the hidden constants of a line", () => {
		const linear = CANDIDATES.find((candidate) => candidate.id === "linear");
		if (linear === undefined) {
			throw new Error("missing candidate");
		}
		const fit = fitCandidate(
			points(doublingSizes(8, 8), (n) => 3 * n + 7),
			linear,
		);
		expect(fit.scale).toBeCloseTo(3, 9);
		expect(fit.intercept).toBeCloseTo(7, 6);
		expect(fit.error).toBeCloseTo(0, 9);
	});

	// EN: Lower-order terms and constants must not change the verdict.
	// PT: Termos de ordem inferior e constantes não podem mudar o veredito.
	// ES: Los términos de menor orden y las constantes no pueden cambiar el veredicto.
	test("ignores constants and lower-order terms", () => {
		const sizes = doublingSizes(16, 10);
		expect(fitCurve(points(sizes, (n) => 5 * n * n + 300 * n + 1000)).best.id).toBe("quadratic");
		expect(fitCurve(points(sizes, (n) => 40 * n * Math.log2(n) + 9 * n)).best.id).toBe("linearithmic");
		expect(fitCurve(points(sizes, (n) => 12 * Math.log2(n) + 2)).best.id).toBe("logarithmic");
	});

	test("tolerates noise", () => {
		const noisy = doublingSizes(16, 10).map((n, index) => ({
			n,
			y: 2 * n * (1 + (index % 2 === 0 ? 0.03 : -0.03)),
		}));
		expect(fitCurve(noisy).best.id).toBe("linear");
	});

	test("constant data goes to the simplest curve", () => {
		expect(fitCurve(points(doublingSizes(16, 10), () => 7)).best.id).toBe("constant");
	});

	test("a curve that overflows does not fit", () => {
		const exponential = CANDIDATES.find((candidate) => candidate.id === "exponential");
		if (exponential === undefined) {
			throw new Error("missing candidate");
		}
		expect(
			fitCandidate(
				points([1024, 2048, 4096], (n) => n),
				exponential,
			).error,
		).toBe(Number.POSITIVE_INFINITY);
	});
});

describe("report", () => {
	test("the Markdown table shows counts, formula and best fit", () => {
		const markdown = renderMarkdown({
			project: "big-o-lab",
			generatedAt: "2026-01-01T00:00:00.000Z",
			command: "bun run demo",
			repetitions: 1,
			machine: { CPU: "test" },
			samples: runLab(1),
		});
		expect(markdown).toContain("## quadratic: count inversions comparing every pair");
		expect(markdown).toContain("Best fit: **O(n^2)**");
		expect(markdown).toContain("| 4,096 | 8,386,560 | 8,386,560 |");
	});
});
