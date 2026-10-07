// EN: The arithmetic of the benchmark, with a made-up subject. The real measurement is not part
//     of the test run: it lives in the `bench` service, because it takes several seconds.
// PT: A aritmética do benchmark, com um sujeito inventado. A medição de verdade não faz parte
//     dos testes: ela fica no serviço `bench`, porque leva vários segundos.

import { describe, expect, test } from "bun:test";
import { measure, renderTable, SUBJECTS, spreadOf } from "../src/bench";

describe("benchmark arithmetic", () => {
	test("spreadOf reports the minimum, the median and the maximum", () => {
		expect(spreadOf([5, 1, 3])).toEqual({ min: 1, median: 3, max: 5 });
		expect(spreadOf([4, 1, 3, 2])).toEqual({ min: 1, median: 2.5, max: 4 });
	});

	test("measure discards the warm-up runs and keeps every measured one", () => {
		let calls = 0;
		const row = measure(
			{
				scheme: "fake",
				parameters: "none",
				n: 10,
				hashOnce: () => {
					calls += 1;
					return "fake-output";
				},
			},
			4,
			2,
		);
		expect(calls).toBe(60);
		expect(row.elapsedMs).toHaveLength(4);
		expect(row.n).toBe(10);
		expect(row.hashesPerSecond.min).toBeLessThanOrEqual(row.hashesPerSecond.median);
		expect(row.hashesPerSecond.median).toBeLessThanOrEqual(row.hashesPerSecond.max);
	});

	test("the four storage schemes of the plan are measured", () => {
		const schemes = SUBJECTS.map((subject) => subject.scheme);
		expect(schemes).toEqual(
			expect.arrayContaining(["plain text", "MD5", "salted SHA-256", "Argon2id (lab policy)"]),
		);
	});

	test("the table has one line per row plus the header", () => {
		const table = renderTable([
			{
				scheme: "fake",
				parameters: "none",
				n: 10,
				runs: 1,
				warmupRuns: 0,
				elapsedMs: [1],
				hashesPerSecond: { min: 10_000, median: 10_000, max: 10_000 },
				msPerHashMedian: 0.1,
				timesSlowerThanMd5: 1,
			},
		]);
		expect(table.split("\n")).toHaveLength(3);
		expect(table).toContain("| fake | none | 10 | **10,000** |");
	});
});
