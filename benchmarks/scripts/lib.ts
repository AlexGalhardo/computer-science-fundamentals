// EN: Helpers shared by the scripts and tests of the benchmark suite: where the workloads
//     live, how their images are named and how to run a program inside one of them.
// PT: Funções compartilhadas pelos scripts e testes da suíte de benchmark: onde ficam as
//     cargas de trabalho, como as imagens são nomeadas e como rodar um programa dentro delas.
// ES: Funciones compartidas por los scripts y pruebas de la suite de benchmark: dónde están las
//     cargas de trabajo, cómo se nombran las imágenes y cómo ejecutar un programa dentro de ellas.

import { readFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";

export const benchmarksDir = resolve(import.meta.dir, "..");

/** Workloads measured by the shared runner of `tools/bench`. The HTTP one has its own collector. */
export const RUNNER_WORKLOADS = ["cpu-single", "parallelism", "concurrency", "memory"] as const;
export type RunnerWorkload = (typeof RUNNER_WORKLOADS)[number];

export const LANGUAGES = ["cpp", "rust", "go", "java", "ts", "elixir", "python"] as const;
export type Language = (typeof LANGUAGES)[number];

export interface Target {
	language: string;
	dockerfile: string;
	version: string;
	implementations: string[];
	command: string;
}

export interface BenchConfig {
	project: string;
	runs: number;
	warmup: number;
	sizes: number[];
	variants?: string[];
	maxN?: Record<string, number>;
	targets: Target[];
}

export function readConfig(workload: string): BenchConfig {
	return JSON.parse(readFileSync(join(benchmarksDir, workload, "bench.json"), "utf8")) as BenchConfig;
}

// EN: Same name the runner gives to an image built from a Dockerfile, so an image built here
//     is reused by `bun run bench` and by the tests.
// PT: Mesmo nome que o runner dá a uma imagem construída de um Dockerfile, então uma imagem
//     construída aqui é reaproveitada pelo `bun run bench` e pelos testes.
// ES: Mismo nombre que el runner le da a una imagen construida desde un Dockerfile, así una imagen
//     construida aquí la reutilizan `bun run bench` y las pruebas.
export function imageTag(project: string, language: string): string {
	return `sef-bench-${project}-${language}:local`;
}

export interface Finished {
	exitCode: number;
	stdout: string;
	stderr: string;
}

export function run(command: string[], options: { cwd?: string } = {}): Finished {
	const result = Bun.spawnSync(command, { cwd: options.cwd, stdout: "pipe", stderr: "pipe" });
	return { exitCode: result.exitCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() };
}

export function mustRun(command: string[], options: { cwd?: string } = {}): string {
	const result = run(command, options);
	if (result.exitCode !== 0) {
		throw new Error(`${command.join(" ")}\n${result.stderr}${result.stdout}`);
	}
	return result.stdout;
}

export function buildImage(workload: string, target: Target, project: string): string {
	const tag = imageTag(project, target.language);
	mustRun(["docker", "build", "-q", "-f", target.dockerfile, "-t", tag, "."], { cwd: join(benchmarksDir, workload) });
	return tag;
}

export interface ContractLine {
	n: number;
	elapsedMs: number;
	memoryKb: number;
	language: string;
	implementation: string;
	checksum?: string;
}

// EN: Runs one program the way the runner does (no network) and reads the contract line, which
//     is the last non-empty line of the output.
// PT: Roda um programa do jeito que o runner roda (sem rede) e lê a linha do contrato, que é a
//     última linha não vazia da saída.
// ES: Ejecuta un programa como lo ejecuta el runner (sin red) y lee la línea del contrato, que es
//     la última línea no vacía de la salida.
export function runProgram(image: string, command: string): ContractLine {
	const output = mustRun(["docker", "run", "--rm", "--network", "none", "--entrypoint", "sh", image, "-c", command]);
	const line = output
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.at(-1);
	if (line === undefined) {
		throw new Error(`${image}: "${command}" printed nothing`);
	}
	return JSON.parse(line) as ContractLine;
}

export interface Spread {
	mean: number;
	stddev: number;
	min: number;
	max: number;
}

// EN: Mean, sample standard deviation and range of a few repetitions. One number alone hides
//     how much the measurement moves from run to run.
// PT: Média, desvio padrão amostral e intervalo de algumas repetições. Um número sozinho
//     esconde o quanto a medição varia de uma execução para outra.
// ES: Promedio, desviación estándar muestral y rango de algunas repeticiones. Un número solo
//     esconde cuánto varía la medición de una ejecución a otra.
export function spread(values: number[]): Spread {
	const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
	const variance =
		values.length > 1 ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1) : 0;
	return { mean, stddev: Math.sqrt(variance), min: Math.min(...values), max: Math.max(...values) };
}

// EN: Same fields the shared runner records, so every results file describes the machine alike.
// PT: Os mesmos campos que o runner compartilhado registra, para que todo arquivo de resultados
//     descreva a máquina do mesmo jeito.
// ES: Los mismos campos que registra el runner compartido, para que todo archivo de resultados
//     describa la máquina de la misma forma.
export function machineInfo(): Record<string, string> {
	const format = "{{.OperatingSystem}}|{{.KernelVersion}}|{{.NCPU}}|{{.MemTotal}}|{{.ServerVersion}}";
	const info = mustRun(["docker", "info", "--format", format]).trim().split("|");
	return {
		"host CPU": cpus()[0]?.model.trim() ?? "unknown",
		"host logical cores": String(cpus().length),
		"host memory": `${(totalmem() / 1024 ** 3).toFixed(1)} GiB`,
		"host OS": `${process.platform} ${process.arch}`,
		"Docker engine": `${info[4]} on ${info[0]} (kernel ${info[1]})`,
		"Docker CPUs": info[2] ?? "unknown",
		"Docker memory": `${(Number(info[3]) / 1024 ** 3).toFixed(1)} GiB`,
	};
}

export function fill(template: string, implementation: string, n: number, variant = "default"): string {
	return template
		.replaceAll("{implementation}", implementation)
		.replaceAll("{variant}", variant)
		.replaceAll("{n}", String(n));
}
