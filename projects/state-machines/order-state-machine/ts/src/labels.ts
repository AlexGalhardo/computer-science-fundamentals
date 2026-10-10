import type { OrderState } from "./table";

export interface Label {
	en: string;
	pt: string;
	es: string;
}

// EN: Exhaustiveness check. After every `case`, the type left for `state` is `never`. If a new
//     state is added to `STATES` and forgotten below, what is left is no longer `never`, and
//     this call stops compiling: the compiler points at every switch that must be updated.
// PT: Verificação de exaustividade. Depois de todos os `case`, o tipo que sobra para `state` é
//     `never`. Se um novo estado for acrescentado a `STATES` e esquecido abaixo, o que sobra
//     deixa de ser `never`, e esta chamada para de compilar: o compilador aponta cada switch
//     que precisa ser atualizado.
// ES: Verificación de exhaustividad. Después de todos los `case`, el tipo que queda para `state`
//     es `never`. Si se añade un nuevo estado a `STATES` y se olvida abajo, lo que queda deja de
//     ser `never`, y esta llamada deja de compilar: el compilador señala cada switch que debe
//     actualizarse.
function assertNever(value: never): never {
	throw new Error(`unexpected state: ${String(value)}`);
}

export function describeState(state: OrderState): Label {
	switch (state) {
		case "created":
			return {
				en: "created, waiting for payment",
				pt: "criado, aguardando pagamento",
				es: "creado, esperando el pago",
			};
		case "paid":
			return { en: "paid, waiting for shipment", pt: "pago, aguardando envio", es: "pagado, esperando el envío" };
		case "shipped":
			return { en: "shipped, on its way", pt: "enviado, a caminho", es: "enviado, en camino" };
		case "delivered":
			return { en: "delivered to the customer", pt: "entregue ao cliente", es: "entregado al cliente" };
		case "cancelled":
			return {
				en: "cancelled before payment",
				pt: "cancelado antes do pagamento",
				es: "cancelado antes del pago",
			};
		case "refunded":
			return { en: "refunded to the customer", pt: "reembolsado ao cliente", es: "reembolsado al cliente" };
		default:
			return assertNever(state);
	}
}
