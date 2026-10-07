// EN: Query 3, a join. In SQL and in Drizzle the join is written explicitly. In Prisma you ask
//     for a relation and the tool decides how to fetch it, so the captured SQL next to this file
//     is the only way to know whether it became one JOIN or two separate statements.
// PT: Consulta 3, uma junção. Em SQL e no Drizzle a junção é escrita explicitamente. No Prisma
//     você pede uma relação e a ferramenta decide como buscá-la, então o SQL capturado ao lado
//     deste arquivo é o único jeito de saber se virou um JOIN ou dois comandos separados.

import { asc, eq } from "drizzle-orm";
import { authors, posts } from "../drizzle-schema";
import type { QueryDefinition } from "./types";

export interface PostWithAuthor {
	id: number;
	title: string;
	authorName: string;
}

export const postsWithAuthor: QueryDefinition<[country: string, limit: number], PostWithAuthor[]> = {
	name: "posts-with-author",
	description: "Posts of the authors of one country, with the author name",
	sample: ["BR", 20],
	readOnly: true,

	raw: (context, country, limit) =>
		context.raw.query<{ id: number; title: string; authorName: string }>(
			`SELECT p.id, p.title, a.name AS "authorName"
			 FROM posts p
			 JOIN authors a ON a.id = p.author_id
			 WHERE a.country = $1
			 ORDER BY p.id ASC
			 LIMIT $2`,
			[country, limit],
		),

	prisma: async (context, country, limit) => {
		const rows = await context.prisma.post.findMany({
			where: { author: { country } },
			orderBy: { id: "asc" },
			take: limit,
			select: { id: true, title: true, author: { select: { name: true } } },
		});
		return rows.map((row) => ({ id: row.id, title: row.title, authorName: row.author.name }));
	},

	drizzle: (context, country, limit) =>
		context.drizzle
			.select({ id: posts.id, title: posts.title, authorName: authors.name })
			.from(posts)
			.innerJoin(authors, eq(authors.id, posts.authorId))
			.where(eq(authors.country, country))
			.orderBy(asc(posts.id))
			.limit(limit),
};
