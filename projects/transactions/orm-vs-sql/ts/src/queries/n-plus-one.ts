// EN: The N+1 problem. To show N authors with their posts, the naive code runs 1 query for the
//     list and then 1 more query per author, inside a loop: N + 1 round trips to the database.
//     Each query is fast and looks innocent, and that is the trap: the cost is the number of
//     round trips, which grows with the data. The fix asks for all the posts at once, so the
//     number of statements is 2 no matter how many authors there are.
// PT: O problema N+1. Para mostrar N autores com seus posts, o código ingênuo roda 1 consulta para
//     a lista e depois mais 1 consulta por autor, dentro de um laço: N + 1 idas e voltas ao
//     banco. Cada consulta é rápida e parece inocente, e essa é a armadilha: o custo é o número
//     de idas e voltas, que cresce com os dados. A correção pede todos os posts de uma vez, então
//     o número de comandos é 2, não importa quantos autores existam.
// ES: El problema N+1. Para mostrar N autores con sus posts, el código ingenuo ejecuta 1 consulta para
//     la lista y luego 1 consulta más por autor, dentro de un bucle: N + 1 viajes de ida y vuelta a la
//     base de datos. Cada consulta es rápida y parece inocente, y esa es la trampa: el costo es el
//     número de viajes, que crece con los datos. La corrección pide todos los posts de una vez, así
//     que el número de sentencias es 2, sin importar cuántos autores existan.

import { asc, eq, inArray } from "drizzle-orm";
import { authors, posts } from "../drizzle-schema";
import type { QueryDefinition } from "./types";

export interface AuthorWithPosts {
	id: number;
	name: string;
	posts: string[];
}

// EN: These two are `type` aliases, not interfaces: only a type alias is accepted where a
//     generic "record of columns" is expected.
// PT: Estes dois são aliases `type`, não interfaces: só um alias de tipo é aceito onde se espera
//     um "registro de colunas" genérico.
// ES: Estos dos son alias `type`, no interfaces: solo un alias de tipo se acepta donde se espera
//     un "registro de columnas" genérico.
type AuthorRow = {
	id: number;
	name: string;
};

type PostRow = {
	authorId: number;
	title: string;
};

// EN: Joins in memory what the two statements of the fix returned: one pass to group the posts
//     by author, one pass over the authors. Linear time, no extra query.
// PT: Junta em memória o que os dois comandos da correção devolveram: uma passada para agrupar os
//     posts por autor, uma passada pelos autores. Tempo linear, nenhuma consulta a mais.
// ES: Une en memoria lo que devolvieron las dos sentencias de la corrección: una pasada para agrupar los
//     posts por autor, una pasada por los autores. Tiempo lineal, ninguna consulta de más.
function attach(authorRows: AuthorRow[], postRows: PostRow[]): AuthorWithPosts[] {
	const byAuthor = new Map<number, string[]>();
	for (const post of postRows) {
		const titles = byAuthor.get(post.authorId) ?? [];
		titles.push(post.title);
		byAuthor.set(post.authorId, titles);
	}
	return authorRows.map((author) => ({ id: author.id, name: author.name, posts: byAuthor.get(author.id) ?? [] }));
}

export const nPlusOneNaive: QueryDefinition<[limit: number], AuthorWithPosts[]> = {
	name: "n-plus-one-naive",
	description: "Authors with their posts, one query per author (the bug)",
	sample: [150],
	readOnly: true,

	raw: async (context, limit) => {
		const authorRows = await context.raw.query<AuthorRow>("SELECT id, name FROM authors ORDER BY id ASC LIMIT $1", [
			limit,
		]);
		const result: AuthorWithPosts[] = [];
		for (const author of authorRows) {
			const postRows = await context.raw.query<{ title: string }>(
				"SELECT title FROM posts WHERE author_id = $1 ORDER BY id ASC",
				[author.id],
			);
			result.push({ id: author.id, name: author.name, posts: postRows.map((post) => post.title) });
		}
		return result;
	},

	prisma: async (context, limit) => {
		const authorRows = await context.prisma.author.findMany({
			orderBy: { id: "asc" },
			take: limit,
			select: { id: true, name: true },
		});
		const result: AuthorWithPosts[] = [];
		for (const author of authorRows) {
			const postRows = await context.prisma.post.findMany({
				where: { authorId: author.id },
				orderBy: { id: "asc" },
				select: { title: true },
			});
			result.push({ id: author.id, name: author.name, posts: postRows.map((post) => post.title) });
		}
		return result;
	},

	drizzle: async (context, limit) => {
		const authorRows = await context.drizzle
			.select({ id: authors.id, name: authors.name })
			.from(authors)
			.orderBy(asc(authors.id))
			.limit(limit);
		const result: AuthorWithPosts[] = [];
		for (const author of authorRows) {
			const postRows = await context.drizzle
				.select({ title: posts.title })
				.from(posts)
				.where(eq(posts.authorId, author.id))
				.orderBy(asc(posts.id));
			result.push({ id: author.id, name: author.name, posts: postRows.map((post) => post.title) });
		}
		return result;
	},
};

export const nPlusOneFixed: QueryDefinition<[limit: number], AuthorWithPosts[]> = {
	name: "n-plus-one-fixed",
	description: "Authors with their posts, two queries in total (the fix)",
	sample: [150],
	readOnly: true,

	raw: async (context, limit) => {
		const authorRows = await context.raw.query<AuthorRow>("SELECT id, name FROM authors ORDER BY id ASC LIMIT $1", [
			limit,
		]);
		const postRows = await context.raw.query<PostRow>(
			`SELECT author_id AS "authorId", title FROM posts WHERE author_id = ANY($1::int[]) ORDER BY id ASC`,
			[authorRows.map((author) => author.id)],
		);
		return attach(authorRows, postRows);
	},

	// EN: With Prisma the fix is to ask for the relation in the same call. Prisma then loads all
	//     the posts of all the listed authors with one `IN (...)` statement.
	// PT: No Prisma a correção é pedir a relação na mesma chamada. O Prisma então carrega todos os
	//     posts de todos os autores listados com um único comando `IN (...)`.
	// ES: En Prisma la corrección es pedir la relación en la misma llamada. Prisma entonces carga todos los
	//     posts de todos los autores listados con una única sentencia `IN (...)`.
	prisma: async (context, limit) => {
		const rows = await context.prisma.author.findMany({
			orderBy: { id: "asc" },
			take: limit,
			select: { id: true, name: true, posts: { orderBy: { id: "asc" }, select: { title: true } } },
		});
		return rows.map((row) => ({ id: row.id, name: row.name, posts: row.posts.map((post) => post.title) }));
	},

	drizzle: async (context, limit) => {
		const authorRows = await context.drizzle
			.select({ id: authors.id, name: authors.name })
			.from(authors)
			.orderBy(asc(authors.id))
			.limit(limit);
		const postRows = await context.drizzle
			.select({ authorId: posts.authorId, title: posts.title })
			.from(posts)
			.where(
				inArray(
					posts.authorId,
					authorRows.map((author) => author.id),
				),
			)
			.orderBy(asc(posts.id));
		return attach(authorRows, postRows);
	},
};
