import { z } from "zod";
import { sha256Hex } from "./hash";
import { sign, verify, type Wallet } from "./keys";

const hex64 = z.string().regex(/^[0-9a-f]{64}$/, "must be 64 hexadecimal digits");
const amount = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

// EN: Shapes of the data that arrives from other nodes. Everything received over HTTP is parsed
//     with these schemas before any rule of the chain looks at it.
// PT: Formatos dos dados que chegam de outros nós. Tudo o que é recebido por HTTP passa por
//     estes schemas antes de qualquer regra da cadeia olhar para ele.
// ES: Formatos de los datos que llegan de otros nodos. Todo lo que se recibe por HTTP pasa por
//     estos schemas antes de que cualquier regla de la cadena lo mire.
export const txInputSchema = z.strictObject({
	txId: hex64,
	index: z.number().int().nonnegative(),
	signature: z.string().regex(/^[0-9a-f]{128}$/, "must be a 64-byte signature in hexadecimal"),
});
export const txOutputSchema = z.strictObject({ amount, publicKey: hex64 });
export const transactionSchema = z.strictObject({
	id: hex64,
	/** Height of the block for a coin-creation transaction, `null` for an ordinary one. */
	coinbase: z.number().int().nonnegative().nullable(),
	inputs: z.array(txInputSchema).max(100),
	outputs: z.array(txOutputSchema).min(1).max(100),
});

export type TxInput = z.infer<typeof txInputSchema>;
export type TxOutput = z.infer<typeof txOutputSchema>;
export type Transaction = z.infer<typeof transactionSchema>;

// EN: The state of the system is the set of unspent transaction outputs (UTXO). There are no
//     accounts and no stored balances: a "balance" is the sum of the outputs a key can spend.
//     The map key is the outpoint, "<transaction id>:<output index>".
// PT: O estado do sistema é o conjunto de saídas de transação não gastas (UTXO). Não há contas
//     nem saldos guardados: um "saldo" é a soma das saídas que uma chave consegue gastar. A
//     chave do mapa é o outpoint, "<id da transação>:<índice da saída>".
// ES: El estado del sistema es el conjunto de salidas de transacción no gastadas (UTXO). No hay
//     cuentas ni saldos guardados: un "saldo" es la suma de las salidas que una clave puede
//     gastar. La clave del mapa es el outpoint, "<id de la transacción>:<índice de la salida>".
export type Utxo = Map<string, TxOutput>;

export function outpoint(txId: string, index: number): string {
	return `${txId}:${index}`;
}

// EN: The id is the hash of everything the transaction says, except the signatures: which
//     outputs it spends and which outputs it creates. Signing the id therefore authorises
//     exactly this transfer, and changing any amount or recipient gives another id, for which
//     the old signatures are useless.
// PT: O id é o hash de tudo o que a transação diz, menos as assinaturas: quais saídas ela gasta
//     e quais saídas ela cria. Assinar o id, portanto, autoriza exatamente esta transferência,
//     e mudar qualquer valor ou destinatário dá outro id, para o qual as assinaturas antigas não
//     servem.
// ES: El id es el hash de todo lo que dice la transacción, menos las firmas: qué salidas gasta
//     y qué salidas crea. Firmar el id, por tanto, autoriza exactamente esta transferencia, y
//     cambiar cualquier valor o destinatario da otro id, para el cual las firmas antiguas no
//     sirven.
export function transactionId(tx: Pick<Transaction, "coinbase" | "inputs" | "outputs">): string {
	return sha256Hex(
		JSON.stringify({
			coinbase: tx.coinbase,
			inputs: tx.inputs.map((input) => [input.txId, input.index]),
			outputs: tx.outputs.map((output) => [output.amount, output.publicKey]),
		}),
	);
}

export interface Spend {
	txId: string;
	index: number;
}

/** Builds a transaction whose inputs all belong to `wallet`, and signs each of them. */
export function createTransaction(wallet: Wallet, spends: readonly Spend[], outputs: readonly TxOutput[]): Transaction {
	const unsigned = {
		coinbase: null,
		inputs: spends.map((spend) => ({ txId: spend.txId, index: spend.index, signature: "" })),
		outputs: outputs.map((output) => ({ ...output })),
	};
	const id = transactionId(unsigned);
	const signature = sign(wallet, id);
	return { id, ...unsigned, inputs: unsigned.inputs.map((input) => ({ ...input, signature })) };
}

// EN: The first transaction of a block creates new coins for the miner: the block reward plus
//     the fees. It spends nothing, so it has no inputs. The height is part of it only to give
//     each block's coin-creation transaction a different id.
// PT: A primeira transação de um bloco cria moedas novas para o minerador: a recompensa do
//     bloco mais as taxas. Ela não gasta nada, então não tem entradas. A altura faz parte dela
//     só para que a transação de criação de cada bloco tenha um id diferente.
// ES: La primera transacción de un bloque crea monedas nuevas para el minero: la recompensa del
//     bloque más las comisiones. No gasta nada, así que no tiene entradas. La altura forma
//     parte de ella solo para que la transacción de creación de cada bloque tenga un id
//     distinto.
export function createCoinbase(height: number, minerPublicKey: string, value: number): Transaction {
	const body = { coinbase: height, inputs: [], outputs: [{ amount: value, publicKey: minerPublicKey }] };
	return { id: transactionId(body), ...body };
}

export type TxCheck = { ok: true; fee: number } | { ok: false; reason: string };

// EN: The rules an ordinary transaction must obey against the current UTXO set:
//     1. its id is the hash of its content;
//     2. every input points to an output that exists and was not spent (this is what rejects a
//        double spend), and no output is used twice inside the transaction;
//     3. every input is signed by the key of THE OUTPUT IT SPENDS, not by a key the spender
//        supplies;
//     4. it does not create value: outputs add up to at most the inputs. The difference is the
//        fee, which the miner of the block may collect.
// PT: As regras que uma transação comum precisa obedecer contra o conjunto UTXO atual:
//     1. o id é o hash do conteúdo;
//     2. toda entrada aponta para uma saída que existe e não foi gasta (é isto que rejeita um
//        gasto duplo), e nenhuma saída é usada duas vezes dentro da transação;
//     3. toda entrada é assinada pela chave DA SAÍDA QUE ELA GASTA, não por uma chave informada
//        por quem gasta;
//     4. ela não cria valor: as saídas somam no máximo o total das entradas. A diferença é a
//        taxa, que o minerador do bloco pode recolher.
// ES: Las reglas que una transacción común debe cumplir contra el conjunto UTXO actual:
//     1. su id es el hash de su contenido;
//     2. cada entrada apunta a una salida que existe y no se ha gastado (esto es lo que rechaza
//        un doble gasto), y ninguna salida se usa dos veces dentro de la transacción;
//     3. cada entrada está firmada por la clave DE LA SALIDA QUE GASTA, no por una clave que
//        aporte quien gasta;
//     4. no crea valor: las salidas suman como máximo el total de las entradas. La diferencia
//        es la comisión, que el minero del bloque puede cobrar.
export function checkTransaction(tx: Transaction, utxo: Utxo): TxCheck {
	if (tx.coinbase !== null) {
		return { ok: false, reason: "a coin-creation transaction is only valid as the first one of a block" };
	}
	if (tx.id !== transactionId(tx)) {
		return { ok: false, reason: "transaction id does not match its content" };
	}
	if (tx.inputs.length === 0) {
		return { ok: false, reason: "transaction has no inputs" };
	}
	const seen = new Set<string>();
	let totalIn = 0;
	for (const input of tx.inputs) {
		const key = outpoint(input.txId, input.index);
		if (seen.has(key)) {
			return { ok: false, reason: `output ${key} is spent twice in the same transaction` };
		}
		seen.add(key);
		const spent = utxo.get(key);
		if (spent === undefined) {
			return { ok: false, reason: `output ${key} does not exist or was already spent` };
		}
		if (!verify(spent.publicKey, tx.id, input.signature)) {
			return { ok: false, reason: `invalid signature for output ${key}` };
		}
		totalIn += spent.amount;
	}
	let totalOut = 0;
	for (const output of tx.outputs) {
		if (!Number.isSafeInteger(output.amount) || output.amount <= 0) {
			return { ok: false, reason: "output amounts must be positive integers" };
		}
		totalOut += output.amount;
	}
	if (totalOut > totalIn) {
		return { ok: false, reason: `outputs (${totalOut}) exceed inputs (${totalIn})` };
	}
	return { ok: true, fee: totalIn - totalOut };
}

/** Removes the spent outputs from the set and adds the new ones. */
export function applyTransaction(tx: Transaction, utxo: Utxo): void {
	for (const input of tx.inputs) {
		utxo.delete(outpoint(input.txId, input.index));
	}
	tx.outputs.forEach((output, index) => {
		utxo.set(outpoint(tx.id, index), output);
	});
}

export function balanceOf(utxo: Utxo, publicKey: string): number {
	let total = 0;
	for (const output of utxo.values()) {
		if (output.publicKey === publicKey) {
			total += output.amount;
		}
	}
	return total;
}

// EN: What a wallet does to pay: pick enough of its own unspent outputs, pay the recipient and
//     send the rest back to itself as change. An output is always spent whole, so without the
//     change output the remainder would become a fee.
// PT: O que uma carteira faz para pagar: escolhe saídas próprias não gastas suficientes, paga o
//     destinatário e devolve o resto para si mesma como troco. Uma saída é sempre gasta por
//     inteiro, então sem a saída de troco o restante viraria taxa.
// ES: Lo que hace una billetera para pagar: elige suficientes salidas propias no gastadas, paga
//     al destinatario y se devuelve el resto a sí misma como cambio. Una salida siempre se
//     gasta completa, así que sin la salida de cambio el resto se volvería comisión.
export function pay(wallet: Wallet, utxo: Utxo, toPublicKey: string, value: number, fee = 0): Transaction {
	const spends: Spend[] = [];
	let gathered = 0;
	for (const [key, output] of utxo) {
		if (output.publicKey !== wallet.publicKey) {
			continue;
		}
		const separator = key.lastIndexOf(":");
		spends.push({ txId: key.slice(0, separator), index: Number(key.slice(separator + 1)) });
		gathered += output.amount;
		if (gathered >= value + fee) {
			break;
		}
	}
	if (gathered < value + fee) {
		throw new Error(`insufficient funds: has ${gathered}, needs ${value + fee}`);
	}
	const outputs: TxOutput[] = [{ amount: value, publicKey: toPublicKey }];
	const change = gathered - value - fee;
	if (change > 0) {
		outputs.push({ amount: change, publicKey: wallet.publicKey });
	}
	return createTransaction(wallet, spends, outputs);
}
