// EN: The demo. It sends the same harmless input to the vulnerable app and to the fixed app and
//     prints what each one answers, so the difference can be read in the terminal: raw markup
//     on one side, encoded text and a policy header on the other. It has no browser, so it
//     shows what the server SENDS; the Playwright tests (`e2e` service) show what a browser
//     DOES with it.
// PT: A demo. Ela envia a mesma entrada inofensiva para o app vulnerável e para o corrigido e
//     imprime o que cada um responde, para que a diferença possa ser lida no terminal: marcação
//     crua de um lado, texto codificado e um cabeçalho de política do outro. Ela não tem
//     navegador, então mostra o que o servidor ENVIA; os testes Playwright (serviço `e2e`)
//     mostram o que um navegador FAZ com isso.
// ES: La demo. Envía la misma entrada inofensiva a la app vulnerable y a la corregida e
//     imprime lo que responde cada una, para que la diferencia pueda leerse en la terminal: marcado
//     crudo de un lado, texto codificado y una cabecera de política del otro. No tiene
//     navegador, así que muestra lo que el servidor ENVÍA; las pruebas Playwright (servicio `e2e`)
//     muestran lo que un navegador HACE con eso.

import { FAKE_AUTHOR, MARKER, SCRIPT_INPUT } from "./lab-inputs";
import { loadLabTargets } from "./lab-targets";

const targets = loadLabTargets(process.env);
const versions = [
	{ name: "vulnerable", url: targets.vulnerable },
	{ name: "fixed", url: targets.fixed },
] as const;

function linesWith(text: string, needle: string): string[] {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.includes(needle));
}

function verdict(html: string): string {
	return html.includes(SCRIPT_INPUT)
		? "RAW markup: a browser parses this as a <script> element"
		: "ENCODED: a browser displays this as text";
}

function report(name: string, response: Response, html: string): void {
	console.log(`  [${name}]`);
	for (const line of linesWith(html, MARKER)) console.log(`    html:  ${line}`);
	console.log(`    what:  ${verdict(html)}`);
	console.log(
		`    csp:   ${response.headers.get("content-security-policy") ?? "(no Content-Security-Policy header)"}`,
	);
}

console.log("xss-csp-lab demo");
console.log(`The only input used: ${SCRIPT_INPUT}`);
console.log("It sets a flag on the page and does nothing else.\n");

console.log("1. Reflected XSS: GET /search?q=<input>");
for (const version of versions) {
	const response = await fetch(`${version.url}/search?q=${encodeURIComponent(SCRIPT_INPUT)}`);
	report(version.name, response, await response.text());
}

console.log("\n2. Stored XSS: POST /guestbook, then every later GET /guestbook");
for (const version of versions) {
	await fetch(`${version.url}/guestbook`, {
		method: "POST",
		body: new URLSearchParams({ author: FAKE_AUTHOR, message: SCRIPT_INPUT }),
		redirect: "manual",
	});
	const response = await fetch(`${version.url}/guestbook`);
	report(version.name, response, await response.text());
}

console.log("\n3. CSP as a second layer: GET /csp-only/search?q=<input> (encoding bug kept on purpose)");
{
	const response = await fetch(`${targets.vulnerable}/csp-only/search?q=${encodeURIComponent(SCRIPT_INPUT)}`);
	report("vulnerable + CSP header", response, await response.text());
	console.log("    note:  the markup is still injected. The browser blocks the inline script because of");
	console.log("           script-src 'self'. CSP limits the damage of a bug; encoding removes the bug.");
}

console.log("\n4. DOM-based XSS: the line of browser code that writes location.hash into the page");
for (const version of versions) {
	const response = await fetch(`${version.url}/static/${version.name}-dom-client.js`);
	const code = await response.text();
	console.log(`  [${version.name}]`);
	for (const line of linesWith(code, "document.getElementById")) console.log(`    js:    ${line}`);
}
console.log("    note:  innerHTML parses the text as HTML, textContent writes it as text.");

console.log("\nTo see a real browser run (or refuse to run) the input: docker compose run --rm e2e");
