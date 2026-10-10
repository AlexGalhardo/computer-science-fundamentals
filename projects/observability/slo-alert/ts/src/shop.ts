// EN: The service under an objective. `GET /pay` does a little simulated work, and the service
//     has a fixed capacity: each request in flight makes the others slower, and when the
//     capacity is full, new requests are refused at once with 503 (load shedding). So load
//     alone, with no injected flag, breaks both objectives: availability and latency.
// PT: O serviço sob um objetivo. `GET /pay` faz um pouco de trabalho simulado, e o serviço tem
//     uma capacidade fixa: cada requisição em andamento deixa as outras mais lentas, e quando a
//     capacidade está cheia, as novas são recusadas na hora com 503 (descarte de carga). Assim
//     a carga sozinha, sem nenhuma flag injetada, quebra os dois objetivos: disponibilidade e
//     latência.
// ES: El servicio bajo un objetivo. `GET /pay` hace un poco de trabajo simulado, y el servicio tiene
//     una capacidad fija: cada petición en curso deja más lentas a las otras, y cuando la
//     capacidad está llena, las nuevas se rechazan al instante con 503 (descarte de carga). Así
//     la carga sola, sin ninguna flag inyectada, rompe los dos objetivos: disponibilidad y
//     latencia.

import { Counter, EXPOSITION_CONTENT_TYPE, Histogram, renderAll } from "./metrics";

export interface ShopOptions {
	/** Requests served at the same time before new ones are refused. */
	capacity: number;
	/** Time of a request that runs alone, in milliseconds. */
	baseMs: number;
	/** Extra time added by each request in flight, in milliseconds. */
	perInFlightMs: number;
	sleep: (ms: number) => Promise<void>;
	now: () => number;
}

export const DEFAULT_SHOP_OPTIONS: ShopOptions = {
	capacity: 8,
	baseMs: 15,
	perInFlightMs: 20,
	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
	now: () => performance.now(),
};

/** Bucket limits in seconds. 0.1 is there because the latency objective is "under 100 ms". */
export const LATENCY_BUCKETS = [0.025, 0.05, 0.1, 0.25, 0.5, 1];

export interface Shop {
	fetch: (request: Request) => Promise<Response>;
	requests: Counter;
	duration: Histogram;
	inFlight: () => number;
}

export function createShop(overrides: Partial<ShopOptions> = {}): Shop {
	const options = { ...DEFAULT_SHOP_OPTIONS, ...overrides };
	const requests = new Counter("http_requests_total", "Requests handled, by status code.");
	// EN: The latency histogram observes successful requests only. A 503 is refused in under a
	//     millisecond: counting it would make latency look better exactly when the service is
	//     failing. Failures are already counted by the availability indicator.
	// PT: O histograma de latência observa só as requisições bem-sucedidas. Um 503 é recusado
	//     em menos de um milissegundo: contá-lo faria a latência parecer melhor justamente
	//     quando o serviço está falhando. As falhas já são contadas pelo indicador de
	//     disponibilidade.
	// ES: El histograma de latencia observa solo las peticiones exitosas. Un 503 se rechaza
	//     en menos de un milisegundo: contarlo haría que la latencia pareciera mejor justamente
	//     cuando el servicio está fallando. Los fallos ya los cuenta el indicador de
	//     disponibilidad.
	const duration = new Histogram(
		"http_request_duration_seconds",
		"Duration of successful requests.",
		LATENCY_BUCKETS,
	);
	requests.init({ code: "200" });
	requests.init({ code: "503" });
	let inFlight = 0;

	const pay = async (): Promise<Response> => {
		if (inFlight >= options.capacity) {
			requests.inc({ code: "503" });
			return Response.json({ error: "overloaded" }, { status: 503, headers: { "retry-after": "1" } });
		}
		inFlight += 1;
		const started = options.now();
		try {
			await options.sleep(options.baseMs + options.perInFlightMs * inFlight);
			return Response.json({ paid: true });
		} finally {
			inFlight -= 1;
			duration.observe((options.now() - started) / 1000);
			requests.inc({ code: "200" });
		}
	};

	return {
		requests,
		duration,
		inFlight: () => inFlight,
		fetch: async (request) => {
			const { pathname } = new URL(request.url);
			if (request.method !== "GET") {
				return new Response("method not allowed", { status: 405 });
			}
			if (pathname === "/pay") {
				return pay();
			}
			// EN: Prometheus pulls: every few seconds it GETs this page and stores the numbers.
			//     The service keeps no history and does not know who is reading.
			// PT: O Prometheus puxa: a cada poucos segundos ele faz GET nesta página e guarda
			//     os números. O serviço não guarda histórico e não sabe quem está lendo.
			// ES: Prometheus extrae (pull): cada pocos segundos hace GET en esta página y guarda
			//     los números. El servicio no guarda historial y no sabe quién está leyendo.
			if (pathname === "/metrics") {
				return new Response(renderAll([requests, duration]), {
					headers: { "content-type": EXPOSITION_CONTENT_TYPE },
				});
			}
			if (pathname === "/health") {
				return new Response("ok");
			}
			return new Response("not found", { status: 404 });
		},
	};
}
