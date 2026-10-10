// EN: The experiments: the bound itself, an exhaustive check on every permutation of small
//     inputs, and comparison counters on many large random inputs.
// PT: Os experimentos: o limite em si, uma conferência exaustiva em todas as permutações de
//     entradas pequenas, e contadores de comparações em muitas entradas aleatórias grandes.
// ES: Los experimentos: la cota en sí, una comprobación exhaustiva en todas las permutaciones de
//     entradas pequeñas, y contadores de comparaciones en muchas entradas aleatorias grandes.

import { permutations } from "./decision-tree";
import { countingSort, radixSort } from "./linear-sorts";
import { COMPARISON_SORTS, countComparisons } from "./sorts";

// EN: log2(n!) = log2(1) + log2(2) + ... + log2(n). Adding logarithms avoids computing n!,
//     which overflows a double near n = 171. This sum grows like n log2 n.
// PT: log2(n!) = log2(1) + log2(2) + ... + log2(n). Somar logaritmos evita calcular n!, que
//     estoura um double perto de n = 171. Essa soma cresce como n log2 n.
// ES: log2(n!) = log2(1) + log2(2) + ... + log2(n). Sumar logaritmos evita calcular n!, que
//     desborda un double cerca de n = 171. Esta suma crece como n log2 n.
export function log2Factorial(n: number): number {
	let total = 0;
	for (let value = 2; value <= n; value++) {
		total += Math.log2(value);
	}
	return total;
}

// EN: A tree with n! leaves has height at least log2(n!), and a height is a whole number, so
//     the exact bound is the ceiling: 3 comparisons for n = 3, 5 for n = 4, 7 for n = 5.
//     The guard protects the ceiling from a floating-point sum that lands a hair above an
//     integer (n! is an exact power of two only for n = 1 and n = 2).
// PT: Uma árvore com n! folhas tem altura de pelo menos log2(n!), e uma altura é um número
//     inteiro, então o limite exato é o teto: 3 comparações para n = 3, 5 para n = 4, 7 para
//     n = 5. A guarda protege o teto de uma soma em ponto flutuante que caia um fio acima de um
//     inteiro (n! só é potência de dois exata para n = 1 e n = 2).
// ES: Un árbol con n! hojas tiene altura de al menos log2(n!), y una altura es un número
//     entero, así que la cota exacta es el techo: 3 comparaciones para n = 3, 5 para n = 4, 7
//     para n = 5. La guarda protege el techo de una suma en punto flotante que caiga un pelo
//     por encima de un entero (n! solo es una potencia de dos exacta para n = 1 y n = 2).
export function minimumComparisons(n: number): number {
	const exact = log2Factorial(n);
	const nearest = Math.round(exact);
	return Math.abs(exact - nearest) < 1e-9 ? nearest : Math.ceil(exact);
}

// EN: A small seeded generator (mulberry32). The same seed gives the same inputs on every
//     machine, so the committed tables can be reproduced exactly.
// PT: Um gerador pequeno com semente (mulberry32). A mesma semente dá as mesmas entradas em
//     qualquer máquina, então as tabelas versionadas podem ser reproduzidas exatamente.
// ES: Un generador pequeño con semilla (mulberry32). La misma semilla da las mismas entradas en
//     cualquier máquina, así que las tablas versionadas se pueden reproducir exactamente.
export function createRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let mixed = state;
		mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
		mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
		return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
	};
}

// EN: Fisher-Yates shuffle: every one of the n! orders of 0..n-1 is equally likely.
// PT: Embaralhamento de Fisher-Yates: cada uma das n! ordens de 0..n-1 é igualmente provável.
// ES: Barajado de Fisher-Yates: cada uno de los n! órdenes de 0..n-1 es igualmente probable.
export function randomPermutation(n: number, random: () => number): number[] {
	const values = Array.from({ length: n }, (_, index) => index);
	for (let last = n - 1; last > 0; last--) {
		const pick = Math.floor(random() * (last + 1));
		[values[last], values[pick]] = [values[pick] as number, values[last] as number];
	}
	return values;
}

function isAscending(values: readonly number[]): boolean {
	return values.every((value, index) => value === index);
}

export interface ExhaustiveRow {
	algorithm: string;
	n: number;
	/** Largest count over all n! input orders: the worst case. */
	worst: number;
	/** Mean count over all n! input orders: the average case. */
	average: number;
	/** Smallest count over all n! input orders: the best case. */
	best: number;
}

// EN: For a small n every input order can be tried. This is where the theorem can be checked
//     to the letter: the worst case is at least ceil(log2 n!) and the average is at least
//     log2 n!. The best case is free to be smaller.
// PT: Para um n pequeno dá para testar todas as ordens de entrada. É aqui que o teorema pode
//     ser conferido ao pé da letra: o pior caso é pelo menos ceil(log2 n!) e a média é pelo
//     menos log2 n!. O melhor caso está livre para ser menor.
// ES: Para un n pequeño se pueden probar todos los órdenes de entrada. Aquí es donde el teorema
//     se puede comprobar al pie de la letra: el peor caso es al menos ceil(log2 n!) y el promedio
//     es al menos log2 n!. El mejor caso es libre de ser menor.
export function exhaustive(n: number): ExhaustiveRow[] {
	const inputs = permutations(n);
	return COMPARISON_SORTS.map(({ name, sort }) => {
		const counts = inputs.map((input) => {
			const { sorted, comparisons } = countComparisons(sort, input);
			if (!isAscending(sorted)) {
				throw new Error(`${name} did not sort ${input.join(",")}`);
			}
			return comparisons;
		});
		return {
			algorithm: name,
			n,
			worst: Math.max(...counts),
			average: counts.reduce((total, count) => total + count, 0) / counts.length,
			best: Math.min(...counts),
		};
	});
}

export interface RandomRow {
	algorithm: string;
	/** Comparisons between two elements. Zero for the sorts that index by key. */
	minimum: number;
	mean: number;
	maximum: number;
	/** How many of the inputs came out sorted. */
	sortedInputs: number;
}

export interface RandomReport {
	n: number;
	inputs: number;
	seed: number;
	log2Factorial: number;
	rows: RandomRow[];
}

// EN: The same random inputs go through every algorithm. The comparison sorts report how many
//     times their comparator was called. Counting sort and radix sort have no comparator to
//     call: they index an array by the key, so their count is zero by construction, and they
//     still sort every input.
// PT: As mesmas entradas aleatórias passam por todos os algoritmos. As ordenações por comparação
//     informam quantas vezes seu comparador foi chamado. Counting sort e radix sort não têm
//     comparador para chamar: indexam um vetor pela chave, então sua contagem é zero por
//     construção, e mesmo assim ordenam todas as entradas.
// ES: Las mismas entradas aleatorias pasan por todos los algoritmos. Las ordenaciones por
//     comparación informan cuántas veces se llamó a su comparador. Counting sort y radix sort no
//     tienen comparador al que llamar: indexan un arreglo por la clave, así que su conteo es cero
//     por construcción, y aun así ordenan todas las entradas.
export function randomExperiment(n: number, inputs: number, seed: number): RandomReport {
	const random = createRandom(seed);
	const counts = new Map<string, number[]>(COMPARISON_SORTS.map(({ name }) => [name, []]));
	const sortedInputs = new Map<string, number>();
	const mark = (name: string, sorted: readonly number[]): void => {
		sortedInputs.set(name, (sortedInputs.get(name) ?? 0) + (isAscending(sorted) ? 1 : 0));
	};
	for (let run = 0; run < inputs; run++) {
		const input = randomPermutation(n, random);
		for (const { name, sort } of COMPARISON_SORTS) {
			const { sorted, comparisons } = countComparisons(sort, input);
			counts.get(name)?.push(comparisons);
			mark(name, sorted);
		}
		mark("counting sort", countingSort(input, n));
		mark("radix sort", radixSort(input));
	}
	const rows: RandomRow[] = COMPARISON_SORTS.map(({ name }) => {
		const values = counts.get(name) ?? [];
		return {
			algorithm: name,
			minimum: Math.min(...values),
			mean: values.reduce((total, value) => total + value, 0) / values.length,
			maximum: Math.max(...values),
			sortedInputs: sortedInputs.get(name) ?? 0,
		};
	});
	for (const name of ["counting sort", "radix sort"]) {
		rows.push({ algorithm: name, minimum: 0, mean: 0, maximum: 0, sortedInputs: sortedInputs.get(name) ?? 0 });
	}
	return { n, inputs, seed, log2Factorial: log2Factorial(n), rows };
}
