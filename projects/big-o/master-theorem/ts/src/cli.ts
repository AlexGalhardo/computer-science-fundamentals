// EN: `bun run classify <a> <b> <d> [k]` classifies T(n) = a * T(n / b) + n^d * (log n)^k,
//     prints the case, the solution and the recursion tree for a small n.
//     Example: `bun run classify 7 2 2` is Strassen's matrix multiplication.
// PT: `bun run classify <a> <b> <d> [k]` classifica T(n) = a * T(n / b) + n^d * (log n)^k,
//     imprime o caso, a solução e a árvore de recursão para um n pequeno.
//     Exemplo: `bun run classify 7 2 2` é a multiplicação de matrizes de Strassen.

import { z } from "zod";
import { type Classification, classify, formatRecurrence } from "./classify";
import { recursionTree, renderTree } from "./tree";

const CASE_NAMES: Record<Classification["case"], string> = {
	"case-1": "case 1 (the leaves dominate)",
	"case-2": "case 2 (every level costs the same)",
	"case-3": "case 3 (the root dominates)",
	"not-applicable": "the basic master theorem does not apply",
};

// EN: Command-line arguments are text typed by a person. They are converted and validated at
//     the border, so the rest of the program only ever sees numbers that make sense.
// PT: Argumentos de linha de comando são texto digitado por uma pessoa. Eles são convertidos e
//     validados na borda, para que o resto do programa só veja números que fazem sentido.
const argumentsSchema = z.tuple([z.coerce.number(), z.coerce.number(), z.coerce.number()]).rest(z.coerce.number());

export function describe(classification: Classification, treeLevels = 4): string {
	const { recurrence } = classification;
	const lines = [
		formatRecurrence(recurrence),
		`log_${recurrence.b}(${recurrence.a}) = ${classification.criticalExponent.toFixed(3)}`,
		`result: ${CASE_NAMES[classification.case]}`,
		`EN: ${classification.reason.en}`,
		`PT: ${classification.reason.pt}`,
	];
	if (classification.solution !== null) {
		lines.push(`solution: T(n) = ${classification.solution}`);
	} else if (classification.extendedSolution !== null) {
		lines.push(`solution by the extended case 2: T(n) = ${classification.extendedSolution}`);
	} else {
		lines.push("solution: not given by the master theorem; use a recursion tree or substitution");
	}
	const n = Math.round(recurrence.b ** treeLevels);
	lines.push("", `recursion tree for n = ${n}:`, renderTree(recursionTree(recurrence, n)));
	return lines.join("\n");
}

export function run(args: string[]): { code: number; output: string } {
	const parsed = argumentsSchema.safeParse(args);
	if (!parsed.success || parsed.data.length > 4) {
		return { code: 2, output: "usage: bun run classify <a> <b> <d> [k]   for T(n) = a*T(n/b) + n^d * (log n)^k" };
	}
	const [a, b, d, k = 0] = parsed.data;
	try {
		return { code: 0, output: describe(classify({ a, b, d, k })) };
	} catch (error) {
		// EN: A recurrence outside the hypotheses (a < 1, b <= 1) is reported, not computed.
		// PT: Uma recorrência fora das hipóteses (a < 1, b <= 1) é informada, não calculada.
		if (error instanceof z.ZodError) {
			const issues = error.issues.map((issue) => `- ${issue.message}`).join("\n");
			return { code: 1, output: `the master theorem does not apply to this recurrence:\n${issues}` };
		}
		throw error;
	}
}

if (import.meta.main) {
	const result = run(process.argv.slice(2));
	(result.code === 0 ? console.log : console.error)(result.output);
	process.exit(result.code);
}
