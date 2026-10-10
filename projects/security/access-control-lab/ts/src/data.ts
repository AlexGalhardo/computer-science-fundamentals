// EN: The fake data of the lab: three fake users, their fake session tokens and four invoices,
//     all kept in memory. Both versions of the API (vulnerable and fixed) use this same store,
//     so the only difference between them is the authorisation code.
// PT: Os dados falsos do laboratório: três usuários falsos, seus tokens de sessão falsos e quatro
//     faturas, tudo em memória. As duas versões da API (vulnerável e corrigida) usam este mesmo
//     armazenamento, então a única diferença entre elas é o código de autorização.
// ES: Los datos falsos del laboratorio: tres usuarios falsos, sus tokens de sesión falsos y cuatro
//     facturas, todo en memoria. Las dos versiones de la API (vulnerable y corregida) usan este mismo
//     almacenamiento, así que la única diferencia entre ellas es el código de autorización.

export type Role = "user" | "admin";

export interface User {
	id: string;
	name: string;
	role: Role;
}

export interface Invoice {
	id: number;
	ownerId: string;
	amountCents: number;
	memo: string;
}

export interface Store {
	sessions: Map<string, User>;
	invoices: Map<number, Invoice>;
}

// EN: Obviously fake tokens. A real session token is long, random and never written in the code.
//     Authentication ("who are you?") is not the lesson here, so it is kept as simple as possible.
//     The lesson is authorisation ("are you allowed to do this to that record?").
// PT: Tokens obviamente falsos. Um token de sessão real é longo, aleatório e nunca fica escrito no
//     código. Autenticação ("quem é você?") não é a lição aqui, então ela é a mais simples
//     possível. A lição é autorização ("você pode fazer isto com aquele registro?").
// ES: Tokens obviamente falsos. Un token de sesión real es largo, aleatorio y nunca queda escrito en el
//     código. La autenticación ("¿quién eres?") no es la lección aquí, así que es lo más simple
//     posible. La lección es la autorización ("¿puedes hacer esto con ese registro?").
export const TOKENS = {
	alice: "FAKE-TOKEN-alice-not-real",
	bob: "FAKE-TOKEN-bob-not-real",
	carol: "FAKE-TOKEN-carol-admin-not-real",
} as const;

const ALICE: User = { id: "user-alice-fake", name: "alice-fake", role: "user" };
const BOB: User = { id: "user-bob-fake", name: "bob-fake", role: "user" };
const CAROL: User = { id: "user-carol-fake", name: "carol-admin-fake", role: "admin" };

// EN: The ids are sequential on purpose: after seeing your own invoice 1002, guessing that 1001
//     exists takes no effort. That makes the flaw easy to see, but it is not the cause of it.
// PT: Os ids são sequenciais de propósito: depois de ver a sua fatura 1002, adivinhar que a 1001
//     existe não dá trabalho. Isso deixa a falha fácil de ver, mas não é a causa dela.
// ES: Los ids son secuenciales a propósito: después de ver tu factura 1002, adivinar que la 1001
//     existe no cuesta trabajo. Eso deja la falla fácil de ver, pero no es su causa.
export const ALICE_INVOICE_ID = 1001;
export const BOB_INVOICE_ID = 1002;
export const MISSING_INVOICE_ID = 9999;

// EN: Every call builds a new store, so each test starts from the same data and a deleted
//     invoice in one test never affects another.
// PT: Cada chamada monta um armazenamento novo, então cada teste parte dos mesmos dados e uma
//     fatura apagada em um teste nunca afeta outro.
// ES: Cada llamada arma un almacenamiento nuevo, así que cada prueba parte de los mismos datos y una
//     factura borrada en una prueba nunca afecta a otra.
export function createStore(): Store {
	const invoices: Invoice[] = [
		{ id: ALICE_INVOICE_ID, ownerId: ALICE.id, amountCents: 12_000, memo: "alice-fake: fake consulting invoice" },
		{ id: BOB_INVOICE_ID, ownerId: BOB.id, amountCents: 4_500, memo: "bob-fake: fake hosting invoice" },
		{ id: 1003, ownerId: ALICE.id, amountCents: 990, memo: "alice-fake: fake domain invoice" },
		{ id: 1004, ownerId: BOB.id, amountCents: 30_000, memo: "bob-fake: fake licence invoice" },
	];
	return {
		sessions: new Map<string, User>([
			[TOKENS.alice, ALICE],
			[TOKENS.bob, BOB],
			[TOKENS.carol, CAROL],
		]),
		invoices: new Map(invoices.map((invoice) => [invoice.id, { ...invoice }])),
	};
}

// EN: Turns the `Authorization: Bearer <token>` header into a user, or `null` for an anonymous
//     request. Both versions authenticate correctly: the vulnerable one knows exactly who is
//     calling, and still forgets to ask whether that person may touch the record.
// PT: Transforma o cabeçalho `Authorization: Bearer <token>` em um usuário, ou `null` para uma
//     requisição anônima. As duas versões autenticam corretamente: a vulnerável sabe exatamente
//     quem está chamando, e mesmo assim esquece de perguntar se essa pessoa pode mexer no registro.
// ES: Transforma la cabecera `Authorization: Bearer <token>` en un usuario, o `null` para una
//     solicitud anónima. Las dos versiones autentican correctamente: la vulnerable sabe exactamente
//     quién llama, y aun así olvida preguntar si esa persona puede tocar el registro.
export function authenticate(store: Store, authorization: string | null): User | null {
	const prefix = "Bearer ";
	if (authorization === null || !authorization.startsWith(prefix)) return null;
	return store.sessions.get(authorization.slice(prefix.length)) ?? null;
}
