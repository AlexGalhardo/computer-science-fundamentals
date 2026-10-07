// EN: Because every decision lives in one pure function, the policy can be tested without HTTP:
//     a user, an action and a resource go in, `true` or `false` comes out.
// PT: Como toda decisão mora em uma função pura, a política pode ser testada sem HTTP: entram um
//     usuário, uma ação e um recurso, sai `true` ou `false`.

import { describe, expect, test } from "bun:test";
import type { User } from "../src/data";
import { type Action, can, type Resource } from "../src/fixed/fixed-policy";

const alice: User = { id: "user-alice-fake", name: "alice-fake", role: "user" };
const bob: User = { id: "user-bob-fake", name: "bob-fake", role: "user" };
const carol: User = { id: "user-carol-fake", name: "carol-admin-fake", role: "admin" };

const aliceInvoice: Resource = { kind: "invoice", ownerId: alice.id };
const collection: Resource = { kind: "invoice-collection" };
const adminArea: Resource = { kind: "admin-area" };

describe("can(user, action, resource)", () => {
	const cases: [string, User | null, Action, Resource, boolean][] = [
		["the owner reads her invoice", alice, "read", aliceInvoice, true],
		["the owner updates her invoice", alice, "update", aliceInvoice, true],
		["the owner deletes her invoice", alice, "delete", aliceInvoice, true],
		["another user reads it", bob, "read", aliceInvoice, false],
		["another user updates it", bob, "update", aliceInvoice, false],
		["another user deletes it", bob, "delete", aliceInvoice, false],
		["an admin reads it", carol, "read", aliceInvoice, true],
		["an admin deletes it", carol, "delete", aliceInvoice, true],
		["anonymous reads it", null, "read", aliceInvoice, false],
		["anonymous lists", null, "list", collection, false],
		["a user lists", bob, "list", collection, true],
		["a user uses the admin route", bob, "use-admin-route", adminArea, false],
		["an admin uses the admin route", carol, "use-admin-route", adminArea, true],
		["anonymous uses the admin route", null, "use-admin-route", adminArea, false],
	];

	test.each(cases)("%s", (_name, user, action, resource, expected) => {
		expect(can(user, action, resource)).toBe(expected);
	});
});

// EN: The combinations nobody wrote a rule for. They must all be refused, even for an admin.
//     The casts simulate a future action or resource kind that the policy does not know yet.
// PT: As combinações para as quais ninguém escreveu regra. Todas precisam ser recusadas, até para
//     um admin. Os casts simulam uma ação ou um tipo de recurso futuro que a política não conhece.
describe("deny by default in the policy", () => {
	test("an action that does not belong to the resource is refused", () => {
		expect(can(carol, "use-admin-route", aliceInvoice)).toBe(false);
		expect(can(carol, "delete", collection)).toBe(false);
		expect(can(carol, "read", adminArea)).toBe(false);
	});

	test("an unknown action is refused", () => {
		expect(can(carol, "export" as Action, aliceInvoice)).toBe(false);
	});

	test("an unknown resource kind is refused", () => {
		expect(can(carol, "read", { kind: "payroll" } as unknown as Resource)).toBe(false);
	});
});
