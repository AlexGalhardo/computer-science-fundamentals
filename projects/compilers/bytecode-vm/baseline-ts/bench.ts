// EN: `bun run baseline-ts/bench.ts <program.mini> <n>` runs a benchmark program on the
//     tree-walking interpreter of MP-COMP-2 (copied into `src/`). It mirrors the `bench` command
//     of the Rust binary: `let n = <n>;` goes in front of the program, reading and parsing stay
//     outside the timed section, and the last line is the JSON of the benchmark contract.
// PT: `bun run baseline-ts/bench.ts <programa.mini> <n>` executa um programa de benchmark no
//     interpretador de árvore do MP-COMP-2 (copiado em `src/`). Ele espelha o comando `bench` do
//     binário em Rust: `let n = <n>;` vai na frente do programa, leitura e análise ficam fora do
//     trecho cronometrado, e a última linha é o JSON do contrato de benchmark.
// ES: `bun run baseline-ts/bench.ts <programa.mini> <n>` ejecuta un programa de benchmark en el
//     intérprete de árbol del MP-COMP-2 (copiado en `src/`). Refleja el comando `bench` del
//     binario en Rust: `let n = <n>;` va delante del programa, la lectura y el análisis quedan
//     fuera del tramo cronometrado, y la última línea es el JSON del contrato de benchmark.

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { parse } from "./src/frontend/parser";
import { formatProblem } from "./src/frontend/token";
import { Interpreter } from "./src/interpreter";

const [path, size] = process.argv.slice(2);
const n = Number(size);
if (path === undefined || !Number.isInteger(n) || n < 0) {
	console.error("usage: bun run baseline-ts/bench.ts <program.mini> <n>");
	process.exit(2);
}

const { program, errors } = parse(`let n = ${n};\n${readFileSync(path, "utf8")}`);
if (errors.length > 0) {
	console.error(errors.map(formatProblem).join("\n"));
	process.exit(1);
}

const output: string[] = [];
const interpreter = new Interpreter((line) => {
	output.push(line);
});
const started = performance.now();
interpreter.run(program);
const elapsedMs = performance.now() - started;

console.log(
	JSON.stringify({
		n,
		elapsedMs: Number(elapsedMs.toFixed(3)),
		// On Linux, maxRSS is the peak resident set size in kibibytes.
		memoryKb: process.resourceUsage().maxRSS,
		language: "ts",
		implementation: basename(path, ".mini"),
		checksum: output.join(","),
	}),
);
