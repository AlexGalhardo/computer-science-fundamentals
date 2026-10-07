import { expect, test } from "bun:test";
import { BloomFilter } from "../src/bloom-filter";

// EN: Each configuration is (bits, hash functions, keys added). The theoretical rate goes from
//     about 0.8% to about 15%, so the formula is checked in very different regimes.
// PT: Cada configuração é (bits, funções de espalhamento, chaves adicionadas). A taxa teórica
//     vai de cerca de 0,8% a cerca de 15%, então a fórmula é conferida em regimes bem diferentes.
const configurations: [number, number, number][] = [
	[200_000, 7, 20_000],
	[100_000, 3, 10_000],
	[64_000, 2, 16_000],
	[150_000, 5, 30_000],
];
const PROBES = 200_000;

for (const [sizeInBits, hashCount, keys] of configurations) {
	test(`m = ${sizeInBits}, k = ${hashCount}, n = ${keys}: no false negative, measured rate near the theory`, () => {
		const filter = new BloomFilter(sizeInBits, hashCount);
		for (let i = 0; i < keys; i++) {
			filter.add(`member-${i}`);
		}
		// EN: Every key that was added has to be reported as present, with no exception.
		// PT: Toda chave que foi adicionada precisa ser dada como presente, sem exceção.
		let falseNegatives = 0;
		for (let i = 0; i < keys; i++) {
			if (!filter.mightContain(`member-${i}`)) falseNegatives++;
		}
		expect(falseNegatives).toBe(0);

		// EN: None of the probe keys was added, so every "probably yes" is a false positive.
		// PT: Nenhuma das chaves de sondagem foi adicionada, então todo "provavelmente sim" é um
		//     falso positivo.
		let falsePositives = 0;
		for (let i = 0; i < PROBES; i++) {
			if (filter.mightContain(`outsider-${i}`)) falsePositives++;
		}
		const measured = falsePositives / PROBES;
		const expected = filter.expectedFalsePositiveRate(keys);
		expect(Math.abs(measured - expected) / expected).toBeLessThan(0.2);
	});
}

test("optimal() sizes the filter for a wanted rate", () => {
	const filter = BloomFilter.optimal(10_000, 0.01);
	expect(filter.sizeInBits).toBe(95_851);
	expect(filter.hashCount).toBe(7);
	expect(filter.expectedFalsePositiveRate(10_000)).toBeLessThan(0.0105);
});

test("an empty filter contains nothing", () => {
	expect(new BloomFilter(1024, 3).mightContain("anything")).toBe(false);
});
