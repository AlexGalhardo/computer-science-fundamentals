// EN: The low-level details, standing in for a real SMTP client and a real SQL driver. They
//     record what they would have sent, so the tests can look at it. Nothing here uses a
//     network or a database.
// PT: Os detalhes de baixo nível, no lugar de um cliente SMTP real e de um driver SQL real.
//     Eles registram o que teriam enviado, para que os testes possam olhar. Nada aqui usa rede
//     nem banco de dados.
// ES: Los detalles de bajo nivel, en lugar de un cliente SMTP real y de un driver SQL real.
//     Registran lo que habrían enviado, para que las pruebas puedan mirarlo. Nada aquí usa red
//     ni base de datos.
export class SmtpMailer {
	readonly outbox: string[] = [];

	sendMail(to: string, subject: string): void {
		this.outbox.push(`SMTP to ${to}: ${subject}`);
	}
}

export class SqlOrderTable {
	readonly statements: string[] = [];

	insert(orderId: string, totalCents: number): void {
		this.statements.push(`INSERT INTO orders VALUES ('${orderId}', ${totalCents})`);
	}
}

export interface CartItem {
	sku: string;
	quantity: number;
	unitCents: number;
}

export interface Cart {
	email: string;
	items: CartItem[];
}

export interface Receipt {
	orderId: string;
	totalCents: number;
}

// EN: What the tests of both versions see: the use case, plus a look at what left the system.
// PT: O que os testes das duas versões enxergam: o caso de uso, mais uma visão do que saiu do
//     sistema.
// ES: Lo que ven las pruebas de las dos versiones: el caso de uso, más una vista de lo que
//     salió del sistema.
export interface CheckoutApp {
	checkout(cart: Cart): Receipt;
	sent(): string[];
	stored(): string[];
}
