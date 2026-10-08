// EN: The domain, written once and used by the three API styles. REST, GraphQL and JSON-RPC are
//     only three ways of carrying the same calls over HTTP: none of them owns the rules. That is
//     what lets one behaviour test suite pass against the three.
// PT: O domínio, escrito uma vez e usado pelos três estilos de API. REST, GraphQL e JSON-RPC são
//     apenas três formas de transportar as mesmas chamadas sobre HTTP: nenhum deles é dono das
//     regras. É isso que permite que uma única suíte de testes de comportamento passe nos três.

import { z } from "zod";
import type { Db } from "./db";

export const authorSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	country: z.string(),
	bio: z.string(),
});
export type Author = z.infer<typeof authorSchema>;

export const bookSchema = z.object({
	id: z.number().int(),
	authorId: z.number().int(),
	title: z.string(),
	year: z.number().int(),
	pages: z.number().int(),
	isbn: z.string(),
	summary: z.string(),
});
export type Book = z.infer<typeof bookSchema>;

export const reviewSchema = z.object({
	id: z.number().int(),
	bookId: z.number().int(),
	rating: z.number().int(),
	reviewer: z.string(),
	text: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;

export const MAX_PAGE_SIZE = 100;

export const pageSchema = z.object({
	limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});
export type Page = z.infer<typeof pageSchema>;

export const reviewInputSchema = z.object({
	rating: z.number().int().min(1).max(5),
	reviewer: z.string().trim().min(1).max(60),
	text: z.string().trim().min(1).max(2000),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const idSchema = z.coerce.number().int().min(1);

// EN: The two ways a call can fail for a reason the client caused. Each style translates them
//     into its own vocabulary: REST into 404 and 422, GraphQL into an entry of `errors` with a
//     code, JSON-RPC into an error object with a numeric code.
// PT: As duas formas de uma chamada falhar por um motivo causado pelo cliente. Cada estilo as
//     traduz para o seu vocabulário: REST em 404 e 422, GraphQL em um item de `errors` com um
//     código, JSON-RPC em um objeto de erro com um código numérico.
export type DomainErrorKind = "not-found" | "invalid";

export class DomainError extends Error {
	constructor(
		readonly kind: DomainErrorKind,
		message: string,
	) {
		super(message);
		this.name = "DomainError";
	}
}

/** Parses external input and turns a schema failure into a domain error. */
export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
	const parsed = schema.safeParse(value);
	if (!parsed.success) {
		throw new DomainError("invalid", parsed.error.issues.map((issue) => issue.message).join("; "));
	}
	return parsed.data;
}

const BOOK_COLUMNS = 'id, author_id AS "authorId", title, year, pages, isbn, summary';
const REVIEW_COLUMNS = 'id, book_id AS "bookId", rating, reviewer, body AS text';

export async function listBooks(db: Db, page: Page): Promise<Book[]> {
	return db.query(bookSchema, `SELECT ${BOOK_COLUMNS} FROM books ORDER BY id LIMIT $1 OFFSET $2`, [
		page.limit,
		page.offset,
	]);
}

export async function findBook(db: Db, id: number): Promise<Book | null> {
	const rows = await db.query(bookSchema, `SELECT ${BOOK_COLUMNS} FROM books WHERE id = $1`, [id]);
	return rows[0] ?? null;
}

export async function findAuthor(db: Db, id: number): Promise<Author | null> {
	const rows = await db.query(authorSchema, "SELECT id, name, country, bio FROM authors WHERE id = $1", [id]);
	return rows[0] ?? null;
}

export async function listReviewsOfBook(db: Db, bookId: number): Promise<Review[]> {
	return db.query(reviewSchema, `SELECT ${REVIEW_COLUMNS} FROM reviews WHERE book_id = $1 ORDER BY id`, [bookId]);
}

export async function listBooksOfAuthor(db: Db, authorId: number): Promise<Book[]> {
	return db.query(bookSchema, `SELECT ${BOOK_COLUMNS} FROM books WHERE author_id = $1 ORDER BY id`, [authorId]);
}

// EN: The batched versions: one statement for many keys (`= ANY($1)`), with the rows grouped in
//     memory afterwards. They are what the loader of the GraphQL layer calls to fix N+1.
// PT: As versões em lote: um comando para muitas chaves (`= ANY($1)`), com as linhas agrupadas em
//     memória depois. São elas que o loader da camada GraphQL chama para corrigir o N+1.
export async function findAuthorsByIds(db: Db, ids: readonly number[]): Promise<Map<number, Author>> {
	const rows = await db.query(authorSchema, "SELECT id, name, country, bio FROM authors WHERE id = ANY($1::int[])", [
		[...ids],
	]);
	return new Map(rows.map((author) => [author.id, author]));
}

export async function listReviewsOfBooks(db: Db, bookIds: readonly number[]): Promise<Map<number, Review[]>> {
	const rows = await db.query(
		reviewSchema,
		`SELECT ${REVIEW_COLUMNS} FROM reviews WHERE book_id = ANY($1::int[]) ORDER BY id`,
		[[...bookIds]],
	);
	const grouped = new Map<number, Review[]>();
	for (const review of rows) {
		const list = grouped.get(review.bookId) ?? [];
		list.push(review);
		grouped.set(review.bookId, list);
	}
	return grouped;
}

export async function getBook(db: Db, id: number): Promise<Book> {
	const book = await findBook(db, id);
	if (book === null) {
		throw new DomainError("not-found", `book ${id} does not exist`);
	}
	return book;
}

export async function getAuthor(db: Db, id: number): Promise<Author> {
	const author = await findAuthor(db, id);
	if (author === null) {
		throw new DomainError("not-found", `author ${id} does not exist`);
	}
	return author;
}

export async function addReview(db: Db, bookId: number, input: ReviewInput): Promise<Review> {
	await getBook(db, bookId);
	const rows = await db.query(
		reviewSchema,
		`INSERT INTO reviews (book_id, rating, reviewer, body) VALUES ($1, $2, $3, $4) RETURNING ${REVIEW_COLUMNS}`,
		[bookId, input.rating, input.reviewer, input.text],
	);
	const review = rows[0];
	if (review === undefined) {
		throw new Error("INSERT ... RETURNING returned no row");
	}
	return review;
}
