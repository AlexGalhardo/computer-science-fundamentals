// EN: The content model of the quiz. Every question file is plain JSON, so nothing stops a
//     typo from reaching the app. This module is the single gate: Zod schemas describe the
//     shape once, and from them come both the runtime check and the TypeScript types, so the
//     two can never drift apart.
// PT: O modelo de conteúdo do quiz. Todo arquivo de questões é JSON puro, então nada impede
//     um erro de digitação de chegar ao app. Este módulo é a única porta de entrada: schemas
//     Zod descrevem o formato uma vez, e deles saem tanto a verificação em tempo de execução
//     quanto os tipos TypeScript, de modo que os dois nunca divergem.

import { z } from "zod";

export const LANGUAGES = ["pt", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIFFICULTIES = ["basic", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ALTERNATIVE_COUNT = 5;

const NON_EMPTY = "must be a non-empty string";
const text = z.string({ error: NON_EMPTY }).refine((value) => value.trim().length > 0, NON_EMPTY);

const SLUG = "must be a lowercase kebab-case slug";
const slug = z.string({ error: SLUG }).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, SLUG);

// EN: A list of exactly five non-empty texts. Alternatives and explanations share this rule,
//     because explanation `i` explains alternative `i`: the two lists must line up.
// PT: Uma lista de exatamente cinco textos não vazios. Alternativas e explicações seguem a mesma
//     regra, porque a explicação `i` explica a alternativa `i`: as duas listas precisam casar.
const FIVE = `must have exactly ${ALTERNATIVE_COUNT} items`;
const fiveTexts = z.array(text, { error: FIVE }).length(ALTERNATIVE_COUNT, FIVE);

const exampleSchema = z.object({
	kind: z.enum(["code", "diagram"], { error: 'must be "code" or "diagram"' }),
	/** Language used for syntax highlighting. Only meaningful when `kind` is `code`. */
	language: text.optional(),
	content: text,
});

const questionTextSchema = z.object(
	{
		statement: text,
		// EN: The comparison is case-sensitive on purpose: `O(n)` and `o(n)`, or `Ω` and `ω`, are
		//     different notations and both may be alternatives of the same question.
		// PT: A comparação diferencia maiúsculas de propósito: `O(n)` e `o(n)`, ou `Ω` e `ω`, são
		//     notações diferentes e podem ser alternativas da mesma questão.
		// EN: Two identical alternatives would mean two correct answers (or two identical wrong
		//     ones), and the rule of the quiz is exactly one correct alternative.
		// PT: Duas alternativas idênticas significariam duas respostas corretas (ou duas erradas
		//     iguais), e a regra do quiz é exatamente uma alternativa correta.
		alternatives: fiveTexts.refine(
			(items) => new Set(items.map((item) => item.trim())).size === items.length,
			"alternatives must be different from each other",
		),
		/** One explanation per alternative, in the same order. */
		explanations: fiveTexts,
		concept: text,
		example: exampleSchema.optional(),
	},
	{ error: "language block is missing" },
);

// EN: `answer` is a single index, so "two correct answers" cannot be expressed as a number.
//     A list such as [1, 2] is rejected here, which is how the one-correct rule is enforced.
// PT: `answer` é um único índice, então "duas respostas corretas" não cabe em um número.
//     Uma lista como [1, 2] é rejeitada aqui, e é assim que a regra de uma correta é garantida.
const ANSWER = `must be a single integer from 0 to ${ALTERNATIVE_COUNT - 1}`;

export const questionSchema = z
	.object({
		id: slug,
		area: slug,
		topic: slug,
		difficulty: z.enum(DIFFICULTIES, { error: `must be one of ${DIFFICULTIES.join(", ")}` }),
		/** Index (0 to 4) of the correct alternative. */
		answer: z
			.number({ error: ANSWER })
			.int(ANSWER)
			.min(0, ANSWER)
			.max(ALTERNATIVE_COUNT - 1, ANSWER),
		source: text,
		miniProject: text.optional(),
		pt: questionTextSchema,
		en: questionTextSchema,
	})
	// EN: Both languages must say the same thing in the same shape: an example in one language
	//     only would make the two versions of the question different.
	// PT: Os dois idiomas precisam dizer a mesma coisa no mesmo formato: um exemplo em apenas um
	//     idioma tornaria as duas versões da questão diferentes.
	.refine((question) => (question.pt.example === undefined) === (question.en.example === undefined), {
		path: ["example"],
		message: "must be present in both languages or in neither",
	});

const localisedNameSchema = z.object({ pt: text, en: text });

const coverageTopicSchema = z.object({
	slug,
	name: localisedNameSchema,
	source: text,
	target: z.number({ error: "must be a positive integer" }).int("must be a positive integer").min(1, {
		error: "must be a positive integer",
	}),
});

export const coverageSchema = z.object({
	area: slug,
	sources: z.array(text).min(1, "must be a non-empty list of texts"),
	topics: z
		.array(coverageTopicSchema)
		.min(1, "must be a non-empty list")
		.superRefine((topics, context) => {
			const seen = new Set<string>();
			topics.forEach((topic, index) => {
				if (seen.has(topic.slug)) {
					context.addIssue({
						code: "custom",
						path: [index, "slug"],
						message: `duplicate topic "${topic.slug}"`,
					});
				}
				seen.add(topic.slug);
			});
		}),
});

export const areaSchema = z.object({
	code: text,
	slug,
	name: localisedNameSchema,
	kind: z.enum(["theory-only", "theory-and-practice"]),
	wave: z.number().int().min(1),
	target: z.number().int().min(1),
});

export const miniProjectSchema = z.object({
	code: text,
	area: slug,
	path: text,
	status: z.enum(["planned", "done"]),
});

export type Example = z.infer<typeof exampleSchema>;
export type QuestionText = z.infer<typeof questionTextSchema>;
export type Question = z.infer<typeof questionSchema>;
export type LocalisedName = z.infer<typeof localisedNameSchema>;
export type CoverageTopic = z.infer<typeof coverageTopicSchema>;
export type Coverage = z.infer<typeof coverageSchema>;
export type Area = z.infer<typeof areaSchema>;
export type MiniProject = z.infer<typeof miniProjectSchema>;

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

// EN: Zod reports where an error is as a path such as ["pt", "explanations", 3]. Writing it as
//     `pt.explanations[3]` lets an author find the broken field in the JSON file at a glance.
// PT: O Zod informa onde está o erro como um caminho, por exemplo ["pt", "explanations", 3].
//     Escrevê-lo como `pt.explanations[3]` deixa o autor achar o campo quebrado no JSON de relance.
function formatIssue(issue: z.core.$ZodIssue): string {
	const where = issue.path
		.map((part, index) => (typeof part === "number" ? `[${part}]` : `${index === 0 ? "" : "."}${String(part)}`))
		.join("");
	return where === "" ? issue.message : `${where}: ${issue.message}`;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): Result<T> {
	const result = schema.safeParse(value);
	if (result.success) {
		return { ok: true, value: result.data };
	}
	return { ok: false, errors: result.error.issues.map(formatIssue) };
}

export function validateQuestion(value: unknown): Result<Question> {
	return parse(questionSchema, value);
}

export function validateCoverage(value: unknown): Result<Coverage> {
	return parse(coverageSchema, value);
}

export function validateAreas(value: unknown): Result<Area[]> {
	return parse(z.array(areaSchema), value);
}

export function validateMiniProjects(value: unknown): Result<MiniProject[]> {
	return parse(z.array(miniProjectSchema), value);
}
