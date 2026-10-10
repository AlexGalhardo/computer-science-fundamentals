// EN: A closed-loop load generator: a fixed number of workers, each sending the next request
//     as soon as the previous one is answered. With the concurrency fixed, the number of
//     requests completed per second is the throughput of the server under that pressure.
// PT: Um gerador de carga de laço fechado: um número fixo de workers, cada um enviando a
//     próxima requisição assim que a anterior é respondida. Com a concorrência fixa, o número
//     de requisições concluídas por segundo é a vazão do servidor sob aquela pressão.
// ES: Un generador de carga de lazo cerrado: un número fijo de workers, cada uno enviando la
//     siguiente petición apenas se responde la anterior. Con la concurrencia fija, el número
//     de peticiones completadas por segundo es el throughput del servidor bajo esa presión.

import { requireLocalTarget } from "./target";

export interface LoadResult {
	requests: number;
	errors: number;
	seconds: number;
	requestsPerSecond: number;
}

export async function runLoad(url: string, concurrency: number, durationMs: number): Promise<LoadResult> {
	requireLocalTarget(url);
	const started = performance.now();
	const deadline = started + durationMs;
	let requests = 0;
	let errors = 0;

	const worker = async (): Promise<void> => {
		while (performance.now() < deadline) {
			try {
				const response = await fetch(url);
				// EN: Read the body, or the connection is not reused for the next request.
				// PT: Lê o corpo, ou a conexão não é reaproveitada na próxima requisição.
				// ES: Lee el cuerpo, o la conexión no se reutiliza en la siguiente petición.
				await response.arrayBuffer();
				if (response.ok && performance.now() <= deadline) {
					requests += 1;
				} else if (!response.ok) {
					errors += 1;
				}
			} catch {
				errors += 1;
			}
		}
	};
	await Promise.all(Array.from({ length: concurrency }, worker));

	const seconds = durationMs / 1000;
	return { requests, errors, seconds, requestsPerSecond: requests / seconds };
}

/** Waits until the service answers on /health, or throws after the timeout. */
export async function waitHealthy(baseUrl: string, timeoutMs = 60_000): Promise<void> {
	const base = requireLocalTarget(baseUrl);
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		try {
			if ((await fetch(`${base}/health`)).ok) {
				return;
			}
		} catch {
			// Not listening yet: try again.
		}
		if (Date.now() > deadline) {
			throw new Error(`${base} did not become healthy in ${timeoutMs} ms`);
		}
		await Bun.sleep(250);
	}
}
