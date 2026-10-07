import type { OrderState } from "./table";

export interface Label {
	en: string;
	pt: string;
}

// EN: Exhaustiveness check. After every `case`, the type left for `state` is `never`. If a new
//     state is added to `STATES` and forgotten below, what is left is no longer `never`, and
//     this call stops compiling: the compiler points at every switch that must be updated.
// PT: Verificação de exaustividade. Depois de todos os `case`, o tipo que sobra para `state` é
//     `never`. Se um novo estado for acrescentado a `STATES` e esquecido abaixo, o que sobra
//     deixa de ser `never`, e esta chamada para de compilar: o compilador aponta cada switch
//     que precisa ser atualizado.
function assertNever(value: never): never {
	throw new Error(`unexpected state: ${String(value)}`);
}

export function describeState(state: OrderState): Label {
	switch (state) {
		case "created":
			return { en: "created, waiting for payment", pt: "criado, aguardando pagamento" };
		case "paid":
			return { en: "paid, waiting for shipment", pt: "pago, aguardando envio" };
		case "shipped":
			return { en: "shipped, on its way", pt: "enviado, a caminho" };
		case "delivered":
			return { en: "delivered to the customer", pt: "entregue ao cliente" };
		case "cancelled":
			return { en: "cancelled before payment", pt: "cancelado antes do pagamento" };
		case "refunded":
			return { en: "refunded to the customer", pt: "reembolsado ao cliente" };
		default:
			return assertNever(state);
	}
}
