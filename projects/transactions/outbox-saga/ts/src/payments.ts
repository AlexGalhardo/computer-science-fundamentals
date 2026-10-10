// EN: The payment side of the saga. It reacts to OrderCreated, decides, stores the payment and
//     answers with PaymentCompleted or PaymentFailed. The three writes (the "already processed"
//     mark, the payment row and the outgoing event) share one transaction.
// PT: O lado dos pagamentos na saga. Ele reage a OrderCreated, decide, grava o pagamento e
//     responde com PaymentCompleted ou PaymentFailed. As três escritas (a marca de "já
//     processado", a linha do pagamento e o evento de saída) dividem uma transação.
// ES: El lado de los pagos en la saga. Reacciona a OrderCreated, decide, guarda el pago y
//     responde con PaymentCompleted o PaymentFailed. Las tres escrituras (la marca de "ya
//     procesado", la fila del pago y el evento de salida) comparten una transacción.

import type { Pool } from "pg";
import { inTransaction, MESSAGING_SCHEMA } from "./shared/db";
import { type DomainEvent, newEvent } from "./shared/events";
import { addToOutbox, firstTimeSeen } from "./shared/outbox";

export const PAYMENT_SCHEMA = [
	`CREATE TABLE IF NOT EXISTS payments (
		order_id uuid PRIMARY KEY,
		amount_cents integer NOT NULL CHECK (amount_cents > 0),
		status text NOT NULL CHECK (status IN ('COMPLETED', 'FAILED')),
		reason text,
		created_at timestamptz NOT NULL DEFAULT now()
	)`,
	...MESSAGING_SCHEMA,
];

/** Fake card limit of the lab: anything above 500.00 is declined. */
export const LIMIT_CENTS = 50_000;

export interface Decision {
	status: "COMPLETED" | "FAILED";
	reason: string | null;
}

// EN: A deterministic stand-in for a card processor, so that the failure path of the saga can
//     be triggered on purpose by choosing the amount.
// PT: Um substituto determinístico para uma processadora de cartão, para o caminho de falha da
//     saga poder ser disparado de propósito pela escolha do valor.
// ES: Un sustituto determinístico de un procesador de tarjetas, para poder disparar a propósito el
//     camino de fallo de la saga mediante la elección del monto.
export function decide(amountCents: number): Decision {
	return amountCents > LIMIT_CENTS
		? { status: "FAILED", reason: "amount above the fake card limit" }
		: { status: "COMPLETED", reason: null };
}

export interface Payment {
	orderId: string;
	amountCents: number;
	status: "COMPLETED" | "FAILED";
	reason: string | null;
}

export async function findPayment(pool: Pool, orderId: string): Promise<Payment | null> {
	const result = await pool.query<Payment>(
		`SELECT order_id AS "orderId", amount_cents AS "amountCents", status, reason FROM payments WHERE order_id = $1`,
		[orderId],
	);
	return result.rows[0] ?? null;
}

export async function handleOrderCreated(pool: Pool, event: DomainEvent): Promise<"applied" | "duplicate"> {
	return inTransaction(pool, async (client) => {
		// EN: At-least-once delivery means this handler WILL see the same event twice some day.
		//     Charging a customer twice is not acceptable, so the duplicate is detected here.
		// PT: Entrega at-least-once significa que este handler VAI ver o mesmo evento duas vezes
		//     algum dia. Cobrar um cliente duas vezes não é aceitável, então a duplicata é
		//     detectada aqui.
		// ES: La entrega at-least-once significa que este manejador VA a ver el mismo evento dos veces
		//     algún día. Cobrar a un cliente dos veces no es aceptable, así que el duplicado se
		//     detecta aquí.
		if (!(await firstTimeSeen(client, event.id))) {
			return "duplicate";
		}
		const decision = decide(event.amountCents);
		await client.query("INSERT INTO payments (order_id, amount_cents, status, reason) VALUES ($1, $2, $3, $4)", [
			event.orderId,
			event.amountCents,
			decision.status,
			decision.reason,
		]);
		const answer =
			decision.status === "COMPLETED"
				? newEvent("PaymentCompleted", event.orderId, event.amountCents)
				: newEvent("PaymentFailed", event.orderId, event.amountCents, decision.reason ?? undefined);
		await addToOutbox(client, answer);
		return "applied";
	});
}
