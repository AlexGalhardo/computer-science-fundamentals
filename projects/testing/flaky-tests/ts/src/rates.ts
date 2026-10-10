import { z } from "zod";

// EN: CAUSE 4: REAL NETWORK. The exchange rate comes from another service over HTTP. A test that
//     makes the real call is testing two things at once: our code, and whether that service and
//     the network between us are healthy right now. When it fails, nobody knows which one broke.
//     The fix is to make the HTTP function a parameter. A test passes a stub that answers
//     instantly with a prepared response, including the error responses that a healthy service
//     would never give on demand.
// PT: CAUSA 4: REDE REAL. A taxa de câmbio vem de outro serviço por HTTP. Um teste que faz a
//     chamada real testa duas coisas ao mesmo tempo: o nosso código, e se aquele serviço e a rede
//     entre nós estão saudáveis agora. Quando falha, ninguém sabe qual dos dois quebrou.
//     A correção é transformar a função HTTP em parâmetro. Um teste passa um stub que responde
//     na hora com uma resposta preparada, incluindo as respostas de erro que um serviço saudável
//     nunca daria sob encomenda.
// ES: CAUSA 4: RED REAL. El tipo de cambio viene de otro servicio por HTTP. Una prueba que hace la
//     llamada real prueba dos cosas a la vez: nuestro código, y si ese servicio y la red entre
//     nosotros están sanos ahora mismo. Cuando falla, nadie sabe cuál de los dos se rompió.
//     La corrección es convertir la función HTTP en un parámetro. Una prueba pasa un stub que
//     responde al instante con una respuesta preparada, incluidas las respuestas de error que un
//     servicio sano nunca daría a pedido.
export type Http = (url: string) => Promise<Response>;

// EN: The body comes from outside the program, so its shape is checked before it is used.
// PT: O corpo vem de fora do programa, então o formato é conferido antes de ser usado.
// ES: El cuerpo viene de fuera del programa, así que se verifica su forma antes de usarlo.
const rateSchema = z.object({ pair: z.string(), rate: z.number().positive() });

export class RateUnavailableError extends Error {
	constructor(pair: string, status: number) {
		super(`rate ${pair} unavailable (HTTP ${status})`);
		this.name = "RateUnavailableError";
	}
}

export async function fetchRate(pair: string, baseUrl: string, http: Http = fetch): Promise<number> {
	const response = await http(`${baseUrl}/rates/${pair}`);
	if (!response.ok) {
		throw new RateUnavailableError(pair, response.status);
	}
	return rateSchema.parse(await response.json()).rate;
}

// EN: The flaky test talks to a service created by this mini-project, inside docker-compose. The
//     address is refused unless the host is local, so the test can never reach a third party.
// PT: O teste intermitente conversa com um serviço criado por este mini-projeto, dentro do
//     docker-compose. O endereço é recusado se o host não for local, então o teste nunca alcança
//     um terceiro.
// ES: La prueba intermitente habla con un servicio creado por este mini-proyecto, dentro de
//     docker-compose. La dirección se rechaza si el host no es local, así que la prueba nunca
//     llega a un tercero.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "unstable-api"]);

export function localRatesUrl(): string {
	const url = new URL(process.env.RATES_URL ?? "http://localhost:3000");
	if (!LOCAL_HOSTS.has(url.hostname)) {
		throw new Error(`RATES_URL must be a local service, got ${url.hostname}`);
	}
	return url.origin;
}
