// EN: The benchmark: `docker compose run --rm bench`. It answers one question: how many hashes
//     per second does each storage scheme compute on this machine? It hashes the same fake
//     password again and again and counts. There is no list of candidate passwords, no stored
//     hash being compared and no loop that stops when something matches: this measures the
//     functions and guesses nothing.
// PT: O benchmark: `docker compose run --rm bench`. Ele responde a uma pergunta: quantos hashes
//     por segundo cada esquema de armazenamento calcula nesta máquina? Ele calcula o hash da
//     mesma senha falsa repetidas vezes e conta. Não há lista de senhas candidatas, nenhum hash
//     guardado sendo comparado e nenhum laço que para quando algo confere: isto mede as funções
//     e não adivinha nada.
// ES: El benchmark: `docker compose run --rm bench`. Responde una pregunta: ¿cuántos hashes
//     por segundo calcula en esta máquina cada esquema de almacenamiento? Calcula el hash de la
//     misma contraseña falsa repetidas veces y cuenta. No hay lista de contraseñas candidatas, ningún hash
//     guardado que se compare y ningún ciclo que se detenga cuando algo coincide: esto mide las funciones
//     y no adivina nada.

import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, release, totalmem, type } from "node:os";
import { join } from "node:path";
import { SHARED_FAKE_PASSWORD } from "./data";
import { ARGON2_PARAMS, type Argon2Params } from "./fixed/fixed-password-storage";
import { storeMd5, storePlainText, storeSaltedSha256 } from "./vulnerable/vulnerable-password-storage";

export interface Subject {
	scheme: string;
	parameters: string;
	// EN: Hashes computed in one run. Fast functions need many for the clock to see them; slow
	//     ones need few, or the benchmark would take minutes.
	// PT: Hashes calculados em uma rodada. Funções rápidas precisam de muitos para o relógio
	//     enxergá-las; as lentas precisam de poucos, ou o benchmark levaria minutos.
	// ES: Hashes calculados en una ronda. Las funciones rápidas necesitan muchos para que el reloj
	//     las vea; las lentas necesitan pocos, o el benchmark tardaría minutos.
	n: number;
	hashOnce: () => string;
}

export interface Spread {
	min: number;
	median: number;
	max: number;
}

export interface Row {
	scheme: string;
	parameters: string;
	n: number;
	runs: number;
	warmupRuns: number;
	elapsedMs: number[];
	hashesPerSecond: Spread;
	msPerHashMedian: number;
	timesSlowerThanMd5: number;
}

export function spreadOf(values: readonly number[]): Spread {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const upper = sorted[middle] ?? Number.NaN;
	const lower = sorted[middle - 1] ?? upper;
	return {
		min: sorted[0] ?? Number.NaN,
		median: sorted.length % 2 === 1 ? upper : (lower + upper) / 2,
		max: sorted[sorted.length - 1] ?? Number.NaN,
	};
}

// EN: One run: compute `n` hashes and return the elapsed milliseconds. The lengths are added up
//     so the runtime cannot decide the results are unused and skip the work.
// PT: Uma rodada: calcula `n` hashes e devolve os milissegundos gastos. Os tamanhos são somados
//     para o runtime não concluir que os resultados não são usados e pular o trabalho.
// ES: Una ronda: calcula `n` hashes y devuelve los milisegundos gastados. Los tamaños se suman
//     para que el runtime no concluya que los resultados no se usan y se salte el trabajo.
function timeOneRun(subject: Subject): number {
	let sink = 0;
	const startedAt = performance.now();
	for (let i = 0; i < subject.n; i++) sink += subject.hashOnce().length;
	const elapsed = performance.now() - startedAt;
	if (sink === 0) throw new Error(`${subject.scheme}: produced no output`);
	return elapsed;
}

// EN: Warm-up runs are thrown away (the first calls pay for compilation and cold caches). Then
//     several measured runs, and the report shows their spread instead of only the best one.
// PT: As rodadas de aquecimento são descartadas (as primeiras chamadas pagam compilação e caches
//     frios). Depois, várias rodadas medidas, e o relatório mostra a dispersão delas em vez de
//     só a melhor.
// ES: Las rondas de calentamiento se descartan (las primeras llamadas pagan compilación y cachés
//     fríos). Después, varias rondas medidas, y el informe muestra su dispersión en lugar de
//     solo la mejor.
export function measure(subject: Subject, runs: number, warmupRuns: number): Omit<Row, "timesSlowerThanMd5"> {
	for (let i = 0; i < warmupRuns; i++) timeOneRun(subject);
	const elapsedMs: number[] = [];
	for (let i = 0; i < runs; i++) elapsedMs.push(timeOneRun(subject));
	const hashesPerSecond = spreadOf(elapsedMs.map((ms) => (subject.n / ms) * 1000));
	return {
		scheme: subject.scheme,
		parameters: subject.parameters,
		n: subject.n,
		runs,
		warmupRuns,
		elapsedMs,
		hashesPerSecond,
		msPerHashMedian: spreadOf(elapsedMs).median / subject.n,
	};
}

function argon2Subject(label: string, params: Argon2Params, n: number): Subject {
	return {
		scheme: label,
		parameters: `m=${params.memoryCost} KiB (${Math.round(params.memoryCost / 1024)} MiB), t=${params.timeCost}, p=1, random 16-byte salt`,
		n,
		hashOnce: () => Bun.password.hashSync(SHARED_FAKE_PASSWORD, { algorithm: "argon2id", ...params }),
	};
}

// EN: A stronger configuration, only to show that the cost of Argon2id is a dial, not a constant.
// PT: Uma configuração mais forte, só para mostrar que o custo do Argon2id é um botão, não uma
//     constante.
// ES: Una configuración más fuerte, solo para mostrar que el costo de Argon2id es una perilla, no una
//     constante.
const STRONGER_ARGON2: Argon2Params = { memoryCost: 65536, timeCost: 3 };

const FIXED_SALT = Buffer.from("00112233445566778899aabbccddeeff", "hex");

export const SUBJECTS: readonly Subject[] = [
	{
		scheme: "plain text",
		parameters: "no hash at all",
		n: 200_000,
		hashOnce: () => storePlainText(SHARED_FAKE_PASSWORD),
	},
	{ scheme: "MD5", parameters: "unsalted, node:crypto", n: 200_000, hashOnce: () => storeMd5(SHARED_FAKE_PASSWORD) },
	{
		scheme: "salted SHA-256",
		parameters: "16-byte salt, one round, node:crypto",
		n: 200_000,
		hashOnce: () => storeSaltedSha256(SHARED_FAKE_PASSWORD, FIXED_SALT),
	},
	argon2Subject("Argon2id (lab policy)", ARGON2_PARAMS, 10),
	argon2Subject("Argon2id (stronger)", STRONGER_ARGON2, 2),
];

function withComparison(rows: Omit<Row, "timesSlowerThanMd5">[]): Row[] {
	const md5 = rows.find((row) => row.scheme === "MD5")?.hashesPerSecond.median ?? Number.NaN;
	return rows.map((row) => ({ ...row, timesSlowerThanMd5: md5 / row.hashesPerSecond.median }));
}

function rate(value: number): string {
	return value >= 1000
		? Math.round(value).toLocaleString("en-US")
		: value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function duration(ms: number): string {
	if (ms >= 1) return `${ms.toFixed(1)} ms`;
	if (ms >= 0.001) return `${(ms * 1000).toFixed(2)} µs`;
	return `${(ms * 1_000_000).toFixed(0)} ns`;
}

// EN: Below one hundredth of MD5 there is no hashing work left to compare (the plain text row).
// PT: Abaixo de um centésimo do MD5 não sobra trabalho de hash para comparar (a linha de texto puro).
// ES: Por debajo de una centésima parte de MD5 no queda trabajo de hash que comparar (la fila de texto plano).
function factor(times: number): string {
	if (times < 0.01) return "none (not a hash)";
	if (times >= 10) return `${Math.round(times).toLocaleString("en-US")}x`;
	return `${times.toFixed(2)}x`;
}

export function renderTable(rows: readonly Row[]): string {
	const lines = [
		"| Scheme | Parameters | Hashes per run | Hashes/s (median) | Hashes/s (min) | Hashes/s (max) | Time per hash (median) | Cost of one hash against MD5 |",
		"| --- | --- | --- | --- | --- | --- | --- | --- |",
	];
	for (const row of rows) {
		lines.push(
			`| ${row.scheme} | ${row.parameters} | ${row.n.toLocaleString("en-US")} | **${rate(row.hashesPerSecond.median)}** | ${rate(row.hashesPerSecond.min)} | ${rate(row.hashesPerSecond.max)} | ${duration(row.msPerHashMedian)} | ${factor(row.timesSlowerThanMd5)} |`,
		);
	}
	return lines.join("\n");
}

export interface Environment {
	generatedAt: string;
	command: string;
	machine: string;
	cpuModel: string;
	logicalCores: number;
	memoryGiB: number;
	os: string;
	runtime: string;
	hashLibraries: string;
	argon2: string;
	input: string;
	runs: number;
	warmupRuns: number;
	threads: string;
	peakMemoryKb: number;
}

function environment(runs: number, warmupRuns: number): Environment {
	const cpuModel = cpus()[0]?.model.trim() ?? "unknown CPU";
	const logicalCores = cpus().length;
	const memoryGiB = Math.round((totalmem() / 1024 ** 3) * 10) / 10;
	return {
		generatedAt: new Date().toISOString(),
		command: process.env.BENCH_COMMAND ?? "bun run bench",
		machine: `${cpuModel}, ${logicalCores} logical cores, ${memoryGiB} GiB visible to the container`,
		cpuModel,
		logicalCores,
		memoryGiB,
		os: `${type()} ${release()} (${process.arch})`,
		runtime: `Bun ${Bun.version} (oven/bun:${Bun.version}), TypeScript run directly by Bun`,
		hashLibraries: "MD5 and SHA-256 from node:crypto, Argon2id from the built-in Bun.password",
		argon2: `lab policy: Argon2id v=19, m=${ARGON2_PARAMS.memoryCost} KiB, t=${ARGON2_PARAMS.timeCost}, p=1; stronger row: m=${STRONGER_ARGON2.memoryCost} KiB, t=${STRONGER_ARGON2.timeCost}, p=1`,
		input: `one fake password ("${SHARED_FAKE_PASSWORD}"), hashed repeatedly`,
		runs,
		warmupRuns,
		threads: "one thread, one hash at a time",
		peakMemoryKb: Math.round(process.resourceUsage().maxRSS),
	};
}

function renderMarkdown(env: Environment, rows: readonly Row[]): string {
	return `# Password storage: hashes per second

Generated at ${env.generatedAt} by \`${env.command}\`.

Workload: ${env.input}. Each scheme ran ${env.warmupRuns} warm-up run (discarded) and ${env.runs} measured runs on ${env.threads}. A run computes the number of hashes in the "Hashes per run" column, and its rate is that number divided by the elapsed time. The table shows the median, the slowest and the fastest of the ${env.runs} runs.

${renderTable(rows)}

- **Hashes/s** is how many passwords this machine turns into a stored value per second. Read it from the side of somebody who stole the table: it is also how many guesses per second one CPU core could test. Lower is better for the defender.
- **Cost of one hash against MD5** is the MD5 median rate divided by the rate of the row.
- "plain text" is not a hash: the row only shows that storing the password as it is costs nothing, and reading it back costs nothing either. Its rate is the speed of an empty loop, so its spread means nothing.
- This is a measurement of the functions. Nothing here compares against a stored hash or tries candidate passwords.

## Environment

| Item | Value |
| --- | --- |
| Machine | ${env.machine} |
| Operating system (container) | ${env.os} |
| Runtime | ${env.runtime} |
| Hash functions | ${env.hashLibraries} |
| Argon2 parameters | ${env.argon2} |
| Runs | ${env.runs} measured, ${env.warmupRuns} warm-up discarded |
| Concurrency | ${env.threads} |
| Peak memory of the benchmark process | ${env.peakMemoryKb.toLocaleString("en-US")} KiB |
| Command | \`${env.command}\` |

Numbers depend on the machine. Compare the schemes with each other, not with another computer.
`;
}

if (import.meta.main) {
	const RUNS = 5;
	const WARMUP_RUNS = 1;
	const rows = withComparison(SUBJECTS.map((subject) => measure(subject, RUNS, WARMUP_RUNS)));
	const env = environment(RUNS, WARMUP_RUNS);

	console.log(`passwords-sessions-lab: hashes per second (${env.machine})`);
	console.log(`${RUNS} measured runs per scheme, ${WARMUP_RUNS} warm-up run discarded, ${env.threads}`);
	console.log();
	console.log(renderTable(rows));

	const outDir = process.env.BENCH_OUT_DIR ?? "results";
	mkdirSync(outDir, { recursive: true });
	writeFileSync(join(outDir, "results.md"), renderMarkdown(env, rows));
	writeFileSync(join(outDir, "results.json"), `${JSON.stringify({ environment: env, rows }, null, "\t")}\n`);
	console.log();
	console.log(`written: ${join(outDir, "results.md")}, ${join(outDir, "results.json")}`);
}
