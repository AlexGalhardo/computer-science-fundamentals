import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseTable, TABLE_PATH } from "../src/table";

function rawTable(): Record<string, unknown> {
	return JSON.parse(readFileSync(TABLE_PATH, "utf8")) as Record<string, unknown>;
}

describe("validation of machine.json", () => {
	test("the committed table is valid", () => {
		expect(parseTable(rawTable()).transitions).toHaveLength(6);
	});

	// EN: Two targets for the same (state, event) pair would make the machine non-deterministic:
	//     the result would depend on which row the code happens to read first.
	// PT: Dois destinos para o mesmo par (estado, evento) tornariam a máquina não determinística:
	//     o resultado dependeria de qual linha o código lesse primeiro.
	// ES: Dos destinos para el mismo par (estado, evento) volverían no determinista a la máquina:
	//     el resultado dependería de qué fila lea primero el código.
	test("a second transition for the same (state, event) pair is refused", () => {
		const table = rawTable();
		const transitions = [...(table.transitions as unknown[]), { from: "created", event: "pay", to: "shipped" }];
		expect(() => parseTable({ ...table, transitions })).toThrow(/not be deterministic/);
	});

	test("a transition to an unknown state is refused", () => {
		const table = rawTable();
		const transitions = [{ from: "created", event: "pay", to: "payed" }];
		expect(() => parseTable({ ...table, transitions })).toThrow();
	});

	test("a table that drops a state is refused", () => {
		const table = rawTable();
		expect(() => parseTable({ ...table, states: ["created", "paid"] })).toThrow(/must be exactly/);
	});
});
