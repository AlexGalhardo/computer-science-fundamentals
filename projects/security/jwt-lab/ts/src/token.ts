// EN: The shape of a JSON Web Token (JWT) and the neutral helpers both versions share: encoding,
//     signing and reading. Nothing in this file decides whether a token is accepted. That
//     decision is the lesson, and it lives in `vulnerable/` and `fixed/`.
//
//     A JWT is three pieces of text joined by dots:
//
//         base64url(header) . base64url(payload) . base64url(signature)
//
//     header:    JSON saying how the token was signed, for example {"alg":"HS256","typ":"JWT"}
//     payload:   JSON with the claims (who the user is, until when the token is valid, ...)
//     signature: HMAC-SHA256(key, "<header>.<payload>") for the HS256 algorithm
// PT: O formato de um JSON Web Token (JWT) e os utilitários neutros que as duas versões
//     compartilham: codificar, assinar e ler. Nada neste arquivo decide se um token é aceito.
//     Essa decisão é a lição, e ela mora em `vulnerable/` e `fixed/`.
//
//     Um JWT são três pedaços de texto unidos por pontos:
//
//         base64url(cabeçalho) . base64url(payload) . base64url(assinatura)
//
//     cabeçalho:  JSON dizendo como o token foi assinado, por exemplo {"alg":"HS256","typ":"JWT"}
//     payload:    JSON com as claims (quem é o usuário, até quando o token vale, ...)
//     assinatura: HMAC-SHA256(chave, "<cabeçalho>.<payload>") no algoritmo HS256

import { createHmac } from "node:crypto";

export type Role = "user" | "admin";

// EN: The registered claims this lab uses (RFC 7519). Times are seconds since 1970 (Unix time).
//     sub: who the token is about. iss: who issued it. aud: which service it was issued for.
//     iat: when it was issued. exp: when it stops being valid. nbf: not valid before this time.
// PT: As claims registradas que este laboratório usa (RFC 7519). Tempos são segundos desde 1970
//     (tempo Unix). sub: de quem o token fala. iss: quem emitiu. aud: para qual serviço ele foi
//     emitido. iat: quando foi emitido. exp: quando deixa de valer. nbf: não vale antes disso.
export interface Claims {
	sub: string;
	role: Role;
	iss: string;
	aud: string | string[];
	iat?: number;
	exp: number;
	nbf?: number;
}

// EN: HMAC keys are bytes. A text secret is accepted too, because the vulnerable version uses one.
// PT: Chaves de HMAC são bytes. Um segredo em texto também é aceito, porque a versão vulnerável usa um.
export type SigningKey = string | Buffer;

// EN: base64url is base64 with `-` and `_` instead of `+` and `/` and without `=` padding, so
//     the result fits in a URL or an HTTP header. It is an ENCODING, not encryption: anyone can
//     decode it, with no key at all.
// PT: base64url é base64 com `-` e `_` no lugar de `+` e `/` e sem o preenchimento `=`, então o
//     resultado cabe em uma URL ou em um cabeçalho HTTP. É uma CODIFICAÇÃO, não criptografia:
//     qualquer pessoa decodifica, sem chave nenhuma.
export function base64UrlEncode(data: string | Buffer): string {
	return Buffer.from(data).toString("base64url");
}

export function base64UrlDecode(text: string): Buffer {
	return Buffer.from(text, "base64url");
}

export function encodeJson(value: unknown): string {
	return base64UrlEncode(JSON.stringify(value));
}

// EN: The HS256 signature: an HMAC-SHA256 of the first two parts, computed with the shared key.
//     Whoever has the key can produce a valid signature for any payload. That is why the key
//     must be impossible to guess, and why it must never leave the server.
// PT: A assinatura HS256: um HMAC-SHA256 das duas primeiras partes, calculado com a chave
//     compartilhada. Quem tem a chave produz uma assinatura válida para qualquer payload. Por
//     isso a chave precisa ser impossível de adivinhar, e nunca pode sair do servidor.
export function hmacSha256(signingInput: string, key: SigningKey): Buffer {
	return createHmac("sha256", key).update(signingInput).digest();
}

// EN: What an honest issuer does: build header and payload, sign them, join the three parts.
// PT: O que um emissor honesto faz: monta cabeçalho e payload, assina, une as três partes.
export function signHs256(claims: Claims, key: SigningKey): string {
	const signingInput = `${encodeJson({ alg: "HS256", typ: "JWT" })}.${encodeJson(claims)}`;
	return `${signingInput}.${base64UrlEncode(hmacSha256(signingInput, key))}`;
}

// EN: Reads the payload WITHOUT verifying anything. No key is needed, which is the whole point:
//     the payload of a JWT is readable by whoever holds the token (the user, a proxy, a log
//     file). Never put a password, an API key or private data in it. This function is for
//     display and for the lab scenarios. Its result must never be used to authorise a request.
// PT: Lê o payload SEM verificar nada. Não precisa de chave, e esse é o ponto: o payload de um
//     JWT é legível por quem tiver o token (o usuário, um proxy, um arquivo de log). Nunca
//     coloque nele uma senha, uma chave de API ou dado privado. Esta função serve para exibição
//     e para os cenários do laboratório. O resultado nunca deve ser usado para autorizar uma requisição.
export function readPayloadUnverified(token: string): Record<string, unknown> {
	const parsed: unknown = JSON.parse(base64UrlDecode(token.split(".")[1] ?? "").toString("utf8"));
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
		throw new Error("payload is not an object");
	return { ...parsed };
}
