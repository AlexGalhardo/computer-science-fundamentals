import { effectiveAccessTime, Mmu } from "./mmu";
import { ALGORITHMS, type Algorithm, countFaults } from "./replacement";

// EN: The reference string used in most operating systems textbooks to compare replacement
//     algorithms. With 3 frames it gives 15 faults for FIFO, 12 for LRU and 9 for optimal.
// PT: A sequência de referências usada na maioria dos livros de sistemas operacionais para
//     comparar algoritmos de substituição. Com 3 molduras ela dá 15 faltas no FIFO, 12 no LRU e
//     9 no ótimo.
export const CLASSIC = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

// EN: The string on which Belady found that FIFO can fault MORE when it gets MORE memory.
// PT: A sequência em que Belady descobriu que o FIFO pode ter MAIS faltas ao receber MAIS memória.
export const BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

export const SEED = 2026;
export const PAGE_SIZE = 4096;
export const TRACE_LENGTH = 20000;
export const MEMORY_FRAMES = 64;
export const TLB_SIZES = [4, 8, 16, 32, 64];
export const MEMORY_NS = 100;
export const TLB_NS = 1;
export const PAGE_TABLE_LEVELS = 4;

export interface FaultTable {
	trace: number[];
	frames: number[];
	rows: Array<{ algorithm: Algorithm; faults: number[] }>;
}

export function faultTable(trace: number[], frames: number[], algorithms: readonly Algorithm[]): FaultTable {
	return {
		trace,
		frames,
		rows: algorithms.map((algorithm) => ({
			algorithm,
			faults: frames.map((count) => countFaults(algorithm, trace, count)),
		})),
	};
}

// EN: Programs do not touch memory at random: for a while they stay inside a small set of
//     pages (locality of reference). The generated trace imitates that with a "hot" window of
//     16 pages that receives 95% of the accesses and moves from time to time. Without locality
//     neither the TLB nor paging itself would work well.
// PT: Programas não acessam a memória ao acaso: por um tempo eles ficam dentro de um conjunto
//     pequeno de páginas (localidade de referência). O traço gerado imita isso com uma janela
//     "quente" de 16 páginas, que recebe 95% dos acessos e se move de vez em quando. Sem
//     localidade, nem a TLB nem a própria paginação funcionariam bem.
export function generateAddresses(count: number, seed: number): number[] {
	let state = seed >>> 0;
	const between = (low: number, high: number): number => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return low + ((state >>> 16) % (high - low + 1));
	};
	const addresses: number[] = [];
	let base = 0;
	for (let i = 0; i < count; i++) {
		if (between(1, 1000) <= 5) {
			base = between(0, 240);
		}
		const page = between(1, 100) <= 95 ? base + between(0, 15) : between(0, 255);
		addresses.push(page * PAGE_SIZE + between(0, PAGE_SIZE - 1));
	}
	return addresses;
}

export interface TlbRow {
	tlbEntries: number;
	tlbHits: number;
	tlbMisses: number;
	hitRatio: number;
	pageFaults: number;
	effectiveNs: number;
}

export function tlbExperiment(): TlbRow[] {
	const addresses = generateAddresses(TRACE_LENGTH, SEED);
	return TLB_SIZES.map((tlbEntries) => {
		const mmu = new Mmu({ pageSize: PAGE_SIZE, frames: MEMORY_FRAMES, tlbEntries, algorithm: "clock" });
		for (const address of addresses) {
			mmu.translate(address);
		}
		const { tlbHits, tlbMisses, pageFaults, accesses } = mmu.counters;
		const hitRatio = tlbHits / accesses;
		return {
			tlbEntries,
			tlbHits,
			tlbMisses,
			hitRatio,
			pageFaults,
			effectiveNs: effectiveAccessTime(hitRatio, MEMORY_NS, TLB_NS, PAGE_TABLE_LEVELS),
		};
	});
}

export interface Report {
	project: string;
	command: string;
	seed: number;
	classic: FaultTable;
	belady: FaultTable;
	tlb: {
		accesses: number;
		frames: number;
		algorithm: string;
		memoryNs: number;
		tlbNs: number;
		levels: number;
		rows: TlbRow[];
	};
}

export function buildReport(): Report {
	return {
		project: "paging-tlb",
		command: "docker compose run --rm demo",
		seed: SEED,
		classic: faultTable(CLASSIC, [1, 2, 3, 4, 5, 6, 7], ALGORITHMS),
		belady: faultTable(BELADY, [1, 2, 3, 4, 5], ["fifo", "lru", "optimal"]),
		tlb: {
			accesses: TRACE_LENGTH,
			frames: MEMORY_FRAMES,
			algorithm: "clock",
			memoryNs: MEMORY_NS,
			tlbNs: TLB_NS,
			levels: PAGE_TABLE_LEVELS,
			rows: tlbExperiment(),
		},
	};
}

function tableText(title: string, table: FaultTable): string {
	const lines = [title, `reference string: ${table.trace.join(" ")}`];
	lines.push(`${"frames".padEnd(8)}${table.frames.map((count) => String(count).padStart(5)).join("")}`);
	for (const row of table.rows) {
		lines.push(`${row.algorithm.padEnd(8)}${row.faults.map((count) => String(count).padStart(5)).join("")}`);
	}
	return lines.join("\n");
}

/** This text is also printed, byte for byte, by the Rust implementation. */
export function faultsText(report: Report): string {
	return `${tableText("Page faults per number of frames", report.classic)}\n\n${tableText("Belady's anomaly", report.belady)}\n`;
}

export function tlbText(report: Report): string {
	const { tlb } = report;
	const lines = [
		`TLB experiment: ${tlb.accesses} accesses with locality, ${tlb.frames} frames, ${tlb.algorithm} replacement, seed ${report.seed}`,
		`effective access time with memory ${tlb.memoryNs} ns, TLB ${tlb.tlbNs} ns and a ${tlb.levels}-level page table`,
		`${"TLB entries".padEnd(12)}${"hits".padStart(8)}${"misses".padStart(8)}${"hit ratio".padStart(11)}${"faults".padStart(8)}${"EAT (ns)".padStart(10)}`,
	];
	for (const row of tlb.rows) {
		lines.push(
			`${String(row.tlbEntries).padEnd(12)}${String(row.tlbHits).padStart(8)}${String(row.tlbMisses).padStart(8)}${`${(row.hitRatio * 100).toFixed(2)}%`.padStart(11)}${String(row.pageFaults).padStart(8)}${row.effectiveNs.toFixed(1).padStart(10)}`,
		);
	}
	return `${lines.join("\n")}\n`;
}

function tableMarkdown(table: FaultTable): string[] {
	const lines = [
		`Reference string: \`${table.trace.join(" ")}\``,
		"",
		`| Frames | ${table.frames.join(" | ")} |`,
		`| --- | ${table.frames.map(() => "---:").join(" | ")} |`,
	];
	for (const row of table.rows) {
		lines.push(`| ${row.algorithm} | ${row.faults.join(" | ")} |`);
	}
	lines.push("");
	return lines;
}

export function markdown(report: Report): string {
	const { tlb } = report;
	const lines = [
		"# paging-tlb: results",
		"",
		`Command: \`${report.command}\``,
		"",
		`The simulation is deterministic (seed ${report.seed}), so the numbers do not depend on the machine. The Rust implementation prints the same page-fault tables.`,
		"",
		"## Page faults per number of frames",
		"",
		...tableMarkdown(report.classic),
		"## Belady's anomaly",
		"",
		...tableMarkdown(report.belady),
		"FIFO has more faults with 4 frames than with 3. LRU and optimal never get worse with more memory.",
		"",
		"## TLB size against hit ratio",
		"",
		`${tlb.accesses} accesses with locality of reference, ${tlb.frames} frames, ${tlb.algorithm} replacement. Effective access time (EAT) with a memory access of ${tlb.memoryNs} ns, a TLB lookup of ${tlb.tlbNs} ns and a ${tlb.levels}-level page table.`,
		"",
		"| TLB entries | TLB hits | TLB misses | Hit ratio | Page faults | EAT (ns) |",
		"| ---: | ---: | ---: | ---: | ---: | ---: |",
	];
	for (const row of tlb.rows) {
		lines.push(
			`| ${row.tlbEntries} | ${row.tlbHits} | ${row.tlbMisses} | ${(row.hitRatio * 100).toFixed(2)}% | ${row.pageFaults} | ${row.effectiveNs.toFixed(1)} |`,
		);
	}
	lines.push("");
	return lines.join("\n");
}
