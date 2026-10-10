// EN: THE FIX, part 3: the API. Same routes as the vulnerable version. The differences: tokens
//     are signed with a strong random key, every protected route goes through the fixed
//     verifier, and the login body is validated with Zod.
// PT: A CORREÇÃO, parte 3: a API. As mesmas rotas da versão vulnerável. As diferenças: os tokens
//     são assinados com uma chave aleatória forte, toda rota protegida passa pelo verificador
//     corrigido, e o corpo do login é validado com Zod.
// ES: LA CORRECCIÓN, parte 3: la API. Las mismas rutas de la versión vulnerable. Las diferencias: los tokens
//     se firman con una clave aleatoria fuerte, toda ruta protegida pasa por el verificador
//     corregido, y el cuerpo del inicio de sesión se valida con Zod.

import { Elysia } from "elysia";
import { z } from "zod";
import { ADMIN_REPORT, AUDIENCE, type Clock, findUser, ISSUER, TOKEN_TTL_SECONDS } from "../data";
import { bearerToken, HttpError, toErrorResponse } from "../http";
import { type Claims, signHs256 } from "../token";
import { createFixedVerifier, type RejectionReason } from "./fixed-verifier";

export interface FixedAppOptions {
	key: Buffer;
	clock: Clock;
	// EN: Where the precise reason of a rejection goes: the server log, never the response.
	// PT: Para onde vai o motivo exato de uma rejeição: o log do servidor, nunca a resposta.
	// ES: Adónde va el motivo exacto de un rechazo: el registro del servidor, nunca la respuesta.
	onReject?: (reason: RejectionReason) => void;
}

const loginSchema = z.strictObject({
	username: z.string().min(1).max(64),
	password: z.string().min(1).max(128),
});

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createFixedApp(options: FixedAppOptions) {
	// EN: Creating the verifier checks the key, so an app with a short key cannot even be built.
	// PT: Criar o verificador confere a chave, então um app com chave curta nem chega a ser montado.
	// ES: Crear el verificador comprueba la clave, así que una app con clave corta ni siquiera llega a armarse.
	const verify = createFixedVerifier({
		key: options.key,
		issuer: ISSUER,
		audience: AUDIENCE,
		clock: options.clock,
	});

	function requireClaims(request: Request): Claims {
		const token = bearerToken(request);
		if (token === null) throw new HttpError(401, "invalid_token");
		const result = verify(token);
		if (!result.ok) {
			options.onReject?.(result.reason);
			throw new HttpError(401, "invalid_token");
		}
		return result.claims;
	}

	return (
		new Elysia()
			.onError(({ error }) => toErrorResponse(error))
			.post("/login", ({ body }) => {
				const parsed = loginSchema.safeParse(body);
				if (!parsed.success) throw new HttpError(400, "invalid_body");
				const user = findUser(parsed.data.username, parsed.data.password);
				if (user === null) throw new HttpError(401, "invalid_credentials");
				const now = options.clock();
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
						options.key,
					),
				};
			})
			.get("/me", ({ request }) => {
				const claims = requireClaims(request);
				return { sub: claims.sub, role: claims.role };
			})
			// EN: The role comes from a payload whose signature was verified, so only the issuer
			//     could have written `admin` there.
			// PT: O papel vem de um payload cuja assinatura foi verificada, então só o emissor poderia
			//     ter escrito `admin` ali.
			// ES: El rol viene de un payload cuya firma fue verificada, así que solo el emisor pudo
			//     haber escrito `admin` allí.
			.get("/admin/report", ({ request }) => {
				if (requireClaims(request).role !== "admin") throw new HttpError(403, "forbidden");
				return ADMIN_REPORT;
			})
	);
}
