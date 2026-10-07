// EN: Quine-McCluskey does with a table what a Karnaugh map does with the eyes. The map stops
//     being practical at 5 or 6 variables; the tabular method follows the same two steps for any
//     number of them: (1) find every prime implicant, (2) choose the cheapest set of prime
//     implicants that covers all the minterms.
// PT: O Quine-McCluskey faz com uma tabela o que o mapa de Karnaugh faz com os olhos. O mapa
//     deixa de ser prático com 5 ou 6 variáveis; o método tabular segue os mesmos dois passos
//     para qualquer quantidade: (1) achar todos os implicantes primos, (2) escolher o conjunto
//     mais barato de implicantes primos que cobre todos os mintermos.

// EN: An implicant is a product term, that is, a group of cells of the map. `mask` marks the
//     variables that were eliminated (the dashes of the tabular method) and `value` holds the
//     value of the others. With 4 variables, value 0b0000 and mask 0b1010 mean -0-0: B'·D',
//     the four corners of the map.
// PT: Um implicante é um termo produto, isto é, um grupo de células do mapa. `mask` marca as
//     variáveis eliminadas (os traços do método tabular) e `value` guarda o valor das outras.
//     Com 4 variáveis, value 0b0000 e mask 0b1010 significam -0-0: B'·D', os quatro cantos.
export interface Implicant {
	value: number;
	mask: number;
}

export interface Minimisation {
	variableCount: number;
	primeImplicants: Implicant[];
	essentialPrimeImplicants: Implicant[];
	/** The chosen cover: the terms of the minimal sum of products. */
	cover: Implicant[];
}

const key = (implicant: Implicant): string => `${implicant.value}/${implicant.mask}`;

const isPowerOfTwo = (value: number): boolean => value !== 0 && (value & (value - 1)) === 0;

function bitCount(value: number): number {
	let count = 0;
	for (let rest = value; rest !== 0; rest &= rest - 1) {
		count += 1;
	}
	return count;
}

/** True when the implicant is 1 for the given minterm, that is, when the cell is inside the group. */
export function covers(implicant: Implicant, minterm: number): boolean {
	return (minterm & ~implicant.mask) === implicant.value;
}

/** Number of literals of the product term: the variables that were not eliminated. */
export function literalCount(implicant: Implicant, variableCount: number): number {
	return variableCount - bitCount(implicant.mask);
}

function compareImplicants(a: Implicant, b: Implicant): number {
	return a.mask - b.mask || a.value - b.value;
}

// EN: Step 1. Two terms that differ in exactly one variable merge into one term without that
//     variable: X·Y + X·Y' = X. On the map this is joining two neighbouring groups of the same
//     size. The merge is repeated until nothing merges any more. A term that never merged
//     cannot grow: it is a prime implicant.
// PT: Passo 1. Dois termos que diferem em exatamente uma variável se fundem em um termo sem
//     essa variável: X·Y + X·Y' = X. No mapa, isso é juntar dois grupos vizinhos do mesmo
//     tamanho. A fusão se repete até nada mais se fundir. Um termo que nunca se fundiu não
//     pode crescer: é um implicante primo.
export function findPrimeImplicants(terms: readonly number[]): Implicant[] {
	let current = new Map<string, Implicant>();
	for (const term of terms) {
		const implicant = { value: term, mask: 0 };
		current.set(key(implicant), implicant);
	}
	const primes: Implicant[] = [];
	while (current.size > 0) {
		const next = new Map<string, Implicant>();
		const merged = new Set<string>();
		const list = [...current.values()];
		for (let i = 0; i < list.length; i++) {
			for (let j = i + 1; j < list.length; j++) {
				const a = list[i];
				const b = list[j];
				if (a === undefined || b === undefined || a.mask !== b.mask) {
					continue;
				}
				const difference = a.value ^ b.value;
				if (isPowerOfTwo(difference)) {
					const joined = { value: a.value & ~difference, mask: a.mask | difference };
					next.set(key(joined), joined);
					merged.add(key(a));
					merged.add(key(b));
				}
			}
		}
		for (const implicant of list) {
			if (!merged.has(key(implicant))) {
				primes.push(implicant);
			}
		}
		current = next;
	}
	return primes.sort(compareImplicants);
}

// EN: Step 2. A prime implicant is essential when some minterm is covered by it and by no other
//     one, so every solution must contain it. What is left after the essential ones is solved
//     by an exact search: take the uncovered minterm with the fewest candidates, try each prime
//     implicant that covers it, and keep the cheapest complete cover (fewest terms, then
//     fewest literals). Don't-care terms take part in step 1, to enlarge the groups, but they
//     are not in the list of minterms that must be covered.
// PT: Passo 2. Um implicante primo é essencial quando algum mintermo é coberto por ele e por
//     nenhum outro, então toda solução precisa contê-lo. O que sobra depois dos essenciais é
//     resolvido por uma busca exata: pega-se o mintermo descoberto com menos candidatos,
//     tenta-se cada implicante primo que o cobre e guarda-se a cobertura completa mais barata
//     (menos termos, depois menos literais). Os termos irrelevantes (don't care) participam do
//     passo 1, para aumentar os grupos, mas não entram na lista de mintermos a cobrir.
export function minimise(
	variableCount: number,
	minterms: readonly number[],
	dontCares: readonly number[] = [],
): Minimisation {
	const limit = 2 ** variableCount;
	for (const term of [...minterms, ...dontCares]) {
		if (!Number.isInteger(term) || term < 0 || term >= limit) {
			throw new RangeError(`term ${term} does not fit in ${variableCount} variables`);
		}
	}
	const required = [...new Set(minterms)].sort((a, b) => a - b);
	const primeImplicants = findPrimeImplicants([...new Set([...required, ...dontCares])]);

	const essentialPrimeImplicants: Implicant[] = [];
	for (const minterm of required) {
		const candidates = primeImplicants.filter((prime) => covers(prime, minterm));
		const only = candidates[0];
		if (candidates.length === 1 && only !== undefined && !essentialPrimeImplicants.includes(only)) {
			essentialPrimeImplicants.push(only);
		}
	}

	// EN: One number that orders covers by term count first and by literal count second: a
	//     cover can never hold `limit * variableCount` literals or more.
	// PT: Um número que ordena as coberturas primeiro pela quantidade de termos e depois pela de
	//     literais: uma cobertura nunca chega a ter `limit * variableCount` literais.
	const cost = (cover: readonly Implicant[]): number =>
		cover.length * limit * (variableCount + 1) +
		cover.reduce((sum, item) => sum + literalCount(item, variableCount), 0);
	let best: Implicant[] | undefined;
	const search = (chosen: Implicant[], uncovered: number[]): void => {
		if (best !== undefined && cost(chosen) >= cost(best)) {
			return;
		}
		if (uncovered.length === 0) {
			best = [...chosen];
			return;
		}
		let target: number | undefined;
		let options: Implicant[] = [];
		for (const minterm of uncovered) {
			const candidates = primeImplicants.filter((prime) => covers(prime, minterm));
			if (target === undefined || candidates.length < options.length) {
				target = minterm;
				options = candidates;
			}
		}
		for (const option of options) {
			search(
				[...chosen, option],
				uncovered.filter((minterm) => !covers(option, minterm)),
			);
		}
	};
	search(
		[...essentialPrimeImplicants],
		required.filter((minterm) => !essentialPrimeImplicants.some((prime) => covers(prime, minterm))),
	);

	return {
		variableCount,
		primeImplicants,
		essentialPrimeImplicants: [...essentialPrimeImplicants].sort(compareImplicants),
		cover: (best ?? []).sort(compareImplicants),
	};
}

// EN: Writes a cover back as a sum of products in the syntax the parser reads, so the result
//     can be parsed again and compared with the original function, row by row.
// PT: Escreve uma cobertura de volta como soma de produtos na sintaxe que o parser lê, de modo
//     que o resultado possa ser analisado de novo e comparado com a função original, linha a linha.
export function toExpression(cover: readonly Implicant[], variables: readonly string[]): string {
	if (cover.length === 0) {
		return "0";
	}
	const terms = cover.map((implicant) => {
		const literals = variables.flatMap((name, index) => {
			const bit = 1 << (variables.length - 1 - index);
			if ((implicant.mask & bit) !== 0) {
				return [];
			}
			return [(implicant.value & bit) !== 0 ? name : `${name}'`];
		});
		// EN: A group that covers the whole map eliminated every variable: the function is 1.
		// PT: Um grupo que cobre o mapa inteiro eliminou todas as variáveis: a função é 1.
		return literals.length === 0 ? "1" : literals.join("·");
	});
	return terms.join(" + ");
}
