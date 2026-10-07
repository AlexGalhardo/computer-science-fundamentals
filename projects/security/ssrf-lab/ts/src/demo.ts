// EN: The demo: `docker compose run --rm demo`. It runs the same scenario against the vulnerable
//     app and against the fixed app and narrates what each one answered. It also prints the
//     addresses the two host names resolve to, because the fix decides on those addresses.
// PT: A demo: `docker compose run --rm demo`. Ela roda o mesmo cenário contra o app vulnerável e
//     contra o app corrigido e narra o que cada um respondeu. Também imprime os endereços para
//     os quais os dois nomes de host resolvem, porque a correção decide com base nesses endereços.

import { loadConfig } from "./config";
import { classifyAddress } from "./fixed/fixed-address-classifier";
import { buildPolicy, createFixedApp } from "./fixed/fixed-app";
import { systemResolver } from "./fixed/fixed-safe-fetch";
import { type PreviewObservation, runScenario, type ScenarioResult, scenarioUrls } from "./scenario";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";

function say(en: string, pt: string): void {
	console.log(`EN: ${en}`);
	console.log(`PT: ${pt}`);
	console.log("");
}

function line(label: string, observation: PreviewObservation): void {
	const outcome =
		observation.reason === null ? `title: ${JSON.stringify(observation.title)}` : `refused: ${observation.reason}`;
	const leak = observation.leaked ? "FAKE TOKEN LEAKED" : "no leak";
	console.log(`  ${label.padEnd(28)} -> HTTP ${observation.status}, ${outcome}, ${leak}`);
}

function report(result: ScenarioResult): void {
	line("public article", result.publicArticle);
	line("public -> public redirect", result.publicRedirect);
	line("internal URL, direct", result.directInternal);
	line("public -> internal redirect", result.redirectToInternal);
	console.log("");
}

async function describeHost(origin: string): Promise<void> {
	const host = new URL(origin).hostname;
	const addresses = await systemResolver(host);
	const described = addresses.map((address) => `${address} (${classifyAddress(address)})`).join(", ");
	console.log(`  ${host.padEnd(16)} -> ${described}`);
}

const config = loadConfig();
const urls = scenarioUrls(config);

console.log("=== SSRF lab (local, internal networks, fake data only) ===\n");

say(
	"1. The feature is a link preview: the SERVER fetches a URL given by the user. These are the four URLs of the scenario:",
	"1. A funcionalidade é uma prévia de link: o SERVIDOR busca uma URL dada pelo usuário. Estas são as quatro URLs do cenário:",
);
for (const url of Object.values(urls)) {
	console.log(`  ${url}`);
}
console.log("");

say(
	"2. Where the two host names point. The fix judges these addresses, not the text of the URL:",
	"2. Para onde os dois nomes de host apontam. A correção julga estes endereços, não o texto da URL:",
);
await describeHost(config.PUBLIC_SITE_ORIGIN);
await describeHost(config.INTERNAL_ADMIN_ORIGIN);
console.log("");

say(
	"3. Scenario against the VULNERABLE app: it fetches anything, so the internal service answers, directly and through the redirect.",
	"3. Cenário contra o app VULNERÁVEL: ele busca qualquer coisa, então o serviço interno responde, diretamente e pelo redirecionamento.",
);
report(await runScenario(createVulnerableApp(), config));

say(
	"4. Same scenario against the FIXED app: both attempts are refused before any connection to the internal service, and normal previews still work.",
	"4. Mesmo cenário contra o app CORRIGIDO: as duas tentativas são recusadas antes de qualquer conexão com o serviço interno, e as prévias normais continuam funcionando.",
);
report(await runScenario(createFixedApp(buildPolicy(config)), config));

say(
	"5. Defence in depth: even with the internal name wrongly added to the allow-list, the address check still refuses it.",
	"5. Defesa em profundidade: mesmo com o nome interno colocado por engano na lista de permissão, a checagem de endereço ainda recusa.",
);
const policy = buildPolicy(config);
const tooWide = {
	...policy,
	allowedHosts: [...policy.allowedHosts, new URL(config.INTERNAL_ADMIN_ORIGIN).hostname],
};
const misconfigured = await runScenario(createFixedApp(tooWide), config);
line("internal URL, direct", misconfigured.directInternal);
line("public -> internal redirect", misconfigured.redirectToInternal);
