// EN: The same scenario functions run against both versions. Against the vulnerable API the
//     tests assert that the flaw is observable (MP-SEC-4.1). Against the fixed API they assert
//     that the same attempt is refused and that legitimate use still works (MP-SEC-4.2).
// PT: As mesmas funções de cenário rodam contra as duas versões. Contra a API vulnerável os
//     testes afirmam que a falha é observável (MP-SEC-4.1). Contra a corrigida, afirmam que a
//     mesma tentativa é recusada e que o uso legítimo continua funcionando (MP-SEC-4.2).
// ES: Las mismas funciones de escenario corren contra las dos versiones. Contra la API vulnerable las
//     pruebas afirman que la falla es observable (MP-SEC-4.1). Contra la corregida, afirman que el
//     mismo intento es rechazado y que el uso legítimo sigue funcionando (MP-SEC-4.2).

import { describe, expect, test } from "bun:test";
import { ALICE_INVOICE_ID, BOB_INVOICE_ID, MISSING_INVOICE_ID, TOKENS } from "../src/data";
import {
	call,
	callAdminRouteAsRegularUser,
	createLab,
	deleteOtherUsersInvoice,
	listInvoicesAs,
	normalUse,
	OWNER_MEMO,
	readOtherUsersInvoice,
	TAMPERED_MEMO,
	updateOtherUsersInvoice,
	type Version,
} from "../src/scenario";

const ORIGINAL_MEMO = "alice-fake: fake consulting invoice";
const ALICE_ID = "user-alice-fake";

describe("vulnerable API: the flaw is observable", () => {
	test("bob-fake reads alice-fake's invoice by changing the id in the URL", async () => {
		const read = await readOtherUsersInvoice(createLab("vulnerable"));
		expect(read.status).toBe(200);
		expect(read.body).toMatchObject({ id: ALICE_INVOICE_ID, ownerId: ALICE_ID, memo: ORIGINAL_MEMO });
	});

	test("bob-fake changes alice-fake's invoice", async () => {
		const update = await updateOtherUsersInvoice(createLab("vulnerable"));
		expect(update.attempt.status).toBe(200);
		expect(update.memoAfter).toBe(TAMPERED_MEMO);
	});

	test("bob-fake deletes alice-fake's invoice", async () => {
		const remove = await deleteOtherUsersInvoice(createLab("vulnerable"));
		expect(remove.attempt.status).toBe(200);
		expect(remove.stillExists).toBe(false);
	});

	test("the list shows bob-fake every invoice, including the ones he does not own", async () => {
		const list = await listInvoicesAs(createLab("vulnerable"), TOKENS.bob);
		expect(list.ids).toEqual([1001, 1002, 1003, 1004]);
	});

	test("the UI hides the admin link from bob-fake, and the admin route answers him anyway", async () => {
		const admin = await callAdminRouteAsRegularUser(createLab("vulnerable"));
		expect(admin.menu).toEqual(["invoices"]);
		expect(admin.attempt.status).toBe(200);
	});
});

describe("fixed API: the same attempts are blocked", () => {
	test("bob-fake gets 403 for alice-fake's invoice, and no data in the body", async () => {
		const read = await readOtherUsersInvoice(createLab("fixed"));
		expect(read.status).toBe(403);
		expect(read.body).toEqual({ error: "forbidden" });
	});

	test("bob-fake cannot change alice-fake's invoice", async () => {
		const update = await updateOtherUsersInvoice(createLab("fixed"));
		expect(update.attempt.status).toBe(403);
		expect(update.memoAfter).toBe(ORIGINAL_MEMO);
	});

	test("bob-fake cannot delete alice-fake's invoice", async () => {
		const remove = await deleteOtherUsersInvoice(createLab("fixed"));
		expect(remove.attempt.status).toBe(403);
		expect(remove.stillExists).toBe(true);
	});

	test("the list shows bob-fake only his own invoices", async () => {
		const list = await listInvoicesAs(createLab("fixed"), TOKENS.bob);
		expect(list.attempt.status).toBe(200);
		expect(list.ids).toEqual([1002, 1004]);
	});

	test("the admin route refuses bob-fake on the server, whatever the UI shows", async () => {
		const admin = await callAdminRouteAsRegularUser(createLab("fixed"));
		expect(admin.menu).toEqual(["invoices"]);
		expect(admin.attempt.status).toBe(403);
		expect(admin.attempt.body).toEqual({ error: "forbidden" });
	});
});

// EN: Normal use must work on both versions: the fix removes the hole, not the feature.
// PT: O uso normal precisa funcionar nas duas versões: a correção tira o buraco, não a função.
// ES: El uso normal debe funcionar en las dos versiones: la corrección tapa el agujero, no la función.
describe.each<Version>(["vulnerable", "fixed"])("%s API: normal use works", (version) => {
	test("the owner reads, updates, lists and deletes her invoice, and the admin uses the admin route", async () => {
		const lab = createLab(version);
		const normal = await normalUse(lab);
		expect(normal.ownerReads.status).toBe(200);
		expect(normal.ownerReads.body).toMatchObject({ id: ALICE_INVOICE_ID, ownerId: ALICE_ID });
		expect(normal.ownerUpdates.status).toBe(200);
		expect(normal.ownerUpdates.body).toMatchObject({ memo: OWNER_MEMO });
		expect(normal.ownerLists.ids).toContain(ALICE_INVOICE_ID);
		expect(normal.adminUsesAdminRoute.status).toBe(200);
		expect(normal.ownerDeletes.status).toBe(200);
		expect(lab.store.invoices.has(ALICE_INVOICE_ID)).toBe(false);
	});
});

describe("fixed API: input validation with Zod", () => {
	// EN: Two hand-picked malformed ids are enough to show the rule. This is not a fuzzer.
	// PT: Dois ids malformados escolhidos à mão bastam para mostrar a regra. Isto não é um fuzzer.
	// ES: Dos ids mal formados elegidos a mano bastan para mostrar la regla. Esto no es un fuzzer.
	test.each(["abc", "1e3"])("the id %p is refused with 400", async (rawId) => {
		const result = await call(createLab("fixed").app, `/invoices/${rawId}`, { token: TOKENS.alice });
		expect(result.status).toBe(400);
		expect(result.body).toEqual({ error: "invalid_id" });
	});

	test("a body with an unknown field is refused, so the owner of an invoice cannot be changed", async () => {
		const lab = createLab("fixed");
		const result = await call(lab.app, `/invoices/${BOB_INVOICE_ID}`, {
			token: TOKENS.bob,
			method: "PATCH",
			body: { memo: "ok", ownerId: ALICE_ID },
		});
		expect(result.status).toBe(400);
		expect(lab.store.invoices.get(BOB_INVOICE_ID)?.ownerId).toBe("user-bob-fake");
	});

	test("an empty memo is refused with 400", async () => {
		const result = await call(createLab("fixed").app, `/invoices/${BOB_INVOICE_ID}`, {
			token: TOKENS.bob,
			method: "PATCH",
			body: { memo: "   " },
		});
		expect(result.status).toBe(400);
	});
});

describe("fixed API: 403 versus 404", () => {
	test("default: a missing invoice is 404 and somebody else's is 403, so the two can be told apart", async () => {
		const lab = createLab("fixed");
		const missing = await call(lab.app, `/invoices/${MISSING_INVOICE_ID}`, { token: TOKENS.bob });
		const foreign = await call(lab.app, `/invoices/${ALICE_INVOICE_ID}`, { token: TOKENS.bob });
		expect(missing.status).toBe(404);
		expect(foreign.status).toBe(403);
	});

	test("hideExistence: both answers are byte for byte the same 404", async () => {
		const lab = createLab("fixed", { hideExistence: true });
		const missing = await call(lab.app, `/invoices/${MISSING_INVOICE_ID}`, { token: TOKENS.bob });
		const foreign = await call(lab.app, `/invoices/${ALICE_INVOICE_ID}`, { token: TOKENS.bob });
		expect(foreign).toEqual(missing);
		expect(foreign.status).toBe(404);
	});

	test("hideExistence: the owner still reads her invoice", async () => {
		const lab = createLab("fixed", { hideExistence: true });
		const own = await call(lab.app, `/invoices/${ALICE_INVOICE_ID}`, { token: TOKENS.alice });
		expect(own.status).toBe(200);
	});
});
