// EN: A sales report built by composing small pure functions. Each step takes a value and
//     returns a new one, so the steps can be tested alone and read top to bottom.
// PT: Um relatório de vendas montado pela composição de pequenas funções puras. Cada etapa
//     recebe um valor e devolve um novo, então as etapas podem ser testadas sozinhas e lidas
//     de cima para baixo.
// ES: Un reporte de ventas armado componiendo pequeñas funciones puras. Cada paso
//     recibe un valor y devuelve uno nuevo, así que los pasos se pueden probar solos y leer
//     de arriba hacia abajo.

export type Line = { readonly category: string; readonly unitCents: number; readonly quantity: number };
export type SalesOrder = { readonly status: string; readonly lines: readonly Line[] };
export type CategoryTotal = { readonly category: string; readonly totalCents: number };

// EN: `pipe(f, g, h)(x)` is `h(g(f(x)))`: the functions run in the order they are written.
//     The overloads tell the compiler that the output type of one step must be the input
//     type of the next. The implementation is a reduction over the list of functions.
// PT: `pipe(f, g, h)(x)` é `h(g(f(x)))`: as funções rodam na ordem em que são escritas. As
//     sobrecargas dizem ao compilador que o tipo de saída de uma etapa precisa ser o tipo de
//     entrada da seguinte. A implementação é uma redução sobre a lista de funções.
// ES: `pipe(f, g, h)(x)` es `h(g(f(x)))`: las funciones corren en el orden en que se escriben.
//     Las sobrecargas le dicen al compilador que el tipo de salida de un paso debe ser el tipo
//     de entrada del siguiente. La implementación es una reducción sobre la lista de funciones.
export function pipe<A, B>(f1: (a: A) => B): (a: A) => B;
export function pipe<A, B, C>(f1: (a: A) => B, f2: (b: B) => C): (a: A) => C;
export function pipe<A, B, C, D>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): (a: A) => D;
export function pipe<A, B, C, D, E>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E): (a: A) => E;
export function pipe<A, B, C, D, E, F>(
	f1: (a: A) => B,
	f2: (b: B) => C,
	f3: (c: C) => D,
	f4: (d: D) => E,
	f5: (e: E) => F,
): (a: A) => F;
export function pipe(...fns: Array<(value: unknown) => unknown>): (value: unknown) => unknown {
	return (value) => fns.reduce((acc, fn) => fn(acc), value);
}

// EN: Curried steps: the first call fixes a setting and returns the one-argument function
//     that fits in the pipeline.
// PT: Etapas em forma curried: a primeira chamada fixa uma configuração e devolve a função
//     de um argumento que encaixa no pipeline.
// ES: Pasos en forma curried: la primera llamada fija una configuración y devuelve la función
//     de un argumento que encaja en el pipeline.
export const onlyStatus =
	(status: string) =>
	(orders: readonly SalesOrder[]): SalesOrder[] =>
		orders.filter((order) => order.status === status);

export const take =
	(count: number) =>
	<T>(items: readonly T[]): T[] =>
		items.slice(0, count);

export function lineTotals(orders: readonly SalesOrder[]): CategoryTotal[] {
	return orders.flatMap((order) =>
		order.lines.map((line) => ({ category: line.category, totalCents: line.unitCents * line.quantity })),
	);
}

// EN: Grouping is a reduction whose accumulator is a Map from category to total. A new Map
//     is created inside the call and never escapes before the end, so the local mutation
//     cannot be observed and the function is still pure.
// PT: Agrupar é uma redução cujo acumulador é um Map de categoria para total. Um Map novo é
//     criado dentro da chamada e não escapa antes do fim, então a mutação local não pode ser
//     observada e a função continua pura.
// ES: Agrupar es una reducción cuyo acumulador es un Map de categoría a total. Un Map nuevo se
//     crea dentro de la llamada y no escapa antes del final, así que la mutación local no puede
//     observarse y la función sigue siendo pura.
export function totalsByCategory(lines: readonly CategoryTotal[]): CategoryTotal[] {
	const totals = lines.reduce(
		(acc, line) => acc.set(line.category, (acc.get(line.category) ?? 0) + line.totalCents),
		new Map<string, number>(),
	);
	return [...totals].map(([category, totalCents]) => ({ category, totalCents }));
}

// EN: Largest total first; equal totals are ordered by category name so the result does not
//     depend on the order of the input. `toSorted` returns a new array, unlike `sort`.
// PT: Maior total primeiro; totais iguais são ordenados pelo nome da categoria, para o
//     resultado não depender da ordem da entrada. `toSorted` devolve um array novo, ao
//     contrário de `sort`.
// ES: Primero el total mayor; los totales iguales se ordenan por el nombre de la categoría, para
//     que el resultado no dependa del orden de la entrada. `toSorted` devuelve un array nuevo,
//     al contrario de `sort`.
export function ranked(totals: readonly CategoryTotal[]): CategoryTotal[] {
	return totals.toSorted((a, b) => b.totalCents - a.totalCents || (a.category < b.category ? -1 : 1));
}

export const salesReport = (top: number): ((orders: readonly SalesOrder[]) => CategoryTotal[]) =>
	pipe(onlyStatus("paid"), lineTotals, totalsByCategory, ranked, take(top));
