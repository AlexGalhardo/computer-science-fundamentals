import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

// EN: One run of a flaky test proves nothing: it passes most of the time. The only way to see
//     intermittence is to repeat. This script runs each test file many times, each time in a new
//     process (so nothing is carried from one run to the next), and counts the failures.
//       flaky mode: 50 runs of each flaky test, and each must fail at least once
//       fixed mode: 500 runs of each fixed test, and none may fail even once
//     Every run uses `--randomize`, so the order of the tests inside a file changes too.
// PT: Uma execução de um teste intermitente não prova nada: ele passa na maioria das vezes. O
//     único jeito de ver a intermitência é repetir. Este script roda cada arquivo de teste muitas
//     vezes, cada vez em um processo novo (então nada é carregado de uma execução para a
//     seguinte), e conta as falhas.
//       modo flaky: 50 execuções de cada teste intermitente, e cada um precisa falhar ao menos uma vez
//       modo fixed: 500 execuções de cada teste corrigido, e nenhum pode falhar nem uma vez
//     Toda execução usa `--randomize`, então a ordem dos testes dentro de um arquivo também muda.
const MODES = ["flaky", "fixed"] as const;
const modeSchema = z.enum(MODES);
type Mode = z.infer<typeof modeSchema>;

const CAUSES = ["time", "order", "shared-state", "network"] as const;
const ROOT = join(import.meta.dir, "..");

interface Plan {
	runs: number;
	accept: (failures: number) => boolean;
}

export function repeatPlan(mode: Mode): Plan {
	return mode === "flaky"
		? { runs: 50, accept: (failures) => failures >= 1 }
		: { runs: 500, accept: (failures) => failures === 0 };
}

async function failuresOf(file: string, runs: number): Promise<number> {
	let failures = 0;
	for (let run = 0; run < runs; run++) {
		const child = Bun.spawn(["bun", "test", "--randomize", file], {
			cwd: ROOT,
			stdout: "ignore",
			stderr: "ignore",
		});
		if ((await child.exited) !== 0) {
			failures++;
		}
	}
	return failures;
}

if (import.meta.main) {
	const mode = modeSchema.parse(process.argv[2]);
	const plan = repeatPlan(mode);
	const started = performance.now();
	// EN: The four causes are repeated side by side to keep the demo short. The runs of one
	//     cause are still consecutive, one after the other.
	// PT: As quatro causas são repetidas lado a lado para a demo ficar curta. As execuções de uma
	//     mesma causa continuam consecutivas, uma depois da outra.
	const failures = await Promise.all(CAUSES.map((cause) => failuresOf(`tests/${mode}/${cause}.test.ts`, plan.runs)));
	const seconds = ((performance.now() - started) / 1000).toFixed(1);

	const rows = CAUSES.map((cause, index) => {
		const failed = failures[index] ?? 0;
		const rate = `${((failed / plan.runs) * 100).toFixed(1)}%`;
		return `| ${cause} | \`tests/${mode}/${cause}.test.ts\` | ${plan.runs} | ${failed} | ${rate} | ${plan.accept(failed) ? "as expected" : "UNEXPECTED"} |`;
	});
	const expectation =
		mode === "flaky" ? "each flaky test must fail at least once" : "no fixed test may fail, not even once";
	const report = [
		`# flaky-tests: ${plan.runs} runs of each ${mode} test`,
		"",
		`Written by \`docker compose run --rm ${mode}\` in ${seconds} s. Expectation: ${expectation}.`,
		"",
		"| Cause | Test file | Runs | Failures | Failure rate | Verdict |",
		"| --- | --- | --- | --- | --- | --- |",
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
	const reportFile = join(resultsDir, `${mode}-runs.md`);
	rmSync(reportFile, { force: true });
	writeFileSync(reportFile, report);

	process.exit(failures.every((failed) => plan.accept(failed)) ? 0 : 1);
}
