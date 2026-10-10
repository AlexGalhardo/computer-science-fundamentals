// EN: The content model of the quiz. Every question file is plain JSON, so nothing stops a
//     typo from reaching the app. This module is the single gate: Zod schemas describe the
//     shape once, and from them come both the runtime check and the TypeScript types, so the
//     two can never drift apart.
// PT: O modelo de conteúdo do quiz. Todo arquivo de questões é JSON puro, então nada impede
//     um erro de digitação de chegar ao app. Este módulo é a única porta de entrada: schemas
//     Zod descrevem o formato uma vez, e deles saem tanto a verificação em tempo de execução
//     quanto os tipos TypeScript, de modo que os dois nunca divergem.
// ES: El modelo de contenido del quiz. Todo archivo de preguntas es JSON puro, así que nada impide
//     que un error de tipeo llegue a la app. Este módulo es la única puerta de entrada: los schemas
//     Zod describen el formato una vez, y de ellos salen tanto la verificación en tiempo de ejecución
//     como los tipos de TypeScript, de modo que los dos nunca divergen.

import { z } from "zod";

export const LANGUAGES = ["en", "pt", "es"] as const;
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
// ES: Una lista de exactamente cinco textos no vacíos. Alternativas y explicaciones siguen la misma
//     regla, porque la explicación `i` explica la alternativa `i`: las dos listas deben coincidir.
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
		// ES: La comparación distingue mayúsculas a propósito: `O(n)` y `o(n)`, o `Ω` y `ω`, son
		//     notaciones distintas y pueden ser alternativas de la misma pregunta.
		// EN: Two identical alternatives would mean two correct answers (or two identical wrong
		//     ones), and the rule of the quiz is exactly one correct alternative.
		// PT: Duas alternativas idênticas significariam duas respostas corretas (ou duas erradas
		//     iguais), e a regra do quiz é exatamente uma alternativa correta.
		// ES: Dos alternativas idénticas significarían dos respuestas correctas (o dos incorrectas
		//     iguales), y la regla del quiz es exactamente una alternativa correcta.
		alternatives: fiveTexts.refine(
			(items) => new Set(items.map((item) => item.trim())).size === items.length,
			"alternatives must be different from each other",
		),
		/** One explanation per alternative, in the same order. */
		explanations: fiveTexts,
		concept: text,
		// EN: `snippet` is part of the question: code or a diagram the student must read to
		//     answer, shown with the statement. `example` is part of the explanation and is
		//     shown only after the answer, so a statement must never depend on it.
		// PT: `snippet` faz parte da questão: código ou diagrama que o estudante precisa ler
		//     para responder, mostrado junto do enunciado. `example` faz parte da explicação e
		//     só aparece depois da resposta, então um enunciado nunca pode depender dele.
		// ES: `snippet` es parte de la pregunta: código o un diagrama que el estudiante debe leer
		//     para responder, mostrado junto al enunciado. `example` es parte de la explicación y
		//     solo aparece después de la respuesta, así que un enunciado nunca puede depender de él.
		snippet: exampleSchema.optional(),
		example: exampleSchema.optional(),
	},
	{ error: "language block is missing" },
);

// EN: `answer` is a single index, so "two correct answers" cannot be expressed as a number.
//     A list such as [1, 2] is rejected here, which is how the one-correct rule is enforced.
// PT: `answer` é um único índice, então "duas respostas corretas" não cabe em um número.
//     Uma lista como [1, 2] é rejeitada aqui, e é assim que a regra de uma correta é garantida.
// ES: `answer` es un único índice, así que "dos respuestas correctas" no cabe en un número.
//     Una lista como [1, 2] se rechaza aquí, y así se garantiza la regla de una sola correcta.
const ANSWER = `must be a single integer from 0 to ${ALTERNATIVE_COUNT - 1}`;

function sameInEveryLanguage(
	question: Record<Language, { example?: unknown; snippet?: unknown }>,
	field: "example" | "snippet",
): boolean {
	return new Set(LANGUAGES.map((language) => question[language][field] === undefined)).size === 1;
}

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
		en: questionTextSchema,
		pt: questionTextSchema,
		es: questionTextSchema,
	})
	// EN: Every language must say the same thing in the same shape: an example in one language
	//     only would make the versions of the question different.
	// PT: Todos os idiomas precisam dizer a mesma coisa no mesmo formato: um exemplo em apenas um
	//     idioma tornaria as versões da questão diferentes.
	// ES: Todos los idiomas deben decir lo mismo con la misma forma: un ejemplo en un solo
	//     idioma haría que las versiones de la pregunta fueran distintas.
	.refine((question) => sameInEveryLanguage(question, "example"), {
		path: ["example"],
		message: "must be present in every language or in none",
	})
	.refine((question) => sameInEveryLanguage(question, "snippet"), {
		path: ["snippet"],
		message: "must be present in every language or in none",
	});

const localisedNameSchema = z.object({ en: text, pt: text, es: text });

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

// EN: The theory summary of an area: an introduction, then sections the student can jump to from
//     a table of contents. A section is a list of blocks, and each block has a `type` that says
//     how it is drawn (a paragraph, a list, a table, code, a text diagram, a callout, a bar chart
//     or a link to a video). Keeping it as data instead of free HTML means the same file can be
//     validated, compared between languages and drawn in the light and dark themes.
// PT: O resumo teórico de uma área: uma introdução e depois seções que o estudante alcança por um
//     sumário. Uma seção é uma lista de blocos, e cada bloco tem um `type` que diz como ele é
//     desenhado (parágrafo, lista, tabela, código, diagrama em texto, destaque, gráfico de barras
//     ou link para um vídeo). Guardar como dados, em vez de HTML livre, permite validar o mesmo
//     arquivo, comparar os idiomas e desenhar nos temas claro e escuro.
// ES: El resumen teórico de un área: una introducción y luego secciones a las que el estudiante
//     llega desde un índice. Una sección es una lista de bloques, y cada bloque tiene un `type`
//     que dice cómo se dibuja (párrafo, lista, tabla, código, diagrama de texto, destacado,
//     gráfico de barras o enlace a un video). Guardarlo como datos, en vez de HTML libre, permite
//     validar el mismo archivo, comparar los idiomas y dibujarlo en los temas claro y oscuro.
export const CALLOUT_TONES = ["analogy", "tip", "warning", "remember"] as const;

const HTTPS_URL = "must be an https:// URL";
const httpsUrl = z.string({ error: HTTPS_URL }).regex(/^https:\/\/[^\s]+$/, HTTPS_URL);

const theoryBlockSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("paragraph"), text }),
	z.object({ type: z.literal("heading"), text }),
	z.object({ type: z.literal("list"), ordered: z.boolean().optional(), items: z.array(text).min(1) }),
	z
		.object({
			type: z.literal("table"),
			caption: text.optional(),
			headers: z.array(text).min(2, "must have at least 2 columns"),
			rows: z.array(z.array(z.string())).min(1, "must have at least 1 row"),
		})
		.refine((table) => table.rows.every((row) => row.length === table.headers.length), {
			path: ["rows"],
			message: "every row must have one cell per header",
		}),
	z.object({ type: z.literal("code"), language: text, content: text, caption: text.optional() }),
	z.object({ type: z.literal("diagram"), content: text, caption: text.optional() }),
	z.object({ type: z.literal("callout"), tone: z.enum(CALLOUT_TONES), text }),
	z.object({
		type: z.literal("chart"),
		title: text,
		unit: text.optional(),
		bars: z
			.array(z.object({ label: text, value: z.number().min(0, "must not be negative") }))
			.min(2, "must have at least 2 bars"),
	}),
	z.object({ type: z.literal("video"), title: text, url: httpsUrl }),
]);

const theorySectionSchema = z.object({
	/** Anchor of the section: the table of contents links to `#<id>`. */
	id: slug,
	title: text,
	blocks: z.array(theoryBlockSchema).min(1, "must have at least 1 block"),
});

export const theorySchema = z.object({
	area: slug,
	intro: z.array(text).min(1, "must have at least 1 paragraph"),
	sections: z
		.array(theorySectionSchema)
		.min(3, "must have at least 3 sections")
		.superRefine((sections, context) => {
			const seen = new Set<string>();
			sections.forEach((section, index) => {
				if (seen.has(section.id)) {
					context.addIssue({
						code: "custom",
						path: [index, "id"],
						message: `duplicate section "${section.id}"`,
					});
				}
				seen.add(section.id);
			});
		}),
});

export type Example = z.infer<typeof exampleSchema>;
export type QuestionText = z.infer<typeof questionTextSchema>;
export type Question = z.infer<typeof questionSchema>;
export type LocalisedName = z.infer<typeof localisedNameSchema>;
export type CoverageTopic = z.infer<typeof coverageTopicSchema>;
export type Coverage = z.infer<typeof coverageSchema>;
export type Area = z.infer<typeof areaSchema>;
export type MiniProject = z.infer<typeof miniProjectSchema>;
export type TheoryBlock = z.infer<typeof theoryBlockSchema>;
export type TheorySection = z.infer<typeof theorySectionSchema>;
export type Theory = z.infer<typeof theorySchema>;

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

// EN: Zod reports where an error is as a path such as ["pt", "explanations", 3]. Writing it as
//     `pt.explanations[3]` lets an author find the broken field in the JSON file at a glance.
// PT: O Zod informa onde está o erro como um caminho, por exemplo ["pt", "explanations", 3].
//     Escrevê-lo como `pt.explanations[3]` deixa o autor achar o campo quebrado no JSON de relance.
// ES: Zod informa dónde está el error como una ruta, por ejemplo ["pt", "explanations", 3].
//     Escribirlo como `pt.explanations[3]` deja que el autor encuentre el campo roto en el JSON de un vistazo.
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

export function validateTheory(value: unknown): Result<Theory> {
	return parse(theorySchema, value);
}

// EN: The three languages of a summary must have the same skeleton: the same sections in the
//     same order, and in each section the same kinds of block. Only the words change. This is
//     what lets a link such as `#big-o-notation` work in every language.
// PT: Os três idiomas de um resumo precisam ter o mesmo esqueleto: as mesmas seções na mesma
//     ordem e, em cada seção, os mesmos tipos de bloco. Só as palavras mudam. É isso que faz um
//     link como `#big-o-notation` funcionar em todos os idiomas.
// ES: Los tres idiomas de un resumen deben tener el mismo esqueleto: las mismas secciones en el
//     mismo orden y, en cada sección, los mismos tipos de bloque. Solo cambian las palabras. Eso
//     es lo que hace que un enlace como `#big-o-notation` funcione en todos los idiomas.
export function theoryShape(theory: Theory): string {
	return theory.sections
		.map((section) => `${section.id}(${section.blocks.map((block) => block.type).join(",")})`)
		.join(" ");
}
