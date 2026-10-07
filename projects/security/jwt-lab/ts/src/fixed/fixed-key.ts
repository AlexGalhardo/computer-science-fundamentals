// EN: THE FIX, part 1: the key. HS256 is only as strong as its key. The key here is at least 32
//     bytes (256 bits, the size of the SHA-256 output, as RFC 7518 requires for HS256) produced
//     by the operating system's random generator. Nobody chooses it and nobody can remember it.
// PT: A CORREÇÃO, parte 1: a chave. O HS256 é tão forte quanto a chave. Aqui a chave tem pelo
//     menos 32 bytes (256 bits, o tamanho da saída do SHA-256, como a RFC 7518 exige para o
//     HS256) produzidos pelo gerador aleatório do sistema operacional. Ninguém a escolhe e
//     ninguém consegue decorá-la.

import { randomBytes } from "node:crypto";
import { z } from "zod";

export const MIN_KEY_BYTES = 32;

// EN: Refusing to start is the right failure. A server that boots with a short key works
//     perfectly in every test and is forgeable in production, and nobody notices.
//     The length is a floor, not a proof of quality: 32 bytes typed by a person are still a
//     guessable phrase. That is why the default below asks the system for random bytes.
// PT: Recusar-se a iniciar é a falha certa. Um servidor que sobe com uma chave curta funciona
//     perfeitamente em todos os testes e é falsificável em produção, e ninguém percebe.
//     O tamanho é um piso, não uma prova de qualidade: 32 bytes digitados por uma pessoa
//     continuam sendo uma frase adivinhável. Por isso o padrão abaixo pede bytes aleatórios ao sistema.
export function assertStrongKey(key: Buffer): Buffer {
	if (key.length < MIN_KEY_BYTES) {
		throw new Error(`signing key too short: ${key.length} bytes, need at least ${MIN_KEY_BYTES}`);
	}
	return key;
}

// EN: The environment is external input too, so it is validated: canonical base64 only.
// PT: O ambiente também é entrada externa, então é validado: só base64 canônico.
const base64KeySchema = z
	.string()
	.regex(/^[A-Za-z0-9+/]+={0,2}$/)
	.transform((text) => Buffer.from(text, "base64"));

// EN: With no value, a fresh random key is generated at start-up (every token dies when the
//     process restarts, which is fine for a lab). With a value (for example from the
//     JWT_LAB_KEY_BASE64 environment variable), it must be base64 of at least 32 bytes.
//     In a real system the key comes from a secret manager and is never committed to git.
// PT: Sem valor, uma chave aleatória nova é gerada na inicialização (todo token morre quando o
//     processo reinicia, o que é aceitável em um laboratório). Com valor (por exemplo vindo da
//     variável de ambiente JWT_LAB_KEY_BASE64), ele precisa ser o base64 de pelo menos 32 bytes.
//     Em um sistema real a chave vem de um gerenciador de segredos e nunca é versionada no git.
export function loadSigningKey(base64Value: string | undefined): Buffer {
	if (base64Value === undefined) return randomBytes(MIN_KEY_BYTES);
	const parsed = base64KeySchema.safeParse(base64Value);
	if (!parsed.success) throw new Error("signing key is not valid base64");
	return assertStrongKey(parsed.data);
}
