// EN: Bubble sort. Each pass compares neighbours and swaps the pairs that are out of order, so
//     the largest value still unplaced "bubbles" to the end. The `swapped` flag stops the work
//     as soon as a pass makes no swap, which makes sorted input cost one pass, O(n). Random and
//     reversed input still cost O(n²): one swap for every inversion.
// PT: Bubble sort. Cada passada compara vizinhos e troca os pares fora de ordem, então o maior
//     valor ainda não posicionado "borbulha" até o fim. A flag `swapped` encerra o trabalho
//     assim que uma passada não faz trocas, o que faz a entrada ordenada custar uma passada,
//     O(n). Entrada aleatória e invertida continuam custando O(n²): uma troca por inversão.
export function bubbleSort(input: readonly number[]): number[] {
	const a = [...input];
	for (let end = a.length - 1; end > 0; end--) {
		let swapped = false;
		for (let i = 0; i < end; i++) {
			const left = a[i] as number;
			const right = a[i + 1] as number;
			if (left > right) {
				a[i] = right;
				a[i + 1] = left;
				swapped = true;
			}
		}
		if (!swapped) {
			break;
		}
	}
	return a;
}
