// EN: The fake "public" site of the lab. It plays the role of the internet: it lives on the
//     `lab-public` network, whose subnet (203.0.113.0/24) is a documentation range that is not
//     private and is never routed on the real internet. Besides a normal article, it has the
//     routes a remote site outside your control could have: redirects, a huge body and a slow
//     answer. Each one exists to show why one line of the fix is there.
// PT: O site "público" falso do laboratório. Ele faz o papel da internet: vive na rede
//     `lab-public`, cuja sub-rede (203.0.113.0/24) é uma faixa de documentação que não é privada
//     e nunca é roteada na internet real. Além de um artigo normal, ele tem as rotas que um site
//     remoto fora do seu controle poderia ter: redirecionamentos, um corpo enorme e uma resposta
//     lenta. Cada uma existe para mostrar por que uma linha da correção está lá.
// ES: El sitio "público" falso del laboratorio. Hace el papel de internet: vive en la red
//     `lab-public`, cuya subred (203.0.113.0/24) es un rango de documentación que no es privado
//     y nunca se enruta en la internet real. Además de un artículo normal, tiene las rutas que un sitio
//     remoto fuera de tu control podría tener: redirecciones, un cuerpo enorme y una respuesta
//     lenta. Cada una existe para mostrar por qué una línea de la corrección está ahí.

import { loadConfig, loadPort } from "../config";

const config = loadConfig();

const ARTICLE = `<!doctype html>
<html lang="en">
<head><title>Fake public article</title></head>
<body><h1>Fake public article</h1><p>Harmless text served by the fake public site of the lab.</p></body>
</html>
`;

const CHUNK = "x".repeat(64 * 1024);

function redirect(location: string): Response {
	return new Response(null, { status: 302, headers: { location } });
}

// EN: One mebibyte sent as a stream, so there is no `Content-Length` to warn the client: only
//     counting the bytes while reading can stop it.
// PT: Um mebibyte enviado como fluxo, então não há `Content-Length` para avisar o cliente: só
//     contar os bytes durante a leitura consegue interromper.
// ES: Un mebibyte enviado como flujo, así que no hay `Content-Length` que avise al cliente: solo
//     contar los bytes durante la lectura logra interrumpirlo.
function bigBody(): Response {
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		start(controller): void {
			for (let sent = 0; sent < 16; sent++) {
				controller.enqueue(encoder.encode(CHUNK));
			}
			controller.close();
		},
	});
	return new Response(stream, { headers: { "content-type": "text/plain" } });
}

const server = Bun.serve({
	port: loadPort(),
	hostname: "0.0.0.0",
	async fetch(request: Request): Promise<Response> {
		const { pathname } = new URL(request.url);
		switch (pathname) {
			case "/health":
				return new Response("ok");
			case "/article":
				return new Response(ARTICLE, { headers: { "content-type": "text/html; charset=utf-8" } });
			case "/redirect-to-article":
				return redirect("/article");
			// EN: A public page that answers "go to this internal address". The site itself cannot
			//     reach the internal service; it only tells the caller to go there.
			// PT: Uma página pública que responde "vá para este endereço interno". O site em si não
			//     alcança o serviço interno; ele só manda quem chamou ir até lá.
			// ES: Una página pública que responde "ve a esta dirección interna". El sitio en sí no
			//     alcanza el servicio interno; solo manda a quien llamó a ir hasta allá.
			case "/redirect-to-internal":
				return redirect(`${config.INTERNAL_ADMIN_ORIGIN}/secret`);
			case "/redirect-loop":
				return redirect("/redirect-loop");
			case "/big":
				return bigBody();
			case "/slow":
				await Bun.sleep(5000);
				return new Response("finally");
			default:
				return new Response("not found", { status: 404 });
		}
	},
});

console.log(`public-site (fake) listening on port ${server.port}`);
