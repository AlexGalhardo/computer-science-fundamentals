// EN: The key rules of the fixed version: at least 32 bytes, random by default, and a refusal to
//     start otherwise.
// PT: As regras de chave da versão corrigida: pelo menos 32 bytes, aleatória por padrão, e
//     recusa em iniciar caso contrário.
// ES: Las reglas de clave de la versión corregida: al menos 32 bytes, aleatoria por defecto, y
//     se niega a iniciar en caso contrario.

import { describe, expect, test } from "bun:test";
import { AUDIENCE, ISSUER, systemClock } from "../src/data";
import { createFixedApp } from "../src/fixed/fixed-app";
import { loadSigningKey, MIN_KEY_BYTES } from "../src/fixed/fixed-key";
import { createFixedVerifier } from "../src/fixed/fixed-verifier";

// EN: An obviously fake value, 32 bytes long, in the base64 form an environment variable would
//     carry. It passes the length rule and is NOT a good key: it is readable text. Real keys
//     come from a random generator.
// PT: Um valor obviamente falso, com 32 bytes, na forma base64 que uma variável de ambiente
//     carregaria. Ele passa na regra de tamanho e NÃO é uma boa chave: é texto legível. Chaves
//     de verdade vêm de um gerador aleatório.
// ES: Un valor obviamente falso, de 32 bytes, en la forma base64 que llevaría una variable de entorno.
//     Pasa la regla de tamaño y NO es una buena clave: es texto legible. Las claves
//     de verdad vienen de un generador aleatorio.
const FAKE_KEY_TEXT = "FAKE-KEY-not-real-jwt-lab-only!!";
const FAKE_KEY_BASE64 = Buffer.from(FAKE_KEY_TEXT).toString("base64");

describe("fixed key", () => {
	test("with no value, a fresh random 32-byte key is generated each time", () => {
		const first = loadSigningKey(undefined);
		const second = loadSigningKey(undefined);
		expect(first.length).toBe(MIN_KEY_BYTES);
		expect(first.equals(second)).toBe(false);
	});

	test("a base64 value of 32 bytes is accepted", () => {
		expect(loadSigningKey(FAKE_KEY_BASE64).toString("utf8")).toBe(FAKE_KEY_TEXT);
	});

	test("a short key is refused: the weak word of the vulnerable version, as base64", () => {
		const weak = Buffer.from("secret").toString("base64");
		expect(() => loadSigningKey(weak)).toThrow("signing key too short: 6 bytes");
	});

	test("a value that is not base64 is refused", () => {
		expect(() => loadSigningKey("not base64 at all!")).toThrow("not valid base64");
	});

	test("the verifier and the app refuse to be created with a short key", () => {
		const short = Buffer.from("secret");
		expect(() => createFixedVerifier({ key: short, issuer: ISSUER, audience: AUDIENCE })).toThrow("too short");
		expect(() => createFixedApp({ key: short, clock: systemClock })).toThrow("too short");
	});
});
