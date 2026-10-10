import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { LimiterConfig } from "./limiter";

// EN: The distributed limiter. Several application instances sit behind a load balancer, and a
//     counter kept in the memory of each one would let N instances admit N times the limit.
//     The state therefore lives in one shared place, Redis, and the whole decision ("read,
//     compare, write") runs there as one atomic Lua script.
// PT: O limitador distribuído. Várias instâncias da aplicação ficam atrás de um balanceador, e
//     um contador guardado na memória de cada uma deixaria N instâncias admitirem N vezes o
//     limite. Por isso o estado mora em um único lugar compartilhado, o Redis, e a decisão
//     inteira ("ler, comparar, escrever") roda lá como um único script Lua atômico.
// ES: El limitador distribuido. Varias instancias de la aplicación están detrás de un balanceador,
//     y un contador guardado en la memoria de cada una dejaría que N instancias admitan N veces
//     el límite. Por eso el estado vive en un único lugar compartido, Redis, y la decisión
//     entera ("leer, comparar, escribir") corre allí como un único script Lua atómico.

export const STRATEGIES = ["fixed-window", "token-bucket", "naive"] as const;
export type Strategy = (typeof STRATEGIES)[number];

export interface Decision {
	allowed: boolean;
	remaining: number;
	/** Milliseconds the client should wait before trying again. Meaningful when rejected. */
	retryAfterMs: number;
}

/** The one method this module needs from a Redis client. Bun's built-in `RedisClient` has it. */
export interface RedisCommands {
	send(command: string, args: string[]): Promise<unknown>;
}

// EN: What a script returns crosses a network and comes from another program, so it is checked
//     like any external input before the application trusts it.
// PT: O que um script devolve atravessa a rede e vem de outro programa, então é verificado como
//     qualquer entrada externa antes que a aplicação confie nele.
// ES: Lo que devuelve un script atraviesa la red y viene de otro programa, así que se verifica
//     como cualquier entrada externa antes de que la aplicación confíe en ello.
const replySchema = z.tuple([z.number().int(), z.number().int(), z.number().int()]);

const LUA_DIR = join(import.meta.dir, "..", "..", "lua");

function loadScript(name: string): string {
	return readFileSync(join(LUA_DIR, `${name}.lua`), "utf8");
}

const SCRIPTS: Record<Exclude<Strategy, "naive">, string> = {
	"fixed-window": loadScript("fixed-window"),
	"token-bucket": loadScript("token-bucket"),
};

export class RedisLimiter {
	private readonly shaByStrategy = new Map<string, string>();

	constructor(
		private readonly redis: RedisCommands,
		private readonly config: LimiterConfig,
	) {}

	async hit(strategy: Strategy, clientKey: string): Promise<Decision> {
		// EN: The strategy is part of the key, so the three strategies never share a counter.
		// PT: A estratégia faz parte da chave, então as três estratégias nunca dividem um contador.
		// ES: La estrategia es parte de la clave, así que las tres estrategias nunca comparten un contador.
		const key = `rate:${strategy}:${clientKey}`;
		if (strategy === "naive") {
			return this.naive(key);
		}
		const reply = replySchema.parse(await this.runScript(strategy, key));
		return { allowed: reply[0] === 1, remaining: reply[1], retryAfterMs: Math.max(0, reply[2]) };
	}

	// EN: The script is sent once (SCRIPT LOAD) and then called by its SHA1 with EVALSHA, which
	//     saves sending the source on every request. The script cache of Redis is volatile: a
	//     restart or a failover empties it and the server answers NOSCRIPT. The client then
	//     loads the script again and repeats the call.
	// PT: O script é enviado uma vez (SCRIPT LOAD) e depois chamado pelo seu SHA1 com EVALSHA, o
	//     que evita mandar o código-fonte a cada requisição. O cache de scripts do Redis é
	//     volátil: um reinício ou um failover o esvazia e o servidor responde NOSCRIPT. O
	//     cliente então carrega o script de novo e repete a chamada.
	// ES: El script se envía una vez (SCRIPT LOAD) y luego se llama por su SHA1 con EVALSHA, lo
	//     que evita mandar el código fuente en cada solicitud. La caché de scripts de Redis es
	//     volátil: un reinicio o un failover la vacía y el servidor responde NOSCRIPT. El
	//     cliente entonces carga el script de nuevo y repite la llamada.
	private async runScript(strategy: Exclude<Strategy, "naive">, key: string): Promise<unknown> {
		const args = ["1", key, String(this.config.limit), String(this.config.windowMs)];
		const sha = this.shaByStrategy.get(strategy) ?? (await this.load(strategy));
		try {
			return await this.redis.send("EVALSHA", [sha, ...args]);
		} catch (error) {
			if (!(error instanceof Error) || !error.message.includes("NOSCRIPT")) {
				throw error;
			}
			return this.redis.send("EVALSHA", [await this.load(strategy), ...args]);
		}
	}

	private async load(strategy: Exclude<Strategy, "naive">): Promise<string> {
		const sha = z.string().parse(await this.redis.send("SCRIPT", ["LOAD", SCRIPTS[strategy]]));
		this.shaByStrategy.set(strategy, sha);
		return sha;
	}

	// EN: DELIBERATELY WRONG, kept to show the bug. The same logic as the fixed-window script,
	//     but as separate commands sent by the application. Between the GET and the INCR, any
	//     other request (from this instance or another one) can read the same old value, and
	//     all of them decide "below the limit". Each command is atomic; the sequence is not.
	// PT: ERRADO DE PROPÓSITO, mantido para mostrar o bug. A mesma lógica do script de janela
	//     fixa, mas em comandos separados enviados pela aplicação. Entre o GET e o INCR, qualquer
	//     outra requisição (desta instância ou de outra) pode ler o mesmo valor antigo, e todas
	//     decidem "abaixo do limite". Cada comando é atômico; a sequência não é.
	// ES: INCORRECTO A PROPÓSITO, se conserva para mostrar el bug. La misma lógica del script de
	//     ventana fija, pero en comandos separados enviados por la aplicación. Entre el GET y el
	//     INCR, cualquier otra solicitud (de esta instancia o de otra) puede leer el mismo valor
	//     viejo, y todas deciden "por debajo del límite". Cada comando es atómico; la secuencia no.
	private async naive(key: string): Promise<Decision> {
		const { limit, windowMs } = this.config;
		const stored = z
			.string()
			.nullable()
			.parse(await this.redis.send("GET", [key]));
		const current = stored === null ? 0 : Number(stored);
		if (current >= limit) {
			const ttl = z.number().parse(await this.redis.send("PTTL", [key]));
			return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, ttl) };
		}
		const next = z.number().parse(await this.redis.send("INCR", [key]));
		if (next === 1) {
			await this.redis.send("PEXPIRE", [key, String(windowMs)]);
		}
		return { allowed: true, remaining: Math.max(0, limit - next), retryAfterMs: 0 };
	}
}
