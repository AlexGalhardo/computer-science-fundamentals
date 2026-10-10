import { type Block, headerHash, meetsDifficulty } from "./block";
import { merkleRoot } from "./merkle";
import { applyTransaction, checkTransaction, transactionId, type Utxo } from "./transaction";

export interface ChainRules {
	/** Zero hexadecimal digits every block hash must start with. */
	difficulty: number;
	/** New coins the first transaction of a block may create, besides the fees. */
	reward: number;
}

export const DEFAULT_RULES: ChainRules = { difficulty: 3, reward: 50 };

// EN: The genesis block is the fixed starting point every node already has. It has no
//     transactions and no proof of work, and it is recognised by its hash.
// PT: O bloco gênese é o ponto de partida fixo que todo nó já tem. Ele não tem transações nem
//     prova de trabalho, e é reconhecido pelo seu hash.
// ES: El bloque génesis es el punto de partida fijo que todo nodo ya tiene. No tiene
//     transacciones ni prueba de trabajo, y se reconoce por su hash.
const GENESIS_HEADER = {
	height: 0,
	previousHash: "0".repeat(64),
	merkleRoot: merkleRoot([]),
	timestamp: 0,
	difficulty: 0,
	nonce: 0,
};
export const GENESIS: Block = { header: GENESIS_HEADER, hash: headerHash(GENESIS_HEADER), transactions: [] };

export type Check = { ok: true } | { ok: false; reason: string };

// EN: Every rule a block must obey to extend the chain. A node runs all of them by itself for
//     every block it receives: proof of work shows that effort was spent, not that the content
//     is honest. On success the UTXO set passed in is updated; on failure it must be thrown
//     away, because it may be half updated (callers pass a copy).
// PT: Todas as regras que um bloco precisa obedecer para estender a cadeia. Um nó executa todas
//     elas por conta própria para cada bloco que recebe: a prova de trabalho mostra que houve
//     esforço, não que o conteúdo é honesto. Em caso de sucesso o conjunto UTXO recebido é
//     atualizado; em caso de falha ele deve ser descartado, pois pode estar atualizado pela
//     metade (quem chama passa uma cópia).
// ES: Todas las reglas que un bloque debe cumplir para extender la cadena. Un nodo las ejecuta
//     todas por su cuenta para cada bloque que recibe: la prueba de trabajo muestra que hubo
//     esfuerzo, no que el contenido sea honesto. Si tiene éxito, el conjunto UTXO recibido se
//     actualiza; si falla, debe descartarse, pues puede quedar actualizado a medias (quien
//     llama pasa una copia).
export function validateBlock(block: Block, previous: Block, utxo: Utxo, rules: ChainRules): Check {
	const { header } = block;
	if (header.height !== previous.header.height + 1) {
		return { ok: false, reason: "height is not the previous height plus one" };
	}
	if (header.previousHash !== previous.hash) {
		return { ok: false, reason: "previous hash does not match the hash of the previous block" };
	}
	if (header.timestamp < previous.header.timestamp) {
		return { ok: false, reason: "timestamp is earlier than the previous block" };
	}
	if (header.difficulty !== rules.difficulty) {
		return { ok: false, reason: `difficulty must be ${rules.difficulty}` };
	}
	if (block.hash !== headerHash(header)) {
		return { ok: false, reason: "block hash does not match its header" };
	}
	if (!meetsDifficulty(block.hash, rules.difficulty)) {
		return { ok: false, reason: "block hash does not meet the difficulty (no proof of work)" };
	}
	// EN: A transaction id must be the hash of the transaction content. Without this check
	//     someone could change an amount and keep the old id, and the Merkle root, which is
	//     built from the ids, would still match.
	// PT: O id de uma transação precisa ser o hash do conteúdo dela. Sem esta checagem alguém
	//     poderia mudar um valor e manter o id antigo, e a raiz de Merkle, que é construída a
	//     partir dos ids, continuaria conferindo.
	// ES: El id de una transacción debe ser el hash de su contenido. Sin esta verificación
	//     alguien podría cambiar un valor y mantener el id antiguo, y la raíz de Merkle, que se
	//     construye a partir de los ids, seguiría coincidiendo.
	if (block.transactions.some((tx) => tx.id !== transactionId(tx))) {
		return { ok: false, reason: "transaction id does not match its content" };
	}
	const ids = block.transactions.map((tx) => tx.id);
	if (header.merkleRoot !== merkleRoot(ids)) {
		return { ok: false, reason: "Merkle root does not match the transactions" };
	}
	// EN: With the "duplicate the last node" convention, the lists [A, B, C] and [A, B, C, C]
	//     have the same Merkle root. Rejecting repeated ids closes that ambiguity.
	// PT: Com a convenção de "duplicar o último nó", as listas [A, B, C] e [A, B, C, C] têm a
	//     mesma raiz de Merkle. Rejeitar ids repetidos fecha essa ambiguidade.
	// ES: Con la convención de "duplicar el último nodo", las listas [A, B, C] y [A, B, C, C]
	//     tienen la misma raíz de Merkle. Rechazar ids repetidos cierra esa ambigüedad.
	if (new Set(ids).size !== ids.length) {
		return { ok: false, reason: "block contains the same transaction twice" };
	}
	const [coinbase, ...ordinary] = block.transactions;
	if (coinbase === undefined || coinbase.coinbase !== header.height || coinbase.inputs.length !== 0) {
		return { ok: false, reason: "first transaction must be the coin-creation transaction of this height" };
	}
	// EN: Ordinary transactions are applied one by one, so the second transaction of a block
	//     that spends an output already spent by the first one is rejected here too.
	// PT: As transações comuns são aplicadas uma a uma, então a segunda transação de um bloco
	//     que gasta uma saída já gasta pela primeira também é rejeitada aqui.
	// ES: Las transacciones comunes se aplican una a una, así que la segunda transacción de un
	//     bloque que gasta una salida ya gastada por la primera también se rechaza aquí.
	let fees = 0;
	for (const tx of ordinary) {
		const result = checkTransaction(tx, utxo);
		if (!result.ok) {
			return { ok: false, reason: `transaction ${tx.id.slice(0, 8)}: ${result.reason}` };
		}
		fees += result.fee;
		applyTransaction(tx, utxo);
	}
	// EN: The only place where coins are created, and the limit is a validity rule: a miner with
	//     any amount of computing power cannot pay itself more than reward plus fees.
	// PT: O único lugar em que moedas são criadas, e o limite é uma regra de validade: um
	//     minerador com qualquer poder computacional não consegue pagar a si mesmo mais que a
	//     recompensa mais as taxas.
	// ES: El único lugar donde se crean monedas, y el límite es una regla de validez: un minero
	//     con cualquier poder de cómputo no puede pagarse a sí mismo más que la recompensa más
	//     las comisiones.
	const created = coinbase.outputs.reduce((sum, output) => sum + output.amount, 0);
	if (created > rules.reward + fees) {
		return { ok: false, reason: `coin creation of ${created} exceeds reward plus fees (${rules.reward + fees})` };
	}
	applyTransaction(coinbase, utxo);
	return { ok: true };
}

export type ChainCheck = { ok: true; utxo: Utxo } | { ok: false; height: number; reason: string };

// EN: Replays a whole chain from the genesis block and returns the resulting UTXO set. This is
//     what makes the chain tamper-evident: change one transaction anywhere and the Merkle root
//     of its block no longer matches; fix the root and the block hash changes, which breaks the
//     proof of work and the link from the next block.
// PT: Reexecuta uma cadeia inteira a partir do bloco gênese e devolve o conjunto UTXO
//     resultante. É isto que torna a adulteração evidente: mude uma transação em qualquer lugar
//     e a raiz de Merkle do bloco deixa de conferir; conserte a raiz e o hash do bloco muda, o
//     que quebra a prova de trabalho e a ligação a partir do bloco seguinte.
// ES: Reejecuta una cadena entera desde el bloque génesis y devuelve el conjunto UTXO
//     resultante. Esto es lo que vuelve evidente la manipulación: cambia una transacción en
//     cualquier lugar y la raíz de Merkle del bloque deja de coincidir; arregla la raíz y el
//     hash del bloque cambia, lo que rompe la prueba de trabajo y el enlace desde el bloque
//     siguiente.
export function validateChain(blocks: readonly Block[], rules: ChainRules): ChainCheck {
	const first = blocks[0];
	if (first === undefined || first.hash !== GENESIS.hash || headerHash(first.header) !== GENESIS.hash) {
		return { ok: false, height: 0, reason: "chain does not start at the genesis block" };
	}
	if (first.transactions.length !== 0) {
		return { ok: false, height: 0, reason: "genesis block must have no transactions" };
	}
	const utxo: Utxo = new Map();
	let previous = first;
	for (const block of blocks.slice(1)) {
		const result = validateBlock(block, previous, utxo, rules);
		if (!result.ok) {
			return { ok: false, height: previous.header.height + 1, reason: result.reason };
		}
		previous = block;
	}
	return { ok: true, utxo };
}
