import type { AcmePaySdk, AcmeTransaction } from "./vendors";

// EN: FAILING DESIGN. The business rule calls the vendor SDK directly, converts the units
//     itself and returns the vendor's own type. Every caller ends up comparing the vendor's
//     status text, so replacing the vendor means editing the rule and all its callers.
// PT: DESENHO COM DEFEITO. A regra de negócio chama o SDK do fornecedor diretamente, converte
//     as unidades ela mesma e devolve o tipo do próprio fornecedor. Todo chamador acaba
//     comparando o texto de status do fornecedor, então trocar de fornecedor significa editar
//     a regra e todos os seus chamadores.
export function checkout(sdk: AcmePaySdk, totalCents: number): AcmeTransaction {
	if (totalCents <= 0) {
		throw new Error("nothing to charge");
	}
	return sdk.createTransaction({ amount: totalCents / 100, currency: "BRL" });
}
