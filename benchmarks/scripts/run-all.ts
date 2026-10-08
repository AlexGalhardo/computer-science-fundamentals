// EN: `bun run all [step...]` runs the whole suite in order and regenerates every result. With
//     no argument it runs every step. A step that fails is tried again: the usual cause is a
//     registry timeout while Docker checks a base image, which a second attempt solves.
// PT: `bun run all [etapa...]` roda a suíte inteira em ordem e regenera todos os resultados.
//     Sem argumento, roda todas as etapas. Uma etapa que falha é tentada de novo: a causa usual
//     é um timeout do registry enquanto o Docker confere uma imagem base, o que uma segunda
//     tentativa resolve.

import { benchmarksDir } from "./lib";

const STEPS: Record<string, string[]> = {
	images: ["bun", "run", "images"],
	"cpu-single": ["bun", "run", "bench", "--", "--project", "cpu-single"],
	parallelism: ["bun", "run", "bench", "--", "--project", "parallelism"],
	sections: ["bun", "run", "sections", "parallelism"],
	concurrency: ["bun", "run", "bench", "--", "--project", "concurrency"],
	memory: ["bun", "run", "bench", "--", "--project", "memory"],
	http: ["bun", "run", "http"],
	"build-time": ["bun", "run", "build-time"],
	"binary-size": ["bun", "run", "binary-size"],
	database: ["bun", "run", "database"],
	data: ["bun", "run", "data"],
};
const ATTEMPTS = 3;

const requested = process.argv.slice(2);
const steps = requested.length > 0 ? requested : Object.keys(STEPS);

for (const step of steps) {
	const command = STEPS[step];
	if (command === undefined) {
		console.error(`unknown step "${step}". Steps: ${Object.keys(STEPS).join(", ")}`);
		process.exit(2);
	}
	let done = false;
	for (let attempt = 1; attempt <= ATTEMPTS && !done; attempt++) {
		console.log(`== ${step} (attempt ${attempt} of ${ATTEMPTS})`);
		const result = Bun.spawnSync(command, { cwd: benchmarksDir, stdout: "inherit", stderr: "inherit" });
		done = result.exitCode === 0;
	}
	if (!done) {
		console.error(`step "${step}" failed ${ATTEMPTS} times`);
		process.exit(1);
	}
}
console.log("all steps finished");
