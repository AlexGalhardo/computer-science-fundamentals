// EN: The same scenario runs against both apps. Against the vulnerable app the tests assert that
//     the flaw is observable. Against the fixed app they assert that the same attempt is blocked
//     AND that normal use still works, because a "fix" that breaks the login is not a fix.
// PT: O mesmo cenário roda contra os dois apps. Contra o app vulnerável os testes afirmam que a
//     falha é observável. Contra o app corrigido afirmam que a mesma tentativa é barrada E que o
//     uso normal continua funcionando, porque uma "correção" que quebra o login não é correção.
// ES: El mismo escenario corre contra las dos apps. Contra la app vulnerable las pruebas afirman que la
//     falla es observable. Contra la app corregida afirman que el mismo intento es bloqueado Y que el
//     uso normal sigue funcionando, porque una "corrección" que rompe el inicio de sesión no es corrección.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import { loadConfig } from "../src/config";
import { createPool } from "../src/db";
import { createFixedApp } from "../src/fixed/fixed-app";
import { fixedFindUser, fixedSearchProducts } from "../src/fixed/fixed-queries";
import {
	runScenario,
	type ScenarioResult,
	TAUTOLOGY_USERNAME,
	UNION_SEARCH,
	VALID_PASSWORD,
	VALID_USERNAME,
} from "../src/scenario";
import { createVulnerableApp } from "../src/vulnerable/vulnerable-app";

const config = loadConfig();
let ownerPool: Pool;
let readonlyPool: Pool;
let vulnerable: ScenarioResult;
let fixed: ScenarioResult;

beforeAll(async () => {
	ownerPool = createPool(config.OWNER_DATABASE_URL);
	readonlyPool = createPool(config.READONLY_DATABASE_URL);
	vulnerable = await runScenario(createVulnerableApp(ownerPool));
	fixed = await runScenario(createFixedApp(readonlyPool));
});

afterAll(async () => {
	await ownerPool.end();
	await readonlyPool.end();
});

describe("vulnerable app: the flaws are observable", () => {
	test("normal use works, so the flaw is not a broken feature", () => {
		expect(vulnerable.validLogin).toEqual({ status: 200, loggedInAs: VALID_USERNAME });
		expect(vulnerable.wrongPasswordLogin).toEqual({ status: 401, loggedInAs: null });
		expect(vulnerable.normalSearch).toEqual({ status: 200, rows: 1, leaked: [] });
	});

	test("login bypass: the tautology logs in without knowing any password", () => {
		expect(vulnerable.tautologyLogin.status).toBe(200);
		expect(vulnerable.tautologyLogin.loggedInAs).not.toBeNull();
	});

	test("data exposure: the UNION returns the rows of the secrets table", () => {
		expect(vulnerable.unionSearch.status).toBe(200);
		expect(vulnerable.unionSearch.leaked).toContain("FAKE-CARD-0000-0000-0000-0001");
		expect(vulnerable.unionSearch.leaked).toHaveLength(3);
	});
});

describe("fixed app: the same attempts are blocked", () => {
	test("normal use still works", () => {
		expect(fixed.validLogin).toEqual({ status: 200, loggedInAs: VALID_USERNAME });
		expect(fixed.wrongPasswordLogin).toEqual({ status: 401, loggedInAs: null });
		expect(fixed.normalSearch).toEqual({ status: 200, rows: 1, leaked: [] });
	});

	test("login bypass blocked: validation refuses the input before any query runs", () => {
		expect(fixed.tautologyLogin).toEqual({ status: 422, loggedInAs: null });
	});

	test("data exposure blocked: the UNION text is searched as a product name and matches nothing", () => {
		expect(fixed.unionSearch).toEqual({ status: 200, rows: 0, leaked: [] });
	});

	// EN: These two call the queries directly, skipping the Zod validation of the routes. They
	//     prove that the placeholders alone stop the injection: validation is an extra layer,
	//     not the fix.
	// PT: Estes dois chamam as consultas diretamente, pulando a validação Zod das rotas. Eles
	//     provam que os marcadores sozinhos barram a injeção: a validação é uma camada a mais,
	//     não a correção.
	// ES: Estas dos llaman a las consultas directamente, saltándose la validación Zod de las rutas.
	//     Prueban que los marcadores por sí solos detienen la inyección: la validación es una capa
	//     más, no la corrección.
	test("parameterised login treats the tautology as a username that does not exist", async () => {
		expect(await fixedFindUser(ownerPool, TAUTOLOGY_USERNAME, "anything")).toBeNull();
		expect(await fixedFindUser(ownerPool, VALID_USERNAME, VALID_PASSWORD)).toEqual({
			id: 2,
			username: VALID_USERNAME,
		});
	});

	test("parameterised search treats the UNION and LIKE wildcards as plain text", async () => {
		expect(await fixedSearchProducts(ownerPool, UNION_SEARCH)).toEqual([]);
		expect(await fixedSearchProducts(ownerPool, "%")).toEqual([]);
		expect(await fixedSearchProducts(ownerPool, "fake")).toHaveLength(3);
	});
});
