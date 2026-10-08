// EN: The before/after benchmark. The profile said WHERE the time goes; the benchmark says how
//     much the fix is worth to a user, as requests per second. Same workload, same
//     concurrency and same duration for both variants, a warm-up that is thrown away, several
//     runs, and the spread reported next to the median.
// PT: O benchmark de antes e depois. O perfil disse ONDE o tempo vai; o benchmark diz quanto a
//     correção vale para um usuário, em requisições por segundo. Mesma carga, mesma
//     concorrência e mesma duração para as duas variantes, um aquecimento que é descartado,
//     várias execuções, e a dispersão reportada ao lado da mediana.

import { mkdirSync } from "node:fs";
import { cpus, release, totalmem } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { endpointUrl, readLabEnv, subjects, VARIANTS, type Variant } from "./lab";
import { runLoad, waitHealthy } from "./load";
import { writeFresh } from "./output";
import { type Spread, spread } from "./stats";

const env = readLabEnv();
mkdirSync(env.outDir, { recursive: true });

const versionSchema = z.object({ runtime: z.string().min(1) });

interface Row {
	language: string;
	label: string;
	runtime: string;
	requestsPerSecond: Record<Variant, Spread & { runs: number[] }>;
	factor: number;
}

const rows: Row[] = [];
for (const subject of subjects(env)) {
	await waitHealthy(subject.baseUrl);
	const version = versionSchema.parse(await (await fetch(`${subject.baseUrl}/version`)).json());
	const measured = {} as Row["requestsPerSecond"];
	for (const variant of VARIANTS) {
		const url = endpointUrl(subject, variant);
		// EN: The warm-up lets the runtime compile hot code and the connections open. Its
		//     numbers are discarded.
		// PT: O aquecimento deixa o runtime compilar o código quente e as conexões abrirem. Os
		//     números dele são descartados.
		await runLoad(url, env.LOAD_CONCURRENCY, env.WARMUP_SECONDS * 1000);
		const runs: number[] = [];
		for (let run = 0; run < env.BENCH_RUNS; run++) {
			const result = await runLoad(url, env.LOAD_CONCURRENCY, env.BENCH_SECONDS * 1000);
			if (result.errors > 0 || result.requests === 0) {
				throw new Error(`${subject.language} ${variant}: ${result.errors} errors, ${result.requests} requests`);
			}
			runs.push(Math.round(result.requestsPerSecond));
			console.log(`${subject.language} ${variant} run ${run + 1}: ${Math.round(result.requestsPerSecond)} req/s`);
		}
		measured[variant] = { ...spread(runs), runs };
	}
	rows.push({
		language: subject.language,
		label: subject.label,
		runtime: version.runtime,
		requestsPerSecond: measured,
		factor: Number((measured.after.median / measured.before.median).toFixed(1)),
	});
}

const command = "docker compose run --rm bench";
const machine = {
	cpu: cpus()[0]?.model.trim() ?? "unknown",
	logicalCpus: cpus().length,
	memoryGiB: Number((totalmem() / 2 ** 30).toFixed(1)),
	kernel: release(),
	containerLimits: "each server: 1 CPU, 256 MB; load generator: 2 CPUs, 256 MB (docker-compose.yml)",
};
const settings = {
	command,
	concurrency: env.LOAD_CONCURRENCY,
	warmupSeconds: env.WARMUP_SECONDS,
	runs: env.BENCH_RUNS,
	secondsPerRun: env.BENCH_SECONDS,
	loadGenerator: `closed loop, bun ${Bun.version} (ts/src/load.ts)`,
};

await writeFresh(
	join(env.outDir, "results.json"),
	`${JSON.stringify({ date: new Date().toISOString().slice(0, 10), machine, settings, results: rows }, null, "\t")}\n`,
);

const cell = (value: Spread): string =>
	`${value.median} (${value.min} to ${value.max}, spread ${value.spreadPercent.toFixed(1)}%)`;
const markdown = [
	"# Before and after the fix",
	"",
	`Written by \`${command}\` on ${new Date().toISOString().slice(0, 10)}.`,
	"",
	"Requests per second: median of the runs, then the slowest and the fastest run, then (max - min) / median.",
	"",
	"| Service | Runtime | Before | After | Factor |",
	"| --- | --- | --- | --- | --- |",
	...rows.map(
		(row) =>
			`| ${row.label} | ${row.runtime} | ${cell(row.requestsPerSecond.before)} | ${cell(row.requestsPerSecond.after)} | **${row.factor.toFixed(1)}x** |`,
	),
	"",
	"## How it was measured",
	"",
	`- Machine: ${machine.cpu}, ${machine.logicalCpus} logical CPUs, ${machine.memoryGiB} GiB of memory, kernel ${machine.kernel}.`,
	`- Limits: ${machine.containerLimits}.`,
	`- Load: ${settings.loadGenerator}, ${settings.concurrency} concurrent connections, local target on the internal docker-compose network.`,
	`- Each variant: ${settings.warmupSeconds} s of warm-up (discarded), then ${settings.runs} runs of ${settings.secondsPerRun} s.`,
	"- The two variants of a service run in the same process and return the same body, so the only difference is the code path.",
	"- The factor is specific to this workload and this machine. Run the command again to get yours.",
	"",
].join("\n");
await writeFresh(join(env.outDir, "results.md"), markdown);
console.log(markdown);
