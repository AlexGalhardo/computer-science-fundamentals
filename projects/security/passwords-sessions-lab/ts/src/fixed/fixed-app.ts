// EN: THE FIX, the login API. Same routes as the vulnerable version, with every flaw closed:
//     input validated with Zod, one generic error, attempt limiting per account and per client,
//     Argon2id with upgrade of old hashes, a new session id on every login, real logout,
//     timeouts, and a cookie with every protective attribute.
// PT: A CORREÇÃO, a API de login. As mesmas rotas da versão vulnerável, com todas as falhas
//     fechadas: entrada validada com Zod, um único erro genérico, limite de tentativas por conta
//     e por cliente, Argon2id com atualização de hashes antigos, um id de sessão novo a cada
//     login, logout de verdade, expiração, e um cookie com todos os atributos de proteção.
// ES: LA CORRECCIÓN, la API de inicio de sesión. Las mismas rutas de la versión vulnerable, con todas las fallas
//     cerradas: entrada validada con Zod, un único error genérico, límite de intentos por cuenta
//     y por cliente, Argon2id con actualización de hashes antiguos, un id de sesión nuevo en cada
//     inicio de sesión, cierre de sesión de verdad, expiración, y una cookie con todos los atributos de protección.

import { createHash, randomBytes } from "node:crypto";
import { Elysia } from "elysia";
import { z } from "zod";
import { ALICE, BOB, CAROL, type Clock } from "../data";
import { jsonResponse, readCookie } from "../http";
import { AttemptLimiter, type LimiterRule } from "./fixed-attempt-limiter";
import { hashPassword, verifyAndUpgrade } from "./fixed-password-storage";
import { SessionStore, type SessionTimeouts } from "./fixed-sessions";

// EN: The `__Host-` prefix is a promise the browser enforces: it only accepts a cookie with
//     this name when it comes with `Secure`, `Path=/` and no `Domain`. So a sibling subdomain
//     or a plain HTTP page cannot overwrite it, which is one of the ways a session id gets
//     planted in somebody's browser.
// PT: O prefixo `__Host-` é uma promessa que o navegador faz cumprir: ele só aceita um cookie
//     com esse nome quando vem com `Secure`, `Path=/` e sem `Domain`. Assim um subdomínio irmão
//     ou uma página em HTTP puro não consegue sobrescrevê-lo, que é um dos jeitos de plantar um
//     id de sessão no navegador de alguém.
// ES: El prefijo `__Host-` es una promesa que el navegador hace cumplir: solo acepta una cookie
//     con ese nombre cuando viene con `Secure`, `Path=/` y sin `Domain`. Así un subdominio hermano
//     o una página en HTTP plano no puede sobrescribirla, que es una de las maneras de plantar un
//     id de sesión en el navegador de alguien.
export const FIXED_COOKIE = "__Host-sid";

const MINUTE = 60_000;

export const ACCOUNT_RULE: LimiterRule = { maxFailures: 5, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE };
export const CLIENT_RULE: LimiterRule = { maxFailures: 10, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE };
export const SESSION_TIMEOUTS: SessionTimeouts = { idleMs: 15 * MINUTE, absoluteMs: 8 * 60 * MINUTE };

export interface FixedAppOptions {
	clock?: Clock;
	// EN: How to name the client of a request for the per-client throttle. In production this
	//     is the address of the TCP connection, or the address written by YOUR OWN reverse
	//     proxy. Never a header the client can write freely, such as a raw `X-Forwarded-For`:
	//     whoever sends it would choose a new identity for every attempt.
	// PT: Como nomear o cliente de uma requisição para o limite por cliente. Em produção é o
	//     endereço da conexão TCP, ou o endereço escrito pelo SEU PRÓPRIO proxy reverso. Nunca
	//     um cabeçalho que o cliente escreve livremente, como um `X-Forwarded-For` cru: quem o
	//     envia escolheria uma identidade nova a cada tentativa.
	// ES: Cómo nombrar al cliente de una solicitud para el límite por cliente. En producción es la
	//     dirección de la conexión TCP, o la dirección escrita por TU PROPIO proxy inverso. Nunca
	//     una cabecera que el cliente escribe libremente, como un `X-Forwarded-For` crudo: quien lo
	//     envía elegiría una identidad nueva en cada intento.
	clientKeyOf?: (request: Request) => string;
}

// EN: Limits on the input before anything expensive happens. The maximum password length
//     matters: Argon2id is slow on purpose, and hashing a 10 MB "password" would be a cheap way
//     to keep the server busy. The strict object refuses unknown fields.
// PT: Limites na entrada antes de qualquer coisa cara acontecer. O tamanho máximo da senha
//     importa: o Argon2id é lento de propósito, e calcular o hash de uma "senha" de 10 MB seria
//     um jeito barato de manter o servidor ocupado. O objeto estrito recusa campos desconhecidos.
// ES: Límites en la entrada antes de que ocurra algo costoso. El tamaño máximo de la contraseña
//     importa: Argon2id es lento a propósito, y calcular el hash de una "contraseña" de 10 MB sería
//     una manera barata de mantener ocupado al servidor. El objeto estricto rechaza campos desconocidos.
const credentialsSchema = z.strictObject({
	username: z
		.string()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9-]+$/),
	password: z.string().min(1).max(128),
});

// EN: Argon2id is slow by design, so the seed hashes are computed once and reused by every lab
//     created in the same process (each lab still gets its own copy of the table).
// PT: O Argon2id é lento de propósito, então os hashes iniciais são calculados uma vez e
//     reaproveitados por todo laboratório criado no mesmo processo (cada laboratório ainda
//     recebe a sua própria cópia da tabela).
// ES: Argon2id es lento a propósito, así que los hashes iniciales se calculan una vez y
//     se reutilizan en todo laboratorio creado en el mismo proceso (cada laboratorio aún
//     recibe su propia copia de la tabla).
let seedRows: Promise<[string, string][]> | undefined;

// EN: The user table of the fixed API. alice-fake and bob-fake already have Argon2id hashes.
//     carol-legacy-fake's row was imported from the old system and still holds unsalted MD5.
// PT: A tabela de usuários da API corrigida. alice-fake e bob-fake já têm hashes Argon2id. A
//     linha da carol-legacy-fake foi importada do sistema antigo e ainda guarda MD5 sem sal.
// ES: La tabla de usuarios de la API corregida. alice-fake y bob-fake ya tienen hashes Argon2id. La
//     fila de carol-legacy-fake se importó del sistema antiguo y aún guarda MD5 sin sal.
export async function createFixedUserTable(): Promise<Map<string, string>> {
	seedRows ??= Promise.all([
		hashPassword(ALICE.password).then((hash): [string, string] => [ALICE.username, hash]),
		hashPassword(BOB.password).then((hash): [string, string] => [BOB.username, hash]),
		Promise.resolve<[string, string]>([
			CAROL.username,
			`md5$${createHash("md5").update(CAROL.password).digest("hex")}`,
		]),
	]);
	return new Map(await seedRows);
}

// EN: A real Argon2id hash of a random value nobody knows. It is what the login verifies
//     against when the username does not exist, so an unknown user costs the same time as a
//     known one. Without it, a fast answer would mean "this account does not exist".
// PT: Um hash Argon2id de verdade de um valor aleatório que ninguém conhece. É contra ele que o
//     login confere quando o nome de usuário não existe, para um usuário desconhecido custar o
//     mesmo tempo que um conhecido. Sem isso, uma resposta rápida significaria "esta conta não
//     existe".
// ES: Un hash Argon2id de verdad de un valor aleatorio que nadie conoce. Es contra él que el
//     inicio de sesión comprueba cuando el nombre de usuario no existe, para que un usuario desconocido cueste el
//     mismo tiempo que uno conocido. Sin eso, una respuesta rápida significaría "esta cuenta no
//     existe".
let dummyHash: Promise<string> | undefined;

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createFixedApp(users: Map<string, string>, options: FixedAppOptions = {}) {
	const clock = options.clock ?? Date.now;
	const sessions = new SessionStore(SESSION_TIMEOUTS, clock);
	const accountLimiter = new AttemptLimiter(ACCOUNT_RULE, clock);
	const clientLimiter = new AttemptLimiter(CLIENT_RULE, clock);
	dummyHash ??= hashPassword(randomBytes(32).toString("base64url"));
	const unknownUserHash = dummyHash;

	// EN: Every attribute closes one door.
	//     HttpOnly: page scripts cannot read the cookie, so an XSS cannot simply copy it.
	//     Secure: sent only over HTTPS, so nobody on the network reads it.
	//     SameSite=Lax: not attached to requests other sites start in the background.
	//     Path=/ and no Domain: required by the `__Host-` prefix, bound to this exact host.
	//     Max-Age: the browser forgets it at the absolute timeout (the server enforces it too).
	// PT: Cada atributo fecha uma porta.
	//     HttpOnly: scripts da página não leem o cookie, então um XSS não consegue só copiá-lo.
	//     Secure: enviado só por HTTPS, então ninguém na rede o lê.
	//     SameSite=Lax: não é anexado a requisições que outros sites iniciam em segundo plano.
	//     Path=/ e sem Domain: exigidos pelo prefixo `__Host-`, preso a este host exato.
	//     Max-Age: o navegador o esquece na expiração absoluta (o servidor também a aplica).
	// ES: Cada atributo cierra una puerta.
	//     HttpOnly: los scripts de la página no leen la cookie, así que un XSS no puede simplemente copiarla.
	//     Secure: se envía solo por HTTPS, así que nadie en la red la lee.
	//     SameSite=Lax: no se adjunta a solicitudes que otros sitios inician en segundo plano.
	//     Path=/ y sin Domain: exigidos por el prefijo `__Host-`, atada a este host exacto.
	//     Max-Age: el navegador la olvida en la expiración absoluta (el servidor también la aplica).
	function cookie(value: string, maxAgeSeconds: number): string {
		return `${FIXED_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
	}

	function sessionCookie(id: string): string {
		return cookie(id, SESSION_TIMEOUTS.absoluteMs / 1000);
	}

	function tooManyAttempts(waitMs: number): Response {
		return jsonResponse(429, { error: "too_many_attempts" }, { "retry-after": String(Math.ceil(waitMs / 1000)) });
	}

	return (
		new Elysia()
			.get("/home", ({ request }) => {
				const session = sessions.get(readCookie(request, FIXED_COOKIE));
				if (session !== undefined) return jsonResponse(200, { user: session.username });
				const id = sessions.create(null);
				return jsonResponse(200, { user: null }, { "set-cookie": sessionCookie(id) });
			})
			.post("/login", async ({ request, body, server }) => {
				const parsed = credentialsSchema.safeParse(body);
				if (!parsed.success) return jsonResponse(400, { error: "invalid_body" });
				const { username, password } = parsed.data;

				// EN: Two limits, because each one alone has a gap. Per account stops many
				//     tries against one user, whatever address they come from. Per client stops
				//     one address trying a few passwords against many users, which never trips
				//     the per-account limit. The account key is the name that was typed, whether
				//     it exists or not: a lock only for real accounts would reveal which are real.
				// PT: Dois limites, porque cada um sozinho deixa uma brecha. Por conta barra
				//     muitas tentativas contra um usuário, venham de onde vierem. Por cliente
				//     barra um endereço testando poucas senhas contra muitos usuários, o que
				//     nunca dispara o limite por conta. A chave da conta é o nome digitado,
				//     exista ou não: um bloqueio só para contas reais revelaria quais são reais.
				// ES: Dos límites, porque cada uno por sí solo deja una brecha. Por cuenta frena
				//     muchos intentos contra un usuario, vengan de donde vengan. Por cliente
				//     frena a una dirección que prueba pocas contraseñas contra muchos usuarios, lo que
				//     nunca dispara el límite por cuenta. La clave de la cuenta es el nombre escrito,
				//     exista o no: un bloqueo solo para cuentas reales revelaría cuáles son reales.
				const client = options.clientKeyOf?.(request) ?? server?.requestIP(request)?.address ?? "unknown";
				const waitMs = Math.max(clientLimiter.retryAfterMs(client), accountLimiter.retryAfterMs(username));
				if (waitMs > 0) return tooManyAttempts(waitMs);

				const stored = users.get(username);
				const check = await verifyAndUpgrade(password, stored ?? (await unknownUserHash));
				if (stored === undefined || !check.ok) {
					accountLimiter.recordFailure(username);
					clientLimiter.recordFailure(client);
					// EN: One answer for "no such user" and for "wrong password": same status,
					//     same body. The message a person sees should be just as generic.
					// PT: Uma resposta só para "usuário não existe" e para "senha errada":
					//     mesmo status, mesmo corpo. A mensagem que a pessoa vê deve ser
					//     igualmente genérica.
					// ES: Una sola respuesta para "el usuario no existe" y para "contraseña incorrecta":
					//     mismo estado, mismo cuerpo. El mensaje que ve la persona debe ser
					//     igualmente genérico.
					return jsonResponse(401, { error: "invalid_credentials" });
				}

				if (check.upgradedHash !== undefined) users.set(username, check.upgradedHash);
				accountLimiter.reset(username);

				// EN: Rotation. Whatever session id the browser arrived with is destroyed, and
				//     the logged-in session gets a brand new random id. An id that somebody knew
				//     before the login is worthless after it: this is the fix for session fixation.
				// PT: Rotação. Qualquer id de sessão com que o navegador chegou é destruído, e a
				//     sessão logada recebe um id aleatório novinho. Um id que alguém conhecia
				//     antes do login não vale nada depois dele: esta é a correção da fixação de
				//     sessão.
				// ES: Rotación. Cualquier id de sesión con el que llegó el navegador se destruye, y la
				//     sesión iniciada recibe un id aleatorio nuevecito. Un id que alguien conocía
				//     antes del inicio de sesión no vale nada después de él: esta es la corrección de la fijación de
				//     sesión.
				sessions.destroy(readCookie(request, FIXED_COOKIE));
				const id = sessions.create(username);
				return jsonResponse(200, { user: username }, { "set-cookie": sessionCookie(id) });
			})
			.get("/me", ({ request }) => {
				const username = sessions.get(readCookie(request, FIXED_COOKIE))?.username ?? null;
				if (username === null) return jsonResponse(401, { error: "not_logged_in" });
				return jsonResponse(200, { user: username });
			})
			// EN: Logout deletes the session on the server first. Clearing the cookie is only
			//     tidiness: a copy of the id made earlier is already useless.
			// PT: O logout apaga a sessão no servidor primeiro. Limpar o cookie é só capricho:
			//     uma cópia do id feita antes já não serve para nada.
			// ES: El cierre de sesión borra primero la sesión en el servidor. Limpiar la cookie es solo un detalle de cortesía:
			//     una copia del id hecha antes ya no sirve para nada.
			.post("/logout", ({ request }) => {
				sessions.destroy(readCookie(request, FIXED_COOKIE));
				return jsonResponse(200, { loggedOut: true }, { "set-cookie": cookie("", 0) });
			})
	);
}
