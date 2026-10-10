// EN: Two small load generators. They record one sample per request, because the experiments
//     need more than totals: which instance answered, and when.
// PT: Dois geradores de carga pequenos. Eles guardam uma amostra por requisição, porque os
//     experimentos precisam de mais que totais: qual instância respondeu, e quando.
// ES: Dos generadores de carga pequeños. Guardan una muestra por solicitud, porque los
//     experimentos necesitan más que totales: qué instancia respondió, y cuándo.

export interface Sample {
	/** Position of the request in the order of sending, from 0. */
	index: number;
	/** Milliseconds since the start of the run at which the request was sent. */
	startMs: number;
	latencyMs: number;
	/** 0 when no HTTP answer arrived (connection error or client timeout). */
	status: number;
	/** Value of the `X-Instance` header, or null when no instance answered. */
	instance: string | null;
}

async function request(
	index: number,
	url: string,
	headers: Record<string, string>,
	timeoutMs: number,
	origin: number,
): Promise<Sample> {
	const started = performance.now();
	try {
		const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
		await response.arrayBuffer();
		return {
			index,
			startMs: started - origin,
			latencyMs: performance.now() - started,
			status: response.status,
			instance: response.headers.get("X-Instance"),
		};
	} catch {
		return { index, startMs: started - origin, latencyMs: performance.now() - started, status: 0, instance: null };
	}
}

export interface ClosedLoopOptions {
	url: string;
	total: number;
	concurrency: number;
	timeoutMs?: number;
	/** Extra headers of request number `index`, for example a simulated client address. */
	headers?: (index: number) => Record<string, string>;
}

// EN: Closed loop: a fixed number of workers, and each one sends its next request only when the
//     previous one was answered. The number of requests in flight is constant, so a slow
//     back end receives fewer requests per second. This is the model behind the expected
//     shares of least connections.
// PT: Laço fechado: um número fixo de trabalhadores, e cada um só manda a próxima requisição
//     quando a anterior foi respondida. O número de requisições em andamento é constante, então
//     um back end lento recebe menos requisições por segundo. É o modelo por trás das fatias
//     esperadas do least connections.
// ES: Lazo cerrado: un número fijo de trabajadores, y cada uno solo envía la siguiente solicitud
//     cuando se respondió la anterior. El número de solicitudes en curso es constante, así que un
//     back end lento recibe menos solicitudes por segundo. Es el modelo detrás de las partes
//     esperadas del least connections.
export async function closedLoop(options: ClosedLoopOptions): Promise<Sample[]> {
	const samples: Sample[] = [];
	const origin = performance.now();
	let next = 0;
	const worker = async (): Promise<void> => {
		while (next < options.total) {
			const index = next++;
			samples.push(
				await request(index, options.url, options.headers?.(index) ?? {}, options.timeoutMs ?? 5000, origin),
			);
		}
	};
	await Promise.all(Array.from({ length: options.concurrency }, worker));
	return samples;
}

export interface OpenLoopOptions {
	url: string;
	ratePerSecond: number;
	durationMs: number;
	timeoutMs: number;
	/** Called once, when the run reaches `atMs`. Used to break an instance during the load. */
	event?: { atMs: number; run: () => Promise<void> };
}

export interface OpenLoopResult {
	samples: Sample[];
	/** When the event really fired, in ms since the start of the run. null when there was none. */
	eventAtMs: number | null;
}

// EN: Open loop: requests leave at a fixed rate whether or not the earlier ones were answered,
//     like independent users. A closed loop would slow down when the system fails and hide
//     the failure. This one keeps arriving, so every lost or delayed request is counted.
// PT: Laço aberto: as requisições saem em ritmo fixo, tenham as anteriores sido respondidas ou
//     não, como usuários independentes. Um laço fechado desaceleraria quando o sistema falha e
//     esconderia a falha. Este continua chegando, então toda requisição perdida ou atrasada é
//     contada.
// ES: Lazo abierto: las solicitudes salen a un ritmo fijo, se hayan respondido o no las anteriores,
//     como usuarios independientes. Un lazo cerrado se desaceleraría cuando el sistema falla y
//     ocultaría la falla. Este sigue llegando, así que toda solicitud perdida o retrasada se cuenta.
export async function openLoop(options: OpenLoopOptions): Promise<OpenLoopResult> {
	const pending: Promise<Sample>[] = [];
	const intervalMs = 1000 / options.ratePerSecond;
	const total = Math.floor(options.durationMs / intervalMs);
	const origin = performance.now();
	let eventDone: Promise<void> | undefined;
	let eventAtMs: number | null = null;
	for (let index = 0; index < total; index++) {
		const wait = index * intervalMs - (performance.now() - origin);
		if (wait > 0) {
			await Bun.sleep(wait);
		}
		if (
			options.event !== undefined &&
			eventDone === undefined &&
			performance.now() - origin >= options.event.atMs
		) {
			eventAtMs = performance.now() - origin;
			eventDone = options.event.run();
		}
		pending.push(request(index, options.url, {}, options.timeoutMs, origin));
	}
	await eventDone;
	return { samples: await Promise.all(pending), eventAtMs };
}
