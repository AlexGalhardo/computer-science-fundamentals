// EN: Drives a real Chromium (Playwright) against the lab and reads what the browser itself
//     measured: which protocol carried each resource and when each one started and ended.
// PT: Conduz um Chromium de verdade (Playwright) contra o laboratório e lê o que o próprio
//     navegador mediu: qual protocolo carregou cada recurso e quando cada um começou e terminou.
// ES: Conduce un Chromium de verdad (Playwright) contra el laboratorio y lee lo que el propio
//     navegador midió: qué protocolo transportó cada recurso y cuándo empezó y terminó cada uno.

import { createHash, type X509Certificate } from "node:crypto";
import { connect } from "node:tls";
import { type Browser, chromium } from "@playwright/test";
import { z } from "zod";
import { IMAGE_COUNT } from "./site";
import { type Condition, quicOrigins } from "./targets";

// EN: The lab certificate is signed by Caddy's internal CA, which no browser trusts. Instead of
//     turning certificate checks off, the browser is told to accept exactly ONE public key: the
//     one this lab server presents. The value Chromium expects is the SHA-256 of the
//     certificate's SubjectPublicKeyInfo, in Base64. This function connects once, reads the
//     certificate the server sends and computes that hash.
// PT: O certificado do laboratório é assinado pela CA interna do Caddy, em que nenhum navegador
//     confia. Em vez de desligar a checagem de certificados, o navegador é instruído a aceitar
//     exatamente UMA chave pública: a que este servidor do laboratório apresenta. O valor que o
//     Chromium espera é o SHA-256 do SubjectPublicKeyInfo do certificado, em Base64. Esta função
//     conecta uma vez, lê o certificado que o servidor envia e calcula esse hash.
// ES: El certificado del laboratorio está firmado por la CA interna de Caddy, en la que ningún
//     navegador confía. En lugar de desactivar la verificación de certificados, se instruye al
//     navegador para que acepte exactamente UNA clave pública: la que presenta este servidor
//     del laboratorio. El valor que espera Chromium es el SHA-256 del SubjectPublicKeyInfo del
//     certificado, en Base64. Esta función se conecta una vez, lee el certificado que envía el
//     servidor y calcula ese hash.
export function spkiHashOf(certificate: X509Certificate): string {
	const spki = certificate.publicKey.export({ type: "spki", format: "der" });
	return createHash("sha256").update(spki).digest("base64");
}

export function fetchServerKeyHash(host: string, port: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const socket = connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
			const certificate = socket.getPeerX509Certificate();
			socket.end();
			if (certificate === undefined) {
				reject(new Error("the server sent no certificate"));
				return;
			}
			resolve(spkiHashOf(certificate));
		});
		socket.setTimeout(10_000, () => socket.destroy(new Error("TLS connection timed out")));
		socket.on("error", reject);
	});
}

export interface LaunchOptions {
	host: string;
	conditions: readonly Condition[];
	keyHash: string;
}

// EN: Two Chromium flags, both scoped to the lab:
//     - `--ignore-certificate-errors-spki-list` accepts the lab certificate (see above).
//     - `--origin-to-force-quic-on` makes the browser speak QUIC to the h3 ports from the first
//       request. Without it a browser starts with TCP and only moves to HTTP/3 after the server
//       advertises it in an `Alt-Svc` header, so the first page load would not be HTTP/3.
// PT: Duas flags do Chromium, ambas restritas ao laboratório:
//     - `--ignore-certificate-errors-spki-list` aceita o certificado do laboratório (veja acima).
//     - `--origin-to-force-quic-on` faz o navegador falar QUIC com as portas h3 desde a primeira
//       requisição. Sem ela um navegador começa com TCP e só passa para HTTP/3 depois que o
//       servidor o anuncia em um cabeçalho `Alt-Svc`, então a primeira carga não seria HTTP/3.
// ES: Dos flags de Chromium, ambos restringidos al laboratorio:
//     - `--ignore-certificate-errors-spki-list` acepta el certificado del laboratorio (ver arriba).
//     - `--origin-to-force-quic-on` hace que el navegador hable QUIC con los puertos h3 desde la
//       primera petición. Sin él, un navegador empieza con TCP y solo pasa a HTTP/3 después de que
//       el servidor se lo anuncia en una cabecera `Alt-Svc`, así que la primera carga no sería HTTP/3.
export function launchBrowser(options: LaunchOptions, forceQuic = true): Promise<Browser> {
	const args = [`--ignore-certificate-errors-spki-list=${options.keyHash}`];
	if (forceQuic) {
		args.push(`--origin-to-force-quic-on=${quicOrigins(options.host, options.conditions).join(",")}`);
	}
	return chromium.launch({ args });
}

const entrySchema = z.object({
	name: z.string(),
	protocol: z.string(),
	startMs: z.number(),
	endMs: z.number(),
	bytes: z.number(),
});
export type ResourceEntry = z.infer<typeof entrySchema>;

const pageLoadSchema = z.object({
	loadMs: z.number().positive(),
	/** Time to open the connection of the document: TCP + TLS, or the QUIC handshake. */
	connectMs: z.number().min(0),
	documentProtocol: z.string(),
	loadedImages: z.number().int(),
	resources: z.array(entrySchema),
});
export type PageLoad = z.infer<typeof pageLoadSchema>;

// EN: One cold page load. A new browser context is like a new private window: empty cache and
//     no open connection, so the connection (TCP + TLS, or QUIC) is opened again and its cost
//     is part of the load time. The blank page opened first only starts the tab, so that the
//     time to create it is not counted. The numbers come from the browser's own Navigation
//     Timing and Resource Timing APIs, in milliseconds since the navigation started.
// PT: Uma carga de página a frio. Um contexto novo do navegador é como uma nova janela privada:
//     cache vazio e nenhuma conexão aberta, então a conexão (TCP + TLS, ou QUIC) é aberta de
//     novo e o custo dela faz parte do tempo de carga. A página em branco aberta antes só inicia
//     a aba, para que o tempo de criá-la não seja contado. Os números vêm das próprias APIs
//     Navigation Timing e Resource Timing do navegador, em milissegundos desde o início da
//     navegação.
// ES: Una carga de página en frío. Un contexto nuevo del navegador es como una ventana privada
//     nueva: caché vacía y ninguna conexión abierta, así que la conexión (TCP + TLS, o QUIC) se
//     abre de nuevo y su costo forma parte del tiempo de carga. La página en blanco abierta
//     antes solo inicia la pestaña, para que el tiempo de crearla no se cuente. Los números
//     vienen de las propias APIs Navigation Timing y Resource Timing del navegador, en
//     milisegundos desde que empezó la navegación.
export async function loadPage(browser: Browser, origin: string): Promise<PageLoad> {
	const context = await browser.newContext();
	try {
		const page = await context.newPage();
		await page.goto("about:blank");
		await page.goto(`${origin}/`, { waitUntil: "load", timeout: 120_000 });
		const raw: unknown = await page.evaluate(() => {
			const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
			const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
			return {
				loadMs: navigation.loadEventStart,
				connectMs: navigation.connectEnd - navigation.connectStart,
				documentProtocol: navigation.nextHopProtocol,
				loadedImages: Array.from(document.images).filter((image) => image.complete && image.naturalWidth > 0)
					.length,
				resources: resources.map((entry) => ({
					name: new URL(entry.name).pathname,
					protocol: entry.nextHopProtocol,
					startMs: entry.startTime,
					endMs: entry.responseEnd,
					bytes: entry.transferSize,
				})),
			};
		});
		return pageLoadSchema.parse(raw);
	} finally {
		await context.close();
	}
}

/** True when the document and all its images arrived, all over the expected protocol. */
export function usedOnly(load: PageLoad, alpn: string): boolean {
	return (
		load.documentProtocol === alpn &&
		load.resources.length === IMAGE_COUNT &&
		load.resources.every((entry) => entry.protocol === alpn)
	);
}
