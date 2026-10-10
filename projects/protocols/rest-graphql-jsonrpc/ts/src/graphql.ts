// EN: The GraphQL style. One endpoint, one typed schema, and the CLIENT lists the fields it
//     wants. The server walks the query field by field and calls a resolver for each one. That
//     freedom has a price shown here: a resolver that fetches one row is called once per item
//     of a list, which is the N+1 problem. `/graphql-naive` leaves it in, `/graphql` fixes it
//     with batching.
// PT: O estilo GraphQL. Um endpoint, um schema tipado, e o CLIENTE lista os campos que quer. O
//     servidor percorre a consulta campo a campo e chama um resolver para cada um. Essa liberdade
//     tem um preço mostrado aqui: um resolver que busca uma linha é chamado uma vez por item de
//     uma lista, que é o problema N+1. `/graphql-naive` deixa o problema, `/graphql` o corrige
//     com agrupamento em lote.
// ES: El estilo GraphQL. Un endpoint, un schema tipado, y el CLIENTE lista los campos que quiere. El
//     servidor recorre la consulta campo por campo y llama a un resolver para cada uno. Esa libertad
//     tiene un precio que se muestra aquí: un resolver que busca una fila se llama una vez por elemento de
//     una lista, que es el problema N+1. `/graphql-naive` deja el problema, `/graphql` lo corrige
//     con agrupación en lotes.

import { type AnyElysia, Elysia } from "elysia";
import { buildSchema, GraphQLError, graphql } from "graphql";
import type { Pool } from "pg";
import { z } from "zod";
import { Db, QUERY_COUNT_HEADER } from "./db";
import {
	type Author,
	addReview,
	type Book,
	DomainError,
	findAuthor,
	findAuthorsByIds,
	findBook,
	listBooks,
	listBooksOfAuthor,
	listReviewsOfBook,
	listReviewsOfBooks,
	pageSchema,
	parseInput,
	type Review,
	reviewInputSchema,
} from "./domain";
import { BatchLoader } from "./loader";

// EN: The schema is the contract. `!` means non-null: `book(id: 999)` may answer null, while
//     `books` always answers a list with no null inside.
// PT: O schema é o contrato. `!` significa não nulo: `book(id: 999)` pode responder null, enquanto
//     `books` sempre responde uma lista sem null dentro.
// ES: El schema es el contrato. `!` significa no nulo: `book(id: 999)` puede responder null, mientras que
//     `books` siempre responde una lista sin null dentro.
export const SCHEMA_SDL = `
type Author {
	id: Int!
	name: String!
	country: String!
	bio: String!
	books: [Book!]!
}

type Book {
	id: Int!
	title: String!
	year: Int!
	pages: Int!
	isbn: String!
	summary: String!
	author: Author!
	reviews: [Review!]!
}

type Review {
	id: Int!
	bookId: Int!
	rating: Int!
	reviewer: String!
	text: String!
}

input ReviewInput {
	rating: Int!
	reviewer: String!
	text: String!
}

type Query {
	books(limit: Int = 20, offset: Int = 0): [Book!]!
	book(id: Int!): Book
	author(id: Int!): Author
}

type Mutation {
	addReview(bookId: Int!, input: ReviewInput!): Review!
}
`;

const schema = buildSchema(SCHEMA_SDL);

interface Loaders {
	author: BatchLoader<number, Author | null>;
	reviews: BatchLoader<number, Review[]>;
}

interface Context {
	db: Db;
	/** `null` on the naive endpoint: every resolver goes to the database on its own. */
	loaders: Loaders | null;
}

// EN: The loaders are created per request. Their cache must not outlive the request, or one
//     client would read rows cached for another.
// PT: Os loaders são criados por requisição. O cache deles não pode viver mais que a requisição,
//     ou um cliente leria linhas guardadas para outro.
// ES: Los loaders se crean por petición. Su caché no puede vivir más que la petición,
//     o un cliente leería filas guardadas para otro.
function createLoaders(db: Db): Loaders {
	return {
		author: new BatchLoader<number, Author | null>(
			(ids) => findAuthorsByIds(db, ids),
			() => null,
		),
		reviews: new BatchLoader<number, Review[]>(
			(bookIds) => listReviewsOfBooks(db, bookIds),
			() => [],
		),
	};
}

// EN: graphql-js resolves a field by reading the property of the same name on the parent object,
//     and calls it when it is a function. So a "node" is the database row plus one function per
//     relation. Scalar fields (title, year) need no code at all.
// PT: O graphql-js resolve um campo lendo a propriedade de mesmo nome no objeto pai, e a chama
//     quando é uma função. Então um "nó" é a linha do banco mais uma função por relação. Campos
//     escalares (title, year) não precisam de código nenhum.
// ES: graphql-js resuelve un campo leyendo la propiedad del mismo nombre en el objeto padre, y la llama
//     cuando es una función. Entonces un "nodo" es la fila de la base de datos más una función por relación. Los campos
//     escalares (title, year) no necesitan código alguno.
type Resolver<T> = (args: unknown, context: Context) => Promise<T>;

interface AuthorNode extends Author {
	books: Resolver<BookNode[]>;
}

interface BookNode extends Book {
	author: Resolver<AuthorNode>;
	reviews: Resolver<Review[]>;
}

function authorNode(author: Author): AuthorNode {
	return {
		...author,
		books: async (_args, context) => (await listBooksOfAuthor(context.db, author.id)).map(bookNode),
	};
}

function bookNode(book: Book): BookNode {
	return {
		...book,
		// EN: The line where N+1 is born or avoided. For a list of 100 books this function runs
		//     100 times. Without loaders that is 100 `SELECT ... WHERE id = $1`. With loaders the
		//     100 calls only register a key, and one `WHERE id = ANY(...)` answers all of them.
		// PT: A linha em que o N+1 nasce ou é evitado. Para uma lista de 100 livros esta função
		//     roda 100 vezes. Sem loaders são 100 `SELECT ... WHERE id = $1`. Com loaders as 100
		//     chamadas só registram uma chave, e um único `WHERE id = ANY(...)` responde todas.
		// ES: La línea donde el N+1 nace o se evita. Para una lista de 100 libros esta función
		//     se ejecuta 100 veces. Sin loaders son 100 `SELECT ... WHERE id = $1`. Con loaders las 100
		//     llamadas solo registran una clave, y un único `WHERE id = ANY(...)` responde a todas.
		author: async (_args, context) => {
			const author =
				context.loaders === null
					? await findAuthor(context.db, book.authorId)
					: await context.loaders.author.load(book.authorId);
			if (author === null) {
				throw new Error(`book ${book.id} points at a missing author`);
			}
			return authorNode(author);
		},
		reviews: (_args, context) =>
			context.loaders === null ? listReviewsOfBook(context.db, book.id) : context.loaders.reviews.load(book.id),
	};
}

// EN: GraphQL has no status codes of its own. An error is an entry in the `errors` list of the
//     response, and by convention a machine-readable code goes in `extensions.code`.
// PT: O GraphQL não tem códigos de status próprios. Um erro é um item na lista `errors` da
//     resposta, e por convenção um código legível por máquina vai em `extensions.code`.
// ES: GraphQL no tiene códigos de estado propios. Un error es un elemento en la lista `errors` de la
//     respuesta, y por convención un código legible por máquina va en `extensions.code`.
const CODE_OF = { "not-found": "NOT_FOUND", invalid: "BAD_USER_INPUT" } as const;

async function translate<T>(run: () => Promise<T>): Promise<T> {
	try {
		return await run();
	} catch (error) {
		if (error instanceof DomainError) {
			throw new GraphQLError(error.message, { extensions: { code: CODE_OF[error.kind] } });
		}
		throw error;
	}
}

const idArgs = z.object({ id: z.number().int() });
const addReviewArgs = z.object({ bookId: z.number().int(), input: z.unknown() });

const rootValue = {
	books: (args: unknown, context: Context): Promise<BookNode[]> =>
		translate(async () => (await listBooks(context.db, parseInput(pageSchema, args))).map(bookNode)),
	book: (args: unknown, context: Context): Promise<BookNode | null> =>
		translate(async () => {
			const book = await findBook(context.db, parseInput(idArgs, args).id);
			return book === null ? null : bookNode(book);
		}),
	author: (args: unknown, context: Context): Promise<AuthorNode | null> =>
		translate(async () => {
			const author = await findAuthor(context.db, parseInput(idArgs, args).id);
			return author === null ? null : authorNode(author);
		}),
	addReview: (args: unknown, context: Context): Promise<Review> =>
		translate(async () => {
			const { bookId, input } = parseInput(addReviewArgs, args);
			return addReview(context.db, bookId, parseInput(reviewInputSchema, input));
		}),
};

const requestSchema = z.object({
	query: z.string().min(1),
	variables: z.record(z.string(), z.unknown()).nullish(),
	operationName: z.string().nullish(),
});

export function graphqlRoutes(pool: Pool): AnyElysia {
	const handler =
		(batching: boolean) =>
		async ({
			body,
			set,
		}: {
			body: unknown;
			set: { status?: number | string; headers: Record<string, string | number | undefined> };
		}): Promise<unknown> => {
			const parsed = requestSchema.safeParse(body);
			if (!parsed.success) {
				set.status = 400;
				return { errors: [{ message: "the body must be JSON with a non-empty `query` string" }] };
			}
			const db = new Db(pool);
			// EN: Note what does NOT happen below: no status code is chosen. By the usual
			//     GraphQL-over-HTTP convention a well-formed request answers 200 even when the
			//     operation failed, and the client must look inside `errors`.
			// PT: Repare no que NÃO acontece abaixo: nenhum código de status é escolhido. Pela
			//     convenção usual de GraphQL sobre HTTP uma requisição bem formada responde 200
			//     mesmo quando a operação falhou, e o cliente precisa olhar dentro de `errors`.
			// ES: Fíjate en lo que NO ocurre abajo: no se elige ningún código de estado. Por la
			//     convención usual de GraphQL sobre HTTP una petición bien formada responde 200
			//     incluso cuando la operación falló, y el cliente debe mirar dentro de `errors`.
			const result = await graphql({
				schema,
				source: parsed.data.query,
				rootValue,
				contextValue: { db, loaders: batching ? createLoaders(db) : null } satisfies Context,
				variableValues: parsed.data.variables ?? undefined,
				operationName: parsed.data.operationName ?? undefined,
			});
			set.headers[QUERY_COUNT_HEADER] = String(db.queries);
			return result;
		};

	return new Elysia().post("/graphql", handler(true)).post("/graphql-naive", handler(false));
}
