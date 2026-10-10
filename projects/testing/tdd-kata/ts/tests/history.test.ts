import { describe, expect, test } from "bun:test";
import { checkSteps, parseLog } from "../scripts/history";

// EN: The checker is itself tested with small hand-written histories: one that follows the
//     rhythm and one for each way of breaking it. A checker that accepts everything would
//     make the acceptance criterion of this mini-project meaningless.
// PT: O próprio verificador é testado com pequenos históricos escritos à mão: um que segue o
//     ritmo e um para cada jeito de quebrá-lo. Um verificador que aceita tudo tornaria sem
//     sentido o critério de aceite deste mini-projeto.
// ES: El propio verificador se prueba con pequeños historiales escritos a mano: uno que sigue el
//     ritmo y uno por cada forma de romperlo. Un verificador que acepta todo volvería absurdo
//     el criterio de aceptación de este mini-proyecto.
const GOOD = `
aaaaaa1 chore(tdd-kata): scaffold
aaaaaa2 test(tdd-kata): red - first
aaaaaa3 feat(tdd-kata): green - first
aaaaaa4 test(tdd-kata): red - second
aaaaaa5 feat(tdd-kata): green - second
aaaaaa6 refactor(tdd-kata): tidy
aaaaaa7 refactor(tdd-kata): tidy more
aaaaaa8 test(tdd-kata): red - third
aaaaaa9 feat(tdd-kata): green - third
aaaaaa0 feat(testing): add tdd-kata mini-project
`;

function problemsOf(log: string): string[] {
	return checkSteps(parseLog(log));
}

describe("parseLog", () => {
	test("keeps only the step commits, in order", () => {
		const steps = parseLog(GOOD);
		expect(steps.map((step) => step.kind)).toEqual([
			"red",
			"green",
			"red",
			"green",
			"refactor",
			"refactor",
			"red",
			"green",
		]);
		expect(steps[0]).toEqual({ sha: "aaaaaa2", kind: "red", title: "first" });
	});
});

describe("checkSteps", () => {
	test("accepts a history that follows the rhythm", () => {
		expect(problemsOf(GOOD)).toEqual([]);
	});

	test("rejects production code with no failing test before it", () => {
		const log = GOOD.replace("aaaaaa4 test(tdd-kata): red - second\n", "");
		expect(problemsOf(log).join("\n")).toContain("without a failing test");
	});

	test("rejects two failing tests in a row", () => {
		const log = GOOD.replace("aaaaaa3 feat(tdd-kata): green - first\n", "");
		expect(problemsOf(log).join("\n")).toContain("second failing test");
	});

	test("rejects a refactoring on a red bar", () => {
		const log = GOOD.replace("aaaaaa5 feat(tdd-kata): green - second\n", "");
		expect(problemsOf(log).join("\n")).toContain("while a test was failing");
	});

	test("rejects a history that ends on red", () => {
		const log = GOOD.replace("aaaaaa9 feat(tdd-kata): green - third\n", "");
		expect(problemsOf(log).join("\n")).toContain("ends on a failing test");
	});

	test("rejects a history with too few cycles or no refactoring", () => {
		const log = "aaaaaa2 test(tdd-kata): red - only\naaaaaa3 feat(tdd-kata): green - only\n";
		const problems = problemsOf(log).join("\n");
		expect(problems).toContain("only 1 red/green cycles");
		expect(problems).toContain("no refactoring");
	});
});
