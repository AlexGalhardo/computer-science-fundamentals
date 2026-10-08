import { sha256Hex } from "./hash";

// EN: A Merkle tree summarises a list of transaction ids in one hash, the root. Each level
//     hashes its nodes in pairs until one node is left. Only the root goes into the block
//     header, so the header has a fixed size and still depends on every transaction.
//     Convention used here (the one Bitcoin uses): a level with an odd number of nodes
//     duplicates its last node. A parent is the hash of the two children's hex texts joined.
// PT: Uma árvore de Merkle resume uma lista de ids de transação em um único hash, a raiz. Cada
//     nível faz o hash dos nós aos pares até sobrar um. Só a raiz vai para o cabeçalho do bloco,
//     então o cabeçalho tem tamanho fixo e ainda assim depende de todas as transações.
//     Convenção usada aqui (a mesma do Bitcoin): um nível com número ímpar de nós duplica o
//     último. Um pai é o hash dos textos hexadecimais dos dois filhos concatenados.
function nextLevel(level: readonly string[]): string[] {
	const parents: string[] = [];
	for (let i = 0; i < level.length; i += 2) {
		const left = level[i] ?? "";
		const right = level[i + 1] ?? left;
		parents.push(sha256Hex(left + right));
	}
	return parents;
}

export function merkleRoot(leaves: readonly string[]): string {
	if (leaves.length === 0) {
		return sha256Hex("");
	}
	let level = [...leaves];
	while (level.length > 1) {
		level = nextLevel(level);
	}
	return level[0] ?? "";
}

/** One step of an inclusion proof: the sibling hash and the side it sits on. */
export interface ProofStep {
	hash: string;
	side: "left" | "right";
}

// EN: An inclusion proof (Merkle branch) is the list of siblings on the path from a leaf to the
//     root: one hash per level, so about log2(n) hashes for n transactions. This is what lets a
//     light client check that a transaction is in a block while keeping only block headers.
// PT: Uma prova de inclusão (ramo de Merkle) é a lista de irmãos no caminho de uma folha até a
//     raiz: um hash por nível, ou seja, cerca de log2(n) hashes para n transações. É o que
//     permite a um cliente leve conferir que uma transação está em um bloco guardando apenas os
//     cabeçalhos.
export function merkleProof(leaves: readonly string[], index: number): ProofStep[] {
	if (!Number.isInteger(index) || index < 0 || index >= leaves.length) {
		throw new RangeError(`leaf index ${index} is outside the list of ${leaves.length} leaves`);
	}
	const proof: ProofStep[] = [];
	let level = [...leaves];
	let position = index;
	while (level.length > 1) {
		const isRight = position % 2 === 1;
		const siblingIndex = isRight ? position - 1 : position + 1;
		const sibling = level[siblingIndex] ?? level[position] ?? "";
		proof.push({ hash: sibling, side: isRight ? "left" : "right" });
		level = nextLevel(level);
		position = Math.floor(position / 2);
	}
	return proof;
}

export function verifyMerkleProof(leaf: string, proof: readonly ProofStep[], root: string): boolean {
	let current = leaf;
	for (const step of proof) {
		current = step.side === "left" ? sha256Hex(step.hash + current) : sha256Hex(current + step.hash);
	}
	return current === root;
}
