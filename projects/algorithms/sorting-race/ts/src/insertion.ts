// EN: Insertion sort. Positions 0..i-1 are always sorted (the loop invariant). The next value
//     is inserted into that prefix by shifting the larger values one step to the right. The
//     inner loop stops at the first value that is not larger, so the cost is O(n + inversions):
//     linear on sorted input, quadratic on reversed input. The strict `>` keeps equal keys in
//     their original order, which makes the algorithm stable.
// PT: Insertion sort. As posições 0..i-1 estão sempre ordenadas (o invariante do laço). O
//     próximo valor é inserido nesse prefixo deslocando os valores maiores uma posição para a
//     direita. O laço interno para no primeiro valor que não é maior, então o custo é
//     O(n + inversões): linear na entrada ordenada, quadrático na invertida. O `>` estrito
//     mantém chaves iguais na ordem original, o que torna o algoritmo estável.
export function insertionSort(input: readonly number[]): number[] {
	const a = [...input];
	for (let i = 1; i < a.length; i++) {
		const key = a[i] as number;
		let j = i - 1;
		while (j >= 0 && (a[j] as number) > key) {
			a[j + 1] = a[j] as number;
			j--;
		}
		a[j + 1] = key;
	}
	return a;
}
