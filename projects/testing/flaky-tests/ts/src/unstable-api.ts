// EN: A stand-in for "somebody else's service on a real network". It answers the exchange rate,
//     but one request in four fails with 503, the way a real dependency has bad moments. The
//     failures are SIMULATED with a random number, because a lab cannot depend on a real outage.
//     It runs only inside docker-compose, on an internal network, with no published port.
//     The random source is a parameter, so this file can itself be tested without randomness.
// PT: Um substituto para "o serviço de outra pessoa em uma rede real". Ele responde a taxa de
//     câmbio, mas uma requisição em cada quatro falha com 503, do jeito que uma dependência real
//     tem momentos ruins. As falhas são SIMULADAS com um número aleatório, porque um laboratório
//     não pode depender de uma queda real. Ele roda só dentro do docker-compose, em uma rede
//     interna, sem porta publicada.
//     A fonte aleatória é um parâmetro, então este arquivo pode ser testado sem aleatoriedade.
// ES: Un sustituto de "el servicio de alguien más en una red real". Responde el tipo de cambio,
//     pero una solicitud de cada cuatro falla con 503, como una dependencia real tiene malos
//     momentos. Los fallos se SIMULAN con un número aleatorio, porque un laboratorio no puede
//     depender de una caída real. Se ejecuta solo dentro de docker-compose, en una red interna,
//     sin puerto publicado.
//     La fuente aleatoria es un parámetro, así que este archivo puede probarse sin aleatoriedad.
export const FAILURE_RATE = 0.25;

const RATES: Readonly<Record<string, number>> = { "USD-BRL": 5.25, "EUR-BRL": 6.1 };

export function createUnstableApi(random: () => number = Math.random): (request: Request) => Response {
	return (request) => {
		const { pathname } = new URL(request.url);
		if (pathname === "/health") {
			return Response.json({ status: "ok" });
		}
		const pair = pathname.match(/^\/rates\/([A-Z]{3}-[A-Z]{3})$/)?.[1];
		const rate = pair === undefined ? undefined : RATES[pair];
		if (pair === undefined || rate === undefined) {
			return Response.json({ error: "unknown pair" }, { status: 404 });
		}
		if (random() < FAILURE_RATE) {
			return Response.json({ error: "temporarily unavailable" }, { status: 503 });
		}
		return Response.json({ pair, rate });
	};
}

if (import.meta.main) {
	Bun.serve({ port: 3000, hostname: "0.0.0.0", fetch: createUnstableApi() });
	console.log("unstable-api listening on port 3000");
}
