// EN: The transactional outbox and its counterpart on the consumer side.
//     Problem: a service must change its database AND publish an event, and there is no
//     transaction that covers a database and a broker. Doing one after the other (a dual write)
//     loses the event when the process dies in between.
//     Solution: write the event as a row, in the SAME transaction as the business change. Now
//     the database guarantees "both or neither". A separate loop, the relay, reads the rows and
//     publishes them later.
// PT: O outbox transacional e o seu par do lado do consumidor.
//     Problema: um serviço precisa mudar o seu banco E publicar um evento, e não existe transação
//     que cubra um banco e um broker. Fazer um depois do outro (dual write) perde o evento
//     quando o processo morre no meio.
//     Solução: gravar o evento como uma linha, na MESMA transação da mudança de negócio. Agora o
//     banco garante "os dois ou nenhum". Um laço separado, o relay, lê as linhas e as publica
//     depois.
// ES: El outbox transaccional y su contraparte del lado del consumidor.
//     Problema: un servicio necesita cambiar su base de datos Y publicar un evento, y no existe una
//     transacción que cubra una base de datos y un broker. Hacer uno después del otro (dual write) pierde el
//     evento cuando el proceso muere en medio.
//     Solución: escribir el evento como una fila, en la MISMA transacción del cambio de negocio. Ahora la
//     base de datos garantiza "los dos o ninguno". Un bucle separado, el relay, lee las filas y las publica
//     después.

import type { Pool, PoolClient } from "pg";
import { inTransaction } from "./db";
import { type DomainEvent, eventSchema, ROUTING_KEYS } from "./events";

export async function addToOutbox(client: PoolClient, event: DomainEvent): Promise<void> {
	await client.query("INSERT INTO outbox (event_id, routing_key, payload) VALUES ($1, $2, $3)", [
		event.id,
		ROUTING_KEYS[event.type],
		JSON.stringify(event),
	]);
}

// EN: One pass of the relay. The rows are locked with FOR UPDATE SKIP LOCKED, so two relays
//     never publish the same row at the same time. A row is marked as published only after the
//     broker confirmed it. If the relay dies between the publish and the mark, the row is
//     published again on the next pass: the outbox delivers AT LEAST once, never "exactly once".
// PT: Uma passada do relay. As linhas são bloqueadas com FOR UPDATE SKIP LOCKED, então dois relays
//     nunca publicam a mesma linha ao mesmo tempo. Uma linha só é marcada como publicada depois
//     de o broker confirmar. Se o relay morrer entre a publicação e a marca, a linha é publicada
//     de novo na próxima passada: o outbox entrega PELO MENOS uma vez, nunca "exatamente uma".
// ES: Una pasada del relay. Las filas se bloquean con FOR UPDATE SKIP LOCKED, así que dos relays
//     nunca publican la misma fila al mismo tiempo. Una fila solo se marca como publicada después
//     de que el broker confirma. Si el relay muere entre la publicación y la marca, la fila se publica
//     de nuevo en la siguiente pasada: el outbox entrega AL MENOS una vez, nunca "exactamente una".
export async function relayOnce(pool: Pool, publish: (event: DomainEvent) => Promise<void>): Promise<number> {
	return inTransaction(pool, async (client) => {
		const pending = await client.query<{ id: string; payload: unknown }>(
			"SELECT id, payload FROM outbox WHERE published_at IS NULL ORDER BY id LIMIT 50 FOR UPDATE SKIP LOCKED",
		);
		for (const row of pending.rows) {
			await publish(eventSchema.parse(row.payload));
			await client.query("UPDATE outbox SET published_at = now() WHERE id = $1", [row.id]);
		}
		return pending.rows.length;
	});
}

export function startRelay(
	pool: Pool,
	publish: (event: DomainEvent) => Promise<void>,
	intervalMs: number,
): { stop: () => void } {
	let running = true;
	const loop = async (): Promise<void> => {
		while (running) {
			try {
				const published = await relayOnce(pool, publish);
				if (published === 0) {
					await Bun.sleep(intervalMs);
				}
			} catch (error) {
				console.error("relay: pass failed, will retry", error);
				await Bun.sleep(intervalMs);
			}
		}
	};
	void loop();
	return {
		stop: () => {
			running = false;
		},
	};
}

// EN: The idempotent consumer. The first thing a handler does, inside its transaction, is to
//     try to insert the event id. If the row was inserted, this is the first time. If the id was
//     already there, the insert does nothing and the handler skips the work. Because the insert
//     and the business change commit together, a message can never be "half processed".
// PT: O consumidor idempotente. A primeira coisa que um handler faz, dentro da sua transação, é
//     tentar inserir o id do evento. Se a linha foi inserida, é a primeira vez. Se o id já
//     estava lá, o insert não faz nada e o handler pula o trabalho. Como o insert e a mudança de
//     negócio são confirmados juntos, uma mensagem nunca fica "processada pela metade".
// ES: El consumidor idempotente. Lo primero que hace un manejador, dentro de su transacción, es
//     intentar insertar el id del evento. Si la fila se insertó, es la primera vez. Si el id ya
//     estaba, el insert no hace nada y el manejador salta el trabajo. Como el insert y el cambio de
//     negocio se confirman juntos, un mensaje nunca queda "procesado a medias".
export async function firstTimeSeen(client: PoolClient, messageId: string): Promise<boolean> {
	const result = await client.query(
		"INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING",
		[messageId],
	);
	return result.rowCount === 1;
}

export async function unpublishedCount(pool: Pool): Promise<number> {
	const result = await pool.query<{ total: number }>(
		"SELECT count(*)::int AS total FROM outbox WHERE published_at IS NULL",
	);
	return result.rows[0]?.total ?? 0;
}
