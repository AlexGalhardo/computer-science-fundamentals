// EN: `bun run ts/src/check-results.ts` reads `results/results.json` and checks the two claims
//     the benchmark makes: (1) for the same input file, every algorithm in every language
//     printed the same checksum, so they all produced the same sorted sequence; (2) when n
//     doubles, merge sort takes less than 2.5 times longer, which is what O(n log n) predicts
//     (about 2.1) and what O(n²) contradicts (about 4).
// PT: `bun run ts/src/check-results.ts` lê `results/results.json` e confere as duas afirmações
//     que o benchmark faz: (1) para o mesmo arquivo de entrada, todo algoritmo em toda
//     linguagem imprimiu o mesmo checksum, então todos produziram a mesma sequência ordenada;
//     (2) quando n dobra, o merge sort leva menos de 2,5 vezes mais tempo, que é o que
//     O(n log n) prevê (cerca de 2,1) e o que O(n²) contradiz (cerca de 4).
// ES: `bun run ts/src/check-results.ts` lee `results/results.json` y comprueba las dos afirmaciones
//     que hace el benchmark: (1) para el mismo archivo de entrada, todo algoritmo en todo
//     lenguaje imprimió el mismo checksum, así que todos produjeron la misma secuencia ordenada;
//     (2) cuando n se duplica, el merge sort tarda menos de 2.5 veces más, que es lo que
//     O(n log n) predice (cerca de 2.1) y lo que O(n²) contradice (cerca de 4).

import { readFileSync } from "node:fs";

interface Row {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	elapsedMs: number;
	checksum: string;
}

const DOUBLING_LIMIT = 2.5;
const GC_LANGUAGE_LIMIT = 4;
const MIN_MEASURABLE_MS = 1;

// EN: The results file is external input too, so its shape is checked before use.
// PT: O arquivo de resultados também é entrada externa, então seu formato é conferido antes do uso.
// ES: El archivo de resultados también es entrada externa, así que su formato se comprueba antes de usarlo.
function isRow(value: unknown): value is Row {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const row = value as Record<string, unknown>;
	return (
		typeof row.language === "string" &&
		typeof row.implementation === "string" &&
		typeof row.variant === "string" &&
		typeof row.n === "number" &&
		typeof row.elapsedMs === "number" &&
		typeof row.checksum === "string"
	);
}

function loadRows(path: string): Row[] {
	const report: unknown = JSON.parse(readFileSync(path, "utf8"));
	const rows = typeof report === "object" && report !== null ? (report as { rows?: unknown }).rows : undefined;
	if (!Array.isArray(rows) || rows.length === 0 || !rows.every(isRow)) {
		throw new Error(`${path}: not a benchmark report with checksums`);
	}
	return rows;
}

const rows = loadRows(process.argv[2] ?? "results/results.json");
const problems: string[] = [];

const checksums = new Map<string, Set<string>>();
for (const row of rows) {
	const key = `${row.variant}-${row.n}`;
	checksums.set(key, (checksums.get(key) ?? new Set()).add(row.checksum));
}
for (const [input, found] of checksums) {
	if (found.size !== 1) {
		problems.push(`${input}: ${found.size} different checksums (${[...found].join(", ")})`);
	}
}

const languages = new Set(rows.map((row) => row.language));
let ratios = 0;
let worst = 0;
for (const small of rows.filter((row) => row.implementation === "merge")) {
	const large = rows.find(
		(row) =>
			row.implementation === "merge" &&
			row.language === small.language &&
			row.variant === small.variant &&
			row.n === small.n * 2,
	);
	if (large === undefined) {
		continue;
	}
	const ratio = large.elapsedMs / small.elapsedMs;
	const label = `merge ${small.language} ${small.variant} n=${small.n} -> ${large.n}`;
	// EN: A sort that takes less than a millisecond is too short to time: the ratio of two such
	//     numbers is mostly clock noise, so those pairs are shown but not judged.
	// PT: Uma ordenação que leva menos de um milissegundo é curta demais para cronometrar: a
	//     razão entre dois números assim é quase só ruído do relógio, então esses pares são
	//     mostrados, mas não julgados.
	// ES: Una ordenación que tarda menos de un milisegundo es demasiado corta para cronometrar: la
	//     razón entre dos números así es casi solo ruido del reloj, así que esos pares se
	//     muestran, pero no se juzgan.
	if (small.elapsedMs < MIN_MEASURABLE_MS) {
		console.log(`${label}: x${ratio.toFixed(2)} (not judged: ${small.elapsedMs.toFixed(3)} ms is too short)`);
		continue;
	}
	// EN: Elixir sorts immutable linked lists, so its time includes the garbage collector, which
	//     copies the live data and grows faster than the algorithm. Its limit is 4, the factor
	//     of a quadratic algorithm: enough to show the growth is not quadratic.
	// PT: O Elixir ordena listas encadeadas imutáveis, então o tempo dele inclui o coletor de
	//     lixo, que copia os dados vivos e cresce mais rápido que o algoritmo. O limite dele é
	//     4, o fator de um algoritmo quadrático: o bastante para mostrar que o crescimento não
	//     é quadrático.
	// ES: Elixir ordena listas enlazadas inmutables, así que su tiempo incluye al recolector de
	//     basura, que copia los datos vivos y crece más rápido que el algoritmo. Su límite es
	//     4, el factor de un algoritmo cuadrático: lo bastante para mostrar que el crecimiento no
	//     es cuadrático.
	const limit = small.language === "elixir" ? GC_LANGUAGE_LIMIT : DOUBLING_LIMIT;
	ratios++;
	worst = Math.max(worst, ratio);
	console.log(`${label}: x${ratio.toFixed(2)} (limit ${limit})`);
	if (ratio >= limit) {
		problems.push(`${label}: time grew ${ratio.toFixed(2)} times, expected less than ${limit}`);
	}
}
if (ratios === 0) {
	problems.push("no pair of sizes n and 2n for merge sort");
}

console.log(
	`${rows.length} rows, ${languages.size} languages, ${checksums.size} input files, worst merge doubling x${worst.toFixed(2)}`,
);
if (problems.length > 0) {
	for (const problem of problems) {
		console.error(`FAIL ${problem}`);
	}
	process.exit(1);
}
console.log("all checksums agree and merge sort stays within its doubling limit in every language");
