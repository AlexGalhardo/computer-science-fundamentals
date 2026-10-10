// EN: The same scenario runs against both apps. Against the vulnerable app the tests assert that
//     the flaw is observable. Against the fixed app they assert that the same attempts are
//     blocked AND that normal use still works, because a "fix" that breaks the preview is not a
//     fix. The fake internal service counts the requests it received, so "blocked" is checked
//     as "no request was made", not only as "the token was not shown".
// PT: O mesmo cenário roda contra os dois apps. Contra o app vulnerável os testes afirmam que a
//     falha é observável. Contra o app corrigido afirmam que as mesmas tentativas são barradas E
//     que o uso normal continua funcionando, porque uma "correção" que quebra a prévia não é
//     correção. O serviço interno falso conta as requisições que recebeu, então "barrado" é
//     conferido como "nenhuma requisição foi feita", não só como "o token não foi mostrado".
// ES: El mismo escenario corre contra las dos apps. Contra la app vulnerable las pruebas afirman que la
//     falla es observable. Contra la app corregida afirman que los mismos intentos son bloqueados Y
//     que el uso normal sigue funcionando, porque una "corrección" que rompe la vista previa no es
//     corrección. El servicio interno falso cuenta las solicitudes que recibió, así que "bloqueado" se
//     comprueba como "no se hizo ninguna solicitud", no solo como "el token no se mostró".

import { beforeAll, describe, expect, test } from "bun:test";
import { z } from "zod";
import { loadConfig } from "../src/config";
import { buildPolicy, createFixedApp } from "../src/fixed/fixed-app";
import { runScenario, type ScenarioResult } from "../src/scenario";
import { createVulnerableApp } from "../src/vulnerable/vulnerable-app";

const config = loadConfig();
const internalHost = new URL(config.INTERNAL_ADMIN_ORIGIN).hostname;
const hitsSchema = z.object({ secretHits: z.number() });

// EN: The test container sits on the internal network, so it can ask the counter directly.
// PT: O contêiner de teste está na rede interna, então consegue perguntar ao contador diretamente.
// ES: El contenedor de prueba está en la red interna, así que puede preguntar al contador directamente.
async function secretHits(): Promise<number> {
	const response = await fetch(`${config.INTERNAL_ADMIN_ORIGIN}/hits`);
	return hitsSchema.parse(await response.json()).secretHits;
}

const ARTICLE = { status: 200, title: "Fake public article", leaked: false, reason: null };

let vulnerable: ScenarioResult;
let vulnerableHits = 0;
let fixed: ScenarioResult;
let fixedHits = 0;
let misconfigured: ScenarioResult;
let misconfiguredHits = 0;

beforeAll(async () => {
	const start = await secretHits();
	vulnerable = await runScenario(createVulnerableApp(), config);
	const afterVulnerable = await secretHits();
	vulnerableHits = afterVulnerable - start;

	const policy = buildPolicy(config);
	fixed = await runScenario(createFixedApp(policy), config);
	const afterFixed = await secretHits();
	fixedHits = afterFixed - afterVulnerable;

	// EN: A deliberately wrong configuration: somebody added the internal name to the allow-list.
	// PT: Uma configuração errada de propósito: alguém colocou o nome interno na lista de permissão.
	// ES: Una configuración errónea a propósito: alguien puso el nombre interno en la lista de permitidos.
	const tooWide = { ...policy, allowedHosts: [...policy.allowedHosts, internalHost] };
	misconfigured = await runScenario(createFixedApp(tooWide), config);
	misconfiguredHits = (await secretHits()) - afterFixed;
});

describe("vulnerable app: the flaw is observable", () => {
	test("normal use works, so the flaw is not a broken feature", () => {
		expect(vulnerable.publicArticle).toEqual(ARTICLE);
		expect(vulnerable.publicRedirect).toEqual(ARTICLE);
	});

	test("the internal service is reached through the feature and its fake token leaks", () => {
		expect(vulnerable.directInternal.status).toBe(200);
		expect(vulnerable.directInternal.leaked).toBe(true);
	});

	test("a public URL that redirects to the internal service leaks the token too", () => {
		expect(vulnerable.redirectToInternal.status).toBe(200);
		expect(vulnerable.redirectToInternal.leaked).toBe(true);
	});

	test("the internal service really received both requests", () => {
		expect(vulnerableHits).toBe(2);
	});
});

describe("fixed app: the same attempts are blocked", () => {
	test("normal use still works, including a redirect between public pages", () => {
		expect(fixed.publicArticle).toEqual(ARTICLE);
		expect(fixed.publicRedirect).toEqual(ARTICLE);
	});

	test("the internal URL is refused by the allow-list", () => {
		expect(fixed.directInternal).toEqual({ status: 403, title: null, leaked: false, reason: "host-not-allowed" });
	});

	test("the redirect to the internal service is refused: the second hop is validated too", () => {
		expect(fixed.redirectToInternal).toEqual({
			status: 403,
			title: null,
			leaked: false,
			reason: "host-not-allowed",
		});
	});

	test("the internal service received no request at all", () => {
		expect(fixedHits).toBe(0);
	});
});

describe("fixed app with the internal name wrongly allow-listed: the address check still blocks", () => {
	test("normal use still works", () => {
		expect(misconfigured.publicArticle).toEqual(ARTICLE);
		expect(misconfigured.publicRedirect).toEqual(ARTICLE);
	});

	test("the name is allowed, but it resolves to a private address", () => {
		expect(misconfigured.directInternal).toEqual({
			status: 403,
			title: null,
			leaked: false,
			reason: "address-not-allowed",
		});
		expect(misconfigured.redirectToInternal).toEqual({
			status: 403,
			title: null,
			leaked: false,
			reason: "address-not-allowed",
		});
	});

	test("the internal service received no request at all", () => {
		expect(misconfiguredHits).toBe(0);
	});
});
