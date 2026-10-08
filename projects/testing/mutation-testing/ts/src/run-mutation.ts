import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateMutants, type Mutant } from "./mutator";

// EN: The mutation run. For each mutant: put the mutated file in a scratch copy of the project,
//     run one test suite there, and record the verdict.
//       killed    at least one test failed (or the run timed out): the suite noticed
//       survived  every test passed: the suite cannot tell the mutant from the original
//     mutation score = killed / total. Equivalent mutants are NOT removed from the total here,
//     because nobody can list them automatically. That is why 100% is not always reachable.
// PT: A execução de mutação. Para cada mutante: colocar o arquivo mutado em uma cópia de rascunho
//     do projeto, rodar uma suíte de testes ali e registrar o veredito.
//       killed    pelo menos um teste falhou (ou a execução estourou o tempo): a suíte percebeu
//       survived  todos os testes passaram: a suíte não distingue o mutante do original
//     pontuação de mutação = mortos / total. Os mutantes equivalentes NÃO são retirados do total
//     aqui, porque ninguém consegue listá-los automaticamente. Por isso 100% nem sempre é alcançável.
const ROOT = join(import.meta.dir, "..");
const TARGET = join("src", "shipping.ts");
const SUITES = ["weak", "strong"] as const;
const WEAK_MAXIMUM = 0.6;
const STRONG_MINIMUM = 0.9;
const TIMEOUT_MS = 10_000;

type Suite = (typeof SUITES)[number];
type Verdict = "killed" | "survived";

async function testsPass(directory: string): Promise<boolean> {
	// EN: A mutant can turn a loop into an endless one, so every run has a time limit.
	// PT: Um mutante pode transformar um laço em um laço sem fim, então toda execução tem um limite de tempo.
	const child = Bun.spawn(["bun", "test"], {
		cwd: directory,
		stdout: "ignore",
		stderr: "ignore",
		timeout: TIMEOUT_MS,
	});
	return (await child.exited) === 0;
}

async function verdictsFor(suite: Suite, original: string, mutants: readonly Mutant[]): Promise<Verdict[]> {
	const directory = mkdtempSync(join(tmpdir(), `mutation-${suite}-`));
	try {
		mkdirSync(join(directory, "src"));
		cpSync(join(ROOT, "tests", suite), join(directory, "tests", suite), { recursive: true });
		const target = join(directory, TARGET);

		// EN: A suite that fails on the original program would "kill" every mutant for the wrong
		//     reason, so the baseline must be green before any mutant is tried.
		// PT: Uma suíte que falha no programa original "mataria" todo mutante pelo motivo errado,
		//     então a linha de base precisa estar verde antes de qualquer mutante ser testado.
		writeFileSync(target, original);
		if (!(await testsPass(directory))) {
			throw new Error(`the ${suite} suite fails on the original code`);
		}

		const verdicts: Verdict[] = [];
		for (const mutant of mutants) {
			writeFileSync(target, mutant.source);
			verdicts.push((await testsPass(directory)) ? "survived" : "killed");
		}
		return verdicts;
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

function score(verdicts: readonly Verdict[]): number {
	return verdicts.filter((verdict) => verdict === "killed").length / verdicts.length;
}

function percent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

// EN: A `|` would end the cell of a Markdown table, so it is escaped.
// PT: Um `|` encerraria a célula de uma tabela Markdown, então ele é escapado.
function show(text: string): string {
	return text === "" ? "(removed)" : `\`${text.replaceAll("|", "\\|")}\``;
}

const original = readFileSync(join(ROOT, TARGET), "utf8");
const mutants = generateMutants(original);
const weak = await verdictsFor("weak", original, mutants);
const strong = await verdictsFor("strong", original, mutants);

const rows = mutants.map(
	(mutant, index) =>
		`| ${mutant.id} | ${mutant.line} | ${mutant.kind} | ${show(mutant.original)} | ${show(mutant.replacement)} | ${weak[index]} | ${strong[index]} |`,
);
const killed = (verdicts: readonly Verdict[]): number => verdicts.filter((verdict) => verdict === "killed").length;
const report = [
	"# mutation-testing: mutation report",
	"",
	"Written by `docker compose run --rm mutation`. Module under test: `ts/src/shipping.ts`.",
	"",
	"| Suite | Line coverage | Mutants | Killed | Survived | Mutation score |",
	"| --- | --- | --- | --- | --- | --- |",
	`| weak (\`tests/weak\`) | 100% | ${mutants.length} | ${killed(weak)} | ${mutants.length - killed(weak)} | ${percent(score(weak))} |`,
	`| strong (\`tests/strong\`) | 100% | ${mutants.length} | ${killed(strong)} | ${mutants.length - killed(strong)} | ${percent(score(strong))} |`,
	"",
	"## Every mutant",
	"",
	"| # | Line | Kind | Original | Mutant | Weak suite | Strong suite |",
	"| --- | --- | --- | --- | --- | --- | --- |",
	...rows,
	"",
].join("\n");
console.log(report);

const resultsDir = process.env.RESULTS_DIR ?? join(ROOT, "results");
mkdirSync(resultsDir, { recursive: true });
// EN: Remove before writing: the old file may belong to another user, and replacing a file
//     needs write access to the folder, not to the file.
// PT: Remover antes de escrever: o arquivo antigo pode ser de outro usuário, e substituir um
//     arquivo exige escrita na pasta, não no arquivo.
const reportFile = join(resultsDir, "mutation-report.md");
rmSync(reportFile, { force: true });
writeFileSync(reportFile, report);

// EN: The lesson, enforced: both suites cover every line, yet one lets most mutants live.
// PT: A lição, imposta: as duas suítes cobrem todas as linhas, mas uma deixa a maioria dos mutantes viver.
const problems: string[] = [];
if (score(weak) >= WEAK_MAXIMUM) {
	problems.push(`the weak suite scores ${percent(score(weak))}, expected under ${percent(WEAK_MAXIMUM)}`);
}
if (score(strong) <= STRONG_MINIMUM) {
	problems.push(`the strong suite scores ${percent(score(strong))}, expected over ${percent(STRONG_MINIMUM)}`);
}
for (const problem of problems) {
	console.error(`unexpected: ${problem}`);
}
process.exit(problems.length === 0 ? 0 : 1);
