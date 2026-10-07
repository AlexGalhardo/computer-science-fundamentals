// EN: Query 2, filter, sort and limit. The second sort key (id) matters: without a tie-breaker,
//     two posts with the same number of views could come back in any order, and the three
//     approaches could disagree while all being "correct".
// PT: Consulta 2, filtro, ordenação e limite. A segunda chave de ordenação (id) importa: sem um
//     critério de desempate, dois posts com o mesmo número de views poderiam voltar em qualquer
//     ordem, e as três abordagens poderiam discordar estando todas "certas".

import { asc, desc, eq } from "drizzle-orm";
import { posts } from "../drizzle-schema";
import type { QueryDefinition } from "./types";

export interface PostSummary {
	id: number;
	title: string;
	views: number;
}

export const topPosts: QueryDefinition<[limit: number], PostSummary[]> = {
	name: "top-posts",
	description: "The most viewed published posts",
	sample: [10],
	readOnly: true,

	raw: (context, limit) =>
		context.raw.query<{ id: number; title: string; views: number }>(
			"SELECT id, title, views FROM posts WHERE published ORDER BY views DESC, id ASC LIMIT $1",
			[limit],
		),

	prisma: (context, limit) =>
		context.prisma.post.findMany({
			where: { published: true },
			orderBy: [{ views: "desc" }, { id: "asc" }],
			take: limit,
			select: { id: true, title: true, views: true },
		}),

	drizzle: (context, limit) =>
		context.drizzle
			.select({ id: posts.id, title: posts.title, views: posts.views })
			.from(posts)
			.where(eq(posts.published, true))
			.orderBy(desc(posts.views), asc(posts.id))
			.limit(limit),
};
