// EN: Collector of the HTTP workload (`bun run http`). The shared runner of `tools/bench`
//     measures a program that starts, works and exits. A server never exits, so this script
//     does the equivalent job: for each language it starts the server, warms it up, runs k6
//     several times and, while k6 runs, samples the CPU and memory of the server container
//     from `docker stats`. It writes the same three files as the runner (results.json,
//     results.md, results.js) with the HTTP metrics added to each row.
// PT: Coletor da carga HTTP (`bun run http`). O runner compartilhado de `tools/bench` mede um
//     programa que sobe, trabalha e sai. Um servidor nunca sai, então este script faz o
//     trabalho equivalente: para cada linguagem ele sobe o servidor, o aquece, roda o k6
//     várias vezes e, enquanto o k6 roda, amostra a CPU e a memória do contêiner do servidor
//     pelo `docker stats`. Ele escreve os mesmos três arquivos do runner (results.json,
//     results.md, results.js) com as métricas HTTP adicionadas a cada linha.
// ES: Recolector de la carga HTTP (`bun run http`). El runner compartido de `tools/bench` mide un
//     programa que arranca, trabaja y sale. Un servidor nunca sale, así que este script hace el
//     trabajo equivalente: para cada lenguaje levanta el servidor, lo calienta, ejecuta k6
//     varias veces y, mientras k6 corre, muestrea la CPU y la memoria del contenedor del servidor
//     con `docker stats`. Escribe los mismos tres archivos del runner (results.json,
//     results.md, results.js) con las métricas HTTP agregadas a cada fila.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES, type Language, machineInfo, mustRun, run, spread } from "../scripts/lib";

const httpDir = import.meta.dir;
const REPETITIONS = Number(process.env.HTTP_REPETITIONS ?? 3);
const VUS = Number(process.env.HTTP_VUS ?? 32);
const DURATION_S = Number(process.env.HTTP_DURATION_S ?? 10);
const WARMUP_S = Number(process.env.HTTP_WARMUP_S ?? 3);
const PRIMES_LIMIT = 5000;
const ENDPOINTS = ["echo", "primes"] as const;
const K6_CONTAINER = "sef-bd-http-k6-load";
// EN: k6 counts as "sending load" above this CPU use. It is low on purpose: against a slow
//     server the virtual users spend their time waiting, and k6 itself is almost idle.
// PT: O k6 conta como "enviando carga" acima deste uso de CPU. É baixo de propósito: contra um
//     servidor lento os usuários virtuais passam o tempo esperando, e o próprio k6 fica quase ocioso.
// ES: k6 cuenta como "enviando carga" por encima de este uso de CPU. Es bajo a propósito: contra
//     un servidor lento los usuarios virtuales pasan el tiempo esperando, y el propio k6 queda casi ocioso.
const K6_ACTIVE_PERCENT = 1;

const STACK: Record<Language, { server: string; version: string[] }> = {
	cpp: { server: "cpp-httplib 0.60.0 + nlohmann/json 3.12.0", version: ["g++", "-dumpfullversion"] },
	rust: { server: "axum 0.8.9 + tokio 1.53.2", version: ["rustc", "--version"] },
	go: { server: "net/http (standard library)", version: ["go", "version"] },
	java: { server: "JDK HttpServer + virtual threads + Jackson 3.2.3", version: ["java", "--version"] },
	ts: { server: "Bun.serve (built in)", version: ["bun", "--version"] },
	elixir: { server: "Bandit 1.12.5 + Plug 1.20.3", version: ["elixir", "--short-version"] },
	python: { server: "FastAPI 0.142.4 + uvicorn 0.54.0 (1 worker)", version: ["python", "--version"] },
};

function compose(args: string[]): string {
	return mustRun(["docker", "compose", "--profile", "tools", ...args], { cwd: httpDir });
}

interface Tick {
	at: number;
	containers: Map<string, { cpuPercent: number; memoryKb: number }>;
}

const UNITS: Record<string, number> = {
	B: 1 / 1024,
	KiB: 1,
	MiB: 1024,
	GiB: 1024 * 1024,
	kB: 1000 / 1024,
	MB: 1e6 / 1024,
};

function parseMemoryKb(usage: string): number {
	const match = /^([\d.]+)\s*([A-Za-z]+)/.exec(usage);
	return match?.[1] === undefined || match[2] === undefined ? 0 : Number(match[1]) * (UNITS[match[2]] ?? 0);
}

// EN: `docker stats` prints, about once a second, one line per running container, after a
//     terminal code that moves the cursor home. Each block between two of those codes is one
//     sample of every container at the same instant, here called a tick.
// PT: O `docker stats` imprime, cerca de uma vez por segundo, uma linha por contêiner em
//     execução, depois de um código de terminal que leva o cursor ao início. Cada bloco entre
//     dois desses códigos é uma amostra de todos os contêineres no mesmo instante, aqui
//     chamada de tick.
// ES: `docker stats` imprime, cerca de una vez por segundo, una línea por contenedor en
//     ejecución, después de un código de terminal que lleva el cursor al inicio. Cada bloque entre
//     dos de esos códigos es una muestra de todos los contenedores en el mismo instante, aquí
//     llamada tick.
function startSampler(): { ticks: Tick[]; stop: () => void } {
	const ticks: Tick[] = [];
	const child = Bun.spawn(["docker", "stats", "--format", "{{json .}}"], { stdout: "pipe", stderr: "ignore" });
	const decoder = new TextDecoder();
	let pending = "";
	(async () => {
		for await (const chunk of child.stdout) {
			pending += decoder.decode(chunk, { stream: true });
			const blocks = pending.split("\u001b[H");
			pending = blocks.pop() ?? "";
			for (const block of blocks) {
				const containers = new Map<string, { cpuPercent: number; memoryKb: number }>();
				for (const line of block.split("\n")) {
					const start = line.indexOf("{");
					const end = line.lastIndexOf("}");
					if (start < 0 || end < start) {
						continue;
					}
					const row = JSON.parse(line.slice(start, end + 1)) as {
						Name: string;
						CPUPerc: string;
						MemUsage: string;
					};
					containers.set(row.Name, {
						cpuPercent: Number.parseFloat(row.CPUPerc),
						memoryKb: parseMemoryKb(row.MemUsage),
					});
				}
				if (containers.size > 0) {
					ticks.push({ at: Date.now(), containers });
				}
			}
		}
	})();
	return { ticks, stop: () => child.kill() };
}

interface K6Summary {
	requests: number;
	rps: number;
	failedRate: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	meanMs: number;
	maxMs: number;
}

function k6Command(language: Language, endpoint: string, seconds: number): string[] {
	return [
		"run",
		"--rm",
		"-T",
		"--name",
		K6_CONTAINER,
		"-e",
		`TARGET=http://server-${language}:8080`,
		"-e",
		`ENDPOINT=${endpoint}`,
		"-e",
		`VUS=${VUS}`,
		"-e",
		`DURATION=${seconds}s`,
		"-e",
		`LIMIT=${PRIMES_LIMIT}`,
		"k6",
		"run",
		"--quiet",
		"/scripts/load.js",
	];
}

// EN: k6 is started without blocking this script: while it runs, the sampler above must keep
//     reading `docker stats`, and a blocking call would freeze that reader until k6 ended.
// PT: O k6 é iniciado sem bloquear este script: enquanto ele roda, o amostrador acima precisa
//     continuar lendo o `docker stats`, e uma chamada bloqueante congelaria esse leitor até o
//     k6 terminar.
// ES: k6 se inicia sin bloquear este script: mientras corre, el muestreador de arriba necesita
//     seguir leyendo `docker stats`, y una llamada bloqueante congelaría ese lector hasta que
//     k6 termine.
async function runK6(language: Language, endpoint: string, seconds: number): Promise<K6Summary> {
	const child = Bun.spawn(["docker", "compose", "--profile", "tools", ...k6Command(language, endpoint, seconds)], {
		cwd: httpDir,
		stdout: "pipe",
		stderr: "pipe",
	});
	const [output, errors, exitCode] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	if (exitCode !== 0) {
		throw new Error(`k6 failed:\n${errors}${output}`);
	}
	const line = output.split(/\r?\n/).find((item) => item.startsWith("K6_SUMMARY "));
	if (line === undefined) {
		throw new Error(`k6 printed no summary:\n${output}`);
	}
	return JSON.parse(line.slice("K6_SUMMARY ".length)) as K6Summary;
}

function containerName(language: Language): string {
	return mustRun(["docker", "compose", "ps", "--format", "{{.Name}}", `server-${language}`], { cwd: httpDir }).trim();
}

interface Repetition extends K6Summary {
	cpuPercent: number;
	peakMemoryKb: number;
	loadGeneratorCpuPercent: number;
	samples: number;
}

async function measure(language: Language, endpoint: string, server: string, ticks: Tick[]): Promise<Repetition> {
	const from = Date.now();
	const summary = await runK6(language, endpoint, DURATION_S);
	// EN: Give the sampler a moment to deliver the last tick of this run.
	// PT: Dá ao amostrador um instante para entregar o último tick desta execução.
	// ES: Le da al muestreador un instante para entregar el último tick de esta ejecución.
	await Bun.sleep(1200);
	const to = Date.now();
	// EN: Keep only the ticks in which k6 was really sending load, then drop the first and the
	//     last: each tick is an average over the previous second, so the edges include time
	//     with no load and would pull the mean down.
	// PT: Fica só com os ticks em que o k6 estava de fato enviando carga, depois descarta o
	//     primeiro e o último: cada tick é uma média do segundo anterior, então as bordas
	//     incluem tempo sem carga e puxariam a média para baixo.
	// ES: Se queda solo con los ticks en que k6 realmente estaba enviando carga, y luego descarta el
	//     primero y el último: cada tick es un promedio del segundo anterior, así que los bordes
	//     incluyen tiempo sin carga y bajarían el promedio.
	const active = ticks
		.filter((tick) => tick.at >= from && tick.at <= to + 1500)
		.filter(
			(tick) =>
				(tick.containers.get(K6_CONTAINER)?.cpuPercent ?? 0) > K6_ACTIVE_PERCENT && tick.containers.has(server),
		)
		.slice(1, -1);
	const serverSamples = active.map((tick) => tick.containers.get(server) ?? { cpuPercent: 0, memoryKb: 0 });
	const mean = (values: number[]): number =>
		values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
	return {
		...summary,
		cpuPercent: mean(serverSamples.map((sample) => sample.cpuPercent)),
		peakMemoryKb: Math.max(0, ...serverSamples.map((sample) => sample.memoryKb)),
		loadGeneratorCpuPercent: mean(active.map((tick) => tick.containers.get(K6_CONTAINER)?.cpuPercent ?? 0)),
		samples: active.length,
	};
}

interface HttpRow {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	rps: number;
	rpsStddev: number;
	rpsMin: number;
	rpsMax: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	meanMs: number;
	failedRate: number;
	cpuPercent: number;
	peakMemoryKb: number;
	loadGeneratorCpuPercent: number;
	samples: number;
	command: string;
}

function fixed(value: number): string {
	return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

function renderMarkdown(report: {
	generatedAt: string;
	machine: Record<string, string>;
	runtimes: Record<string, string>;
	rows: HttpRow[];
}): string {
	const commands = [
		...new Set(report.rows.map((row) => `- \`${row.language}\` ${row.implementation}: \`${row.command}\``)),
	];
	return [
		"# Benchmark: http",
		"",
		`Generated at ${report.generatedAt}. ${REPETITIONS} measured runs of ${DURATION_S} s per row, each after a ${WARMUP_S} s warm-up run, with ${VUS} virtual users. Every server and the load generator are limited to 4 CPUs and 2 GiB.`,
		"",
		"## Machine",
		"",
		...Object.entries(report.machine).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Runtimes and servers",
		"",
		...Object.entries(report.runtimes).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Results",
		"",
		"`req/s` is the mean of the runs ± standard deviation, with the range. Latencies are the mean of the runs. `CPU` is the mean of the server container while the load ran (100 % is one core, the limit is 400 %), `peak memory` is its largest sample, both from `docker stats`. `k6 CPU` is the load generator: close to 400 % means the generator, not the server, was the limit.",
		"",
		"| Endpoint | Language | req/s | range (req/s) | p50 (ms) | p95 (ms) | p99 (ms) | CPU (%) | peak memory (MiB) | k6 CPU (%) | failed (%) |",
		"| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
		...report.rows.map(
			(row) =>
				`| ${row.implementation} | ${row.language} | ${Math.round(row.rps)} ± ${Math.round(row.rpsStddev)} | ${Math.round(row.rpsMin)} to ${Math.round(row.rpsMax)} | ${fixed(row.p50Ms)} | ${fixed(row.p95Ms)} | ${fixed(row.p99Ms)} | ${Math.round(row.cpuPercent)} | ${fixed(row.peakMemoryKb / 1024)} | ${Math.round(row.loadGeneratorCpuPercent)} | ${fixed(row.failedRate * 100)} |`,
		),
		"",
		"## Commands",
		"",
		"Run from `benchmarks/http/`:",
		"",
		...commands,
		"",
	].join("\n");
}

async function main(): Promise<void> {
	const requested = process.argv.slice(2);
	const languages = LANGUAGES.filter((language) => requested.length === 0 || requested.includes(language));
	const services = languages.map((language) => `server-${language}`);

	console.log("  building the server images");
	compose(["build", ...services]);
	// EN: A run that was interrupted may have left containers behind. Start from nothing.
	// PT: Uma execução interrompida pode ter deixado contêineres para trás. Começa do zero.
	// ES: Una ejecución interrumpida pudo haber dejado contenedores atrás. Empieza desde cero.
	compose(["down", "-v", "--remove-orphans"]);

	const sampler = startSampler();
	const rows: HttpRow[] = [];
	const runtimes: Record<string, string> = {};
	try {
		for (const language of languages) {
			const image = `sef-bd-http-${language}:local`;
			const version = mustRun([
				"docker",
				"run",
				"--rm",
				"--network",
				"none",
				"--entrypoint",
				STACK[language].version[0] ?? "true",
				image,
				...STACK[language].version.slice(1),
			]);
			runtimes[language] = `${version.trim().split("\n")[0]}, ${STACK[language].server} (${image})`;

			compose(["up", "-d", `server-${language}`]);
			compose([
				"run",
				"--rm",
				"-T",
				"-e",
				`SERVERS=${language}`,
				"tools",
				"bun",
				"test",
				"tests/protocol.test.ts",
				"-t",
				"health",
			]);
			const server = containerName(language);

			for (const endpoint of ENDPOINTS) {
				const repetitions: Repetition[] = [];
				for (let repetition = 1; repetition <= REPETITIONS; repetition++) {
					await runK6(language, endpoint, WARMUP_S);
					const result = await measure(language, endpoint, server, sampler.ticks);
					console.log(
						`  ${language} ${endpoint} run ${repetition}: ${Math.round(result.rps)} req/s, p99 ${fixed(result.p99Ms)} ms, CPU ${Math.round(result.cpuPercent)} %, ${fixed(result.peakMemoryKb / 1024)} MiB (${result.samples} samples)`,
					);
					repetitions.push(result);
				}
				const rps = spread(repetitions.map((item) => item.rps));
				const meanOf = (pick: (item: Repetition) => number): number => spread(repetitions.map(pick)).mean;
				rows.push({
					language,
					implementation: endpoint,
					variant: `${VUS}-vus`,
					n: Math.round(meanOf((item) => item.requests)),
					rps: rps.mean,
					rpsStddev: rps.stddev,
					rpsMin: rps.min,
					rpsMax: rps.max,
					p50Ms: meanOf((item) => item.p50Ms),
					p95Ms: meanOf((item) => item.p95Ms),
					p99Ms: meanOf((item) => item.p99Ms),
					meanMs: meanOf((item) => item.meanMs),
					failedRate: Math.max(...repetitions.map((item) => item.failedRate)),
					cpuPercent: meanOf((item) => item.cpuPercent),
					peakMemoryKb: Math.max(...repetitions.map((item) => item.peakMemoryKb)),
					loadGeneratorCpuPercent: meanOf((item) => item.loadGeneratorCpuPercent),
					samples: repetitions.reduce((sum, item) => sum + item.samples, 0),
					command: `docker compose --profile tools ${k6Command(language, endpoint, DURATION_S).join(" ")}`,
				});
			}
			compose(["stop", `server-${language}`]);
		}
	} finally {
		sampler.stop();
		run(["docker", "compose", "--profile", "tools", "down", "-v", "--remove-orphans"], { cwd: httpDir });
	}

	// EN: When only some languages were asked for, the rows and runtimes of the others are kept
	//     from the results already on disk, so one language can be measured again by itself.
	// PT: Quando só algumas linguagens foram pedidas, as linhas e os runtimes das outras são
	//     mantidos a partir dos resultados já em disco, então uma linguagem pode ser medida de
	//     novo sozinha.
	// ES: Cuando solo se pidieron algunos lenguajes, las filas y los runtimes de los demás se
	//     mantienen a partir de los resultados que ya están en disco, así un lenguaje puede medirse
	//     de nuevo por sí solo.
	const previousPath = join(httpDir, "results", "results.json");
	if (requested.length > 0 && existsSync(previousPath)) {
		const previous = JSON.parse(readFileSync(previousPath, "utf8")) as {
			rows: HttpRow[];
			runtimes: Record<string, string>;
		};
		rows.push(...previous.rows.filter((row) => !requested.includes(row.language)));
		for (const [language, runtime] of Object.entries(previous.runtimes)) {
			runtimes[language] ??= runtime;
		}
	}
	rows.sort((a, b) => a.implementation.localeCompare(b.implementation) || a.language.localeCompare(b.language));
	const report = {
		project: "http",
		generatedAt: new Date().toISOString(),
		machine: machineInfo(),
		runtimes,
		runs: REPETITIONS,
		warmup: 1,
		settings: {
			vus: VUS,
			durationSeconds: DURATION_S,
			warmupSeconds: WARMUP_S,
			primesLimit: PRIMES_LIMIT,
			serverCpus: 4,
			loadGeneratorCpus: 4,
		},
		rows,
	};
	const outDir = join(httpDir, "results");
	mkdirSync(outDir, { recursive: true });
	const json = JSON.stringify(report, null, "\t");
	writeFileSync(join(outDir, "results.json"), `${json}\n`);
	writeFileSync(join(outDir, "results.md"), renderMarkdown(report));
	writeFileSync(join(outDir, "results.js"), `window.BENCH_RESULTS = ${json};\n`);
	console.log(`${rows.length} rows written to ${outDir}`);
}

await main();
