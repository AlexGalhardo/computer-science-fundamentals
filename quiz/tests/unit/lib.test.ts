// EN: Unit tests of the pure logic of the quiz: shuffling, runs, scoring, progress and the
//     dictionaries. None of them needs a browser.
// PT: Testes unitários da lógica pura do quiz: embaralhamento, rodadas, pontuação, progresso e
//     os dicionários. Nenhum deles precisa de navegador.
// ES: Pruebas unitarias de la lógica pura del quiz: mezcla, rondas, puntuación, progreso y
//     los diccionarios. Ninguna necesita navegador.

import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { format } from "../../src/i18n/index";
import { pt } from "../../src/i18n/pt";
import { highlight } from "../../src/lib/highlight";
import { parseInline } from "../../src/lib/inline";
import { type KeyValueStorage, loadProgress, recordAnswer, resetArea, summarise } from "../../src/lib/progress";
import { answer, createRun, isLast, next, type RunQuestion, score, selectQuestions } from "../../src/lib/run";
import { clearRun, loadRun, saveRun } from "../../src/lib/run-storage";
import { createRandom, shuffle } from "../../src/lib/shuffle";

function memoryStorage(): KeyValueStorage {
	const data = new Map<string, string>();
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => {
			data.set(key, value);
		},
		removeItem: (key) => {
			data.delete(key);
		},
	};
}

const questions: RunQuestion[] = [
	{ id: "a-1", difficulty: "basic", answer: 0 },
	{ id: "a-2", difficulty: "basic", answer: 3 },
	{ id: "a-3", difficulty: "intermediate", answer: 4 },
	{ id: "a-4", difficulty: "advanced", answer: 2 },
];
const key = new Map(questions.map((question) => [question.id, question.answer]));
const base = { area: "a", mode: "all", difficulty: "all" } as const;

describe("shuffle", () => {
	test("the same seed gives the same order, and another seed a different one", () => {
		const items = Array.from({ length: 20 }, (_, index) => index);
		expect(shuffle(items, createRandom(42))).toEqual(shuffle(items, createRandom(42)));
		expect(shuffle(items, createRandom(42))).not.toEqual(shuffle(items, createRandom(43)));
	});

	test("the result is a permutation and the input is not modified", () => {
		const items = [1, 2, 3, 4, 5];
		const result = shuffle(items, createRandom(7));
		expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
		expect(items).toEqual([1, 2, 3, 4, 5]);
	});
});

describe("run", () => {
	test("with a fixed seed, the correct alternative is still marked correct after shuffling", () => {
		const run = createRun(questions, { ...base, seed: 2026 });
		expect(run.items.map((item) => item.id).sort()).toEqual(["a-1", "a-2", "a-3", "a-4"]);
		// EN: The seed really shuffled something, otherwise this test would prove nothing.
		// PT: A semente realmente embaralhou algo, senão este teste não provaria nada.
		// ES: La semilla realmente mezcló algo, de lo contrario esta prueba no demostraría nada.
		expect(run.items.some((item) => item.order.join() !== "0,1,2,3,4")).toBe(true);

		let current = run;
		for (const item of run.items) {
			expect([...item.order].sort()).toEqual([0, 1, 2, 3, 4]);
			// EN: Click the screen position where the right alternative ended up.
			// PT: Clica na posição da tela onde a alternativa certa foi parar.
			// ES: Hace clic en la posición de la pantalla donde terminó la alternativa correcta.
			const position = item.order.indexOf(key.get(item.id) ?? -1);
			current = next(answer(current, position));
		}
		expect(score(current, key)).toMatchObject({ total: 4, answered: 4, right: 4, wrong: [] });
		expect(createRun(questions, { ...base, seed: 2026 })).toEqual(run);
	});

	test("an answered question is locked", () => {
		const run = createRun(questions, { ...base, seed: 1 });
		const first = answer(run, 0);
		const second = answer(first, 1);
		expect(second).toBe(first);
		expect(second.items[0]?.chosen).toBe(run.items[0]?.order[0]);
	});

	test("the score matches the answers given", () => {
		let run = createRun(questions, { ...base, seed: 5 });
		const wrongIds: string[] = [];
		run.items.forEach((item, index) => {
			const right = item.order.indexOf(key.get(item.id) ?? -1);
			const position = index % 2 === 0 ? right : (right + 1) % 5;
			if (index % 2 !== 0) {
				wrongIds.push(item.id);
			}
			run = next(answer(run, position));
		});
		const result = score(run, key);
		expect(result.right).toBe(2);
		expect(result.wrong.map((item) => item.id)).toEqual(wrongIds);
		expect(isLast(run)).toBe(true);
	});

	test("each difficulty filter selects only questions of that level", () => {
		for (const difficulty of ["basic", "intermediate", "advanced"] as const) {
			const selected = selectQuestions(questions, { ...base, difficulty, seed: 0 });
			expect(selected.length).toBeGreaterThan(0);
			expect(selected.every((question) => question.difficulty === difficulty)).toBe(true);
		}
	});

	test("the wrong mode selects exactly the questions answered wrongly, and size limits the run", () => {
		const wrongIds = new Set(["a-2", "a-4"]);
		const run = createRun(questions, { ...base, mode: "wrong", seed: 3, wrongIds });
		expect(run.items.map((item) => item.id).sort()).toEqual(["a-2", "a-4"]);
		expect(createRun(questions, { ...base, mode: "wrong", seed: 3, wrongIds: new Set() }).items).toEqual([]);
		expect(createRun(questions, { ...base, seed: 3, size: 3 }).items).toHaveLength(3);
	});

	test("a run is saved, loaded and cleared, and corrupt data is ignored", () => {
		const storage = memoryStorage();
		const run = createRun(questions, { ...base, seed: 9 });
		saveRun(storage, run);
		expect(loadRun(storage, "a")).toEqual(run);
		expect(loadRun(storage, "other")).toBeUndefined();
		storage.setItem("quiz.run.v1.a", "{not json");
		expect(loadRun(storage, "a")).toBeUndefined();
		saveRun(storage, run);
		clearRun(storage, "a");
		expect(loadRun(storage, "a")).toBeUndefined();
	});
});

describe("progress", () => {
	test("answers are stored per area and survive a new read", () => {
		const storage = memoryStorage();
		recordAnswer(storage, "a", "a-1", "right");
		recordAnswer(storage, "a", "a-2", "wrong");
		recordAnswer(storage, "b", "b-1", "wrong");
		const summary = summarise(loadProgress(storage), "a", ["a-1", "a-2", "a-3"]);
		expect(summary.right).toBe(1);
		expect(summary.wrong).toBe(1);
		expect([...summary.wrongIds]).toEqual(["a-2"]);
	});

	test("a wrong question leaves the wrong list once it is answered correctly", () => {
		const storage = memoryStorage();
		recordAnswer(storage, "a", "a-1", "wrong");
		recordAnswer(storage, "a", "a-2", "wrong");
		expect(summarise(loadProgress(storage), "a", ["a-1", "a-2"]).wrongIds.size).toBe(2);
		recordAnswer(storage, "a", "a-1", "right");
		recordAnswer(storage, "a", "a-2", "right");
		expect(summarise(loadProgress(storage), "a", ["a-1", "a-2"]).wrongIds.size).toBe(0);
	});

	test("reset clears one area and keeps the others", () => {
		const storage = memoryStorage();
		recordAnswer(storage, "a", "a-1", "right");
		recordAnswer(storage, "b", "b-1", "right");
		resetArea(storage, "a");
		expect(loadProgress(storage)).toEqual({ b: { "b-1": "right" } });
	});

	test("unreadable stored data counts as no progress, and removed questions are not counted", () => {
		const storage = memoryStorage();
		storage.setItem("quiz.progress.v1", '{"a": {"a-1": "maybe"}}');
		expect(loadProgress(storage)).toEqual({});
		recordAnswer(storage, "a", "gone", "right");
		expect(summarise(loadProgress(storage), "a", ["a-1"]).right).toBe(0);
	});
});

describe("highlight", () => {
	test("splits code into comments, strings, numbers and keywords without losing a character", () => {
		const code = 'const x = 42; // answer\nreturn "a // not a comment";';
		const tokens = highlight(code);
		expect(tokens.map((token) => token.text).join("")).toBe(code);
		expect(tokens.find((token) => token.kind === "comment")?.text).toBe("// answer");
		expect(tokens.find((token) => token.kind === "string")?.text).toBe('"a // not a comment"');
		expect(tokens.find((token) => token.kind === "number")?.text).toBe("42");
		expect(tokens.filter((token) => token.kind === "keyword").map((token) => token.text)).toEqual([
			"const",
			"return",
		]);
	});
});

describe("dictionaries", () => {
	function keys(value: object, prefix = ""): string[] {
		return Object.entries(value).flatMap(([name, item]) =>
			typeof item === "string" ? [`${prefix}${name}`] : keys(item as object, `${prefix}${name}.`),
		);
	}

	test("Portuguese, Spanish and English have the same keys, and no text is empty", () => {
		expect(keys(pt).sort()).toEqual(keys(en).sort());
		expect(keys(es).sort()).toEqual(keys(en).sort());
		for (const dictionary of [pt, es, en]) {
			expect(Object.values(dictionary).every((value) => value !== "")).toBe(true);
		}
	});

	test("placeholders are replaced", () => {
		expect(format(en.result.score, { right: 2, total: 3 })).toBe("You got 2 of 3 right.");
	});

	test("a dictionary with a missing key does not compile", () => {
		// EN: The build runs the type checker, so "does not compile" means "the build fails".
		//     The file is created next to the real dictionaries to resolve the same imports.
		// PT: O build roda o verificador de tipos, então "não compila" significa "o build falha".
		//     O arquivo é criado ao lado dos dicionários reais para resolver os mesmos imports.
		// ES: El build ejecuta el verificador de tipos, así que "no compila" significa "el build falla".
		//     El archivo se crea junto a los diccionarios reales para resolver los mismos imports.
		const root = resolve(import.meta.dir, "..", "..");
		const dir = mkdtempSync(join(root, "src", "i18n", "tmp-"));
		try {
			const complete = `import type { Dictionary } from "../en";\nimport { pt } from "../pt";\nexport const copy: Dictionary = { ...pt };\n`;
			const missing = `import type { Dictionary } from "../en";\nimport { pt } from "../pt";\nconst { home: _removed, ...rest } = pt;\nexport const copy: Dictionary = rest;\n`;
			const check = (source: string): number => {
				writeFileSync(join(dir, "copy.ts"), source);
				const args = [
					"--ignoreConfig",
					"--noEmit",
					"--strict",
					"--skipLibCheck",
					"--moduleResolution",
					"bundler",
					"--module",
					"esnext",
				];
				return Bun.spawnSync(["bun", "x", "tsc", ...args, join(dir, "copy.ts")], { cwd: root }).exitCode;
			};
			expect(check(complete)).toBe(0);
			expect(check(missing)).not.toBe(0);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 60000);
});

// EN: The summaries are written by hand, so the inline marks must be predictable: four marks are
//     understood, and everything else, including HTML, stays as plain text.
// PT: Os resumos são escritos à mão, então as marcas no texto precisam ser previsíveis: quatro
//     marcas são entendidas, e todo o resto, inclusive HTML, continua como texto simples.
// ES: Los resúmenes se escriben a mano, así que las marcas en el texto deben ser predecibles:
//     cuatro marcas se entienden, y todo lo demás, incluso HTML, queda como texto simple.
describe("inline marks of the theory summary", () => {
	test("reads bold, code, link and tooltip, keeping the text around them", () => {
		expect(parseInline("A **big** `O(n)` [[term|its meaning]] and a [source](https://example.test/a).")).toEqual([
			{ kind: "text", text: "A " },
			{ kind: "bold", text: "big" },
			{ kind: "text", text: " " },
			{ kind: "code", text: "O(n)" },
			{ kind: "text", text: " " },
			{ kind: "tooltip", text: "term", meaning: "its meaning" },
			{ kind: "text", text: " and a " },
			{ kind: "link", text: "source", url: "https://example.test/a" },
			{ kind: "text", text: "." },
		]);
	});

	test("leaves HTML, unclosed marks and non-https links as plain text", () => {
		for (const source of ["<b>x</b>", "2 ** 3 and `open", "[a](javascript:alert(1))", "[a](http://example.test)"]) {
			expect(parseInline(source)).toEqual([{ kind: "text", text: source }]);
		}
	});
});
