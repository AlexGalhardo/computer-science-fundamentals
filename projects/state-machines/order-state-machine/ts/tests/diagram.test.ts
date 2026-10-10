import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { DIAGRAM_PATH, renderDiagram } from "../src/diagram";
import { loadTable } from "../src/table";

const table = loadTable();

describe("diagram generated from machine.json", () => {
	// EN: The freshness test. `diagram.md` is committed so that people can read it on GitHub,
	//     and this test fails when someone changes the table and forgets to regenerate it.
	// PT: O teste de atualização. `diagram.md` é versionado para que as pessoas o leiam no
	//     GitHub, e este teste falha quando alguém muda a tabela e esquece de regenerá-lo.
	// ES: La prueba de actualización. `diagram.md` está versionado para que las personas lo lean
	//     en GitHub, y esta prueba falla cuando alguien cambia la tabla y olvida regenerarlo.
	test("the committed diagram.md is up to date", () => {
		expect(readFileSync(DIAGRAM_PATH, "utf8")).toBe(renderDiagram(table));
	});

	test("a change in the table changes the diagram", () => {
		const changed = {
			...table,
			transitions: [...table.transitions, { from: "shipped", event: "refund", to: "refunded" } as const],
		};
		const diagram = renderDiagram(changed);
		expect(diagram).not.toBe(readFileSync(DIAGRAM_PATH, "utf8"));
		expect(diagram).toContain("    shipped --> refunded: refund");
	});

	test("the diagram has the start marker, every transition and the terminal states", () => {
		const diagram = renderDiagram(table);
		expect(diagram).toContain("    [*] --> created");
		for (const { from, event, to } of table.transitions) {
			expect(diagram).toContain(`    ${from} --> ${to}: ${event}`);
		}
		expect(diagram).toContain("    cancelled --> [*]");
		expect(diagram).toContain("    refunded --> [*]");
		expect(diagram).not.toContain("    delivered --> [*]");
		expect(diagram).toContain("| paid | - | shipped | - | - | refunded |");
	});
});
