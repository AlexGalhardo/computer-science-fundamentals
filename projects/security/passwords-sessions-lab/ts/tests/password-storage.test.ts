// EN: MP-SEC-6.1, the storage comparison. Two fake users choose the same fake password and the
//     tests look at what each scheme writes in the table, then at verification and at the
//     upgrade of an old hash on login. Nothing here tries to find a password.
// PT: MP-SEC-6.1, a comparação de armazenamento. Dois usuários falsos escolhem a mesma senha
//     falsa e os testes olham o que cada esquema grava na tabela, depois a verificação e a
//     atualização de um hash antigo no login. Nada aqui tenta descobrir uma senha.
// ES: MP-SEC-6.1, la comparación de almacenamiento. Dos usuarios falsos eligen la misma contraseña
//     falsa y las pruebas miran lo que cada esquema escribe en la tabla, luego la verificación y la
//     actualización de un hash antiguo en el inicio de sesión. Nada aquí intenta descubrir una contraseña.

import { describe, expect, test } from "bun:test";
import { SHARED_FAKE_PASSWORD } from "../src/data";
import {
	ARGON2_PARAMS,
	constantTimeEqual,
	hashPassword,
	needsRehash,
	schemeOf,
	verifyAndUpgrade,
	verifyPassword,
} from "../src/fixed/fixed-password-storage";
import {
	storeMd5,
	storePlainText,
	storeSaltedSha256,
	verifyLegacyPassword,
} from "../src/vulnerable/vulnerable-password-storage";

const WRONG = "wrong-fake-1";

describe("two fake users with the same password", () => {
	test("plain text: both rows show the password itself", () => {
		const alice = storePlainText(SHARED_FAKE_PASSWORD);
		const bob = storePlainText(SHARED_FAKE_PASSWORD);
		expect(alice).toBe(bob);
		expect(alice).toContain(SHARED_FAKE_PASSWORD);
	});

	test("MD5 without salt: the two hashes are equal, so the table shows who shares a password", () => {
		const alice = storeMd5(SHARED_FAKE_PASSWORD);
		const bob = storeMd5(SHARED_FAKE_PASSWORD);
		expect(alice).toBe(bob);
		expect(alice).not.toContain(SHARED_FAKE_PASSWORD);
	});

	test("salted SHA-256: the hashes differ because each user gets a random salt", () => {
		expect(storeSaltedSha256(SHARED_FAKE_PASSWORD)).not.toBe(storeSaltedSha256(SHARED_FAKE_PASSWORD));
	});

	test("the salt is the only reason: with the same salt the SHA-256 hashes are equal again", () => {
		const salt = Buffer.alloc(16, 7);
		expect(storeSaltedSha256(SHARED_FAKE_PASSWORD, salt)).toBe(storeSaltedSha256(SHARED_FAKE_PASSWORD, salt));
	});

	test("Argon2id: the hashes differ, and each one records its own salt and parameters", async () => {
		const alice = await hashPassword(SHARED_FAKE_PASSWORD);
		const bob = await hashPassword(SHARED_FAKE_PASSWORD);
		expect(alice).not.toBe(bob);
		const prefix = `$argon2id$v=19$m=${ARGON2_PARAMS.memoryCost},t=${ARGON2_PARAMS.timeCost},p=1$`;
		expect(alice.startsWith(prefix)).toBe(true);
		expect(bob.startsWith(prefix)).toBe(true);
	});
});

describe("verification", () => {
	test("the vulnerable schemes accept the right password and refuse a wrong one", () => {
		for (const stored of [
			storePlainText(SHARED_FAKE_PASSWORD),
			storeMd5(SHARED_FAKE_PASSWORD),
			storeSaltedSha256(SHARED_FAKE_PASSWORD),
		]) {
			expect(verifyLegacyPassword(SHARED_FAKE_PASSWORD, stored)).toBe(true);
			expect(verifyLegacyPassword(WRONG, stored)).toBe(false);
		}
	});

	test("Argon2id accepts the right password and refuses a wrong one", async () => {
		const stored = await hashPassword(SHARED_FAKE_PASSWORD);
		expect(await verifyPassword(SHARED_FAKE_PASSWORD, stored)).toBe(true);
		expect(await verifyPassword(WRONG, stored)).toBe(false);
	});

	test("the fixed code still recognises the three legacy formats, for the migration", async () => {
		for (const stored of [
			storePlainText(SHARED_FAKE_PASSWORD),
			storeMd5(SHARED_FAKE_PASSWORD),
			storeSaltedSha256(SHARED_FAKE_PASSWORD),
		]) {
			expect(await verifyPassword(SHARED_FAKE_PASSWORD, stored)).toBe(true);
			expect(await verifyPassword(WRONG, stored)).toBe(false);
		}
	});

	test("a value in no known format never verifies", async () => {
		expect(schemeOf("something-else")).toBe("unknown");
		expect(await verifyPassword(SHARED_FAKE_PASSWORD, "something-else")).toBe(false);
	});

	test("constantTimeEqual compares values of any length", () => {
		expect(constantTimeEqual("same-fake-value", "same-fake-value")).toBe(true);
		expect(constantTimeEqual("same-fake-value", "same-fake-valuE")).toBe(false);
		expect(constantTimeEqual("short", "a-much-longer-fake-value")).toBe(false);
	});
});

describe("needsRehash", () => {
	test("every legacy scheme needs a rehash", () => {
		expect(needsRehash(storePlainText(SHARED_FAKE_PASSWORD))).toBe(true);
		expect(needsRehash(storeMd5(SHARED_FAKE_PASSWORD))).toBe(true);
		expect(needsRehash(storeSaltedSha256(SHARED_FAKE_PASSWORD))).toBe(true);
	});

	test("Argon2id with the current parameters does not", async () => {
		expect(needsRehash(await hashPassword(SHARED_FAKE_PASSWORD))).toBe(false);
	});

	test("Argon2id below the policy does: raising the parameters upgrades old Argon2id hashes too", async () => {
		const weaker = await hashPassword(SHARED_FAKE_PASSWORD, { memoryCost: 8192, timeCost: 1 });
		expect(schemeOf(weaker)).toBe("argon2id");
		expect(needsRehash(weaker)).toBe(true);
		expect(needsRehash(weaker, { memoryCost: 8192, timeCost: 1 })).toBe(false);
	});
});

describe("upgrade on login", () => {
	test("a legacy MD5 hash becomes Argon2id when the right password is presented", async () => {
		const legacy = storeMd5(SHARED_FAKE_PASSWORD);
		const check = await verifyAndUpgrade(SHARED_FAKE_PASSWORD, legacy);
		expect(check.ok).toBe(true);
		const upgraded = check.upgradedHash ?? "";
		expect(schemeOf(upgraded)).toBe("argon2id");
		expect(needsRehash(upgraded)).toBe(false);
		expect(await verifyPassword(SHARED_FAKE_PASSWORD, upgraded)).toBe(true);
	});

	test("a wrong password upgrades nothing", async () => {
		const check = await verifyAndUpgrade(WRONG, storeMd5(SHARED_FAKE_PASSWORD));
		expect(check).toEqual({ ok: false });
	});

	test("a hash already at the policy is left alone", async () => {
		const check = await verifyAndUpgrade(SHARED_FAKE_PASSWORD, await hashPassword(SHARED_FAKE_PASSWORD));
		expect(check).toEqual({ ok: true });
	});
});
