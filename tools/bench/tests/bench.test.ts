import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { benchConfigSchema, expandCases } from "../src/config";
import { parseBenchOutput } from "../src/contract";
import { type BenchRow, renderMarkdown, rowKey, sortRows } from "../src/report";
import { renderSchema } from "../src/write-schema";

const valid = { n: 1000, elapsedMs: 1.5, memoryKb: 2048, language: "ts", implementation: "merge" };

describe("benchmark contract", () => {
	test("accepts a valid sample, ignoring log lines before it", () => {
		expect(parseBenchOutput(`warming up\n${JSON.stringify(valid)}\n`)).toEqual(valid);
	});

	test("rejects a sample with a missing field", () => {
		const { memoryKb: _removed, ...invalid } = valid;
		expect(() => parseBenchOutput(JSON.stringify(invalid))).toThrow("memoryKb");
	});

	test("rejects a negative time, an unknown field and output that is not JSON", () => {
		expect(() => parseBenchOutput(JSON.stringify({ ...valid, elapsedMs: -1 }))).toThrow("elapsedMs");
		expect(() => parseBenchOutput(JSON.stringify({ ...valid, seconds: 2 }))).toThrow("contract");
		expect(() => parseBenchOutput("done in 3 ms")).toThrow("not JSON");
	});

	test("the committed schema.json matches the Zod schema", () => {
		expect(readFileSync(join(import.meta.dir, "..", "schema.json"), "utf8")).toBe(renderSchema());
	});
});

describe("benchmark grid", () => {
	const sample = join(import.meta.dir, "..", "sample", "bench.json");
	const config = benchConfigSchema.parse(JSON.parse(readFileSync(sample, "utf8")));

	test("expands targets, implementations and sizes, and respects maxN", () => {
		const target = config.targets[0];
		if (target === undefined) {
			throw new Error("sample has no target");
		}
		expect(expandCases(config, target).map((item) => item.command)).toEqual([
			"bun run ts/bench.ts sum-loop 1000",
			"bun run ts/bench.ts sum-loop 100000",
			"bun run ts/bench.ts sum-formula 1000",
			"bun run ts/bench.ts sum-formula 100000",
		]);
		const capped = expandCases({ ...config, maxN: { "sum-loop": 1000 } }, target);
		expect(capped.filter((item) => item.implementation === "sum-loop").map((item) => item.n)).toEqual([1000]);
	});

	test("rows are sorted the same way whatever the order they were measured in", () => {
		const row = (language: string, n: number): BenchRow => ({
			language,
			implementation: "merge",
			variant: "default",
			n,
			meanMs: 1,
			stddevMs: 0,
			minMs: 1,
			maxMs: 1,
			cpuMs: 1,
			peakMemoryKb: 1,
			elapsedMs: 1,
			memoryKb: 1,
			command: "x",
		});
		const a = sortRows([row("ts", 10), row("go", 10), row("ts", 5)]).map(rowKey);
		const b = sortRows([row("go", 10), row("ts", 5), row("ts", 10)]).map(rowKey);
		expect(a).toEqual(b);
		expect(a).toEqual(["ts/merge/default/5", "go/merge/default/10", "ts/merge/default/10"]);
	});

	test("the Markdown report records machine, runtimes and the exact command", () => {
		const markdown = renderMarkdown({
			project: "sample",
			generatedAt: "2026-01-01T00:00:00.000Z",
			machine: { "host CPU": "Test CPU" },
			runtimes: { ts: "1.4.2 (oven/bun:1.4.2)" },
			runs: 3,
			warmup: 1,
			rows: [],
		});
		expect(markdown).toContain("- host CPU: Test CPU");
		expect(markdown).toContain("- ts: 1.4.2 (oven/bun:1.4.2)");
	});
});
