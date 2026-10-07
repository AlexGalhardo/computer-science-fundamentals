// EN: The scenarios of the lab. Each function is one attempt, written once and run against both
//     versions of the API. The tests assert what happened and the demo prints it. The requests
//     are built in memory and handed straight to the app (`app.handle`): nothing leaves the
//     process, and the only "target" that exists is this lab.
// PT: Os cenários do laboratório. Cada função é uma tentativa, escrita uma vez e executada contra
//     as duas versões da API. Os testes afirmam o que aconteceu e a demo imprime. As requisições
//     são montadas em memória e entregues direto ao app (`app.handle`): nada sai do processo, e
//     o único "alvo" que existe é este laboratório.

import { ALICE_INVOICE_ID, createStore, type Store, TOKENS } from "./data";
import { createFixedApp, type FixedAppOptions } from "./fixed/fixed-app";
import { createVulnerableApp } from "./vulnerable/vulnerable-app";

export type Version = "vulnerable" | "fixed";

export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export interface Lab {
	version: Version;
	app: LabApp;
	store: Store;
}

export interface CallOptions {
	token?: string;
	method?: "GET" | "PATCH" | "DELETE";
	body?: unknown;
}

export interface Observation {
	status: number;
	body: unknown;
}

// EN: A fresh lab: a new in-memory store and one of the two apps on top of it.
// PT: Um laboratório novo: um armazenamento em memória novo e um dos dois apps em cima dele.
export function createLab(version: Version, options: FixedAppOptions = {}): Lab {
	const store = createStore();
	const app = version === "vulnerable" ? createVulnerableApp(store) : createFixedApp(store, options);
	return { version, app, store };
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
	}
	return { status: response.status, body };
}

const TARGET = `/invoices/${ALICE_INVOICE_ID}`;

// EN: bob-fake is logged in as himself and only changes the number in the URL to alice's.
// PT: bob-fake está logado como ele mesmo e só troca o número na URL para o da alice.
export function readOtherUsersInvoice(lab: Lab): Promise<Observation> {
	return call(lab.app, TARGET, { token: TOKENS.bob });
}

export interface WriteAttempt {
	attempt: Observation;
	memoAfter: string | undefined;
}

export const TAMPERED_MEMO = "changed by bob-fake";

// EN: The same trick on a write route. `memoAfter` is read from the store, not from the answer,
//     so the test sees what really happened to the record.
// PT: O mesmo truque em uma rota de escrita. `memoAfter` é lido do armazenamento, não da
//     resposta, então o teste vê o que realmente aconteceu com o registro.
export async function updateOtherUsersInvoice(lab: Lab): Promise<WriteAttempt> {
	const attempt = await call(lab.app, TARGET, { token: TOKENS.bob, method: "PATCH", body: { memo: TAMPERED_MEMO } });
	return { attempt, memoAfter: lab.store.invoices.get(ALICE_INVOICE_ID)?.memo };
}

export interface DeleteAttempt {
	attempt: Observation;
	stillExists: boolean;
}

export async function deleteOtherUsersInvoice(lab: Lab): Promise<DeleteAttempt> {
	const attempt = await call(lab.app, TARGET, { token: TOKENS.bob, method: "DELETE" });
	return { attempt, stillExists: lab.store.invoices.has(ALICE_INVOICE_ID) };
}

export interface ListAttempt {
	attempt: Observation;
	ids: number[];
}

function idsOf(body: unknown): number[] {
	if (!Array.isArray(body)) return [];
	return body.flatMap((item: unknown) =>
		typeof item === "object" && item !== null && "id" in item && typeof item.id === "number" ? [item.id] : [],
	);
}

export async function listInvoicesAs(lab: Lab, token: string | undefined): Promise<ListAttempt> {
	const attempt = await call(lab.app, "/invoices", { token });
	return { attempt, ids: idsOf(attempt.body) };
}

export interface AdminRouteAttempt {
	menu: unknown;
	attempt: Observation;
}

// EN: bob-fake is a regular user. His menu does not show the admin link, and he calls the admin
//     route anyway by typing its address.
// PT: bob-fake é um usuário comum. O menu dele não mostra o link de admin, e ele chama a rota de
//     admin mesmo assim, digitando o endereço.
export async function callAdminRouteAsRegularUser(lab: Lab): Promise<AdminRouteAttempt> {
	const me = await call(lab.app, "/me", { token: TOKENS.bob });
	const menu = typeof me.body === "object" && me.body !== null && "menu" in me.body ? me.body.menu : undefined;
	const attempt = await call(lab.app, "/admin/users", { token: TOKENS.bob });
	return { menu, attempt };
}

export interface NormalUse {
	ownerReads: Observation;
	ownerUpdates: Observation;
	ownerLists: ListAttempt;
	adminUsesAdminRoute: Observation;
	ownerDeletes: Observation;
}

export const OWNER_MEMO = "updated by alice-fake";

// EN: A fix that blocks everybody is not a fix. This scenario is the legitimate use that must
//     keep working: the owner handles her own invoice and the admin uses the admin route.
// PT: Uma correção que bloqueia todo mundo não é correção. Este cenário é o uso legítimo que
//     precisa continuar funcionando: a dona mexe na própria fatura e a admin usa a rota de admin.
export async function normalUse(lab: Lab): Promise<NormalUse> {
	const ownerReads = await call(lab.app, TARGET, { token: TOKENS.alice });
	const ownerUpdates = await call(lab.app, TARGET, {
		token: TOKENS.alice,
		method: "PATCH",
		body: { memo: OWNER_MEMO },
	});
	const ownerLists = await listInvoicesAs(lab, TOKENS.alice);
	const adminUsesAdminRoute = await call(lab.app, "/admin/users", { token: TOKENS.carol });
	const ownerDeletes = await call(lab.app, TARGET, { token: TOKENS.alice, method: "DELETE" });
	return { ownerReads, ownerUpdates, ownerLists, adminUsesAdminRoute, ownerDeletes };
}
