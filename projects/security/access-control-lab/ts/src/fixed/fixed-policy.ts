// EN: THE FIX, part 1: the policy. Every authorisation decision of the API is taken by the one
//     function in this file. A route never writes its own `if (user.role === ...)`: it asks
//     `can(user, action, resource)`. One place to read, one place to test, one place to change.
// PT: A CORREÇÃO, parte 1: a política. Toda decisão de autorização da API é tomada pela única
//     função deste arquivo. Uma rota nunca escreve o seu próprio `if (user.role === ...)`: ela
//     pergunta `can(user, action, resource)`. Um lugar para ler, um para testar, um para mudar.

import type { Invoice, User } from "../data";

export type Action = "list" | "read" | "update" | "delete" | "use-admin-route";

// EN: The resource is described by what the decision needs, and nothing else. For an invoice
//     that is its owner. The owner comes from the record loaded on the server, never from the
//     request: a caller who could send the owner would simply send their own id.
// PT: O recurso é descrito pelo que a decisão precisa, e nada mais. Para uma fatura, é o dono.
//     O dono vem do registro carregado no servidor, nunca da requisição: quem pudesse enviar o
//     dono simplesmente enviaria o próprio id.
export type Resource = { kind: "invoice-collection" } | { kind: "invoice"; ownerId: string } | { kind: "admin-area" };

export function invoiceResource(invoice: Invoice): Resource {
	return { kind: "invoice", ownerId: invoice.ownerId };
}

// EN: Deny by default. The function only says `true` for the combinations written below, and
//     everything else (an anonymous caller, a new action nobody thought about, a resource kind
//     added next year) falls through to `false`. The opposite design, "allow unless a rule
//     forbids", turns every forgotten case into a hole.
// PT: Negar por padrão. A função só responde `true` para as combinações escritas abaixo, e todo
//     o resto (um chamador anônimo, uma ação nova em que ninguém pensou, um tipo de recurso
//     criado no ano que vem) cai em `false`. O desenho oposto, "permitir a menos que uma regra
//     proíba", transforma cada caso esquecido em um buraco.
export function can(user: User | null, action: Action, resource: Resource): boolean {
	if (user === null) return false;

	switch (resource.kind) {
		// EN: Anyone logged in may ask for the list. What the list contains is decided item by
		//     item with the "read" rule below, so the list can never show more than a direct read.
		// PT: Qualquer pessoa logada pode pedir a lista. O que a lista contém é decidido item a
		//     item com a regra de "read" abaixo, então a lista nunca mostra mais que a leitura direta.
		case "invoice-collection":
			return action === "list";

		// EN: Ownership check: the record belongs to the caller, or the caller is an admin.
		// PT: Verificação de dono: o registro pertence a quem chama, ou quem chama é admin.
		case "invoice":
			if (action !== "read" && action !== "update" && action !== "delete") return false;
			return user.role === "admin" || resource.ownerId === user.id;

		// EN: Role check: the role is read from the session on the server, not from the request.
		// PT: Verificação de papel: o papel é lido da sessão no servidor, não da requisição.
		case "admin-area":
			return action === "use-admin-route" && user.role === "admin";

		default:
			return false;
	}
}
