import { randomBytes } from "node:crypto";
import { type AnyElysia, Elysia } from "elysia";
import { FAKE_USER, SESSION_COOKIE } from "./config";
import { constantTimeEqual, readCookie, textResponse } from "./http";

export type Session = {
	id: string;
	username: string;
	// EN: Only the fixed app stores an anti-CSRF token next to the session.
	// PT: Apenas o app corrigido guarda um token anti-CSRF junto da sessão.
	// ES: Solo la app corregida guarda un token anti-CSRF junto a la sesión.
	csrfToken: string | null;
};

export type AttemptOutcome =
	| "changed"
	| "rejected-no-session"
	| "rejected-bad-token"
	| "rejected-method"
	| "rejected-invalid-input";

// EN: What the server saw when someone tried to change the e-mail. The tests read this to
//     tell two very different refusals apart: "the browser did not even send the cookie"
//     (SameSite did its job) and "the cookie arrived, but the token was missing" (the token
//     did its job).
// PT: O que o servidor viu quando alguém tentou trocar o e-mail. Os testes leem isto para
//     distinguir duas recusas bem diferentes: "o navegador nem enviou o cookie" (o SameSite
//     funcionou) e "o cookie chegou, mas faltou o token" (o token funcionou).
// ES: Lo que vio el servidor cuando alguien intentó cambiar el correo. Las pruebas leen esto para
//     distinguir dos rechazos muy distintos: "el navegador ni siquiera envió la cookie" (SameSite
//     funcionó) y "la cookie llegó, pero faltó el token" (el token funcionó).
export type Attempt = {
	method: string;
	hadSessionCookie: boolean;
	secFetchSite: string | null;
	origin: string | null;
	outcome: AttemptOutcome;
};

export type Observations = {
	email: string;
	attempts: Attempt[];
};

// EN: All the state of one app: the single fake account, the open sessions and the log of
//     attempts. It lives in memory, so restarting the container starts from scratch.
// PT: Todo o estado de um app: a única conta falsa, as sessões abertas e o registro das
//     tentativas. Fica em memória, então reiniciar o contêiner recomeça do zero.
// ES: Todo el estado de una app: la única cuenta falsa, las sesiones abiertas y el registro de los
//     intentos. Queda en memoria, así que reiniciar el contenedor empieza de cero.
export class LabState {
	email: string = FAKE_USER.initialEmail;
	private readonly sessions = new Map<string, Session>();
	private attempts: Attempt[] = [];

	checkCredentials(username: string, password: string): boolean {
		// EN: `&` instead of `&&` so both comparisons always run.
		// PT: `&` em vez de `&&` para que as duas comparações sempre rodem.
		// ES: `&` en lugar de `&&` para que las dos comparaciones siempre se ejecuten.
		return (
			(Number(constantTimeEqual(username, FAKE_USER.username)) &
				Number(constantTimeEqual(password, FAKE_USER.password))) ===
			1
		);
	}

	// EN: The session id is the secret that proves who the user is, so it must be impossible
	//     to guess: 32 random bytes from the operating system's secure generator.
	// PT: O id da sessão é o segredo que prova quem é o usuário, então precisa ser impossível
	//     de adivinhar: 32 bytes aleatórios do gerador seguro do sistema operacional.
	// ES: El id de la sesión es el secreto que prueba quién es el usuario, así que debe ser imposible
	//     de adivinar: 32 bytes aleatorios del generador seguro del sistema operativo.
	createSession(csrfToken: string | null): Session {
		const session: Session = {
			id: randomBytes(32).toString("base64url"),
			username: FAKE_USER.username,
			csrfToken,
		};
		this.sessions.set(session.id, session);
		return session;
	}

	sessionFromRequest(request: Request): Session | null {
		const id = readCookie(request, SESSION_COOKIE);
		if (id === null) {
			return null;
		}
		return this.sessions.get(id) ?? null;
	}

	// EN: `Sec-Fetch-Site` and `Origin` are filled in by the browser, not by the page, so they
	//     are recorded as evidence of where the request started.
	// PT: `Sec-Fetch-Site` e `Origin` são preenchidos pelo navegador, não pela página, então
	//     ficam registrados como evidência de onde a requisição começou.
	// ES: `Sec-Fetch-Site` y `Origin` los rellena el navegador, no la página, así que
	//     quedan registrados como evidencia de dónde empezó la solicitud.
	record(request: Request, outcome: AttemptOutcome): void {
		this.attempts.push({
			method: request.method,
			hadSessionCookie: readCookie(request, SESSION_COOKIE) !== null,
			secFetchSite: request.headers.get("sec-fetch-site"),
			origin: request.headers.get("origin"),
			outcome,
		});
	}

	observations(): Observations {
		return { email: this.email, attempts: [...this.attempts] };
	}

	reset(): void {
		this.email = FAKE_USER.initialEmail;
		this.sessions.clear();
		this.attempts = [];
	}
}

// EN: Lab instrumentation, shared by every version of the app. These routes exist only so the
//     tests and the demo can observe and repeat the experiment. They expose no secret (the
//     log holds booleans and header names, never a cookie value), but a real application
//     would not have them.
// PT: Instrumentação do laboratório, compartilhada por todas as versões do app. Estas rotas
//     existem apenas para que os testes e a demo consigam observar e repetir o experimento.
//     Elas não expõem nenhum segredo (o registro guarda booleanos e nomes de cabeçalho, nunca
//     o valor de um cookie), mas uma aplicação real não as teria.
// ES: Instrumentación del laboratorio, compartida por todas las versiones de la app. Estas rutas
//     existen solo para que las pruebas y la demo puedan observar y repetir el experimento.
//     No exponen ningún secreto (el registro guarda booleanos y nombres de cabecera, nunca
//     el valor de una cookie), pero una aplicación real no las tendría.
export function labRoutes(state: LabState): AnyElysia {
	return new Elysia()
		.get("/health", () => textResponse("ok", 200))
		.get("/lab/observations", () => Response.json(state.observations()))
		.post("/lab/reset", () => {
			state.reset();
			return textResponse("reset", 200);
		});
}
