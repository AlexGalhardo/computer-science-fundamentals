// EN: The HTTP API of the shop, built with ElysiaJS. Every body and path parameter is validated
//     with Zod before it reaches the checkout code, so an invalid request never opens a
//     transaction.
// PT: A API HTTP da loja, feita com ElysiaJS. Todo corpo e parâmetro de caminho é validado com
//     Zod antes de chegar ao código de checkout, então uma requisição inválida nunca abre uma
//     transação.
// ES: La API HTTP de la tienda, hecha con ElysiaJS. Todo cuerpo y parámetro de ruta se valida con
//     Zod antes de llegar al código de checkout, así que una petición inválida nunca abre una
//     transacción.

import { Elysia } from "elysia";
import type { Pool } from "pg";
import { z } from "zod";
import { checkout, STRATEGIES } from "./checkout";
import { PRODUCT_ID, reset, stats } from "./db";

export interface AppOptions {
	pool: Pool;
	thinkTimeMs: number;
	maxAttempts: number;
}

const checkoutParams = z.object({ strategy: z.enum(STRATEGIES) });
const checkoutBody = z.object({ buyerId: z.string().min(1).max(64) });
const resetBody = z.object({ stock: z.number().int().min(0).max(1_000_000) });

// EN: The status code tells the load test what happened without parsing text: 201 a unit was
//     sold, 409 the product is sold out, 503 the fix gave up after too many conflicts.
// PT: O código de status conta ao teste de carga o que aconteceu sem interpretar texto: 201 uma
//     unidade foi vendida, 409 o produto esgotou, 503 a correção desistiu depois de conflitos demais.
// ES: El código de estado le cuenta a la prueba de carga qué ocurrió sin interpretar texto: 201 se
//     vendió una unidad, 409 el producto se agotó, 503 la corrección desistió tras demasiados conflictos.
const STATUS_CODE = { sold: 201, sold_out: 409, conflict: 503 } as const;

// EN: The return type is left to inference on purpose: Elysia encodes every route, body and
//     response in the type of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota,
//     corpo e resposta no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno queda a cargo de la inferencia a propósito: Elysia codifica cada ruta,
//     cuerpo y respuesta en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createApp(options: AppOptions) {
	return new Elysia()
		.get("/health", () => ({ ok: true }))
		.get("/stats", () => stats(options.pool))
		.post(
			"/admin/reset",
			async ({ body }) => {
				await reset(options.pool, body.stock);
				return stats(options.pool);
			},
			{ body: resetBody },
		)
		.post(
			"/checkout/:strategy",
			async ({ params, body, status }) => {
				const result = await checkout(options.pool, params.strategy, {
					productId: PRODUCT_ID,
					buyerId: body.buyerId,
					thinkTimeMs: options.thinkTimeMs,
					maxAttempts: options.maxAttempts,
				});
				return status(STATUS_CODE[result.status], result);
			},
			{ params: checkoutParams, body: checkoutBody },
		);
}
