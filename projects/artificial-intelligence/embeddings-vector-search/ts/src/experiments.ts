// EN: The three experiments of the project, run once and shared by the demo and by the tests:
//     the neighbours of the test words, the trade-off of the index, and the retrieval questions.
//     `summarize` keeps only what must be identical in TypeScript and in Python; that summary is
//     compared with data/expected.json by both test suites.
// PT: Os três experimentos do projeto, rodados uma vez e compartilhados pela demo e pelos testes:
//     os vizinhos das palavras de teste, a troca do índice e as perguntas de recuperação.
//     `summarize` guarda só o que precisa ser idêntico em TypeScript e em Python; esse resumo é
//     comparado com data/expected.json pelas duas suítes de teste.
// ES: Los tres experimentos del proyecto, ejecutados una vez y compartidos por la demo y las
//     pruebas: los vecinos de las palabras de prueba, el intercambio del índice y las preguntas de
//     recuperación. `summarize` guarda solo lo que debe ser idéntico en TypeScript y en Python; ese
//     resumen lo comparan con data/expected.json las dos suites de pruebas.

import { type DemoQuestion, readGroups, readLines, readPassages, readQuestions } from "./data";
import {
	buildWordVectors,
	type Contrast,
	type GroupPrecision,
	groupContrast,
	groupPrecision,
	nearestNeighbours,
	overallPrecision,
	type Vector,
	type WordVectors,
} from "./embeddings";
import {
	buildModel,
	distinctByContent,
	embedText,
	type Hit,
	type Model,
	retrieve,
	trainingSentences,
} from "./retrieval";
import { type TradeOffRow, tradeOff } from "./search";

/** How many neighbours of each test word are checked. */
export const NEIGHBOURS = 5;
/** How many passages a question retrieves. */
export const TOP_PASSAGES = 3;

// EN: A question that shares no content word with the passages it should find. It can only work
//     through the word vectors: "drizzle" and "hail" are near "rain" and "snow".
// PT: Uma pergunta que não compartilha nenhuma palavra de conteúdo com as passagens que deveria
//     achar. Ela só pode funcionar pelos vetores de palavras: "drizzle" e "hail" ficam perto de
//     "rain" e "snow".
// ES: Una pregunta que no comparte ninguna palabra de contenido con los pasajes que debería
//     encontrar. Solo puede funcionar a través de los vectores de palabras: "drizzle" y "hail"
//     están cerca de "rain" y "snow".
export const RELATED_QUESTION = "Will drizzle or hail come tomorrow?";
export const RELATED_PASSAGES: readonly string[] = ["p13", "p14", "p15"];

/** A question the method gets wrong, kept in the results on purpose. */
export const MISSED_QUESTION: DemoQuestion = { question: "Why does the sea rise and fall?", expected: "p25" };

export interface Experiment {
	readonly model: Model;
	readonly rawWords: WordVectors;
	readonly groups: Readonly<Record<string, readonly string[]>>;
	readonly corpusSentences: number;
	readonly trainingSentences: number;
	readonly precision: readonly GroupPrecision[];
	readonly rawPrecision: readonly GroupPrecision[];
	readonly contrast: Contrast;
	readonly rawContrast: Contrast;
	/** How many distinct corpus sentences were indexed, and how many queries were asked. */
	readonly indexed: number;
	readonly queries: number;
	readonly tradeOff: readonly TradeOffRow[];
	readonly questions: readonly DemoQuestion[];
}

export interface IndexData {
	readonly vectors: Vector[];
	readonly queries: Vector[];
}

// EN: What the index stores: one vector per sentence of the corpus with distinct content, built
//     exactly like a passage vector. The 80 word vectors and the 30 passages are too few for an
//     index to matter, about 2000 sentences are enough to see the difference. The queries are
//     the 400 new sentences of data/queries.txt.
// PT: O que o índice guarda: um vetor por frase do corpus com conteúdo distinto, construído
//     exatamente como o vetor de uma passagem. Os 80 vetores de palavras e as 30 passagens são
//     poucos para um índice fazer diferença, cerca de 2000 frases bastam para ver a diferença.
//     As consultas são as 400 frases novas de data/queries.txt.
// ES: Lo que guarda el índice: un vector por frase del corpus con contenido distinto, construido
//     exactamente como el vector de un pasaje. Los 80 vectores de palabras y los 30 pasajes son
//     pocos para que un índice marque diferencia, unas 2000 frases bastan para ver la diferencia.
//     Las consultas son las 400 frases nuevas de data/queries.txt.
export function indexData(model: Model, corpus: readonly string[], queries: readonly string[]): IndexData {
	const distinct = distinctByContent(corpus);
	return {
		vectors: distinct.map((sentence) => embedText(model, sentence).vector),
		queries: queries.map((sentence) => embedText(model, sentence).vector),
	};
}

export function runExperiment(): Experiment {
	const corpus = readLines("corpus.txt");
	const passages = readPassages();
	const groups = readGroups();
	const model = buildModel(corpus, passages);
	const sentences = trainingSentences(corpus, passages);
	const rawWords = buildWordVectors(sentences, "raw");
	const data = indexData(model, corpus, readLines("queries.txt"));
	return {
		model,
		rawWords,
		groups,
		corpusSentences: corpus.length,
		trainingSentences: sentences.length,
		precision: groupPrecision(model.words, groups, NEIGHBOURS),
		rawPrecision: groupPrecision(rawWords, groups, NEIGHBOURS),
		contrast: groupContrast(model.words, groups),
		rawContrast: groupContrast(rawWords, groups),
		indexed: data.vectors.length,
		queries: data.queries.length,
		tradeOff: tradeOff(data.vectors, data.queries),
		questions: readQuestions(),
	};
}

export interface Summary {
	/** The 5 nearest neighbours of each of the 80 test words, best first. */
	readonly neighbours: Record<string, string[]>;
	readonly precision: number;
	readonly indexed: number;
	readonly queries: number;
	readonly tradeOff: TradeOffRow[];
	/** The ids of the 3 passages retrieved for each demo question, best first. */
	readonly retrieval: { question: string; top: string[] }[];
}

function round(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

export function topIds(hits: readonly Hit[]): string[] {
	return hits.map((hit) => hit.passage.id);
}

export function summarize(experiment: Experiment): Summary {
	const neighbours: Record<string, string[]> = {};
	for (const words of Object.values(experiment.groups)) {
		for (const word of words) {
			neighbours[word] = nearestNeighbours(experiment.model.words, word, NEIGHBOURS).map((n) => n.word);
		}
	}
	const asked = [...experiment.questions.map((item) => item.question), RELATED_QUESTION, MISSED_QUESTION.question];
	return {
		neighbours,
		precision: round(overallPrecision(experiment.precision), 4),
		indexed: experiment.indexed,
		queries: experiment.queries,
		tradeOff: experiment.tradeOff.map((row) => ({
			...row,
			agreement: round(row.agreement, 4),
			comparisons: round(row.comparisons, 1),
		})),
		retrieval: asked.map((question) => ({
			question,
			top: topIds(retrieve(experiment.model, question, TOP_PASSAGES)),
		})),
	};
}
