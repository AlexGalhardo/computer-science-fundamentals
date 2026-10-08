// EN: The contract shared by every in-memory algorithm. The clock is an argument, never
//     `Date.now()` read inside the limiter: a test can then say "this request arrives at
//     t = 999 ms" and get the same answer on every run, with no sleeping and no flakiness.
//     Times are whole milliseconds, and each limiter does integer arithmetic only, so the
//     TypeScript and the Go versions give the same decisions bit for bit.
// PT: O contrato compartilhado por todos os algoritmos em memória. O relógio é um argumento,
//     nunca um `Date.now()` lido dentro do limitador: assim um teste pode dizer "esta requisição
//     chega em t = 999 ms" e obter a mesma resposta em toda execução, sem esperar e sem
//     instabilidade. Os tempos são milissegundos inteiros, e cada limitador faz apenas
//     aritmética inteira, então as versões em TypeScript e em Go decidem exatamente igual.

export interface RateLimiter {
	/** Decides one request that arrives at `nowMs`. Calls must come with non-decreasing times. */
	allow(nowMs: number): boolean;
}

// EN: Every algorithm is configured with the same two numbers, "at most `limit` requests per
//     `windowMs`", so the burst experiment compares like with like. For the two buckets this
//     means: capacity = `limit`, and refill (or drain) rate = `limit` per `windowMs`.
// PT: Todo algoritmo é configurado com os mesmos dois números, "no máximo `limit` requisições a
//     cada `windowMs`", para que o experimento de rajada compare coisas iguais. Para os dois
//     baldes isso significa: capacidade = `limit`, e taxa de reposição (ou de vazão) = `limit`
//     a cada `windowMs`.
export interface LimiterConfig {
	limit: number;
	windowMs: number;
}

export const ALGORITHMS = ["fixed-window", "sliding-log", "sliding-counter", "token-bucket", "leaky-bucket"] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export function assertConfig(config: LimiterConfig): void {
	if (!Number.isInteger(config.limit) || config.limit < 1) {
		throw new RangeError("limit must be a positive integer");
	}
	if (!Number.isInteger(config.windowMs) || config.windowMs < 1) {
		throw new RangeError("windowMs must be a positive integer");
	}
}
