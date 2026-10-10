// EN: The same scenario functions run against both versions. Against the vulnerable API the
//     tests assert that each flaw is observable (MP-SEC-7.1). Against the fixed API they assert
//     that the same attempt is refused and that legitimate use still works (MP-SEC-7.2).
// PT: As mesmas funções de cenário rodam contra as duas versões. Contra a API vulnerável os
//     testes afirmam que cada falha é observável (MP-SEC-7.1). Contra a corrigida, afirmam que a
//     mesma tentativa é recusada e que o uso legítimo continua funcionando (MP-SEC-7.2).
// ES: Las mismas funciones de escenario corren contra las dos versiones. Contra la API vulnerable las
//     pruebas afirman que cada falla es observable (MP-SEC-7.1). Contra la corregida, afirman que el
//     mismo intento es rechazado y que el uso legítimo sigue funcionando (MP-SEC-7.2).

import { describe, expect, test } from "bun:test";
import { ADMIN_REPORT, BOB, ISSUER } from "../src/data";
import {
	CANDIDATE_WORDS,
	call,
	createLab,
	issueToken,
	login,
	normalUse,
	replayTokenIssuedForAnotherAudience,
	resignWithGuessedSecret,
	sendUnsignedAdminToken,
	tamperWithPayload,
	useTokenAfterExpiry,
	type Version,
} from "../src/scenario";
import { readPayloadUnverified } from "../src/token";

const REFUSED = { error: "invalid_token" };

describe("vulnerable API: each flaw is observable", () => {
	test("(a) a token with alg none, an empty signature and role admin is accepted", async () => {
		const unsigned = await sendUnsignedAdminToken(createLab("vulnerable"));
		expect(unsigned.token.endsWith(".")).toBe(true);
		expect(readPayloadUnverified(unsigned.token)).toMatchObject({ sub: BOB.username, role: "admin" });
		expect(unsigned.attempt.status).toBe(200);
		expect(unsigned.attempt.body).toEqual(ADMIN_REPORT);
	});

	test("(b) the secret is one of five guessed words, and a token signed with it is accepted", async () => {
		expect(CANDIDATE_WORDS.length).toBeLessThanOrEqual(5);
		const guess = await resignWithGuessedSecret(createLab("vulnerable"));
		expect(guess.recoveredSecret).toBe("secret");
		expect(guess.attempt.status).toBe(200);
		expect(guess.attempt.body).toEqual(ADMIN_REPORT);
	});

	test("(c) a token whose exp is two hours in the past is accepted", async () => {
		const lab = createLab("vulnerable");
		const expiry = await useTokenAfterExpiry(lab);
		expect(expiry.whileValid.status).toBe(200);
		expect(expiry.afterExpiry.status).toBe(200);
		expect(expiry.afterExpiry.body).toMatchObject({ sub: BOB.username });
	});

	test("a genuine token issued for another service is accepted, because aud is never read", async () => {
		const replay = await replayTokenIssuedForAnotherAudience(createLab("vulnerable"));
		expect(replay.attempt.status).toBe(200);
	});
});

describe("fixed API: the same attempts are refused", () => {
	test("(a) the unsigned token is refused", async () => {
		const lab = createLab("fixed");
		const unsigned = await sendUnsignedAdminToken(lab);
		expect(unsigned.attempt.status).toBe(401);
		expect(unsigned.attempt.body).toEqual(REFUSED);
		expect(lab.rejections).toEqual(["malformed"]);
	});

	test("(b) no guessed word matches a random 32-byte key, and the self-signed token is refused", async () => {
		const lab = createLab("fixed");
		const guess = await resignWithGuessedSecret(lab);
		expect(guess.recoveredSecret).toBeNull();
		expect(guess.attempt.status).toBe(401);
		expect(guess.attempt.body).toEqual(REFUSED);
		expect(lab.rejections).toEqual(["bad_signature"]);
	});

	test("(c) the token works while valid and is refused two hours later", async () => {
		const lab = createLab("fixed");
		const expiry = await useTokenAfterExpiry(lab);
		expect(expiry.whileValid.status).toBe(200);
		expect(expiry.afterExpiry.status).toBe(401);
		expect(expiry.afterExpiry.body).toEqual(REFUSED);
		expect(lab.rejections).toEqual(["expired"]);
	});

	test("a genuine token issued for another audience is refused", async () => {
		const lab = createLab("fixed");
		const replay = await replayTokenIssuedForAnotherAudience(lab);
		expect(replay.attempt.status).toBe(401);
		expect(lab.rejections).toEqual(["wrong_audience"]);
	});

	test("a genuine signature with another issuer name is refused", async () => {
		const lab = createLab("fixed");
		const token = issueToken(lab, { iss: "https://other-issuer.lab.invalid" });
		expect((await call(lab.app, "/me", { token })).status).toBe(401);
		expect(lab.rejections).toEqual(["wrong_issuer"]);
	});

	test("a token that is not valid yet (nbf in the future) is refused", async () => {
		const lab = createLab("fixed");
		const token = issueToken(lab, { nbf: lab.now() + 3600 });
		expect((await call(lab.app, "/me", { token })).status).toBe(401);
		expect(lab.rejections).toEqual(["not_yet_valid"]);
	});

	// EN: Two hand-picked malformed values are enough to show the rule. This is not a fuzzer.
	// PT: Dois valores malformados escolhidos à mão bastam para mostrar a regra. Isto não é um fuzzer.
	// ES: Dos valores mal formados elegidos a mano bastan para mostrar la regla. Esto no es un fuzzer.
	test.each(["not-a-token", "only.two"])("the malformed token %p is refused", async (token) => {
		const lab = createLab("fixed");
		const answer = await call(lab.app, "/me", { token });
		expect(answer.status).toBe(401);
		expect(answer.body).toEqual(REFUSED);
		expect(lab.rejections).toEqual(["malformed"]);
	});

	test("every refusal looks the same to the client, whatever the reason", async () => {
		const lab = createLab("fixed");
		const wrongIssuer = await call(lab.app, "/me", { token: issueToken(lab, { iss: "https://x.lab.invalid" }) });
		const malformed = await call(lab.app, "/me", { token: "not-a-token" });
		const missing = await call(lab.app, "/me");
		expect(wrongIssuer).toEqual(malformed);
		expect(missing).toEqual(malformed);
	});

	test("the login body is validated with Zod", async () => {
		const lab = createLab("fixed");
		const extraField = await call(lab.app, "/login", { method: "POST", body: { ...BOB, role: "admin" } });
		const wrongType = await call(lab.app, "/login", { method: "POST", body: { username: 1, password: [] } });
		expect(extraField.status).toBe(400);
		expect(wrongType.status).toBe(400);
	});
});

// EN: These hold on both versions: the HS256 signature check itself works, and normal use works.
//     The fix removes the holes, not the feature.
// PT: Estes valem nas duas versões: a verificação da assinatura HS256 em si funciona, e o uso
//     normal funciona. A correção tira os buracos, não a função.
// ES: Estos valen en las dos versiones: la verificación de la firma HS256 en sí funciona, y el uso
//     normal funciona. La corrección tapa los agujeros, no la función.
describe.each<Version>(["vulnerable", "fixed"])("%s API: what must work on both", (version) => {
	test("a payload changed under the original signature is refused", async () => {
		const tampered = await tamperWithPayload(createLab(version));
		expect(readPayloadUnverified(tampered.token)).toMatchObject({ role: "admin" });
		expect(tampered.attempt.status).toBe(401);
		expect(tampered.attempt.body).toEqual(REFUSED);
	});

	test("login issues a token with exp, iss and aud, readable without any key", async () => {
		const lab = createLab(version);
		const payload = readPayloadUnverified(await login(lab, BOB));
		expect(payload).toMatchObject({ sub: BOB.username, role: "user", iss: ISSUER, exp: lab.now() + 900 });
	});

	test("normal use: valid tokens are accepted, and only the role limits what they can do", async () => {
		const normal = await normalUse(createLab(version));
		expect(normal.adminReadsProfile.status).toBe(200);
		expect(normal.adminReadsProfile.body).toEqual({ sub: "alice-admin-fake", role: "admin" });
		expect(normal.adminReadsReport.status).toBe(200);
		expect(normal.adminReadsReport.body).toEqual(ADMIN_REPORT);
		expect(normal.userReadsProfile.status).toBe(200);
		expect(normal.userReadsReport.status).toBe(403);
		expect(normal.anonymousReadsProfile.status).toBe(401);
		expect(normal.wrongPassword.status).toBe(401);
	});
});
