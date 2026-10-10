// EN: `bun run data` joins the committed results of the five workloads into the one file the
//     dashboard loads (`dashboard/results/results.js`), calculating the derived numbers on the
//     way: speed-up and efficiency for parallelism, memory per task for concurrency. It also
//     rewrites the results tables between the markers of the two READMEs, so the page, the
//     tables and the raw files can never disagree.
// PT: `bun run data` junta os resultados versionados das cinco cargas no único arquivo que o
//     dashboard carrega (`dashboard/results/results.js`), calculando no caminho os números
//     derivados: speed-up e eficiência no paralelismo, memória por tarefa na concorrência. Ele
//     também reescreve as tabelas de resultados entre os marcadores dos dois READMEs, para que
//     a página, as tabelas e os arquivos brutos nunca possam discordar.
// ES: `bun run data` junta los resultados versionados de las cinco cargas en el único archivo que
//     el dashboard carga (`dashboard/results/results.js`), calculando en el camino los números
//     derivados: speed-up y eficiencia en el paralelismo, memoria por tarea en la concurrencia.
//     También reescribe las tablas de resultados entre los marcadores de los tres README, para
//     que la página, las tablas y los archivos brutos nunca puedan discrepar.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { benchmarksDir, LANGUAGES } from "./lib";

interface RunnerRow {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	meanMs: number;
	stddevMs: number;
	minMs: number;
	maxMs: number;
	cpuMs: number;
	peakMemoryKb: number;
	elapsedMs: number;
	memoryKb: number;
	checksum?: string;
	command: string;
}

interface Report<Row> {
	project: string;
	generatedAt: string;
	machine: Record<string, string>;
	runtimes: Record<string, string>;
	runs: number;
	warmup: number;
	rows: Row[];
}

interface SectionRow {
	language: string;
	variant: string;
	sectionMeanMs: number;
	sectionStddevMs: number;
	sectionMinMs: number;
	sectionMaxMs: number;
}

interface HttpRow {
	language: string;
	implementation: string;
	rps: number;
	rpsStddev: number;
	rpsMin: number;
	rpsMax: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	failedRate: number;
	cpuPercent: number;
	peakMemoryKb: number;
	loadGeneratorCpuPercent: number;
	command: string;
}

function read<T>(workload: string, file = "results.json"): T {
	const path = join(benchmarksDir, workload, "results", file);
	if (!existsSync(path)) {
		throw new Error(`${path} is missing: run the ${workload} workload first`);
	}
	return JSON.parse(readFileSync(path, "utf8")) as T;
}

const order = (language: string): number => LANGUAGES.indexOf(language as (typeof LANGUAGES)[number]);
const byLanguage = <T extends { language: string }>(rows: T[]): T[] =>
	[...rows].sort((a, b) => order(a.language) - order(b.language));

const cpu = read<Report<RunnerRow>>("cpu-single");
const parallelism = read<Report<RunnerRow>>("parallelism");
const sections = read<{ rows: SectionRow[] }>("parallelism", "sections.json");
const concurrency = read<Report<RunnerRow>>("concurrency");
const memory = read<Report<RunnerRow>>("memory");
const http = read<Report<HttpRow> & { settings: Record<string, number> }>("http");

// ---- CPU, single thread: the largest size of each kernel ----

function largest(rows: RunnerRow[], implementation: string): RunnerRow[] {
	const own = rows.filter((row) => row.implementation === implementation);
	const n = Math.max(...own.map((row) => row.n));
	return byLanguage(own.filter((row) => row.n === n));
}

function timeRow(row: RunnerRow) {
	return {
		language: row.language,
		n: row.n,
		processMs: row.meanMs,
		stddevMs: row.stddevMs,
		minMs: row.minMs,
		maxMs: row.maxMs,
		cpuMs: row.cpuMs,
		sectionMs: row.elapsedMs,
		peakMemoryKb: row.peakMemoryKb,
	};
}

const cpuData = {
	nbody: largest(cpu.rows, "nbody").map(timeRow),
	sieve: largest(cpu.rows, "sieve").map(timeRow),
};

// ---- Parallelism: speed-up, efficiency and CPU time per worker count ----
// EN: Speed-up = time with 1 worker / time with w workers, on the measured section (several
//     samples from sections.json). Efficiency = speed-up / w: 100 % means each new worker did
//     a full worker's share. CPU time is the whole process, from hyperfine.
// PT: Speed-up = tempo com 1 worker / tempo com w workers, no trecho medido (várias amostras
//     do sections.json). Eficiência = speed-up / w: 100 % significa que cada worker novo fez a
//     parte inteira de um worker. O tempo de CPU é do processo inteiro, vindo do hyperfine.
// ES: Speed-up = tiempo con 1 worker / tiempo con w workers, en la sección medida (varias
//     muestras de sections.json). Eficiencia = speed-up / w: 100 % significa que cada worker
//     nuevo hizo la parte completa de un worker. El tiempo de CPU es del proceso completo, viene
//     de hyperfine.

const parallelismData = byLanguage(
	LANGUAGES.map((language) => {
		const own = sections.rows.filter((row) => row.language === language);
		const base = own.find((row) => row.variant === "1");
		if (base === undefined) {
			throw new Error(`parallelism: no 1-worker row for ${language}`);
		}
		const points = own
			.map((row) => {
				const workers = Number(row.variant);
				const process = parallelism.rows.find(
					(item) => item.language === language && item.variant === row.variant,
				);
				const speedup = base.sectionMeanMs / row.sectionMeanMs;
				return {
					workers,
					sectionMs: row.sectionMeanMs,
					sectionStddevMs: row.sectionStddevMs,
					speedup,
					// EN: The best and worst case of the ratio, from the range of both times.
					// PT: O melhor e o pior caso da razão, a partir do intervalo dos dois tempos.
					// ES: El mejor y el peor caso de la razón, a partir del rango de los dos tiempos.
					speedupLow: base.sectionMinMs / row.sectionMaxMs,
					speedupHigh: base.sectionMaxMs / row.sectionMinMs,
					efficiency: speedup / workers,
					processMs: process?.meanMs ?? 0,
					cpuMs: process?.cpuMs ?? 0,
					peakMemoryKb: process?.peakMemoryKb ?? 0,
				};
			})
			.sort((a, b) => a.workers - b.workers);
		return { language, n: parallelism.rows[0]?.n ?? 0, points };
	}),
);

// ---- Concurrency: total time, peak memory and memory per task ----
// EN: Memory per task = (peak with n tasks - peak with 0 tasks) / n. Subtracting the run with
//     zero tasks removes what the runtime needs just to exist.
// PT: Memória por tarefa = (pico com n tarefas - pico com 0 tarefas) / n. Subtrair a execução
//     com zero tarefas remove o que o runtime precisa só para existir.
// ES: Memoria por tarea = (pico con n tareas - pico con 0 tareas) / n. Restar la ejecución con
//     cero tareas quita lo que el runtime necesita solo para existir.

const concurrencyData = byLanguage(
	[...new Set(concurrency.rows.map((row) => `${row.language}/${row.implementation}`))].map((key) => {
		const [language = "", model = ""] = key.split("/");
		const own = concurrency.rows.filter((row) => row.language === language && row.implementation === model);
		const top = own.reduce((best, row) => (row.n > best.n ? row : best));
		const baseline = own.find((row) => row.n === 0);
		const extraKb = Math.max(0, top.peakMemoryKb - (baseline?.peakMemoryKb ?? 0));
		return {
			language,
			model,
			n: top.n,
			processMs: top.meanMs,
			stddevMs: top.stddevMs,
			minMs: top.minMs,
			maxMs: top.maxMs,
			sectionMs: top.elapsedMs,
			cpuMs: top.cpuMs,
			peakMemoryKb: top.peakMemoryKb,
			baselineMemoryKb: baseline?.peakMemoryKb ?? 0,
			bytesPerTask: (extraKb * 1024) / top.n,
		};
	}),
);

// ---- HTTP ----

const httpData = Object.fromEntries(
	["echo", "primes"].map((endpoint) => [
		endpoint,
		byLanguage(http.rows.filter((row) => row.implementation === endpoint)),
	]),
);

// ---- Memory ----

const collected: Record<string, boolean> = {
	cpp: false,
	rust: false,
	go: true,
	java: true,
	ts: true,
	elixir: true,
	python: true,
};
const memoryData = {
	trees: largest(memory.rows, "binary-trees").map((row) => ({
		...timeRow(row),
		garbageCollected: collected[row.language] ?? true,
	})),
	idle: largest(memory.rows, "idle").map((row) => ({
		...timeRow(row),
		garbageCollected: collected[row.language] ?? true,
	})),
};

// ---- Build time: one row per language with the cold and the warm build side by side ----

interface BuildRow {
	language: string;
	implementation: string;
	variant: string;
	meanMs: number;
	stddevMs: number;
	minMs: number;
	maxMs: number;
	command: string;
}
const build = read<Report<BuildRow>>("build-time");
const buildData = byLanguage(
	LANGUAGES.map((language) => {
		const pick = (mode: string): BuildRow => {
			const row = build.rows.find((item) => item.language === language && item.implementation === mode);
			if (row === undefined) {
				throw new Error(`build: no ${mode} row for ${language}`);
			}
			return row;
		};
		const cold = pick("cold");
		const warm = pick("warm");
		return {
			language,
			step: cold.variant,
			command: cold.command,
			coldMs: cold.meanMs,
			coldStddevMs: cold.stddevMs,
			coldMinMs: cold.minMs,
			coldMaxMs: cold.maxMs,
			warmMs: warm.meanMs,
			warmStddevMs: warm.stddevMs,
			warmMinMs: warm.minMs,
			warmMaxMs: warm.maxMs,
		};
	}),
);

// ---- Binary size ----

interface SizeRow {
	language: string;
	artifactBytes: number;
	runtimeBytes: number;
	artifact: string;
	runtime: string;
	notes: string;
	command: string;
}
const sizeData = byLanguage(read<Report<SizeRow>>("binary-size").rows);
const kib = (bytes: number): string => (bytes / 1024).toLocaleString("en-US", { maximumFractionDigits: 1 });

// ---- Database: one list of rows per phase ----

interface DatabaseRow {
	language: string;
	implementation: string;
	opsPerSecond: number;
	opsStddev: number;
	opsMin: number;
	opsMax: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	clientCpuMs: number;
	clientPeakMemoryKb: number;
	command: string;
}
const database = read<Report<DatabaseRow> & { settings: Record<string, number | string> }>("database");
const DB_PHASES = ["insert", "read", "query", "pool"] as const;
const DB_TITLES: Record<(typeof DB_PHASES)[number], { en: string; pt: string; es: string }> = {
	insert: { en: "insert rows one by one", pt: "inserir linhas uma a uma", es: "insertar filas una por una" },
	read: { en: "read by primary key", pt: "ler pela chave primária", es: "leer por clave primaria" },
	query: { en: "filter and aggregate", pt: "filtro e agregação", es: "filtrar y agregar" },
	pool: {
		en: "read by key, 8 workers on a pool",
		pt: "ler pela chave, 8 workers em um pool",
		es: "leer por clave, 8 workers en un pool",
	},
};
const databaseData = Object.fromEntries(
	DB_PHASES.map((phase) => [phase, byLanguage(database.rows.filter((row) => row.implementation === phase))]),
);

const commandsOf = (rows: { language: string; command: string }[]): Record<string, string[]> => {
	const out: Record<string, string[]> = {};
	for (const row of rows) {
		const list = out[row.language] ?? [];
		if (!list.includes(row.command)) {
			list.push(row.command);
		}
		out[row.language] = list;
	}
	return out;
};

const data = {
	generatedAt: new Date().toISOString(),
	languages: LANGUAGES,
	machine: cpu.machine,
	measuredAt: {
		"cpu-single": cpu.generatedAt,
		parallelism: parallelism.generatedAt,
		concurrency: concurrency.generatedAt,
		http: http.generatedAt,
		memory: memory.generatedAt,
	},
	runs: { runner: cpu.runs, warmup: cpu.warmup, http: http.runs },
	runtimes: cpu.runtimes,
	httpRuntimes: http.runtimes,
	httpSettings: http.settings,
	commands: {
		"cpu-single": commandsOf(cpu.rows),
		parallelism: commandsOf(parallelism.rows),
		concurrency: commandsOf(concurrency.rows),
		memory: commandsOf(memory.rows),
		http: commandsOf(http.rows),
		"build-time": commandsOf(build.rows),
		"binary-size": commandsOf(sizeData),
		database: commandsOf(database.rows),
	},
	cpu: cpuData,
	parallelism: parallelismData,
	concurrency: concurrencyData,
	http: httpData,
	memory: memoryData,
	build: buildData,
	size: sizeData,
	database: databaseData,
	databaseRuntimes: database.runtimes,
	databaseSettings: database.settings,
	buildRuntimes: build.runtimes,
};

const dataDir = join(benchmarksDir, "dashboard", "results");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "results.js"), `window.BENCH_DATA = ${JSON.stringify(data, null, "\t")};\n`);

// ---- README tables ----

function fixed(value: number): string {
	return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
}
const mib = (kb: number): string => fixed(kb / 1024);
const whole = (value: number): string => Math.round(value).toLocaleString("en-US");

type Lang = "en" | "pt" | "es";
type Text = Record<Lang, string>;
function table(lang: Lang, title: Text, note: Text, head: Text[], rows: string[][]): string {
	return [
		`### ${title[lang]}`,
		"",
		note[lang],
		"",
		`| ${head.map((cell) => cell[lang]).join(" | ")} |`,
		`| --- |${head
			.slice(1)
			.map(() => " ---: |")
			.join("")}`,
		...rows.map((row) => `| ${row.join(" | ")} |`),
		"",
	].join("\n");
}

const L: Text = { en: "Language", pt: "Linguagem", es: "Lenguaje" };
const t = (en: string, pt: string, es: string): Text => ({ en, pt, es });

function timeTable(lang: Lang, title: Text, rows: ReturnType<typeof timeRow>[]): string {
	return table(
		lang,
		title,
		t(
			"`process` is the whole program (mean ± standard deviation of 5 runs), `section` is the kernel only, without start-up.",
			"`processo` é o programa inteiro (média ± desvio padrão de 5 execuções), `trecho` é só o núcleo, sem a inicialização.",
			"`proceso` es el programa completo (promedio ± desviación estándar de 5 ejecuciones), `sección` es solo el núcleo, sin el arranque.",
		),
		[
			L,
			t("process (ms)", "processo (ms)", "proceso (ms)"),
			t("range (ms)", "intervalo (ms)", "rango (ms)"),
			t("section (ms)", "trecho (ms)", "sección (ms)"),
			t("CPU (ms)", "CPU (ms)", "CPU (ms)"),
			t("peak memory (MiB)", "pico de memória (MiB)", "pico de memoria (MiB)"),
		],
		rows.map((row) => [
			row.language,
			`${fixed(row.processMs)} ± ${fixed(row.stddevMs)}`,
			`${fixed(row.minMs)} – ${fixed(row.maxMs)}`,
			fixed(row.sectionMs),
			fixed(row.cpuMs),
			mib(row.peakMemoryKb),
		]),
	);
}

const DATABASE_LABEL: Record<Lang, string> = { en: "Database", pt: "Banco", es: "Base de datos" };
const HEADINGS: Record<Lang, [string, string]> = {
	en: ["Machine", "Runtimes"],
	pt: ["Máquina", "Runtimes"],
	es: ["Máquina", "Runtimes"],
};

function renderTables(lang: Lang): string {
	const workers = parallelismData[0]?.points.map((point) => point.workers) ?? [];
	const parts = [
		timeTable(
			lang,
			t(
				`CPU, one thread: n-body, ${whole(cpuData.nbody[0]?.n ?? 0)} steps`,
				`CPU, uma thread: n-body, ${whole(cpuData.nbody[0]?.n ?? 0)} passos`,
				`CPU, un thread: n-body, ${whole(cpuData.nbody[0]?.n ?? 0)} pasos`,
			),
			cpuData.nbody,
		),
		timeTable(
			lang,
			t(
				`CPU, one thread: prime sieve up to ${whole(cpuData.sieve[0]?.n ?? 0)}`,
				`CPU, uma thread: crivo de primos até ${whole(cpuData.sieve[0]?.n ?? 0)}`,
				`CPU, un thread: criba de primos hasta ${whole(cpuData.sieve[0]?.n ?? 0)}`,
			),
			cpuData.sieve,
		),
		table(
			lang,
			t(
				`Parallelism: speed-up (primes below ${whole(parallelismData[0]?.n ?? 0)})`,
				`Paralelismo: speed-up (primos abaixo de ${whole(parallelismData[0]?.n ?? 0)})`,
				`Paralelismo: speed-up (primos por debajo de ${whole(parallelismData[0]?.n ?? 0)})`,
			),
			t(
				"Time of the measured section with 1 worker divided by the time with w workers (mean of 5 runs each). The ideal is w.",
				"Tempo do trecho medido com 1 worker dividido pelo tempo com w workers (média de 5 execuções cada). O ideal é w.",
				"Tiempo de la sección medida con 1 worker dividido por el tiempo con w workers (promedio de 5 ejecuciones cada uno). Lo ideal es w.",
			),
			[
				L,
				t("time, 1 worker (ms)", "tempo, 1 worker (ms)", "tiempo, 1 worker (ms)"),
				...workers.slice(1).map((w) => t(`${w} workers`, `${w} workers`, `${w} workers`)),
			],
			parallelismData.map((series) => [
				series.language,
				`${fixed(series.points[0]?.sectionMs ?? 0)} ± ${fixed(series.points[0]?.sectionStddevMs ?? 0)}`,
				...series.points.slice(1).map((point) => `${point.speedup.toFixed(2)}×`),
			]),
		),
		table(
			lang,
			t("Parallelism: efficiency", "Paralelismo: eficiência", "Paralelismo: eficiencia"),
			t(
				"Speed-up divided by the number of workers. 100 % means no time was lost.",
				"Speed-up dividido pelo número de workers. 100 % significa que nenhum tempo foi perdido.",
				"Speed-up dividido por el número de workers. 100 % significa que no se perdió ningún tiempo.",
			),
			[L, ...workers.slice(1).map((w) => t(`${w} workers`, `${w} workers`, `${w} workers`))],
			parallelismData.map((series) => [
				series.language,
				...series.points.slice(1).map((point) => `${Math.round(point.efficiency * 100)} %`),
			]),
		),
		table(
			lang,
			t(
				"Parallelism: CPU time of the whole process (ms)",
				"Paralelismo: tempo de CPU do processo inteiro (ms)",
				"Paralelismo: tiempo de CPU del proceso completo (ms)",
			),
			t(
				"User plus system time summed over all cores, from hyperfine. It grows with the workers when cores wait, spin or share a physical core.",
				"Tempo de usuário mais sistema somado em todos os núcleos, medido pelo hyperfine. Cresce com os workers quando os núcleos esperam, giram em falso ou dividem um núcleo físico.",
				"Tiempo de usuario más sistema sumado en todos los núcleos, medido por hyperfine. Crece con los workers cuando los núcleos esperan, giran en vacío o comparten un núcleo físico.",
			),
			[L, ...workers.map((w) => t(`${w}`, `${w}`, `${w}`))],
			parallelismData.map((series) => [series.language, ...series.points.map((point) => fixed(point.cpuMs))]),
		),
		table(
			lang,
			t(
				"Concurrency: tasks waiting at the same time",
				"Concorrência: tarefas esperando ao mesmo tempo",
				"Concurrencia: tareas esperando al mismo tiempo",
			),
			t(
				"`memory per task` = (peak with n tasks − peak with 0 tasks) / n. C++ OS threads are capped at 10,000 (see the limits below).",
				"`memória por tarefa` = (pico com n tarefas − pico com 0 tarefas) / n. As threads de SO em C++ são limitadas a 10.000 (veja os limites abaixo).",
				"`memoria por tarea` = (pico con n tareas − pico con 0 tareas) / n. Los threads del SO en C++ están limitados a 10.000 (mira los límites más abajo).",
			),
			[
				L,
				t("model", "modelo", "modelo"),
				t("tasks", "tarefas", "tareas"),
				t("total time (ms)", "tempo total (ms)", "tiempo total (ms)"),
				t("peak memory (MiB)", "pico de memória (MiB)", "pico de memoria (MiB)"),
				t("memory per task (bytes)", "memória por tarefa (bytes)", "memoria por tarea (bytes)"),
			],
			concurrencyData.map((row) => [
				row.language,
				row.model,
				whole(row.n),
				`${fixed(row.processMs)} ± ${fixed(row.stddevMs)}`,
				mib(row.peakMemoryKb),
				whole(row.bytesPerTask),
			]),
		),
		...(["echo", "primes"] as const).map((endpoint) =>
			table(
				lang,
				endpoint === "echo"
					? t(
							"HTTP: JSON echo (`POST /echo`)",
							"HTTP: eco de JSON (`POST /echo`)",
							"HTTP: eco de JSON (`POST /echo`)",
						)
					: t(
							"HTTP: CPU-bound (`GET /primes?limit=5000`)",
							"HTTP: preso à CPU (`GET /primes?limit=5000`)",
							"HTTP: limitado por CPU (`GET /primes?limit=5000`)",
						),
				t(
					`${http.settings.vus} virtual users, ${http.runs} runs of ${http.settings.durationSeconds} s. CPU: 100 % is one core, the limit is 400 %. \`k6 CPU\` near 400 % means the load generator was the limit, not the server.`,
					`${http.settings.vus} usuários virtuais, ${http.runs} execuções de ${http.settings.durationSeconds} s. CPU: 100 % é um núcleo, o limite é 400 %. \`CPU do k6\` perto de 400 % significa que o limite foi o gerador de carga, não o servidor.`,
					`${http.settings.vus} usuarios virtuales, ${http.runs} ejecuciones de ${http.settings.durationSeconds} s. CPU: 100 % es un núcleo, el límite es 400 %. \`CPU de k6\` cerca de 400 % significa que el límite fue el generador de carga, no el servidor.`,
				),
				[
					L,
					t("req/s", "req/s", "req/s"),
					t("p50 (ms)", "p50 (ms)", "p50 (ms)"),
					t("p95 (ms)", "p95 (ms)", "p95 (ms)"),
					t("p99 (ms)", "p99 (ms)", "p99 (ms)"),
					t("peak memory (MiB)", "pico de memória (MiB)", "pico de memoria (MiB)"),
					t("mean CPU (%)", "CPU média (%)", "CPU promedio (%)"),
					t("k6 CPU (%)", "CPU do k6 (%)", "CPU de k6 (%)"),
				],
				(httpData[endpoint] ?? []).map((row) => [
					row.language,
					`${whole(row.rps)} ± ${whole(row.rpsStddev)}`,
					fixed(row.p50Ms),
					fixed(row.p95Ms),
					fixed(row.p99Ms),
					mib(row.peakMemoryKb),
					whole(row.cpuPercent),
					whole(row.loadGeneratorCpuPercent),
				]),
			),
		),
		table(
			lang,
			t(
				`Memory: binary trees, depth ${memoryData.trees[0]?.n ?? 0}`,
				`Memória: árvores binárias, profundidade ${memoryData.trees[0]?.n ?? 0}`,
				`Memoria: árboles binarios, profundidad ${memoryData.trees[0]?.n ?? 0}`,
			),
			t(
				"GC = garbage collected. `CPU` above `time` means helper threads (usually the collector) worked on other cores.",
				"GC = com coletor de lixo. `CPU` acima de `tempo` significa que threads auxiliares (em geral o coletor) trabalharam em outros núcleos.",
				"GC = con recolector de basura. `CPU` por encima de `tiempo` significa que threads auxiliares (por lo general el recolector) trabajaron en otros núcleos.",
			),
			[
				L,
				t("memory", "memória", "memoria"),
				t("peak memory (MiB)", "pico de memória (MiB)", "pico de memoria (MiB)"),
				t("time (ms)", "tempo (ms)", "tiempo (ms)"),
				t("CPU (ms)", "CPU (ms)", "CPU (ms)"),
			],
			memoryData.trees.map((row) => [
				row.language,
				row.garbageCollected ? "GC" : "manual",
				mib(row.peakMemoryKb),
				`${fixed(row.processMs)} ± ${fixed(row.stddevMs)}`,
				fixed(row.cpuMs),
			]),
		),
		table(
			lang,
			t(
				"Memory: idle process (start and exit)",
				"Memória: processo ocioso (sobe e sai)",
				"Memoria: proceso inactivo (arranca y sale)",
			),
			t(
				"What every program in the language pays before doing anything.",
				"O que todo programa na linguagem paga antes de fazer qualquer coisa.",
				"Lo que paga todo programa del lenguaje antes de hacer cualquier cosa.",
			),
			[
				L,
				t("memory", "memória", "memoria"),
				t("start-up time (ms)", "tempo de inicialização (ms)", "tiempo de arranque (ms)"),
				t("peak memory (MiB)", "pico de memória (MiB)", "pico de memoria (MiB)"),
			],
			memoryData.idle.map((row) => [
				row.language,
				row.garbageCollected ? "GC" : "manual",
				`${fixed(row.processMs)} ± ${fixed(row.stddevMs)}`,
				mib(row.peakMemoryKb),
			]),
		),
		table(
			lang,
			t(
				"Build time of the `cpu-single` program",
				"Tempo de build do programa do `cpu-single`",
				"Tiempo de compilación del programa de `cpu-single`",
			),
			t(
				"`cold` starts with no output and no compiler cache. `warm` changes one line and builds again. `step` says what is really measured: Python, Elixir, Java and Bun have no step that produces machine code ahead of time.",
				"`frio` começa sem saída e sem cache do compilador. `quente` muda uma linha e constrói de novo. `etapa` diz o que é realmente medido: Python, Elixir, Java e Bun não têm etapa que produza código de máquina antes da hora.",
				"`frío` empieza sin salida y sin caché del compilador. `caliente` cambia una línea y compila de nuevo. `paso` dice qué se mide realmente: Python, Elixir, Java y Bun no tienen un paso que produzca código de máquina por adelantado.",
			),
			[
				L,
				t("step", "etapa", "paso"),
				t("cold (ms)", "frio (ms)", "frío (ms)"),
				t("warm (ms)", "quente (ms)", "caliente (ms)"),
				t("command", "comando", "comando"),
			],
			buildData.map((row) => [
				row.language,
				row.step,
				`${fixed(row.coldMs)} ± ${fixed(row.coldStddevMs)}`,
				`${fixed(row.warmMs)} ± ${fixed(row.warmStddevMs)}`,
				`\`${row.command}\``,
			]),
		),
		table(
			lang,
			t(
				"Size on disk of what you ship",
				"Tamanho em disco do que você entrega",
				"Tamaño en disco de lo que entregas",
			),
			t(
				"`runtime` is what must be on the machine besides the artifact, not counting the operating system and glibc. Sizes are exact, so there is no spread.",
				"`runtime` é o que precisa estar na máquina além do artefato, sem contar o sistema operacional e a glibc. Os tamanhos são exatos, então não há dispersão.",
				"`runtime` es lo que debe estar en la máquina además del artefacto, sin contar el sistema operativo y glibc. Los tamaños son exactos, así que no hay dispersión.",
			),
			[
				L,
				t("artifact (KiB)", "artefato (KiB)", "artefacto (KiB)"),
				t("runtime (KiB)", "runtime (KiB)", "runtime (KiB)"),
				t("total (KiB)", "total (KiB)", "total (KiB)"),
				t("artifact", "artefato", "artefacto"),
				t("runtime", "runtime", "runtime"),
			],
			sizeData.map((row) => [
				row.language,
				kib(row.artifactBytes),
				kib(row.runtimeBytes),
				kib(row.artifactBytes + row.runtimeBytes),
				row.artifact,
				row.runtime,
			]),
		),
		...DB_PHASES.map((phase) =>
			table(
				lang,
				{
					en: `Database: ${DB_TITLES[phase].en}`,
					pt: `Banco de dados: ${DB_TITLES[phase].pt}`,
					es: `Base de datos: ${DB_TITLES[phase].es}`,
				},
				t(
					`${database.settings.rows} rows, ${database.runs} runs. Each operation is one round trip to PostgreSQL. Client CPU and memory belong to the whole run of the client (all phases).`,
					`${database.settings.rows} linhas, ${database.runs} execuções. Cada operação é uma ida e volta ao PostgreSQL. A CPU e a memória do cliente são da execução inteira do cliente (todas as fases).`,
					`${database.settings.rows} filas, ${database.runs} ejecuciones. Cada operación es un viaje de ida y vuelta a PostgreSQL. La CPU y la memoria del cliente corresponden a la ejecución completa del cliente (todas las fases).`,
				),
				[
					L,
					t("ops/s", "ops/s", "ops/s"),
					t("p50 (ms)", "p50 (ms)", "p50 (ms)"),
					t("p95 (ms)", "p95 (ms)", "p95 (ms)"),
					t("p99 (ms)", "p99 (ms)", "p99 (ms)"),
					t("client CPU (ms)", "CPU do cliente (ms)", "CPU del cliente (ms)"),
					t("client memory (MiB)", "memória do cliente (MiB)", "memoria del cliente (MiB)"),
				],
				(databaseData[phase] ?? []).map((row) => [
					row.language,
					`${whole(row.opsPerSecond)} ± ${whole(row.opsStddev)}`,
					fixed(row.p50Ms),
					fixed(row.p95Ms),
					fixed(row.p99Ms),
					whole(row.clientCpuMs),
					mib(row.clientPeakMemoryKb),
				]),
			),
		),
	];
	const machine = Object.entries(cpu.machine).map(([key, value]) => `- ${key}: ${value}`);
	const runtimes = LANGUAGES.map(
		(language) =>
			`- ${language}: ${cpu.runtimes[language]}. HTTP: ${http.runtimes[language]}. ${DATABASE_LABEL[lang]}: ${database.runtimes[language]}`,
	);
	const heading = HEADINGS[lang];
	return [`### ${heading[0]}`, "", ...machine, "", `### ${heading[1]}`, "", ...runtimes, "", ...parts].join("\n");
}

const START = "<!-- results:start -->";
const END = "<!-- results:end -->";
for (const [file, lang] of [
	["README.md", "en"],
	["README.pt-BR.md", "pt"],
	["README.es.md", "es"],
] as const) {
	const path = join(benchmarksDir, file);
	if (!existsSync(path)) {
		continue;
	}
	const text = readFileSync(path, "utf8");
	const from = text.indexOf(START);
	const to = text.indexOf(END);
	if (from < 0 || to < from) {
		throw new Error(`${file}: markers ${START} and ${END} not found`);
	}
	writeFileSync(path, `${text.slice(0, from + START.length)}\n\n${renderTables(lang)}\n${text.slice(to)}`);
	console.log(`updated the results tables of ${file}`);
}
console.log(`wrote ${join(dataDir, "results.js")}`);
