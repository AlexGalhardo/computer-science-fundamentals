// EN: `bun run bench -- --project <name or path>`
//     Finds the mini-project, runs its benchmark grid in Docker and writes
//     `results/results.md`, `results/results.json` and `results/results.js`.
// PT: `bun run bench -- --project <nome ou caminho>`
//     Acha o mini-projeto, roda a grade de benchmark no Docker e escreve
//     `results/results.md`, `results/results.json` e `results/results.js`.
// ES: `bun run bench -- --project <nombre o ruta>`
//     Encuentra el mini-proyecto, ejecuta la grilla de benchmark en Docker y escribe
//     `results/results.md`, `results/results.json` y `results/results.js`.

import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { runBenchmark } from "./runner";

const repoRoot = resolve(import.meta.dir, "..", "..", "..");

function findProject(name: string): string | undefined {
	if (existsSync(join(resolve(name), "bench.json"))) {
		return resolve(name);
	}
	const candidates = [join(repoRoot, "tools", "bench", name)];
	const projects = join(repoRoot, "projects");
	if (existsSync(projects)) {
		for (const area of readdirSync(projects)) {
			candidates.push(join(projects, area, name));
		}
	}
	return candidates.find((dir) => existsSync(join(dir, "bench.json")));
}

const args = process.argv.slice(2);
const name = args[args.indexOf("--project") + 1];
if (!args.includes("--project") || name === undefined) {
	console.error("usage: bun run bench -- --project <name or path>");
	process.exit(2);
}
const projectDir = findProject(name);
if (projectDir === undefined) {
	console.error(`no bench.json found for project "${name}"`);
	process.exit(1);
}

const report = runBenchmark({ projectDir, repoRoot, log: (message) => console.log(`  ${message}`) });
console.log(`${report.rows.length} rows written to ${join(projectDir, "results")}`);
