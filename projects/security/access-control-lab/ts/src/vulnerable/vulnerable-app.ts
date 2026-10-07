// ============================================================================================
// EN: VULNERABLE ON PURPOSE. This file exists only to make a flaw observable inside this lab
//     (broken access control: IDOR and a missing role check). Never copy it, never import it
//     from another project, never deploy it.
// PT: VULNERÁVEL DE PROPÓSITO. Este arquivo existe só para tornar uma falha observável dentro
//     deste laboratório (controle de acesso quebrado: IDOR e verificação de papel ausente).
//     Nunca copie, nunca importe de outro projeto, nunca publique.
// ============================================================================================

import { Elysia } from "elysia";
import { authenticate, type Invoice, type Store, type User } from "../data";
import { HttpError, toErrorResponse } from "../http";

function requireUser(store: Store, request: Request): User {
	const user = authenticate(store, request.headers.get("authorization"));
	if (user === null) throw new HttpError(401, "unauthenticated");
	return user;
}

// EN: THE FLAW (IDOR, insecure direct object reference). The id comes from the URL, which the
//     caller controls, and the record is returned to whoever asked. Nothing compares
//     `invoice.ownerId` with the logged-in user, so "logged in" is treated as "allowed".
// PT: A FALHA (IDOR, referência direta insegura a objeto). O id vem da URL, que quem chama
//     controla, e o registro é devolvido a quem pediu. Nada compara `invoice.ownerId` com o
//     usuário logado, então "logado" é tratado como "autorizado".
function findInvoice(store: Store, rawId: string): Invoice {
	const invoice = store.invoices.get(Number(rawId));
	if (invoice === undefined) throw new HttpError(404, "not_found");
	return invoice;
}

function readMemo(body: unknown): string {
	if (typeof body === "object" && body !== null && "memo" in body) return String(body.memo);
	return "";
}

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
export function createVulnerableApp(store: Store) {
	return (
		new Elysia()
			.onError(({ error }) => toErrorResponse(error))
			// EN: The "check in the UI". The front end reads `menu` and hides the admin link from
			//     regular users. That changes what people see, not what the server accepts: the
			//     route below is still there for anyone who types its address.
			// PT: A "verificação na interface". O front-end lê `menu` e esconde o link de admin dos
			//     usuários comuns. Isso muda o que as pessoas veem, não o que o servidor aceita: a
			//     rota abaixo continua lá para quem digitar o endereço.
			.get("/me", ({ request }) => {
				const user = requireUser(store, request);
				return {
					name: user.name,
					role: user.role,
					menu: user.role === "admin" ? ["invoices", "admin"] : ["invoices"],
				};
			})
			// EN: FLAW: the list is not filtered by owner, so every user sees every invoice.
			// PT: FALHA: a lista não é filtrada por dono, então todo usuário vê todas as faturas.
			.get("/invoices", ({ request }) => {
				requireUser(store, request);
				return [...store.invoices.values()];
			})
			.get("/invoices/:id", ({ request, params }) => {
				requireUser(store, request);
				return findInvoice(store, params.id);
			})
			// EN: FLAW: the same missing check on the write routes is worse than on the read
			//     route, because a stranger can change or destroy the record.
			// PT: FALHA: a mesma verificação ausente nas rotas de escrita é pior do que na de
			//     leitura, porque um estranho consegue alterar ou destruir o registro.
			.patch("/invoices/:id", ({ request, params, body }) => {
				requireUser(store, request);
				const invoice = findInvoice(store, params.id);
				invoice.memo = readMemo(body);
				return invoice;
			})
			.delete("/invoices/:id", ({ request, params }) => {
				requireUser(store, request);
				const invoice = findInvoice(store, params.id);
				store.invoices.delete(invoice.id);
				return { deleted: invoice.id };
			})
			// EN: FLAW: an admin-only route that checks only that somebody is logged in. The role
			//     is never looked at, because "the button is hidden anyway".
			// PT: FALHA: uma rota só de admin que confere apenas se alguém está logado. O papel
			//     nunca é olhado, porque "o botão já está escondido mesmo".
			.get("/admin/users", ({ request }) => {
				requireUser(store, request);
				return [...store.sessions.values()];
			})
	);
}
