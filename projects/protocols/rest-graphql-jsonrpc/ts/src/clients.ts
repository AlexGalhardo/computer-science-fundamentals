// EN: Three clients with ONE interface. Each method is a thing a screen needs ("the titles of
//     the first 50 books", "this book with its author and reviews"), and each client gets it the
//     way its style allows. The behaviour tests and the benchmark use only the interface, so
//     they cannot tell the styles apart, except by counting requests and bytes.
// PT: Três clientes com UMA interface. Cada método é algo de que uma tela precisa ("os títulos
//     dos 50 primeiros livros", "este livro com autor e resenhas"), e cada cliente o obtém do
//     jeito que o seu estilo permite. Os testes de comportamento e o benchmark usam só a
//     interface, então não distinguem os estilos, exceto contando requisições e bytes.

import { z } from "zod";
import { QUERY_COUNT_HEADER } from "./db";
import type { DomainErrorKind, ReviewInput } from "./domain";
import { RPC_ERROR } from "./jsonrpc";

export const STYLES = ["rest", "graphql", "jsonrpc"] as const;
export type Style = (typeof STYLES)[number];

export interface BookTitle {
	id: number;
	title: string;
}

export interface BookCard {
	id: number;
	title: string;
	year: number;
	pages: number;
}

export interface BookPage {
	id: number;
	title: string;
	author: { name: string };
	reviews: { rating: number; reviewer: string }[];
}

export interface CreatedReview {
	id: number;
	bookId: number;
	rating: number;
}

/** A failure the server reported in the vocabulary of its style, translated back. */
export class ApiError extends Error {
	constructor(
		readonly kind: DomainErrorKind,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export interface ApiClient {
	readonly style: Style;
	readonly meter: Meter;
	/** List read: id and title of the first `limit` books. */
	listTitles(limit: number): Promise<BookTitle[]>;
	/** Detail read: four fields of one book, or null when it does not exist. */
	getCard(id: number): Promise<BookCard | null>;
	/** Nested read: a book, the name of its author and its reviews. */
	getPage(id: number): Promise<BookPage | null>;
	addReview(bookId: number, input: ReviewInput): Promise<CreatedReview>;
}

// EN: What the benchmark compares besides time: how many HTTP round trips a read needed, how
//     many bytes went up and came down in the bodies, and how many SQL statements the server ran.
// PT: O que o benchmark compara além do tempo: quantas idas e voltas HTTP uma leitura precisou,
//     quantos bytes subiram e desceram nos corpos, e quantos comandos SQL o servidor executou.
export interface Meter {
	requests: number;
	requestBytes: number;
	responseBytes: number;
	dbQueries: number;
}

export function emptyMeter(): Meter {
	return { requests: 0, requestBytes: 0, responseBytes: 0, dbQueries: 0 };
}

interface Reply {
	status: number;
	text: string;
	headers: Headers;
}

class Transport {
	meter: Meter = emptyMeter();

	constructor(private readonly baseUrl: string) {}

	async send(method: "GET" | "POST", path: string, body?: unknown): Promise<Reply> {
		const payload = body === undefined ? undefined : JSON.stringify(body);
		const response = await fetch(`${this.baseUrl}${path}`, {
			method,
			headers: payload === undefined ? undefined : { "content-type": "application/json" },
			body: payload,
		});
		const text = await response.text();
		this.meter.requests += 1;
		this.meter.requestBytes += payload === undefined ? 0 : Buffer.byteLength(payload);
		this.meter.responseBytes += Buffer.byteLength(text);
		this.meter.dbQueries += Number(response.headers.get(QUERY_COUNT_HEADER) ?? 0);
		return { status: response.status, text, headers: response.headers };
	}
}

// EN: A response is external input too. Each client validates what it received before using it.
// PT: Uma resposta também é entrada externa. Cada cliente valida o que recebeu antes de usar.
const restBook = z.object({
	id: z.number(),
	authorId: z.number(),
	title: z.string(),
	year: z.number(),
	pages: z.number(),
});
const restAuthor = z.object({ name: z.string() });
const restReview = z.object({ id: z.number(), bookId: z.number(), rating: z.number(), reviewer: z.string() });
const errorBody = z.object({ error: z.string() });

function restFailure(reply: Reply): ApiError | Error {
	const message = errorBody.safeParse(JSON.parse(reply.text)).data?.error ?? reply.text;
	if (reply.status === 404) {
		return new ApiError("not-found", message);
	}
	if (reply.status === 422) {
		return new ApiError("invalid", message);
	}
	return new Error(`unexpected HTTP status ${reply.status}: ${message}`);
}

export class RestClient implements ApiClient {
	readonly style = "rest";
	private readonly transport: Transport;

	constructor(baseUrl: string) {
		this.transport = new Transport(baseUrl);
	}

	get meter(): Meter {
		return this.transport.meter;
	}

	// EN: Over-fetching: the screen wants id and title, the resource returns every field of
	//     every book, including the long summary, and the client throws most of it away.
	// PT: Over-fetching: a tela quer id e título, o recurso devolve todos os campos de todos os
	//     livros, incluindo o resumo longo, e o cliente joga a maior parte fora.
	async listTitles(limit: number): Promise<BookTitle[]> {
		const reply = await this.transport.send("GET", `/rest/books?limit=${limit}`);
		if (reply.status !== 200) {
			throw restFailure(reply);
		}
		return z
			.array(restBook)
			.parse(JSON.parse(reply.text))
			.map((book) => ({ id: book.id, title: book.title }));
	}

	async getCard(id: number): Promise<BookCard | null> {
		const reply = await this.transport.send("GET", `/rest/books/${id}`);
		if (reply.status === 404) {
			return null;
		}
		if (reply.status !== 200) {
			throw restFailure(reply);
		}
		const book = restBook.parse(JSON.parse(reply.text));
		return { id: book.id, title: book.title, year: book.year, pages: book.pages };
	}

	// EN: Under-fetching: one resource is not enough, so the client makes three requests. The
	//     author can only be asked after the book arrived, because the book carries the author id.
	// PT: Under-fetching: um recurso não basta, então o cliente faz três requisições. O autor só
	//     pode ser pedido depois que o livro chegou, porque é o livro que traz o id do autor.
	async getPage(id: number): Promise<BookPage | null> {
		const bookReply = await this.transport.send("GET", `/rest/books/${id}`);
		if (bookReply.status === 404) {
			return null;
		}
		if (bookReply.status !== 200) {
			throw restFailure(bookReply);
		}
		const book = restBook.parse(JSON.parse(bookReply.text));
		const [authorReply, reviewsReply] = await Promise.all([
			this.transport.send("GET", `/rest/authors/${book.authorId}`),
			this.transport.send("GET", `/rest/books/${id}/reviews`),
		]);
		if (authorReply.status !== 200) {
			throw restFailure(authorReply);
		}
		if (reviewsReply.status !== 200) {
			throw restFailure(reviewsReply);
		}
		return {
			id: book.id,
			title: book.title,
			author: { name: restAuthor.parse(JSON.parse(authorReply.text)).name },
			reviews: z
				.array(restReview)
				.parse(JSON.parse(reviewsReply.text))
				.map((review) => ({ rating: review.rating, reviewer: review.reviewer })),
		};
	}

	async addReview(bookId: number, input: ReviewInput): Promise<CreatedReview> {
		const reply = await this.transport.send("POST", `/rest/books/${bookId}/reviews`, input);
		if (reply.status !== 201) {
			throw restFailure(reply);
		}
		const review = restReview.parse(JSON.parse(reply.text));
		return { id: review.id, bookId: review.bookId, rating: review.rating };
	}
}

const graphqlReply = z.object({
	data: z.unknown().optional(),
	errors: z
		.array(z.object({ message: z.string(), extensions: z.object({ code: z.string().optional() }).optional() }))
		.optional(),
});

export class GraphqlClient implements ApiClient {
	readonly style = "graphql";
	private readonly transport: Transport;

	/** @param path `/graphql` (batched) or `/graphql-naive` (N+1 left in) */
	constructor(
		baseUrl: string,
		private readonly path: "/graphql" | "/graphql-naive" = "/graphql",
	) {
		this.transport = new Transport(baseUrl);
	}

	get meter(): Meter {
		return this.transport.meter;
	}

	// EN: Values go in `variables`, never glued into the query text. The query stays a constant
	//     string, and the server checks each variable against its declared type.
	// PT: Os valores vão em `variables`, nunca colados no texto da consulta. A consulta continua
	//     sendo uma string constante, e o servidor confere cada variável contra o tipo declarado.
	async run<T>(schema: z.ZodType<T>, query: string, variables: Record<string, unknown>): Promise<T> {
		const reply = await this.transport.send("POST", this.path, { query, variables });
		const parsed = graphqlReply.parse(JSON.parse(reply.text));
		// EN: The status was 200 either way. The failure is only visible here, inside the body.
		// PT: O status foi 200 de qualquer forma. A falha só é visível aqui, dentro do corpo.
		const failure = parsed.errors?.[0];
		if (failure !== undefined) {
			const code = failure.extensions?.code;
			if (code === "NOT_FOUND") {
				throw new ApiError("not-found", failure.message);
			}
			if (code === "BAD_USER_INPUT") {
				throw new ApiError("invalid", failure.message);
			}
			throw new Error(`GraphQL error: ${failure.message}`);
		}
		return schema.parse(parsed.data);
	}

	async listTitles(limit: number): Promise<BookTitle[]> {
		const data = await this.run(
			z.object({ books: z.array(z.object({ id: z.number(), title: z.string() })) }),
			"query Titles($limit: Int!) { books(limit: $limit) { id title } }",
			{ limit },
		);
		return data.books;
	}

	async getCard(id: number): Promise<BookCard | null> {
		const data = await this.run(
			z.object({
				book: z.object({ id: z.number(), title: z.string(), year: z.number(), pages: z.number() }).nullable(),
			}),
			"query Card($id: Int!) { book(id: $id) { id title year pages } }",
			{ id },
		);
		return data.book;
	}

	// EN: The nested read in one round trip: the query follows the relations, and the answer has
	//     exactly the fields that were asked, in the same shape.
	// PT: A leitura aninhada em uma única ida e volta: a consulta segue as relações, e a resposta
	//     tem exatamente os campos pedidos, no mesmo formato.
	async getPage(id: number): Promise<BookPage | null> {
		const data = await this.run(
			z.object({
				book: z
					.object({
						id: z.number(),
						title: z.string(),
						author: z.object({ name: z.string() }),
						reviews: z.array(z.object({ rating: z.number(), reviewer: z.string() })),
					})
					.nullable(),
			}),
			"query Page($id: Int!) { book(id: $id) { id title author { name } reviews { rating reviewer } } }",
			{ id },
		);
		return data.book;
	}

	async addReview(bookId: number, input: ReviewInput): Promise<CreatedReview> {
		const data = await this.run(
			z.object({ addReview: z.object({ id: z.number(), bookId: z.number(), rating: z.number() }) }),
			"mutation Add($bookId: Int!, $input: ReviewInput!) { addReview(bookId: $bookId, input: $input) { id bookId rating } }",
			{ bookId, input },
		);
		return data.addReview;
	}
}

const rpcReply = z.object({
	jsonrpc: z.literal("2.0"),
	result: z.unknown().optional(),
	error: z.object({ code: z.number(), message: z.string() }).optional(),
	id: z.union([z.string(), z.number(), z.null()]),
});
type RpcReply = z.infer<typeof rpcReply>;

interface RpcCall {
	method: string;
	params: unknown;
}

function rpcResult<T>(schema: z.ZodType<T>, reply: RpcReply | undefined): T {
	if (reply === undefined) {
		throw new Error("the server did not answer one of the calls");
	}
	if (reply.error !== undefined) {
		if (reply.error.code === RPC_ERROR.notFound) {
			throw new ApiError("not-found", reply.error.message);
		}
		if (reply.error.code === RPC_ERROR.invalidParams) {
			throw new ApiError("invalid", reply.error.message);
		}
		throw new Error(`JSON-RPC error ${reply.error.code}: ${reply.error.message}`);
	}
	return schema.parse(reply.result);
}

async function nullWhenMissing<T>(run: () => Promise<T>): Promise<T | null> {
	try {
		return await run();
	} catch (error) {
		if (error instanceof ApiError && error.kind === "not-found") {
			return null;
		}
		throw error;
	}
}

export class JsonRpcClient implements ApiClient {
	readonly style = "jsonrpc";
	private readonly transport: Transport;
	private nextId = 1;

	constructor(baseUrl: string) {
		this.transport = new Transport(baseUrl);
	}

	get meter(): Meter {
		return this.transport.meter;
	}

	private async call(method: string, params: unknown): Promise<RpcReply> {
		const id = this.nextId++;
		const reply = await this.transport.send("POST", "/rpc", { jsonrpc: "2.0", method, params, id });
		return rpcReply.parse(JSON.parse(reply.text));
	}

	// EN: A batch sends several calls in one HTTP request. The answers may come in any order,
	//     so they are matched by `id`, never by position.
	// PT: Um lote envia várias chamadas em uma requisição HTTP. As respostas podem vir em
	//     qualquer ordem, então são casadas pelo `id`, nunca pela posição.
	private async batch(calls: RpcCall[]): Promise<(RpcReply | undefined)[]> {
		const requests = calls.map((call) => ({ jsonrpc: "2.0", ...call, id: this.nextId++ }));
		const reply = await this.transport.send("POST", "/rpc", requests);
		const replies = z.array(rpcReply).parse(JSON.parse(reply.text));
		return requests.map((request) => replies.find((item) => item.id === request.id));
	}

	async listTitles(limit: number): Promise<BookTitle[]> {
		const books = rpcResult(z.array(restBook), await this.call("books.list", { limit }));
		return books.map((book) => ({ id: book.id, title: book.title }));
	}

	async getCard(id: number): Promise<BookCard | null> {
		return nullWhenMissing(async () => {
			const book = rpcResult(restBook, await this.call("books.get", { id }));
			return { id: book.id, title: book.title, year: book.year, pages: book.pages };
		});
	}

	// EN: Two round trips. The book and its reviews fit in one batch, because both need only the
	//     book id. The author cannot join that batch: its id is inside the answer of `books.get`.
	//     A batch saves round trips only between calls that do not depend on each other.
	// PT: Duas idas e voltas. O livro e suas resenhas cabem em um lote, porque ambos só precisam
	//     do id do livro. O autor não pode entrar nesse lote: o id dele está dentro da resposta de
	//     `books.get`. Um lote só economiza idas e voltas entre chamadas que não dependem uma da
	//     outra.
	async getPage(id: number): Promise<BookPage | null> {
		return nullWhenMissing(async () => {
			const [bookReply, reviewsReply] = await this.batch([
				{ method: "books.get", params: { id } },
				{ method: "reviews.listByBook", params: { bookId: id } },
			]);
			const book = rpcResult(restBook, bookReply);
			const reviews = rpcResult(z.array(restReview), reviewsReply);
			const author = rpcResult(restAuthor, await this.call("authors.get", { id: book.authorId }));
			return {
				id: book.id,
				title: book.title,
				author: { name: author.name },
				reviews: reviews.map((review) => ({ rating: review.rating, reviewer: review.reviewer })),
			};
		});
	}

	async addReview(bookId: number, input: ReviewInput): Promise<CreatedReview> {
		const review = rpcResult(restReview, await this.call("reviews.create", { bookId, review: input }));
		return { id: review.id, bookId: review.bookId, rating: review.rating };
	}
}

export function createClient(style: Style, baseUrl: string): ApiClient {
	switch (style) {
		case "rest":
			return new RestClient(baseUrl);
		case "graphql":
			return new GraphqlClient(baseUrl);
		case "jsonrpc":
			return new JsonRpcClient(baseUrl);
	}
}
