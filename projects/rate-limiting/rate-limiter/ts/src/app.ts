import { z } from "zod";
import { type Decision, STRATEGIES, type Strategy } from "./redis-limiter";

// EN: The HTTP face of the limiter, as a pure function from a request to a response, so it is
//     tested without opening a port. `GET /hit?strategy=fixed-window&key=alice` spends one
//     request of the client `alice`.
// PT: A face HTTP do limitador, como uma função pura de uma requisição para uma resposta, para
//     ser testada sem abrir porta. `GET /hit?strategy=fixed-window&key=alice` gasta uma
//     requisição do cliente `alice`.

export interface AppDependencies {
	instance: string;
	hit(strategy: Strategy, clientKey: string): Promise<Decision>;
	healthy(): Promise<boolean>;
}

// EN: The query string is typed by whoever calls, so it is validated at the door. The key has a
//     small alphabet and a bounded size: it becomes part of a Redis key name.
// PT: A query string é digitada por quem chama, então é validada na porta. A chave tem um
//     alfabeto pequeno e tamanho limitado: ela vira parte do nome de uma chave do Redis.
const querySchema = z.object({
	strategy: z.enum(STRATEGIES),
	key: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
});

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});
}

export function createApp(dependencies: AppDependencies): (request: Request) => Promise<Response> {
	return async (request) => {
		const url = new URL(request.url);
		if (url.pathname === "/health") {
			return (await dependencies.healthy()) ? json(200, { ok: true }) : json(503, { ok: false });
		}
		if (url.pathname !== "/hit" || request.method !== "GET") {
			return json(404, { error: "not found" });
		}
		const query = querySchema.safeParse(Object.fromEntries(url.searchParams));
		if (!query.success) {
			return json(400, { error: "expected ?strategy=fixed-window|token-bucket|naive&key=<name>" });
		}
		const decision = await dependencies.hit(query.data.strategy, query.data.key);
		const body = { allowed: decision.allowed, remaining: decision.remaining, instance: dependencies.instance };
		if (decision.allowed) {
			return json(200, body);
		}
		// EN: 429 Too Many Requests (RFC 6585) says THIS client sent too much; a 503 would say
		//     the server itself is overloaded. `Retry-After` carries whole seconds (it could
		//     also be an HTTP date), so the wait is rounded up: telling the client to come back
		//     too early would only produce another 429. A 429 must not be stored by a cache,
		//     or the next client would get a stale refusal.
		// PT: 429 Too Many Requests (RFC 6585) diz que ESTE cliente enviou demais; um 503 diria
		//     que o próprio servidor está sobrecarregado. O `Retry-After` leva segundos inteiros
		//     (também poderia ser uma data HTTP), então a espera é arredondada para cima: mandar
		//     o cliente voltar cedo demais só produziria outro 429. Um 429 não pode ser guardado
		//     por um cache, ou o próximo cliente receberia uma recusa velha.
		const retryAfterSeconds = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
		return json(429, body, { "retry-after": String(retryAfterSeconds), "cache-control": "no-store" });
	};
}
