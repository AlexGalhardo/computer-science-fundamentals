// EN: Six small algorithms, one per growth class. Each one does real work and counts its own
//     "basic operation": the step that is repeated the most. Counting operations instead of
//     seconds gives a number that does not depend on the machine, and that number can be checked
//     against a closed formula.
// PT: Seis algoritmos pequenos, um por classe de crescimento. Cada um faz trabalho de verdade e
//     conta sua própria "operação básica": o passo que mais se repete. Contar operações em vez
//     de segundos dá um número que não depende da máquina, e esse número pode ser conferido
//     com uma fórmula fechada.

export type ComplexityClass = "constant" | "logarithmic" | "linear" | "linearithmic" | "quadratic" | "exponential";

export interface Run {
	/** What the algorithm computed, so the tests can check that it really works. */
	result: number;
	/** How many times the basic operation ran. */
	operations: number;
}

export interface Sample {
	id: ComplexityClass;
	/** What the algorithm does, in a few words. */
	title: string;
	/** The operation being counted. */
	operation: string;
	/** Closed formula of the operation count, as text. */
	formulaText: string;
	/** Input sizes. Every size is twice the previous one. */
	sizes: number[];
	/** Builds the input. It is not part of the measured work. */
	prepare(n: number): number[];
	/** Runs the algorithm and returns its answer and how many basic operations it performed. */
	run(input: number[]): Run;
	/** Closed formula of the operation count. */
	formula(n: number): number;
}

// EN: Sizes double on every run. Doubling is the classic experiment: a linear cost doubles, a
//     quadratic cost is multiplied by 4, a logarithmic cost grows by a constant, and an
//     exponential cost is squared.
// PT: Os tamanhos dobram a cada execução. Dobrar é o experimento clássico: um custo linear
//     dobra, um quadrático é multiplicado por 4, um logarítmico cresce uma constante, e um
//     exponencial é elevado ao quadrado.
export function doublingSizes(start: number, count: number): number[] {
	return Array.from({ length: count }, (_, index) => start * 2 ** index);
}

function ascending(n: number): number[] {
	return Array.from({ length: n }, (_, index) => index);
}

// EN: A tiny deterministic generator (linear congruential), so every run sees the same "random"
//     data and the results are reproducible.
// PT: Um gerador determinístico mínimo (congruencial linear), para que toda execução veja os
//     mesmos dados "aleatórios" e os resultados sejam reproduzíveis.
export function pseudoRandom(n: number, seed = 42): number[] {
	let state = seed;
	return Array.from({ length: n }, () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state % 1000;
	});
}

// EN: O(1). Reading a position of an array is one address calculation, whatever the array size.
// PT: O(1). Ler uma posição de um vetor é um cálculo de endereço, qualquer que seja o tamanho.
function readMiddle(input: number[]): Run {
	let operations = 0;
	const result = input[input.length >> 1] ?? -1;
	operations++;
	return { result, operations };
}

// EN: O(log n). Binary search for a value larger than every element, which is the worst case:
//     the interval is halved until it is empty. A size of n takes floor(log2 n) + 1 halvings.
// PT: O(log n). Busca binária por um valor maior que todos os elementos, que é o pior caso: o
//     intervalo é cortado ao meio até ficar vazio. Um tamanho n exige floor(log2 n) + 1 cortes.
function binarySearchMiss(input: number[]): Run {
	const target = input.length;
	let operations = 0;
	let found = -1;
	let low = 0;
	let high = input.length - 1;
	while (low <= high && found < 0) {
		operations++;
		const middle = (low + high) >> 1;
		const value = input[middle] ?? 0;
		if (value === target) {
			found = middle;
		} else if (value < target) {
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}
	return { result: found, operations };
}

// EN: O(n). Adding every element touches each one exactly once.
// PT: O(n). Somar todos os elementos toca cada um exatamente uma vez.
function sumAll(input: number[]): Run {
	let operations = 0;
	let total = 0;
	for (const value of input) {
		total += value;
		operations++;
	}
	return { result: total, operations };
}

// EN: O(n log n). Merge sort. The counted operation is one element written during a merge.
//     Each level of the recursion writes all n elements, and there are log2 n levels.
//     The result is 1 when the output really is in order, so a test can prove the sort works.
// PT: O(n log n). Merge sort. A operação contada é um elemento escrito durante a intercalação.
//     Cada nível da recursão escreve os n elementos, e existem log2 n níveis.
//     O resultado é 1 quando a saída está mesmo em ordem, para um teste provar que a ordenação funciona.
function mergeSortMoves(input: number[]): Run {
	let operations = 0;
	const sort = (items: number[]): number[] => {
		if (items.length <= 1) {
			return items;
		}
		const half = items.length >> 1;
		const left = sort(items.slice(0, half));
		const right = sort(items.slice(half));
		const merged: number[] = [];
		let i = 0;
		let j = 0;
		while (i < left.length || j < right.length) {
			const a = left[i];
			const b = right[j];
			if (b === undefined || (a !== undefined && a <= b)) {
				merged.push(a ?? 0);
				i++;
			} else {
				merged.push(b);
				j++;
			}
			operations++;
		}
		return merged;
	};
	const sorted = sort(input);
	const inOrder = sorted.every((value, index) => index === 0 || (sorted[index - 1] ?? 0) <= value);
	return { result: inOrder && sorted.length === input.length ? 1 : 0, operations };
}

// EN: O(n^2). Counting inversions by comparing every pair of positions once. The inner loop
//     starts after i, so the count is n(n-1)/2: half of n^2, and still quadratic.
// PT: O(n^2). Conta inversões comparando cada par de posições uma vez. O laço interno começa
//     depois de i, então a contagem é n(n-1)/2: metade de n^2, e ainda assim quadrática.
function countInversions(input: number[]): Run {
	let operations = 0;
	let inversions = 0;
	for (let i = 0; i < input.length; i++) {
		for (let j = i + 1; j < input.length; j++) {
			operations++;
			if ((input[i] ?? 0) > (input[j] ?? 0)) {
				inversions++;
			}
		}
	}
	return { result: inversions, operations };
}

// EN: O(2^n). Brute force over every subset, looking for the largest sum. Each element is either
//     left out or taken, so the recursion branches in two at each of the n levels and reaches
//     2^n complete subsets.
// PT: O(2^n). Força bruta sobre todos os subconjuntos, procurando a maior soma. Cada elemento
//     fica de fora ou entra, então a recursão se divide em dois em cada um dos n níveis e chega
//     a 2^n subconjuntos completos.
function enumerateSubsets(input: number[]): Run {
	let operations = 0;
	let best = 0;
	const visit = (index: number, sum: number): void => {
		if (index === input.length) {
			operations++;
			best = Math.max(best, sum);
			return;
		}
		visit(index + 1, sum);
		visit(index + 1, sum + (input[index] ?? 0));
	};
	visit(0, 0);
	return { result: best, operations };
}

export const SAMPLES: Sample[] = [
	{
		id: "constant",
		title: "read the middle element of an array",
		operation: "array reads",
		formulaText: "1",
		sizes: doublingSizes(16, 12),
		prepare: ascending,
		run: readMiddle,
		formula: () => 1,
	},
	{
		id: "logarithmic",
		title: "binary search for a missing value",
		operation: "halvings of the interval",
		formulaText: "floor(log2 n) + 1",
		sizes: doublingSizes(16, 12),
		prepare: ascending,
		run: binarySearchMiss,
		formula: (n) => Math.floor(Math.log2(n)) + 1,
	},
	{
		id: "linear",
		title: "sum of all elements",
		operation: "additions",
		formulaText: "n",
		sizes: doublingSizes(16, 12),
		prepare: ascending,
		run: sumAll,
		formula: (n) => n,
	},
	{
		id: "linearithmic",
		title: "merge sort",
		operation: "elements written while merging",
		// EN: For any n the recurrence T(n) = T(floor(n/2)) + T(ceil(n/2)) + n, T(1) = 0 solves
		//     to this expression. When n is a power of two it is exactly n * log2 n.
		// PT: Para qualquer n, a recorrência T(n) = T(floor(n/2)) + T(ceil(n/2)) + n, T(1) = 0
		//     tem esta solução. Quando n é potência de dois ela vale exatamente n * log2 n.
		formulaText: "n * ceil(log2 n) - 2^ceil(log2 n) + n",
		sizes: doublingSizes(16, 12),
		prepare: (n) => pseudoRandom(n),
		run: mergeSortMoves,
		formula: (n) => {
			const levels = Math.ceil(Math.log2(n));
			return n * levels - 2 ** levels + n;
		},
	},
	{
		id: "quadratic",
		title: "count inversions comparing every pair",
		operation: "comparisons",
		formulaText: "n * (n - 1) / 2",
		sizes: doublingSizes(16, 9),
		prepare: (n) => pseudoRandom(n),
		run: countInversions,
		formula: (n) => (n * (n - 1)) / 2,
	},
	{
		id: "exponential",
		title: "enumerate every subset",
		operation: "subsets visited",
		formulaText: "2^n",
		// EN: An exponential cost is squared when n doubles, so the sizes must stay tiny:
		//     n = 32 would already mean more than four billion subsets.
		// PT: Um custo exponencial é elevado ao quadrado quando n dobra, então os tamanhos
		//     precisam ser minúsculos: n = 32 já significaria mais de quatro bilhões de subconjuntos.
		sizes: doublingSizes(1, 5),
		prepare: (n) => pseudoRandom(n),
		run: enumerateSubsets,
		formula: (n) => 2 ** n,
	},
];
