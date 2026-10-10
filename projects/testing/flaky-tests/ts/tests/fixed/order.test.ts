import { expect, test } from "bun:test";
import { pricesInArrivalOrder, pricesInRequestOrder } from "../../src/prices";
import { jitteryLookup } from "../support/jittery-lookup";

// EN: FIXED (deterministic order). The dependency is as unpredictable as before: the same
//     jittery lookup is used. What changed is that the order of the result no longer depends on
//     timing. There are two honest ways to get there, and each test shows one.
// PT: CORRIGIDO (ordem determinística). A dependência continua tão imprevisível quanto antes: a
//     mesma consulta com latência variável é usada. O que mudou é que a ordem do resultado não
//     depende mais do tempo. Há dois jeitos honestos de chegar lá, e cada teste mostra um.
// ES: CORREGIDO (orden determinista). La dependencia sigue siendo tan impredecible como antes: se
//     usa la misma consulta con latencia variable. Lo que cambió es que el orden del resultado ya
//     no depende del tiempo. Hay dos formas honestas de lograrlo, y cada prueba muestra una.

// EN: 1. Fix the code: when the order matters to callers, make the code guarantee it.
// PT: 1. Corrigir o código: quando a ordem importa para quem chama, o código precisa garanti-la.
// ES: 1. Corregir el código: cuando el orden le importa a quien llama, el código debe garantizarlo.
test("prices come back in the order they were requested", async () => {
	const prices = await pricesInRequestOrder(["apple", "bread", "cheese"], jitteryLookup);
	expect(prices).toEqual([
		{ productId: "apple", cents: 120 },
		{ productId: "bread", cents: 450 },
		{ productId: "cheese", cents: 990 },
	]);
});

// EN: 2. Fix the test: when the order does NOT matter, the test must not assert one. Sorting
//     both sides compares the contents and ignores the arrival order.
// PT: 2. Corrigir o teste: quando a ordem NÃO importa, o teste não deve afirmar nenhuma. Ordenar
//     os dois lados compara o conteúdo e ignora a ordem de chegada.
// ES: 2. Corregir la prueba: cuando el orden NO importa, la prueba no debe afirmar ninguno. Ordenar
//     ambos lados compara el contenido e ignora el orden de llegada.
test("every requested price arrives, in whatever order", async () => {
	const prices = await pricesInArrivalOrder(["apple", "bread", "cheese"], jitteryLookup);
	expect(prices.map((price) => price.productId).sort()).toEqual(["apple", "bread", "cheese"]);
});
