import { describe, expect, test } from "bun:test";
import {
	BASE_VOCABULARY,
	countPairs,
	DEFAULT_MERGES,
	decode,
	encode,
	mergePair,
	mostFrequentPair,
	TABLE_STEPS,
	type TableRow,
	textToBytes,
	tokenCountTable,
	tokenLabel,
	train,
} from "../src/bpe";
import { describe as describeTokens } from "../src/cli";
import { readData } from "../src/data";

const corpus = readData("corpus.txt");
const sample = readData("sample.txt");
const tokenizer = train(corpus, DEFAULT_MERGES);

describe("training", () => {
	test("counts overlapping pairs", () => {
		const counts = countPairs(textToBytes("aaab"));
		expect(mostFrequentPair(counts)).toEqual({ left: 97, right: 97, count: 2 });
	});

	test("a tie goes to the smaller pair, so the result does not depend on the order of the text", () => {
		// "abcd" and "cdab" contain each pair once: (a,b) = (97,98) is the smallest.
		expect(mostFrequentPair(countPairs(textToBytes("ab cd")))?.left).toBe(32);
		expect(mostFrequentPair(countPairs(textToBytes("cdab")))).toEqual({ left: 97, right: 98, count: 1 });
	});

	test("merging skips both items of a replaced pair", () => {
		expect(mergePair([97, 97, 97], 97, 97, 256)).toEqual([256, 97]);
	});

	test("the worked example of the docs: banana bandana goes 14 -> 10 -> 8 -> 6 tokens", () => {
		const small = train("banana bandana", 3);
		expect(small.merges.map((merge) => tokenLabel(small, merge.id))).toEqual(["an", "ban", "ana"]);
		expect([0, 1, 2, 3].map((limit) => encode(small, "banana bandana", limit).length)).toEqual([14, 10, 8, 6]);
	});

	test("each merge adds exactly one token to the vocabulary", () => {
		expect(tokenizer.merges.length).toBe(DEFAULT_MERGES);
		expect(tokenizer.vocabulary.length).toBe(BASE_VOCABULARY + DEFAULT_MERGES);
	});

	test("training stops when no pair repeats", () => {
		expect(train("abcdef", 10).merges.length).toBe(0);
	});
});

// MP-AI-1.1: encode then decode returns the original text for ASCII, accented and emoji input.
describe("round trip", () => {
	const cases: Record<string, string> = {
		ascii: "The quick brown fox jumps over the lazy dog, 1234567890 times!",
		accented: "Ação, coração, pão de queijo, à noite, über, niño, façade, crème brûlée.",
		emoji: "Tokens 🙂🚀 and a family 👨‍👩‍👧 and a flag 🇧🇷.",
		"never seen in the corpus": "日本語のテキスト, русский текст, ελληνικά, עברית",
		"control characters": "tabs\tand\nnew lines\r\n",
		empty: "",
	};
	for (const [name, text] of Object.entries(cases)) {
		test(name, () => {
			const ids = encode(tokenizer, text);
			expect(decode(tokenizer, ids)).toBe(text);
			expect(ids.length).toBeLessThanOrEqual(textToBytes(text).length);
		});
	}

	test("with no merges every token is one byte", () => {
		expect(encode(tokenizer, "é🙂", 0)).toEqual([0xc3, 0xa9, 0xf0, 0x9f, 0x99, 0x82]);
	});

	test("an unknown id is an error, not silence", () => {
		expect(() => decode(tokenizer, [BASE_VOCABULARY + DEFAULT_MERGES])).toThrow();
	});
});

// MP-AI-1.2: the token count of the same text falls as the number of merges grows, and the
// table is identical in both languages (both compare with the committed data/expected-table.json).
describe("vocabulary size against number of tokens", () => {
	const rows = tokenCountTable(tokenizer, corpus, sample, TABLE_STEPS);

	test("the count never rises and ends far below the number of bytes", () => {
		for (let index = 1; index < rows.length; index++) {
			const before = rows[index - 1] as TableRow;
			const after = rows[index] as TableRow;
			expect(after.sampleTokens).toBeLessThan(before.sampleTokens);
			expect(after.corpusTokens).toBeLessThan(before.corpusTokens);
		}
		expect(rows[0]?.sampleTokens).toBe(textToBytes(sample).length);
		expect((rows.at(-1) as TableRow).sampleTokens * 2).toBeLessThan(textToBytes(sample).length);
	});

	test("matches the table committed in data/expected-table.json", () => {
		expect(rows).toEqual(JSON.parse(readData("expected-table.json")));
	});

	test("matches the merges committed in data/expected-merges.json", () => {
		const merges = tokenizer.merges.map((merge) => [merge.left, merge.right, merge.count]);
		expect(merges).toEqual(JSON.parse(readData("expected-merges.json")));
	});
});

// MP-AI-1.3: the CLI shows the tokens of a sentence, with ids and boundaries.
describe("cli", () => {
	test("prints one row per token, the boundaries and the ids", () => {
		const text = "the token";
		const ids = encode(tokenizer, text);
		const output = describeTokens(tokenizer, text);
		expect(output).toContain(`tokens: ${ids.length}`);
		expect(output).toContain(`ids:        ${ids.join(" ")}`);
		expect(output).toContain(`boundaries: ${ids.map((id) => tokenLabel(tokenizer, id)).join("|")}`);
		expect(output).toContain("decode(encode(text)) == text");
	});

	test("a token that is not a whole character is shown as bytes", () => {
		const bytes = train("x", 0);
		expect(tokenLabel(bytes, 0xf0)).toBe("<f0>");
		expect(tokenLabel(bytes, 0x41)).toBe("A");
	});
});
