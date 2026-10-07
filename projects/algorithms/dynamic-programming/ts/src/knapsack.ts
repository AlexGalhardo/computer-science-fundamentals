import type { Counter } from "./counter";

export interface Item {
	value: number;
	weight: number;
}

// EN: 0-1 knapsack: choose items, each at most once, to maximise the total value without
//     exceeding the capacity. The whole problem is one question asked for every item: "take it
//     or skip it?". best(i, w) is the best value using items i.. with w capacity left:
//         best(i, w) = max( best(i + 1, w),  value[i] + best(i + 1, w - weight[i]) )
//     The three versions below compute this same recurrence. Only the order and the reuse change.
// PT: Mochila 0-1: escolher itens, cada um no máximo uma vez, para maximizar o valor total sem
//     passar da capacidade. O problema inteiro é uma pergunta feita para cada item: "levar ou
//     pular?". best(i, w) é o melhor valor usando os itens i.. com w de capacidade restante:
//         best(i, w) = max( best(i + 1, w),  valor[i] + best(i + 1, w - peso[i]) )
//     As três versões abaixo calculam essa mesma recorrência. Só mudam a ordem e o reaproveitamento.

// EN: Naive: plain recursion. Every call spawns up to two more, so the call tree has up to 2^n
//     nodes, and the same pair (i, w) is solved again every time it is reached by another path.
// PT: Ingênua: recursão pura. Cada chamada gera até duas outras, então a árvore de chamadas tem
//     até 2^n nós, e o mesmo par (i, w) é resolvido de novo cada vez que outro caminho chega a ele.
export function knapsackNaive(items: readonly Item[], capacity: number, counter: Counter): number {
	function best(i: number, w: number): number {
		counter.calls++;
		const item = items[i];
		if (item === undefined) {
			return 0;
		}
		const skip = best(i + 1, w);
		return item.weight <= w ? Math.max(skip, item.value + best(i + 1, w - item.weight)) : skip;
	}
	return best(0, capacity);
}

// EN: Memoised: the same recursion plus a cache indexed by (i, w). There are only
//     (n + 1) * (capacity + 1) distinct pairs, so at most that many calls do real work. Every
//     other call is a lookup.
// PT: Memoizada: a mesma recursão mais um cache indexado por (i, w). Só existem
//     (n + 1) * (capacidade + 1) pares distintos, então no máximo esse número de chamadas faz
//     trabalho de verdade. Todas as outras são uma consulta.
export function knapsackMemo(items: readonly Item[], capacity: number, counter: Counter): number {
	const width = capacity + 1;
	const memo = new Array<number | undefined>((items.length + 1) * width);
	function best(i: number, w: number): number {
		counter.calls++;
		const item = items[i];
		if (item === undefined) {
			return 0;
		}
		const key = i * width + w;
		const cached = memo[key];
		if (cached !== undefined) {
			return cached;
		}
		const skip = best(i + 1, w);
		const result = item.weight <= w ? Math.max(skip, item.value + best(i + 1, w - item.weight)) : skip;
		memo[key] = result;
		return result;
	}
	return best(0, capacity);
}

// EN: Tabulated: no recursion. table[i][w] is the best value using the first i items with
//     capacity w. Row i only reads row i - 1, so filling the rows top to bottom guarantees that
//     every value needed is already there. The full table is returned so the demo can print it.
// PT: Tabulada: sem recursão. table[i][w] é o melhor valor usando os i primeiros itens com
//     capacidade w. A linha i só lê a linha i - 1, então preencher as linhas de cima para baixo
//     garante que todo valor necessário já está lá. A tabela inteira é devolvida para a demo imprimir.
export function knapsackTable(items: readonly Item[], capacity: number): number[][] {
	const table: number[][] = [new Array<number>(capacity + 1).fill(0)];
	items.forEach((item, index) => {
		const previous = table[index] as number[];
		const row = new Array<number>(capacity + 1);
		for (let w = 0; w <= capacity; w++) {
			const skip = previous[w] as number;
			row[w] = item.weight <= w ? Math.max(skip, item.value + (previous[w - item.weight] as number)) : skip;
		}
		table.push(row);
	});
	return table;
}

export function knapsackTab(items: readonly Item[], capacity: number): number {
	return knapsackTable(items, capacity).at(-1)?.[capacity] ?? 0;
}
