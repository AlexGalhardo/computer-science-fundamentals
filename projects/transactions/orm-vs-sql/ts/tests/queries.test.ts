import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { type Captured, captureAll, capturedPath, writeCaptured } from "../src/capture";
import { loadConfig } from "../src/config";
import { APPROACHES, type Approach, type Context, createContext, resetDatabase } from "../src/context";
import { FIVE_QUERIES, N_PLUS_ONE } from "../src/queries";
import { addPostWithComment } from "../src/queries/add-post-with-comment";

const config = loadConfig();
let context: Context;
const captured = new Map<string, Record<Approach, Captured>>();

beforeAll(async () => {
	await resetDatabase(config.DATABASE_URL);
	context = createContext({ databaseUrl: config.DATABASE_URL, record: true });
	for (const query of [...FIVE_QUERIES, N_PLUS_ONE.naive, N_PLUS_ONE.fixed]) {
		captured.set(query.name, await captureAll(context, query));
	}
});

afterAll(async () => {
	await context.close();
});

function of(name: string): Record<Approach, Captured> {
	const found = captured.get(name);
	if (found === undefined) {
		throw new Error(`query "${name}" was not captured`);
	}
	return found;
}

// EN: A new post gets a new id from the sequence each time, so the id is the one field that
//     legitimately differs between the three runs of the write query.
// PT: Um post novo recebe um id novo da sequência a cada vez, então o id é o único campo que
//     legitimamente difere entre as três execuções da consulta de escrita.
function comparable(result: unknown): unknown {
	if (typeof result === "object" && result !== null && "postId" in result) {
		const { postId: _postId, ...rest } = result;
		return rest;
	}
	return result;
}

describe("the same five queries in the three approaches", () => {
	for (const query of FIVE_QUERIES) {
		test(`${query.name}: raw SQL, Prisma and Drizzle return identical rows`, () => {
			const results = of(query.name);
			const reference = comparable(results.raw.result);
			expect(reference).not.toBeNull();
			if (Array.isArray(reference)) {
				expect(reference.length).toBeGreaterThan(0);
			}
			expect(comparable(results.prisma.result)).toEqual(reference);
			expect(comparable(results.drizzle.result)).toEqual(reference);
		});
	}

	test("the sample data makes the queries meaningful", () => {
		expect(of("top-posts").raw.result).toHaveLength(10);
		expect(of("posts-with-author").raw.result).toHaveLength(20);
		expect(of("author-by-id").raw.result).toEqual({ id: 42, name: "Fake Author 042", country: "PT" });
	});
});

describe("captured SQL", () => {
	for (const query of [...FIVE_QUERIES, N_PLUS_ONE.naive, N_PLUS_ONE.fixed]) {
		test(`${query.name}: the SQL of each approach is written next to the query`, () => {
			const results = of(query.name);
			for (const approach of APPROACHES) {
				expect(results[approach].statements.length).toBeGreaterThan(0);
			}
			writeCaptured(config.PROJECT_DIR, query, results);
			const path = capturedPath(config.PROJECT_DIR, query);
			expect(existsSync(path)).toBe(true);
			const text = readFileSync(path, "utf8");
			for (const approach of APPROACHES) {
				expect(text).toContain(`-- ${approach} (`);
			}
		});
	}

	test("every approach binds parameters instead of writing values into the SQL text", () => {
		for (const approach of APPROACHES) {
			const [statement] = of("author-by-id")[approach].statements;
			expect(statement).toContain("$1");
			expect(statement).not.toContain("42");
		}
	});
});

describe("N+1", () => {
	for (const approach of APPROACHES) {
		test(`${approach}: the naive version issues more than 100 statements and the fix issues 2`, () => {
			const naive = of(N_PLUS_ONE.naive.name)[approach];
			const fixed = of(N_PLUS_ONE.fixed.name)[approach];
			expect(naive.statements.length).toBeGreaterThan(100);
			expect(naive.statements).toHaveLength(151);
			expect(fixed.statements).toHaveLength(2);
			expect(fixed.result).toEqual(naive.result);
		});
	}
});

describe("transaction", () => {
	async function postsOfAuthor(authorId: number): Promise<number> {
		const rows = await context.raw.query<{ total: number }>(
			"SELECT count(*)::int AS total FROM posts WHERE author_id = $1",
			[authorId],
		);
		return rows[0]?.total ?? -1;
	}

	for (const approach of APPROACHES) {
		test(`${approach}: when the second insert fails, the first one is rolled back`, async () => {
			const before = await postsOfAuthor(2);
			// EN: 201 characters break the CHECK of comments.body, after the post was inserted.
			// PT: 201 caracteres quebram o CHECK de comments.body, depois de o post ter sido inserido.
			const tooLong = "x".repeat(201);
			await expect(
				addPostWithComment[approach](context, 2, "A fake post that must vanish", tooLong),
			).rejects.toThrow();
			expect(await postsOfAuthor(2)).toBe(before);
		});

		test(`${approach}: when both inserts succeed, both rows are committed`, async () => {
			const created = await addPostWithComment[approach](context, 3, `Fake post by ${approach}`, "Fake comment");
			const rows = await context.raw.query<{ body: string }>("SELECT body FROM comments WHERE post_id = $1", [
				created.postId,
			]);
			expect(rows).toEqual([{ body: "Fake comment" }]);
		});
	}
});
