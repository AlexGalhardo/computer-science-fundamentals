// EN: `bun run images [workload...]` builds the image of every language for the given
//     workloads (all of them by default). The runner would build them anyway, but doing it
//     first shows a compile error right away and lets the tests run without a full benchmark.
// PT: `bun run images [carga...]` constrói a imagem de cada linguagem para as cargas dadas
//     (todas por padrão). O runner as construiria de qualquer forma, mas fazer isso antes
//     mostra um erro de compilação na hora e deixa os testes rodarem sem um benchmark inteiro.

import { buildImage, RUNNER_WORKLOADS, readConfig } from "./lib";

const requested = process.argv.slice(2);
const workloads = requested.length > 0 ? requested : [...RUNNER_WORKLOADS];

let failed = false;
for (const workload of workloads) {
	const config = readConfig(workload);
	for (const target of config.targets) {
		try {
			const tag = buildImage(workload, target, config.project);
			console.log(`built ${tag}`);
		} catch (error) {
			failed = true;
			console.error(`FAILED ${workload}/${target.language}\n${error instanceof Error ? error.message : error}`);
		}
	}
}
process.exit(failed ? 1 : 0);
