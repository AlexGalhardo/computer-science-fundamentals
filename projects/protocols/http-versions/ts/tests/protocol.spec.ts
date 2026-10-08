// EN: The negotiated protocol, asserted for each of the nine ports. The browser is asked which
//     protocol carried the document and every one of the 200 images (`nextHopProtocol` of the
//     Navigation Timing and Resource Timing APIs), so the test does not trust the configuration:
//     it checks what really happened on the wire.
// PT: O protocolo negociado, conferido em cada uma das nove portas. O navegador é perguntado
//     sobre qual protocolo carregou o documento e cada uma das 200 imagens (`nextHopProtocol` das
//     APIs Navigation Timing e Resource Timing), então o teste não confia na configuração: ele
//     confere o que de fato aconteceu no fio.

import { type Browser, expect, test } from "@playwright/test";
import { fetchServerKeyHash, launchBrowser, loadPage } from "../src/browser";
import { IMAGE_COUNT } from "../src/site";
import { conditions, loadSettings, originOf, PROTOCOLS, portOf } from "../src/targets";

const settings = loadSettings();
const allConditions = conditions(settings);
const clean = allConditions[0];
const h3 = PROTOCOLS[2];

let keyHash: string;
let browser: Browser;

test.beforeAll(async () => {
	keyHash = await fetchServerKeyHash(settings.SITE_HOST, 8001);
	browser = await launchBrowser({ host: settings.SITE_HOST, conditions: allConditions, keyHash });
});

test.afterAll(async () => {
	await browser.close();
});

for (const condition of allConditions) {
	for (const protocol of PROTOCOLS) {
		const port = portOf(condition, protocol);
		test(`port ${port} (${condition.id}) serves the page over ${protocol.label}`, async () => {
			const load = await loadPage(browser, originOf(settings.SITE_HOST, port));
			expect(load.loadedImages).toBe(IMAGE_COUNT);
			expect(load.resources).toHaveLength(IMAGE_COUNT);
			expect(load.documentProtocol).toBe(protocol.alpn);
			expect([...new Set(load.resources.map((entry) => entry.protocol))]).toEqual([protocol.alpn]);
		});
	}
}

test("the HTTP/1.1 port refuses to negotiate h2: ALPN picks the best protocol both sides offer", async () => {
	// EN: The browser offers h2 and http/1.1 on every TLS port. The answer differs only because
	//     of what the server offers on each one.
	// PT: O navegador oferece h2 e http/1.1 em toda porta TLS. A resposta só difere por causa do
	//     que o servidor oferece em cada uma.
	const h1 = await loadPage(browser, originOf(settings.SITE_HOST, 8001));
	const h2 = await loadPage(browser, originOf(settings.SITE_HOST, 8002));
	expect(h1.documentProtocol).toBe("http/1.1");
	expect(h2.documentProtocol).toBe("h2");
});

test("the h3 port advertises HTTP/3 in Alt-Svc, and a browser that was not told starts over TCP", async ({
	request,
}) => {
	if (clean === undefined) {
		throw new Error("no clean condition");
	}
	const origin = originOf(settings.SITE_HOST, portOf(clean, h3));
	// EN: A plain HTTPS client (no QUIC) sees the advertisement: "this same origin is also
	//     available over h3 on UDP port 8003".
	// PT: Um cliente HTTPS comum (sem QUIC) vê o anúncio: "esta mesma origem também está
	//     disponível em h3 na porta UDP 8003".
	const response = await request.get(`${origin}/`, { ignoreHTTPSErrors: true });
	expect(response.headers()["alt-svc"]).toContain('h3=":8003"');

	// EN: A browser with no prior knowledge cannot guess that a server speaks HTTP/3, so its
	//     very first request goes over TCP and negotiates h2.
	// PT: Um navegador sem conhecimento prévio não tem como adivinhar que um servidor fala
	//     HTTP/3, então a sua primeira requisição vai por TCP e negocia h2.
	const untold = await launchBrowser({ host: settings.SITE_HOST, conditions: allConditions, keyHash }, false);
	try {
		const load = await loadPage(untold, origin);
		expect(load.documentProtocol).toBe("h2");
	} finally {
		await untold.close();
	}
});
