import { type Block, mineBlock } from "./block";
import { type ChainRules, DEFAULT_RULES, GENESIS, validateBlock, validateChain } from "./chain";
import {
	applyTransaction,
	balanceOf,
	checkTransaction,
	createCoinbase,
	outpoint,
	type Transaction,
	type Utxo,
} from "./transaction";

export type TxResult = { status: "accepted" } | { status: "known" } | { status: "rejected"; reason: string };

export type BlockResult =
	| { status: "added" }
	| { status: "known" }
	/** Not on top of our tip and not ahead of us: a stale block or a tie. First seen wins. */
	| { status: "ignored" }
	/** Ahead of our tip but not built on it: we missed blocks, or the sender is on another branch. */
	| { status: "need-chain" }
	| { status: "rejected"; reason: string };

export type ChainResult = { adopted: true; replaced: number } | { adopted: false; reason: string };

// EN: One participant of the network: its copy of the chain, the UTXO set that results from it
//     and the pool of valid transactions waiting for a block. It has no network code, so the
//     rules can be tested in memory; `server.ts` puts HTTP around it.
// PT: Um participante da rede: sua cópia da cadeia, o conjunto UTXO que resulta dela e a fila de
//     transações válidas esperando um bloco. Ele não tem código de rede, então as regras podem
//     ser testadas em memória; o `server.ts` coloca HTTP em volta dele.
export class ChainNode {
	private blocks: Block[] = [GENESIS];
	private unspent: Utxo = new Map();
	private readonly pending = new Map<string, Transaction>();

	constructor(
		readonly name: string,
		readonly rules: ChainRules = DEFAULT_RULES,
		private readonly clock: () => number = () => Math.floor(Date.now() / 1000),
	) {}

	get chain(): readonly Block[] {
		return this.blocks;
	}

	get tip(): Block {
		return this.blocks[this.blocks.length - 1] ?? GENESIS;
	}

	get utxo(): Utxo {
		return new Map(this.unspent);
	}

	get mempool(): Transaction[] {
		return [...this.pending.values()];
	}

	balance(publicKey: string): number {
		return balanceOf(this.unspent, publicKey);
	}

	// EN: The UTXO set as this node sees it for NEW transactions: what the chain left unspent,
	//     minus what the pending transactions already spend. This is the "first seen" rule: a
	//     second transaction spending the same output finds it gone and is rejected.
	// PT: O conjunto UTXO como este nó o vê para transações NOVAS: o que a cadeia deixou sem
	//     gastar, menos o que as transações pendentes já gastam. Esta é a regra do "primeiro
	//     visto": uma segunda transação que gasta a mesma saída não a encontra e é rejeitada.
	private utxoAfterPending(): Utxo {
		const view: Utxo = new Map(this.unspent);
		for (const tx of this.pending.values()) {
			for (const input of tx.inputs) {
				view.delete(outpoint(input.txId, input.index));
			}
		}
		return view;
	}

	submitTransaction(tx: Transaction): TxResult {
		if (this.pending.has(tx.id)) {
			return { status: "known" };
		}
		const result = checkTransaction(tx, this.utxoAfterPending());
		if (!result.ok) {
			return { status: "rejected", reason: result.reason };
		}
		this.pending.set(tx.id, tx);
		return { status: "accepted" };
	}

	// EN: Collect the pending transactions, add the coin-creation transaction that pays reward
	//     plus fees to the miner, find the proof of work and extend the own chain.
	// PT: Reúne as transações pendentes, acrescenta a transação de criação de moeda que paga a
	//     recompensa mais as taxas ao minerador, acha a prova de trabalho e estende a própria
	//     cadeia.
	mine(minerPublicKey: string): Block {
		const included: Transaction[] = [];
		const view: Utxo = new Map(this.unspent);
		let fees = 0;
		for (const tx of this.pending.values()) {
			const result = checkTransaction(tx, view);
			if (result.ok) {
				applyTransaction(tx, view);
				included.push(tx);
				fees += result.fee;
			}
		}
		const height = this.tip.header.height + 1;
		const coinbase = createCoinbase(height, minerPublicKey, this.rules.reward + fees);
		const block = mineBlock({
			height,
			previousHash: this.tip.hash,
			timestamp: Math.max(this.clock(), this.tip.header.timestamp),
			difficulty: this.rules.difficulty,
			transactions: [coinbase, ...included],
		});
		const result = this.receiveBlock(block);
		if (result.status !== "added") {
			throw new Error(`own block was not accepted: ${JSON.stringify(result)}`);
		}
		return block;
	}

	receiveBlock(block: Block): BlockResult {
		const known = this.blocks[block.header.height];
		if (known !== undefined && known.hash === block.hash) {
			return { status: "known" };
		}
		if (block.header.previousHash !== this.tip.hash) {
			// EN: A block at our height or below would at best tie with our chain, and in a tie a
			//     node keeps working on the block it saw first. A block further ahead means a
			//     longer chain may exist, so the caller asks the sender for the whole chain.
			// PT: Um bloco na nossa altura ou abaixo, no máximo, empata com a nossa cadeia, e em
			//     um empate o nó continua no bloco que viu primeiro. Um bloco mais à frente
			//     indica que pode existir uma cadeia mais longa, então quem chama pede a cadeia
			//     inteira a quem enviou.
			return block.header.height > this.tip.header.height ? { status: "need-chain" } : { status: "ignored" };
		}
		const next: Utxo = new Map(this.unspent);
		const result = validateBlock(block, this.tip, next, this.rules);
		if (!result.ok) {
			return { status: "rejected", reason: result.reason };
		}
		this.blocks.push(block);
		this.unspent = next;
		this.refillPool(this.mempool);
		return { status: "added" };
	}

	// EN: The longest chain rule. A candidate replaces the own chain only if it is strictly
	//     longer AND valid from the genesis block: length never makes an invalid chain
	//     acceptable. Every block here has the same difficulty, so "longest" and "most
	//     accumulated work" are the same thing; with variable difficulty a node must add up the
	//     work instead of counting blocks.
	// PT: A regra da cadeia mais longa. Uma candidata substitui a cadeia própria só se for
	//     estritamente mais longa E válida desde o bloco gênese: o comprimento nunca torna
	//     aceitável uma cadeia inválida. Todo bloco aqui tem a mesma dificuldade, então "mais
	//     longa" e "com mais trabalho acumulado" são a mesma coisa; com dificuldade variável um
	//     nó precisa somar o trabalho em vez de contar blocos.
	considerChain(candidate: readonly Block[]): ChainResult {
		if (candidate.length <= this.blocks.length) {
			return { adopted: false, reason: "candidate chain is not longer than the current one" };
		}
		const result = validateChain(candidate, this.rules);
		if (!result.ok) {
			return { adopted: false, reason: `invalid block at height ${result.height}: ${result.reason}` };
		}
		const abandoned = this.blocks.filter((block, height) => candidate[height]?.hash !== block.hash);
		// EN: Transactions that were confirmed only on the abandoned branch are not lost: they go
		//     back to the pool and can enter a future block, unless the new chain already spent
		//     their inputs.
		// PT: As transações que só estavam confirmadas no ramo abandonado não se perdem: voltam
		//     para a fila e podem entrar em um bloco futuro, a menos que a nova cadeia já tenha
		//     gasto as entradas delas.
		const orphaned = abandoned.flatMap((block) => block.transactions.filter((tx) => tx.coinbase === null));
		const waiting = this.mempool;
		this.blocks = [...candidate];
		this.unspent = result.utxo;
		this.refillPool([...orphaned, ...waiting]);
		return { adopted: true, replaced: abandoned.length };
	}

	/** Rebuilds the pool against the current chain, dropping what became confirmed or invalid. */
	private refillPool(candidates: readonly Transaction[]): void {
		this.pending.clear();
		for (const tx of candidates) {
			this.submitTransaction(tx);
		}
	}
}
