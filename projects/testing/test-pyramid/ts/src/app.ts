import { join } from "node:path";
import { z } from "zod";
import type { CartRepository } from "./cart-repository";
import { findProduct, PRODUCTS } from "./catalog";
import { type CartLine, discountCents, formatCents, subtotalCents, totalCents } from "./pricing";
import { bugIs } from "./seeded-bugs";

const PUBLIC_DIR = join(import.meta.dir, "..", "public");

// EN: Everything that arrives in a request body is untrusted, so it is parsed against a schema
//     before any use. Bug report #23 (a negative quantity lowering the total) was fixed by
//     `positive()` here, and the regression suite keeps it fixed.
// PT: Tudo que chega no corpo de uma requisição é não confiável, então é conferido contra um
//     esquema antes de qualquer uso. O relato de bug #23 (uma quantidade negativa baixando o
//     total) foi corrigido pelo `positive()` aqui, e a suíte de regressão o mantém corrigido.
const addToCartSchema = z.object({
	productId: z.string().min(1),
	quantity: z.number().int().positive().max(99),
});

export interface CartView {
	lines: CartLine[];
	subtotal: string;
	discount: string;
	total: string;
}

export type Handler = (request: Request) => Promise<Response>;

function json(body: unknown, status = 200): Response {
	return Response.json(body, { status });
}

function cartView(repository: CartRepository): CartView {
	const lines: CartLine[] = [];
	for (const stored of repository.list()) {
		const product = findProduct(stored.productId);
		if (product !== undefined) {
			lines.push({
				productId: product.id,
				name: product.name,
				unitPriceCents: product.unitPriceCents,
				quantity: stored.quantity,
			});
		}
	}
	const subtotal = subtotalCents(lines);
	return {
		lines,
		subtotal: formatCents(subtotal),
		discount: formatCents(discountCents(subtotal)),
		total: formatCents(totalCents(lines)),
	};
}

async function addToCart(request: Request, repository: CartRepository): Promise<Response> {
	const body: unknown = await request.json().catch(() => undefined);
	const parsed = addToCartSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: "invalid body" }, 400);
	}
	if (findProduct(parsed.data.productId) === undefined) {
		return json({ error: "unknown product" }, 404);
	}
	repository.add(parsed.data.productId, parsed.data.quantity);
	return json(cartView(repository), 201);
}

function staticFile(name: string, contentType: string): Response {
	return new Response(Bun.file(join(PUBLIC_DIR, name)), { headers: { "content-type": contentType } });
}

// EN: The application is a function from Request to Response that receives its repository as an
//     argument (dependency injection). The server passes it to `Bun.serve`, and an integration
//     test calls it directly with a repository on an in-memory database: same code, no socket.
// PT: A aplicação é uma função de Request para Response que recebe o repositório como argumento
//     (injeção de dependência). O servidor a entrega ao `Bun.serve`, e um teste de integração a
//     chama direto com um repositório em um banco em memória: mesmo código, sem socket.
export function createApp(repository: CartRepository): Handler {
	const route = async (request: Request): Promise<Response> => {
		const { pathname } = new URL(request.url);
		const key = `${request.method} ${pathname}`;
		switch (key) {
			case "GET /health":
				// EN: Health asks the database a real question, so "up" means "able to serve".
				// PT: O health faz uma pergunta real ao banco, então "no ar" significa "capaz de atender".
				repository.list();
				return json({ status: "ok" });
			case "GET /api/products":
				return json(PRODUCTS);
			case "GET /api/cart":
				return json(cartView(repository));
			case "POST /api/cart":
				return addToCart(request, repository);
			case "DELETE /api/cart":
				repository.clear();
				return new Response(null, { status: 204 });
			case "GET /":
				return staticFile("index.html", "text/html; charset=utf-8");
			case "GET /app.js":
				return staticFile("app.js", "text/javascript; charset=utf-8");
			case "GET /config.js":
				// EN: SEEDED BUG "e2e": the page is told not to redraw the cart after a click. The
				//     server and the database stay correct. Only a real browser shows the stale page.
				// PT: BUG SEMEADO "e2e": a página é instruída a não redesenhar o carrinho após um
				//     clique. O servidor e o banco seguem corretos. Só um navegador de verdade
				//     mostra a página desatualizada.
				return new Response(`window.SHOP_CONFIG = ${JSON.stringify({ refreshAfterAdd: !bugIs("e2e") })};\n`, {
					headers: { "content-type": "text/javascript; charset=utf-8" },
				});
			default:
				return json({ error: "not found" }, 404);
		}
	};
	return async (request) => {
		try {
			return await route(request);
		} catch (error) {
			return json({ error: error instanceof Error ? error.message : "internal error" }, 503);
		}
	};
}
