// EN: Checks that a git history follows the rhythm of test-driven development. It reads lines of
//     the form "<sha> <subject>" (what `git log --reverse --format="%h %s"` prints) and looks
//     only at the prefix of each subject:
//       test(tdd-kata): red - ...      a new test that fails
//       feat(tdd-kata): green - ...    the smallest change that makes it pass
//       refactor(tdd-kata): ...        a clean-up with every test still passing
//     Any other subject (the scaffold, the documentation) is not a step and is ignored.
// PT: Confere se um histórico do git segue o ritmo do desenvolvimento guiado por testes. Ele lê
//     linhas no formato "<sha> <assunto>" (o que `git log --reverse --format="%h %s"` imprime)
//     e olha só o prefixo de cada assunto:
//       test(tdd-kata): red - ...      um teste novo que falha
//       feat(tdd-kata): green - ...    a menor mudança que o faz passar
//       refactor(tdd-kata): ...        uma limpeza com todos os testes ainda passando
//     Qualquer outro assunto (o esqueleto, a documentação) não é um passo e é ignorado.
// ES: Comprueba si un historial de git sigue el ritmo del desarrollo guiado por pruebas. Lee
//     líneas con el formato "<sha> <asunto>" (lo que imprime `git log --reverse --format="%h %s"`)
//     y mira solo el prefijo de cada asunto:
//       test(tdd-kata): red - ...      una prueba nueva que falla
//       feat(tdd-kata): green - ...    el cambio más pequeño que la hace pasar
//       refactor(tdd-kata): ...        una limpieza con todas las pruebas aún pasando
//     Cualquier otro asunto (el esqueleto, la documentación) no es un paso y se ignora.

export type StepKind = "red" | "green" | "refactor";

export interface Step {
	sha: string;
	kind: StepKind;
	title: string;
}

const PREFIXES: readonly [StepKind, RegExp][] = [
	["red", /^test\(tdd-kata\): red - (.+)$/],
	["green", /^feat\(tdd-kata\): green - (.+)$/],
	["refactor", /^refactor\(tdd-kata\): (.+)$/],
];

export const MINIMUM_CYCLES = 3;

export function parseLog(log: string): Step[] {
	const steps: Step[] = [];
	for (const line of log.split("\n")) {
		const match = line.trim().match(/^([0-9a-f]{7,40}) (.+)$/);
		if (match === null) {
			continue;
		}
		const [, sha, subject] = match;
		for (const [kind, pattern] of PREFIXES) {
			const title = subject?.match(pattern)?.[1];
			if (sha !== undefined && title !== undefined) {
				steps.push({ sha, kind, title });
			}
		}
	}
	return steps;
}

// EN: The rules of the rhythm, as a small state machine over the previous step:
//       red       only when the bar is green (at the start, or after green or refactor)
//       green     only right after a red: no production code without a failing test
//       refactor  only when the bar is green: never clean up with a failing test
//     and the history may not stop on a red.
// PT: As regras do ritmo, como uma pequena máquina de estados sobre o passo anterior:
//       red       só com a barra verde (no começo, ou depois de green ou refactor)
//       green     só logo depois de um red: nenhum código de produção sem um teste falhando
//       refactor  só com a barra verde: nunca limpar com um teste falhando
//     e o histórico não pode parar em um red.
// ES: Las reglas del ritmo, como una pequeña máquina de estados sobre el paso anterior:
//       red       solo con la barra verde (al principio, o después de green o refactor)
//       green     solo justo después de un red: ningún código de producción sin una prueba fallando
//       refactor  solo con la barra verde: nunca limpiar con una prueba fallando
//     y el historial no puede terminar en un red.
export function checkSteps(steps: readonly Step[]): string[] {
	const problems: string[] = [];
	let previous: StepKind | undefined;
	for (const step of steps) {
		const label = `${step.sha} (${step.kind}: ${step.title})`;
		if (step.kind === "red" && previous === "red") {
			problems.push(`${label}: a second failing test was added before the first one passed`);
		}
		if (step.kind === "green" && previous !== "red") {
			problems.push(`${label}: production code was written without a failing test before it`);
		}
		if (step.kind === "refactor" && (previous === undefined || previous === "red")) {
			problems.push(`${label}: a refactoring was made while a test was failing`);
		}
		previous = step.kind;
	}
	if (previous === "red") {
		problems.push("the history ends on a failing test");
	}
	const cycles = steps.filter((step) => step.kind === "green").length;
	if (cycles < MINIMUM_CYCLES) {
		problems.push(`only ${cycles} red/green cycles, expected at least ${MINIMUM_CYCLES}`);
	}
	if (!steps.some((step) => step.kind === "refactor")) {
		problems.push("no refactoring step at all");
	}
	return problems;
}

export function renderSteps(steps: readonly Step[]): string {
	return steps
		.map((step, index) => `${String(index + 1).padStart(2, "0")} ${step.sha} ${step.kind.padEnd(8)} ${step.title}`)
		.join("\n");
}

if (import.meta.main) {
	const steps = parseLog(await Bun.stdin.text());
	console.log(renderSteps(steps));
	const problems = checkSteps(steps);
	for (const problem of problems) {
		console.error(`history: ${problem}`);
	}
	const counts = (kind: StepKind): number => steps.filter((step) => step.kind === kind).length;
	console.log(
		`\n${steps.length} steps: ${counts("red")} red, ${counts("green")} green, ${counts("refactor")} refactor`,
	);
	console.log(problems.length === 0 ? "history: the red/green/refactor rhythm holds" : "history: FAILED");
	process.exit(problems.length === 0 ? 0 : 1);
}
