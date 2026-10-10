// EN: Two sorts that never ask "is a smaller than b?". They use the key itself as a position in
//     an array. Since they make no comparisons, the decision tree argument does not describe
//     them, and the n log n lower bound does not apply. The price: they only work for keys that
//     are small non-negative integers (or can be cut into digits).
// PT: Duas ordenações que nunca perguntam "a é menor que b?". Elas usam a própria chave como
//     posição em um vetor. Como não fazem comparações, o argumento da árvore de decisão não as
//     descreve, e o limite inferior n log n não se aplica. O preço: só funcionam para chaves
//     que são inteiros pequenos e não negativos (ou que podem ser cortadas em dígitos).
// ES: Dos ordenaciones que nunca preguntan "¿a es menor que b?". Usan la propia clave como
//     posición en un arreglo. Como no hacen comparaciones, el argumento del árbol de decisión no
//     las describe, y la cota inferior n log n no se aplica. El precio: solo funcionan con claves
//     que son enteros pequeños y no negativos (o que se pueden cortar en dígitos).

function assertKeys(values: readonly number[], limit: number): void {
	for (const value of values) {
		if (!Number.isInteger(value) || value < 0 || value >= limit) {
			throw new RangeError(`key ${value} is not an integer in [0, ${limit})`);
		}
	}
}

// EN: A stable counting sort by an integer key in [0, buckets). Three passes: count how many
//     items have each key, turn the counts into the first position of each key, then place every
//     item. The cost is n + buckets, with no comparison between two items.
// PT: Um counting sort estável por uma chave inteira em [0, buckets). Três passagens: contar
//     quantos itens têm cada chave, transformar as contagens na primeira posição de cada chave,
//     depois colocar cada item. O custo é n + buckets, sem comparar dois itens.
// ES: Un counting sort estable por una clave entera en [0, buckets). Tres pasadas: contar
//     cuántos elementos tienen cada clave, convertir los conteos en la primera posición de cada
//     clave, luego colocar cada elemento. El costo es n + buckets, sin comparar dos elementos.
function sortByKey(values: readonly number[], buckets: number, keyOf: (value: number) => number): number[] {
	const positions = new Array<number>(buckets + 1).fill(0);
	for (const value of values) {
		const slot = keyOf(value) + 1;
		positions[slot] = (positions[slot] ?? 0) + 1;
	}
	for (let key = 1; key <= buckets; key++) {
		positions[key] = (positions[key] ?? 0) + (positions[key - 1] ?? 0);
	}
	const sorted = new Array<number>(values.length);
	for (const value of values) {
		const key = keyOf(value);
		const position = positions[key] ?? 0;
		sorted[position] = value;
		positions[key] = position + 1;
	}
	return sorted;
}

// EN: Counting sort for integers in [0, limit): Theta(n + limit) time and memory. It is linear
//     when limit is O(n), and a bad idea when the range is much larger than the data.
// PT: Counting sort para inteiros em [0, limit): tempo e memória Theta(n + limit). É linear
//     quando limit é O(n), e uma má ideia quando o intervalo é muito maior que os dados.
// ES: Counting sort para enteros en [0, limit): tiempo y memoria Theta(n + limit). Es lineal
//     cuando limit es O(n), y una mala idea cuando el rango es mucho mayor que los datos.
export function countingSort(values: readonly number[], limit: number): number[] {
	assertKeys(values, limit);
	return sortByKey(values, limit, (value) => value);
}

// EN: Radix sort (least significant digit first): one stable counting sort per digit. After
//     pass i the items are ordered by their last i digits, and stability is what keeps the work
//     of the earlier passes. Cost: Theta(d * (n + base)) for keys of d digits.
// PT: Radix sort (dígito menos significativo primeiro): um counting sort estável por dígito.
//     Depois da passagem i os itens estão ordenados pelos últimos i dígitos, e a estabilidade é
//     o que preserva o trabalho das passagens anteriores. Custo: Theta(d * (n + base)) para
//     chaves de d dígitos.
// ES: Radix sort (dígito menos significativo primero): un counting sort estable por dígito.
//     Después de la pasada i los elementos quedan ordenados por sus últimos i dígitos, y la
//     estabilidad es lo que conserva el trabajo de las pasadas anteriores. Costo:
//     Theta(d * (n + base)) para claves de d dígitos.
export function radixSort(values: readonly number[], base = 10): number[] {
	assertKeys(values, Number.MAX_SAFE_INTEGER);
	let sorted = [...values];
	let largest = 0;
	for (const value of values) {
		largest = Math.max(largest, value);
	}
	for (let divisor = 1; Math.floor(largest / divisor) > 0; divisor *= base) {
		sorted = sortByKey(sorted, base, (value) => Math.floor(value / divisor) % base);
	}
	return sorted;
}
