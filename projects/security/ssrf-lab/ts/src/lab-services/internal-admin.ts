// EN: The fake internal service of the lab. It has no login on purpose: it "trusts the network",
//     which is the assumption SSRF breaks. It lives only on the internal `lab` network, on a
//     private address, and publishes no port. The token it returns is fake.
// PT: O serviço interno falso do laboratório. Ele não tem login de propósito: ele "confia na
//     rede", que é a suposição que o SSRF quebra. Ele vive só na rede interna `lab`, em um
//     endereço privado, e não publica porta nenhuma. O token que ele devolve é falso.

import { FAKE_INTERNAL_TOKEN, loadPort } from "../config";

// EN: Counts how many times the secret was asked for. The tests read it to prove something
//     stronger than "the token was not shown": the fixed app made NO request at all. That
//     matters because a request can do harm even when its answer is never returned to the user
//     (blind SSRF): an internal route may change state just by being called.
// PT: Conta quantas vezes o segredo foi pedido. Os testes leem esse número para provar algo mais
//     forte do que "o token não foi mostrado": o app corrigido NÃO fez requisição nenhuma. Isso
//     importa porque uma requisição pode causar dano mesmo quando a resposta nunca volta para o
//     usuário (SSRF cego): uma rota interna pode mudar estado só por ser chamada.
let secretHits = 0;

const server = Bun.serve({
	port: loadPort(),
	hostname: "0.0.0.0",
	fetch(request: Request): Response {
		const { pathname } = new URL(request.url);
		if (pathname === "/health") {
			return new Response("ok");
		}
		if (pathname === "/hits") {
			return Response.json({ secretHits });
		}
		if (pathname === "/secret") {
			secretHits++;
			return Response.json({
				service: "internal-admin",
				note: "fake internal data, reachable only from inside the lab network",
				token: FAKE_INTERNAL_TOKEN,
			});
		}
		return new Response("not found", { status: 404 });
	},
});

console.log(`internal-admin (fake) listening on port ${server.port}`);
