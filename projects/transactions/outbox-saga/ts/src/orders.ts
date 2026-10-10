// EN: The order side of the saga. An order is created as PENDING and waits for the payment
//     service to answer with an event. PaymentCompleted makes it PAID. PaymentFailed makes it
//     CANCELLED, which is the compensation: there is no distributed rollback, so the step that
//     already committed is undone by a new transaction that says "this order is void".
// PT: O lado dos pedidos na saga. Um pedido é criado como PENDING e espera o serviço de pagamentos
//     responder com um evento. PaymentCompleted o torna PAID. PaymentFailed o torna CANCELLED,
//     que é a compensação: não existe rollback distribuído, então o passo que já foi confirmado
//     é desfeito por uma nova transação que diz "este pedido não vale".
// ES: El lado de los pedidos en la saga. Un pedido se crea como PENDING y espera que el servicio de pagos
//     responda con un evento. PaymentCompleted lo vuelve PAID. PaymentFailed lo vuelve CANCELLED,
//     que es la compensación: no existe un rollback distribuido, así que el paso que ya se confirmó
//     se deshace con una nueva transacción que dice "este pedido no vale".

import type { Pool } from "pg";
import { z } from "zod";
import { inTransaction, MESSAGING_SCHEMA } from "./shared/db";
import { type DomainEvent, newEvent } from "./shared/events";
import { addToOutbox, firstTimeSeen } from "./shared/outbox";

export const ORDER_SCHEMA = [
	`CREATE TABLE IF NOT EXISTS orders (
		id uuid PRIMARY KEY,
		customer_id text NOT NULL,
		amount_cents integer NOT NULL CHECK (amount_cents > 0),
		status text NOT NULL CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
		cancel_reason text,
		created_at timestamptz NOT NULL DEFAULT now()
	)`,
	`CREATE TABLE IF NOT EXISTS idempotency_keys (
		key text PRIMARY KEY,
		order_id uuid NOT NULL REFERENCES orders (id)
	)`,
	...MESSAGING_SCHEMA,
];

export const MODES = ["dual-write", "outbox"] as const;
export type Mode = (typeof MODES)[number];

export const createOrderBody = z.object({
	orderId: z.uuid(),
	customerId: z.string().min(1).max(64),
	amountCents: z.number().int().min(1).max(100_000_000),
	mode: z.enum(MODES).default("outbox"),
	// EN: Lab switch: kill the process right after the database commit, to simulate a crash at
	//     the worst possible moment.
	// PT: Chave de laboratório: mata o processo logo depois do commit no banco, para simular uma
	//     queda no pior momento possível.
	// ES: Llave de laboratorio: mata el proceso justo después del commit en la base de datos, para simular
	//     una caída en el peor momento posible.
	crashAfterCommit: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderBody>;

export interface Order {
	id: string;
	customerId: string;
	amountCents: number;
	status: "PENDING" | "PAID" | "CANCELLED";
	cancelReason: string | null;
}

export interface OrderDependencies {
	pool: Pool;
	publish: (event: DomainEvent) => Promise<void>;
	/** Called at the crash point. In the service it ends the process. */
	crash: () => void;
}

export async function findOrder(pool: Pool, id: string): Promise<Order | null> {
	const result = await pool.query<Order>(
		`SELECT id, customer_id AS "customerId", amount_cents AS "amountCents", status, cancel_reason AS "cancelReason"
		 FROM orders WHERE id = $1`,
		[id],
	);
	return result.rows[0] ?? null;
}

// EN: An idempotency key makes a retried HTTP request safe. The client sends the same key when
//     it retries (for example after a timeout), and the server answers with the order it
//     already created instead of creating a second one. The key is stored in the same
//     transaction as the order, so the two cannot disagree.
// PT: Uma chave de idempotência torna segura a repetição de uma requisição HTTP. O cliente envia
//     a mesma chave quando tenta de novo (por exemplo depois de um timeout), e o servidor
//     responde com o pedido que já criou em vez de criar um segundo. A chave é gravada na mesma
//     transação do pedido, então os dois não podem divergir.
// ES: Una clave de idempotencia hace seguro repetir una petición HTTP. El cliente envía la misma
//     clave cuando reintenta (por ejemplo después de un timeout), y el servidor responde con el
//     pedido que ya creó en lugar de crear un segundo. La clave se escribe en la misma
//     transacción del pedido, así que los dos no pueden divergir.
async function orderOfKey(pool: Pool, key: string | undefined): Promise<Order | null> {
	if (key === undefined) {
		return null;
	}
	const result = await pool.query<{ order_id: string }>("SELECT order_id FROM idempotency_keys WHERE key = $1", [
		key,
	]);
	const orderId = result.rows[0]?.order_id;
	return orderId === undefined ? null : findOrder(pool, orderId);
}

export async function createOrder(
	dependencies: OrderDependencies,
	input: CreateOrderInput,
	idempotencyKey?: string,
): Promise<{ order: Order; replayed: boolean }> {
	const { pool, publish, crash } = dependencies;
	const existing = await orderOfKey(pool, idempotencyKey);
	if (existing !== null) {
		return { order: existing, replayed: true };
	}

	const event = newEvent("OrderCreated", input.orderId, input.amountCents);
	await inTransaction(pool, async (client) => {
		await client.query(
			"INSERT INTO orders (id, customer_id, amount_cents, status) VALUES ($1, $2, $3, 'PENDING')",
			[input.orderId, input.customerId, input.amountCents],
		);
		if (idempotencyKey !== undefined) {
			await client.query("INSERT INTO idempotency_keys (key, order_id) VALUES ($1, $2)", [
				idempotencyKey,
				input.orderId,
			]);
		}
		// EN: OUTBOX: the event is a row in the same transaction as the order. After the COMMIT
		//     below, either both exist or neither does. A crash can only delay the event.
		// PT: OUTBOX: o evento é uma linha na mesma transação do pedido. Depois do COMMIT abaixo,
		//     ou os dois existem ou nenhum existe. Uma queda só consegue atrasar o evento.
		// ES: OUTBOX: el evento es una fila en la misma transacción del pedido. Después del COMMIT de abajo,
		//     o existen los dos o no existe ninguno. Una caída solo puede retrasar el evento.
		if (input.mode === "outbox") {
			await addToOutbox(client, event);
		}
	});

	if (input.crashAfterCommit) {
		crash();
	}

	// EN: DUAL WRITE (the bug): the order is already committed and the event exists only in the
	//     memory of this process. If the process dies on the line above, nobody will ever
	//     publish it: the order stays PENDING forever and the customer is never charged.
	// PT: DUAL WRITE (o bug): o pedido já foi confirmado e o evento existe só na memória deste
	//     processo. Se o processo morrer na linha acima, ninguém nunca vai publicá-lo: o pedido
	//     fica PENDING para sempre e o cliente nunca é cobrado.
	// ES: DUAL WRITE (el bug): el pedido ya se confirmó y el evento existe solo en la memoria de este
	//     proceso. Si el proceso muere en la línea de arriba, nadie lo publicará nunca: el pedido
	//     queda PENDING para siempre y al cliente nunca se le cobra.
	if (input.mode === "dual-write") {
		await publish(event);
	}

	const order = await findOrder(pool, input.orderId);
	if (order === null) {
		throw new Error("the order was not stored");
	}
	return { order, replayed: false };
}

// EN: The saga step that reacts to the payment. The status only moves out of PENDING, so a
//     late or repeated event cannot turn a CANCELLED order into PAID or the other way round.
// PT: O passo da saga que reage ao pagamento. O status só sai de PENDING, então um evento
//     atrasado ou repetido não consegue transformar um pedido CANCELLED em PAID nem o contrário.
// ES: El paso de la saga que reacciona al pago. El estado solo sale de PENDING, así que un evento
//     atrasado o repetido no puede convertir un pedido CANCELLED en PAID ni lo contrario.
export async function handlePaymentEvent(pool: Pool, event: DomainEvent): Promise<"applied" | "duplicate"> {
	return inTransaction(pool, async (client) => {
		if (!(await firstTimeSeen(client, event.id))) {
			return "duplicate";
		}
		if (event.type === "PaymentCompleted") {
			await client.query("UPDATE orders SET status = 'PAID' WHERE id = $1 AND status = 'PENDING'", [
				event.orderId,
			]);
		} else if (event.type === "PaymentFailed") {
			await client.query(
				"UPDATE orders SET status = 'CANCELLED', cancel_reason = $2 WHERE id = $1 AND status = 'PENDING'",
				[event.orderId, event.reason ?? "payment failed"],
			);
		}
		return "applied";
	});
}
