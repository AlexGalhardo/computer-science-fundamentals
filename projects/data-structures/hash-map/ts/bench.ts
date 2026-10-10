// EN: Benchmark of lookups at a chosen load factor. The table is created with a fixed capacity
//     of n / load and never resizes, so when the n keys are in, the load factor is exactly the
//     one requested. Only the lookups are timed: n keys that exist and n keys that do not.
//     Missing keys are the expensive case, because the search walks the whole list or run.
// PT: Benchmark de buscas em um fator de carga escolhido. A tabela nasce com capacidade fixa de
//     n / carga e nunca redimensiona, então, com as n chaves dentro, o fator de carga é
//     exatamente o pedido. Só as buscas são cronometradas: n chaves que existem e n que não
//     existem. Chave ausente é o caso caro, pois a busca percorre a lista ou o bloco inteiro.
// ES: Benchmark de búsquedas con un factor de carga elegido. La tabla nace con capacidad fija de
//     n / carga y nunca se redimensiona, así que, con las n claves dentro, el factor de carga es
//     exactamente el pedido. Solo se cronometran las búsquedas: n claves que existen y n que no
//     existen. La clave ausente es el caso caro, pues la búsqueda recorre la lista o el bloque entero.

import { ChainingMap, type HashMap, ProbingMap } from "./src/hash-map";

const [implementation = "chaining", size = "100000", loadText = "0.75"] = process.argv.slice(2);
const n = Number(size);
const capacity = Math.ceil(n / Number(loadText));

function generator(seed: number): () => number {
	let state = seed;
	return () => {
		state ^= state << 13;
		state ^= state >>> 17;
		state ^= state << 5;
		return state >>> 0;
	};
}

// EN: A huge limit turns resizing off, so the lists really reach the requested load.
// PT: Um limite enorme desliga o redimensionamento, então as listas chegam mesmo à carga pedida.
// ES: Un límite enorme desactiva el redimensionamiento, así que las listas llegan de verdad a la carga pedida.
const map: HashMap =
	implementation === "probing" ? new ProbingMap(capacity, 0.99) : new ChainingMap(capacity, Number.MAX_VALUE);

// EN: Stored keys are even and absent keys are odd, so a miss is guaranteed.
// PT: As chaves guardadas são pares e as ausentes são ímpares, então a falha é garantida.
// ES: Las claves guardadas son pares y las ausentes son impares, así que el fallo está garantizado.
const fill = generator(42);
for (let i = 0; i < n; i++) {
	map.put((fill() << 1) >>> 0, i);
}

const present = generator(42);
const absent = generator(4242);
let hits = 0;
const start = performance.now();
for (let i = 0; i < n; i++) {
	if (map.get((present() << 1) >>> 0) !== undefined) hits++;
	if (map.get(((absent() << 1) | 1) >>> 0) !== undefined) hits++;
}
const elapsedMs = performance.now() - start;

console.log(
	JSON.stringify({
		n,
		elapsedMs,
		memoryKb: Math.round(process.memoryUsage().rss / 1024),
		language: "ts",
		implementation,
		checksum: String(hits),
	}),
);
