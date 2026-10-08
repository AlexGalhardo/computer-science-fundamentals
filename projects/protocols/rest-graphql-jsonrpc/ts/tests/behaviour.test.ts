// EN: ONE behaviour suite, run three times: against REST, GraphQL and JSON-RPC. The tests only
//     know the `ApiClient` interface. If the three styles pass the same assertions, they expose
//     the same domain, and what is left to compare is cost (requests, bytes, statements).
// PT: UMA suíte de comportamento, executada três vezes: contra REST, GraphQL e JSON-RPC. Os
//     testes só conhecem a interface `ApiClient`. Se os três estilos passam nas mesmas
//     asserções, eles expõem o mesmo domínio, e o que sobra para comparar é custo (requisições,
//     bytes, comandos).

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import { type RunningApp, startApp } from "../src/app";
import { type ApiClient, ApiError, createClient, STYLES } from "../src/clients";
import { loadConfig } from "../src/config";
import { createPool, resetDatabase } from "../src/db";
import { buildSeed } from "../src/seed";

const seed = buildSeed();
let pool: Pool;
let app: RunningApp;

beforeAll(async () => {
	pool = createPool(loadConfig().DATABASE_URL);
	await resetDatabase(pool);
	app = startApp(pool);
});

afterAll(async () => {
	await app.stop();
	await pool.end();
});

function must<T>(value: T | undefined): T {
	if (value === undefined) {
		throw new Error("the seed does not have this row");
	}
	return value;
}

async function failureOf(run: () => Promise<unknown>): Promise<unknown> {
	try {
		await run();
	} catch (error) {
		return error;
	}
	return undefined;
}

describe.each([...STYLES])("the same behaviour through %s", (style) => {
	let client: ApiClient;
	// EN: Each style writes its review on a different book, so the three runs do not interfere.
	// PT: Cada estilo grava sua resenha em um livro diferente, então as três execuções não interferem.
	const ownBook = 100 + STYLES.indexOf(style);

	beforeAll(() => {
		client = createClient(style, app.baseUrl);
	});

	test("list read: the first books in id order", async () => {
		const titles = await client.listTitles(5);
		expect(titles).toEqual(seed.books.slice(0, 5).map((book) => ({ id: book.id, title: book.title })));
	});

	test("list read: a page larger than the maximum is rejected as invalid", async () => {
		const error = await failureOf(() => client.listTitles(101));
		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).kind).toBe("invalid");
	});

	test("detail read: four fields of one book", async () => {
		const book = must(seed.books[6]);
		expect(await client.getCard(7)).toEqual({ id: 7, title: book.title, year: book.year, pages: book.pages });
	});

	test("detail read: an unknown book is reported as missing", async () => {
		expect(await client.getCard(9999)).toBeNull();
	});

	test("nested read: the book, the name of its author and its reviews", async () => {
		const book = must(seed.books[11]);
		const author = must(seed.authors.find((item) => item.id === book.authorId));
		const page = await client.getPage(12);
		expect(page).toEqual({
			id: 12,
			title: book.title,
			author: { name: author.name },
			reviews: seed.reviews
				.filter((review) => review.bookId === 12)
				.map((review) => ({ rating: review.rating, reviewer: review.reviewer })),
		});
	});

	test("nested read: an unknown book is reported as missing", async () => {
		expect(await client.getPage(9999)).toBeNull();
	});

	test("write: a new review is stored and shows up in the next read", async () => {
		const created = await client.addReview(ownBook, { rating: 4, reviewer: `tester-${style}`, text: "Good." });
		expect(created).toMatchObject({ bookId: ownBook, rating: 4 });
		expect(created.id).toBeGreaterThan(seed.reviews.length);
		const page = await client.getPage(ownBook);
		expect(page?.reviews.at(-1)).toEqual({ rating: 4, reviewer: `tester-${style}` });
	});

	test("write: a review for an unknown book fails as not found", async () => {
		const error = await failureOf(() => client.addReview(9999, { rating: 4, reviewer: "tester", text: "Good." }));
		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).kind).toBe("not-found");
	});

	test("write: a rating outside 1 to 5 fails as invalid and stores nothing", async () => {
		const before = await client.getPage(ownBook);
		const error = await failureOf(() => client.addReview(ownBook, { rating: 9, reviewer: "tester", text: "Bad." }));
		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).kind).toBe("invalid");
		expect(await client.getPage(ownBook)).toEqual(before);
	});
});
