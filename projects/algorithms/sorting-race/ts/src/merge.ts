// EN: Merge sort, top-down. Split the range in half, sort each half, then merge the two sorted
//     halves. The split is by position, never by value, so the recursion tree always has about
//     log2(n) levels and each level merges n values: O(n log n) for any input order. The price
//     is the auxiliary buffer of n values. One buffer is allocated once and reused by every
//     merge, instead of allocating a new array per call.
// PT: Merge sort, de cima para baixo. Divide o trecho ao meio, ordena cada metade e intercala as
//     duas metades ordenadas. A divisão é pela posição, nunca pelo valor, então a árvore de
//     recursão tem sempre cerca de log2(n) níveis e cada nível intercala n valores: O(n log n)
//     para qualquer ordem de entrada. O preço é o buffer auxiliar de n valores. Um único buffer
//     é alocado uma vez e reaproveitado por todas as intercalações, em vez de um vetor por chamada.
export function mergeSort(input: readonly number[]): number[] {
	const a = [...input];
	const buffer = new Array<number>(a.length);
	sortRange(a, buffer, 0, a.length);
	return a;
}

function sortRange(a: number[], buffer: number[], lo: number, hi: number): void {
	if (hi - lo < 2) {
		return;
	}
	const mid = lo + ((hi - lo) >> 1);
	sortRange(a, buffer, lo, mid);
	sortRange(a, buffer, mid, hi);
	merge(a, buffer, lo, mid, hi);
}

// EN: The smallest value left is always the head of one of the two halves. On a tie the left
//     half wins (`<=`), because its values came first in the input: that is what keeps the
//     sort stable.
// PT: O menor valor restante é sempre a cabeça de uma das duas metades. No empate vence a
//     metade esquerda (`<=`), porque os valores dela vinham antes na entrada: é isso que mantém
//     a ordenação estável.
function merge(a: number[], buffer: number[], lo: number, mid: number, hi: number): void {
	let i = lo;
	let j = mid;
	let k = lo;
	while (i < mid && j < hi) {
		const left = a[i] as number;
		const right = a[j] as number;
		if (left <= right) {
			buffer[k++] = left;
			i++;
		} else {
			buffer[k++] = right;
			j++;
		}
	}
	while (i < mid) {
		buffer[k++] = a[i++] as number;
	}
	while (j < hi) {
		buffer[k++] = a[j++] as number;
	}
	for (let p = lo; p < hi; p++) {
		a[p] = buffer[p] as number;
	}
}
