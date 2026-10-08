// EN: A batching loader, the idea behind the DataLoader library, written by hand in a few lines.
//     A resolver asks for ONE key (`load(7)`) and gets a promise. The loader does not go to the
//     database right away: it collects every key asked during the current turn of the event
//     loop and then calls the batch function ONCE with all of them. One hundred resolvers asking
//     for one author each become a single `WHERE id = ANY(...)`.
// PT: Um loader com agrupamento em lote, a ideia por trás da biblioteca DataLoader, escrito à mão
//     em poucas linhas. Um resolver pede UMA chave (`load(7)`) e recebe uma promise. O loader não
//     vai ao banco na hora: ele junta todas as chaves pedidas durante a volta atual do event loop
//     e então chama a função de lote UMA vez com todas elas. Cem resolvers pedindo um autor cada
//     viram um único `WHERE id = ANY(...)`.

interface Waiting<V> {
	resolve: (value: V) => void;
	reject: (reason: unknown) => void;
}

export class BatchLoader<K, V> {
	private pending = new Map<K, Waiting<V>[]>();
	private readonly cache = new Map<K, Promise<V>>();
	private scheduled = false;

	/**
	 * @param batch fetches many keys at once and returns a map from key to value
	 * @param missing the value for a key the batch did not return (for example an empty list)
	 */
	constructor(
		private readonly batch: (keys: readonly K[]) => Promise<Map<K, V>>,
		private readonly missing: (key: K) => V,
	) {}

	load(key: K): Promise<V> {
		// EN: The cache lives as long as the loader, and a loader lives for one request. Asking
		//     twice for the same key inside a request costs nothing, and no stale value leaks
		//     into the next request.
		// PT: O cache vive enquanto o loader vive, e um loader vive por uma requisição. Pedir duas
		//     vezes a mesma chave na mesma requisição não custa nada, e nenhum valor velho vaza
		//     para a requisição seguinte.
		const cached = this.cache.get(key);
		if (cached !== undefined) {
			return cached;
		}
		const promise = new Promise<V>((resolve, reject) => {
			const waiting = this.pending.get(key) ?? [];
			waiting.push({ resolve, reject });
			this.pending.set(key, waiting);
		});
		this.cache.set(key, promise);
		if (!this.scheduled) {
			this.scheduled = true;
			// EN: `setImmediate` runs after the current synchronous code AND after every promise
			//     callback already queued. The GraphQL executor calls the resolvers of all the
			//     items of a list before that point, so all their keys are in `pending` by then.
			// PT: `setImmediate` roda depois do código síncrono atual E depois de todos os
			//     callbacks de promise já enfileirados. O executor GraphQL chama os resolvers de
			//     todos os itens de uma lista antes desse ponto, então todas as chaves já estão
			//     em `pending` nesse momento.
			setImmediate(() => {
				void this.flush();
			});
		}
		return promise;
	}

	private async flush(): Promise<void> {
		const pending = this.pending;
		this.pending = new Map();
		this.scheduled = false;
		try {
			const found = await this.batch([...pending.keys()]);
			for (const [key, waiting] of pending) {
				const value = found.get(key) ?? this.missing(key);
				for (const item of waiting) {
					item.resolve(value);
				}
			}
		} catch (error) {
			for (const waiting of pending.values()) {
				for (const item of waiting) {
					item.reject(error);
				}
			}
		}
	}
}
