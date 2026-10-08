// EN: CAUSE 2: ORDER DEPENDENCE. Several lookups run at the same time and each takes a different,
//     unpredictable time (a disk, a network, another service). The order in which they FINISH
//     is not the order in which they were STARTED. Code that collects results as they arrive
//     returns them in a different order from run to run, and a test that expects one fixed
//     order passes only when the timing happens to cooperate.
// PT: CAUSA 2: DEPENDÊNCIA DE ORDEM. Várias consultas rodam ao mesmo tempo e cada uma leva um
//     tempo diferente e imprevisível (um disco, uma rede, outro serviço). A ordem em que elas
//     TERMINAM não é a ordem em que foram INICIADAS. Código que coleta os resultados conforme
//     chegam os devolve em uma ordem diferente a cada execução, e um teste que espera uma ordem
//     fixa só passa quando o tempo por acaso colabora.
export interface Price {
	productId: string;
	cents: number;
}

export type Lookup = (productId: string) => Promise<Price>;

// EN: The flawed version: `push` happens when each answer arrives, so the result is in arrival
//     order.
// PT: A versão falha: o `push` acontece quando cada resposta chega, então o resultado fica na
//     ordem de chegada.
export async function pricesInArrivalOrder(productIds: readonly string[], lookup: Lookup): Promise<Price[]> {
	const prices: Price[] = [];
	await Promise.all(
		productIds.map(async (productId) => {
			prices.push(await lookup(productId));
		}),
	);
	return prices;
}

// EN: The fix: `Promise.all` puts each answer in the position of its request, whatever the order
//     of arrival. The work is still concurrent. Only the result became deterministic.
// PT: A correção: o `Promise.all` coloca cada resposta na posição do seu pedido, seja qual for a
//     ordem de chegada. O trabalho continua concorrente. Só o resultado ficou determinístico.
export function pricesInRequestOrder(productIds: readonly string[], lookup: Lookup): Promise<Price[]> {
	return Promise.all(productIds.map((productId) => lookup(productId)));
}
