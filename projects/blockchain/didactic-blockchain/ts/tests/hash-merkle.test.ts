import { describe, expect, test } from "bun:test";
import { sha256Hex } from "../src/hash";
import { sign, verify, walletFromLabel } from "../src/keys";
import { merkleProof, merkleRoot, verifyMerkleProof } from "../src/merkle";

describe("sha256Hex", () => {
	test("matches the published test vectors", () => {
		expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
		expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
	});

	test("avalanche effect: one flipped bit changes about half of the 256 output bits", () => {
		const a = BigInt(`0x${sha256Hex("hello")}`);
		const b = BigInt(`0x${sha256Hex("Hello")}`);
		const differing = (a ^ b).toString(2).replaceAll("0", "").length;
		expect(differing).toBeGreaterThan(90);
		expect(differing).toBeLessThan(166);
	});
});

describe("Merkle tree", () => {
	const leaves = ["a", "b", "c", "d", "e"].map(sha256Hex);

	test("the root of one leaf is the leaf, and the root of two is the hash of the pair", () => {
		expect(merkleRoot(leaves.slice(0, 1))).toBe(leaves[0] ?? "");
		expect(merkleRoot(leaves.slice(0, 2))).toBe(sha256Hex((leaves[0] ?? "") + (leaves[1] ?? "")));
	});

	test("changing or reordering any leaf changes the root", () => {
		const root = merkleRoot(leaves);
		for (let i = 0; i < leaves.length; i++) {
			const changed = [...leaves];
			changed[i] = sha256Hex(`tampered ${i}`);
			expect(merkleRoot(changed)).not.toBe(root);
		}
		expect(merkleRoot([...leaves].reverse())).not.toBe(root);
	});

	test("every leaf has a proof that verifies, with one hash per level", () => {
		for (const size of [1, 2, 3, 5, 8, 13]) {
			const list = Array.from({ length: size }, (_, i) => sha256Hex(`tx ${i}`));
			const root = merkleRoot(list);
			list.forEach((leaf, index) => {
				const proof = merkleProof(list, index);
				expect(proof.length).toBe(Math.ceil(Math.log2(size)));
				expect(verifyMerkleProof(leaf, proof, root)).toBe(true);
				expect(verifyMerkleProof(sha256Hex("not in the block"), proof, root)).toBe(false);
			});
		}
	});

	test("known limit: an odd list and the same list with its last leaf repeated share a root", () => {
		const three = leaves.slice(0, 3);
		expect(merkleRoot([...three, three[2] ?? ""])).toBe(merkleRoot(three));
	});
});

describe("signatures", () => {
	const alice = walletFromLabel("alice");
	const mallory = walletFromLabel("mallory");

	test("a signature verifies only with the matching public key and the exact message", () => {
		const signature = sign(alice, "pay 5 to bob");
		expect(verify(alice.publicKey, "pay 5 to bob", signature)).toBe(true);
		expect(verify(alice.publicKey, "pay 50 to bob", signature)).toBe(false);
		expect(verify(mallory.publicKey, "pay 5 to bob", signature)).toBe(false);
	});

	test("malformed keys and signatures are invalid, not exceptions", () => {
		expect(verify("not-a-key", "message", "00")).toBe(false);
		expect(verify(alice.publicKey, "message", "zz")).toBe(false);
	});
});
