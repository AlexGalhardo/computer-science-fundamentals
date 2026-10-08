// EN: Three ways of keeping Redis and PostgreSQL together. They share the read path and differ
//     in ONE thing: what a write does, and in which order.
//
//       cache-aside     write: database, then DELETE the cached key      (cache filled by reads)
//       write-through   write: database, then SET the cached key         (both before the answer)
//       write-behind    write: cache and a pending queue, answer, and the database later, in batch
//
// PT: Três jeitos de manter Redis e PostgreSQL juntos. Eles dividem o caminho de leitura e
//     diferem em UMA coisa: o que uma escrita faz, e em que ordem.
//
//       cache-aside     escrita: banco, depois APAGA a chave do cache    (cache cheio por leituras)
//       write-through   escrita: banco, depois GRAVA a chave no cache    (os dois antes da resposta)
//       write-behind    escrita: cache e fila pendente, responde, e o banco depois, em lote

import { randomUUID } from "node:crypto";
import type { Cache } from "./cache";
import type { Settings } from "./config";
import { type Database, type Product, productSchema } from "./db";

export const STRATEGIES = ["cache-aside", "write-through", "write-behind"] as const;
export type Strategy = (typeof STRATEGIES)[number];

/** Where the answer of a read came from. */
export type Source = "cache" | "database" | "pending";

export interface ReadResult {
	product: Product;
	source: Source;
}

export interface CacheCounters {
	hits: number;
	misses: number;
	/** Writes acknowledged to the client, in any strategy. */
	writes: number;
}

// EN: A seam for the tests. The classic cache-aside race needs a reader to stop exactly between
//     "I read the database" and "I store it in the cache", which never happens on demand, so
//     the test plugs a pause here. Production code leaves it empty.
// PT: Uma emenda para os testes. A corrida clássica do cache-aside precisa que um leitor pare
//     exatamente entre "li o banco" e "gravei no cache", o que nunca acontece sob encomenda,
//     então o teste encaixa uma pausa aqui. Em produção fica vazio.
export interface Hooks {
	beforeCacheFill?: () => Promise<void>;
}

const PENDING = "write-behind:pending";

export function productKey(id: number): string {
	return `product:${id}`;
}

function parseProduct(raw: string | null): Product | null {
	if (raw === null) {
		return null;
	}
	const parsed = productSchema.safeParse(JSON.parse(raw));
	return parsed.success ? parsed.data : null;
}

export class ProductStore {
	readonly counters: CacheCounters = { hits: 0, misses: 0, writes: 0 };
	hooks: Hooks = {};
	// EN: Flushes run one at a time: the timer and a manual flush must not write the same batch.
	// PT: As descargas rodam uma por vez: o temporizador e uma descarga manual não podem gravar
	//     o mesmo lote.
	private flushing: Promise<number> = Promise.resolve(0);

	constructor(
		private readonly db: Database,
		private readonly cache: Cache,
		private readonly settings: Settings,
	) {}

	resetCounters(): void {
		this.counters.hits = 0;
		this.counters.misses = 0;
		this.counters.writes = 0;
	}

	// EN: The read path, also called lazy loading: look in the cache, and only on a miss go to
	//     the database and leave a copy behind for the next reader. The copy carries a time to
	//     live, which is the upper bound on how long a wrong copy can survive.
	// PT: O caminho de leitura, também chamado de carga preguiçosa: olha no cache, e só na falha
	//     vai ao banco e deixa uma cópia para o próximo leitor. A cópia leva um tempo de vida,
	//     que é o limite de quanto uma cópia errada consegue sobreviver.
	async read(strategy: Strategy, id: number): Promise<ReadResult | null> {
		const key = productKey(id);
		const cached = parseProduct(await this.cache.get(key));
		if (cached !== null) {
			this.counters.hits += 1;
			return { product: cached, source: "cache" };
		}
		this.counters.misses += 1;

		// EN: With write-behind the database may be BEHIND: a write can still be waiting in the
		//     queue while its cached copy already expired. Reading the database now would bring
		//     back the old price and cache it. So the queue is checked first.
		// PT: Com write-behind o banco pode estar ATRASADO: uma escrita pode ainda esperar na fila
		//     enquanto a cópia no cache já expirou. Ler o banco agora traria o preço antigo e o
		//     guardaria no cache. Por isso a fila é consultada antes.
		if (strategy === "write-behind") {
			const pending = parseProduct(await this.cache.hashGet(PENDING, String(id)));
			if (pending !== null) {
				await this.cache.set(key, JSON.stringify(pending), this.settings.ttlMs);
				return { product: pending, source: "pending" };
			}
		}

		const product = await this.db.readProduct(id, this.settings.queryCostMs);
		if (product === null) {
			return null;
		}
		await this.hooks.beforeCacheFill?.();
		await this.cache.set(key, JSON.stringify(product), this.settings.ttlMs);
		return { product, source: "database" };
	}

	async write(strategy: Strategy, id: number, price: number): Promise<Product | null> {
		const product =
			strategy === "cache-aside"
				? await this.writeCacheAside(id, price)
				: strategy === "write-through"
					? await this.writeThrough(id, price)
					: await this.writeBehind(id, price);
		if (product !== null) {
			this.counters.writes += 1;
		}
		return product;
	}

	// EN: Cache-aside deletes instead of updating. Two writers that both SET the cache can leave
	//     it with the older value if their cache commands arrive in the opposite order of their
	//     database commits. A delete has no value to get wrong: the next read loads the truth.
	//     The database goes first, so there is never a moment with the new value cached and not
	//     yet committed.
	// PT: O cache-aside apaga em vez de atualizar. Dois escritores que fazem SET no cache podem
	//     deixá-lo com o valor mais antigo se os comandos de cache chegarem na ordem contrária dos
	//     commits no banco. Um delete não tem valor para errar: a próxima leitura carrega a
	//     verdade. O banco vai primeiro, então nunca há um momento com o valor novo no cache e
	//     ainda não confirmado.
	private async writeCacheAside(id: number, price: number): Promise<Product | null> {
		const product = await this.db.writePrice(id, price);
		await this.cache.del(productKey(id));
		return product;
	}

	// EN: Write-through answers only after BOTH stores have the new value, so the read that
	//     follows a write is a hit and is fresh. The price is paid by the writer: two
	//     round-trips before the answer. The database still goes first: if it rejects the write,
	//     the cache is never touched.
	// PT: O write-through só responde depois que os DOIS lugares têm o valor novo, então a
	//     leitura que vem depois de uma escrita é um acerto e está fresca. Quem paga é o
	//     escritor: duas viagens antes da resposta. O banco continua indo primeiro: se ele
	//     recusar a escrita, o cache nem é tocado.
	private async writeThrough(id: number, price: number): Promise<Product | null> {
		const product = await this.db.writePrice(id, price);
		if (product === null) {
			return null;
		}
		await this.cache.set(productKey(id), JSON.stringify(product), this.settings.ttlMs);
		return product;
	}

	// EN: Write-behind answers after touching only Redis. The new value goes to a hash of
	//     pending writes (no time to live: it must survive until the flush) and to the cached
	//     key. Until the next flush the database is behind the cache, and if Redis loses its
	//     memory before that, an acknowledged write is gone.
	// PT: O write-behind responde depois de tocar só no Redis. O valor novo vai para um hash de
	//     escritas pendentes (sem tempo de vida: precisa sobreviver até a descarga) e para a
	//     chave do cache. Até a próxima descarga o banco fica atrás do cache, e se o Redis perder
	//     a memória antes disso, uma escrita confirmada some.
	private async writeBehind(id: number, price: number): Promise<Product | null> {
		const current = await this.read("write-behind", id);
		if (current === null) {
			return null;
		}
		const product: Product = { ...current.product, price };
		const value = JSON.stringify(product);
		await this.cache.hashSet(PENDING, String(id), value);
		await this.cache.set(productKey(id), value, this.settings.ttlMs);
		return product;
	}

	/** Sends the pending write-behind queue to the database. Returns the number of rows written. */
	flush(): Promise<number> {
		this.flushing = this.flushing.then(
			() => this.flushOnce(),
			() => this.flushOnce(),
		);
		return this.flushing;
	}

	// EN: The pending hash has ONE field per product, so ten writes to the same product inside
	//     one interval are one row in the batch: only the last value matters (coalescing).
	//     `RENAME` takes the whole hash out of the way atomically, so writes that arrive during
	//     the flush start a fresh hash and are not lost or written twice.
	// PT: O hash de pendentes tem UM campo por produto, então dez escritas no mesmo produto
	//     dentro de um intervalo viram uma linha no lote: só o último valor importa
	//     (aglutinação). O `RENAME` tira o hash inteiro do caminho de forma atômica, então as
	//     escritas que chegam durante a descarga começam um hash novo e não se perdem nem são
	//     gravadas duas vezes.
	private async flushOnce(): Promise<number> {
		const batchKey = `write-behind:flushing:${randomUUID()}`;
		if (!(await this.cache.renameIfExists(PENDING, batchKey))) {
			return 0;
		}
		const fields = await this.cache.hashGetAll(batchKey);
		const products = Object.values(fields)
			.map((raw) => parseProduct(raw))
			.filter((product): product is Product => product !== null);
		try {
			const rows = await this.db.writePrices(products);
			await this.cache.del(batchKey);
			return rows;
		} catch (error) {
			// EN: The database refused the batch. Put the values back, without overwriting a
			//     newer write that arrived meanwhile, so the next flush tries again.
			// PT: O banco recusou o lote. Devolve os valores, sem passar por cima de uma escrita
			//     mais nova que chegou nesse meio tempo, para a próxima descarga tentar de novo.
			for (const [field, raw] of Object.entries(fields)) {
				await this.cache.hashSetIfAbsent(PENDING, field, raw);
			}
			await this.cache.del(batchKey);
			throw error;
		}
	}
}
