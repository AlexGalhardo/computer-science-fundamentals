import { describe, expect, test } from "bun:test";
import { type Block, headerHash, mine } from "../src/block";
import { GENESIS, validateChain } from "../src/chain";
import { merkleRoot } from "../src/merkle";
import { createCoinbase, transactionId } from "../src/transaction";
import { alice, bob, carol, clone, RULES, sampleNode } from "./fixtures";

const original = sampleNode().chain;

function blockAt(chain: Block[], height: number): Block {
	const block = chain[height];
	if (block === undefined) {
		throw new Error(`no block at height ${height}`);
	}
	return block;
}

describe("a valid chain", () => {
	test("validates from genesis and yields the expected balances", () => {
		const result = validateChain(original, RULES);
		expect(result.ok).toBe(true);
		const node = sampleNode();
		// Alice: 50 - 20 - 1 (fee) - 7 + 50 (block 3). Bob: 20 - 5 + 50 + 1 (fee). Carol: 5 + 7.
		expect(node.balance(alice.publicKey)).toBe(72);
		expect(node.balance(bob.publicKey)).toBe(66);
		expect(node.balance(carol.publicKey)).toBe(12);
	});

	test("starts at the fixed genesis block", () => {
		expect(original[0]).toEqual(GENESIS);
		expect(validateChain(original.slice(1), RULES).ok).toBe(false);
	});
});

// MP-CHAIN-1.1: changing any transaction invalidates the chain.
describe("tamper evidence", () => {
	test("changing the amount of ANY output of ANY transaction invalidates the chain", () => {
		let cases = 0;
		for (let height = 1; height < original.length; height++) {
			const count = blockAt(clone(original), height).transactions.length;
			for (let t = 0; t < count; t++) {
				const chain = clone(original);
				const output = blockAt(chain, height).transactions[t]?.outputs[0];
				if (output === undefined) {
					throw new Error("fixture transaction has no output");
				}
				output.amount += 1;
				const result = validateChain(chain, RULES);
				expect(result).toEqual({ ok: false, height, reason: "transaction id does not match its content" });
				cases++;
			}
		}
		// 3 coin-creation transactions and 3 payments.
		expect(cases).toBe(6);
	});

	test("changing a recipient, removing or reordering transactions also invalidates it", () => {
		const redirected = clone(original);
		const payment = blockAt(redirected, 2).transactions[1]?.outputs[0];
		if (payment === undefined) {
			throw new Error("fixture payment is missing");
		}
		payment.publicKey = carol.publicKey;
		expect(validateChain(redirected, RULES).ok).toBe(false);

		const removed = clone(original);
		blockAt(removed, 3).transactions.pop();
		expect(validateChain(removed, RULES).ok).toBe(false);

		const reordered = clone(original);
		blockAt(reordered, 3).transactions.reverse();
		expect(validateChain(reordered, RULES).ok).toBe(false);
	});

	test("recomputing the transaction id is not enough: the Merkle root no longer matches", () => {
		const chain = clone(original);
		blockAt(chain, 1).transactions[0] = createCoinbase(1, bob.publicKey, 50);
		expect(validateChain(chain, RULES)).toEqual({
			ok: false,
			height: 1,
			reason: "Merkle root does not match the transactions",
		});
	});

	test("fixing the Merkle root is not enough: the block hash and the proof of work break", () => {
		const chain = clone(original);
		const block = blockAt(chain, 1);
		// The attacker redirects the reward of block 1 to Bob and recomputes id and Merkle root.
		block.transactions[0] = createCoinbase(1, bob.publicKey, 50);
		block.header.merkleRoot = merkleRoot(block.transactions.map((tx) => tx.id));
		expect(validateChain(chain, RULES)).toEqual({
			ok: false,
			height: 1,
			reason: "block hash does not match its header",
		});
	});

	test("redoing the proof of work of one block breaks the link from the next block", () => {
		const chain = clone(original);
		const block = blockAt(chain, 1);
		block.transactions[0] = createCoinbase(1, bob.publicKey, 50);
		const { nonce: _nonce, ...withoutNonce } = block.header;
		const mined = mine({ ...withoutNonce, merkleRoot: merkleRoot(block.transactions.map((tx) => tx.id)) });
		block.header = mined.header;
		block.hash = mined.hash;
		// Block 1 is valid again, but block 2 still points to the old hash of block 1: the
		// attacker would have to redo every later block too, faster than the honest network.
		expect(validateChain(chain, RULES)).toEqual({
			ok: false,
			height: 2,
			reason: "previous hash does not match the hash of the previous block",
		});
	});

	test("a payment whose amount and id were rewritten fails the signature check", () => {
		const chain = clone(original);
		const block = blockAt(chain, 2);
		const payment = block.transactions[1];
		const output = payment?.outputs[0];
		if (payment === undefined || output === undefined) {
			throw new Error("fixture payment is missing");
		}
		output.amount = 21;
		payment.id = transactionId(payment);
		const { nonce: _nonce, ...withoutNonce } = block.header;
		const mined = mine({ ...withoutNonce, merkleRoot: merkleRoot(block.transactions.map((tx) => tx.id)) });
		block.header = mined.header;
		block.hash = mined.hash;
		const result = validateChain(chain.slice(0, 3), RULES);
		expect(result.ok).toBe(false);
		expect(result.ok ? "" : result.reason).toContain("invalid signature");
	});
});

describe("block rules", () => {
	test("a block without proof of work is rejected", () => {
		const chain = clone(original);
		const block = blockAt(chain, 3);
		// Find a nonce whose hash does NOT start with the required zeros.
		let nonce = 0;
		while (headerHash({ ...block.header, nonce }).startsWith("00")) {
			nonce++;
		}
		block.header.nonce = nonce;
		block.hash = headerHash(block.header);
		expect(validateChain(chain, RULES)).toEqual({
			ok: false,
			height: 3,
			reason: "block hash does not meet the difficulty (no proof of work)",
		});
	});

	test("a miner cannot create more coins than reward plus fees", () => {
		const chain = clone(original).slice(0, 2);
		const block = blockAt(chain, 1);
		block.transactions[0] = createCoinbase(1, alice.publicKey, 51);
		const { nonce: _nonce, ...withoutNonce } = block.header;
		const mined = mine({ ...withoutNonce, merkleRoot: merkleRoot(block.transactions.map((tx) => tx.id)) });
		block.header = mined.header;
		block.hash = mined.hash;
		const result = validateChain(chain, RULES);
		expect(result.ok ? "" : result.reason).toContain("exceeds reward plus fees");
	});
});
