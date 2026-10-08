import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateMutants, tokenize } from "../../src/mutator";

// EN: Tests of the mutator itself. A mutator with a bug gives a wrong score in silence: a
//     mutant that does not compile is "killed" by every suite, and a mutation inside a comment
//     "survives" every suite. So the rules of what may be changed are pinned down here.
// PT: Testes do próprio mutador. Um mutador com bug dá uma pontuação errada em silêncio: um
//     mutante que não compila é "morto" por qualquer suíte, e uma mutação dentro de um
//     comentário "sobrevive" a qualquer suíte. Por isso as regras do que pode ser alterado
//     ficam fixadas aqui.

test("the tokens put back together are the original source", () => {
	const source = 'const a = b >= 10 ? "x > y" : c; // d < e\n';
	expect(
		tokenize(source)
			.map((token) => token.text)
			.join(""),
	).toBe(source);
});

test("each mutant changes exactly one operator or constant", () => {
	const mutants = generateMutants("return a + 2 < b;");
	expect(mutants.map((mutant) => mutant.source)).toEqual([
		"return a - 2 < b;",
		"return a + 3 < b;",
		"return a + 2 <= b;",
	]);
	expect(mutants.map((mutant) => mutant.kind)).toEqual(["operator", "constant", "operator"]);
});

test("comments, strings and identifiers are never mutated", () => {
	const source = ["// 1 + 1 < 2", "/* a > b */", 'const total1 = "5 - 3";', "const text = `a < b`;"].join("\n");
	expect(generateMutants(source)).toEqual([]);
});

test("compound operators and arrows are left alone", () => {
	expect(generateMutants("i++; j += k; f = (x) => x; a == b; a != b;")).toEqual([]);
});

test("logical operators, negation and booleans are mutated", () => {
	const mutants = generateMutants("return !a && b || true;");
	expect(mutants.map((mutant) => mutant.source)).toEqual([
		"return a && b || true;",
		"return !a || b || true;",
		"return !a && b && true;",
		"return !a && b || false;",
	]);
});

test("a mutant records the line it changed", () => {
	const mutants = generateMutants("const a = b;\nconst c = a * d;\n");
	expect(mutants.map((mutant) => [mutant.line, mutant.original, mutant.replacement])).toEqual([[2, "*", "/"]]);
});

test("shipping.ts yields 19 mutants: 11 operators and 8 constants", () => {
	const source = readFileSync(join(import.meta.dir, "..", "..", "src", "shipping.ts"), "utf8");
	const mutants = generateMutants(source);
	expect(mutants.filter((mutant) => mutant.kind === "operator")).toHaveLength(11);
	expect(mutants.filter((mutant) => mutant.kind === "constant")).toHaveLength(8);
});
