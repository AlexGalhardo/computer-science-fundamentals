// EN: Word vectors from counting, with no neural network and no training loop.
//     1. For every word, count which words appear near it (co-occurrence counts).
//     2. Re-weight the counts so that surprising neighbours matter more than frequent ones (PPMI).
//     3. The row of a word in that table is its vector. Two words are similar when their rows
//        point in the same direction (cosine similarity).
// PT: Vetores de palavras a partir de contagem, sem rede neural e sem laço de treino.
//     1. Para cada palavra, conta quais palavras aparecem perto dela (contagens de coocorrência).
//     2. Repesa as contagens para que vizinhos surpreendentes valham mais que os frequentes (PPMI).
//     3. A linha de uma palavra nessa tabela é o seu vetor. Duas palavras são parecidas quando as
//        suas linhas apontam na mesma direção (similaridade do cosseno).

export type Vector = Float64Array;

export type Weighting = "ppmi" | "raw";

export interface WordVectors {
	/** Every distinct word of the corpus, in alphabetical order. Position = column and row number. */
	readonly vocabulary: readonly string[];
	readonly index: ReadonlyMap<string, number>;
	/** One row per word, already scaled to length 1. */
	readonly vectors: readonly Vector[];
}

export interface Neighbour {
	readonly word: string;
	readonly similarity: number;
}

/** How many words on each side count as "near". */
export const WINDOW = 4;

/** Lower-case words made of letters only. Punctuation and digits separate words. */
export function tokenize(text: string): string[] {
	return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

/** Cuts a paragraph at the end-of-sentence marks, so a window never crosses two sentences. */
export function splitSentences(text: string): string[] {
	return text
		.split(/[.!?\n]+/)
		.map((sentence) => sentence.trim())
		.filter((sentence) => sentence.length > 0);
}

// EN: The vocabulary is sorted so that the numbering of the words does not depend on the order
//     of the sentences, and is the same in TypeScript and in Python.
// PT: O vocabulário é ordenado para que a numeração das palavras não dependa da ordem das frases,
//     e seja a mesma em TypeScript e em Python.
export function buildVocabulary(sentences: readonly (readonly string[])[]): string[] {
	const words = new Set<string>();
	for (const sentence of sentences) for (const word of sentence) words.add(word);
	// Plain code-unit order (not locale order), which is what Python's sorted() does too.
	return [...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function indexOf(vocabulary: readonly string[]): Map<string, number> {
	return new Map(vocabulary.map((word, position) => [word, position]));
}

// EN: The co-occurrence table. counts[i][j] = how many times word j appeared at most `window`
//     positions away from word i, on either side. The window is symmetric, so the table is too:
//     counts[i][j] == counts[j][i].
// PT: A tabela de coocorrência. counts[i][j] = quantas vezes a palavra j apareceu a no máximo
//     `window` posições da palavra i, de qualquer lado. A janela é simétrica, então a tabela
//     também é: counts[i][j] == counts[j][i].
export function cooccurrence(
	sentences: readonly (readonly string[])[],
	index: ReadonlyMap<string, number>,
	window: number = WINDOW,
): Vector[] {
	const size = index.size;
	const counts = Array.from({ length: size }, () => new Float64Array(size));
	for (const sentence of sentences) {
		const ids = sentence.map((word) => index.get(word)).filter((id): id is number => id !== undefined);
		for (let centre = 0; centre < ids.length; centre++) {
			const from = Math.max(0, centre - window);
			const to = Math.min(ids.length - 1, centre + window);
			for (let other = from; other <= to; other++) {
				if (other === centre) continue;
				const row = counts[ids[centre] as number] as Vector;
				row[ids[other] as number] = (row[ids[other] as number] as number) + 1;
			}
		}
	}
	return counts;
}

// EN: Why not use the raw counts as the vector? Because "the" is near almost every word. The
//     biggest numbers of every row would sit in the same few columns ("the", "a", "and"), so all
//     rows would point in nearly the same direction and every word would look like every other.
//     PMI (pointwise mutual information) asks a better question: how many times more often do
//     these two words meet than they would by pure chance, given how frequent each one is?
//         pmi(w, c) = log2( P(w, c) / (P(w) * P(c)) ) = log2( count(w,c) * total / (row(w) * row(c)) )
//     "dog" next to "the" is no surprise (pmi near 0). "dog" next to "barn" is (pmi well above 0).
//     PPMI keeps only the positive part: a pair seen less than chance, or never, gets 0, because
//     with a small corpus "never seen together" is weak evidence.
// PT: Por que não usar as contagens cruas como vetor? Porque "the" fica perto de quase toda
//     palavra. Os maiores números de toda linha ficariam nas mesmas poucas colunas ("the", "a",
//     "and"), então todas as linhas apontariam quase para a mesma direção e toda palavra pareceria
//     com qualquer outra.
//     A PMI (informação mútua pontual) faz uma pergunta melhor: quantas vezes mais essas duas
//     palavras se encontram do que se encontrariam por puro acaso, dada a frequência de cada uma?
//         pmi(w, c) = log2( P(w, c) / (P(w) * P(c)) ) = log2( cont(w,c) * total / (linha(w) * linha(c)) )
//     "dog" ao lado de "the" não surpreende (pmi perto de 0). "dog" ao lado de "barn" surpreende
//     (pmi bem acima de 0). A PPMI guarda só a parte positiva: um par visto menos que o acaso, ou
//     nunca, recebe 0, porque com um corpus pequeno "nunca vistos juntos" é evidência fraca.
export function ppmi(counts: readonly Vector[]): Vector[] {
	const rowSums = counts.map((row) => sum(row));
	const total = rowSums.reduce((acc, value) => acc + value, 0);
	return counts.map((row, i) => {
		const weighted = new Float64Array(row.length);
		for (let j = 0; j < row.length; j++) {
			const count = row[j] as number;
			if (count === 0) continue;
			const pmi = Math.log2((count * total) / ((rowSums[i] as number) * (rowSums[j] as number)));
			if (pmi > 0) weighted[j] = pmi;
		}
		return weighted;
	});
}

export function sum(vector: Vector): number {
	let acc = 0;
	for (let i = 0; i < vector.length; i++) acc += vector[i] as number;
	return acc;
}

/** Dot product: multiply position by position and add everything up. */
export function dot(a: Vector, b: Vector): number {
	let acc = 0;
	for (let i = 0; i < a.length; i++) acc += (a[i] as number) * (b[i] as number);
	return acc;
}

/** The length (norm) of a vector: the square root of its dot product with itself. */
export function norm(vector: Vector): number {
	return Math.sqrt(dot(vector, vector));
}

// EN: Cosine similarity = dot(a, b) / (|a| * |b|). It measures the angle between two vectors and
//     ignores their length: 1 means same direction, 0 means nothing in common. A frequent word
//     has a longer row than a rare one, and the division removes that effect.
//     Dividing every vector by its own length once ("normalising") makes the cosine a plain dot
//     product afterwards, which is why everything stored in this project has length 1.
// PT: Similaridade do cosseno = dot(a, b) / (|a| * |b|). Ela mede o ângulo entre dois vetores e
//     ignora o comprimento: 1 significa mesma direção, 0 significa nada em comum. Uma palavra
//     frequente tem uma linha mais comprida que uma rara, e a divisão remove esse efeito.
//     Dividir cada vetor pelo próprio comprimento uma vez ("normalizar") faz o cosseno virar um
//     simples produto escalar depois, e por isso tudo o que este projeto guarda tem comprimento 1.
export function cosine(a: Vector, b: Vector): number {
	const lengths = norm(a) * norm(b);
	return lengths === 0 ? 0 : dot(a, b) / lengths;
}

export function normalize(vector: Vector): Vector {
	const length = norm(vector);
	const unit = new Float64Array(vector.length);
	if (length === 0) return unit;
	for (let i = 0; i < vector.length; i++) unit[i] = (vector[i] as number) / length;
	return unit;
}

export function buildWordVectors(
	sentences: readonly (readonly string[])[],
	weighting: Weighting = "ppmi",
	window: number = WINDOW,
): WordVectors {
	const vocabulary = buildVocabulary(sentences);
	const index = indexOf(vocabulary);
	const counts = cooccurrence(sentences, index, window);
	const table = weighting === "ppmi" ? ppmi(counts) : counts;
	return { vocabulary, index, vectors: table.map(normalize) };
}

export function vectorOf(model: WordVectors, word: string): Vector | undefined {
	const position = model.index.get(word);
	return position === undefined ? undefined : model.vectors[position];
}

// EN: Nearest neighbours by brute force: compare the word with every other word of the
//     vocabulary and keep the k most similar. Equal similarities are ordered alphabetically, so
//     the answer never depends on the sort algorithm.
// PT: Vizinhos mais próximos por força bruta: compara a palavra com todas as outras do
//     vocabulário e guarda as k mais parecidas. Similaridades iguais são ordenadas
//     alfabeticamente, então a resposta nunca depende do algoritmo de ordenação.
export function nearestNeighbours(model: WordVectors, word: string, k: number): Neighbour[] {
	const query = vectorOf(model, word);
	if (query === undefined) throw new Error(`"${word}" is not in the vocabulary`);
	const scored: Neighbour[] = [];
	model.vocabulary.forEach((other, position) => {
		if (other !== word) scored.push({ word: other, similarity: dot(query, model.vectors[position] as Vector) });
	});
	scored.sort((a, b) => b.similarity - a.similarity || (a.word < b.word ? -1 : 1));
	return scored.slice(0, k);
}

export interface GroupPrecision {
	readonly group: string;
	/** Share of the top-k neighbours of the words of this group that belong to the same group. */
	readonly precision: number;
	/** How many words of the group have ALL their top-k neighbours inside the group. */
	readonly perfectWords: number;
	readonly words: number;
}

// EN: The test of the vectors. Nobody told the code that "dog" and "cat" are animals. If the
//     neighbours of "dog" are all animals, the groups were recovered from the contexts alone.
//     Precision at k = (neighbours inside the group) / k, averaged over the words of the group.
// PT: O teste dos vetores. Ninguém disse ao código que "dog" e "cat" são animais. Se os vizinhos
//     de "dog" são todos animais, os grupos foram recuperados só a partir dos contextos.
//     Precisão em k = (vizinhos dentro do grupo) / k, na média das palavras do grupo.
export function groupPrecision(
	model: WordVectors,
	groups: Readonly<Record<string, readonly string[]>>,
	k: number,
): GroupPrecision[] {
	return Object.entries(groups).map(([group, words]) => {
		const members = new Set(words);
		let inside = 0;
		let perfectWords = 0;
		for (const word of words) {
			const hits = nearestNeighbours(model, word, k).filter((neighbour) => members.has(neighbour.word)).length;
			inside += hits;
			if (hits === k) perfectWords++;
		}
		return { group, precision: inside / (words.length * k), perfectWords, words: words.length };
	});
}

export function overallPrecision(rows: readonly GroupPrecision[]): number {
	const words = rows.reduce((acc, row) => acc + row.words, 0);
	return rows.reduce((acc, row) => acc + row.precision * row.words, 0) / words;
}

export interface Contrast {
	/** Average cosine between two test words of the same group. */
	readonly within: number;
	/** Average cosine between two test words of different groups. */
	readonly between: number;
}

// EN: A second way of looking at the same vectors: how far apart are "same group" and "other
//     group"? With raw counts every pair of words looks alike, because all rows are dominated by
//     the same frequent columns. PPMI pushes unrelated words towards 0 and leaves a wide gap.
// PT: Uma segunda forma de olhar os mesmos vetores: qual a distância entre "mesmo grupo" e "outro
//     grupo"? Com contagens cruas todo par de palavras parece igual, porque todas as linhas são
//     dominadas pelas mesmas colunas frequentes. A PPMI empurra palavras sem relação para perto
//     de 0 e deixa um vão largo.
export function groupContrast(model: WordVectors, groups: Readonly<Record<string, readonly string[]>>): Contrast {
	const tagged = Object.entries(groups).flatMap(([group, words]) => words.map((word) => ({ group, word })));
	let within = 0;
	let withinPairs = 0;
	let between = 0;
	let betweenPairs = 0;
	for (let i = 0; i < tagged.length; i++) {
		for (let j = i + 1; j < tagged.length; j++) {
			const a = tagged[i] as { group: string; word: string };
			const b = tagged[j] as { group: string; word: string };
			const similarity = dot(vectorOf(model, a.word) as Vector, vectorOf(model, b.word) as Vector);
			if (a.group === b.group) {
				within += similarity;
				withinPairs++;
			} else {
				between += similarity;
				betweenPairs++;
			}
		}
	}
	return { within: within / withinPairs, between: between / betweenPairs };
}
