// EN: `bun run src/cli.ts [gantt|compare|all] [--out <dir>]`
//     `gantt` prints the Gantt chart of the example under every policy. `compare` prints the
//     table of averages on the generated workloads. `--out` also writes results.md,
//     results.json and results.js (the last one feeds the static dashboard).
// PT: `bun run src/cli.ts [gantt|compare|all] [--out <dir>]`
//     `gantt` imprime o gráfico de Gantt do exemplo em cada política. `compare` imprime a tabela
//     de médias nas cargas geradas. `--out` também grava results.md, results.json e results.js
//     (o último alimenta o dashboard estático).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildReport, compareText, ganttText, markdown } from "./report";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? args[outIndex + 1] : undefined;
const mode = args.find((arg, index) => !arg.startsWith("--") && (outIndex < 0 || index !== outIndex + 1)) ?? "all";

if (!["gantt", "compare", "all"].includes(mode) || (outIndex >= 0 && outDir === undefined)) {
	console.error("usage: bun run src/cli.ts [gantt|compare|all] [--out <dir>]");
	process.exit(2);
}

const report = buildReport();
if (mode !== "compare") {
	console.log(ganttText(report));
}
if (mode !== "gantt") {
	console.log(compareText(report));
}
if (outDir !== undefined) {
	mkdirSync(outDir, { recursive: true });
	const json = JSON.stringify(report, null, "\t");
	writeFileSync(join(outDir, "results.md"), markdown(report));
	writeFileSync(join(outDir, "results.json"), `${json}\n`);
	// EN: A page opened from disk (file://) cannot fetch a JSON file, but it can load a script.
	// PT: Uma página aberta do disco (file://) não consegue buscar um JSON, mas consegue carregar um script.
	writeFileSync(join(outDir, "results.js"), `window.SCHED_RESULTS = ${json};\n`);
	console.log(`results written to ${outDir}`);
}
