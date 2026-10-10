// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This API protects its routes with the vulnerable verifier of this
//     lab. Never copy it, never import it from another project, never deploy it.
// PT: VULNERÁVEL DE PROPÓSITO. Esta API protege as rotas com o verificador vulnerável deste
//     laboratório. Nunca copie, nunca importe de outro projeto, nunca publique.
// ES: VULNERABLE A PROPÓSITO. Esta API protege las rutas con el verificador vulnerable de este
//     laboratorio. Nunca la copies, nunca la importes desde otro proyecto, nunca la publiques.
// ============================================================================================

import { Elysia } from "elysia";
import { ADMIN_REPORT, AUDIENCE, type Clock, findUser, ISSUER, TOKEN_TTL_SECONDS } from "../data";
import { bearerToken, HttpError, toErrorResponse } from "../http";
import { signHs256 } from "../token";
import { type VulnerableIdentity, vulnerableVerify } from "./vulnerable-verifier";

function readText(body: unknown, field: string): string {
	if (typeof body !== "object" || body === null) return "";
	const value = (body as Record<string, unknown>)[field];
	return typeof value === "string" ? value : "";
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createVulnerableApp(secret: string, clock: Clock) {
	function requireIdentity(request: Request): VulnerableIdentity {
		const token = bearerToken(request);
		const identity = token === null ? null : vulnerableVerify(token, secret);
		if (identity === null) throw new HttpError(401, "invalid_token");
		return identity;
	}

	return (
		new Elysia()
			.onError(({ error }) => toErrorResponse(error))
			// EN: The issuer side is honest: it writes `exp`, `iss` and `aud` into the token. The
			//     flaws are on the verifying side, which never reads them, and in the secret.
			// PT: O lado emissor é honesto: escreve `exp`, `iss` e `aud` no token. As falhas estão
			//     no lado que verifica, que nunca lê esses campos, e no segredo.
			// ES: El lado emisor es honesto: escribe `exp`, `iss` y `aud` en el token. Las fallas están
			//     en el lado que verifica, que nunca lee esos campos, y en el secreto.
			.post("/login", ({ body }) => {
				const user = findUser(readText(body, "username"), readText(body, "password"));
				if (user === null) throw new HttpError(401, "invalid_credentials");
				const now = clock();
				return {
					token: signHs256(
						{
							sub: user.name,
							role: user.role,
							iss: ISSUER,
							aud: AUDIENCE,
							iat: now,
							exp: now + TOKEN_TTL_SECONDS,
						},
						secret,
					),
				};
			})
			.get("/me", ({ request }) => requireIdentity(request))
			.get("/admin/report", ({ request }) => {
				if (requireIdentity(request).role !== "admin") throw new HttpError(403, "forbidden");
				return ADMIN_REPORT;
			})
	);
}
