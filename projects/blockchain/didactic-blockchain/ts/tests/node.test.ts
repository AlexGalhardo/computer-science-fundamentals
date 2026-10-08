import { describe, expect, test } from "bun:test";
import { mineBlock } from "../src/block";
import { createCoinbase, createTransaction, pay, transactionId } from "../src/transaction";
import { accept, alice, bob, carol, clone, newNode } from "./fixtures";

// MP-CHAIN-1.3, first half: a double spend is rejected.
describe("double spending", () => {
	test("first seen wins: a second pending transaction spending the same output is rejected", () => {
		const node = newNode("a");
		node.mine(alice.publicKey);
		const toBob = pay(alice, node.utxo, bob.publicKey, 50);
		const toCarol = pay(alice, node.utxo, carol.publicKey, 50);
		expect(toBob.inputs[0]?.txId).toBe(toCarol.inputs[0]?.txId ?? "");

		expect(node.submitTransaction(toBob)).toEqual({ status: "accepted" });
		const second = node.submitTransaction(toCarol);
		expect(second.status).toBe("rejected");
		expect(second.status === "rejected" ? second.reason : "").toContain("does not exist or was already spent");

		node.mine(alice.publicKey);
		expect(node.balance(bob.publicKey)).toBe(50);
		expect(node.balance(carol.publicKey)).toBe(0);
	});

	test("an output confirmed as spent cannot be spent again", () => {
		const node = newNode("a");
		node.mine(alice.publicKey);
		const before = node.utxo;
		accept(node, alice, bob, 50);
		node.mine(bob.publicKey);
		// Signed correctly by Alice, but built from the state before her payment was confirmed.
		const replay = pay(alice, before, carol.publicKey, 50);
		expect(node.submitTransaction(replay).status).toBe("rejected");
	});

	test("a block carrying two transactions that spend the same output is rejected", () => {
		const node = newNode("a");
		node.mine(alice.publicKey);
		const toBob = pay(alice, node.utxo, bob.publicKey, 50);
		const toCarol = pay(alice, node.utxo, carol.publicKey, 50);
		const block = mineBlock({
			height: 2,
			previousHash: node.tip.hash,
			timestamp: node.tip.header.timestamp,
			difficulty: node.rules.difficulty,
			transactions: [createCoinbase(2, alice.publicKey, 50), toBob, toCarol],
		});
		const result = node.receiveBlock(block);
		expect(result.status).toBe("rejected");
		expect(node.tip.header.height).toBe(1);
	});
});

describe("transaction rules", () => {
	test("nobody can spend an output with a key that does not own it", () => {
		const node = newNode("a");
		node.mine(alice.publicKey);
		const [key] = [...node.utxo.keys()];
		const txId = key?.split(":")[0] ?? "";
		// Mallory (played by Bob) points at the output of Alice and signs with his own key.
		const theft = createTransaction(bob, [{ txId, index: 0 }], [{ amount: 50, publicKey: bob.publicKey }]);
		const result = node.submitTransaction(theft);
		expect(result.status === "rejected" ? result.reason : "").toContain("invalid signature");
	});

	test("a transaction cannot create value, and a changed amount breaks the id", () => {
		const node = newNode("a");
		node.mine(alice.publicKey);
		const [key] = [...node.utxo.keys()];
		const txId = key?.split(":")[0] ?? "";
		const inflated = createTransaction(alice, [{ txId, index: 0 }], [{ amount: 51, publicKey: bob.publicKey }]);
		const first = node.submitTransaction(inflated);
		expect(first.status === "rejected" ? first.reason : "").toContain("exceed inputs");

		const honest = pay(alice, node.utxo, bob.publicKey, 5);
		const tampered = structuredClone(honest);
		const output = tampered.outputs[0];
		if (output === undefined) {
			throw new Error("payment has no output");
		}
		output.amount = 45;
		const second = node.submitTransaction(tampered);
		expect(second.status === "rejected" ? second.reason : "").toContain("id does not match");
		// Recomputing the id does not help: the signature was made over the old id.
		tampered.id = transactionId(tampered);
		const third = node.submitTransaction(tampered);
		expect(third.status === "rejected" ? third.reason : "").toContain("invalid signature");
	});

	test("the difference between inputs and outputs is the fee, collected by the miner", () => {
		const node = newNode("a");
		node.mine(alice.publicKey);
		accept(node, alice, bob, 20, 3);
		node.mine(carol.publicKey);
		expect(node.balance(alice.publicKey)).toBe(27);
		expect(node.balance(bob.publicKey)).toBe(20);
		expect(node.balance(carol.publicKey)).toBe(53);
	});
});

// MP-CHAIN-1.3, second half: a fork resolves to the longest chain.
describe("forks and the longest chain rule", () => {
	test("in a tie the node keeps the block it saw first, then switches to the longer branch", () => {
		const a = newNode("a");
		const b = newNode("b");
		const shared = a.mine(alice.publicKey);
		expect(b.receiveBlock(shared)).toEqual({ status: "added" });

		// Both mine a different block 2 at the same time: a fork.
		const blockA = a.mine(alice.publicKey);
		const blockB = b.mine(bob.publicKey);
		expect(blockA.hash).not.toBe(blockB.hash);
		expect(a.receiveBlock(blockB)).toEqual({ status: "ignored" });
		expect(b.receiveBlock(blockA)).toEqual({ status: "ignored" });
		expect(a.tip.hash).toBe(blockA.hash);
		expect(b.tip.hash).toBe(blockB.hash);

		// B finds block 3 first. For A that block is ahead and not on top of its tip.
		const blockB3 = b.mine(bob.publicKey);
		expect(a.receiveBlock(blockB3)).toEqual({ status: "need-chain" });
		expect(a.considerChain(b.chain)).toEqual({ adopted: true, replaced: 1 });
		expect(a.tip.hash).toBe(b.tip.hash);
		// The reward of the abandoned block 2 of A no longer exists.
		expect(a.balance(alice.publicKey)).toBe(50);
		expect(a.balance(bob.publicKey)).toBe(100);
	});

	test("a chain that is not longer is not adopted", () => {
		const a = newNode("a");
		const b = newNode("b");
		a.mine(alice.publicKey);
		b.mine(bob.publicKey);
		expect(a.considerChain(b.chain).adopted).toBe(false);
	});

	test("a longer chain with an invalid block is refused: length never beats validity", () => {
		const honest = newNode("honest");
		honest.mine(alice.publicKey);
		const attacker = newNode("attacker");
		attacker.mine(bob.publicKey);
		attacker.mine(bob.publicKey);
		attacker.mine(bob.publicKey);
		const forged = clone(attacker.chain);
		// Block 2 pays the miner twice the reward. The proof of work is redone for blocks 2 and 3.
		const second = forged[2];
		const third = forged[3];
		if (second === undefined || third === undefined) {
			throw new Error("attacker chain is too short");
		}
		const greedy = mineBlock({
			height: 2,
			previousHash: second.header.previousHash,
			timestamp: second.header.timestamp,
			difficulty: 2,
			transactions: [createCoinbase(2, bob.publicKey, 100)],
		});
		forged[2] = greedy;
		forged[3] = mineBlock({
			height: 3,
			previousHash: greedy.hash,
			timestamp: third.header.timestamp,
			difficulty: 2,
			transactions: third.transactions,
		});
		const result = honest.considerChain(forged);
		expect(result.adopted).toBe(false);
		expect(result.adopted ? "" : result.reason).toContain("exceeds reward plus fees");
		expect(honest.tip.header.height).toBe(1);
	});

	test("a transaction confirmed only on the abandoned branch returns to the pool", () => {
		const a = newNode("a");
		const b = newNode("b");
		const shared = a.mine(alice.publicKey);
		b.receiveBlock(shared);

		accept(a, alice, carol, 10);
		a.mine(alice.publicKey);
		expect(a.balance(carol.publicKey)).toBe(10);

		b.mine(bob.publicKey);
		b.mine(bob.publicKey);
		expect(a.considerChain(b.chain).adopted).toBe(true);
		// The payment lost its confirmation, but it is still valid on the new chain.
		expect(a.balance(carol.publicKey)).toBe(0);
		expect(a.mempool.length).toBe(1);
		a.mine(alice.publicKey);
		expect(a.balance(carol.publicKey)).toBe(10);
	});

	test("a reorganisation drops a pending payment that conflicts with the new chain", () => {
		const a = newNode("a");
		const b = newNode("b");
		const shared = a.mine(alice.publicKey);
		b.receiveBlock(shared);
		// Alice pays Bob on one side of a partition and Carol on the other, with the same coins.
		accept(a, alice, bob, 50);
		a.mine(alice.publicKey);
		accept(b, alice, carol, 50);
		b.mine(bob.publicKey);
		b.mine(bob.publicKey);
		expect(a.considerChain(b.chain).adopted).toBe(true);
		expect(a.mempool.length).toBe(0);
		expect(a.balance(carol.publicKey)).toBe(50);
		expect(a.balance(bob.publicKey)).toBe(100);
	});
});
