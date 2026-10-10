// EN: Unit tests of the pieces that need no server: the batching loader, the statistics and
//     the deterministic seed.
// PT: Testes de unidade das peças que não precisam de servidor: o loader em lote, as
//     estatísticas e os dados determinísticos.
// ES: Pruebas unitarias de las piezas que no necesitan servidor: el loader por lotes, las
//     estadísticas y los datos deterministas.

import { describe, expect, test } from "bun:test";
import { BatchLoader } from "../src/loader";
import { AUTHOR_COUNT, BOOK_COUNT, buildSeed, REVIEWS_PER_BOOK } from "../src/seed";
import { mean, percentile, renderNPlusOne, stddev, summarise } from "../src/stats";

describe("BatchLoader", () => {
	test("many loads in the same turn become one batch call", async () => {
		const calls: number[][] = [];
		const loader = new BatchLoader<number, string>(
			async (keys) => {
				calls.push([...keys]);
				return new Map(keys.map((key) => [key, `value-${key}`]));
			},
			() => "missing",
		);
		const values = await Promise.all([loader.load(1), loader.load(2), loader.load(3)]);
		expect(values).toEqual(["value-1", "value-2", "value-3"]);
		expect(calls).toEqual([[1, 2, 3]]);
	});

	test("the same key is fetched once and then served from the cache", async () => {
		const calls: number[][] = [];
		const loader = new BatchLoader<number, string>(
			async (keys) => {
				calls.push([...keys]);
				return new Map(keys.map((key) => [key, `value-${key}`]));
			},
			() => "missing",
		);
		await Promise.all([loader.load(5), loader.load(5)]);
		await loader.load(5);
		expect(calls).toEqual([[5]]);
	});

	test("a key the batch did not return gets the fallback value", async () => {
		const loader = new BatchLoader<number, string[]>(
			async () => new Map(),
			() => [],
		);
		expect(await loader.load(1)).toEqual([]);
	});

	test("a failing batch rejects every waiting load", async () => {
		const loader = new BatchLoader<number, string>(
			async () => {
				throw new Error("database down");
			},
			() => "missing",
		);
		const results = await Promise.allSettled([loader.load(1), loader.load(2)]);
		expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"]);
	});
});

describe("statistics", () => {
	test("mean, standard deviation and percentile", () => {
		expect(mean([1, 2, 3, 4])).toBe(2.5);
		expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
		expect(percentile([5, 1, 4, 2, 3], 50)).toBe(3);
		expect(percentile([5, 1, 4, 2, 3], 95)).toBe(5);
		expect(mean([])).toBe(0);
	});

	test("summarise reports the spread between rounds", () => {
		const summary = summarise([
			[1, 1, 1],
			[3, 3, 3],
		]);
		expect(summary.meanMs).toBe(2);
		expect(summary.stddevMs).toBeCloseTo(Math.SQRT2, 6);
	});

	test("the N+1 table is Markdown", () => {
		const table = renderNPlusOne([{ endpoint: "/graphql", dbQueries: 3, meanMs: 1.5, stddevMs: 0.25 }]);
		expect(table.split("\n").at(-1)).toBe("| `/graphql` | 3 | 1.500 | 0.250 |");
	});
});

describe("seed", () => {
	test("is deterministic and has the documented sizes", () => {
		const seed = buildSeed();
		expect(seed).toEqual(buildSeed());
		expect(seed.authors).toHaveLength(AUTHOR_COUNT);
		expect(seed.books).toHaveLength(BOOK_COUNT);
		expect(seed.reviews).toHaveLength(BOOK_COUNT * REVIEWS_PER_BOOK);
		expect(new Set(seed.authors.map((author) => author.name)).size).toBe(AUTHOR_COUNT);
		expect(seed.reviews.every((review) => review.rating >= 1 && review.rating <= 5)).toBe(true);
	});
});
