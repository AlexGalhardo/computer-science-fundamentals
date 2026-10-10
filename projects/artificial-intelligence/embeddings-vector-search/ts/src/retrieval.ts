// EN: Retrieval: the question picks the passages that are most likely to answer it. This is the
//     "R" of RAG (retrieval-augmented generation): before a language model answers, a search step
//     chooses which texts are placed in its prompt.
//     A text becomes one vector by averaging the vectors of its words. The question is embedded
//     in exactly the same way, and the passages are ranked by cosine similarity with it.
// PT: Recuperação: a pergunta escolhe as passagens com mais chance de respondê-la. É o "R" de RAG
//     (geração aumentada por recuperação): antes de um modelo de linguagem responder, uma etapa
//     de busca escolhe quais textos entram no prompt.
//     Um texto vira um vetor pela média dos vetores das suas palavras. A pergunta é transformada
//     exatamente do mesmo jeito, e as passagens são ordenadas pela similaridade do cosseno com ela.
// ES: Recuperación: la pregunta elige los pasajes con más probabilidad de responderla. Es la "R"
//     de RAG (generación aumentada por recuperación): antes de que un modelo de lenguaje responda,
//     una etapa de búsqueda elige qué textos entran en el prompt.
//     Un texto se convierte en un vector por el promedio de los vectores de sus palabras. La
//     pregunta se transforma exactamente de la misma manera, y los pasajes se ordenan por la
//     similitud del coseno con ella.

import { type Passage, readLines, readPassages } from "./data";
import {
	buildWordVectors,
	dot,
	normalize,
	splitSentences,
	tokenize,
	type Vector,
	type WordVectors,
} from "./embeddings";

export interface Model {
	readonly words: WordVectors;
	/** One weight per word of the vocabulary: high for rare words, near 0 for "the". */
	readonly idf: Float64Array;
	readonly passages: readonly Passage[];
	readonly passageVectors: readonly Vector[];
}

export interface Embedding {
	/** Length 1, or all zeros when no word of the text is in the vocabulary. */
	readonly vector: Vector;
	readonly known: readonly string[];
	readonly unknown: readonly string[];
}

export interface Hit {
	readonly passage: Passage;
	readonly score: number;
}

// EN: The word vectors are learned from the generated sentences AND from the passages, so that
//     the words of the passages have a vector too. The questions are never part of the corpus.
// PT: Os vetores de palavras são aprendidos das frases geradas E das passagens, para que as
//     palavras das passagens também tenham vetor. As perguntas nunca fazem parte do corpus.
// ES: Los vectores de palabras se aprenden de las frases generadas Y de los pasajes, para que las
//     palabras de los pasajes también tengan vector. Las preguntas nunca forman parte del corpus.
export function trainingSentences(corpus: readonly string[], passages: readonly Passage[]): string[][] {
	const passageSentences = passages.flatMap((passage) => splitSentences(`${passage.title}. ${passage.text}`));
	return [...corpus, ...passageSentences].map(tokenize);
}

// EN: In a plain average, "the" and "of" would weigh as much as "thunder". Inverse document
//     frequency fixes that: idf(word) = ln(number of sentences / sentences containing the word).
//     A word found in almost every sentence gets a weight near 0, a rare word a large one.
// PT: Numa média simples, "the" e "of" pesariam tanto quanto "thunder". A frequência inversa de
//     documento corrige isso: idf(palavra) = ln(número de frases / frases que contêm a palavra).
//     Uma palavra presente em quase toda frase recebe peso perto de 0, uma palavra rara recebe um
//     peso grande.
// ES: En un promedio simple, "the" y "of" pesarían tanto como "thunder". La frecuencia inversa de
//     documento lo corrige: idf(palabra) = ln(número de frases / frases que contienen la palabra).
//     Una palabra presente en casi toda frase recibe un peso cercano a 0, una palabra rara recibe
//     un peso grande.
export function inverseDocumentFrequency(
	sentences: readonly (readonly string[])[],
	index: ReadonlyMap<string, number>,
): Float64Array {
	const containing = new Float64Array(index.size);
	for (const sentence of sentences) {
		for (const word of new Set(sentence)) {
			const position = index.get(word);
			if (position !== undefined) containing[position] = (containing[position] as number) + 1;
		}
	}
	return containing.map((count) => (count === 0 ? 0 : Math.log(sentences.length / count)));
}

// EN: The idf of this project is counted on a few thousand sentences, where "how" and "why" are
//     rare and would look important. A real system counts idf on millions of documents. Here a
//     short list of function words (a "stop list") is skipped when a text is embedded. The words
//     stay in the corpus and still take part in the co-occurrence counts.
// PT: O idf deste projeto é contado em alguns milhares de frases, onde "how" e "why" são raras e
//     pareceriam importantes. Um sistema real conta o idf em milhões de documentos. Aqui uma
//     lista curta de palavras funcionais (uma "stop list") é ignorada quando um texto vira vetor.
//     As palavras continuam no corpus e ainda participam das contagens de coocorrência.
// ES: El idf de este proyecto se cuenta en unos pocos miles de frases, donde "how" y "why" son raras
//     y parecerían importantes. Un sistema real cuenta el idf en millones de documentos. Aquí se
//     ignora una lista corta de palabras funcionales (una "stop list") cuando un texto se vuelve
//     vector. Las palabras siguen en el corpus y aún participan en los conteos de coocurrencia.
export const STOP_WORDS: ReadonlySet<string> = new Set(
	(
		"a an the and or but of in on at to for from with by as if then than not no so " +
		"is are was were be been do does did has have had can will would should " +
		"i you he she it we they me him her us them my your his its our their " +
		"this that these those there here what which who whom when where why how " +
		"all any each every some most more too very just only into out up down over after before again once"
	).split(" "),
);

// EN: Two sentences with the same content words in another order ("the dog and the cat" and "the
//     cat and the dog") get the same vector, because an average forgets the order. This key is
//     equal exactly for such sentences. The search experiment uses it to store each vector once,
//     so that "the nearest vector" is never a tie between two copies.
// PT: Duas frases com as mesmas palavras de conteúdo em outra ordem ("the dog and the cat" e "the
//     cat and the dog") recebem o mesmo vetor, porque uma média esquece a ordem. Esta chave é
//     igual exatamente para essas frases. O experimento de busca a usa para guardar cada vetor
//     uma vez só, para que "o vetor mais próximo" nunca seja um empate entre duas cópias.
// ES: Dos frases con las mismas palabras de contenido en otro orden ("the dog and the cat" y "the
//     cat and the dog") reciben el mismo vector, porque un promedio olvida el orden. Esta clave es
//     igual exactamente para esas frases. El experimento de búsqueda la usa para guardar cada
//     vector una sola vez, de modo que "el vector más cercano" nunca sea un empate entre dos copias.
export function contentKey(sentence: string): string {
	return tokenize(sentence)
		.filter((word) => !STOP_WORDS.has(word))
		.sort()
		.join(" ");
}

/** The first sentence of each distinct content key, in the original order. */
export function distinctByContent(sentences: readonly string[]): string[] {
	const seen = new Set<string>();
	return sentences.filter((sentence) => {
		const key = contentKey(sentence);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function buildModel(corpus: readonly string[], passages: readonly Passage[]): Model {
	const sentences = trainingSentences(corpus, passages);
	const words = buildWordVectors(sentences);
	const idf = inverseDocumentFrequency(sentences, words.index);
	const partial = { words, idf, passages, passageVectors: [] };
	const passageVectors = passages.map((passage) => embedText(partial, `${passage.title}. ${passage.text}`).vector);
	return { words, idf, passages, passageVectors };
}

export function loadModel(): Model {
	return buildModel(readLines("corpus.txt"), readPassages());
}

// EN: text vector = normalise( sum over the words of idf(word) * vector(word) ).
//     A word that is not in the vocabulary has no vector and is skipped: a counting model knows
//     nothing about a word it never saw. The list of skipped words is returned so that the
//     command line can show it.
// PT: vetor do texto = normaliza( soma, nas palavras, de idf(palavra) * vetor(palavra) ).
//     Uma palavra fora do vocabulário não tem vetor e é ignorada: um modelo de contagem não sabe
//     nada sobre uma palavra que nunca viu. A lista de palavras ignoradas é devolvida para que a
//     linha de comando possa mostrá-la.
// ES: vector del texto = normaliza( suma, en las palabras, de idf(palabra) * vector(palabra) ).
//     Una palabra fuera del vocabulario no tiene vector y se ignora: un modelo de conteo no sabe
//     nada sobre una palabra que nunca vio. La lista de palabras ignoradas se devuelve para que la
//     línea de comandos pueda mostrarla.
export function embedText(model: Pick<Model, "words" | "idf">, text: string): Embedding {
	const total = new Float64Array(model.words.vocabulary.length);
	const known: string[] = [];
	const unknown: string[] = [];
	for (const word of tokenize(text)) {
		if (STOP_WORDS.has(word)) continue;
		const position = model.words.index.get(word);
		if (position === undefined) {
			unknown.push(word);
			continue;
		}
		known.push(word);
		const weight = model.idf[position] as number;
		const vector = model.words.vectors[position] as Vector;
		for (let i = 0; i < total.length; i++) total[i] = (total[i] as number) + weight * (vector[i] as number);
	}
	return { vector: normalize(total), known, unknown };
}

/** The k passages most similar to the question, best first. Equal scores keep the file order. */
export function retrieve(model: Model, question: string, k: number): Hit[] {
	const query = embedText(model, question).vector;
	return model.passages
		.map((passage, position) => ({ passage, score: dot(query, model.passageVectors[position] as Vector) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, k);
}
