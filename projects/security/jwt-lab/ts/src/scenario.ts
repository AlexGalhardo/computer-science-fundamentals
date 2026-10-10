// EN: The scenarios of the lab. Each function is one attempt, written once and run against both
//     versions of the API. The tests assert what happened and the demo prints it. The requests
//     are built in memory and handed straight to the app (`app.handle`): nothing leaves the
//     process, and the only tokens that exist are the ones this lab issued to its fake users.
// PT: Os cenários do laboratório. Cada função é uma tentativa, escrita uma vez e executada contra
//     as duas versões da API. Os testes afirmam o que aconteceu e a demo imprime. As requisições
//     são montadas em memória e entregues direto ao app (`app.handle`): nada sai do processo, e
//     os únicos tokens que existem são os que este laboratório emitiu para seus usuários falsos.
// ES: Los escenarios del laboratorio. Cada función es un intento, escrito una vez y ejecutado contra
//     las dos versiones de la API. Las pruebas afirman lo que ocurrió y la demo lo imprime. Las solicitudes
//     se arman en memoria y se entregan directo a la app (`app.handle`): nada sale del proceso, y
//     los únicos tokens que existen son los que este laboratorio emitió para sus usuarios falsos.

import { ALICE, AUDIENCE, BOB, ISSUER, OTHER_AUDIENCE, TOKEN_TTL_SECONDS } from "./data";
import { createFixedApp } from "./fixed/fixed-app";
import { loadSigningKey } from "./fixed/fixed-key";
import type { RejectionReason } from "./fixed/fixed-verifier";
import {
	base64UrlEncode,
	type Claims,
	encodeJson,
	hmacSha256,
	readPayloadUnverified,
	type SigningKey,
	signHs256,
} from "./token";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";
import { VULNERABLE_WEAK_SECRET } from "./vulnerable/vulnerable-verifier";

export type Version = "vulnerable" | "fixed";

export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export interface Lab {
	version: Version;
	app: LabApp;
	// EN: The key of the issuer. The scenarios use it only where the story says "the issuer
	//     signed this" (a token for another service, a token with another issuer name).
	// PT: A chave do emissor. Os cenários só a usam onde a história diz "o emissor assinou isto"
	//     (um token para outro serviço, um token com outro nome de emissor).
	// ES: La clave del emisor. Los escenarios solo la usan donde la historia dice "el emisor firmó esto"
	//     (un token para otro servicio, un token con otro nombre de emisor).
	issuerKey: SigningKey;
	now(): number;
	advanceClock(seconds: number): void;
	// EN: The "server log" of the fixed version: why each token was refused.
	// PT: O "log do servidor" da versão corrigida: por que cada token foi recusado.
	// ES: El "registro del servidor" de la versión corregida: por qué se rechazó cada token.
	rejections: RejectionReason[];
}

export interface CallOptions {
	token?: string;
	method?: "GET" | "POST";
	body?: unknown;
}

export interface Observation {
	status: number;
	body: unknown;
}

// EN: A fixed starting instant, so every run of the lab is identical.
// PT: Um instante inicial fixo, para que toda execução do laboratório seja idêntica.
// ES: Un instante inicial fijo, para que toda ejecución del laboratorio sea idéntica.
export const LAB_START = 1_800_000_000;

// EN: A fresh lab: its own clock, its own key and one of the two apps. The vulnerable app gets
//     the weak word; the fixed app gets 32 random bytes generated right now, unless the
//     JWT_LAB_KEY_BASE64 environment variable carries a key (which is then validated).
// PT: Um laboratório novo: relógio próprio, chave própria e um dos dois apps. O app vulnerável
//     recebe a palavra fraca; o corrigido recebe 32 bytes aleatórios gerados agora, a menos que
//     a variável de ambiente JWT_LAB_KEY_BASE64 traga uma chave (que então é validada).
// ES: Un laboratorio nuevo: reloj propio, clave propia y una de las dos apps. La app vulnerable
//     recibe la palabra débil; la corregida recibe 32 bytes aleatorios generados ahora, a menos que
//     la variable de entorno JWT_LAB_KEY_BASE64 traiga una clave (que entonces se valida).
export function createLab(version: Version): Lab {
	let currentTime = LAB_START;
	const clock = (): number => currentTime;
	const rejections: RejectionReason[] = [];
	const issuerKey: SigningKey =
		version === "vulnerable" ? VULNERABLE_WEAK_SECRET : loadSigningKey(process.env.JWT_LAB_KEY_BASE64);
	const app =
		typeof issuerKey === "string"
			? createVulnerableApp(issuerKey, clock)
			: createFixedApp({ key: issuerKey, clock, onReject: (reason) => rejections.push(reason) });
	return {
		version,
		app,
		issuerKey,
		now: clock,
		advanceClock: (seconds: number): void => {
			currentTime += seconds;
		},
		rejections,
	};
}

export async function call(app: LabApp, path: string, options: CallOptions = {}): Promise<Observation> {
	const headers = new Headers();
	if (options.token !== undefined) headers.set("authorization", `Bearer ${options.token}`);
	if (options.body !== undefined) headers.set("content-type", "application/json");
	const response = await app.handle(
		new Request(`http://lab.invalid${path}`, {
			method: options.method ?? "GET",
			headers,
			body: options.body === undefined ? undefined : JSON.stringify(options.body),
		}),
	);
	const text = await response.text();
	let body: unknown = text;
	try {
		body = JSON.parse(text);
	} catch {
		// EN: Not JSON (for example the framework's plain-text 404): keep the text as it is.
		// PT: Não é JSON (por exemplo o 404 em texto puro do framework): mantém o texto como está.
		// ES: No es JSON (por ejemplo el 404 en texto plano del framework): mantiene el texto como está.
	}
	return { status: response.status, body };
}

export async function login(lab: Lab, credentials: { username: string; password: string }): Promise<string> {
	const answer = await call(lab.app, "/login", { method: "POST", body: credentials });
	const body = answer.body;
	if (typeof body === "object" && body !== null && "token" in body && typeof body.token === "string") {
		return body.token;
	}
	throw new Error(`login failed with status ${answer.status}`);
}

// EN: A token signed by the issuer of this lab, with some claims changed. It stands for things
//     the real issuer does legitimately (issue a token for another service) or for a token of
//     another environment that happens to share the key.
// PT: Um token assinado pelo emissor deste laboratório, com algumas claims trocadas. Representa
//     coisas que o emissor real faz legitimamente (emitir um token para outro serviço) ou um
//     token de outro ambiente que por acaso compartilha a chave.
// ES: Un token firmado por el emisor de este laboratorio, con algunos claims cambiados. Representa
//     cosas que el emisor real hace legítimamente (emitir un token para otro servicio) o un
//     token de otro entorno que por casualidad comparte la clave.
export function issueToken(lab: Lab, overrides: Partial<Claims> = {}): string {
	const now = lab.now();
	return signHs256(
		{
			sub: BOB.username,
			role: "user",
			iss: ISSUER,
			aud: AUDIENCE,
			iat: now,
			exp: now + TOKEN_TTL_SECONDS,
			...overrides,
		},
		lab.issuerKey,
	);
}

export interface TokenAttempt {
	token: string;
	attempt: Observation;
}

// EN: (a) The unsigned token. bob-fake takes his own valid token, reads the payload (no key
//     needed), changes `role` to `admin`, writes a header that says `alg: none` and leaves the
//     signature empty. Then he calls the admin route.
// PT: (a) O token sem assinatura. bob-fake pega o próprio token válido, lê o payload (não
//     precisa de chave), troca `role` para `admin`, escreve um cabeçalho dizendo `alg: none` e
//     deixa a assinatura vazia. Depois chama a rota de admin.
// ES: (a) El token sin firma. bob-fake toma su propio token válido, lee el payload (no
//     necesita clave), cambia `role` a `admin`, escribe un encabezado que dice `alg: none` y
//     deja la firma vacía. Luego llama a la ruta de admin.
export async function sendUnsignedAdminToken(lab: Lab): Promise<TokenAttempt> {
	const ownToken = await login(lab, BOB);
	const payload = { ...readPayloadUnverified(ownToken), role: "admin" };
	const token = `${encodeJson({ alg: "none", typ: "JWT" })}.${encodeJson(payload)}.`;
	return { token, attempt: await call(lab.app, "/admin/report", { token }) };
}

// EN: (b) Why a human-chosen word is not a key. An HS256 signature can be checked by anyone
//     who has a token: sign the same header and payload with a guess and see whether the result
//     matches. Nothing is sent to the server, so no rate limit or lockout ever sees it.
//     These five made-up guesses are the whole demonstration. This is not a cracking tool: the
//     list is fixed, tiny, and only ever compared with a token this lab issued to bob-fake.
// PT: (b) Por que uma palavra escolhida por uma pessoa não é uma chave. Uma assinatura HS256 pode
//     ser conferida por qualquer um que tenha um token: assine o mesmo cabeçalho e payload com
//     um palpite e veja se o resultado bate. Nada é enviado ao servidor, então nenhum limite de
//     tentativas ou bloqueio fica sabendo.
//     Estes cinco palpites inventados são a demonstração inteira. Isto não é uma ferramenta de
//     quebra: a lista é fixa, minúscula, e só é comparada com um token que este laboratório
//     emitiu para o bob-fake.
// ES: (b) Por qué una palabra elegida por una persona no es una clave. Una firma HS256 puede
//     comprobarla cualquiera que tenga un token: firma el mismo encabezado y payload con
//     un intento y mira si el resultado coincide. No se envía nada al servidor, así que ningún límite de
//     intentos ni bloqueo se entera.
//     Estos cinco intentos inventados son toda la demostración. Esto no es una herramienta de
//     descifrado: la lista es fija, minúscula, y solo se compara con un token que este laboratorio
//     emitió para bob-fake.
export const CANDIDATE_WORDS: readonly string[] = [
	"changeme-fake",
	"lab-fake-guess",
	"secret",
	"admin-fake",
	"hunter2-fake",
];

export interface WeakSecretAttempt extends TokenAttempt {
	recoveredSecret: string | null;
}

export async function resignWithGuessedSecret(lab: Lab): Promise<WeakSecretAttempt> {
	const ownToken = await login(lab, BOB);
	const [headerPart, payloadPart, signaturePart] = ownToken.split(".");
	const signingInput = `${headerPart}.${payloadPart}`;
	const recoveredSecret =
		CANDIDATE_WORDS.find((word) => base64UrlEncode(hmacSha256(signingInput, word)) === signaturePart) ?? null;

	// EN: With the word in hand, bob-fake is the issuer: he signs whatever payload he wants.
	//     When no guess matched (the fixed version), he tries the common word anyway.
	// PT: Com a palavra na mão, bob-fake é o emissor: assina o payload que quiser. Quando nenhum
	//     palpite bateu (a versão corrigida), ele tenta a palavra comum mesmo assim.
	// ES: Con la palabra en mano, bob-fake es el emisor: firma el payload que quiera. Cuando ningún
	//     intento coincidió (la versión corregida), prueba la palabra común de todos modos.
	const token = issueTokenWith(recoveredSecret ?? VULNERABLE_WEAK_SECRET, lab, { role: "admin" });
	return { recoveredSecret, token, attempt: await call(lab.app, "/admin/report", { token }) };
}

function issueTokenWith(key: SigningKey, lab: Lab, overrides: Partial<Claims>): string {
	return issueToken({ ...lab, issuerKey: key }, overrides);
}

export interface ExpiredAttempt {
	whileValid: Observation;
	afterExpiry: Observation;
}

export const TWO_HOURS = 2 * 60 * 60;

// EN: (c) The token that never dies. bob-fake logs in, the token is good for 15 minutes, and
//     two hours later the very same token is presented again (think of a token copied from a
//     log file or a lost laptop).
// PT: (c) O token que nunca morre. bob-fake faz login, o token vale por 15 minutos, e duas horas
//     depois o mesmíssimo token é apresentado de novo (pense em um token copiado de um arquivo
//     de log ou de um notebook perdido).
// ES: (c) El token que nunca muere. bob-fake inicia sesión, el token vale por 15 minutos, y dos horas
//     después el mismísimo token se presenta de nuevo (piensa en un token copiado de un archivo
//     de registro o de un portátil perdido).
export async function useTokenAfterExpiry(lab: Lab): Promise<ExpiredAttempt> {
	const token = await login(lab, BOB);
	const whileValid = await call(lab.app, "/me", { token });
	lab.advanceClock(TWO_HOURS);
	const afterExpiry = await call(lab.app, "/me", { token });
	return { whileValid, afterExpiry };
}

// EN: The same issuer signs tokens for a second service, where bob-fake really is an admin of
//     his own newsletter. The signature is genuine. He presents that token to the reports API.
// PT: O mesmo emissor assina tokens para um segundo serviço, onde bob-fake é mesmo admin da
//     própria newsletter. A assinatura é genuína. Ele apresenta esse token à API de relatórios.
// ES: El mismo emisor firma tokens para un segundo servicio, donde bob-fake sí es admin de su
//     propia newsletter. La firma es genuina. Él presenta ese token a la API de informes.
export async function replayTokenIssuedForAnotherAudience(lab: Lab): Promise<TokenAttempt> {
	const token = issueToken(lab, { role: "admin", aud: OTHER_AUDIENCE });
	return { token, attempt: await call(lab.app, "/admin/report", { token }) };
}

// EN: The control experiment: change the payload and keep the original HS256 signature. Both
//     versions refuse it, which shows what the signature is for. The flaws of the vulnerable
//     version are the ways AROUND this check, not the check itself.
// PT: O experimento de controle: trocar o payload e manter a assinatura HS256 original. As duas
//     versões recusam, o que mostra para que serve a assinatura. As falhas da versão vulnerável
//     são os jeitos de CONTORNAR essa verificação, não a verificação em si.
// ES: El experimento de control: cambiar el payload y mantener la firma HS256 original. Las dos
//     versiones rechazan, lo que muestra para qué sirve la firma. Las fallas de la versión vulnerable
//     son las maneras de ESQUIVAR esa verificación, no la verificación en sí.
export async function tamperWithPayload(lab: Lab): Promise<TokenAttempt> {
	const ownToken = await login(lab, BOB);
	const [headerPart, , signaturePart] = ownToken.split(".");
	const payload = { ...readPayloadUnverified(ownToken), role: "admin" };
	const token = `${headerPart}.${encodeJson(payload)}.${signaturePart}`;
	return { token, attempt: await call(lab.app, "/admin/report", { token }) };
}

export interface NormalUse {
	adminReadsProfile: Observation;
	adminReadsReport: Observation;
	userReadsProfile: Observation;
	userReadsReport: Observation;
	anonymousReadsProfile: Observation;
	wrongPassword: Observation;
}

// EN: A fix that blocks everybody is not a fix. This is the legitimate use that must keep
//     working: log in, use the token, and be refused only for what the role does not allow.
// PT: Uma correção que bloqueia todo mundo não é correção. Este é o uso legítimo que precisa
//     continuar funcionando: fazer login, usar o token, e ser recusado só no que o papel não permite.
// ES: Una corrección que bloquea a todo el mundo no es corrección. Este es el uso legítimo que debe
//     seguir funcionando: iniciar sesión, usar el token, y ser rechazado solo en lo que el rol no permite.
export async function normalUse(lab: Lab): Promise<NormalUse> {
	const aliceToken = await login(lab, ALICE);
	const bobToken = await login(lab, BOB);
	return {
		adminReadsProfile: await call(lab.app, "/me", { token: aliceToken }),
		adminReadsReport: await call(lab.app, "/admin/report", { token: aliceToken }),
		userReadsProfile: await call(lab.app, "/me", { token: bobToken }),
		userReadsReport: await call(lab.app, "/admin/report", { token: bobToken }),
		anonymousReadsProfile: await call(lab.app, "/me"),
		wrongPassword: await call(lab.app, "/login", {
			method: "POST",
			body: { username: BOB.username, password: "lab-fake-wrong-password" },
		}),
	};
}
