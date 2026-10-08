import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { comparisonTable, measure } from "../src/compare";

test("the four implementations are measured", () => {
	const rows = measure();
	expect(rows.map((row) => row.name)).toEqual([
		"Java, objects",
		"TypeScript, objects",
		"TypeScript, functions",
		"Elixir, functions",
	]);
	for (const row of rows) {
		expect(row.codeLines).toBeGreaterThan(0);
		expect(row.types).toBeGreaterThan(0);
	}
});

// EN: The table in the README comes from `results/comparison.md`. If the code changes and the
//     table is not regenerated (`docker compose run --rm compare`), this test fails.
// PT: A tabela do README vem de `results/comparison.md`. Se o código mudar e a tabela não for
//     regenerada (`docker compose run --rm compare`), este teste falha.
test("the committed results/comparison.md is up to date", () => {
	const committed = readFileSync(new URL("../../results/comparison.md", import.meta.url), "utf8");
	expect(committed.replaceAll("\r\n", "\n")).toBe(comparisonTable());
});
