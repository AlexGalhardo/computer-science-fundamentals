// EN: The cache stampede (also thundering herd or dogpile). One popular key expires. Every
//     request that arrives before somebody stores a new copy sees a miss, and each of them runs
//     the same expensive query. The database gets hundreds of identical queries for one value.
//
//       none    plain cache-aside read: every miss queries the database
//       lock    only the request that wins `SET lock NX PX` queries, the others wait for its copy
//       early   one request refreshes the value BEFORE it expires, nobody ever sees a miss
//
// PT: O estouro da manada (thundering herd, dogpile). Uma chave popular expira. Toda requisição
//     que chega antes de alguém gravar uma cópia nova vê uma falha, e cada uma roda a mesma
//     consulta cara. O banco recebe centenas de consultas idênticas para um único valor.
//
//       none    leitura cache-aside simples: toda falha consulta o banco
//       lock    só a requisição que ganha o `SET lock NX PX` consulta, as outras esperam a cópia
//       early   uma requisição renova o valor ANTES de ele expirar, ninguém chega a ver uma falha

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Cache } from "./cache";
import type { Settings } from "./config";
import { type Database, type Product, productSchema } from "./db";

export const MODES = ["none", "lock", "early"] as const;
export type Mode = (typeof MODES)[number];

export const HOT_PRODUCT_ID = 1;
const HOT_KEY = "hot:product";
const LOCK_KEY = "hot:product:lock";

/** The lock outlives any honest query, and still expires if its holder dies. */
const LOCK_TTL_MS = 10_000;
const WAIT_STEP_MS = 10;
const MAX_WAIT_MS = 15_000;

// EN: The cached value carries its own "refresh after" instant. Redis only knows the hard
//     expiry. The early refresh needs an earlier, soft one, and the only place to keep it is
//     next to the value.
// PT: O valor em cache leva o seu próprio instante de "renovar depois de". O Redis só conhece a
//     expiração dura. A renovação antecipada precisa de uma anterior, suave, e o único lugar
//     para guardá-la é junto do valor.
const envelopeSchema = z.object({ product: productSchema, refreshAt: z.number() });
type Envelope = z.infer<typeof envelopeSchema>;

export interface HotResult {
	product: Product;
	source: "cache" | "database" | "waited";
}

export interface StampedeStats {
	/** Times the value had to be loaded: one per expiry, cold start or early refresh. */
	expiries: number;
	/** Database queries made to load the hot key, in total. */
	queries: number;
	/** Database queries of each expiry, in order. */
	bursts: number[];
}

export class StampedeError extends Error {}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HotKey {
	// EN: How the experiment counts "queries per expiry". A query that starts while no other
	//     load is running opens a new burst. Queries that start while one is still running
	//     belong to the same expiry: they are the herd.
	// PT: Como o experimento conta "consultas por expiração". Uma consulta que começa quando
	//     nenhuma outra carga está em andamento abre uma nova rajada. As que começam enquanto há
	//     uma em andamento pertencem à mesma expiração: são a manada.
	private inFlight = 0;
	private bursts: number[] = [];

	constructor(
		private readonly db: Database,
		private readonly cache: Cache,
		private readonly settings: Settings,
	) {}

	reset(): void {
		this.bursts = [];
	}

	stats(): StampedeStats {
		return {
			expiries: this.bursts.length,
			queries: this.bursts.reduce((sum, burst) => sum + burst, 0),
			bursts: [...this.bursts],
		};
	}

	read(mode: Mode): Promise<HotResult> {
		return mode === "none" ? this.readUnprotected() : mode === "lock" ? this.readWithLock() : this.readEarly();
	}

	private async cached(): Promise<Envelope | null> {
		const raw = await this.cache.get(HOT_KEY);
		if (raw === null) {
			return null;
		}
		const parsed = envelopeSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	}

	/** The expensive query, followed by the copy left in the cache. */
	private async load(): Promise<Product> {
		if (this.inFlight === 0) {
			this.bursts.push(0);
		}
		this.inFlight += 1;
		this.bursts[this.bursts.length - 1] = (this.bursts.at(-1) ?? 0) + 1;
		try {
			const product = await this.db.readProduct(HOT_PRODUCT_ID, this.settings.slowQueryMs);
			if (product === null) {
				throw new StampedeError("the hot product does not exist, call reset first");
			}
			const envelope: Envelope = {
				product,
				refreshAt: Date.now() + this.settings.ttlMs - this.settings.earlyRefreshMs,
			};
			await this.cache.set(HOT_KEY, JSON.stringify(envelope), this.settings.ttlMs);
			return product;
		} finally {
			this.inFlight -= 1;
		}
	}

	private async readUnprotected(): Promise<HotResult> {
		const hit = await this.cached();
		if (hit !== null) {
			return { product: hit.product, source: "cache" };
		}
		return { product: await this.load(), source: "database" };
	}

	// EN: The lock turns "everybody recomputes" into "one recomputes, the rest wait". Two details
	//     carry the correctness. First, after winning the lock the cache is checked AGAIN: a
	//     slow request may win the lock just after the previous winner stored the value and
	//     released it. Second, a waiter that never sees the value tries the lock itself, so a
	//     crashed winner delays the others only until the lock expires.
	// PT: A trava troca "todos recalculam" por "um recalcula, os outros esperam". Dois detalhes
	//     sustentam a correção. Primeiro, depois de ganhar a trava o cache é conferido DE NOVO:
	//     uma requisição lenta pode ganhar a trava logo depois de o vencedor anterior gravar o
	//     valor e soltá-la. Segundo, quem espera e nunca vê o valor tenta a trava também, então
	//     um vencedor que caiu atrasa os outros só até a trava expirar.
	private async readWithLock(): Promise<HotResult> {
		const hit = await this.cached();
		if (hit !== null) {
			return { product: hit.product, source: "cache" };
		}
		const token = randomUUID();
		const deadline = Date.now() + MAX_WAIT_MS;
		while (Date.now() < deadline) {
			if (await this.cache.acquireLock(LOCK_KEY, token, LOCK_TTL_MS)) {
				try {
					const again = await this.cached();
					if (again !== null) {
						return { product: again.product, source: "waited" };
					}
					return { product: await this.load(), source: "database" };
				} finally {
					await this.cache.releaseLock(LOCK_KEY, token);
				}
			}
			// EN: A little randomness in the wait keeps the waiters from asking Redis in step.
			// PT: Um pouco de acaso na espera evita que todos perguntem ao Redis no mesmo compasso.
			await sleep(WAIT_STEP_MS + Math.random() * WAIT_STEP_MS);
			const filled = await this.cached();
			if (filled !== null) {
				return { product: filled.product, source: "waited" };
			}
		}
		throw new StampedeError("gave up waiting for the hot key");
	}

	// EN: Early refresh never lets the hot key reach its expiry while it is in use. Inside the
	//     last `earlyRefreshMs` of the time to live, the first request to notice takes the lock
	//     and reloads in the background, and everybody (including that request) keeps getting
	//     the copy that is still valid. Compared with the lock alone, nobody waits. A cold cache
	//     has no copy to serve, so that single case falls back to the lock.
	// PT: A renovação antecipada nunca deixa a chave quente chegar à expiração enquanto está em
	//     uso. Dentro dos últimos `earlyRefreshMs` do tempo de vida, a primeira requisição que
	//     percebe pega a trava e recarrega em segundo plano, e todos (inclusive ela) continuam
	//     recebendo a cópia ainda válida. Comparado com a trava sozinha, ninguém espera. Um cache
	//     frio não tem cópia para servir, então só esse caso recai na trava.
	private async readEarly(): Promise<HotResult> {
		const hit = await this.cached();
		if (hit === null) {
			return this.readWithLock();
		}
		if (Date.now() >= hit.refreshAt) {
			const token = randomUUID();
			if (await this.cache.acquireLock(LOCK_KEY, token, LOCK_TTL_MS)) {
				void this.refreshInBackground(token);
			}
		}
		return { product: hit.product, source: "cache" };
	}

	private async refreshInBackground(token: string): Promise<void> {
		try {
			// EN: Same second look as in the lock: the previous refresher may have just finished.
			// PT: A mesma segunda olhada da trava: quem renovou antes pode ter acabado de terminar.
			const current = await this.cached();
			if (current === null || Date.now() >= current.refreshAt) {
				await this.load();
			}
		} catch (error) {
			console.error("early refresh failed, the next request will try again:", error);
		} finally {
			await this.cache.releaseLock(LOCK_KEY, token);
		}
	}
}
