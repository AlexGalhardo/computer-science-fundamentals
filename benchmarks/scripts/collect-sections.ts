// EN: `bun run sections <workload>` fills a gap of the shared runner. The runner times the
//     whole process several times, but reads the measured section (the time the program
//     reports itself, without start-up) only once. Speed-up needs that section time, and one
//     sample is too noisy on a shared machine. This script runs every case of the grid
//     several times in one container and stores all the section times in
//     `results/sections.json`.
// PT: `bun run sections <carga>` cobre uma lacuna do runner compartilhado. O runner cronometra
//     o processo inteiro várias vezes, mas lê o trecho medido (o tempo que o próprio programa
//     informa, sem a inicialização) uma vez só. O speed-up precisa desse tempo, e uma amostra é
//     ruidosa demais em uma máquina compartilhada. Este script roda cada caso da grade várias
//     vezes em um contêiner e guarda todos os tempos de trecho em `results/sections.json`.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { benchmarksDir, buildImage, type ContractLine, fill, mustRun, readConfig, spread } from "./lib";

const workload = process.argv[2];
if (workload === undefined) {
	console.error("usage: bun run sections <workload>");
	process.exit(2);
}

const config = readConfig(workload);
const runs = config.runs;
const rows = [];

for (const target of config.targets) {
	const image = buildImage(workload, target, config.project);
	for (const implementation of target.implementations) {
		for (const variant of config.variants ?? ["default"]) {
			for (const n of config.sizes) {
				const cap = config.maxN?.[implementation];
				if (cap !== undefined && n > cap) {
					continue;
				}
				const command = fill(target.command, implementation, n, variant);
				// EN: One warm-up run is thrown away, like in the runner, then `runs` are kept.
				// PT: Uma execução de aquecimento é descartada, como no runner, e `runs` são mantidas.
				const script = `${command} >/dev/null; i=0; while [ $i -lt ${runs} ]; do ${command}; i=$((i+1)); done`;
				const output = mustRun([
					"docker",
					"run",
					"--rm",
					"--network",
					"none",
					"--entrypoint",
					"sh",
					image,
					"-c",
					script,
				]);
				const lines = output
					.split(/\r?\n/)
					.filter((line) => line.trim().startsWith("{"))
					.map((line) => JSON.parse(line) as ContractLine);
				const checksums = new Set(lines.map((line) => line.checksum));
				if (lines.length !== runs || checksums.size !== 1) {
					throw new Error(`${target.language} ${command}: expected ${runs} equal results, got ${output}`);
				}
				const section = spread(lines.map((line) => line.elapsedMs));
				console.log(
					`  ${target.language} ${implementation} ${variant} n=${n}: ${section.mean.toFixed(1)} ± ${section.stddev.toFixed(1)} ms`,
				);
				rows.push({
					language: target.language,
					implementation,
					variant,
					n,
					sectionMeanMs: section.mean,
					sectionStddevMs: section.stddev,
					sectionMinMs: section.min,
					sectionMaxMs: section.max,
					samplesMs: lines.map((line) => line.elapsedMs),
					checksum: lines[0]?.checksum,
					command,
				});
			}
		}
	}
}

const outDir = join(benchmarksDir, workload, "results");
mkdirSync(outDir, { recursive: true });
const report = { project: config.project, generatedAt: new Date().toISOString(), runs, warmup: 1, rows };
writeFileSync(join(outDir, "sections.json"), `${JSON.stringify(report, null, "\t")}\n`);
console.log(`${rows.length} rows written to ${join(outDir, "sections.json")}`);
