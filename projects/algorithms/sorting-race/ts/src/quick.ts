// EN: Quicksort. Partition the range around a pivot (smaller values to the left, larger to the
//     right) and sort each side. All the work is in the split, and there is no combine step.
//     The pivot is the median of the first, middle and last values: on sorted or reversed
//     input that is the true median, so the benchmark does not fall into the O(n²) case that a
//     first-element pivot would hit. The mini-project `hybrid-quicksort` compares pivot choices.
// PT: Quicksort. Particiona o trecho em torno de um pivô (menores à esquerda, maiores à direita)
//     e ordena cada lado. Todo o trabalho está na divisão, e não há etapa de combinação.
//     O pivô é a mediana entre o primeiro, o do meio e o último valor: em entrada ordenada ou
//     invertida essa é a mediana real, então o benchmark não cai no caso O(n²) que um pivô no
//     primeiro elemento teria. O mini-projeto `hybrid-quicksort` compara escolhas de pivô.
// ES: Quicksort. Particiona el tramo alrededor de un pivote (menores a la izquierda, mayores a la derecha)
//     y ordena cada lado. Todo el trabajo está en la división, y no hay etapa de combinación.
//     El pivote es la mediana entre el primer valor, el del medio y el último: en entrada ordenada o
//     invertida esa es la mediana real, así que el benchmark no cae en el caso O(n²) que tendría un pivote
//     en el primer elemento. El mini-proyecto `hybrid-quicksort` compara elecciones de pivote.
export function quickSort(input: readonly number[]): number[] {
	const a = [...input];
	sortRange(a, 0, a.length - 1);
	return a;
}

function medianOfThree(x: number, y: number, z: number): number {
	return Math.max(Math.min(x, y), Math.min(Math.max(x, y), z));
}

// EN: Hoare partition: two indexes walk towards each other and swap the pairs that sit on the
//     wrong side. It makes about a third of the swaps of the Lomuto scheme and splits an array
//     of equal keys in the middle. The loop recurses on the smaller side and iterates on the
//     larger one, which bounds the stack depth to O(log n) even with bad pivots.
// PT: Partição de Hoare: dois índices andam um em direção ao outro e trocam os pares que estão
//     do lado errado. Ela faz cerca de um terço das trocas do esquema de Lomuto e divide ao meio
//     um vetor de chaves iguais. O laço faz a recursão no lado menor e itera no lado maior, o
//     que limita a profundidade da pilha a O(log n) mesmo com pivôs ruins.
// ES: Partición de Hoare: dos índices avanzan uno hacia el otro e intercambian los pares que están
//     del lado equivocado. Hace cerca de un tercio de los intercambios del esquema de Lomuto y divide por la mitad
//     un arreglo de claves iguales. El bucle hace la recursión sobre el lado menor e itera sobre el mayor, lo
//     que limita la profundidad de la pila a O(log n) incluso con pivotes malos.
function sortRange(a: number[], from: number, to: number): void {
	let lo = from;
	let hi = to;
	while (lo < hi) {
		const pivot = medianOfThree(a[lo] as number, a[lo + ((hi - lo) >> 1)] as number, a[hi] as number);
		let i = lo;
		let j = hi;
		while (i <= j) {
			while ((a[i] as number) < pivot) {
				i++;
			}
			while ((a[j] as number) > pivot) {
				j--;
			}
			if (i <= j) {
				const tmp = a[i] as number;
				a[i] = a[j] as number;
				a[j] = tmp;
				i++;
				j--;
			}
		}
		if (j - lo < hi - i) {
			sortRange(a, lo, j);
			lo = i;
		} else {
			sortRange(a, i, hi);
			hi = j;
		}
	}
}
