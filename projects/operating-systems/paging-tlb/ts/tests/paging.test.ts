import { expect, test } from "bun:test";
import { effectiveAccessTime, Mmu } from "../src/mmu";
import { ALGORITHMS, countFaults, createReplacer } from "../src/replacement";
import { BELADY, buildReport, CLASSIC, generateAddresses } from "../src/report";

// EN: The expected counts are the ones documented, with the hand traces, in
//     docs/en/operating-systems/paging-tlb.md.
// PT: As contagens esperadas são as documentadas, com os traços feitos à mão, em
//     docs/pt/operating-systems/paging-tlb.md.

test("classic reference string with 3 frames: FIFO 15, LRU 12, optimal 9", () => {
	expect(countFaults("fifo", CLASSIC, 3)).toBe(15);
	expect(countFaults("clock", CLASSIC, 3)).toBe(14);
	expect(countFaults("lru", CLASSIC, 3)).toBe(12);
	expect(countFaults("optimal", CLASSIC, 3)).toBe(9);
});

test("string 1 2 3 1 4 2 5 1 2 3 with 3 frames: FIFO 8, optimal 6", () => {
	const trace = [1, 2, 3, 1, 4, 2, 5, 1, 2, 3];
	expect(countFaults("fifo", trace, 3)).toBe(8);
	expect(countFaults("optimal", trace, 3)).toBe(6);
});

test("string 4 1 4 2 3 4 1 2 with 3 frames: FIFO 7, LRU 6, optimal 5", () => {
	const trace = [4, 1, 4, 2, 3, 4, 1, 2];
	expect(countFaults("fifo", trace, 3)).toBe(7);
	expect(countFaults("lru", trace, 3)).toBe(6);
	expect(countFaults("optimal", trace, 3)).toBe(5);
});

test("clock gives a second chance to a page that was used again", () => {
	const trace = [1, 2, 3, 4, 2, 5, 2];
	expect(countFaults("fifo", trace, 3)).toBe(6);
	expect(countFaults("clock", trace, 3)).toBe(5);
	// EN: The fault on 5 finds page 2 with R = 1, clears the bit and evicts page 3 instead.
	// PT: A falta na página 5 encontra a página 2 com R = 1, zera o bit e retira a página 3.
	const clock = createReplacer("clock", 3);
	const evicted = trace.map((page) => clock.access(page).evicted);
	expect(evicted).toEqual([undefined, undefined, undefined, 1, undefined, 3, undefined]);
});

test("clock behaves as FIFO when every page has its referenced bit set", () => {
	const trace = [1, 2, 3, 4, 1, 2];
	expect(countFaults("clock", trace, 3)).toBe(countFaults("fifo", trace, 3));
});

test("Belady's anomaly: FIFO faults more with 4 frames than with 3", () => {
	expect(countFaults("fifo", BELADY, 3)).toBe(9);
	expect(countFaults("fifo", BELADY, 4)).toBe(10);
	expect(countFaults("fifo", BELADY, 4)).toBeGreaterThan(countFaults("fifo", BELADY, 3));
});

test("LRU and optimal are stack algorithms: more frames never means more faults", () => {
	const pages = generateAddresses(400, 5).map((address) => Math.floor(address / 4096) % 12);
	for (const algorithm of ["lru", "optimal"] as const) {
		for (let frames = 1; frames < 12; frames++) {
			expect(countFaults(algorithm, pages, frames + 1)).toBeLessThanOrEqual(
				countFaults(algorithm, pages, frames),
			);
		}
	}
});

test("no algorithm beats optimal, and with enough frames only the first use of a page faults", () => {
	const pages = generateAddresses(400, 9).map((address) => Math.floor(address / 4096) % 10);
	const distinct = new Set(pages).size;
	for (const algorithm of ALGORITHMS) {
		for (const frames of [1, 2, 3, 5, 8]) {
			expect(countFaults(algorithm, pages, frames)).toBeGreaterThanOrEqual(countFaults("optimal", pages, frames));
		}
		expect(countFaults(algorithm, pages, distinct)).toBe(distinct);
	}
});

test("MMU reference trace: 2 TLB hits, 6 TLB misses and 5 page faults", () => {
	const mmu = new Mmu({ pageSize: 4096, frames: 3, tlbEntries: 2, algorithm: "lru" });
	const pages = [0, 1, 0, 2, 0, 3, 1, 0];
	const results = pages.map((page) => mmu.translate(page * 4096 + 20));
	expect(results.map((r) => r.tlbHit)).toEqual([false, false, true, false, true, false, false, false]);
	expect(results.map((r) => r.pageFault)).toEqual([true, true, false, true, false, true, true, false]);
	expect(mmu.counters).toEqual({ accesses: 8, tlbHits: 2, tlbMisses: 6, pageFaults: 5 });
	// EN: Page 3 took frame 1, which belonged to page 1, the least recently used page.
	// PT: A página 3 ficou com a moldura 1, que era da página 1, a menos recentemente usada.
	expect(results[5]).toMatchObject({ page: 3, frame: 1, offset: 20, physical: 4116 });
	// EN: The last access misses the TLB but the page is still in memory: no page fault.
	// PT: O último acesso falha na TLB, mas a página ainda está na memória: sem falta de página.
	expect(results[7]).toMatchObject({ frame: 0, physical: 20, tlbHit: false, pageFault: false });
});

test("address translation: page 5 mapped to frame 3 turns 20500 into 12308", () => {
	const mmu = new Mmu({ pageSize: 4096, frames: 8, tlbEntries: 4, algorithm: "fifo" });
	// EN: Frames are handed out in order, so touching pages 9, 8 and 7 first leaves frame 3 for page 5.
	// PT: As molduras são entregues em ordem, então tocar antes as páginas 9, 8 e 7 deixa a moldura 3 para a página 5.
	for (const page of [9, 8, 7]) {
		mmu.translate(page * 4096);
	}
	expect(mmu.translate(20500)).toMatchObject({ page: 5, offset: 20, frame: 3, physical: 12308 });
});

test("an evicted page leaves the TLB, so a stale translation is never used", () => {
	const mmu = new Mmu({ pageSize: 4096, frames: 1, tlbEntries: 4, algorithm: "fifo" });
	mmu.translate(0);
	mmu.translate(4096);
	const again = mmu.translate(0);
	expect(again.tlbHit).toBe(false);
	expect(again.pageFault).toBe(true);
});

test("effective access time: 80% hits, 100 ns memory and 10 ns TLB give 130 ns", () => {
	expect(effectiveAccessTime(0.8, 100, 10)).toBeCloseTo(130, 10);
	expect(effectiveAccessTime(1, 100, 10)).toBe(110);
});

test("invalid configuration is rejected", () => {
	expect(() => new Mmu({ pageSize: 1000, frames: 4, tlbEntries: 4, algorithm: "lru" })).toThrow();
	expect(() => createReplacer("fifo", 0)).toThrow();
	expect(() => createReplacer("optimal", 2, [1, 2]).access(9)).toThrow();
});

test("a bigger TLB never has a lower hit ratio on the generated trace", () => {
	const rows = buildReport().tlb.rows;
	for (let i = 1; i < rows.length; i++) {
		expect(rows[i]?.hitRatio ?? 0).toBeGreaterThanOrEqual(rows[i - 1]?.hitRatio ?? 0);
	}
});
