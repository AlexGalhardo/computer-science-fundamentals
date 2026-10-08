// EN: The REST style. The URL names a resource (a noun), the HTTP method says what to do with it
//     and the HTTP status code carries the outcome. The server decides the shape of each
//     representation: `GET /rest/books/7` always returns the whole book, wanted or not.
// PT: O estilo REST. A URL nomeia um recurso (um substantivo), o método HTTP diz o que fazer com
//     ele e o código de status HTTP carrega o resultado. O servidor decide o formato de cada
//     representação: `GET /rest/books/7` sempre devolve o livro inteiro, queira o cliente ou não.

import { type AnyElysia, Elysia } from "elysia";
import type { Pool } from "pg";
import { Db, QUERY_COUNT_HEADER } from "./db";
import {
	addReview,
	DomainError,
	getAuthor,
	getBook,
	idSchema,
	listBooks,
	listBooksOfAuthor,
	listReviewsOfBook,
	pageSchema,
	parseInput,
	reviewInputSchema,
} from "./domain";

interface ResponseSettings {
	status?: number | string;
	headers: Record<string, string | number | undefined>;
}

// EN: The translation table of this style: a domain error becomes an HTTP status code. 404 says
//     the resource named by the URL does not exist, 422 says the request was understood and its
//     content breaks a rule. A generic HTTP client, proxy or cache understands both without
//     reading the body.
// PT: A tabela de tradução deste estilo: um erro de domínio vira um código de status HTTP. 404
//     diz que o recurso nomeado pela URL não existe, 422 diz que a requisição foi entendida e o
//     conteúdo quebra uma regra. Um cliente HTTP genérico, um proxy ou um cache entende os dois
//     sem ler o corpo.
const STATUS_OF = { "not-found": 404, invalid: 422 } as const;

async function respond<T>(
	pool: Pool,
	set: ResponseSettings,
	run: (db: Db) => Promise<T>,
): Promise<T | { error: string }> {
	const db = new Db(pool);
	try {
		return await run(db);
	} catch (error) {
		if (error instanceof DomainError) {
			set.status = STATUS_OF[error.kind];
			return { error: error.message };
		}
		throw error;
	} finally {
		set.headers[QUERY_COUNT_HEADER] = String(db.queries);
	}
}

export function restRoutes(pool: Pool): AnyElysia {
	return (
		new Elysia({ prefix: "/rest" })
			.get("/books", ({ query, set }) => respond(pool, set, (db) => listBooks(db, parseInput(pageSchema, query))))
			.get("/books/:id", ({ params, set }) =>
				respond(pool, set, (db) => getBook(db, parseInput(idSchema, params.id))),
			)
			// EN: A sub-resource: the reviews "belong to" the book in the URL. To show a book with
			//     its author and reviews a client needs three requests (book, author, reviews).
			//     That is under-fetching, the other side of fixed representations.
			// PT: Um sub-recurso: as resenhas "pertencem" ao livro na URL. Para mostrar um livro
			//     com autor e resenhas um cliente precisa de três requisições (livro, autor,
			//     resenhas). Isso é under-fetching, o outro lado das representações fixas.
			.get("/books/:id/reviews", ({ params, set }) =>
				respond(pool, set, async (db) => {
					const book = await getBook(db, parseInput(idSchema, params.id));
					return listReviewsOfBook(db, book.id);
				}),
			)
			.post("/books/:id/reviews", ({ params, body, set }) =>
				respond(pool, set, async (db) => {
					const bookId = parseInput(idSchema, params.id);
					const review = await addReview(db, bookId, parseInput(reviewInputSchema, body));
					// EN: Creation answers 201 Created and points at the new resource in Location.
					// PT: Uma criação responde 201 Created e aponta o novo recurso em Location.
					set.status = 201;
					set.headers.location = `/rest/books/${bookId}/reviews/${review.id}`;
					return review;
				}),
			)
			.get("/authors/:id", ({ params, set }) =>
				respond(pool, set, (db) => getAuthor(db, parseInput(idSchema, params.id))),
			)
			.get("/authors/:id/books", ({ params, set }) =>
				respond(pool, set, async (db) => {
					const author = await getAuthor(db, parseInput(idSchema, params.id));
					return listBooksOfAuthor(db, author.id);
				}),
			)
	);
}
