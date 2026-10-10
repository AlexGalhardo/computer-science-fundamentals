// EN: Tests of the content model. Each broken case is built by copying a valid question and
//     damaging one thing, so a failing test points at exactly one rule.
// PT: Testes do modelo de conteúdo. Cada caso quebrado é feito copiando uma questão válida e
//     estragando uma única coisa, para que um teste que falha aponte exatamente uma regra.
// ES: Pruebas del modelo de contenido. Cada caso roto se construye copiando una pregunta válida y
//     dañando una sola cosa, para que una prueba que falla apunte exactamente a una regla.

import { describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { checkContent } from "../../src/content/check";
import { compareAnswers, KEEP_MARKER, keepHandWritten, renderReview, toBlind } from "../../src/content/review";
import { type Question, validateCoverage, validateQuestion, validateTheory } from "../../src/content/schema";

const fixtures = resolve(import.meta.dir, "..", "fixtures", "content");
const repoRoot = resolve(import.meta.dir, "..", "..", "..");
const sample = JSON.parse(readFileSync(join(fixtures, "big-o", "searching.json"), "utf8")) as Question[];

function clone(): Record<string, unknown> {
	return structuredClone(sample[0]) as unknown as Record<string, unknown>;
}

function errorsOf(value: unknown): string[] {
	const result = validateQuestion(value);
	return result.ok ? [] : result.errors;
}

// EN: Copies the valid fixture to a temporary folder and lets the test damage the copy.
// PT: Copia o fixture válido para uma pasta temporária e deixa o teste estragar a cópia.
// ES: Copia el fixture válido a una carpeta temporal y deja que la prueba dañe la copia.
function brokenContent(damage: (questions: Record<string, unknown>[]) => void): string {
	const dir = mkdtempSync(join(tmpdir(), "quiz-content-"));
	cpSync(fixtures, dir, { recursive: true });
	const questions = structuredClone(sample) as unknown as Record<string, unknown>[];
	damage(questions);
	writeFileSync(join(dir, "big-o", "searching.json"), JSON.stringify(questions));
	return dir;
}

describe("question schema", () => {
	test("accepts the valid fixture", () => {
		for (const question of sample) {
			expect(errorsOf(question)).toEqual([]);
		}
	});

	test("rejects a question with 4 alternatives", () => {
		const question = clone();
		(question.en as { alternatives: string[] }).alternatives.pop();
		expect(errorsOf(question).join("\n")).toContain("en.alternatives: must have exactly 5 items");
	});

	test("rejects two correct answers", () => {
		const question = clone();
		question.answer = [1, 2];
		expect(errorsOf(question).join("\n")).toContain("answer: must be a single integer");
	});

	test("rejects two identical alternatives", () => {
		const question = clone();
		(question.pt as { alternatives: string[] }).alternatives[2] = "O(1)";
		expect(errorsOf(question).join("\n")).toContain("pt.alternatives: alternatives must be different");
	});

	test("rejects a missing explanation", () => {
		const question = clone();
		(question.pt as { explanations: string[] }).explanations[3] = " ";
		expect(errorsOf(question).join("\n")).toContain("pt.explanations[3]");
	});

	test("rejects a missing language", () => {
		const question = clone();
		delete question.pt;
		expect(errorsOf(question).join("\n")).toContain("pt: language block is missing");
	});

	test("rejects an example in only one language", () => {
		const question = clone();
		delete (question.en as { example?: unknown }).example;
		expect(errorsOf(question).join("\n")).toContain("example: must be present in every language");
	});

	test("rejects a snippet in only one language", () => {
		const question = clone();
		(question.en as { snippet?: unknown }).snippet = { kind: "code", language: "ts", content: "x" };
		expect(errorsOf(question).join("\n")).toContain("snippet: must be present in every language");
	});

	test("rejects an answer out of range and an unknown difficulty", () => {
		const question = clone();
		question.answer = 5;
		question.difficulty = "hard";
		const errors = errorsOf(question).join("\n");
		expect(errors).toContain("answer:");
		expect(errors).toContain("difficulty:");
	});
});

describe("coverage schema", () => {
	test("rejects duplicate topics and a non-positive target", () => {
		const topic = { slug: "a", name: { pt: "A", en: "A", es: "A" }, source: "ch. 1", target: 0 };
		const result = validateCoverage({ area: "big-o", sources: ["x"], topics: [topic, { ...topic, target: 2 }] });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.join("\n")).toContain("target: must be a positive integer");
			expect(result.errors.join("\n")).toContain('duplicate topic "a"');
		}
	});
});

describe("content check", () => {
	test("passes on the sample content and reports target against actual per topic", () => {
		const result = checkContent({ contentDir: fixtures, repoRoot, requireTargets: true });
		expect(result.errors).toEqual([]);
		expect(result.areas[0]?.topics).toEqual([{ slug: "searching", target: 3, actual: 3 }]);
		expect(result.areas[0]?.difficulty).toEqual({ basic: 1, intermediate: 1, advanced: 1 });
	});

	test("warns when the correct position is predictable", () => {
		const dir = brokenContent((questions) => {
			// EN: 21 copies with new ids and the same answer: enough questions for the warning.
			// PT: 21 cópias com ids novos e a mesma resposta: questões suficientes para o aviso.
			// ES: 21 copias con ids nuevos y la misma respuesta: suficientes preguntas para el aviso.
			const copies = Array.from({ length: 21 }, (_, index) => ({
				...structuredClone(questions[1]),
				id: `big-o-searching-${index + 10}`,
				answer: 2,
			}));
			questions.splice(0, questions.length, ...copies);
		});
		const result = checkContent({ contentDir: dir, repoRoot });
		expect(result.errors).toEqual([]);
		expect(result.warnings.join(" ")).toContain("alternative 2 is the correct one in 21 of 21 questions");
	});

	test("fails on a duplicate id", () => {
		const dir = brokenContent((questions) => {
			(questions[1] as { id: string }).id = "big-o-searching-01";
		});
		expect(checkContent({ contentDir: dir, repoRoot }).errors.join("\n")).toContain("duplicate id");
	});

	test("fails on an unknown area", () => {
		const dir = brokenContent((questions) => {
			(questions[0] as { area: string }).area = "astrology";
		});
		expect(checkContent({ contentDir: dir, repoRoot }).errors.join("\n")).toContain('unknown area "astrology"');
	});

	test("fails on a mini-project path that does not exist", () => {
		const dir = brokenContent((questions) => {
			(questions[0] as { miniProject: string }).miniProject = "projects/big-o/does-not-exist";
		});
		expect(checkContent({ contentDir: dir, repoRoot }).errors.join("\n")).toContain("does not exist");
	});

	test("with requireTargets, fails when a topic is below its target", () => {
		const dir = brokenContent((questions) => {
			questions.pop();
		});
		expect(checkContent({ contentDir: dir, repoRoot }).errors).toEqual([]);
		const strict = checkContent({ contentDir: dir, repoRoot, requireTargets: true });
		expect(strict.errors.join("\n")).toContain('topic "searching" has 2 of 3 questions');
	});

	test("the CLI exits 0 on the sample content and non-zero on a broken one", () => {
		const script = resolve(import.meta.dir, "..", "..", "scripts", "validate.ts");
		const good = Bun.spawnSync(["bun", "run", script, "--content", fixtures]);
		expect(good.exitCode).toBe(0);
		const dir = brokenContent((questions) => {
			(questions[0] as { answer: number }).answer = 9;
		});
		const bad = Bun.spawnSync(["bun", "run", script, "--content", dir]);
		expect(bad.exitCode).not.toBe(0);
	});
});

describe("blind review", () => {
	test("the blind export carries no answer key and no explanation", () => {
		const blind = JSON.stringify(toBlind(sample, "en"));
		expect(blind).not.toContain("answer");
		expect(blind).not.toContain("explanations");
		expect(blind).not.toContain("concept");
		expect(blind).not.toContain("example");
	});

	test("the blind export carries the snippet, which is part of the question", () => {
		const withSnippet = structuredClone(sample);
		const snippet = { kind: "code" as const, language: "ts", content: "for (;;) {}" };
		(withSnippet[0] as Question).en.snippet = snippet;
		expect(toBlind(withSnippet, "en")[0]?.snippet).toBe("for (;;) {}");
	});

	test("lists exactly the question whose answer key is deliberately wrong", () => {
		// EN: The reviewer answers every question correctly. The key of question 2 is then
		//     corrupted, so the comparison must report that question and nothing else.
		// PT: O revisor acerta todas as questões. O gabarito da questão 2 é então corrompido,
		//     e a comparação precisa apontar essa questão e nenhuma outra.
		// ES: El revisor acierta todas las preguntas. La clave de la pregunta 2 se corrompe entonces,
		//     y la comparación debe señalar esa pregunta y ninguna otra.
		const answers = Object.fromEntries(sample.map((question) => [question.id, question.answer]));
		const wrongKey = structuredClone(sample);
		(wrongKey[1] as Question).answer = 0;
		const disagreements = compareAnswers(wrongKey, answers, "en");
		expect(disagreements.map((item) => item.id)).toEqual(["big-o-searching-02"]);
		const report = renderReview("big-o", wrongKey.length, disagreements, "2026-01-01");
		expect(report).toContain("## big-o-searching-02");
		expect(report).toContain("Disagreements: 1");
	});

	test("comparing again keeps the resolutions written by hand", () => {
		const first = keepHandWritten("# Blind review: a", undefined);
		expect(first).toContain(KEEP_MARKER);
		const edited = `${first}## Reviewer notes${String.fromCharCode(10)}key kept, because of X`;
		const second = keepHandWritten("# Blind review: a (new run)", edited);
		expect(second).toContain("(new run)");
		expect(second).toContain("key kept, because of X");
		// EN: A file written before the marker existed keeps its "Reviewer notes" section.
		// PT: Um arquivo escrito antes de o marcador existir mantém a seção "Reviewer notes".
		// ES: Un archivo escrito antes de que existiera el marcador mantiene su sección "Reviewer notes".
		const legacy = ["# old", "", "## Reviewer notes", "", "question rewritten"].join(String.fromCharCode(10));
		expect(keepHandWritten("# new", legacy)).toContain("question rewritten");
	});

	test("an unanswered question counts as a disagreement", () => {
		expect(compareAnswers(sample, {}, "en")).toHaveLength(sample.length);
	});
});

// EN: The theory summary is content too: a broken summary must stop the build, and the three
//     languages must keep the same sections, or a link to `#section` would work in one language
//     and fail in another.
// PT: O resumo teórico também é conteúdo: um resumo quebrado precisa parar o build, e os três
//     idiomas precisam manter as mesmas seções, senão um link para `#seção` funcionaria em um
//     idioma e falharia em outro.
// ES: El resumen teórico también es contenido: un resumen roto debe detener el build, y los tres
//     idiomas deben mantener las mismas secciones, o un enlace a `#sección` funcionaría en un
//     idioma y fallaría en otro.
describe("theory summary", () => {
	type Draft = { sections: { id: string; blocks: { type: string; rows?: string[][]; url?: string }[] }[] };
	const theoryPath = (dir: string, language: string): string => join(dir, "big-o", "theory", `${language}.json`);
	const readTheory = (language: string): Draft =>
		JSON.parse(readFileSync(theoryPath(fixtures, language), "utf8")) as Draft;
	const messages = (value: unknown): string => {
		const result = validateTheory(value);
		return result.ok ? "" : result.errors.join("\n");
	};

	function brokenTheory(language: string, damage: (theory: Draft) => void): string {
		const dir = mkdtempSync(join(tmpdir(), "quiz-theory-"));
		cpSync(fixtures, dir, { recursive: true });
		const theory = readTheory(language);
		damage(theory);
		writeFileSync(theoryPath(dir, language), JSON.stringify(theory));
		return dir;
	}

	test("accepts the fixture in the three languages and hands it to the area report", () => {
		for (const language of ["en", "pt", "es"]) {
			expect(messages(readTheory(language))).toBe("");
		}
		const result = checkContent({ contentDir: fixtures, repoRoot, requireTargets: true });
		expect(result.errors).toEqual([]);
		expect(result.areas[0]?.theory?.es.sections.map((section) => section.id)).toEqual([
			"linear-search",
			"binary-search",
			"which-one",
		]);
	});

	test("rejects fewer than 3 sections, a duplicate section, a ragged table and a non-https video", () => {
		const few = readTheory("en");
		few.sections.pop();
		expect(messages(few)).toContain("must have at least 3 sections");

		const twice = readTheory("en");
		(twice.sections[1] as { id: string }).id = "linear-search";
		expect(messages(twice)).toContain('duplicate section "linear-search"');

		const ragged = readTheory("en");
		ragged.sections[1]?.blocks.find((block) => block.type === "table")?.rows?.[0]?.pop();
		expect(messages(ragged)).toContain("every row must have one cell per header");

		const insecure = readTheory("en");
		const video = insecure.sections[2]?.blocks.find((block) => block.type === "video");
		expect(video).toBeDefined();
		(video as { url: string }).url = "http://example.test/video";
		expect(messages(insecure)).toContain("must be an https:// URL");
	});

	test("fails when a language has other sections or other block types than English", () => {
		const renamed = brokenTheory("pt", (theory) => {
			(theory.sections[0] as { id: string }).id = "busca-linear";
		});
		expect(checkContent({ contentDir: renamed, repoRoot }).errors.join("\n")).toContain(
			"big-o/theory/pt.json: sections and block types must match theory/en.json",
		);
		const shorter = brokenTheory("es", (theory) => {
			theory.sections[0]?.blocks.pop();
		});
		expect(checkContent({ contentDir: shorter, repoRoot }).errors.join("\n")).toContain("big-o/theory/es.json");
	});

	test("a missing summary is a warning, and an error with requireTargets", () => {
		const dir = mkdtempSync(join(tmpdir(), "quiz-theory-"));
		cpSync(fixtures, dir, { recursive: true });
		rmSync(theoryPath(dir, "es"));
		const relaxed = checkContent({ contentDir: dir, repoRoot });
		expect(relaxed.errors).toEqual([]);
		expect(relaxed.warnings.join("\n")).toContain("big-o/theory/es.json: theory summary is missing");
		expect(relaxed.areas[0]?.theory).toBeUndefined();
		const strict = checkContent({ contentDir: dir, repoRoot, requireTargets: true });
		expect(strict.errors.join("\n")).toContain("big-o/theory/es.json: theory summary is missing");
	});
});
