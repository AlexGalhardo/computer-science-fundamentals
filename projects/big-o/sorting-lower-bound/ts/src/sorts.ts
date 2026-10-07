// EN: Three comparison sorts. A comparison sort learns about its input in one way only: by
//     asking "is a smaller than b?". Here that question is a function passed in from outside,
//     so the caller can count how many times it was asked, or even answer it on purpose.
// PT: Três ordenações por comparação. Uma ordenação por comparação aprende sobre a entrada de
//     um único jeito: perguntando "a é menor que b?". Aqui essa pergunta é uma função recebida
//     de fora, então quem chama pode contar quantas vezes ela foi feita, ou até respondê-la de
//     propósito.

export type Less<T> = (a: T, b: T) => boolean;
export type ComparisonSort = <T>(items: readonly T[], less: Less<T>) => T[];

// EN: Merge sort: sort each half, then merge. Each comparison of the merge places one element,
//     so merging m elements costs at most m - 1 comparisons.
// PT: Merge sort: ordena cada metade, depois intercala. Cada comparação da intercalação coloca
//     um elemento, então intercalar m elementos custa no máximo m - 1 comparações.
export const mergeSort: ComparisonSort = <T>(items: readonly T[], less: Less<T>): T[] => {
	if (items.length <= 1) {
		return [...items];
	}
	const half = items.length >> 1;
	const left = mergeSort(items.slice(0, half), less);
	const right = mergeSort(items.slice(half), less);
	const merged: T[] = [];
	let i = 0;
	let j = 0;
	while (i < left.length && j < right.length) {
		// EN: Taking from the right only when it is strictly smaller keeps equal items in
		//     their original order (a stable sort).
		// PT: Pegar da direita só quando ela é estritamente menor mantém itens iguais na
		//     ordem original (ordenação estável).
		if (less(right[j] as T, left[i] as T)) {
			merged.push(right[j] as T);
			j++;
		} else {
			merged.push(left[i] as T);
			i++;
		}
	}
	return [...merged, ...left.slice(i), ...right.slice(j)];
};

// EN: Heapsort: build a max-heap, then repeatedly move the largest item to the end. Sifting an
//     item down costs two comparisons per level: one to pick the larger child, one to compare
//     it with the parent. That is why heapsort makes about twice the comparisons of merge sort.
// PT: Heapsort: constrói um heap de máximo, depois move repetidamente o maior item para o fim.
//     Descer um item custa duas comparações por nível: uma para escolher o filho maior, outra
//     para compará-lo com o pai. Por isso o heapsort faz cerca do dobro das comparações do
//     merge sort.
export const heapSort: ComparisonSort = <T>(items: readonly T[], less: Less<T>): T[] => {
	const heap = [...items];
	const siftDown = (start: number, end: number): void => {
		let parent = start;
		for (;;) {
			let child = 2 * parent + 1;
			if (child >= end) {
				return;
			}
			if (child + 1 < end && less(heap[child] as T, heap[child + 1] as T)) {
				child++;
			}
			if (!less(heap[parent] as T, heap[child] as T)) {
				return;
			}
			[heap[parent], heap[child]] = [heap[child] as T, heap[parent] as T];
			parent = child;
		}
	};
	for (let start = (heap.length >> 1) - 1; start >= 0; start--) {
		siftDown(start, heap.length);
	}
	for (let end = heap.length - 1; end > 0; end--) {
		[heap[0], heap[end]] = [heap[end] as T, heap[0] as T];
		siftDown(0, end);
	}
	return heap;
};

// EN: Quicksort with the first item as pivot: every other item is compared with the pivot once
//     and goes to one side. A balanced split gives about n log n comparisons, and a pivot that
//     is always the smallest gives n(n-1)/2.
// PT: Quicksort com o primeiro item como pivô: cada outro item é comparado com o pivô uma vez e
//     vai para um lado. Uma divisão equilibrada dá cerca de n log n comparações, e um pivô que
//     é sempre o menor dá n(n-1)/2.
export const quickSort: ComparisonSort = <T>(items: readonly T[], less: Less<T>): T[] => {
	if (items.length <= 1) {
		return [...items];
	}
	const [pivot, ...rest] = items as [T, ...T[]];
	const smaller: T[] = [];
	const others: T[] = [];
	for (const item of rest) {
		(less(item, pivot) ? smaller : others).push(item);
	}
	return [...quickSort(smaller, less), pivot, ...quickSort(others, less)];
};

export const COMPARISON_SORTS: { name: string; sort: ComparisonSort }[] = [
	{ name: "merge sort", sort: mergeSort },
	{ name: "heapsort", sort: heapSort },
	{ name: "quicksort", sort: quickSort },
];

// EN: Sorts numbers and reports how many comparisons the algorithm asked for.
// PT: Ordena números e informa quantas comparações o algoritmo pediu.
export function countComparisons(
	sort: ComparisonSort,
	values: readonly number[],
): { sorted: number[]; comparisons: number } {
	let comparisons = 0;
	const sorted = sort(values, (a, b) => {
		comparisons++;
		return a < b;
	});
	return { sorted, comparisons };
}
