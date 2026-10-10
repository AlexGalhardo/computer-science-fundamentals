// EN: Step 3 of the profile pipeline: read the folded stacks of the four profiles, draw one
//     flame graph each, and check that the pictures say what the lesson claims. The command
//     fails when they do not, so it is also the end-to-end test of the project.
// PT: Etapa 3 do pipeline de perfil: ler as pilhas dobradas dos quatro perfis, desenhar um
//     flame graph para cada, e conferir que as figuras dizem o que a lição afirma. O comando
//     falha quando não dizem, então ele também é o teste de ponta a ponta do projeto.
// ES: Paso 3 del pipeline de perfil: leer las pilas plegadas de los cuatro perfiles, dibujar un
//     flame graph para cada uno, y comprobar que las figuras dicen lo que afirma la lección. El
//     comando falla cuando no lo dicen, así que también es la prueba de extremo a extremo del proyecto.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFolded } from "./folded";
import { readLabEnv, subjects, VARIANTS, type Variant } from "./lab";
import { writeFresh } from "./output";
import { renderFlameGraph } from "./svg";
import { problems, type Verdict, verdict } from "./verdict";

const env = readLabEnv();
const failures: string[] = [];
const rows: string[] = [];
const summary: Record<string, Record<Variant, Verdict>> = {};

for (const subject of subjects(env)) {
	const verdicts = {} as Record<Variant, Verdict>;
	for (const variant of VARIANTS) {
		const stacks = parseFolded(readFileSync(join(env.outDir, `${subject.language}-${variant}.folded`), "utf8"));
		const svg = renderFlameGraph(stacks, {
			title: `${subject.label}, ${variant} the fix: CPU profile of GET /${variant}/${subject.endpoint} under load`,
			highlight: subject.hotFrame,
		});
		const file = join(env.outDir, `flame-${subject.language}-${variant}.svg`);
		await writeFresh(file, svg);
		const result = verdict(stacks, subject.handler[variant], subject.hotFrame);
		verdicts[variant] = result;
		rows.push(
			`| ${subject.label} | ${variant} | ${result.totalSamples} | ${result.handlerSamples} | ${result.hotSamples} | ${(100 * result.hotShare).toFixed(1)}% |`,
		);
		console.log(
			`${subject.language} ${variant}: \`${subject.hotFrame}\` holds ${(100 * result.hotShare).toFixed(1)}% of the handler (${result.hotSamples} of ${result.handlerSamples} samples) -> ${file}`,
		);
	}
	summary[subject.language] = verdicts;
	failures.push(...problems(verdicts.before, verdicts.after).map((problem) => `${subject.language} ${problem}`));
}

const table = [
	"# Profiles",
	"",
	"Written by `docker compose run --rm flame`. Samples are stack samples taken by the CPU profiler of each runtime while the load generator was running.",
	"",
	"| Service | Variant | Samples | Inside the handler | Inside the hot function | Share of the handler |",
	"| --- | --- | --- | --- | --- | --- |",
	...rows,
	"",
	"Hot function: `flame-graph/report.compileRegex` in Go, `buildPriceIndex` in TypeScript. The share counts the function and everything it calls.",
	"",
].join("\n");
await writeFresh(join(env.outDir, "profile.md"), table);
await writeFresh(join(env.outDir, "profile.json"), `${JSON.stringify(summary, null, "\t")}\n`);

if (failures.length > 0) {
	for (const failure of failures) {
		console.error(`FAIL: ${failure}`);
	}
	process.exit(1);
}
console.log("flame-graph: every 'before' profile points at the hot function and every 'after' profile is clear of it");
