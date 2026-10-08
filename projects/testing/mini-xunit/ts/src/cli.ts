import { discover } from "./discovery";
import { TestResult } from "./xunit";

// EN: `bun run src/cli.ts <folder>`: discover, run, report. The exit code is the contract with
//     scripts and CI, which do not read text:
//       0  every test passed
//       1  at least one test failed
//       2  no test was found (a run with zero tests must not look like a success)
// PT: `bun run src/cli.ts <pasta>`: descobrir, rodar, relatar. O código de saída é o contrato
//     com scripts e CI, que não leem texto:
//       0  todos os testes passaram
//       1  pelo menos um teste falhou
//       2  nenhum teste foi encontrado (uma execução com zero testes não pode parecer sucesso)
export function formatReport(result: TestResult): string {
	const lines: string[] = [];
	for (const failure of result.failures) {
		lines.push(`FAIL ${failure.test}`, `     ${failure.message}`, `     at ${failure.location}`);
	}
	lines.push(result.summary());
	return lines.join("\n");
}

export function exitCodeFor(result: TestResult): number {
	if (result.runCount === 0) {
		return 2;
	}
	return result.wasSuccessful() ? 0 : 1;
}

if (import.meta.main) {
	const directory = process.argv[2];
	if (directory === undefined) {
		console.error("usage: bun run src/cli.ts <folder>");
		process.exit(2);
	}
	const suite = await discover(directory);
	const result = new TestResult();
	await suite.run(result);
	console.log(formatReport(result));
	process.exit(exitCodeFor(result));
}
