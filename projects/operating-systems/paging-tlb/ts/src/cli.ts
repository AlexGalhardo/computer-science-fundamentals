// EN: `bun run src/cli.ts [faults|tlb|all] [--out <dir>]`
//     `faults` prints the page-fault tables (the same text as the Rust program). `tlb` prints the
//     TLB experiment. `--out` also writes results.md and results.json.
// PT: `bun run src/cli.ts [faults|tlb|all] [--out <dir>]`
//     `faults` imprime as tabelas de faltas de página (o mesmo texto do programa em Rust). `tlb`
//     imprime o experimento da TLB. `--out` também grava results.md e results.json.
// ES: `bun run src/cli.ts [faults|tlb|all] [--out <dir>]`
//     `faults` imprime las tablas de fallos de página (el mismo texto del programa en Rust). `tlb`
//     imprime el experimento de la TLB. `--out` también escribe results.md y results.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildReport, faultsText, markdown, tlbText } from "./report";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? args[outIndex + 1] : undefined;
const mode = args.find((arg, index) => !arg.startsWith("--") && (outIndex < 0 || index !== outIndex + 1)) ?? "all";

if (!["faults", "tlb", "all"].includes(mode) || (outIndex >= 0 && outDir === undefined)) {
	console.error("usage: bun run src/cli.ts [faults|tlb|all] [--out <dir>]");
	process.exit(2);
}

const report = buildReport();
if (mode !== "tlb") {
	process.stdout.write(faultsText(report));
}
if (mode === "all") {
	process.stdout.write("\n");
}
if (mode !== "faults") {
	process.stdout.write(tlbText(report));
}
if (outDir !== undefined) {
	mkdirSync(outDir, { recursive: true });
	writeFileSync(join(outDir, "results.md"), markdown(report));
	writeFileSync(join(outDir, "results.json"), `${JSON.stringify(report, null, "\t")}\n`);
	console.log(`results written to ${outDir}`);
}
