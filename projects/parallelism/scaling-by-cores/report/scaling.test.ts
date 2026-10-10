import { describe, expect, test } from "bun:test";
import {
	amdahl,
	type BenchReport,
	type BenchRow,
	buildScaling,
	checksumsByWorkload,
	efficiency,
	fitSerialFraction,
	karpFlatt,
	speedup,
} from "./scaling";

function row(language: string, implementation: string, workers: number, meanMs: number, checksum = "x"): BenchRow {
	return { language, implementation, variant: String(workers), n: 1000, meanMs, stddevMs: 0, checksum };
}

function report(rows: BenchRow[]): BenchReport {
	return { project: "test", generatedAt: "now", machine: {}, runtimes: {}, runs: 1, warmup: 0, rows };
}

describe("formulas", () => {
	test("speed-up and efficiency", () => {
		expect(speedup(120, 20)).toBe(6);
		expect(efficiency(6, 8)).toBe(0.75);
	});

	test("Amdahl: 20% serial on 4 workers gives 2.5", () => {
		expect(amdahl(0.2, 4)).toBeCloseTo(2.5, 12);
		expect(amdahl(0, 8)).toBe(8);
	});

	test("Karp-Flatt inverts Amdahl", () => {
		expect(karpFlatt(4, 8)).toBeCloseTo(1 / 7, 12);
		expect(karpFlatt(amdahl(0.03, 4), 4)).toBeCloseTo(0.03, 12);
		expect(() => karpFlatt(1, 1)).toThrow();
	});

	// EN: When the data follow Amdahl's law exactly, the fit must return the serial fraction
	//     that generated them. This is the sanity check of the least-squares formula.
	// PT: Quando os dados seguem exatamente a lei de Amdahl, o ajuste precisa devolver a fração
	//     serial que os gerou. É o teste de sanidade da fórmula de mínimos quadrados.
	// ES: Cuando los datos siguen exactamente la ley de Amdahl, el ajuste debe devolver la fracción
	//     serial que los generó. Es la prueba de cordura de la fórmula de mínimos cuadrados.
	test("the fit recovers the serial fraction of exact Amdahl data", () => {
		for (const s of [0, 0.01, 0.1, 0.5]) {
			const points = [1, 2, 4, 8].map((workers) => ({ workers, speedup: amdahl(s, workers) }));
			expect(fitSerialFraction(points)).toBeCloseTo(s, 12);
		}
		expect(() => fitSerialFraction([{ workers: 1, speedup: 1 }])).toThrow();
	});
});

describe("report", () => {
	test("builds one series per language, workload and schedule", () => {
		const s = 0.1;
		const rows = [
			...[1, 2, 4, 8].map((workers) => row("go", "primes-seq", workers, 1000)),
			...[1, 2, 4, 8].map((workers) => row("go", "primes-static", workers, 1000 / amdahl(s, workers))),
			...[1, 2, 4, 8].map((workers) => row("go", "primes-dynamic", workers, 1000 / workers)),
		];
		const scaling = buildScaling(report(rows));
		expect(scaling.series.map((item) => item.schedule)).toEqual(["static", "dynamic"]);
		const [fixed, dynamic] = scaling.series;
		expect(fixed?.baselineMs).toBe(1000);
		expect(fixed?.fittedSerialFraction).toBeCloseTo(s, 12);
		expect(fixed?.points.map((point) => point.workers)).toEqual([1, 2, 4, 8]);
		expect(fixed?.points[0]?.serialFraction).toBeUndefined();
		expect(dynamic?.points.at(-1)?.speedup).toBeCloseTo(8, 12);
		expect(dynamic?.points.at(-1)?.efficiency).toBeCloseTo(1, 12);
		expect(dynamic?.fittedSerialFraction).toBeCloseTo(0, 12);
	});

	test("a different checksum stops the report", () => {
		const rows = [row("go", "primes-seq", 1, 10, "25:1060"), row("rust", "primes-static", 2, 5, "25:1061")];
		expect(() => checksumsByWorkload(rows)).toThrow("expected 25:1060");
		expect(
			checksumsByWorkload([row("go", "primes-seq", 1, 10, "a"), row("go", "mandelbrot-seq", 1, 10, "b")]),
		).toEqual({ primes: "a", mandelbrot: "b" });
	});
});
