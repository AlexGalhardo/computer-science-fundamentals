// EN: `bun run ts/src/bench.ts <problem>-<version> <n>` solves one instance and prints one JSON
//     line in the benchmark contract, for example `knapsack-memo 20`. Building the instance is
//     part of the timed section, but it is linear in n and negligible next to the solvers.
// PT: `bun run ts/src/bench.ts <problema>-<versão> <n>` resolve uma instância e imprime uma linha
//     JSON no contrato de benchmark, por exemplo `knapsack-memo 20`. Montar a instância faz
//     parte do trecho cronometrado, mas é linear em n e desprezível perto dos resolvedores.

import { newCounter } from "./counter";
import { PROBLEMS, VERSIONS, type Version } from "./problems";

const MAX_N = 5000;
const [implementation = "", size = ""] = process.argv.slice(2);
const separator = implementation.lastIndexOf("-");
const problem = PROBLEMS[implementation.slice(0, separator)];
const version = implementation.slice(separator + 1);
const n = Number(size);

function isVersion(value: string): value is Version {
	return (VERSIONS as readonly string[]).includes(value);
}

if (problem === undefined || !isVersion(version) || !Number.isInteger(n) || n < 0 || n > MAX_N) {
	console.error(`usage: bench.ts <${Object.keys(PROBLEMS).join("|")}>-<${VERSIONS.join("|")}> <n up to ${MAX_N}>`);
	process.exit(2);
}

const start = performance.now();
const answer = problem[version](n, newCounter());
const elapsedMs = performance.now() - start;

console.log(
	JSON.stringify({
		n,
		elapsedMs,
		memoryKb: process.resourceUsage().maxRSS,
		language: "ts",
		implementation,
		// EN: The answer is the checksum: equal values prove that the versions and the languages agree.
		// PT: A resposta é o checksum: valores iguais provam que as versões e as linguagens concordam.
		checksum: String(answer),
	}),
);
