// EN: Heapsort. The array itself stores a max-heap: the children of index i are 2i+1 and 2i+2,
//     and every parent is >= its children, so the maximum is at index 0. Phase 1 builds the heap
//     bottom-up in O(n). Phase 2 repeats n-1 times: swap the maximum with the last value of the
//     heap, shrink the heap by one, and sift the new root down. O(n log n) for any input and no
//     extra memory, at the price of jumping around the array (poor cache use) and of not being stable.
// PT: Heapsort. O próprio vetor guarda um max-heap: os filhos do índice i são 2i+1 e 2i+2, e
//     todo pai é >= seus filhos, então o máximo fica no índice 0. A fase 1 constrói o heap de
//     baixo para cima em O(n). A fase 2 repete n-1 vezes: troca o máximo com o último valor do
//     heap, encolhe o heap em um e desce a nova raiz. O(n log n) para qualquer entrada e sem
//     memória extra, ao preço de saltar pelo vetor (pouco uso de cache) e de não ser estável.
export function heapSort(input: readonly number[]): number[] {
	const a = [...input];
	const n = a.length;
	for (let i = (n >> 1) - 1; i >= 0; i--) {
		siftDown(a, i, n);
	}
	for (let end = n - 1; end > 0; end--) {
		const max = a[0] as number;
		a[0] = a[end] as number;
		a[end] = max;
		siftDown(a, 0, end);
	}
	return a;
}

// EN: Sift-down: while the value is smaller than its larger child, move that child up and go
//     down one level. The path is at most the height of the heap, log2(n).
// PT: Descida: enquanto o valor for menor que o maior filho, sobe esse filho e desce um nível.
//     O caminho tem no máximo a altura do heap, log2(n).
function siftDown(a: number[], start: number, size: number): void {
	const value = a[start] as number;
	let i = start;
	while (true) {
		let child = 2 * i + 1;
		if (child >= size) {
			break;
		}
		if (child + 1 < size && (a[child + 1] as number) > (a[child] as number)) {
			child++;
		}
		if ((a[child] as number) <= value) {
			break;
		}
		a[i] = a[child] as number;
		i = child;
	}
	a[i] = value;
}
