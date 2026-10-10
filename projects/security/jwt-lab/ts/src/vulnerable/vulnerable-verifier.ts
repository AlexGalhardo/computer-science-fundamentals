// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This file exists only to make three flaws observable inside this
//     lab (unsigned tokens accepted, a guessable secret, no expiry check). Never copy it, never
//     import it from another project, never deploy it.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo existe só para tornar três falhas observáveis dentro
//     deste laboratório (tokens sem assinatura aceitos, um segredo adivinhável, nenhuma
//     verificação de expiração). Nunca copie, nunca importe de outro projeto, nunca publique.
// ES: VULNERABLE A PROPÓSITO. Este archivo existe solo para hacer observables tres fallas dentro de
//     este laboratorio (tokens sin firma aceptados, un secreto adivinable, ninguna
//     verificación de expiración). Nunca lo copies, nunca lo importes desde otro proyecto, nunca lo publiques.
// ============================================================================================

import { base64UrlDecode, base64UrlEncode, hmacSha256, type Role } from "../token";

// EN: FLAW (b): the "key" is a word a person chose. An HMAC key must be unpredictable; a word
//     that fits in someone's memory is in everyone's list of first guesses. Whoever guesses it
//     can sign any token, exactly like the server does.
// PT: FALHA (b): a "chave" é uma palavra que uma pessoa escolheu. Uma chave de HMAC precisa ser
//     imprevisível; uma palavra que cabe na memória de alguém está na lista de primeiros
//     palpites de todo mundo. Quem adivinha assina qualquer token, exatamente como o servidor.
// ES: FALLA (b): la "clave" es una palabra que eligió una persona. Una clave de HMAC debe ser
//     impredecible; una palabra que cabe en la memoria de alguien está en la lista de primeros
//     intentos de todo el mundo. Quien la adivina firma cualquier token, exactamente como el servidor.
export const VULNERABLE_WEAK_SECRET = "secret";

export interface VulnerableIdentity {
	sub: string;
	role: Role;
}

function parseJsonPart(part: string | undefined): unknown {
	return JSON.parse(base64UrlDecode(part ?? "").toString("utf8"));
}

function readField(source: unknown, field: string): unknown {
	if (typeof source !== "object" || source === null) return undefined;
	return (source as Record<string, unknown>)[field];
}

export function vulnerableVerify(token: string, secret: string): VulnerableIdentity | null {
	try {
		const [headerPart, payloadPart, signaturePart] = token.split(".");
		const header = parseJsonPart(headerPart);
		const payload = parseJsonPart(payloadPart);
		const algorithm = readField(header, "alg");

		// EN: FLAW (a): the algorithm is read from the token, which the caller wrote. `none` is a
		//     real value of the JWT standard meaning "this token is not signed". By honouring it,
		//     the server lets the caller choose "do not check me", and the payload is trusted as is.
		// PT: FALHA (a): o algoritmo é lido do token, que foi escrito por quem chama. `none` é um
		//     valor real do padrão JWT que significa "este token não é assinado". Ao respeitá-lo, o
		//     servidor deixa quem chama escolher "não me confira", e o payload é aceito como veio.
		// ES: FALLA (a): el algoritmo se lee del token, que escribió quien llama. `none` es un
		//     valor real del estándar JWT que significa "este token no está firmado". Al respetarlo, el
		//     servidor deja que quien llama elija "no me compruebes", y el payload se acepta tal como vino.
		if (algorithm !== "none") {
			if (algorithm !== "HS256") return null;
			// EN: A second, quieter problem: `!==` on strings stops at the first different
			//     character, so the time it takes depends on how much of the signature is right.
			//     The fixed version compares in constant time.
			// PT: Um segundo problema, mais discreto: `!==` em strings para no primeiro caractere
			//     diferente, então o tempo gasto depende de quanto da assinatura está certo. A
			//     versão corrigida compara em tempo constante.
			// ES: Un segundo problema, más discreto: `!==` en cadenas se detiene en el primer carácter
			//     distinto, así que el tiempo gastado depende de cuánto de la firma es correcto. La
			//     versión corregida compara en tiempo constante.
			const expected = base64UrlEncode(hmacSha256(`${headerPart}.${payloadPart}`, secret));
			if (expected !== signaturePart) return null;
		}

		// EN: FLAW (c): `exp` is in the payload and nobody looks at it, so a token is valid
		//     forever. `iss` and `aud` are ignored too: a token made for another service is
		//     accepted here.
		// PT: FALHA (c): o `exp` está no payload e ninguém olha para ele, então um token vale para
		//     sempre. `iss` e `aud` também são ignorados: um token feito para outro serviço é
		//     aceito aqui.
		// ES: FALLA (c): `exp` está en el payload y nadie lo mira, así que un token vale para
		//     siempre. `iss` y `aud` también se ignoran: un token hecho para otro servicio se
		//     acepta aquí.
		const sub = readField(payload, "sub");
		const role = readField(payload, "role");
		if (typeof sub !== "string" || (role !== "user" && role !== "admin")) return null;
		return { sub, role };
	} catch {
		// EN: Not valid base64url or not JSON: there is no identity to return.
		// PT: Não é base64url válido ou não é JSON: não há identidade para devolver.
		// ES: No es base64url válido o no es JSON: no hay identidad que devolver.
		return null;
	}
}
