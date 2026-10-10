// EN: The HTTP API of the lab, built with ElysiaJS. Every body and path parameter is validated
//     with Zod before it reaches the cache or the database.
// PT: A API HTTP do laboratório, feita com ElysiaJS. Todo corpo e parâmetro de caminho é
//     validado com Zod antes de chegar ao cache ou ao banco.
// ES: La API HTTP del laboratorio, hecha con ElysiaJS. Todo cuerpo y parámetro de ruta se
//     valida con Zod antes de llegar al caché o a la base de datos.

import { Elysia } from "elysia";
import { z } from "zod";
import type { Cache } from "./cache";
import { type Settings, settingsSchema } from "./config";
import type { Database } from "./db";
import { HOT_PRODUCT_ID, HotKey, MODES, StampedeError, type StampedeStats } from "./stampede";
import { ProductStore, STRATEGIES } from "./strategies";

export interface Lab {
	db: Database;
	cache: Cache;
	settings: Settings;
	store: ProductStore;
	hot: HotKey;
}

export interface Stats {
	settings: Settings;
	hits: number;
	misses: number;
	writes: number;
	dbReads: number;
	dbWrites: number;
	dbRowsWritten: number;
	stampede: StampedeStats;
}

export function createLab(db: Database, cache: Cache): Lab {
	const settings = settingsSchema.parse({});
	return {
		db,
		cache,
		settings,
		store: new ProductStore(db, cache, settings),
		hot: new HotKey(db, cache, settings),
	};
}

export function resetCounters(lab: Lab): void {
	lab.db.resetCounters();
	lab.store.resetCounters();
	lab.hot.reset();
}

/** Empties Redis, recreates the products and applies the settings of the next experiment. */
export async function resetLab(lab: Lab, settings: Partial<Settings> = {}): Promise<void> {
	// EN: The settings object is shared by reference with the store and the hot key, so it is
	//     updated in place.
	// PT: O objeto de configurações é compartilhado por referência com o store e a chave quente,
	//     então é atualizado no lugar.
	// ES: El objeto de configuración se comparte por referencia con el store y la clave caliente,
	//     así que se actualiza en el lugar.
	Object.assign(lab.settings, settingsSchema.parse(settings));
	await lab.store.flush();
	await lab.cache.flushAll();
	await lab.db.seed(Math.max(lab.settings.products, HOT_PRODUCT_ID));
	resetCounters(lab);
}

export function stats(lab: Lab): Stats {
	return {
		settings: { ...lab.settings },
		hits: lab.store.counters.hits,
		misses: lab.store.counters.misses,
		writes: lab.store.counters.writes,
		dbReads: lab.db.counters.reads,
		dbWrites: lab.db.counters.writes,
		dbRowsWritten: lab.db.counters.rowsWritten,
		stampede: lab.hot.stats(),
	};
}

const productParams = z.object({ strategy: z.enum(STRATEGIES), id: z.coerce.number().int().min(1).max(10_000) });
const priceBody = z.object({ price: z.number().int().min(0).max(100_000_000) });
const hotParams = z.object({ mode: z.enum(MODES) });

// EN: The return type is left to inference on purpose: Elysia encodes every route, body and
//     response in the type of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota,
//     corpo e resposta no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta,
//     cuerpo y respuesta en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createApp(lab: Lab) {
	return (
		new Elysia()
			.error({ StampedeError })
			.onError(({ code, status }) => {
				if (code === "StampedeError") {
					return status(503, { error: "gave up waiting for the hot key" });
				}
			})
			.get("/health", () => ({ ok: true }))
			.get("/stats", () => stats(lab))
			.post(
				"/admin/reset",
				async ({ body }) => {
					await resetLab(lab, body);
					return stats(lab);
				},
				{ body: settingsSchema.partial() },
			)
			// EN: Used by the load test to leave the warm-up out of the measurement.
			// PT: Usado pelo teste de carga para deixar o aquecimento fora da medição.
			// ES: Lo usa la prueba de carga para dejar el calentamiento fuera de la medición.
			.post("/admin/counters/reset", () => {
				resetCounters(lab);
				return { ok: true };
			})
			.post("/admin/flush", async () => ({ flushed: await lab.store.flush() }))
			// EN: `X-Cache` tells the client whether the answer came from the cache, the same way
			//     a CDN does, so the load test can count hits without asking the server.
			// PT: O `X-Cache` conta ao cliente se a resposta veio do cache, como uma CDN faz,
			//     então o teste de carga consegue contar acertos sem perguntar ao servidor.
			// ES: `X-Cache` le dice al cliente si la respuesta vino del caché, igual que lo hace
			//     una CDN, así que la prueba de carga puede contar aciertos sin preguntar al servidor.
			.get(
				"/products/:strategy/:id",
				async ({ params, set, status }) => {
					const result = await lab.store.read(params.strategy, params.id);
					if (result === null) {
						return status(404, { error: "product not found" });
					}
					set.headers["x-cache"] = result.source === "database" ? "miss" : "hit";
					return result;
				},
				{ params: productParams },
			)
			.put(
				"/products/:strategy/:id",
				async ({ params, body, status }) => {
					const product = await lab.store.write(params.strategy, params.id, body.price);
					return product === null ? status(404, { error: "product not found" }) : { product };
				},
				{ params: productParams, body: priceBody },
			)
			.get(
				"/hot/:mode",
				async ({ params, set }) => {
					const result = await lab.hot.read(params.mode);
					set.headers["x-cache"] = result.source === "database" ? "miss" : "hit";
					return result;
				},
				{ params: hotParams },
			)
	);
}
