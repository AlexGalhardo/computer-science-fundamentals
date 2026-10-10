// EN: THE FIX, part 2: the routes. Same API as the vulnerable version, with two differences:
//     every route goes through the policy (`can`) before touching a record, and every external
//     input (the id in the URL, the request body) is validated with Zod.
// PT: A CORREÇÃO, parte 2: as rotas. A mesma API da versão vulnerável, com duas diferenças: toda
//     rota passa pela política (`can`) antes de tocar em um registro, e toda entrada externa (o
//     id na URL, o corpo da requisição) é validada com Zod.
// ES: LA CORRECCIÓN, parte 2: las rutas. La misma API de la versión vulnerable, con dos diferencias: toda
//     ruta pasa por la política (`can`) antes de tocar un registro, y toda entrada externa (el
//     id en la URL, el cuerpo de la solicitud) se valida con Zod.

import { Elysia } from "elysia";
import { z } from "zod";
import { authenticate, type Invoice, type Store, type User } from "../data";
import { HttpError, toErrorResponse } from "../http";
import { type Action, can, invoiceResource, type Resource } from "./fixed-policy";

export interface FixedAppOptions {
	// EN: What to answer when the invoice exists but the caller may not touch it.
	//     `false` (default): 403, honest and easy to debug, but it confirms the id exists.
	//     `true`: 404, the same answer as for an id that does not exist, so nothing is confirmed.
	// PT: O que responder quando a fatura existe mas quem chama não pode mexer nela.
	//     `false` (padrão): 403, honesto e fácil de depurar, mas confirma que o id existe.
	//     `true`: 404, a mesma resposta de um id que não existe, então nada é confirmado.
	// ES: Qué responder cuando la factura existe pero quien llama no puede tocarla.
	//     `false` (por defecto): 403, honesto y fácil de depurar, pero confirma que el id existe.
	//     `true`: 404, la misma respuesta que para un id que no existe, así que nada se confirma.
	hideExistence?: boolean;
}

// EN: The id must look exactly like an id: digits only, no sign, no spaces, no "1e3". Validation
//     does not replace the ownership check (1001 is a perfectly valid id of somebody else), it
//     only guarantees that the rest of the code handles a real integer.
// PT: O id precisa ter exatamente cara de id: só dígitos, sem sinal, sem espaços, sem "1e3". A
//     validação não substitui a verificação de dono (1001 é um id perfeitamente válido de outra
//     pessoa), ela só garante que o resto do código lida com um inteiro de verdade.
// ES: El id debe tener exactamente cara de id: solo dígitos, sin signo, sin espacios, sin "1e3". La
//     validación no reemplaza la verificación del dueño (1001 es un id perfectamente válido de otra
//     persona), solo garantiza que el resto del código maneja un entero de verdad.
const invoiceIdSchema = z
	.string()
	.regex(/^[1-9][0-9]{0,8}$/)
	.transform(Number);

// EN: A strict object rejects unknown fields. Without it, a body such as
//     `{ "memo": "x", "ownerId": "..." }` could end up changing who owns the invoice.
// PT: Um objeto estrito rejeita campos desconhecidos. Sem isso, um corpo como
//     `{ "memo": "x", "ownerId": "..." }` poderia acabar trocando o dono da fatura.
// ES: Un objeto estricto rechaza campos desconocidos. Sin eso, un cuerpo como
//     `{ "memo": "x", "ownerId": "..." }` podría terminar cambiando el dueño de la factura.
const updateBodySchema = z.strictObject({ memo: z.string().trim().min(1).max(200) });

// EN: The return type is left to inference on purpose: Elysia encodes every route in the type
//     of the app, and writing it by hand would only lose that information.
// PT: O tipo de retorno fica por conta da inferência de propósito: o Elysia codifica cada rota
//     no tipo do app, e escrevê-lo à mão só perderia essa informação.
// ES: El tipo de retorno se deja a la inferencia a propósito: Elysia codifica cada ruta
//     en el tipo de la app, y escribirlo a mano solo perdería esa información.
export function createFixedApp(store: Store, options: FixedAppOptions = {}) {
	function requireUser(request: Request): User {
		const user = authenticate(store, request.headers.get("authorization"));
		if (user === null) throw new HttpError(401, "unauthenticated");
		return user;
	}

	// EN: The gate for routes that do not load a record first. 401 when we do not know who is
	//     calling, 403 when we know and the policy says no.
	// PT: O portão das rotas que não carregam um registro antes. 401 quando não sabemos quem
	//     chama, 403 quando sabemos e a política diz não.
	// ES: La compuerta de las rutas que no cargan un registro antes. 401 cuando no sabemos quién
	//     llama, 403 cuando sabemos y la política dice que no.
	function authorize(request: Request, action: Action, resource: Resource): User {
		const user = requireUser(request);
		if (!can(user, action, resource)) throw new HttpError(403, "forbidden");
		return user;
	}

	// EN: The gate for every route that receives an invoice id. The order matters:
	//     1. who is calling (401), 2. is the id well formed (400), 3. load the record (404),
	//     4. ask the policy with the owner stored on the server (403, or 404 when hiding).
	//     The handler only receives the invoice after all four steps, so it cannot forget one.
	// PT: O portão de toda rota que recebe um id de fatura. A ordem importa:
	//     1. quem está chamando (401), 2. o id está bem formado (400), 3. carregar o registro
	//     (404), 4. perguntar à política usando o dono guardado no servidor (403, ou 404 ao
	//     esconder). O handler só recebe a fatura depois dos quatro passos, então não esquece nenhum.
	// ES: La compuerta de toda ruta que recibe un id de factura. El orden importa:
	//     1. quién llama (401), 2. el id está bien formado (400), 3. cargar el registro
	//     (404), 4. preguntar a la política usando el dueño guardado en el servidor (403, o 404 al
	//     ocultar). El handler solo recibe la factura después de los cuatro pasos, así que no olvida ninguno.
	function authorizeInvoice(request: Request, action: Action, rawId: string): Invoice {
		const user = requireUser(request);
		const id = invoiceIdSchema.safeParse(rawId);
		if (!id.success) throw new HttpError(400, "invalid_id");
		const invoice = store.invoices.get(id.data);
		if (invoice === undefined) throw new HttpError(404, "not_found");
		if (!can(user, action, invoiceResource(invoice))) {
			throw options.hideExistence ? new HttpError(404, "not_found") : new HttpError(403, "forbidden");
		}
		return invoice;
	}

	return (
		new Elysia()
			.onError(({ error }) => toErrorResponse(error))
			// EN: The menu is now derived from the same policy. Hiding the link is still useful
			//     (nobody likes a button that always fails), but it is a convenience for the
			//     user. The protection is the check inside `/admin/users`.
			// PT: O menu agora é derivado da mesma política. Esconder o link continua útil
			//     (ninguém gosta de um botão que sempre falha), mas é uma conveniência para o
			//     usuário. A proteção é a verificação dentro de `/admin/users`.
			// ES: El menú ahora se deriva de la misma política. Ocultar el enlace sigue siendo útil
			//     (a nadie le gusta un botón que siempre falla), pero es una comodidad para el
			//     usuario. La protección es la verificación dentro de `/admin/users`.
			.get("/me", ({ request }) => {
				const user = requireUser(request);
				return {
					name: user.name,
					role: user.role,
					menu: can(user, "use-admin-route", { kind: "admin-area" }) ? ["invoices", "admin"] : ["invoices"],
				};
			})
			// EN: The list is filtered with the same "read" rule used for a single invoice, so
			//     the two routes can never disagree about what a user may see.
			// PT: A lista é filtrada com a mesma regra de "read" usada para uma fatura só, então
			//     as duas rotas nunca discordam sobre o que um usuário pode ver.
			// ES: El listado se filtra con la misma regla de "read" usada para una sola factura, así que
			//     las dos rutas nunca discrepan sobre lo que un usuario puede ver.
			.get("/invoices", ({ request }) => {
				const user = authorize(request, "list", { kind: "invoice-collection" });
				return [...store.invoices.values()].filter((invoice) => can(user, "read", invoiceResource(invoice)));
			})
			.get("/invoices/:id", ({ request, params }) => authorizeInvoice(request, "read", params.id))
			// EN: Authorisation comes before body validation: a stranger learns nothing about
			//     which bodies are valid for a record that is not theirs.
			// PT: A autorização vem antes da validação do corpo: um estranho não descobre nada
			//     sobre quais corpos são válidos para um registro que não é dele.
			// ES: La autorización viene antes de la validación del cuerpo: un extraño no descubre nada
			//     sobre qué cuerpos son válidos para un registro que no es suyo.
			.patch("/invoices/:id", ({ request, params, body }) => {
				const invoice = authorizeInvoice(request, "update", params.id);
				const parsed = updateBodySchema.safeParse(body);
				if (!parsed.success) throw new HttpError(400, "invalid_body");
				invoice.memo = parsed.data.memo;
				return invoice;
			})
			.delete("/invoices/:id", ({ request, params }) => {
				const invoice = authorizeInvoice(request, "delete", params.id);
				store.invoices.delete(invoice.id);
				return { deleted: invoice.id };
			})
			.get("/admin/users", ({ request }) => {
				authorize(request, "use-admin-route", { kind: "admin-area" });
				return [...store.sessions.values()];
			})
	);
}
