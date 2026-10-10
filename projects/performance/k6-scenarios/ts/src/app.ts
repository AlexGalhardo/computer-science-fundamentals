// EN: The HTTP API, built with ElysiaJS: a product lookup that costs one database query, and a
//     `/stats` route that shows the state of the connection pool while the load test runs.
// PT: A API HTTP, feita com ElysiaJS: uma consulta de produto que custa uma consulta ao banco, e
//     uma rota `/stats` que mostra o estado do pool de conexões enquanto o teste de carga roda.
// ES: La API HTTP, hecha con ElysiaJS: una consulta de producto que cuesta una consulta a la base de
//     datos, y una ruta `/stats` que muestra el estado del pool de conexiones mientras corre la
//     prueba de carga.

import { Elysia } from "elysia";
import type { Pool } from "pg";
import { z } from "zod";
import { findProduct, PoolTimeoutError } from "./db";

export interface AppOptions {
	pool: Pool;
	poolSize: number;
	queryMs: number;
	poolWaitMs: number;
}

// EN: The path parameter comes from the network, so it is validated before it reaches the database.
// PT: O parâmetro de caminho vem da rede, então é validado antes de chegar ao banco.
// ES: El parámetro de la ruta viene de la red, así que se valida antes de llegar a la base de datos.
const productParams = z.object({ id: z.coerce.number().int().min(1).max(1_000_000) });

// EN: The return type is left to inference on purpose: Elysia encodes every route and response in
//     the type of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota e
//     resposta no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta y respuesta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createApp(options: AppOptions) {
	let shed = 0;
	return (
		new Elysia()
			.get("/health", () => ({ ok: true }))
			// EN: `waiting` is the length of the queue for a connection right now. With a pool that
			//     is large enough it stays at zero. `shed` counts the requests that gave up waiting.
			// PT: `waiting` é o tamanho da fila por uma conexão neste instante. Com um pool grande o
			//     bastante ele fica em zero. `shed` conta as requisições que desistiram de esperar.
			// ES: `waiting` es el tamaño de la cola por una conexión en este instante. Con un pool lo
			//     bastante grande se queda en cero. `shed` cuenta las solicitudes que desistieron de esperar.
			.get("/stats", () => ({
				poolSize: options.poolSize,
				queryMs: options.queryMs,
				poolWaitMs: options.poolWaitMs,
				open: options.pool.totalCount,
				idle: options.pool.idleCount,
				waiting: options.pool.waitingCount,
				shed,
			}))
			.get(
				"/products/:id",
				async ({ params, status }) => {
					try {
						const product = await findProduct(options.pool, params.id, options.queryMs, options.poolWaitMs);
						return product === undefined ? status(404, { error: "product not found" }) : product;
					} catch (error) {
						if (error instanceof PoolTimeoutError) {
							shed++;
							return status(503, { error: error.message });
						}
						throw error;
					}
				},
				{ params: productParams },
			)
	);
}
