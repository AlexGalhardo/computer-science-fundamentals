import type { AcmePaySdk, ZetaPayClient } from "./vendors";

// EN: The contract the system wants, written in its own terms: cents in, a receipt out.
// PT: O contrato que o sistema quer, escrito em seus próprios termos: centavos entram, um
//     recibo sai.
export interface Receipt {
	id: string;
	approved: boolean;
}

export interface PaymentGateway {
	charge(cents: number): Receipt;
}

// EN: ADAPTER. Each class implements the expected interface and translates the call and the
//     answer to one vendor: method name, unit and response shape. Vendor types stop here.
// PT: ADAPTER. Cada classe implementa a interface esperada e traduz a chamada e a resposta para
//     um fornecedor: nome do método, unidade e formato da resposta. Os tipos do fornecedor
//     param aqui.
export class AcmePayGateway implements PaymentGateway {
	constructor(private readonly sdk: AcmePaySdk) {}

	charge(cents: number): Receipt {
		const result = this.sdk.createTransaction({ amount: cents / 100, currency: "BRL" });
		return { id: result.transactionId, approved: result.status === "OK" };
	}
}

export class ZetaPayGateway implements PaymentGateway {
	constructor(private readonly client: ZetaPayClient) {}

	charge(cents: number): Receipt {
		const result = this.client.pay(cents);
		return { id: `zeta-${result.ref}`, approved: result.ok };
	}
}

// EN: The rule knows only the contract, so swapping the vendor is a change in the line that
//     builds the gateway, and a test can pass a plain object.
// PT: A regra conhece só o contrato, então trocar de fornecedor é uma mudança na linha que
//     monta o gateway, e um teste pode passar um objeto simples.
export function checkout(gateway: PaymentGateway, totalCents: number): Receipt {
	if (totalCents <= 0) {
		throw new Error("nothing to charge");
	}
	return gateway.charge(totalCents);
}
