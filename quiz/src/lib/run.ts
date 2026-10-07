// EN: A "run" is one attempt at a list of questions. It is pure data, with no text in it:
//     only ids, orders and chosen answers. That is why the language can change in the middle of
//     a question without losing anything: the other language renders the same run.
// PT: Uma "run" é uma tentativa em uma lista de questões. Ela é dado puro, sem texto: só ids,
//     ordens e respostas escolhidas. É por isso que o idioma pode mudar no meio de uma questão
//     sem perder nada: o outro idioma renderiza a mesma run.

import { z } from "zod";
import { ALTERNATIVE_COUNT, DIFFICULTIES, type Difficulty } from "../content/schema";
import { createRandom, shuffle } from "./shuffle";

export const RUN_MODES = ["all", "wrong"] as const;
export type RunMode = (typeof RUN_MODES)[number];
export type DifficultyFilter = Difficulty | "all";

const alternativeIndex = z
	.number()
	.int()
	.min(0)
	.max(ALTERNATIVE_COUNT - 1);

export const runSchema = z.object({
	area: z.string().min(1),
	mode: z.enum(RUN_MODES),
	difficulty: z.enum([...DIFFICULTIES, "all"]),
	seed: z.number().int(),
	index: z.number().int().min(0),
	items: z.array(
		z.object({
			id: z.string().min(1),
			/** `order[position]` is the original index of the alternative shown at that position. */
			order: z.array(alternativeIndex).length(ALTERNATIVE_COUNT),
			/** Original index of the alternative the student chose. Absent until answered. */
			chosen: alternativeIndex.optional(),
		}),
	),
});

export type Run = z.infer<typeof runSchema>;
export type RunItem = Run["items"][number];

export interface RunQuestion {
	id: string;
	difficulty: Difficulty;
	answer: number;
}

export interface RunOptions {
	area: string;
	mode: RunMode;
	difficulty: DifficultyFilter;
	seed: number;
	/** Maximum number of questions. Absent means all that match. */
	size?: number;
	/** Ids answered wrongly before, used by the "wrong" mode. */
	wrongIds?: ReadonlySet<string>;
}

export function selectQuestions<T extends RunQuestion>(questions: readonly T[], options: RunOptions): T[] {
	return questions.filter((question) => {
		if (options.difficulty !== "all" && question.difficulty !== options.difficulty) {
			return false;
		}
		return options.mode === "all" || (options.wrongIds?.has(question.id) ?? false);
	});
}

// EN: Both the questions and the alternatives of each question are shuffled. The answer key
//     stays correct because `order` keeps the original index of every alternative, and the
//     key is always compared against original indexes, never against screen positions.
// PT: Tanto as questões quanto as alternativas de cada questão são embaralhadas. O gabarito
//     continua correto porque `order` guarda o índice original de cada alternativa, e o gabarito
//     é sempre comparado com índices originais, nunca com posições na tela.
export function createRun(questions: readonly RunQuestion[], options: RunOptions): Run {
	const random = createRandom(options.seed);
	const selected = shuffle(selectQuestions(questions, options), random).slice(0, options.size);
	const positions = Array.from({ length: ALTERNATIVE_COUNT }, (_, index) => index);
	return {
		area: options.area,
		mode: options.mode,
		difficulty: options.difficulty,
		seed: options.seed,
		index: 0,
		items: selected.map((question) => ({ id: question.id, order: shuffle(positions, random) })),
	};
}

/** Records the alternative chosen at a screen position. An answered question is locked. */
export function answer(run: Run, position: number): Run {
	const item = run.items[run.index];
	const chosen = item?.order[position];
	if (item === undefined || chosen === undefined || item.chosen !== undefined) {
		return run;
	}
	const items = run.items.map((current, index) => (index === run.index ? { ...current, chosen } : current));
	return { ...run, items };
}

export function next(run: Run): Run {
	return run.index < run.items.length - 1 ? { ...run, index: run.index + 1 } : run;
}

export function isLast(run: Run): boolean {
	return run.index >= run.items.length - 1;
}

export interface Score {
	total: number;
	answered: number;
	right: number;
	wrong: RunItem[];
}

export function score(run: Run, answers: ReadonlyMap<string, number>): Score {
	const answered = run.items.filter((item) => item.chosen !== undefined);
	const wrong = answered.filter((item) => item.chosen !== answers.get(item.id));
	return { total: run.items.length, answered: answered.length, right: answered.length - wrong.length, wrong };
}
