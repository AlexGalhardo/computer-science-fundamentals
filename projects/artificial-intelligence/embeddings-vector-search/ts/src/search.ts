// EN: Two ways of finding the stored vector most similar to a query.
//     Brute force compares the query with every vector: always right, cost = n comparisons.
//     The index (random-hyperplane LSH, "locality-sensitive hashing") compares the query only
//     with the vectors that fell in the same bucket: far fewer comparisons, sometimes wrong.
// PT: Duas formas de achar o vetor guardado mais parecido com uma consulta.
//     A força bruta compara a consulta com todos os vetores: sempre certa, custo = n comparações.
//     O índice (LSH de hiperplanos aleatórios, "locality-sensitive hashing") compara a consulta só
//     com os vetores que caíram no mesmo balde: muito menos comparações, às vezes errado.

import { dot, type Vector } from "./embeddings";
import { bellRandom, mulberry32 } from "./rng";

export interface SearchResult {
	/** Position of the best vector, or -1 when the index found no candidate at all. */
	readonly best: number;
	readonly similarity: number;
	/** How many stored vectors were compared with the query. */
	readonly comparisons: number;
}

// EN: Every vector here has length 1, so the cosine is just the dot product. One comparison =
//     one dot product. A tie keeps the first vector, in both languages.
// PT: Todo vetor aqui tem comprimento 1, então o cosseno é só o produto escalar. Uma comparação =
//     um produto escalar. Um empate fica com o primeiro vetor, nas duas linguagens.
export function bruteForce(vectors: readonly Vector[], query: Vector): SearchResult {
	let best = -1;
	let similarity = Number.NEGATIVE_INFINITY;
	vectors.forEach((vector, position) => {
		const score = dot(vector, query);
		if (score > similarity) {
			similarity = score;
			best = position;
		}
	});
	return { best, similarity, comparisons: vectors.length };
}

export interface Planes {
	readonly tables: number;
	readonly bits: number;
	/** tables * bits planes, table after table. Each plane is the vector perpendicular to it. */
	readonly normals: readonly Vector[];
}

// EN: A random plane through the origin cuts the space in two halves. It is stored as its normal
//     vector r, and the side of a vector v is the sign of dot(r, v). Two vectors separated by a
//     small angle are rarely cut apart by a random plane: the chance that they fall on the same
//     side is 1 - angle/180 degrees. That single fact is the whole index.
// PT: Um plano aleatório que passa pela origem corta o espaço em duas metades. Ele é guardado
//     como o seu vetor normal r, e o lado de um vetor v é o sinal de dot(r, v). Dois vetores
//     separados por um ângulo pequeno raramente são separados por um plano aleatório: a chance de
//     caírem do mesmo lado é 1 - ângulo/180 graus. Esse único fato é o índice inteiro.
export function makePlanes(seed: number, tables: number, bits: number, dimensions: number): Planes {
	const rng = mulberry32(seed);
	const normals: Vector[] = [];
	for (let plane = 0; plane < tables * bits; plane++) {
		const normal = new Float64Array(dimensions);
		for (let d = 0; d < dimensions; d++) normal[d] = bellRandom(rng);
		normals.push(normal);
	}
	return { tables, bits, normals };
}

/** One 0 or 1 per plane: the side of each plane on which the vector falls. */
export function sides(planes: Planes, vector: Vector): Uint8Array {
	const result = new Uint8Array(planes.normals.length);
	planes.normals.forEach((normal, plane) => {
		result[plane] = dot(normal, vector) > 0 ? 1 : 0;
	});
	return result;
}

// EN: `bits` sides in a row form a binary number, the bucket key: with 3 planes, "above, below,
//     above" is 101 = bucket 5. More bits = more and smaller buckets = fewer comparisons, but a
//     higher chance that the true neighbour is cut away by one of the planes.
// PT: `bits` lados em sequência formam um número binário, a chave do balde: com 3 planos, "acima,
//     abaixo, acima" é 101 = balde 5. Mais bits = mais baldes e menores = menos comparações, mas
//     uma chance maior de o vizinho verdadeiro ser separado por um dos planos.
export function bucketKey(planes: Planes, vectorSides: Uint8Array, table: number, bits: number): number {
	let key = 0;
	for (let bit = 0; bit < bits; bit++) {
		key |= (vectorSides[table * planes.bits + bit] as number) << bit;
	}
	return key;
}

export interface LshSettings {
	readonly tables: number;
	readonly bits: number;
	/** 0 = look only at the bucket of the query. 1 = also at the buckets that differ in one bit. */
	readonly probes: 0 | 1;
}

// EN: One table can miss: the neighbour may sit just across one plane. So the index keeps several
//     independent tables, each with its own planes, and a query collects the candidates of all of
//     them. More tables = fewer misses and more comparisons. The settings may use fewer tables
//     and fewer bits than the planes provide (a prefix), so one set of planes serves the whole
//     trade-off table.
// PT: Uma tabela pode errar: o vizinho pode estar logo do outro lado de um plano. Por isso o
//     índice mantém várias tabelas independentes, cada uma com os seus planos, e uma consulta
//     junta os candidatos de todas. Mais tabelas = menos erros e mais comparações. As
//     configurações podem usar menos tabelas e menos bits do que os planos oferecem (um prefixo),
//     então um único conjunto de planos serve à tabela de troca inteira.
export class LshIndex {
	private readonly buckets: Map<number, number[]>[] = [];

	constructor(
		private readonly planes: Planes,
		private readonly vectors: readonly Vector[],
		vectorSides: readonly Uint8Array[],
		readonly settings: LshSettings,
	) {
		if (settings.tables > planes.tables || settings.bits > planes.bits) {
			throw new Error("the settings ask for more tables or bits than the planes have");
		}
		for (let table = 0; table < settings.tables; table++) {
			const buckets = new Map<number, number[]>();
			vectorSides.forEach((oneSides, position) => {
				const key = bucketKey(planes, oneSides, table, settings.bits);
				const bucket = buckets.get(key);
				if (bucket === undefined) buckets.set(key, [position]);
				else bucket.push(position);
			});
			this.buckets.push(buckets);
		}
	}

	/** The positions of the vectors that share a bucket with the query, each one once. */
	candidates(querySides: Uint8Array): number[] {
		const { tables, bits, probes } = this.settings;
		const seen = new Set<number>();
		for (let table = 0; table < tables; table++) {
			const key = bucketKey(this.planes, querySides, table, bits);
			const keys = [key];
			// EN: Multi-probe: the most likely miss is a neighbour that differs in exactly one
			//     side. Flipping one bit of the key at a time visits those buckets too.
			// PT: Multi-sonda: o erro mais provável é um vizinho que difere em exatamente um lado.
			//     Inverter um bit da chave por vez visita esses baldes também.
			if (probes === 1) for (let bit = 0; bit < bits; bit++) keys.push(key ^ (1 << bit));
			for (const probe of keys) {
				for (const position of this.buckets[table]?.get(probe) ?? []) seen.add(position);
			}
		}
		return [...seen].sort((a, b) => a - b);
	}

	search(query: Vector, querySides: Uint8Array): SearchResult {
		const positions = this.candidates(querySides);
		let best = -1;
		let similarity = Number.NEGATIVE_INFINITY;
		for (const position of positions) {
			const score = dot(this.vectors[position] as Vector, query);
			if (score > similarity) {
				similarity = score;
				best = position;
			}
		}
		return { best, similarity, comparisons: positions.length };
	}
}

export interface TradeOffRow {
	readonly tables: number;
	readonly bits: number;
	readonly probes: number;
	/** Share of the queries whose top result is the same as the brute-force one. */
	readonly agreement: number;
	/** Average number of stored vectors compared with the query. */
	readonly comparisons: number;
	/** Dot products spent computing the bucket keys of one query: tables * bits. */
	readonly hashing: number;
}

export const PLANES_SEED = 42;
export const MAX_TABLES = 8;
export const MAX_BITS = 12;

// EN: The settings of the trade-off table. The first one is the fastest and far below the 95%
//     target on purpose: it shows what is given up. Each of the next ones buys agreement with
//     more comparisons: more tables, fewer bits, or probing the neighbouring buckets.
// PT: As configurações da tabela de troca. A primeira é a mais rápida e fica bem abaixo da meta
//     de 95% de propósito: mostra o que se perde. Cada uma das seguintes compra concordância com
//     mais comparações: mais tabelas, menos bits, ou sondar os baldes vizinhos.
export const SETTINGS: readonly LshSettings[] = [
	{ tables: 1, bits: 12, probes: 0 },
	{ tables: 4, bits: 12, probes: 0 },
	{ tables: 8, bits: 12, probes: 0 },
	{ tables: 8, bits: 10, probes: 0 },
	{ tables: 2, bits: 10, probes: 1 },
	{ tables: 4, bits: 12, probes: 1 },
	{ tables: 8, bits: 12, probes: 1 },
];

/** The fastest setting of the table, kept to show the price of speed. */
export const FAST: LshSettings = { tables: 1, bits: 12, probes: 0 };

/** The setting the README recommends and the test of MP-AI-3.2 asserts. */
export const CHOSEN: LshSettings = { tables: 4, bits: 12, probes: 1 };

export function sameSettings(a: LshSettings, b: LshSettings): boolean {
	return a.tables === b.tables && a.bits === b.bits && a.probes === b.probes;
}

// EN: The experiment: for every query, ask brute force (the truth) and ask the index, then count
//     how often the two top results are the same vector and how many comparisons the index made.
// PT: O experimento: para cada consulta, pergunta à força bruta (a verdade) e pergunta ao índice,
//     depois conta em quantas vezes os dois primeiros resultados são o mesmo vetor e quantas
//     comparações o índice fez.
export function tradeOff(
	vectors: readonly Vector[],
	queries: readonly Vector[],
	settingsList: readonly LshSettings[] = SETTINGS,
	planes: Planes = makePlanes(PLANES_SEED, MAX_TABLES, MAX_BITS, vectors[0]?.length ?? 0),
): TradeOffRow[] {
	const vectorSides = vectors.map((vector) => sides(planes, vector));
	const querySides = queries.map((query) => sides(planes, query));
	const truth = queries.map((query) => bruteForce(vectors, query).best);
	return settingsList.map((settings) => {
		const index = new LshIndex(planes, vectors, vectorSides, settings);
		let agreed = 0;
		let comparisons = 0;
		queries.forEach((query, q) => {
			const result = index.search(query, querySides[q] as Uint8Array);
			if (result.best === truth[q]) agreed++;
			comparisons += result.comparisons;
		});
		return {
			tables: settings.tables,
			bits: settings.bits,
			probes: settings.probes,
			agreement: agreed / queries.length,
			comparisons: comparisons / queries.length,
			hashing: settings.tables * settings.bits,
		};
	});
}
