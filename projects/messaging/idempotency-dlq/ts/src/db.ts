// EN: The side effect of this lab is a credit in an account: a relative update (`balance +
//     amount`), which is NOT idempotent by nature. Applying the same message twice credits twice,
//     and the `ledger` table keeps one row per applied effect so the tests can count them.
// PT: O efeito colateral deste laboratório é um crédito em uma conta: uma atualização relativa
//     (`balance + amount`), que NÃO é idempotente por natureza. Aplicar a mesma mensagem duas
//     vezes credita duas vezes, e a tabela `ledger` guarda uma linha por efeito aplicado para os
//     testes poderem contar.
// ES: El efecto secundario de este laboratorio es un crédito en una cuenta: una actualización
//     relativa (`balance + amount`), que NO es idempotente por naturaleza. Aplicar el mismo mensaje
//     dos veces acredita dos veces, y la tabla `ledger` guarda una fila por efecto aplicado para
//     que las pruebas puedan contarlos.

import { Pool, type PoolClient } from "pg";
import type { Payment } from "./core";

export const ACCOUNT = "account-1";

export async function connectDb(url: string): Promise<Pool> {
	const pool = new Pool({ connectionString: url, max: 20 });
	await pool.query(`
		CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY,
			balance_cents BIGINT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS ledger (
			entry BIGSERIAL PRIMARY KEY,
			message_id TEXT NOT NULL,
			account_id TEXT NOT NULL REFERENCES accounts (id),
			amount_cents BIGINT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS processed_messages (
			message_id TEXT PRIMARY KEY,
			processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
	`);
	return pool;
}

export async function resetDb(pool: Pool): Promise<void> {
	await pool.query("TRUNCATE ledger, processed_messages, accounts");
	await pool.query("INSERT INTO accounts (id, balance_cents) VALUES ($1, 0)", [ACCOUNT]);
}

async function credit(client: PoolClient, payment: Payment): Promise<void> {
	const updated = await client.query("UPDATE accounts SET balance_cents = balance_cents + $1 WHERE id = $2", [
		payment.amountCents,
		payment.accountId,
	]);
	if (updated.rowCount !== 1) {
		// EN: An unknown account never becomes known by waiting. In this lab it plays the
		//     poisoned message: it fails on every attempt.
		// PT: Uma conta desconhecida nunca passa a existir por esperar. Neste laboratório ela faz
		//     o papel da mensagem envenenada: falha em toda tentativa.
		// ES: Una cuenta desconocida nunca pasa a existir por esperar. En este laboratorio hace
		//     el papel del mensaje envenenado: falla en cada intento.
		throw new Error(`unknown account ${payment.accountId}`);
	}
	await client.query("INSERT INTO ledger (message_id, account_id, amount_cents) VALUES ($1, $2, $3)", [
		payment.id,
		payment.accountId,
		payment.amountCents,
	]);
}

async function inTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const result = await work(client);
		await client.query("COMMIT");
		return result;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export type Outcome = "applied" | "duplicate";

// EN: No protection: every delivery applies the effect. Correct only if each message arrives
//     exactly once, which no broker promises.
// PT: Sem proteção: toda entrega aplica o efeito. Só é correto se cada mensagem chegar exatamente
//     uma vez, o que nenhum broker promete.
// ES: Sin protección: toda entrega aplica el efecto. Solo es correcto si cada mensaje llega
//     exactamente una vez, algo que ningún broker promete.
export async function applyNaive(pool: Pool, payment: Payment): Promise<Outcome> {
	await inTransaction(pool, (client) => credit(client, payment));
	return "applied";
}

// EN: The idempotency key store. The message id is inserted in the SAME transaction as the
//     effect, under a primary key:
//       - first delivery: the insert succeeds, the effect is applied, both commit together;
//       - duplicate: the insert conflicts, nothing is applied;
//       - two copies at the same instant: the second insert waits for the first transaction,
//         then conflicts. The database decides, so there is no check-then-act race;
//       - crash in the middle: the transaction rolls back and neither the mark nor the effect
//         exists, so the redelivery is processed normally.
// PT: O armazenamento de chaves de idempotência. O id da mensagem é inserido na MESMA transação do
//     efeito, sob uma chave primária:
//       - primeira entrega: o insert funciona, o efeito é aplicado, os dois são confirmados juntos;
//       - duplicata: o insert conflita, nada é aplicado;
//       - duas cópias no mesmo instante: o segundo insert espera a primeira transação e depois
//         conflita. O banco decide, então não existe a corrida de checar e depois agir;
//       - queda no meio: a transação é desfeita e nem a marca nem o efeito existem, então a
//         reentrega é processada normalmente.
// ES: El almacén de claves de idempotencia. El id del mensaje se inserta en la MISMA transacción
//     que el efecto, bajo una clave primaria:
//       - primera entrega: el insert funciona, el efecto se aplica, ambos se confirman juntos;
//       - duplicado: el insert entra en conflicto, no se aplica nada;
//       - dos copias en el mismo instante: el segundo insert espera a la primera transacción y
//         luego entra en conflicto. La base de datos decide, así que no existe la carrera de
//         verificar y luego actuar;
//       - caída a la mitad: la transacción se revierte y no existen ni la marca ni el efecto, así
//         que la reentrega se procesa con normalidad.
export async function applyIdempotent(pool: Pool, payment: Payment): Promise<Outcome> {
	return inTransaction(pool, async (client) => {
		const mark = await client.query(
			"INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING",
			[payment.id],
		);
		if (mark.rowCount === 0) {
			return "duplicate";
		}
		await credit(client, payment);
		return "applied";
	});
}

export interface Totals {
	/** Rows in the ledger: how many times an effect was applied. */
	effects: number;
	balanceCents: number;
}

export async function totals(pool: Pool): Promise<Totals> {
	const effects = await pool.query<{ count: string }>("SELECT count(*) AS count FROM ledger");
	const balance = await pool.query<{ balance_cents: string }>("SELECT balance_cents FROM accounts WHERE id = $1", [
		ACCOUNT,
	]);
	return {
		effects: Number(effects.rows[0]?.count ?? 0),
		balanceCents: Number(balance.rows[0]?.balance_cents ?? 0),
	};
}
