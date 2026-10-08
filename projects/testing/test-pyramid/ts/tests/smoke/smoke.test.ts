import { expect, test } from "bun:test";
import { baseUrl } from "../base-url";

// EN: SMOKE SUITE. A handful of shallow checks against the service that is actually running:
//     does it answer, is the database behind it usable, is the page served. It proves nothing
//     about the business rules. Its job is to say, in a second, whether the build or the
//     deployment is broken, before anyone spends minutes on the slower suites.
// PT: SUÍTE DE FUMAÇA. Um punhado de checagens rasas contra o serviço que está de fato rodando:
//     ele responde, o banco por trás é utilizável, a página é servida. Não prova nada sobre as
//     regras de negócio. O papel dela é dizer, em um segundo, se o build ou a implantação estão
//     quebrados, antes que alguém gaste minutos nas suítes mais lentas.
const BASE_URL = baseUrl();

test("the health endpoint answers 200", async () => {
	const response = await fetch(`${BASE_URL}/health`);
	expect(response.status).toBe(200);
});

test("the home page is served as HTML", async () => {
	const response = await fetch(`${BASE_URL}/`);
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toContain("text/html");
});

test("the catalogue is not empty", async () => {
	const response = await fetch(`${BASE_URL}/api/products`);
	const products: unknown = await response.json();
	expect(Array.isArray(products) && products.length > 0).toBe(true);
});
