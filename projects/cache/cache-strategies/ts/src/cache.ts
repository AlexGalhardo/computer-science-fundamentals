// EN: A thin layer over the Redis client that ships with Bun, with only the commands this lab
//     needs and one name per idea. What comes back from Redis is external data, so it is
//     checked before it is used.
// PT: Uma camada fina sobre o cliente Redis que vem com o Bun, só com os comandos que este
//     laboratório precisa e um nome por ideia. O que volta do Redis é dado externo, então é
//     conferido antes de ser usado.
// ES: Una capa delgada sobre el cliente Redis que viene con Bun, solo con los comandos que
//     necesita este laboratorio y un nombre por idea. Lo que vuelve de Redis es dato externo,
//     así que se verifica antes de usarlo.

import { RedisClient } from "bun";
import { z } from "zod";

// EN: Releasing a lock must be "delete it only if it is still mine". Between a GET and a DEL
//     sent by the client, the lock could expire and be taken by someone else, and the DEL would
//     remove THEIR lock. A Lua script runs inside Redis as one atomic step, so nothing can
//     happen between the comparison and the delete.
// PT: Soltar uma trava precisa ser "apague só se ainda for minha". Entre um GET e um DEL
//     enviados pelo cliente, a trava poderia expirar e ser pega por outro, e o DEL apagaria a
//     trava DELE. Um script Lua roda dentro do Redis como um passo atômico, então nada acontece
//     entre a comparação e a remoção.
// ES: Liberar un bloqueo debe ser "elimínalo solo si sigue siendo mío". Entre un GET y un DEL
//     enviados por el cliente, el bloqueo podría expirar y ser tomado por otro, y el DEL
//     eliminaría SU bloqueo. Un script Lua se ejecuta dentro de Redis como un solo paso atómico,
//     así que nada puede ocurrir entre la comparación y la eliminación.
const RELEASE_LOCK = `if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
end
return 0`;

const fieldsSchema = z.record(z.string(), z.string());

export class Cache {
	constructor(private readonly client: RedisClient) {}

	static async connect(url: string): Promise<Cache> {
		const client = new RedisClient(url);
		await client.connect();
		return new Cache(client);
	}

	async get(key: string): Promise<string | null> {
		const reply: unknown = await this.client.send("GET", [key]);
		return typeof reply === "string" ? reply : null;
	}

	/** `SET key value PX ttl`: stores the value and its time to live in one atomic command. */
	async set(key: string, value: string, ttlMs: number): Promise<void> {
		await this.client.send("SET", [key, value, "PX", String(ttlMs)]);
	}

	async del(key: string): Promise<void> {
		await this.client.send("DEL", [key]);
	}

	/** Remaining time to live in milliseconds. -2: the key does not exist. -1: it never expires. */
	async pttl(key: string): Promise<number> {
		const reply: unknown = await this.client.send("PTTL", [key]);
		return typeof reply === "number" ? reply : -2;
	}

	// EN: `SET key token NX PX ttl` is the lock: NX stores the key only if it does not exist, so
	//     exactly one caller gets "OK". PX gives the lock an expiry, so a holder that crashes
	//     does not block everybody forever.
	// PT: `SET key token NX PX ttl` é a trava: NX grava a chave só se ela não existir, então
	//     exatamente um chamador recebe "OK". PX dá validade à trava, então um dono que cai não
	//     bloqueia todo mundo para sempre.
	// ES: `SET key token NX PX ttl` es el bloqueo: NX guarda la clave solo si no existe, así que
	//     exactamente un llamador recibe "OK". PX le da vencimiento al bloqueo, así que un titular
	//     que se cae no bloquea a todos para siempre.
	async acquireLock(key: string, token: string, ttlMs: number): Promise<boolean> {
		const reply: unknown = await this.client.send("SET", [key, token, "NX", "PX", String(ttlMs)]);
		return reply === "OK";
	}

	async releaseLock(key: string, token: string): Promise<boolean> {
		const reply: unknown = await this.client.send("EVAL", [RELEASE_LOCK, "1", key, token]);
		return reply === 1;
	}

	async hashSet(key: string, field: string, value: string): Promise<void> {
		await this.client.send("HSET", [key, field, value]);
	}

	/** `HSETNX`: sets the field only when it does not exist yet. */
	async hashSetIfAbsent(key: string, field: string, value: string): Promise<void> {
		await this.client.send("HSETNX", [key, field, value]);
	}

	async hashGet(key: string, field: string): Promise<string | null> {
		const reply: unknown = await this.client.send("HGET", [key, field]);
		return typeof reply === "string" ? reply : null;
	}

	async hashGetAll(key: string): Promise<Record<string, string>> {
		const reply: unknown = await this.client.hgetall(key);
		return fieldsSchema.parse(reply ?? {});
	}

	/** `RENAME` is atomic. Returns false when the source key does not exist. */
	async renameIfExists(from: string, to: string): Promise<boolean> {
		try {
			await this.client.send("RENAME", [from, to]);
			return true;
		} catch (error) {
			if (error instanceof Error && error.message.toLowerCase().includes("no such key")) {
				return false;
			}
			throw error;
		}
	}

	/** Empties the whole Redis database of the lab. Used by reset and to simulate losing the cache. */
	async flushAll(): Promise<void> {
		await this.client.send("FLUSHDB", []);
	}

	async serverVersion(): Promise<string> {
		const reply: unknown = await this.client.send("INFO", ["server"]);
		const match = typeof reply === "string" ? /redis_version:(\S+)/.exec(reply) : null;
		return match?.[1] ?? "unknown";
	}

	close(): void {
		this.client.close();
	}
}
