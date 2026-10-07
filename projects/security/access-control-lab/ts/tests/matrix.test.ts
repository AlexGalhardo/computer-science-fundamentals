// EN: The authorisation test matrix. Rows are who is calling, columns are what they try, and
//     every cell is one expected HTTP status. The tests are generated from the tables below, so
//     adding a role or a route means adding a row or a column, and a forgotten cell does not
//     compile. All columns target invoice 1001, which belongs to alice-fake (the "owner").
// PT: A matriz de testes de autorização. As linhas são quem chama, as colunas são o que tentam,
//     e cada célula é um status HTTP esperado. Os testes são gerados das tabelas abaixo, então
//     adicionar um papel ou uma rota é adicionar uma linha ou uma coluna, e uma célula esquecida
//     não compila. Todas as colunas miram a fatura 1001, que pertence à alice-fake (a "owner").

import { describe, expect, test } from "bun:test";
import { ALICE_INVOICE_ID, createStore, TOKENS } from "../src/data";
import { createFixedApp } from "../src/fixed/fixed-app";
import { type CallOptions, call, createLab, listInvoicesAs, type Version } from "../src/scenario";

const ACTORS = {
	anonymous: undefined,
	owner: TOKENS.alice,
	"other user": TOKENS.bob,
	admin: TOKENS.carol,
} as const;

type Actor = keyof typeof ACTORS;

const OPERATIONS = {
	read: { path: `/invoices/${ALICE_INVOICE_ID}`, method: "GET" },
	update: { path: `/invoices/${ALICE_INVOICE_ID}`, method: "PATCH", body: { memo: "matrix" } },
	delete: { path: `/invoices/${ALICE_INVOICE_ID}`, method: "DELETE" },
	list: { path: "/invoices", method: "GET" },
	"admin route": { path: "/admin/users", method: "GET" },
} as const satisfies Record<string, { path: string } & CallOptions>;

type Operation = keyof typeof OPERATIONS;
type Matrix = Record<Actor, Record<Operation, number>>;

// EN: 401 = we do not know who you are. 403 = we know, and the answer is no. 200 = allowed.
// PT: 401 = não sabemos quem você é. 403 = sabemos, e a resposta é não. 200 = permitido.
const FIXED: Matrix = {
	anonymous: { read: 401, update: 401, delete: 401, list: 401, "admin route": 401 },
	owner: { read: 200, update: 200, delete: 200, list: 200, "admin route": 403 },
	"other user": { read: 403, update: 403, delete: 403, list: 200, "admin route": 403 },
	admin: { read: 200, update: 200, delete: 200, list: 200, "admin route": 200 },
};

// EN: The same matrix for the vulnerable API. Compare the two tables: authentication works in
//     both (the anonymous row is identical), and every other cell is 200, because "logged in"
//     is the only question the vulnerable API ever asks.
// PT: A mesma matriz para a API vulnerável. Compare as duas tabelas: a autenticação funciona nas
//     duas (a linha anonymous é idêntica), e todas as outras células são 200, porque "logado" é
//     a única pergunta que a API vulnerável faz.
const VULNERABLE: Matrix = {
	anonymous: { read: 401, update: 401, delete: 401, list: 401, "admin route": 401 },
	owner: { read: 200, update: 200, delete: 200, list: 200, "admin route": 200 },
	"other user": { read: 200, update: 200, delete: 200, list: 200, "admin route": 200 },
	admin: { read: 200, update: 200, delete: 200, list: 200, "admin route": 200 },
};

const MATRICES: Record<Version, Matrix> = { vulnerable: VULNERABLE, fixed: FIXED };
const ACTOR_NAMES = Object.keys(ACTORS) as Actor[];
const OPERATION_NAMES = Object.keys(OPERATIONS) as Operation[];
const ORIGINAL_MEMO = "alice-fake: fake consulting invoice";

for (const version of ["fixed", "vulnerable"] as const) {
	describe(`authorisation matrix: ${version} API`, () => {
		for (const actor of ACTOR_NAMES) {
			for (const operation of OPERATION_NAMES) {
				const expected = MATRICES[version][actor][operation];
				test(`${actor} x ${operation} -> ${expected}`, async () => {
					// EN: One fresh lab per cell, so a delete in one cell cannot change another.
					// PT: Um laboratório novo por célula, então um delete em uma célula não muda outra.
					const lab = createLab(version);
					const { path, ...options } = OPERATIONS[operation];
					const result = await call(lab.app, path, { ...options, token: ACTORS[actor] });
					expect(result.status).toBe(expected);

					// EN: A refusal must also leave the record untouched and say nothing about it.
					// PT: Uma recusa também precisa deixar o registro intacto e não dizer nada sobre ele.
					if (expected !== 200) {
						expect(lab.store.invoices.get(ALICE_INVOICE_ID)?.memo).toBe(ORIGINAL_MEMO);
						expect(JSON.stringify(result.body)).not.toContain("alice");
					}
				});
			}
		}
	});
}

// EN: A 200 on the list is not enough: what matters is which invoices come back.
// PT: Um 200 na lista não basta: o que importa é quais faturas voltam.
describe("authorisation matrix: what the list contains on the fixed API", () => {
	const VISIBLE: Record<Actor, number[]> = {
		anonymous: [],
		owner: [1001, 1003],
		"other user": [1002, 1004],
		admin: [1001, 1002, 1003, 1004],
	};

	test.each(ACTOR_NAMES)("%s sees exactly the invoices the read rule allows", async (actor) => {
		const list = await listInvoicesAs(createLab("fixed"), ACTORS[actor]);
		expect(list.ids).toEqual(VISIBLE[actor]);
	});
});

// EN: Deny by default, checked against the router itself: every route registered in the fixed
//     app must refuse an anonymous caller. A route added later without a check breaks this test.
// PT: Negar por padrão, conferido contra o próprio roteador: toda rota registrada no app
//     corrigido precisa recusar um chamador anônimo. Uma rota criada depois sem verificação
//     quebra este teste.
describe("deny by default", () => {
	test("every registered route of the fixed API answers 401 without a session", async () => {
		const app = createFixedApp(createStore());
		expect(app.routes.length).toBeGreaterThanOrEqual(6);
		for (const route of app.routes) {
			const response = await app.handle(
				new Request(`http://lab.invalid${route.path.replace(":id", String(ALICE_INVOICE_ID))}`, {
					method: route.method,
				}),
			);
			expect(`${route.method} ${route.path} -> ${response.status}`).toBe(`${route.method} ${route.path} -> 401`);
		}
	});

	test("an unknown token is anonymous", async () => {
		const result = await call(createLab("fixed").app, `/invoices/${ALICE_INVOICE_ID}`, {
			token: "FAKE-TOKEN-nobody-not-real",
		});
		expect(result.status).toBe(401);
	});
});
