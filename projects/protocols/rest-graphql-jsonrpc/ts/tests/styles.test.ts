// EN: What is particular to each style, seen on the wire: status codes in REST, the `errors`
//     list in GraphQL, the error object, notifications and batches in JSON-RPC, and the N+1
//     statement count with and without batching.
// PT: O que é particular de cada estilo, visto no fio: códigos de status no REST, a lista
//     `errors` no GraphQL, o objeto de erro, notificações e lotes no JSON-RPC, e a contagem de
//     comandos do N+1 com e sem lote.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import { type RunningApp, startApp } from "../src/app";
import { createClient, STYLES } from "../src/clients";
import { loadConfig } from "../src/config";
import { createPool, QUERY_COUNT_HEADER, resetDatabase } from "../src/db";
import { RPC_ERROR } from "../src/jsonrpc";
import { N_PLUS_ONE_BOOKS, readShelf } from "../src/nplus1";

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

function post(path: string, body: string): Promise<Response> {
	return fetch(`${app.baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body });
}

describe("REST: the outcome is in the HTTP status", () => {
	test("404 for a resource that does not exist", async () => {
		const response = await fetch(`${app.baseUrl}/rest/books/9999`);
		expect(response.status).toBe(404);
	});

	test("201 with a Location header for a creation", async () => {
		const response = await post("/rest/books/110/reviews", JSON.stringify({ rating: 5, reviewer: "r", text: "t" }));
		expect(response.status).toBe(201);
		const created = (await response.json()) as { id: number };
		expect(response.headers.get("location")).toBe(`/rest/books/110/reviews/${created.id}`);
	});

	test("422 for content that breaks a rule", async () => {
		const response = await post("/rest/books/110/reviews", JSON.stringify({ rating: 0, reviewer: "r", text: "t" }));
		expect(response.status).toBe(422);
	});
});

describe("GraphQL: the outcome is in the body", () => {
	test("a failed mutation still answers 200, with an `errors` list and a code", async () => {
		const response = await post(
			"/graphql",
			JSON.stringify({
				query: 'mutation { addReview(bookId: 9999, input: { rating: 3, reviewer: "r", text: "t" }) { id } }',
			}),
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as { data: unknown; errors: { extensions: { code: string } }[] };
		expect(body.errors[0]?.extensions.code).toBe("NOT_FOUND");
		expect(body.data).toBeNull();
	});

	test("a field that is not in the schema is rejected before any resolver runs", async () => {
		const response = await post("/graphql", JSON.stringify({ query: "{ books { id price } }" }));
		const body = (await response.json()) as { errors: { message: string }[] };
		expect(body.errors[0]?.message).toContain("price");
		expect(response.headers.get(QUERY_COUNT_HEADER)).toBe("0");
	});

	test("the answer has exactly the fields that were asked", async () => {
		const response = await post("/graphql", JSON.stringify({ query: "{ book(id: 3) { title } }" }));
		const body = (await response.json()) as { data: { book: Record<string, unknown> } };
		expect(Object.keys(body.data.book)).toEqual(["title"]);
	});
});

describe("GraphQL: the N+1 problem and its fix with batching", () => {
	test("the naive endpoint sends more than 100 statements, the batched one fewer than 5", async () => {
		const naive = await readShelf(app.baseUrl, "/graphql-naive");
		const batched = await readShelf(app.baseUrl, "/graphql");
		// EN: 1 for the list + one per book for the author + one per book for the reviews.
		// PT: 1 para a lista + um por livro para o autor + um por livro para as resenhas.
		expect(naive.dbQueries).toBe(1 + 2 * N_PLUS_ONE_BOOKS);
		expect(naive.dbQueries).toBeGreaterThan(100);
		expect(batched.dbQueries).toBe(3);
		expect(batched.dbQueries).toBeLessThan(5);
	});

	test("both endpoints return the same data", async () => {
		const naive = await readShelf(app.baseUrl, "/graphql-naive");
		const batched = await readShelf(app.baseUrl, "/graphql");
		expect(batched.data).toEqual(naive.data);
		expect(batched.data.books).toHaveLength(N_PLUS_ONE_BOOKS);
	});
});

describe("JSON-RPC 2.0: the outcome is an object in the body", () => {
	interface Reply {
		jsonrpc: string;
		result?: unknown;
		error?: { code: number; message: string };
		id: string | number | null;
	}

	async function rpc(body: string): Promise<{ status: number; json: unknown }> {
		const response = await post("/rpc", body);
		const text = await response.text();
		return { status: response.status, json: text === "" ? undefined : JSON.parse(text) };
	}

	test("a successful call has `result` and no `error`, and echoes the id", async () => {
		const { status, json } = await rpc('{"jsonrpc":"2.0","method":"books.get","params":{"id":3},"id":"abc"}');
		const reply = json as Reply;
		expect(status).toBe(200);
		expect(reply.id).toBe("abc");
		expect(reply.error).toBeUndefined();
		expect(reply.result).toMatchObject({ id: 3 });
	});

	test("an application error is still HTTP 200, with `error` and no `result`", async () => {
		const { status, json } = await rpc('{"jsonrpc":"2.0","method":"books.get","params":{"id":9999},"id":1}');
		const reply = json as Reply;
		expect(status).toBe(200);
		expect(reply.result).toBeUndefined();
		expect(reply.error?.code).toBe(RPC_ERROR.notFound);
	});

	test("the predefined error codes", async () => {
		const broken = (await rpc('{"jsonrpc":"2.0","method":')).json as Reply;
		expect(broken.error?.code).toBe(RPC_ERROR.parseError);
		expect(broken.id).toBeNull();

		const invalid = (await rpc('{"method":"books.get","id":1}')).json as Reply;
		expect(invalid.error?.code).toBe(RPC_ERROR.invalidRequest);

		const unknown = (await rpc('{"jsonrpc":"2.0","method":"books.burn","id":2}')).json as Reply;
		expect(unknown.error?.code).toBe(RPC_ERROR.methodNotFound);

		const params = (await rpc('{"jsonrpc":"2.0","method":"books.get","params":{"id":"x"},"id":3}')).json as Reply;
		expect(params.error?.code).toBe(RPC_ERROR.invalidParams);

		const empty = (await rpc("[]")).json as Reply;
		expect(empty.error?.code).toBe(RPC_ERROR.invalidRequest);
	});

	test("a notification (no id) gets no answer, even when it fails", async () => {
		const ok = await rpc('{"jsonrpc":"2.0","method":"books.get","params":{"id":3}}');
		expect(ok).toEqual({ status: 204, json: undefined });
		const failing = await rpc('{"jsonrpc":"2.0","method":"books.burn"}');
		expect(failing).toEqual({ status: 204, json: undefined });
	});

	test("a batch answers every call that has an id, matched by id", async () => {
		const { json } = await rpc(
			JSON.stringify([
				{ jsonrpc: "2.0", method: "books.get", params: { id: 1 }, id: "a" },
				{ jsonrpc: "2.0", method: "books.get", params: { id: 2 } },
				{ jsonrpc: "2.0", method: "books.get", params: { id: 9999 }, id: "b" },
			]),
		);
		const replies = json as Reply[];
		expect(replies).toHaveLength(2);
		expect(replies.find((reply) => reply.id === "a")?.result).toMatchObject({ id: 1 });
		expect(replies.find((reply) => reply.id === "b")?.error?.code).toBe(RPC_ERROR.notFound);
	});
});

describe("the cost of one nested read per style", () => {
	test("REST needs 3 requests, JSON-RPC 2, GraphQL 1, and GraphQL moves the fewest response bytes", async () => {
		const meters = new Map<string, { requests: number; responseBytes: number }>();
		for (const style of STYLES) {
			const client = createClient(style, app.baseUrl);
			await client.getPage(7);
			meters.set(style, client.meter);
		}
		expect(meters.get("rest")?.requests).toBe(3);
		expect(meters.get("jsonrpc")?.requests).toBe(2);
		expect(meters.get("graphql")?.requests).toBe(1);
		expect(meters.get("graphql")?.responseBytes).toBeLessThan(meters.get("rest")?.responseBytes ?? 0);
		expect(meters.get("graphql")?.responseBytes).toBeLessThan(meters.get("jsonrpc")?.responseBytes ?? 0);
	});
});
