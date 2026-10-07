import { expect, test } from "bun:test";
import { LruCache } from "../src/lru-cache";
import { random } from "../src/words";

// EN: Reference model: the same behaviour written in the most obvious way, with one array kept
//     in order of use. It is O(n) per operation and easy to trust, which is exactly what a
//     model is for. The real cache has to behave the same and be O(1).
// PT: Modelo de referência: o mesmo comportamento escrito do jeito mais óbvio, com um único
//     vetor mantido em ordem de uso. Ele custa O(n) por operação e é fácil de confiar, que é
//     justamente para o que um modelo serve. A cache de verdade precisa se comportar igual e
//     ser O(1).
class ModelCache {
	private entries: [number, number][] = [];

	constructor(private readonly capacity: number) {}

	get(key: number): number | undefined {
		const index = this.entries.findIndex(([stored]) => stored === key);
		if (index === -1) {
			return undefined;
		}
		const [entry] = this.entries.splice(index, 1);
		if (entry === undefined) {
			return undefined;
		}
		this.entries.unshift(entry);
		return entry[1];
	}

	put(key: number, value: number): number | undefined {
		const index = this.entries.findIndex(([stored]) => stored === key);
		if (index !== -1) {
			this.entries.splice(index, 1);
			this.entries.unshift([key, value]);
			return undefined;
		}
		const evicted = this.entries.length === this.capacity ? this.entries.pop()?.[0] : undefined;
		this.entries.unshift([key, value]);
		return evicted;
	}

	keys(): number[] {
		return this.entries.map(([key]) => key);
	}
}

test("a small scenario evicts the least recently used key", () => {
	const cache = new LruCache<string, number>(2);
	expect(cache.put("a", 1)).toBeUndefined();
	expect(cache.put("b", 2)).toBeUndefined();
	expect(cache.get("a")).toBe(1);
	expect(cache.put("c", 3)).toBe("b");
	expect(cache.get("b")).toBeUndefined();
	expect(cache.keys()).toEqual(["c", "a"]);
	expect(cache.put("a", 10)).toBeUndefined();
	expect(cache.keys()).toEqual(["a", "c"]);
	expect(cache.size).toBe(2);
});

test("an invalid capacity is refused", () => {
	expect(() => new LruCache<number, number>(0)).toThrow(RangeError);
});

// EN: Property test: for every capacity from 1 to 8, thousands of random gets and puts run on
//     the cache and on the model. The value returned, the key evicted and the whole order of
//     the keys have to be equal after every single operation.
// PT: Teste de propriedade: para cada capacidade de 1 a 8, milhares de gets e puts aleatórios
//     rodam na cache e no modelo. O valor devolvido, a chave descartada e a ordem inteira das
//     chaves precisam ser iguais depois de cada operação.
test("eviction order matches the reference model", () => {
	for (let capacity = 1; capacity <= 8; capacity++) {
		const cache = new LruCache<number, number>(capacity);
		const model = new ModelCache(capacity);
		const next = random(capacity);
		for (let step = 0; step < 5000; step++) {
			const key = next() % 12;
			if (next() % 2 === 0) {
				expect(cache.get(key)).toBe(model.get(key));
			} else {
				const value = next() % 1000;
				expect(cache.put(key, value)).toBe(model.put(key, value));
			}
			expect(cache.keys()).toEqual(model.keys());
			expect(cache.size).toBeLessThanOrEqual(capacity);
		}
	}
});
