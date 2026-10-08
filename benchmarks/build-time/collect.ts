// EN: Collector of the build workload (`bun run build-time`). It measures how long each
//     language takes to turn the same small program (the one of `cpu-single`) into what it
//     runs. "Cold" starts from nothing: no previous output and no compiler cache. "Warm"
//     changes one line of the source and builds again, which is what a programmer does all
//     day. The shared runner cannot do this (it has no step that runs before each timing), so
//     this script calls hyperfine itself, with `--prepare`.
//     Languages without a compile step are not given an invented number: the row says what is
//     really measured (bytecode compilation or bundling).
// PT: Coletor da carga de build (`bun run build-time`). Ele mede quanto tempo cada linguagem
//     leva para transformar o mesmo programa pequeno (o do `cpu-single`) naquilo que ela roda.
//     "Frio" parte do nada: sem saída anterior e sem cache do compilador. "Quente" muda uma
//     linha do fonte e constrói de novo, que é o que quem programa faz o dia todo. O runner
//     compartilhado não faz isso (ele não tem uma etapa que roda antes de cada medição), então
//     este script chama o hyperfine diretamente, com `--prepare`.
//     Linguagens sem etapa de compilação não ganham um número inventado: a linha diz o que é
//     realmente medido (compilação para bytecode ou empacotamento).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { benchmarksDir, LANGUAGES, type Language, machineInfo, mustRun } from "../scripts/lib";

const RUNS = Number(process.env.BUILD_RUNS ?? 5);
const HYPERFINE = "/opt/hyperfine/hyperfine";

interface Recipe {
	image: string;
	version: string;
	/** What the step really is, shown next to the number. */
	step: string;
	source: string;
	comment: string;
	build: string;
	/** Removes every output and every cache, so the next build starts from nothing. */
	clean: string;
}

const RECIPES: Record<Language, Recipe> = {
	cpp: {
		image: "gcc:16.2.0-trixie",
		version: "g++ -dumpfullversion",
		step: "compile-and-link",
		source: "main.cpp",
		comment: "//",
		build: "g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main",
		clean: "rm -f main",
	},
	rust: {
		image: "rust:1.99.0-slim-trixie",
		version: "rustc --version",
		step: "compile-and-link",
		source: "src/main.rs",
		comment: "//",
		build: "cargo build --release --locked --offline --quiet",
		clean: "rm -rf target",
	},
	go: {
		image: "golang:1.27.1-bookworm",
		version: "go version",
		step: "compile-and-link",
		source: "main.go",
		comment: "//",
		build: "go build -o main .",
		// EN: The Go build cache holds the compiled standard library too. A cold build pays for it.
		// PT: O cache de build do Go guarda também a biblioteca padrão compilada. Um build frio paga por ela.
		clean: "rm -f main && go clean -cache",
	},
	java: {
		image: "eclipse-temurin:25.0.4.1_1-jdk-noble",
		version: "javac --version",
		step: "compile-to-bytecode",
		source: "Main.java",
		comment: "//",
		build: "javac -d out Main.java",
		clean: "rm -rf out",
	},
	ts: {
		image: "oven/bun:1.4.2",
		version: "bun --version",
		step: "bundle-no-typecheck",
		source: "main.ts",
		comment: "//",
		build: "bun build main.ts --target bun --outfile out/main.js",
		clean: "rm -rf out",
	},
	elixir: {
		image: "elixir:1.20.4-otp-28-slim",
		version: "elixir --short-version",
		step: "compile-to-bytecode",
		source: "main.ex",
		comment: "#",
		build: "elixirc --ignore-module-conflict -o out main.ex",
		clean: "rm -rf out",
	},
	python: {
		image: "python:3.14.8-slim-trixie",
		version: "python --version",
		step: "bytecode-automatic",
		source: "main.py",
		comment: "#",
		build: "python -m py_compile main.py",
		clean: "rm -rf __pycache__",
	},
};

interface Summary {
	mean: number;
	stddev: number | null;
	min: number;
	max: number;
}

function measure(language: Language, recipe: Recipe, mode: "cold" | "warm"): { wall: Summary; cpu: Summary } {
	// EN: "Warm" appends a comment with a new number, a real edit that changes the file content.
	//     Touching the file would not do: Go, for one, compares content, not dates.
	// PT: O "quente" acrescenta um comentário com um número novo, uma edição real que muda o
	//     conteúdo do arquivo. Só tocar no arquivo não bastaria: o Go, por exemplo, compara
	//     conteúdo, não datas.
	const edit = `echo "${recipe.comment} edit $(date +%s%N)" >> ${recipe.source}`;
	const prepare = mode === "cold" ? recipe.clean : edit;
	// EN: The first build of the warm mode is not measured, and its output is silenced so that the
	//     only thing printed at the end is the JSON of hyperfine.
	// PT: O primeiro build do modo quente não é medido, e sua saída é silenciada para que a única
	//     coisa impressa no final seja o JSON do hyperfine.
	const setup = mode === "cold" ? "true" : `{ ${recipe.clean} && ${recipe.build}; } >/dev/null 2>&1`;
	const script = [
		"mkdir -p /tmp/work && cp -r /in/. /tmp/work && cd /tmp/work",
		setup,
		`${HYPERFINE} --style none --runs ${RUNS} --warmup 1 --prepare '${prepare}' --export-json /tmp/result.json '${recipe.build}' >/dev/null`,
		"cat /tmp/result.json",
	].join(" && ");
	const output = mustRun([
		"docker",
		"run",
		"--rm",
		"--network",
		"none",
		"-v",
		`${join(benchmarksDir, "cpu-single", language)}:/in:ro`,
		"-v",
		"sef-hyperfine:/opt/hyperfine:ro",
		"--entrypoint",
		"sh",
		recipe.image,
		"-c",
		script,
	]);
	const summary = (JSON.parse(output) as { results: { summary: { time_wall_clock: Summary; time_cpu: Summary } }[] })
		.results[0]?.summary;
	if (summary === undefined) {
		throw new Error(`${language}: hyperfine exported no result`);
	}
	return { wall: summary.time_wall_clock, cpu: summary.time_cpu };
}

const fixed = (value: number): string =>
	value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);

const rows = [];
const runtimes: Record<string, string> = {};
for (const language of LANGUAGES) {
	const recipe = RECIPES[language];
	const version = mustRun([
		"docker",
		"run",
		"--rm",
		"--network",
		"none",
		"--entrypoint",
		"sh",
		recipe.image,
		"-c",
		recipe.version,
	]);
	runtimes[language] = `${version.trim().split("\n")[0]} (${recipe.image})`;
	for (const mode of ["cold", "warm"] as const) {
		const { wall, cpu } = measure(language, recipe, mode);
		console.log(`  ${language} ${mode}: ${fixed(wall.mean * 1000)} ± ${fixed((wall.stddev ?? 0) * 1000)} ms`);
		rows.push({
			language,
			implementation: mode,
			variant: recipe.step,
			n: 1,
			meanMs: wall.mean * 1000,
			stddevMs: (wall.stddev ?? 0) * 1000,
			minMs: wall.min * 1000,
			maxMs: wall.max * 1000,
			cpuMs: cpu.mean * 1000,
			command: recipe.build,
			prepare: mode === "cold" ? recipe.clean : `append one comment line to ${recipe.source}`,
		});
	}
}

const report = {
	project: "build-time",
	generatedAt: new Date().toISOString(),
	machine: machineInfo(),
	runtimes,
	runs: RUNS,
	warmup: 1,
	rows,
};
const outDir = join(benchmarksDir, "build-time", "results");
mkdirSync(outDir, { recursive: true });
const json = JSON.stringify(report, null, "\t");
writeFileSync(join(outDir, "results.json"), `${json}\n`);
writeFileSync(join(outDir, "results.js"), `window.BENCH_RESULTS = ${json};\n`);
writeFileSync(
	join(outDir, "results.md"),
	[
		"# Benchmark: build",
		"",
		`Generated at ${report.generatedAt}. ${RUNS} runs per row after 1 warm-up run. The program is the one of \`cpu-single\`.`,
		"",
		"## Machine",
		"",
		...Object.entries(report.machine).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Toolchains",
		"",
		...Object.entries(runtimes).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Results",
		"",
		"`cold` removes every output and compiler cache before each run. `warm` appends one comment line to the source before each run. `step` says what the command really does.",
		"",
		"| Language | Mode | Step | time (ms) | range (ms) | CPU (ms) | Command | Before each run |",
		"| --- | --- | --- | ---: | ---: | ---: | --- | --- |",
		...rows.map(
			(row) =>
				`| ${row.language} | ${row.implementation} | ${row.variant} | ${fixed(row.meanMs)} ± ${fixed(row.stddevMs)} | ${fixed(row.minMs)} to ${fixed(row.maxMs)} | ${fixed(row.cpuMs)} | \`${row.command}\` | \`${row.prepare}\` |`,
		),
		"",
	].join("\n"),
);
console.log(`${rows.length} rows written to ${outDir}`);
