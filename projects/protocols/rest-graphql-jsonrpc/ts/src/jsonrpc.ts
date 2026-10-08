// EN: The JSON-RPC 2.0 style. One endpoint, and the body names a procedure and its parameters:
//     { "jsonrpc": "2.0", "method": "books.get", "params": { "id": 7 }, "id": 1 }.
//     HTTP is only the pipe. The outcome is in the body (`result` or `error`, never both), so the
//     HTTP status stays 200 even for "book not found".
// PT: O estilo JSON-RPC 2.0. Um endpoint, e o corpo nomeia um procedimento e seus parâmetros:
//     { "jsonrpc": "2.0", "method": "books.get", "params": { "id": 7 }, "id": 1 }.
//     O HTTP é só o cano. O resultado está no corpo (`result` ou `error`, nunca os dois), então o
//     status HTTP continua 200 até para "livro não encontrado".

import { type AnyElysia, Elysia } from "elysia";
import type { Pool } from "pg";
import { z } from "zod";
import { Db, QUERY_COUNT_HEADER } from "./db";
import {
	addReview,
	DomainError,
	getAuthor,
	getBook,
	listBooks,
	listReviewsOfBook,
	pageSchema,
	parseInput,
	reviewInputSchema,
} from "./domain";

// EN: The codes from -32768 to -32000 are reserved by the specification. The first five are
//     predefined. -32000 to -32099 is the range left for the server, used here for "not found".
// PT: Os códigos de -32768 a -32000 são reservados pela especificação. Os cinco primeiros são
//     predefinidos. De -32000 a -32099 é a faixa deixada para o servidor, usada aqui para "não
//     encontrado".
export const RPC_ERROR = {
	parseError: -32700,
	invalidRequest: -32600,
	methodNotFound: -32601,
	invalidParams: -32602,
	internalError: -32603,
	notFound: -32004,
} as const;

type RpcId = string | number | null;

interface RpcResponse {
	jsonrpc: "2.0";
	result?: unknown;
	error?: { code: number; message: string };
	id: RpcId;
}

const requestSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.string().min(1),
	params: z.unknown().optional(),
	id: z.union([z.string(), z.number(), z.null()]).optional(),
});

const idParams = z.object({ id: z.number().int().min(1) });
const bookIdParams = z.object({ bookId: z.number().int().min(1) });
const createReviewParams = z.object({ bookId: z.number().int().min(1), review: z.unknown() });

// EN: The whole API is this table: a procedure name and a function. Adding a capability means
//     adding a row, with no URL or HTTP method to design. The cost is that nothing generic
//     (a cache, a proxy, a browser) can tell that `books.get` is a safe read.
// PT: A API inteira é esta tabela: um nome de procedimento e uma função. Acrescentar uma
//     capacidade é acrescentar uma linha, sem URL nem método HTTP para projetar. O custo é que
//     nada genérico (um cache, um proxy, um navegador) sabe que `books.get` é uma leitura segura.
const METHODS: Record<string, (db: Db, params: unknown) => Promise<unknown>> = {
	"books.list": (db, params) => listBooks(db, parseInput(pageSchema, params ?? {})),
	"books.get": (db, params) => getBook(db, parseInput(idParams, params).id),
	"authors.get": (db, params) => getAuthor(db, parseInput(idParams, params).id),
	"reviews.listByBook": async (db, params) => {
		const book = await getBook(db, parseInput(bookIdParams, params).bookId);
		return listReviewsOfBook(db, book.id);
	},
	"reviews.create": (db, params) => {
		const { bookId, review } = parseInput(createReviewParams, params);
		return addReview(db, bookId, parseInput(reviewInputSchema, review));
	},
};

function failure(id: RpcId, code: number, message: string): RpcResponse {
	return { jsonrpc: "2.0", error: { code, message }, id };
}

// EN: Handles one request object. Returns `null` for a notification: a request without `id`
//     tells the server that the client does not want any answer, not even an error.
// PT: Trata um objeto de requisição. Devolve `null` para uma notificação: uma requisição sem `id`
//     diz ao servidor que o cliente não quer resposta nenhuma, nem mesmo um erro.
async function handleOne(db: Db, raw: unknown): Promise<RpcResponse | null> {
	const parsed = requestSchema.safeParse(raw);
	if (!parsed.success) {
		return failure(null, RPC_ERROR.invalidRequest, "Invalid Request");
	}
	const { method, params, id } = parsed.data;
	const isNotification = id === undefined;
	const procedure = Object.hasOwn(METHODS, method) ? METHODS[method] : undefined;
	let response: RpcResponse;
	if (procedure === undefined) {
		response = failure(id ?? null, RPC_ERROR.methodNotFound, `Method not found: ${method}`);
	} else {
		try {
			response = { jsonrpc: "2.0", result: await procedure(db, params), id: id ?? null };
		} catch (error) {
			if (error instanceof DomainError) {
				const code = error.kind === "not-found" ? RPC_ERROR.notFound : RPC_ERROR.invalidParams;
				response = failure(id ?? null, code, error.message);
			} else {
				response = failure(id ?? null, RPC_ERROR.internalError, "Internal error");
			}
		}
	}
	return isNotification ? null : response;
}

export function jsonRpcRoutes(pool: Pool): AnyElysia {
	return new Elysia().post(
		"/rpc",
		async ({ request, set }) => {
			const db = new Db(pool);
			set.headers["content-type"] = "application/json";
			let payload: unknown;
			try {
				payload = JSON.parse(await request.text());
			} catch {
				// EN: The body is not JSON at all, so there is no `id` to echo: the answer uses null.
				// PT: O corpo nem é JSON, então não há `id` para ecoar: a resposta usa null.
				return failure(null, RPC_ERROR.parseError, "Parse error");
			}
			try {
				if (!Array.isArray(payload)) {
					const response = await handleOne(db, payload);
					if (response === null) {
						set.status = 204;
						return "";
					}
					return response;
				}
				// EN: A batch is an array of requests in one HTTP round trip. The answers come
				//     back in an array too, in any order, so the client matches them by `id`.
				//     Notifications inside the batch produce no entry.
				// PT: Um lote é um array de requisições em uma única ida e volta HTTP. As
				//     respostas também voltam em um array, em qualquer ordem, então o cliente as
				//     casa pelo `id`. Notificações dentro do lote não geram item.
				if (payload.length === 0) {
					return failure(null, RPC_ERROR.invalidRequest, "Invalid Request");
				}
				const responses = (await Promise.all(payload.map((item: unknown) => handleOne(db, item)))).filter(
					(item) => item !== null,
				);
				if (responses.length === 0) {
					set.status = 204;
					return "";
				}
				return responses;
			} finally {
				set.headers[QUERY_COUNT_HEADER] = String(db.queries);
			}
		},
		// EN: The body is read as raw text so that broken JSON becomes the -32700 error of the
		//     protocol, not a generic HTTP 400 of the framework.
		// PT: O corpo é lido como texto cru para que um JSON quebrado vire o erro -32700 do
		//     protocolo, e não um HTTP 400 genérico do framework.
		{ parse: "none" },
	);
}
