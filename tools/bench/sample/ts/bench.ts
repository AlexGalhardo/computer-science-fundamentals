// EN: Smallest program that honours the benchmark contract: it sums 1..n in two ways and prints
//     one JSON line. Only the work is timed, not the start-up of the runtime.
// PT: Menor programa que respeita o contrato de benchmark: soma 1..n de duas formas e imprime
//     uma linha JSON. Só o trabalho é cronometrado, não a inicialização do runtime.

const [implementation = "sum-loop", size = "1000"] = process.argv.slice(2);
const n = Number(size);

function sumLoop(limit: number): number {
	let total = 0;
	for (let i = 1; i <= limit; i++) {
		total += i;
	}
	return total;
}

function sumFormula(limit: number): number {
	return (limit * (limit + 1)) / 2;
}

const start = performance.now();
const total = implementation === "sum-formula" ? sumFormula(n) : sumLoop(n);
const elapsedMs = performance.now() - start;

console.log(
	JSON.stringify({
		n,
		elapsedMs,
		memoryKb: Math.round(process.memoryUsage().rss / 1024),
		language: "ts",
		implementation,
		checksum: String(total),
	}),
);
