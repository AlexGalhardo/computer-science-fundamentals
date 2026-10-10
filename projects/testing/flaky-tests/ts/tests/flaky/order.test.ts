import { expect, test } from "bun:test";
import { pricesInArrivalOrder } from "../../src/prices";
import { jitteryLookup } from "../support/jittery-lookup";

// EN: FLAKY ON PURPOSE (cause: order dependence). Three lookups run concurrently with different
//     latencies, and the code returns the answers in arrival order. The test expects the order
//     of the request, which is only one of the six possible arrival orders.
// PT: INTERMITENTE DE PROPÓSITO (causa: dependência de ordem). Três consultas rodam ao mesmo
//     tempo com latências diferentes, e o código devolve as respostas na ordem de chegada. O
//     teste espera a ordem do pedido, que é só uma das seis ordens de chegada possíveis.
// ES: INTERMITENTE A PROPÓSITO (causa: dependencia del orden). Tres consultas se ejecutan al mismo
//     tiempo con latencias distintas, y el código devuelve las respuestas en orden de llegada. La
//     prueba espera el orden de la solicitud, que es solo uno de los seis órdenes de llegada posibles.
test("prices come back for apple, bread and cheese", async () => {
	const prices = await pricesInArrivalOrder(["apple", "bread", "cheese"], jitteryLookup);
	expect(prices.map((price) => price.productId)).toEqual(["apple", "bread", "cheese"]);
});
