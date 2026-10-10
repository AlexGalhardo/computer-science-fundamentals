// EN: Demo: runs one counter variant and prints one JSON line (the benchmark contract of the
//     repository). With no arguments it runs every variant and prints a small table.
// PT: Demo: roda uma variante do contador e imprime uma linha JSON (o contrato de benchmark do
//     repositório). Sem argumentos, roda todas as variantes e imprime uma pequena tabela.
// ES: Demo: ejecuta una variante del contador e imprime una línea JSON (el contrato de benchmark
//     del repositorio). Sin argumentos, ejecuta todas las variantes e imprime una pequeña tabla.

import { runCounter } from "./run";
import { isVariant, VARIANTS, type Variant } from "./shared";

// EN: 8 workers by default. The benchmark sets WORKERS to 1, 2, 4 and 8 to show how each fix scales.
// PT: 8 workers por padrão. O benchmark define WORKERS como 1, 2, 4 e 8 para mostrar como cada correção escala.
// ES: 8 workers por defecto. El benchmark define WORKERS como 1, 2, 4 y 8 para mostrar cómo escala cada corrección.
const WORKERS = Math.max(1, Math.trunc(Number(process.env.WORKERS ?? 8)) || 8);

async function measure(variant: Variant, n: number): Promise<{ total: number; elapsedMs: number }> {
	const start = performance.now();
	const total = await runCounter(variant, WORKERS, Math.floor(n / WORKERS));
	return { total, elapsedMs: performance.now() - start };
}

const [variantArg, sizeArg = "1000000"] = process.argv.slice(2);

if (variantArg === undefined) {
	const n = 1_000_000;
	console.log(`${"variant".padEnd(8)} ${"final".padStart(10)} ${"lost".padStart(10)} ${"ms".padStart(10)}`);
	for (const variant of VARIANTS) {
		const { total, elapsedMs } = await measure(variant, n);
		const cells = [String(total), String(n - total), elapsedMs.toFixed(1)].map((cell) => cell.padStart(10));
		console.log(`${variant.padEnd(8)} ${cells.join(" ")}`);
	}
} else {
	const n = Number(sizeArg);
	if (!isVariant(variantArg) || !Number.isInteger(n) || n < WORKERS) {
		console.error(`usage: demo.ts <${VARIANTS.join("|")}> <n of at least ${WORKERS}>`);
		process.exit(2);
	}
	const { total, elapsedMs } = await measure(variantArg, n);
	console.log(
		JSON.stringify({
			n,
			elapsedMs,
			memoryKb: Math.round(process.memoryUsage().rss / 1024),
			language: "ts",
			implementation: variantArg,
			// EN: The checksum is the final value. For a correct counter it equals n.
			// PT: O checksum é o valor final. Em um contador correto ele é igual a n.
			// ES: El checksum es el valor final. En un contador correcto es igual a n.
			checksum: String(total),
		}),
	);
}
process.exit(0);
