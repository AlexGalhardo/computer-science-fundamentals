// EN: Database helpers shared by the two services. Each service has its OWN database: the order
//     service cannot read the payments table and vice versa. That separation is what makes the
//     problem of this lab real, because no single transaction can cover both.
// PT: Funções de banco compartilhadas pelos dois serviços. Cada serviço tem o SEU banco: o serviço
//     de pedidos não consegue ler a tabela de pagamentos e vice-versa. Essa separação é o que
//     torna o problema deste laboratório real, porque nenhuma transação única cobre os dois.
// ES: Funciones de base de datos compartidas por los dos servicios. Cada servicio tiene SU base de datos: el
//     servicio de pedidos no puede leer la tabla de pagos y viceversa. Esa separación es lo que
//     hace real el problema de este laboratorio, porque ninguna transacción única cubre a los dos.

import { Pool, type PoolClient } from "pg";

// EN: The two tables every service needs to talk to the broker safely. `outbox` holds events
//     waiting to be published. `processed_messages` remembers the ids of the events already
//     handled, so a redelivered message is recognised.
// PT: As duas tabelas de que todo serviço precisa para falar com o broker com segurança. `outbox`
//     guarda os eventos esperando publicação. `processed_messages` lembra os ids dos eventos já
//     tratados, para uma mensagem reentregue ser reconhecida.
// ES: Las dos tablas que todo servicio necesita para hablar con el broker con seguridad. `outbox`
//     guarda los eventos esperando publicación. `processed_messages` recuerda los ids de los eventos ya
//     tratados, para que un mensaje reentregado sea reconocido.
export const MESSAGING_SCHEMA = [
	`CREATE TABLE IF NOT EXISTS outbox (
		id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
		event_id uuid NOT NULL UNIQUE,
		routing_key text NOT NULL,
		payload jsonb NOT NULL,
		created_at timestamptz NOT NULL DEFAULT now(),
		published_at timestamptz
	)`,
	"CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON outbox (id) WHERE published_at IS NULL",
	`CREATE TABLE IF NOT EXISTS processed_messages (
		message_id uuid PRIMARY KEY,
		processed_at timestamptz NOT NULL DEFAULT now()
	)`,
];

export function createPool(databaseUrl: string): Pool {
	return new Pool({ connectionString: databaseUrl, max: 10 });
}

export async function migrate(pool: Pool, statements: string[]): Promise<void> {
	for (const statement of statements) {
		await pool.query(statement);
	}
}

// EN: Runs `work` in one transaction on one connection: COMMIT if it returns, ROLLBACK if it
//     throws. Everything `work` writes through `client` becomes visible together or not at all.
// PT: Roda `work` em uma transação em uma conexão: COMMIT se retornar, ROLLBACK se lançar erro.
//     Tudo que `work` grava por `client` fica visível junto ou não fica.
// ES: Ejecuta `work` en una transacción en una conexión: COMMIT si retorna, ROLLBACK si lanza un error.
//     Todo lo que `work` escribe por `client` se vuelve visible junto o no se vuelve visible.
export async function inTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
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
