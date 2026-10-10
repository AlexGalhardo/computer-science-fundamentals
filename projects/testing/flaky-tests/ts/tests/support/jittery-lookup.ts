import type { Lookup } from "../../src/prices";

// EN: A lookup whose latency varies from 0 to 5 ms, to stand for a real dependency. The jitter
//     is simulated with a random delay. BOTH the flaky and the fixed test use this same lookup:
//     the fix is in the code that collects the answers, not in making the dependency predictable.
// PT: Uma consulta cuja latência varia de 0 a 5 ms, para representar uma dependência real. A
//     variação é simulada com um atraso aleatório. O teste intermitente E o corrigido usam esta
//     mesma consulta: a correção está no código que coleta as respostas, não em tornar a
//     dependência previsível.
// ES: Una consulta cuya latencia varía de 0 a 5 ms, para representar una dependencia real. La
//     variación se simula con un retraso aleatorio. La prueba intermitente Y la corregida usan esta
//     misma consulta: la corrección está en el código que recoge las respuestas, no en volver
//     predecible la dependencia.
const CENTS: Readonly<Record<string, number>> = { apple: 120, bread: 450, cheese: 990 };

export const jitteryLookup: Lookup = async (productId) => {
	await Bun.sleep(Math.random() * 5);
	return { productId, cents: CENTS[productId] ?? 0 };
};
