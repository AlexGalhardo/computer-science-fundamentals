// EN: Tests of the content model. Each broken case is built by copying a valid question and
//     damaging one thing, so a failing test points at exactly one rule.
// PT: Testes do modelo de conteúdo. Cada caso quebrado é feito copiando uma questão válida e
//     estragando uma única coisa, para que um teste que falha aponte exatamente uma regra.

import { describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { checkContent } from "../../src/content/check";
import { compareAnswers, renderReview, toBlind } from "../../src/content/review";
import { type Question, validateCoverage, validateQuestion } from "../../src/content/schema";

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
		expect(errorsOf(question).join("\n")).toContain("example: must be present in both languages");
	});

	test("rejects a snippet in only one language", () => {
		const question = clone();
		(question.en as { snippet?: unknown }).snippet = { kind: "code", language: "ts", content: "x" };
		expect(errorsOf(question).join("\n")).toContain("snippet: must be present in both languages");
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
		const topic = { slug: "a", name: { pt: "A", en: "A" }, source: "ch. 1", target: 0 };
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
		const answers = Object.fromEntries(sample.map((question) => [question.id, question.answer]));
		const wrongKey = structuredClone(sample);
		(wrongKey[1] as Question).answer = 0;
		const disagreements = compareAnswers(wrongKey, answers, "en");
		expect(disagreements.map((item) => item.id)).toEqual(["big-o-searching-02"]);
		const report = renderReview("big-o", wrongKey.length, disagreements, "2026-01-01");
		expect(report).toContain("## big-o-searching-02");
		expect(report).toContain("Disagreements: 1");
	});

	test("an unanswered question counts as a disagreement", () => {
		expect(compareAnswers(sample, {}, "en")).toHaveLength(sample.length);
	});
});
