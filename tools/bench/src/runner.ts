// EN: The runner. For each target it starts a container of the language image, and inside it
//     hyperfine runs the command several times. Measuring inside the container keeps the cost
//     of starting Docker out of the numbers.
// PT: O runner. Para cada alvo ele sobe um contêiner da imagem da linguagem, e dentro dele o
//     hyperfine roda o comando várias vezes. Medir dentro do contêiner deixa o custo de subir o
//     Docker fora dos números.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";
import { z } from "zod";
import { type BenchCase, type BenchConfig, type BenchTarget, benchConfigSchema, expandCases } from "./config";
import { parseBenchOutput } from "./contract";
import { type BenchReport, type BenchRow, renderMarkdown, sortRows } from "./report";

const HYPERFINE_IMAGE = "sef-bench:local";
const HYPERFINE_VOLUME = "sef-hyperfine";

// EN: hyperfine 2 exports, per command, a summary of each metric it sampled: wall-clock time,
//     CPU time (user plus system) and peak resident memory.
// PT: O hyperfine 2 exporta, por comando, um resumo de cada métrica que amostrou: tempo de
//     relógio, tempo de CPU (usuário mais sistema) e pico de memória residente.
const metric = z.object({ mean: z.number(), stddev: z.number().nullable(), min: z.number(), max: z.number() });
const hyperfineExportSchema = z.object({
	results: z
		.array(
			z.object({
				summary: z.object({ time_wall_clock: metric, time_cpu: metric, memory_peak_resident: metric }),
			}),
		)
		.min(1),
});

function docker(args: string[], options: { cwd?: string } = {}): string {
	const result = Bun.spawnSync(["docker", ...args], { cwd: options.cwd, stdout: "pipe", stderr: "pipe" });
	if (result.exitCode !== 0) {
		throw new Error(`docker ${args.join(" ")}\n${result.stderr.toString()}`);
	}
	return result.stdout.toString();
}

export function loadConfig(projectDir: string): BenchConfig {
	const raw: unknown = JSON.parse(readFileSync(join(projectDir, "bench.json"), "utf8"));
	return benchConfigSchema.parse(raw);
}

// EN: hyperfine is a static binary. It is copied once into a named volume, and that volume is
//     mounted read-only in every language container, so no language image needs to install it.
// PT: O hyperfine é um binário estático. Ele é copiado uma vez para um volume nomeado, e esse
//     volume é montado como somente leitura em todo contêiner de linguagem, então nenhuma
//     imagem de linguagem precisa instalá-lo.
function prepareHyperfine(repoRoot: string): void {
	docker(["build", "-q", "-f", "docker/bench.Dockerfile", "-t", HYPERFINE_IMAGE, "docker"], { cwd: repoRoot });
	docker(["run", "--rm", "-v", `${HYPERFINE_VOLUME}:/opt/hyperfine`, HYPERFINE_IMAGE, "--version"]);
}

function imageOf(target: BenchTarget, config: BenchConfig, projectDir: string): string {
	if (target.dockerfile !== undefined) {
		const tag = `sef-bench-${config.project}-${target.language}:local`;
		docker(["build", "-q", "-f", target.dockerfile, "-t", tag, "."], { cwd: projectDir });
		return tag;
	}
	if (target.image === undefined) {
		throw new Error(`target ${target.language}: set "image" or "dockerfile"`);
	}
	return target.image;
}

// EN: `--network none`: a benchmark needs no network, and without one it cannot reach anything
//     outside the machine by accident.
// PT: `--network none`: um benchmark não precisa de rede, e sem ela não alcança nada fora da
//     máquina por acidente.
function inContainer(image: string, projectDir: string, script: string): string {
	return docker([
		"run",
		"--rm",
		"--network",
		"none",
		"-v",
		`${projectDir}:/app`,
		"-v",
		`${HYPERFINE_VOLUME}:/opt/hyperfine:ro`,
		"-w",
		"/app",
		"--entrypoint",
		"sh",
		image,
		"-c",
		script,
	]);
}

function measure(image: string, projectDir: string, config: BenchConfig, item: BenchCase): BenchRow {
	const exportFile = ".bench/hyperfine.json";
	// EN: One container does both jobs: hyperfine times the whole process, then the program
	//     runs once more to print its own contract line (measured section and memory).
	// PT: Um contêiner faz os dois trabalhos: o hyperfine mede o processo inteiro, depois o
	//     programa roda mais uma vez para imprimir a própria linha do contrato (trecho medido e memória).
	const quoted = item.command.replaceAll("'", "'\\''");
	const hyperfine = `/opt/hyperfine/hyperfine --style none --runs ${config.runs} --warmup ${config.warmup} --export-json ${exportFile} '${quoted}' >/dev/null`;
	const output = inContainer(image, projectDir, `${hyperfine} && ${item.command}`);
	const result = parseBenchOutput(output);
	const exported: unknown = JSON.parse(readFileSync(join(projectDir, exportFile), "utf8"));
	const summary = hyperfineExportSchema.parse(exported).results[0]?.summary;
	if (summary === undefined) {
		throw new Error("hyperfine exported no result");
	}
	const timing = summary.time_wall_clock;
	return {
		language: item.language,
		implementation: item.implementation,
		variant: item.variant,
		n: item.n,
		meanMs: timing.mean * 1000,
		stddevMs: (timing.stddev ?? 0) * 1000,
		minMs: timing.min * 1000,
		maxMs: timing.max * 1000,
		cpuMs: summary.time_cpu.mean * 1000,
		peakMemoryKb: summary.memory_peak_resident.max / 1024,
		elapsedMs: result.elapsedMs,
		memoryKb: result.memoryKb,
		checksum: result.checksum,
		command: item.command,
	};
}

function machineInfo(): Record<string, string> {
	const format = "{{.OperatingSystem}}|{{.KernelVersion}}|{{.NCPU}}|{{.MemTotal}}|{{.ServerVersion}}";
	const info = docker(["info", "--format", format]).trim().split("|");
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

export interface RunOptions {
	projectDir: string;
	repoRoot: string;
	log?: (message: string) => void;
}

export function runBenchmark(options: RunOptions): BenchReport {
	const projectDir = resolve(options.projectDir);
	const log = options.log ?? (() => {});
	const config = loadConfig(projectDir);
	prepareHyperfine(options.repoRoot);
	mkdirSync(join(projectDir, ".bench"), { recursive: true });

	const rows: BenchRow[] = [];
	const runtimes: Record<string, string> = {};
	for (const target of config.targets) {
		const image = imageOf(target, config, projectDir);
		const version = inContainer(image, projectDir, target.version).trim().split("\n")[0] ?? "unknown";
		runtimes[target.language] = `${version} (${image})`;
		if (target.build !== undefined) {
			log(`${target.language}: ${target.build}`);
			inContainer(image, projectDir, target.build);
		}
		for (const item of expandCases(config, target)) {
			log(`${item.language} ${item.implementation} ${item.variant} n=${item.n}`);
			rows.push(measure(image, projectDir, config, item));
		}
	}
	rmSync(join(projectDir, ".bench"), { recursive: true, force: true });

	const report: BenchReport = {
		project: config.project,
		generatedAt: new Date().toISOString(),
		machine: machineInfo(),
		runtimes,
		runs: config.runs,
		warmup: config.warmup,
		rows: sortRows(rows),
	};
	const outDir = join(projectDir, "results");
	mkdirSync(outDir, { recursive: true });
	const json = JSON.stringify(report, null, "\t");
	writeFileSync(join(outDir, "results.json"), `${json}\n`);
	writeFileSync(join(outDir, "results.md"), renderMarkdown(report));
	// EN: A page opened from disk (file://) cannot fetch a JSON file, so the same data is also
	//     written as a script that the dashboard loads with a plain <script> tag.
	// PT: Uma página aberta do disco (file://) não consegue buscar um arquivo JSON, então os
	//     mesmos dados também são escritos como um script que o dashboard carrega com <script>.
	writeFileSync(join(outDir, "results.js"), `window.BENCH_RESULTS = ${json};\n`);
	return report;
}
