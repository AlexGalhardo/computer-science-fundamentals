// EN: Collector of the binary-size workload (`bun run binary-size`). For the same small
//     program (the one of `cpu-single`) it measures two sizes on disk, in bytes:
//     - artifact: what the build produces from your code (an executable, a jar, a bundle);
//     - runtime: what else must be on the machine for that artifact to run, not counting the
//       operating system and its C library (glibc), which every language here relies on.
//     The difference between the two columns is the lesson: a small artifact can need a large
//     runtime. Sizes are exact, not sampled, so there is no spread to report.
// PT: Coletor da carga de tamanho do binário (`bun run binary-size`). Para o mesmo programa
//     pequeno (o do `cpu-single`) ele mede dois tamanhos em disco, em bytes:
//     - artefato: o que o build produz a partir do seu código (um executável, um jar, um bundle);
//     - runtime: o que mais precisa estar na máquina para o artefato rodar, sem contar o
//       sistema operacional e sua biblioteca C (glibc), de que todas as linguagens aqui dependem.
//     A diferença entre as duas colunas é a lição: um artefato pequeno pode precisar de um
//     runtime grande. Os tamanhos são exatos, não amostrados, então não há dispersão a informar.
// ES: Recolector de la carga de tamaño del binario (`bun run binary-size`). Para el mismo programa
//     pequeño (el de `cpu-single`) mide dos tamaños en disco, en bytes:
//     - artefacto: lo que el build produce a partir de tu código (un ejecutable, un jar, un bundle);
//     - runtime: lo que más tiene que estar en la máquina para que el artefacto corra, sin contar
//       el sistema operativo y su biblioteca C (glibc), de la que dependen todos los lenguajes aquí.
//     La diferencia entre las dos columnas es la lección: un artefacto pequeño puede necesitar un
//     runtime grande. Los tamaños son exactos, no muestreados, así que no hay dispersión que informar.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { benchmarksDir, buildImage, LANGUAGES, type Language, machineInfo, mustRun, readConfig } from "../scripts/lib";

interface Recipe {
	artifact: string;
	runtime: string;
	notes: string;
	/** Shell script that prints "artifact=<bytes>" and "runtime=<bytes>". */
	script: string;
}

// EN: Sums the shared libraries the executable loads, leaving out the ones that belong to
//     glibc (libc, libm, the loader) and the kernel's virtual library.
// PT: Soma as bibliotecas compartilhadas que o executável carrega, deixando de fora as que
//     pertencem à glibc (libc, libm, o carregador) e a biblioteca virtual do kernel.
// ES: Suma las bibliotecas compartidas que carga el ejecutable, dejando fuera las que pertenecen
//     a glibc (libc, libm, el cargador) y la biblioteca virtual del kernel.
const SHARED_LIBS = `ldd /opt/bench/main 2>/dev/null | awk '$3 ~ /^\\// {print $3}' | grep -Ev '/(libc|libm|libdl|libpthread|librt)\\.so' | xargs -r -n1 readlink -f | xargs -r stat -c %s | awk '{s+=$1} END {print s+0}'`;

const RECIPES: Record<Language, Recipe> = {
	cpp: {
		artifact: "executable, g++ -O2, dynamically linked, not stripped",
		runtime: "libstdc++ and libgcc_s shared libraries",
		notes: "Linking statically (-static-libstdc++ -static-libgcc) moves the runtime into the executable.",
		script: `echo artifact=$(stat -c %s /opt/bench/main); echo runtime=$(${SHARED_LIBS})`,
	},
	rust: {
		artifact: "executable, cargo build --release, standard library linked in, not stripped",
		runtime: "libgcc_s shared library",
		notes: "The Rust standard library is inside the executable. Only the unwinding helper of GCC is shared.",
		script: `echo artifact=$(stat -c %s /opt/bench/main); echo runtime=$(${SHARED_LIBS})`,
	},
	go: {
		artifact: "executable, CGO_ENABLED=0 go build, statically linked, not stripped",
		runtime: "nothing",
		notes: "The Go runtime (scheduler and garbage collector) is inside the executable, which needs no shared library at all.",
		script: "echo artifact=$(stat -c %s /opt/bench/main); echo runtime=0",
	},
	java: {
		artifact: "jar with the compiled classes",
		runtime: "smallest Java runtime made by jlink (module java.base only, compressed)",
		notes: "The full JDK image is much larger. jlink builds a runtime with only the modules the program needs.",
		script: "jar --create --file /tmp/app.jar --main-class Main -C /opt/bench . && jlink --add-modules java.base --strip-debug --no-header-files --no-man-pages --compress zip-6 --output /tmp/jre && echo artifact=$(stat -c %s /tmp/app.jar) && echo runtime=$(du -sb /tmp/jre | cut -f1)",
	},
	ts: {
		artifact: "one JavaScript file made by bun build --minify",
		runtime: "the bun executable",
		notes: "`bun build --compile` glues both into one executable of about the sum of the two.",
		script: "bun build /opt/bench/main.ts --target bun --minify --outfile /tmp/out/main.js >/dev/null && echo artifact=$(stat -c %s /tmp/out/main.js) && echo runtime=$(stat -c %s $(readlink -f $(which bun)))",
	},
	elixir: {
		artifact: "the application's compiled modules inside a mix release",
		runtime: "the rest of the release: the Erlang runtime (ERTS) and the Erlang and Elixir libraries",
		notes: "A mix release is self-contained: the target machine needs neither Erlang nor Elixir installed.",
		script: "cd /tmp && mix new app >/dev/null && cp /src/main.ex app/lib/main.ex && cd app && MIX_ENV=prod mix release --quiet >/dev/null 2>&1 && total=$(du -sb _build/prod/rel/app | cut -f1) && own=$(du -sb _build/prod/rel/app/lib/app-0.1.0 | cut -f1) && echo artifact=$own && echo runtime=$((total - own))",
	},
	python: {
		artifact: "the source file (Python ships source, bytecode is made on the first run)",
		runtime: "the CPython interpreter, its shared library and the standard library",
		notes: "Tools such as PyInstaller pack the interpreter with the program, giving one file of about the size of the runtime.",
		script: "echo artifact=$(stat -c %s /opt/bench/main.py); echo runtime=$(du -sbc /usr/local/lib/python3.14 /usr/local/lib/libpython3.14.so.1.0 $(readlink -f /usr/local/bin/python3) | tail -1 | cut -f1)",
	},
};

const config = readConfig("cpu-single");
const rows = [];
const runtimes: Record<string, string> = {};
for (const language of LANGUAGES) {
	const target = config.targets.find((item) => item.language === language);
	if (target === undefined) {
		throw new Error(`cpu-single has no target for ${language}`);
	}
	const image = buildImage("cpu-single", target, config.project);
	const recipe = RECIPES[language];
	const output = mustRun([
		"docker",
		"run",
		"--rm",
		"--network",
		"none",
		"--entrypoint",
		"sh",
		image,
		"-c",
		recipe.script,
	]);
	const read = (key: string): number => {
		const match = new RegExp(`^${key}=(\\d+)$`, "m").exec(output);
		if (match?.[1] === undefined) {
			throw new Error(`${language}: no ${key} in output:\n${output}`);
		}
		return Number(match[1]);
	};
	const version = mustRun([
		"docker",
		"run",
		"--rm",
		"--network",
		"none",
		"--entrypoint",
		"sh",
		image,
		"-c",
		target.version,
	]);
	runtimes[language] = `${version.trim().split("\n")[0]} (${image})`;
	const row = {
		language,
		implementation: "cpu-single",
		variant: "default",
		n: 1,
		artifactBytes: read("artifact"),
		runtimeBytes: read("runtime"),
		artifact: recipe.artifact,
		runtime: recipe.runtime,
		notes: recipe.notes,
		command: recipe.script,
	};
	console.log(`  ${language}: artifact ${row.artifactBytes} B, runtime ${row.runtimeBytes} B`);
	rows.push(row);
}

const kib = (bytes: number): string => (bytes / 1024).toLocaleString("en-US", { maximumFractionDigits: 1 });
const report = {
	project: "binary-size",
	generatedAt: new Date().toISOString(),
	machine: machineInfo(),
	runtimes,
	runs: 1,
	warmup: 0,
	rows,
};
const outDir = join(benchmarksDir, "binary-size", "results");
mkdirSync(outDir, { recursive: true });
const json = JSON.stringify(report, null, "\t");
writeFileSync(join(outDir, "results.json"), `${json}\n`);
writeFileSync(join(outDir, "results.js"), `window.BENCH_RESULTS = ${json};\n`);
writeFileSync(
	join(outDir, "results.md"),
	[
		"# Benchmark: binary-size",
		"",
		`Generated at ${report.generatedAt}. Sizes on disk of the \`cpu-single\` program, in KiB. Sizes are exact, so there is no spread.`,
		"",
		"## Toolchains",
		"",
		...Object.entries(runtimes).map(([key, value]) => `- ${key}: ${value}`),
		"",
		"## Results",
		"",
		"`runtime` is what must be present besides the artifact, not counting the operating system and glibc.",
		"",
		"| Language | artifact (KiB) | runtime (KiB) | total (KiB) | What the artifact is | What the runtime is |",
		"| --- | ---: | ---: | ---: | --- | --- |",
		...rows.map(
			(row) =>
				`| ${row.language} | ${kib(row.artifactBytes)} | ${kib(row.runtimeBytes)} | ${kib(row.artifactBytes + row.runtimeBytes)} | ${row.artifact} | ${row.runtime} |`,
		),
		"",
		"## Notes",
		"",
		...rows.map((row) => `- ${row.language}: ${row.notes}`),
		"",
	].join("\n"),
);
console.log(`${rows.length} rows written to ${outDir}`);
