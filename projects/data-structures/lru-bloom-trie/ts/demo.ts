// EN: Demo of the three structures, printed as plain text: `bun run demo.ts`.
// PT: Demo das três estruturas, impressa em texto puro: `bun run demo.ts`.

import { BloomFilter } from "./src/bloom-filter";
import { LruCache } from "./src/lru-cache";
import { Trie } from "./src/trie";
import { generateWords } from "./src/words";

console.log("== LRU cache, capacity 3 ==");
const cache = new LruCache<string, number>(3);
const steps: [string, string, number?][] = [
	["put", "a", 1],
	["put", "b", 2],
	["put", "c", 3],
	["get", "a"],
	["put", "d", 4],
	["get", "b"],
	["put", "e", 5],
];
for (const [operation, key, value] of steps) {
	let outcome: string;
	if (operation === "put") {
		const evicted = cache.put(key, value ?? 0);
		outcome = evicted === undefined ? "stored" : `stored, evicted ${evicted}`;
	} else {
		const found = cache.get(key);
		outcome = found === undefined ? "miss" : `hit ${found}`;
	}
	const call = operation === "put" ? `put(${key}, ${value})` : `get(${key})`;
	console.log(`${call.padEnd(10)} ${outcome.padEnd(18)} newest -> oldest: ${cache.keys().join(" ")}`);
}

console.log("\n== Bloom filter: measured against theoretical false-positive rate ==");
console.log("bits      hashes  keys    bits/key  theory    measured  false negatives");
const PROBES = 200_000;
for (const [sizeInBits, hashCount, keys] of [
	[200_000, 7, 20_000],
	[100_000, 3, 10_000],
	[64_000, 2, 16_000],
	[150_000, 5, 30_000],
] as const) {
	const filter = new BloomFilter(sizeInBits, hashCount);
	for (let i = 0; i < keys; i++) {
		filter.add(`member-${i}`);
	}
	let falseNegatives = 0;
	for (let i = 0; i < keys; i++) {
		if (!filter.mightContain(`member-${i}`)) falseNegatives++;
	}
	let falsePositives = 0;
	for (let i = 0; i < PROBES; i++) {
		if (filter.mightContain(`outsider-${i}`)) falsePositives++;
	}
	console.log(
		[
			String(sizeInBits).padEnd(9),
			String(hashCount).padEnd(7),
			String(keys).padEnd(7),
			(sizeInBits / keys).toFixed(1).padEnd(9),
			`${(filter.expectedFalsePositiveRate(keys) * 100).toFixed(2)}%`.padEnd(9),
			`${((falsePositives / PROBES) * 100).toFixed(2)}%`.padEnd(9),
			falseNegatives,
		].join(" "),
	);
}

console.log("\n== Trie: prefix search over 100,000 generated words ==");
const words = generateWords(100_000, 7);
const trie = new Trie();
for (const word of words) {
	trie.insert(word);
}
for (const prefix of ["a", "ab", "abc", "abcd", "zz"]) {
	const found = trie.withPrefix(prefix);
	const linear = words.filter((word) => word.startsWith(prefix)).length;
	console.log(
		`prefix "${prefix}": ${found.length} words (linear filter: ${linear}), first: ${found.slice(0, 4).join(", ") || "-"}`,
	);
}
