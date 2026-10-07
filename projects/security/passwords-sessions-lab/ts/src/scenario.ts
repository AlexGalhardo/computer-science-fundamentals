// EN: The scenarios of the lab. Each function is one attempt, written once and run against both
//     versions of the login API. The tests assert what happened and the demo prints it. The
//     requests are built in memory and handed straight to the app (`app.handle`): nothing
//     leaves the process, and the only "target" that exists is this lab.
// PT: Os cenários do laboratório. Cada função é uma tentativa, escrita uma vez e executada contra
//     as duas versões da API de login. Os testes afirmam o que aconteceu e a demo imprime. As
//     requisições são montadas em memória e entregues direto ao app (`app.handle`): nada sai do
//     processo, e o único "alvo" que existe é este laboratório.

import { ALICE, BOB, CAROL, type FakeAccount, UNKNOWN_USERNAMES, WRONG_PASSWORDS } from "./data";
import { createFixedApp, createFixedUserTable, FIXED_COOKIE } from "./fixed/fixed-app";
import { type ParsedSetCookie, parseSetCookie } from "./http";
import { createVulnerableApp, createVulnerableUserTable, VULNERABLE_COOKIE } from "./vulnerable/vulnerable-app";

export type Version = "vulnerable" | "fixed";

export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export interface Lab {
	version: Version;
	app: LabApp;
	cookieName: string;
	// EN: The user table (username to stored hash), exposed so a test can see what is stored.
	// PT: A tabela de usuários (nome para hash guardado), exposta para um teste ver o que está guardado.
	users: Map<string, string>;
	// EN: Moves the lab's clock forward. Only the fixed API looks at the clock.
	// PT: Adianta o relógio do laboratório. Só a API corrigida olha o relógio.
	advance(ms: number): void;
}

// EN: In this lab the "address of the client" is a label the scenario attaches to the request,
//     standing for the address a real server reads from the connection.
// PT: Neste laboratório o "endereço do cliente" é um rótulo que o cenário anexa à requisição,
//     no lugar do endereço que um servidor real lê da conexão.
const CLIENT_HEADER = "x-lab-client";
const DEFAULT_CLIENT = "client-a-fake";
const OTHER_CLIENT = "client-b-fake";

export async function createLab(version: Version): Promise<Lab> {
	let now = Date.UTC(2026, 0, 1);
	const advance = (ms: number): void => {
		now += ms;
	};
	if (version === "vulnerable") {
		const users = createVulnerableUserTable();
		return { version, app: createVulnerableApp(users), cookieName: VULNERABLE_COOKIE, users, advance };
	}
	const users = await createFixedUserTable();
	const app = createFixedApp(users, {
		clock: () => now,
		clientKeyOf: (request) => request.headers.get(CLIENT_HEADER) ?? DEFAULT_CLIENT,
	});
	return { version, app, cookieName: FIXED_COOKIE, users, advance };
}

export interface CallOptions {
	method?: "GET" | "POST";
	body?: unknown;
	sessionId?: string;
	client?: string;
}

export interface Observation {
	status: number;
	body: unknown;
	cookie: ParsedSetCookie | undefined;
	retryAfter: string | null;
}

export async function call(lab: Lab, path: string, options: CallOptions = {}): Promise<Observation> {
	const headers = new Headers({ [CLIENT_HEADER]: options.client ?? DEFAULT_CLIENT });
	if (options.sessionId !== undefined) headers.set("cookie", `${lab.cookieName}=${options.sessionId}`);
	if (options.body !== undefined) headers.set("content-type", "application/json");
	const response = await lab.app.handle(
		new Request(`https://lab.invalid${path}`, {
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
	}
	const setCookie = response.headers.get("set-cookie");
	return {
		status: response.status,
		body,
		cookie: setCookie === null ? undefined : parseSetCookie(setCookie),
		retryAfter: response.headers.get("retry-after"),
	};
}

export function login(
	lab: Lab,
	account: FakeAccount,
	options: Pick<CallOptions, "sessionId" | "client"> = {},
): Promise<Observation> {
	return call(lab, "/login", {
		...options,
		method: "POST",
		body: { username: account.username, password: account.password },
	});
}

export interface FixationAttempt {
	preLoginId: string | undefined;
	postLoginId: string | undefined;
	oldIdAfterLogin: Observation;
	currentIdAfterLogin: Observation;
}

// EN: Session fixation, step by step. 1: a session id exists before any login (the site hands
//     one to every visitor). Assume somebody else knows it. 2: alice-fake logs in from the
//     browser holding that id. 3: the old id is presented again. If it now answers as
//     alice-fake, whoever knew it is inside her account without ever knowing her password.
// PT: Fixação de sessão, passo a passo. 1: um id de sessão existe antes de qualquer login (o
//     site entrega um a todo visitante). Suponha que outra pessoa o conheça. 2: alice-fake faz
//     login no navegador que tem esse id. 3: o id antigo é apresentado de novo. Se agora ele
//     responde como alice-fake, quem o conhecia está dentro da conta dela sem nunca ter sabido
//     a senha.
export async function loginOverExistingSession(lab: Lab): Promise<FixationAttempt> {
	const preLoginId = (await call(lab, "/home")).cookie?.value;
	const loggedIn = await login(lab, ALICE, { sessionId: preLoginId });
	const postLoginId = loggedIn.cookie?.value ?? preLoginId;
	return {
		preLoginId,
		postLoginId,
		oldIdAfterLogin: await call(lab, "/me", { sessionId: preLoginId }),
		currentIdAfterLogin: await call(lab, "/me", { sessionId: postLoginId }),
	};
}

// EN: The cookie a browser receives after a plain login, with its attributes.
// PT: O cookie que um navegador recebe depois de um login comum, com os seus atributos.
export async function sessionCookieAfterLogin(lab: Lab): Promise<ParsedSetCookie | undefined> {
	return (await login(lab, ALICE)).cookie;
}

export interface LogoutAttempt {
	logout: Observation;
	sameIdAfterLogout: Observation;
}

// EN: A copy of the session id is used again after the user logged out.
// PT: Uma cópia do id de sessão é usada de novo depois que o usuário saiu.
export async function reuseSessionAfterLogout(lab: Lab): Promise<LogoutAttempt> {
	const sessionId = (await login(lab, ALICE)).cookie?.value;
	const logout = await call(lab, "/logout", { method: "POST", sessionId });
	return { logout, sameIdAfterLogout: await call(lab, "/me", { sessionId }) };
}

export interface ErrorMessages {
	unknownUser: Observation;
	wrongPassword: Observation;
}

// EN: One login with a name that is not registered and one with a registered name and a wrong
//     password. If the two answers differ, the API tells which names exist.
// PT: Um login com um nome que não está cadastrado e um com um nome cadastrado e senha errada.
//     Se as duas respostas forem diferentes, a API conta quais nomes existem.
export async function compareErrorMessages(lab: Lab): Promise<ErrorMessages> {
	const wrong = WRONG_PASSWORDS[0];
	return {
		unknownUser: await login(lab, { username: UNKNOWN_USERNAMES[0], password: wrong }),
		wrongPassword: await login(lab, { username: ALICE.username, password: wrong }),
	};
}

export interface RepeatedFailures {
	wrongAttempts: Observation[];
	correctPasswordAfterwards: Observation;
}

// EN: Six wrong passwords in a row for alice-fake, from the fixed list in data.ts, and then the
//     right one. The question is only whether the server keeps evaluating attempts.
// PT: Seis senhas erradas seguidas para alice-fake, da lista fixa em data.ts, e depois a certa.
//     A pergunta é só se o servidor continua avaliando as tentativas.
export async function repeatWrongPassword(lab: Lab): Promise<RepeatedFailures> {
	const wrongAttempts: Observation[] = [];
	for (const password of WRONG_PASSWORDS) {
		wrongAttempts.push(await login(lab, { username: ALICE.username, password }));
	}
	return { wrongAttempts, correctPasswordAfterwards: await login(lab, ALICE) };
}

export interface SpreadFailures {
	failures: Observation[];
	sameClientAfterwards: Observation;
	otherClientAfterwards: Observation;
}

// EN: One client fails twice on each of five names (three fake accounts and two names that do
//     not exist). No account reaches its own limit of five, so only a per-client limit notices.
//     Afterwards bob-fake logs in with his right password, once from that client and once from
//     another one.
// PT: Um cliente erra duas vezes em cada um de cinco nomes (três contas falsas e dois nomes que
//     não existem). Nenhuma conta alcança o seu próprio limite de cinco, então só um limite por
//     cliente percebe. Depois bob-fake faz login com a senha certa, uma vez desse cliente e uma
//     vez de outro.
export async function spreadFailuresAcrossAccounts(lab: Lab): Promise<SpreadFailures> {
	const usernames = [ALICE.username, BOB.username, CAROL.username, ...UNKNOWN_USERNAMES];
	const failures: Observation[] = [];
	for (const username of usernames) {
		for (const password of WRONG_PASSWORDS.slice(0, 2)) {
			failures.push(await login(lab, { username, password }));
		}
	}
	return {
		failures,
		sameClientAfterwards: await login(lab, BOB),
		otherClientAfterwards: await login(lab, BOB, { client: OTHER_CLIENT }),
	};
}

export interface NormalUse {
	login: Observation;
	me: Observation;
	wrongPassword: Observation;
	anonymous: Observation;
}

// EN: A fix that blocks everybody is not a fix. This is the legitimate use that must keep
//     working: bob-fake logs in and is recognised, a wrong password is refused, and a visitor
//     without a session is not logged in.
// PT: Uma correção que bloqueia todo mundo não é correção. Este é o uso legítimo que precisa
//     continuar funcionando: bob-fake faz login e é reconhecido, uma senha errada é recusada, e
//     um visitante sem sessão não está logado.
export async function normalUse(lab: Lab): Promise<NormalUse> {
	const loggedIn = await login(lab, BOB);
	return {
		login: loggedIn,
		me: await call(lab, "/me", { sessionId: loggedIn.cookie?.value }),
		wrongPassword: await login(lab, { username: CAROL.username, password: WRONG_PASSWORDS[0] }),
		anonymous: await call(lab, "/me"),
	};
}
