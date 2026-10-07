// EN: A call counter passed to the recursive versions. Wall-clock time depends on the machine,
//     but the number of calls is a property of the algorithm: it is the same on any computer
//     and shows exactly how much repeated work memoisation removes.
// PT: Um contador de chamadas passado às versões recursivas. O tempo de relógio depende da
//     máquina, mas o número de chamadas é uma propriedade do algoritmo: é o mesmo em qualquer
//     computador e mostra exatamente quanto trabalho repetido a memoização remove.
export interface Counter {
	calls: number;
}

export function newCounter(): Counter {
	return { calls: 0 };
}

// EN: Lehmer generator (state * 48271 mod 2^31 - 1). The product stays below 2^53, so plain
//     JavaScript numbers compute it exactly and Python produces the very same sequence. Both
//     languages therefore build identical random instances from the same seed.
// PT: Gerador de Lehmer (estado * 48271 mod 2^31 - 1). O produto fica abaixo de 2^53, então os
//     numbers comuns de JavaScript o calculam de forma exata e o Python produz a mesma
//     sequência. Assim as duas linguagens montam instâncias aleatórias idênticas da mesma semente.
export function lehmer(seed: number): () => number {
	let state = (seed % 2147483646) + 1;
	return () => {
		state = (state * 48271) % 2147483647;
		return state;
	};
}
