// EN: Query 4, an aggregate: how many posts each author has, largest first. `count(*)` is a
//     bigint in PostgreSQL and node-postgres returns bigint as a string, so the raw SQL casts it
//     to integer. ORMs hide this conversion, which is convenient until a count exceeds 2^53.
// PT: Consulta 4, uma agregação: quantos posts cada autor tem, do maior para o menor. `count(*)`
//     é bigint no PostgreSQL e o node-postgres devolve bigint como string, então o SQL puro
//     converte para integer. Os ORMs escondem essa conversão, o que é cômodo até uma contagem
//     passar de 2^53.
// ES: Consulta 4, una agregación: cuántos posts tiene cada autor, del mayor al menor. `count(*)`
//     es bigint en PostgreSQL y node-postgres devuelve bigint como string, así que el SQL puro
//     lo convierte a integer. Los ORM esconden esa conversión, lo que es cómodo hasta que un conteo
//     pasa de 2^53.

import { asc, count, desc, eq } from "drizzle-orm";
import { authors, posts } from "../drizzle-schema";
import type { QueryDefinition } from "./types";

export interface AuthorPostCount {
	authorId: number;
	name: string;
	posts: number;
}

export const postCountByAuthor: QueryDefinition<[limit: number], AuthorPostCount[]> = {
	name: "post-count-by-author",
	description: "Authors with the most posts",
	sample: [10],
	readOnly: true,

	raw: (context, limit) =>
		context.raw.query<{ authorId: number; name: string; posts: number }>(
			`SELECT a.id AS "authorId", a.name, count(p.id)::int AS posts
			 FROM authors a
			 LEFT JOIN posts p ON p.author_id = a.id
			 GROUP BY a.id, a.name
			 ORDER BY posts DESC, a.id ASC
			 LIMIT $1`,
			[limit],
		),

	prisma: async (context, limit) => {
		const rows = await context.prisma.author.findMany({
			orderBy: [{ posts: { _count: "desc" } }, { id: "asc" }],
			take: limit,
			select: { id: true, name: true, _count: { select: { posts: true } } },
		});
		return rows.map((row) => ({ authorId: row.id, name: row.name, posts: row._count.posts }));
	},

	drizzle: (context, limit) =>
		context.drizzle
			.select({ authorId: authors.id, name: authors.name, posts: count(posts.id) })
			.from(authors)
			.leftJoin(posts, eq(posts.authorId, authors.id))
			.groupBy(authors.id, authors.name)
			.orderBy(desc(count(posts.id)), asc(authors.id))
			.limit(limit),
};
