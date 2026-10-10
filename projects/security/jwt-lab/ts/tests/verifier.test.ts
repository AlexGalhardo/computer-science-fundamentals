// EN: The fixed verifier alone, without HTTP: one test per check, with the exact reason of each
//     refusal. The clock is injected, so "expired" is tested without waiting.
// PT: O verificador corrigido sozinho, sem HTTP: um teste por verificação, com o motivo exato de
//     cada recusa. O relógio é injetado, então "expirado" é testado sem esperar.
// ES: El verificador corregido por separado, sin HTTP: una prueba por verificación, con el motivo exacto de
//     cada rechazo. El reloj se inyecta, así que "expirado" se prueba sin esperar.

import { describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { AUDIENCE, ISSUER, OTHER_AUDIENCE } from "../src/data";
import { createFixedVerifier, type FixedVerifier, type VerifyResult } from "../src/fixed/fixed-verifier";
import { base64UrlEncode, type Claims, encodeJson, hmacSha256, signHs256 } from "../src/token";

const NOW = 1_800_000_000;
const KEY = randomBytes(32);

const VALID: Claims = { sub: "bob-fake", role: "user", iss: ISSUER, aud: AUDIENCE, iat: NOW, exp: NOW + 900 };

function verifierAt(now: number, extra: { maxTokenBytes?: number } = {}): FixedVerifier {
	return createFixedVerifier({ key: KEY, issuer: ISSUER, audience: AUDIENCE, clock: () => now, ...extra });
}

// EN: A token with any header and any payload, correctly signed with HS256 and the lab key. It
//     lets a test isolate one check: the signature is right, so only the header or a claim differs.
// PT: Um token com qualquer cabeçalho e qualquer payload, corretamente assinado com HS256 e a
//     chave do laboratório. Permite isolar uma verificação: a assinatura está certa, então só o
//     cabeçalho ou uma claim muda.
// ES: Un token con cualquier encabezado y cualquier payload, correctamente firmado con HS256 y la
//     clave del laboratorio. Permite aislar una verificación: la firma es correcta, así que solo cambia el
//     encabezado o un claim.
function signRaw(header: unknown, payload: unknown, key: Buffer = KEY): string {
	const signingInput = `${encodeJson(header)}.${encodeJson(payload)}`;
	return `${signingInput}.${base64UrlEncode(hmacSha256(signingInput, key))}`;
}

function reasonOf(result: VerifyResult): string {
	return result.ok ? "accepted" : result.reason;
}

const verify = verifierAt(NOW);

describe("fixed verifier: a valid token", () => {
	test("is accepted and returns the validated claims", () => {
		expect(verify(signHs256(VALID, KEY))).toEqual({ ok: true, claims: VALID });
	});

	test("is accepted when aud is a list that contains this service", () => {
		const token = signHs256({ ...VALID, aud: [OTHER_AUDIENCE, AUDIENCE] }, KEY);
		expect(reasonOf(verify(token))).toBe("accepted");
	});
});

describe("fixed verifier: pinned algorithm", () => {
	test("alg none is refused even with a non-empty third part", () => {
		const token = `${encodeJson({ alg: "none", typ: "JWT" })}.${encodeJson({ ...VALID, role: "admin" })}.AAAA`;
		expect(reasonOf(verify(token))).toBe("algorithm_not_allowed");
	});

	// EN: The signature below is a correct HS256 signature. The token is still refused, because
	//     the header does not say exactly what the server decided. The algorithm is checked
	//     before, and independently of, the signature.
	// PT: A assinatura abaixo é uma assinatura HS256 correta. O token é recusado mesmo assim,
	//     porque o cabeçalho não diz exatamente o que o servidor decidiu. O algoritmo é conferido
	//     antes da assinatura, e de forma independente dela.
	// ES: La firma de abajo es una firma HS256 correcta. El token se rechaza de todos modos,
	//     porque el encabezado no dice exactamente lo que decidió el servidor. El algoritmo se comprueba
	//     antes de la firma, y de forma independiente de ella.
	test.each(["RS256", "HS512", "hs256"])("a header saying %p is refused before any signature work", (alg) => {
		expect(reasonOf(verify(signRaw({ alg, typ: "JWT" }, VALID)))).toBe("algorithm_not_allowed");
	});

	test("a header with a field that points to a key (kid) is refused", () => {
		expect(reasonOf(verify(signRaw({ alg: "HS256", typ: "JWT", kid: "fake-key-id" }, VALID)))).toBe("malformed");
	});
});

describe("fixed verifier: signature", () => {
	test("a tampered payload under the original signature is refused", () => {
		const [headerPart, , signaturePart] = signHs256(VALID, KEY).split(".");
		const token = `${headerPart}.${encodeJson({ ...VALID, role: "admin" })}.${signaturePart}`;
		expect(reasonOf(verify(token))).toBe("bad_signature");
	});

	test("a token signed with another key is refused", () => {
		expect(reasonOf(verify(signHs256(VALID, randomBytes(32))))).toBe("bad_signature");
	});

	test("a token signed with the weak word of the vulnerable version is refused", () => {
		expect(reasonOf(verify(signHs256({ ...VALID, role: "admin" }, "secret")))).toBe("bad_signature");
	});

	test("a signature with the wrong length is refused without throwing", () => {
		const [headerPart, payloadPart, signaturePart] = signHs256(VALID, KEY).split(".");
		const token = `${headerPart}.${payloadPart}.${signaturePart?.slice(0, 10)}`;
		expect(reasonOf(verify(token))).toBe("bad_signature");
	});
});

describe("fixed verifier: shape and size", () => {
	// EN: A few hand-picked shapes, one per rule. This is not a fuzzer.
	// PT: Alguns formatos escolhidos à mão, um por regra. Isto não é um fuzzer.
	// ES: Algunos formatos elegidos a mano, uno por regla. Esto no es un fuzzer.
	test.each([
		["no dots", "not-a-token"],
		["two parts", "only.two"],
		["four parts", "a.b.c.d"],
		["empty signature", `${encodeJson({ alg: "HS256" })}.${encodeJson(VALID)}.`],
		["characters outside base64url", "a+b.c/d.e=f"],
		["header that is not JSON", `${base64UrlEncode("not json")}.${encodeJson(VALID)}.AAAA`],
	])("malformed token (%s) is refused", (_label, token) => {
		expect(reasonOf(verify(token))).toBe("malformed");
	});

	test("a token above the size limit is refused before parsing", () => {
		const small = verifierAt(NOW, { maxTokenBytes: 64 });
		expect(reasonOf(small(signHs256(VALID, KEY)))).toBe("token_too_large");
		expect(reasonOf(verify(`${"a".repeat(3000)}.b.c`))).toBe("token_too_large");
	});
});

describe("fixed verifier: time, with an injected clock", () => {
	const token = signHs256(VALID, KEY);

	test("a token whose exp is in the past is refused", () => {
		expect(reasonOf(verifierAt(VALID.exp + 3600)(token))).toBe("expired");
	});

	test("the 30-second tolerance absorbs clock drift, and not one second more", () => {
		expect(reasonOf(verifierAt(VALID.exp + 29)(token))).toBe("accepted");
		expect(reasonOf(verifierAt(VALID.exp + 30)(token))).toBe("expired");
	});

	test("a token without exp is refused: no expiry means valid forever", () => {
		const { exp: _exp, ...withoutExp } = VALID;
		expect(reasonOf(verify(signRaw({ alg: "HS256", typ: "JWT" }, withoutExp)))).toBe("invalid_claims");
	});

	test("nbf in the future is refused, nbf in the past is accepted", () => {
		expect(reasonOf(verify(signHs256({ ...VALID, nbf: NOW + 600 }, KEY)))).toBe("not_yet_valid");
		expect(reasonOf(verify(signHs256({ ...VALID, nbf: NOW - 600 }, KEY)))).toBe("accepted");
	});
});

describe("fixed verifier: issuer, audience and payload shape", () => {
	test("wrong issuer is refused", () => {
		const token = signHs256({ ...VALID, iss: "https://other-issuer.lab.invalid" }, KEY);
		expect(reasonOf(verify(token))).toBe("wrong_issuer");
	});

	test("wrong audience is refused", () => {
		expect(reasonOf(verify(signHs256({ ...VALID, aud: OTHER_AUDIENCE }, KEY)))).toBe("wrong_audience");
	});

	test("a token with no audience at all is refused", () => {
		const { aud: _aud, ...withoutAud } = VALID;
		expect(reasonOf(verify(signRaw({ alg: "HS256", typ: "JWT" }, withoutAud)))).toBe("invalid_claims");
	});

	test("a role the application does not know is refused by the Zod schema", () => {
		const token = signRaw({ alg: "HS256", typ: "JWT" }, { ...VALID, role: "superuser" });
		expect(reasonOf(verify(token))).toBe("invalid_claims");
	});

	test("a payload that is not a JSON object is refused", () => {
		expect(reasonOf(verify(signRaw({ alg: "HS256", typ: "JWT" }, "just text")))).toBe("invalid_claims");
	});
});
