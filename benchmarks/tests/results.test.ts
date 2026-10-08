// EN: Checks the committed results without running anything: every workload has a row for
//     each of the seven languages, every checksum agrees across languages, every row that
//     was sampled reports its spread, and the dashboard data was built from these files.
// PT: Confere os resultados versionados sem rodar nada: toda carga tem uma linha para cada uma
//     das sete linguagens, todo checksum concorda entre as linguagens, toda linha amostrada
//     informa sua dispersão, e os dados do dashboard foram construídos a partir destes arquivos.

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { benchmarksDir, LANGUAGES } from "../scripts/lib";

const WORKLOADS = [
	"cpu-single",
	"parallelism",
	"concurrency",
	"memory",
	"http",
	"build-time",
	"binary-size",
	"database",
];

interface Row {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	checksum?: string;
	[key: string]: unknown;
}

function rowsOf(workload: string): Row[] {
	return (
		JSON.parse(readFileSync(join(benchmarksDir, workload, "results", "results.json"), "utf8")) as { rows: Row[] }
	).rows;
}

describe.each(WORKLOADS)("%s results", (workload) => {
	test("the three result files are committed", () => {
		for (const file of ["results.json", "results.md", "results.js"]) {
			expect(existsSync(join(benchmarksDir, workload, "results", file))).toBe(true);
		}
	});

	test("every language has rows", () => {
		expect([...new Set(rowsOf(workload).map((row) => row.language))].sort()).toEqual([...LANGUAGES].sort());
	});

	test("languages that did the same work report the same checksum", () => {
		const groups = new Map<string, Set<string>>();
		for (const row of rowsOf(workload)) {
			if (row.checksum === undefined) {
				continue;
			}
			// EN: In concurrency each language names its own mechanism, so rows are grouped by size only.
			// PT: Na concorrência cada linguagem dá nome ao próprio mecanismo, então as linhas são
			//     agrupadas só pelo tamanho.
			const key =
				workload === "concurrency"
					? String(row.n)
					: workload === "database"
						? "all"
						: `${row.implementation}/${row.n}`;
			groups.set(key, (groups.get(key) ?? new Set()).add(row.checksum));
		}
		for (const [key, checksums] of groups) {
			expect({ key, distinct: checksums.size }).toEqual({ key, distinct: 1 });
		}
	});
});

test("sampled rows report a spread", () => {
	for (const workload of ["cpu-single", "parallelism", "concurrency", "memory", "build-time"]) {
		for (const row of rowsOf(workload)) {
			expect(typeof row.stddevMs).toBe("number");
			expect(row.maxMs as number).toBeGreaterThanOrEqual(row.minMs as number);
		}
	}
	for (const row of rowsOf("http")) {
		expect(row.rpsMax as number).toBeGreaterThanOrEqual(row.rpsMin as number);
		expect(row.failedRate).toBe(0);
		expect(row.samples as number).toBeGreaterThan(0);
	}
	for (const row of rowsOf("database")) {
		expect(row.opsMax as number).toBeGreaterThanOrEqual(row.opsMin as number);
	}
});

test("the dashboard data is built", () => {
	const text = readFileSync(join(benchmarksDir, "dashboard", "results", "results.js"), "utf8");
	expect(text.startsWith("window.BENCH_DATA = ")).toBe(true);
	const data = JSON.parse(text.slice("window.BENCH_DATA = ".length).replace(/;\s*$/, "")) as Record<string, unknown>;
	for (const key of [
		"cpu",
		"parallelism",
		"concurrency",
		"http",
		"memory",
		"build",
		"size",
		"database",
		"machine",
		"runtimes",
	]) {
		expect(data[key]).toBeDefined();
	}
});
