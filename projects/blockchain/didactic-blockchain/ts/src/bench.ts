import { mkdirSync, writeFileSync } from "node:fs";
import { arch, cpus, release, totalmem, type } from "node:os";
import { dirname } from "node:path";
import { z } from "zod";
import { mine } from "./block";
import { sha256Hex } from "./hash";

// EN: The grid measured by both languages: difficulty (zero hexadecimal digits) and how many
//     blocks are mined at that difficulty. More blocks at the low difficulties cost nothing and
//     make the average steadier. Every row is timed PASSES times and the median is reported
//     with the range, because other programs share the machine.
// PT: A grade medida pelas duas linguagens: dificuldade (dígitos hexadecimais zero) e quantos
//     blocos são minerados nela. Mais blocos nas dificuldades baixas não custam nada e deixam a
//     média mais estável. Cada linha é cronometrada PASSES vezes e a mediana é informada junto
//     com a faixa, porque outros programas dividem a máquina.
export const GRID: ReadonlyArray<readonly [difficulty: number, blocks: number]> = [
	[1, 40000],
	[2, 4000],
	[3, 500],
	[4, 150],
];
export const PASSES = 3;

export const rowSchema = z.strictObject({
	difficulty: z.number().int().min(0),
	blocks: z.number().int().positive(),
	passes: z.number().int().positive(),
	/** Nonces tried in one pass over all the blocks. */
	attempts: z.number().int().positive(),
	meanAttempts: z.number().positive(),
	/** Time per block in the median, the fastest and the slowest pass. */
	medianMs: z.number().nonnegative(),
	minMs: z.number().nonnegative(),
	maxMs: z.number().nonnegative(),
});
export const benchSchema = z.strictObject({
	language: z.enum(["ts", "rust"]),
	runtime: z.string().min(1),
	machine: z.string(),
	command: z.string().min(1),
	date: z.string(),
	rows: z.array(rowSchema).min(1),
});
export type Row = z.infer<typeof rowSchema>;
export type Bench = z.infer<typeof benchSchema>;

// EN: Mines `blocks` different headers at one difficulty and reports the average number of
//     attempts and the time per block. The headers are fixed (they depend only on the
//     difficulty and on the block number) and are built before the clock starts, so the
//     attempts are identical on every run and in both languages. Only the time depends on the
//     machine.
// PT: Minera `blocks` cabeçalhos diferentes em uma dificuldade e informa a média de tentativas e
//     o tempo por bloco. Os cabeçalhos são fixos (dependem só da dificuldade e do número do
//     bloco) e são montados antes de o relógio começar, então as tentativas são idênticas em
//     toda execução e nas duas linguagens. Só o tempo depende da máquina.
export function measure(difficulty: number, blocks: number, passes = 1): Row {
	const merkleRoot = sha256Hex("bench");
	const headers = Array.from({ length: blocks }, (_, height) => ({
		height,
		previousHash: sha256Hex(`bench ${difficulty} ${height}`),
		merkleRoot,
		timestamp: 0,
		difficulty,
	}));
	let attempts = 0;
	const times: number[] = [];
	for (let pass = 0; pass < passes; pass++) {
		attempts = 0;
		const start = performance.now();
		for (const header of headers) {
			attempts += mine(header).attempts;
		}
		times.push((performance.now() - start) / blocks);
	}
	times.sort((a, b) => a - b);
	return {
		difficulty,
		blocks,
		passes,
		attempts,
		meanAttempts: attempts / blocks,
		medianMs: times[Math.floor(times.length / 2)] ?? 0,
		minMs: times[0] ?? 0,
		maxMs: times[times.length - 1] ?? 0,
	};
}

if (import.meta.main) {
	const out = process.argv[2];
	if (out === undefined) {
		console.error("usage: bun run src/bench.ts <output.json>");
		process.exit(2);
	}
	// EN: Warm-up, discarded. A JavaScript engine starts by interpreting the code and compiles the
	//     hot loop later, so without it the first rows would pay for the slow start and the
	//     time ratios would look smaller than the work ratios.
	// PT: Aquecimento, descartado. Um motor de JavaScript começa interpretando o código e só
	//     depois compila o laço quente, então sem isto as primeiras linhas pagariam pelo início
	//     lento e as razões de tempo pareceriam menores que as razões de trabalho.
	measure(3, 250);
	const cpu = cpus();
	const bench: Bench = {
		language: "ts",
		runtime: `bun ${Bun.version}`,
		machine: `${cpu[0]?.model.trim() ?? "unknown CPU"}, ${cpu.length} logical cores, ${(totalmem() / 2 ** 30).toFixed(1)} GiB, ${type()} ${release()} ${arch()}`,
		command: "docker compose run --rm bench-ts",
		date: new Date().toISOString().slice(0, 10),
		rows: GRID.map(([difficulty, blocks]) => measure(difficulty, blocks, PASSES)),
	};
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, `${JSON.stringify(bench, null, "\t")}\n`);
	for (const row of bench.rows) {
		console.log(
			`difficulty ${row.difficulty}: ${row.blocks} blocks, ${row.meanAttempts.toFixed(1)} attempts and ${row.medianMs.toFixed(4)} ms per block`,
		);
	}
}
