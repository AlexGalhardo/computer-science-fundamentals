// EN: The content model of the quiz. Every question file is plain JSON, so nothing stops a
//     typo from reaching the app. This module is the single gate: it turns `unknown` data into
//     typed values, or into a list of human-readable errors. No library is used on purpose,
//     so the validation rules can be read top to bottom.
// PT: O modelo de conteúdo do quiz. Todo arquivo de questões é JSON puro, então nada impede
//     um erro de digitação de chegar ao app. Este módulo é a única porta de entrada: transforma
//     dados `unknown` em valores tipados, ou em uma lista de erros legíveis. Nenhuma biblioteca
//     é usada de propósito, para que as regras possam ser lidas de cima a baixo.

export const LANGUAGES = ["pt", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIFFICULTIES = ["basic", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ALTERNATIVE_COUNT = 5;

export interface Example {
	kind: "code" | "diagram";
	/** Language used for syntax highlighting. Only meaningful when `kind` is `code`. */
	language?: string;
	content: string;
}

export interface QuestionText {
	statement: string;
	alternatives: string[];
	/** One explanation per alternative, in the same order. */
	explanations: string[];
	concept: string;
	example?: Example;
}

export interface Question {
	id: string;
	area: string;
	topic: string;
	difficulty: Difficulty;
	/** Index (0 to 4) of the correct alternative. */
	answer: number;
	source: string;
	miniProject?: string;
	pt: QuestionText;
	en: QuestionText;
}

export interface LocalisedName {
	pt: string;
	en: string;
}

export interface CoverageTopic {
	slug: string;
	name: LocalisedName;
	source: string;
	target: number;
}

export interface Coverage {
	area: string;
	sources: string[];
	topics: CoverageTopic[];
}

export interface Area {
	code: string;
	slug: string;
	name: LocalisedName;
	kind: "theory-only" | "theory-and-practice";
	wave: number;
	target: number;
}

export interface MiniProject {
	code: string;
	area: string;
	path: string;
	status: "planned" | "done";
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function checkExample(value: unknown, where: string, errors: string[]): void {
	if (!isRecord(value)) {
		errors.push(`${where}: must be an object`);
		return;
	}
	if (value.kind !== "code" && value.kind !== "diagram") {
		errors.push(`${where}.kind: must be "code" or "diagram"`);
	}
	if (!isText(value.content)) {
		errors.push(`${where}.content: must be a non-empty string`);
	}
	if (value.language !== undefined && !isText(value.language)) {
		errors.push(`${where}.language: must be a non-empty string when present`);
	}
}

// EN: A list of exactly five non-empty texts. Alternatives and explanations share this rule,
//     because explanation `i` explains alternative `i`: the two lists must line up.
// PT: Uma lista de exatamente cinco textos não vazios. Alternativas e explicações seguem a mesma
//     regra, porque a explicação `i` explica a alternativa `i`: as duas listas precisam casar.
function checkFiveTexts(value: unknown, where: string, errors: string[]): value is string[] {
	if (!Array.isArray(value)) {
		errors.push(`${where}: must be a list of ${ALTERNATIVE_COUNT} texts`);
		return false;
	}
	if (value.length !== ALTERNATIVE_COUNT) {
		errors.push(`${where}: must have exactly ${ALTERNATIVE_COUNT} items, found ${value.length}`);
		return false;
	}
	let valid = true;
	value.forEach((item, index) => {
		if (!isText(item)) {
			errors.push(`${where}[${index}]: must be a non-empty string`);
			valid = false;
		}
	});
	return valid;
}

function checkText(value: unknown, language: Language, errors: string[]): void {
	if (!isRecord(value)) {
		errors.push(`${language}: language block is missing`);
		return;
	}
	if (!isText(value.statement)) {
		errors.push(`${language}.statement: must be a non-empty string`);
	}
	if (!isText(value.concept)) {
		errors.push(`${language}.concept: must be a non-empty string`);
	}
	if (checkFiveTexts(value.alternatives, `${language}.alternatives`, errors)) {
		// EN: Two identical alternatives would mean two correct answers (or two identical wrong
		//     ones), and the rule of the quiz is exactly one correct alternative.
		// PT: Duas alternativas idênticas significariam duas respostas corretas (ou duas erradas
		//     iguais), e a regra do quiz é exatamente uma alternativa correta.
		const unique = new Set(value.alternatives.map((item) => item.trim().toLowerCase()));
		if (unique.size !== ALTERNATIVE_COUNT) {
			errors.push(`${language}.alternatives: alternatives must be different from each other`);
		}
	}
	checkFiveTexts(value.explanations, `${language}.explanations`, errors);
	if (value.example !== undefined) {
		checkExample(value.example, `${language}.example`, errors);
	}
}

export function validateQuestion(value: unknown): Result<Question> {
	const errors: string[] = [];
	if (!isRecord(value)) {
		return { ok: false, errors: ["question must be an object"] };
	}
	if (!isText(value.id) || !SLUG.test(value.id)) {
		errors.push("id: must be a lowercase kebab-case identifier");
	}
	if (!isText(value.area) || !SLUG.test(value.area)) {
		errors.push("area: must be a lowercase kebab-case slug");
	}
	if (!isText(value.topic) || !SLUG.test(value.topic)) {
		errors.push("topic: must be a lowercase kebab-case slug");
	}
	if (!DIFFICULTIES.includes(value.difficulty as Difficulty)) {
		errors.push(`difficulty: must be one of ${DIFFICULTIES.join(", ")}`);
	}
	// EN: `answer` is a single index, so "two correct answers" cannot be expressed as a number.
	//     A list such as [1, 2] is rejected here, which is how the one-correct rule is enforced.
	// PT: `answer` é um único índice, então "duas respostas corretas" não cabe em um número.
	//     Uma lista como [1, 2] é rejeitada aqui, e é assim que a regra de uma correta é garantida.
	if (
		typeof value.answer !== "number" ||
		!Number.isInteger(value.answer) ||
		value.answer < 0 ||
		value.answer >= ALTERNATIVE_COUNT
	) {
		errors.push(`answer: must be a single integer from 0 to ${ALTERNATIVE_COUNT - 1}`);
	}
	if (!isText(value.source)) {
		errors.push("source: must name the book or lecture and the chapter");
	}
	if (value.miniProject !== undefined && !isText(value.miniProject)) {
		errors.push("miniProject: must be a non-empty path when present");
	}
	for (const language of LANGUAGES) {
		checkText(value[language], language, errors);
	}
	// EN: Both languages must say the same thing in the same shape: an example in one language
	//     only would make the two versions of the question different.
	// PT: Os dois idiomas precisam dizer a mesma coisa no mesmo formato: um exemplo em apenas um
	//     idioma tornaria as duas versões da questão diferentes.
	const pt = value.pt;
	const en = value.en;
	if (isRecord(pt) && isRecord(en) && (pt.example === undefined) !== (en.example === undefined)) {
		errors.push("example: must be present in both languages or in neither");
	}
	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return { ok: true, value: value as unknown as Question };
}

function checkName(value: unknown, where: string, errors: string[]): void {
	if (!isRecord(value) || !isText(value.pt) || !isText(value.en)) {
		errors.push(`${where}: must have non-empty "pt" and "en" texts`);
	}
}

export function validateCoverage(value: unknown): Result<Coverage> {
	const errors: string[] = [];
	if (!isRecord(value)) {
		return { ok: false, errors: ["coverage must be an object"] };
	}
	if (!isText(value.area) || !SLUG.test(value.area)) {
		errors.push("area: must be a lowercase kebab-case slug");
	}
	if (!Array.isArray(value.sources) || value.sources.length === 0 || !value.sources.every(isText)) {
		errors.push("sources: must be a non-empty list of texts");
	}
	if (!Array.isArray(value.topics) || value.topics.length === 0) {
		errors.push("topics: must be a non-empty list");
	} else {
		const seen = new Set<string>();
		value.topics.forEach((topic: unknown, index: number) => {
			const where = `topics[${index}]`;
			if (!isRecord(topic)) {
				errors.push(`${where}: must be an object`);
				return;
			}
			if (!isText(topic.slug) || !SLUG.test(topic.slug)) {
				errors.push(`${where}.slug: must be a lowercase kebab-case slug`);
			} else if (seen.has(topic.slug)) {
				errors.push(`${where}.slug: duplicate topic "${topic.slug}"`);
			} else {
				seen.add(topic.slug);
			}
			checkName(topic.name, `${where}.name`, errors);
			if (!isText(topic.source)) {
				errors.push(`${where}.source: must name the chapter or lecture`);
			}
			if (typeof topic.target !== "number" || !Number.isInteger(topic.target) || topic.target < 1) {
				errors.push(`${where}.target: must be a positive integer`);
			}
		});
	}
	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return { ok: true, value: value as unknown as Coverage };
}
