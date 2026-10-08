import { describe, expect, test } from "bun:test";
import cases from "../../cases.json";
import { lineTotals, onlyStatus, pipe, ranked, type SalesOrder, salesReport, totalsByCategory } from "../src/pipeline";
import { check, int, listOf, oneOf, tuple } from "../src/prop";

describe("pipeline: composition", () => {
	test("pipe applies the functions from left to right", () => {
		const addOne = (n: number): number => n + 1;
		const double = (n: number): number => n * 2;
		expect(pipe(addOne, double)(5)).toBe(12);
		expect(pipe(double, addOne)(5)).toBe(11);
	});

	// EN: The orders and the expected report come from cases.json, the same file the Elixir
	//     tests read, so both implementations are held to the same answer.
	// PT: Os pedidos e o relatório esperado vêm de cases.json, o mesmo arquivo que os testes
	//     em Elixir leem, então as duas implementações são cobradas pela mesma resposta.
	test("the sales report matches the shared expected result", () => {
		expect(salesReport(cases.pipeline.top)(cases.pipeline.orders)).toEqual(cases.pipeline.expected);
	});

	test("each step can be tested on its own", () => {
		const paid = onlyStatus("paid")(cases.pipeline.orders);
		expect(paid).toHaveLength(3);
		expect(lineTotals(paid)).toHaveLength(6);
		expect(ranked(totalsByCategory(lineTotals(paid))).map((row) => row.category)).toEqual([
			"games",
			"books",
			"music",
			"tools",
			"garden",
		]);
	});

	test("the input is not modified", () => {
		const before = JSON.stringify(cases.pipeline.orders);
		salesReport(cases.pipeline.top)(cases.pipeline.orders);
		expect(JSON.stringify(cases.pipeline.orders)).toBe(before);
	});
});

describe("pipeline: invariant", () => {
	const orders = listOf(
		tuple(
			oneOf(["paid", "pending", "cancelled"]),
			listOf(tuple(oneOf(["books", "games", "music"]), int(0, 50_000), int(0, 9)), 4),
		),
		6,
	);
	const toOrders = (generated: Array<[string, Array<[string, number, number]>]>): SalesOrder[] =>
		generated.map(([status, lines]) => ({
			status,
			lines: lines.map(([category, unitCents, quantity]) => ({ category, unitCents, quantity })),
		}));

	// EN: Grouping and sorting may move money between rows, but they cannot create or lose
	//     any: the full report adds up to the paid lines, for any list of orders.
	// PT: Agrupar e ordenar podem mover dinheiro entre linhas, mas não podem criar nem perder
	//     nenhum: o relatório completo soma o mesmo que as linhas pagas, para qualquer lista
	//     de pedidos.
	test("the full report adds up to the paid lines", () => {
		const sum = (rows: ReadonlyArray<{ totalCents: number }>): number =>
			rows.reduce((total, row) => total + row.totalCents, 0);
		const result = check(
			orders,
			(generated) => {
				const sales = toOrders(generated);
				return sum(salesReport(Number.MAX_SAFE_INTEGER)(sales)) === sum(lineTotals(onlyStatus("paid")(sales)));
			},
			{ runs: 300 },
		);
		expect(result).toEqual({ ok: true, runs: 300 });
	});
});
