import type { Block } from "../src/block";
import type { ChainRules } from "../src/chain";
import { type Wallet, walletFromLabel } from "../src/keys";
import { ChainNode } from "../src/node";
import { pay } from "../src/transaction";

// EN: Difficulty 2 (256 attempts per block on average) keeps every test well under a second.
// PT: Dificuldade 2 (256 tentativas por bloco, em média) mantém cada teste bem abaixo de um
//     segundo.
export const RULES: ChainRules = { difficulty: 2, reward: 50 };

export const alice: Wallet = walletFromLabel("alice");
export const bob: Wallet = walletFromLabel("bob");
export const carol: Wallet = walletFromLabel("carol");

/** A node with a fixed clock, so the blocks it mines are the same on every run. */
export function newNode(name: string): ChainNode {
	return new ChainNode(name, RULES, () => 1_700_000_000);
}

export function accept(node: ChainNode, from: Wallet, to: Wallet, value: number, fee = 0): void {
	const result = node.submitTransaction(pay(from, node.utxo, to.publicKey, value, fee));
	if (result.status !== "accepted") {
		throw new Error(`fixture transaction was not accepted: ${JSON.stringify(result)}`);
	}
}

// EN: A small history used by several tests: 3 mined blocks and 3 payments.
//     Block 1: Alice mines (50). Block 2: Alice pays Bob 20 with fee 1, Bob mines.
//     Block 3: Bob pays Carol 5 and Alice pays Carol 7, Alice mines.
// PT: Um pequeno histórico usado por vários testes: 3 blocos minerados e 3 pagamentos.
//     Bloco 1: Alice minera (50). Bloco 2: Alice paga 20 a Bob com taxa 1, Bob minera.
//     Bloco 3: Bob paga 5 a Carol e Alice paga 7 a Carol, Alice minera.
export function sampleNode(): ChainNode {
	const node = newNode("sample");
	node.mine(alice.publicKey);
	accept(node, alice, bob, 20, 1);
	node.mine(bob.publicKey);
	accept(node, bob, carol, 5);
	accept(node, alice, carol, 7);
	node.mine(alice.publicKey);
	return node;
}

export function clone(chain: readonly Block[]): Block[] {
	return structuredClone([...chain]);
}
