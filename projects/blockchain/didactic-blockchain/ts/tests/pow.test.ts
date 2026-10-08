import { describe, expect, test } from "bun:test";
import { measure } from "../src/bench";
import { headerHash, meetsDifficulty, mine } from "../src/block";
import { sha256Hex } from "../src/hash";

const template = {
	height: 7,
	previousHash: sha256Hex("previous block"),
	merkleRoot: sha256Hex("transactions"),
	timestamp: 1_700_000_000,
};

describe("proof of work", () => {
	test("the mined nonce gives a hash with the required zeros, checked with a single hash", () => {
		for (const difficulty of [0, 1, 2, 3]) {
			const mined = mine({ ...template, difficulty });
			expect(mined.hash.startsWith("0".repeat(difficulty))).toBe(true);
			expect(headerHash(mined.header)).toBe(mined.hash);
			expect(mined.attempts).toBe(mined.header.nonce + 1);
		}
	});

	test("only leading zeros count", () => {
		expect(meetsDifficulty(`000f${"a".repeat(60)}`, 3)).toBe(true);
		expect(meetsDifficulty(`000f${"a".repeat(60)}`, 4)).toBe(false);
		expect(meetsDifficulty(`f000${"0".repeat(60)}`, 1)).toBe(false);
	});

	// EN: Reference values also asserted by the Rust tests: both languages build the same header
	//     text, so they must find the same nonce and the same hash.
	// PT: Valores de referência também conferidos pelos testes em Rust: as duas linguagens
	//     montam o mesmo texto de cabeçalho, então precisam achar o mesmo nonce e o mesmo hash.
	test("reference block shared with the Rust implementation", () => {
		const mined = mine({ ...template, difficulty: 3 });
		expect(mined.header.nonce).toBe(REFERENCE.nonce);
		expect(mined.hash).toBe(REFERENCE.hash);
	});

	// MP-CHAIN-1.2: the work grows about 16 times per extra zero hexadecimal digit.
	test("average attempts grow about 16 times per extra zero digit", () => {
		// The block contents are fixed, so the number of attempts is the same on every run.
		const rows = [1, 2, 3].map((difficulty) => measure(difficulty, 300));
		for (const row of rows) {
			const expected = 16 ** row.difficulty;
			expect(row.meanAttempts).toBeGreaterThan(expected * 0.75);
			expect(row.meanAttempts).toBeLessThan(expected * 1.25);
		}
		for (let i = 1; i < rows.length; i++) {
			const ratio = (rows[i]?.meanAttempts ?? 0) / (rows[i - 1]?.meanAttempts ?? 1);
			expect(ratio).toBeGreaterThan(12);
			expect(ratio).toBeLessThan(20);
		}
	});
});

const REFERENCE = { nonce: 8228, hash: "000eda6f4af83d3682f44693d823fdf2f93e216518bd9bcf8c43e5486b6fb595" };
