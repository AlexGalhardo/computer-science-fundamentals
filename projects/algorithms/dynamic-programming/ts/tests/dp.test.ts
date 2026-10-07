import { describe, expect, test } from "bun:test";
import { coinChangeMemo, coinChangeNaive, coinChangeTab, coinChangeTable } from "../src/coin-change";
import { lehmer, newCounter } from "../src/counter";
import { knapsackMemo, knapsackNaive, knapsackTab, knapsackTable } from "../src/knapsack";
import { lcsMemo, lcsNaive, lcsTab, lcsTable } from "../src/lcs";
import { DOCUMENTED_SIZE, knapsackInstance, lcsInstance, PROBLEMS } from "../src/problems";

const CASES = 200;

describe("known answers", () => {
	test("knapsack", () => {
		const items = [
			{ value: 3, weight: 2 },
			{ value: 4, weight: 3 },
			{ value: 5, weight: 4 },
			{ value: 6, weight: 5 },
		];
		expect(knapsackNaive(items, 5, newCounter())).toBe(7);
		expect(knapsackMemo(items, 5, newCounter())).toBe(7);
		expect(knapsackTab(items, 5)).toBe(7);
		expect(knapsackTable(items, 5).at(-1)).toEqual([0, 0, 3, 4, 5, 7]);
		expect(knapsackTab([], 10)).toBe(0);
	});

	test("lcs", () => {
		expect(lcsNaive("BANANA", "ATANA", newCounter())).toBe(4);
		expect(lcsMemo("BANANA", "ATANA", newCounter())).toBe(4);
		expect(lcsTab("BANANA", "ATANA")).toBe(4);
		expect(lcsTable("AB", "B")).toEqual([
			[0, 0],
			[0, 0],
			[0, 1],
		]);
		expect(lcsTab("", "ABC")).toBe(0);
	});

	test("coin change", () => {
		expect(coinChangeNaive([1, 3, 4], 6, newCounter())).toBe(2);
		expect(coinChangeMemo([1, 3, 4], 6, newCounter())).toBe(2);
		expect(coinChangeTab([1, 3, 4], 6)).toBe(2);
		expect(coinChangeTable([1, 3, 4], 6)).toEqual([0, 1, 2, 1, 1, 2, 2]);
		// EN: 7 cannot be made with coins of 2 and 4: every sum of them is even.
		// PT: 7 não pode ser formado com moedas de 2 e 4: toda soma delas é par.
		expect(coinChangeNaive([2, 4], 7, newCounter())).toBe(-1);
		expect(coinChangeMemo([2, 4], 7, newCounter())).toBe(-1);
		expect(coinChangeTab([2, 4], 7)).toBe(-1);
	});
});

// EN: The acceptance criterion: on 200 random cases of each problem the three versions return
//     the same answer. The naive version is the specification, the other two are optimisations.
// PT: O critério de aceite: em 200 casos aleatórios de cada problema as três versões devolvem a
//     mesma resposta. A versão ingênua é a especificação, as outras duas são otimizações.
describe(`three versions agree on ${CASES} random cases`, () => {
	test("knapsack", () => {
		for (let seed = 1; seed <= CASES; seed++) {
			const { items, capacity } = knapsackInstance(1 + (seed % 14), seed);
			const expected = knapsackNaive(items, capacity, newCounter());
			expect(knapsackMemo(items, capacity, newCounter())).toBe(expected);
			expect(knapsackTab(items, capacity)).toBe(expected);
		}
	});

	test("lcs", () => {
		for (let seed = 1; seed <= CASES; seed++) {
			const { a, b } = lcsInstance(seed % 10, seed);
			const shorter = b.slice(0, seed % 7);
			const expected = lcsNaive(a, shorter, newCounter());
			expect(lcsMemo(a, shorter, newCounter())).toBe(expected);
			expect(lcsTab(a, shorter)).toBe(expected);
		}
	});

	test("coin change", () => {
		for (let seed = 1; seed <= CASES; seed++) {
			const next = lehmer(seed);
			const coins = [...new Set([2 + (next() % 4), 3 + (next() % 5), 5 + (next() % 7)])];
			const amount = next() % 26;
			const expected = coinChangeNaive(coins, amount, newCounter());
			expect(coinChangeMemo(coins, amount, newCounter())).toBe(expected);
			expect(coinChangeTab(coins, amount)).toBe(expected);
		}
	});
});

describe("call counter", () => {
	for (const [name, versions] of Object.entries(PROBLEMS)) {
		test(`${name}: naive makes at least 100 times more calls than memo`, () => {
			const n = DOCUMENTED_SIZE[name] ?? 0;
			const naive = newCounter();
			const memo = newCounter();
			expect(versions.naive(n, naive)).toBe(versions.memo(n, memo));
			expect(versions.tab(n, newCounter())).toBe(versions.memo(n, newCounter()));
			expect(naive.calls).toBeGreaterThanOrEqual(100 * memo.calls);
		});
	}
});
