// EN: Two made-up payment SDKs, standing in for third-party libraries. They do the same job
//     with incompatible interfaces: different method names, different units (currency units
//     against cents) and different response shapes. Nothing here talks to a network.
// PT: Dois SDKs de pagamento inventados, no lugar de bibliotecas de terceiros. Fazem o mesmo
//     trabalho com interfaces incompatíveis: nomes de método diferentes, unidades diferentes
//     (unidades de moeda contra centavos) e respostas em formatos diferentes. Nada aqui usa
//     rede.
// ES: Dos SDK de pago inventados, en lugar de bibliotecas de terceros. Hacen el mismo trabajo
//     con interfaces incompatibles: nombres de método distintos, unidades distintas (unidades
//     de moneda contra centavos) y respuestas con formatos distintos. Nada aquí usa red.
const LIMIT_CENTS = 100_000;

export interface AcmeTransaction {
	transactionId: string;
	status: "OK" | "DENIED";
}

export class AcmePaySdk {
	private next = 1;

	createTransaction(input: { amount: number; currency: string }): AcmeTransaction {
		const cents = Math.round(input.amount * 100);
		return { transactionId: `acme-${this.next++}`, status: cents <= LIMIT_CENTS ? "OK" : "DENIED" };
	}
}

export interface ZetaResult {
	ref: number;
	ok: boolean;
}

export class ZetaPayClient {
	private next = 1;

	pay(amountInCents: number): ZetaResult {
		return { ref: this.next++, ok: amountInCents <= LIMIT_CENTS };
	}
}
