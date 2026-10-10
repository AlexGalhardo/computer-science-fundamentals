// EN: Query 5, a transaction with two writes: a post and its first comment. Either both rows
//     exist afterwards or neither does (atomicity). In all three approaches the rule is the
//     same: every statement of the transaction must go through the transaction handle (`tx`).
//     A statement sent through the global client runs on another connection, outside the
//     transaction, and would survive a rollback.
// PT: Consulta 5, uma transação com duas escritas: um post e o seu primeiro comentário. Ou as duas
//     linhas existem depois, ou nenhuma existe (atomicidade). Nas três abordagens a regra é a
//     mesma: todo comando da transação precisa passar pelo identificador da transação (`tx`).
//     Um comando enviado pelo cliente global roda em outra conexão, fora da transação, e
//     sobreviveria a um rollback.
// ES: Consulta 5, una transacción con dos escrituras: un post y su primer comentario. O las dos
//     filas existen después, o ninguna existe (atomicidad). En los tres enfoques la regla es la
//     misma: toda sentencia de la transacción debe pasar por el manejador de la transacción (`tx`).
//     Una sentencia enviada por el cliente global se ejecuta en otra conexión, fuera de la
//     transacción, y sobreviviría a un rollback.

import { comments, posts } from "../drizzle-schema";
import type { QueryDefinition } from "./types";

export interface CreatedPost {
	postId: number;
	authorId: number;
	title: string;
	views: number;
	published: boolean;
	comment: string;
}

type Args = [authorId: number, title: string, comment: string];

export const addPostWithComment: QueryDefinition<Args, CreatedPost> = {
	name: "add-post-with-comment",
	description: "Insert a post and its first comment in one transaction",
	sample: [1, "A fake new post", "A fake first comment"],
	readOnly: false,

	raw: (context, authorId, title, comment) =>
		context.raw.transaction(async (tx) => {
			const [post] = await tx.query<{ id: number; views: number; published: boolean }>(
				"INSERT INTO posts (author_id, title) VALUES ($1, $2) RETURNING id, views, published",
				[authorId, title],
			);
			if (post === undefined) {
				throw new Error("the post was not inserted");
			}
			await tx.query("INSERT INTO comments (post_id, body) VALUES ($1, $2)", [post.id, comment]);
			return { postId: post.id, authorId, title, views: post.views, published: post.published, comment };
		}),

	prisma: (context, authorId, title, comment) =>
		context.prisma.$transaction(async (tx) => {
			const post = await tx.post.create({
				data: { authorId, title },
				select: { id: true, views: true, published: true },
			});
			await tx.comment.create({ data: { postId: post.id, body: comment }, select: { id: true } });
			return { postId: post.id, authorId, title, views: post.views, published: post.published, comment };
		}),

	drizzle: (context, authorId, title, comment) =>
		context.drizzle.transaction(async (tx) => {
			const [post] = await tx
				.insert(posts)
				.values({ authorId, title })
				.returning({ id: posts.id, views: posts.views, published: posts.published });
			if (post === undefined) {
				throw new Error("the post was not inserted");
			}
			await tx.insert(comments).values({ postId: post.id, body: comment });
			return { postId: post.id, authorId, title, views: post.views, published: post.published, comment };
		}),
};
