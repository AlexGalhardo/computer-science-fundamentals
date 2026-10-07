// EN: THE FIX, part 2: the verifier. Each numbered step below closes one way of forging or
//     replaying a token, and the order matters: cheap structural checks first, then the
//     signature, and only then the content. Nothing from the payload is believed before the
//     signature is confirmed.
//
//     This verifier is written by hand only so that every check is visible. Production code
//     should use a maintained library (for example `jose`) configured with an explicit list of
//     allowed algorithms, plus the expected issuer and audience.
// PT: A CORREÇÃO, parte 2: o verificador. Cada passo numerado abaixo fecha um jeito de falsificar
//     ou reaproveitar um token, e a ordem importa: primeiro as verificações baratas de formato,
//     depois a assinatura, e só então o conteúdo. Nada do payload é acreditado antes de a
//     assinatura ser confirmada.
//
//     Este verificador é escrito à mão só para que cada verificação fique visível. Código de
//     produção deve usar uma biblioteca mantida (por exemplo `jose`) configurada com uma lista
//     explícita de algoritmos permitidos, mais o emissor e a audiência esperados.

import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { type Clock, systemClock } from "../data";
import { base64UrlDecode, type Claims, hmacSha256 } from "../token";
import { assertStrongKey } from "./fixed-key";

// EN: The verifier decides the algorithm. It is a constant of the server, not a field of the token.
// PT: O verificador decide o algoritmo. É uma constante do servidor, não um campo do token.
const PINNED_ALGORITHM = "HS256";

const DEFAULT_MAX_TOKEN_BYTES = 2048;
const DEFAULT_CLOCK_TOLERANCE_SECONDS = 30;
const HS256_SIGNATURE_BYTES = 32;

export type RejectionReason =
	| "token_too_large"
	| "malformed"
	| "algorithm_not_allowed"
	| "bad_signature"
	| "invalid_claims"
	| "expired"
	| "not_yet_valid"
	| "wrong_issuer"
	| "wrong_audience";

export type VerifyResult = { ok: true; claims: Claims } | { ok: false; reason: RejectionReason };

export interface FixedVerifierOptions {
	key: Buffer;
	issuer: string;
	audience: string;
	clock?: Clock;
	// EN: Two servers never agree on the time to the second. A small tolerance (seconds, never
	//     minutes) avoids rejecting a token because of that drift.
	// PT: Dois servidores nunca concordam sobre a hora até o segundo. Uma tolerância pequena
	//     (segundos, nunca minutos) evita rejeitar um token por causa dessa diferença.
	clockToleranceSeconds?: number;
	maxTokenBytes?: number;
}

// EN: A strict object: `alg` and optionally `typ`, nothing else. Header fields such as `kid`,
//     `jku` or `jwk` tell a verifier where to find the key; this verifier has one key and does
//     not let the token point to another.
// PT: Um objeto estrito: `alg` e opcionalmente `typ`, nada mais. Campos de cabeçalho como `kid`,
//     `jku` ou `jwk` dizem ao verificador onde achar a chave; este verificador tem uma chave só
//     e não deixa o token apontar para outra.
const headerSchema = z.strictObject({ alg: z.string(), typ: z.literal("JWT").optional() });

const unixTimeSchema = z.number().int().positive();

// EN: The payload is external input like any request body, so its shape is validated: `exp` is
//     REQUIRED (a token without expiry would live forever) and `role` must be a known value.
// PT: O payload é entrada externa como qualquer corpo de requisição, então o formato é validado:
//     `exp` é OBRIGATÓRIO (um token sem expiração viveria para sempre) e `role` precisa ser um
//     valor conhecido.
const claimsSchema = z.object({
	sub: z.string().min(1).max(64),
	role: z.enum(["user", "admin"]),
	iss: z.string().min(1),
	aud: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
	exp: unixTimeSchema,
	iat: unixTimeSchema.optional(),
	nbf: unixTimeSchema.optional(),
});

const BASE64URL_PART = /^[A-Za-z0-9_-]+$/;

function parseJson(part: string): unknown {
	try {
		return JSON.parse(base64UrlDecode(part).toString("utf8"));
	} catch {
		// EN: Not JSON. The caller turns `undefined` into a rejection.
		// PT: Não é JSON. Quem chamou transforma `undefined` em uma rejeição.
		return undefined;
	}
}

function reject(reason: RejectionReason): VerifyResult {
	return { ok: false, reason };
}

export type FixedVerifier = (token: string) => VerifyResult;

export function createFixedVerifier(options: FixedVerifierOptions): FixedVerifier {
	const key = assertStrongKey(options.key);
	const clock = options.clock ?? systemClock;
	const tolerance = options.clockToleranceSeconds ?? DEFAULT_CLOCK_TOLERANCE_SECONDS;
	const maxTokenBytes = options.maxTokenBytes ?? DEFAULT_MAX_TOKEN_BYTES;

	return (token: string): VerifyResult => {
		// EN: 1. Size limit, before any parsing. A token is sent by a stranger; without a limit,
		//     a huge one makes the server decode, parse and hash megabytes for nothing.
		// PT: 1. Limite de tamanho, antes de qualquer análise. Um token é enviado por um estranho;
		//     sem limite, um token enorme faz o servidor decodificar, analisar e calcular hash de
		//     megabytes à toa.
		if (Buffer.byteLength(token, "utf8") > maxTokenBytes) return reject("token_too_large");

		// EN: 2. Shape: exactly three non-empty base64url parts. An unsigned token has an empty
		//     third part and already fails here.
		// PT: 2. Formato: exatamente três partes base64url não vazias. Um token sem assinatura tem
		//     a terceira parte vazia e já falha aqui.
		const parts = token.split(".");
		const [headerPart, payloadPart, signaturePart] = parts;
		if (
			parts.length !== 3 ||
			headerPart === undefined ||
			payloadPart === undefined ||
			signaturePart === undefined
		) {
			return reject("malformed");
		}
		if (!parts.every((part) => BASE64URL_PART.test(part))) return reject("malformed");

		// EN: 3. Pinned algorithm. The header is read only to confirm it says what the server
		//     already decided. Anything else (`none`, `HS512`, `RS256`, `hs256`) is refused before
		//     any signature work. The header never selects the code path.
		// PT: 3. Algoritmo fixado. O cabeçalho é lido só para confirmar que diz o que o servidor já
		//     decidiu. Qualquer outra coisa (`none`, `HS512`, `RS256`, `hs256`) é recusada antes de
		//     qualquer trabalho de assinatura. O cabeçalho nunca escolhe o caminho do código.
		const header = headerSchema.safeParse(parseJson(headerPart));
		if (!header.success) return reject("malformed");
		if (header.data.alg !== PINNED_ALGORITHM) return reject("algorithm_not_allowed");

		// EN: 4. Signature, compared in constant time. `timingSafeEqual` takes the same time
		//     whether the first or the last byte differs, so the response time says nothing about
		//     how close a guess was. It requires equal lengths, and the length is not a secret.
		// PT: 4. Assinatura, comparada em tempo constante. O `timingSafeEqual` leva o mesmo tempo
		//     quer o primeiro ou o último byte seja diferente, então o tempo de resposta não diz
		//     nada sobre o quão perto um palpite chegou. Ele exige tamanhos iguais, e o tamanho
		//     não é segredo.
		const received = base64UrlDecode(signaturePart);
		const expected = hmacSha256(`${headerPart}.${payloadPart}`, key);
		if (received.length !== HS256_SIGNATURE_BYTES || !timingSafeEqual(received, expected)) {
			return reject("bad_signature");
		}

		// EN: 5. Only now is the payload parsed and validated. From here on we know the issuer
		//     wrote it; what is left is deciding whether it is valid here and now.
		// PT: 5. Só agora o payload é analisado e validado. Daqui em diante sabemos que o emissor o
		//     escreveu; falta decidir se ele vale aqui e agora.
		const parsed = claimsSchema.safeParse(parseJson(payloadPart));
		if (!parsed.success) return reject("invalid_claims");
		const claims = parsed.data;
		const now = clock();

		// EN: 6. Time. `exp`: the token is valid only BEFORE that instant. `nbf` (not before),
		//     when present: the token is not valid yet. The tolerance is applied to both.
		// PT: 6. Tempo. `exp`: o token só vale ANTES daquele instante. `nbf` (não antes de),
		//     quando presente: o token ainda não vale. A tolerância é aplicada aos dois.
		if (now >= claims.exp + tolerance) return reject("expired");
		if (claims.nbf !== undefined && now + tolerance < claims.nbf) return reject("not_yet_valid");

		// EN: 7. Issuer and audience. The signature proves WHO wrote the token; `aud` says FOR
		//     WHOM. When several services trust the same issuer, a token issued for one of them
		//     has a perfectly valid signature on all the others. Only the audience check stops it.
		// PT: 7. Emissor e audiência. A assinatura prova QUEM escreveu o token; o `aud` diz PARA
		//     QUEM. Quando vários serviços confiam no mesmo emissor, um token emitido para um deles
		//     tem assinatura perfeitamente válida em todos os outros. Só a verificação da
		//     audiência barra isso.
		if (claims.iss !== options.issuer) return reject("wrong_issuer");
		const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
		if (!audiences.includes(options.audience)) return reject("wrong_audience");

		return { ok: true, claims };
	};
}
