// EN: The HTTP surface of the TypeScript service as a plain function from Request to Response,
//     so the tests can call it with no network.
// PT: A superfície HTTP do serviço TypeScript como uma função simples de Request para Response,
//     para que os testes a chamem sem rede.

import { z } from "zod";
import { buildPriceIndex, quoteAfter, quoteBefore, sampleCatalog, sampleOrder } from "./pricing";
import { captureCpuProfile } from "./profiler";

const CATALOG_SIZE = 400;
const ORDER_LINES = 200;

// EN: The same catalog and the same order for every request. The work per request is
//     identical, so the only difference between the two routes is the variant of the code.
// PT: O mesmo catálogo e o mesmo pedido para toda requisição. O trabalho por requisição é
//     idêntico, então a única diferença entre as duas rotas é a variante do código.
const catalog = sampleCatalog(CATALOG_SIZE);
const order = sampleOrder(ORDER_LINES, CATALOG_SIZE);
const priceIndex = buildPriceIndex(catalog);

// EN: Named handlers, so their names show up as frames in the profile.
// PT: Handlers com nome, para que os nomes apareçam como quadros no perfil.
function handleQuoteBefore(): Response {
	return Response.json(quoteBefore(order, catalog));
}

function handleQuoteAfter(): Response {
	return Response.json(quoteAfter(order, priceIndex));
}

const profileQuerySchema = z.object({ seconds: z.coerce.number().int().min(1).max(30).default(5) });

// EN: The counterpart of Go's `/debug/pprof/profile?seconds=N`: profile the running server for
//     N seconds and return the result. It reveals internals, so it must never be reachable
//     from outside; here the network of docker-compose is internal.
// PT: O equivalente ao `/debug/pprof/profile?seconds=N` do Go: perfila o servidor em execução
//     por N segundos e devolve o resultado. Ele revela detalhes internos, então nunca pode ser
//     alcançável de fora; aqui a rede do docker-compose é interna.
async function handleCpuProfile(url: URL): Promise<Response> {
	const query = profileQuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!query.success) {
		return Response.json({ error: "seconds must be an integer from 1 to 30" }, { status: 400 });
	}
	try {
		return Response.json(await captureCpuProfile(query.data.seconds));
	} catch (error) {
		return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 409 });
	}
}

export async function app(request: Request): Promise<Response> {
	const url = new URL(request.url);
	if (request.method !== "GET") {
		return Response.json({ error: "method not allowed" }, { status: 405 });
	}
	switch (url.pathname) {
		case "/health":
			return new Response("ok");
		case "/version":
			return Response.json({ runtime: `bun ${Bun.version}` });
		case "/before/quote":
			return handleQuoteBefore();
		case "/after/quote":
			return handleQuoteAfter();
		case "/debug/cpuprofile":
			return handleCpuProfile(url);
		default:
			return Response.json({ error: "not found" }, { status: 404 });
	}
}
