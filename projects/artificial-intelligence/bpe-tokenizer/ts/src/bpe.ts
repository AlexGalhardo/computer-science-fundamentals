// EN: Byte-pair encoding (BPE), the algorithm that turns text into the tokens a language model
//     reads. This file is the whole tokenizer: training, encoding and decoding.
// PT: Byte-pair encoding (BPE), o algoritmo que transforma texto nos tokens que um modelo de
//     linguagem lê. Este arquivo é o tokenizador inteiro: treino, codificação e decodificação.
// ES: Byte-pair encoding (BPE), el algoritmo que convierte el texto en los tokens que lee un modelo
//     de lenguaje. Este archivo es el tokenizador completo: entrenamiento, codificación y
//     decodificación.

// EN: Every text in UTF-8 is a sequence of bytes, and a byte has 256 possible values. Starting
//     from bytes (and not from letters) means the base vocabulary has exactly 256 tokens and no
//     text is ever "unknown": an accent is 2 bytes and an emoji is 4, but they are still bytes.
// PT: Todo texto em UTF-8 é uma sequência de bytes, e um byte tem 256 valores possíveis. Partir
//     de bytes (e não de letras) faz o vocabulário base ter exatamente 256 tokens, e nenhum texto
//     é "desconhecido": um acento são 2 bytes e um emoji são 4, mas continuam sendo bytes.
// ES: Todo texto en UTF-8 es una secuencia de bytes, y un byte tiene 256 valores posibles. Partir
//     de bytes (y no de letras) hace que el vocabulario base tenga exactamente 256 tokens, y ningún
//     texto es "desconocido": un acento son 2 bytes y un emoji son 4, pero siguen siendo bytes.
export const BASE_VOCABULARY = 256;

/** One learned rule: the pair (left, right) becomes the new token `id`. */
export interface Merge {
	left: number;
	right: number;
	id: number;
	count: number;
}

export interface Tokenizer {
	merges: Merge[];
	/** The bytes each token id stands for. Ids 0 to 255 are the single bytes. */
	vocabulary: Uint8Array[];
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

export function textToBytes(text: string): number[] {
	return Array.from(encoder.encode(text));
}

// EN: Counts every pair of neighbours, overlapping ones included: in "aaa" the pair (a, a) is
//     counted twice. The key packs the two ids in one number so a Map can count them.
// PT: Conta todos os pares de vizinhos, inclusive os sobrepostos: em "aaa" o par (a, a) é
//     contado duas vezes. A chave empacota os dois ids em um número para o Map poder contar.
// ES: Cuenta todos los pares de vecinos, incluidos los que se solapan: en "aaa" el par (a, a) se
//     cuenta dos veces. La clave empaqueta los dos ids en un número para que el Map pueda contar.
const PAIR_BASE = 1_000_000;

export function countPairs(ids: readonly number[]): Map<number, number> {
	const counts = new Map<number, number>();
	for (let index = 0; index + 1 < ids.length; index++) {
		const key = (ids[index] as number) * PAIR_BASE + (ids[index + 1] as number);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return counts;
}

// EN: The most frequent pair wins. A tie is broken by the smaller left id and then the smaller
//     right id. The rule itself does not matter, but it must be written down: without it two
//     implementations (TypeScript and Python here) would learn different vocabularies.
// PT: O par mais frequente vence. O empate é decidido pelo menor id da esquerda e depois pelo
//     menor id da direita. A regra em si não importa, mas precisa estar escrita: sem ela duas
//     implementações (TypeScript e Python aqui) aprenderiam vocabulários diferentes.
// ES: El par más frecuente gana. El empate lo decide el menor id de la izquierda y luego el menor
//     id de la derecha. La regla en sí no importa, pero tiene que estar escrita: sin ella dos
//     implementaciones (TypeScript y Python aquí) aprenderían vocabularios distintos.
export function mostFrequentPair(counts: Map<number, number>): { left: number; right: number; count: number } | null {
	let bestKey = -1;
	let bestCount = 0;
	for (const [key, count] of counts) {
		if (count > bestCount || (count === bestCount && key < bestKey)) {
			bestKey = key;
			bestCount = count;
		}
	}
	if (bestKey < 0) {
		return null;
	}
	return { left: Math.floor(bestKey / PAIR_BASE), right: bestKey % PAIR_BASE, count: bestCount };
}

// EN: Replaces every occurrence of the pair by the new id, scanning from left to right. After a
//     replacement the scan jumps over both items, so "aaa" with the pair (a, a) becomes "Xa".
// PT: Troca toda ocorrência do par pelo novo id, varrendo da esquerda para a direita. Depois de
//     uma troca a varredura pula os dois itens, então "aaa" com o par (a, a) vira "Xa".
// ES: Reemplaza cada aparición del par por el nuevo id, recorriendo de izquierda a derecha. Después
//     de un reemplazo el recorrido salta los dos elementos, así que "aaa" con el par (a, a) se
//     convierte en "Xa".
export function mergePair(ids: readonly number[], left: number, right: number, id: number): number[] {
	const merged: number[] = [];
	let index = 0;
	while (index < ids.length) {
		if (index + 1 < ids.length && ids[index] === left && ids[index + 1] === right) {
			merged.push(id);
			index += 2;
		} else {
			merged.push(ids[index] as number);
			index += 1;
		}
	}
	return merged;
}

// EN: Training is a loop of three steps: count the pairs, pick the most frequent, merge it into
//     a new token. Each turn adds exactly one token, so the vocabulary size is 256 + merges.
//     Training stops early when no pair appears twice: merging a pair seen once compresses
//     nothing.
// PT: Treinar é um laço de três passos: contar os pares, escolher o mais frequente, fundi-lo em
//     um token novo. Cada volta acrescenta exatamente um token, então o tamanho do vocabulário é
//     256 + fusões. O treino para antes quando nenhum par aparece duas vezes: fundir um par
//     visto uma vez não comprime nada.
// ES: Entrenar es un bucle de tres pasos: contar los pares, elegir el más frecuente y fusionarlo
//     en un token nuevo. Cada vuelta añade exactamente un token, así que el tamaño del vocabulario
//     es 256 + fusiones. El entrenamiento se detiene antes cuando ningún par aparece dos veces:
//     fusionar un par visto una sola vez no comprime nada.
export function train(corpus: string, mergeCount: number): Tokenizer {
	let ids = textToBytes(corpus);
	const merges: Merge[] = [];
	const vocabulary: Uint8Array[] = Array.from({ length: BASE_VOCABULARY }, (_, byte) => Uint8Array.of(byte));
	for (let step = 0; step < mergeCount; step++) {
		const best = mostFrequentPair(countPairs(ids));
		if (best === null || best.count < 2) {
			break;
		}
		const id = BASE_VOCABULARY + merges.length;
		ids = mergePair(ids, best.left, best.right, id);
		merges.push({ left: best.left, right: best.right, id, count: best.count });
		const leftBytes = vocabulary[best.left] as Uint8Array;
		const rightBytes = vocabulary[best.right] as Uint8Array;
		vocabulary.push(Uint8Array.of(...leftBytes, ...rightBytes));
	}
	return { merges, vocabulary };
}

// EN: Encoding a new text replays the merges in the order they were learned. Order matters: a
//     later merge may be built on the token an earlier merge created.
//     `limit` uses only the first merges, which is how the demo simulates smaller vocabularies.
// PT: Codificar um texto novo repete as fusões na ordem em que foram aprendidas. A ordem
//     importa: uma fusão posterior pode ser feita sobre o token criado por uma anterior.
//     `limit` usa só as primeiras fusões, e é assim que a demo simula vocabulários menores.
// ES: Codificar un texto nuevo repite las fusiones en el orden en que se aprendieron. El orden
//     importa: una fusión posterior puede hacerse sobre el token creado por una anterior.
//     `limit` usa solo las primeras fusiones, y así es como la demo simula vocabularios menores.
export function encode(tokenizer: Tokenizer, text: string, limit: number = tokenizer.merges.length): number[] {
	let ids = textToBytes(text);
	for (const merge of tokenizer.merges.slice(0, limit)) {
		if (ids.length < 2) {
			break;
		}
		ids = mergePair(ids, merge.left, merge.right, merge.id);
	}
	return ids;
}

// EN: Decoding is a lookup: each id gives back its bytes, the bytes are joined and read as
//     UTF-8. Nothing is lost on the way, so decode(encode(text)) is always the original text.
// PT: Decodificar é uma consulta: cada id devolve os seus bytes, os bytes são juntados e lidos
//     como UTF-8. Nada se perde no caminho, então decode(encode(texto)) é sempre o texto original.
// ES: Decodificar es una consulta: cada id devuelve sus bytes, los bytes se unen y se leen como
//     UTF-8. No se pierde nada en el camino, así que decode(encode(texto)) siempre es el texto
//     original.
export function tokenBytes(tokenizer: Tokenizer, ids: readonly number[]): Uint8Array {
	const bytes: number[] = [];
	for (const id of ids) {
		const piece = tokenizer.vocabulary[id];
		if (piece === undefined) {
			throw new Error(`unknown token id ${id}`);
		}
		bytes.push(...piece);
	}
	return Uint8Array.from(bytes);
}

export function decode(tokenizer: Tokenizer, ids: readonly number[]): string {
	return decoder.decode(tokenBytes(tokenizer, ids));
}

// EN: A token is a run of bytes, and a run of bytes is not always a whole character: the 4
//     bytes of an emoji can be split between two tokens. So a single token is shown as text only
//     when its bytes are valid UTF-8 by themselves, and as hexadecimal otherwise.
// PT: Um token é uma sequência de bytes, e uma sequência de bytes nem sempre é um caractere
//     inteiro: os 4 bytes de um emoji podem ficar divididos entre dois tokens. Por isso um token
//     sozinho é mostrado como texto só quando os seus bytes são UTF-8 válido por si sós, e em
//     hexadecimal caso contrário.
// ES: Un token es una secuencia de bytes, y una secuencia de bytes no siempre es un carácter
//     completo: los 4 bytes de un emoji pueden quedar repartidos entre dos tokens. Por eso un token
//     solo se muestra como texto cuando sus bytes son UTF-8 válido por sí solos, y en hexadecimal
//     en caso contrario.
const strictDecoder = new TextDecoder("utf-8", { fatal: true });

export function hex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

export function tokenLabel(tokenizer: Tokenizer, id: number): string {
	const bytes = tokenBytes(tokenizer, [id]);
	try {
		return strictDecoder.decode(bytes);
	} catch {
		return `<${hex(bytes)}>`;
	}
}

export interface TableRow {
	merges: number;
	vocabulary: number;
	sampleTokens: number;
	corpusTokens: number;
}

// EN: The experiment of the demo: the same two texts encoded with a growing number of merges.
//     One training run is enough, because a tokenizer with 50 merges is the first 50 merges of
//     the tokenizer with 300.
// PT: O experimento da demo: os mesmos dois textos codificados com um número crescente de
//     fusões. Um treino basta, porque um tokenizador com 50 fusões são as 50 primeiras fusões do
//     tokenizador com 300.
// ES: El experimento de la demo: los mismos dos textos codificados con un número creciente de
//     fusiones. Basta un entrenamiento, porque un tokenizador con 50 fusiones son las 50 primeras
//     fusiones del tokenizador con 300.
export function tokenCountTable(
	tokenizer: Tokenizer,
	corpus: string,
	sample: string,
	steps: readonly number[],
): TableRow[] {
	return steps.map((merges) => ({
		merges,
		vocabulary: BASE_VOCABULARY + merges,
		sampleTokens: encode(tokenizer, sample, merges).length,
		corpusTokens: encode(tokenizer, corpus, merges).length,
	}));
}

// EN: The corpus is small on purpose (about 3 kB), and after some 360 merges no pair appears
//     twice any more, so 300 is the largest round number of merges it supports.
// PT: O corpus é pequeno de propósito (cerca de 3 kB), e depois de umas 360 fusões nenhum par
//     aparece mais duas vezes, então 300 é o maior número redondo de fusões que ele comporta.
// ES: El corpus es pequeño a propósito (unos 3 kB), y tras unas 360 fusiones ningún par vuelve a
//     aparecer dos veces, así que 300 es el mayor número redondo de fusiones que admite.
export const TABLE_STEPS = [0, 10, 25, 50, 100, 200, 300] as const;
export const DEFAULT_MERGES = 300;
