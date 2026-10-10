// EN: A property-based testing library in about 150 lines: a pure random generator, a few
//     value generators that also know how to shrink, and the `check` loop. It exists to show
//     how the technique works; a real project would use a library such as fast-check.
// PT: Uma biblioteca de testes baseados em propriedades em cerca de 150 linhas: um gerador
//     aleatório puro, alguns geradores de valores que também sabem reduzir, e o laço `check`.
//     Ela existe para mostrar como a técnica funciona; um projeto real usaria uma biblioteca
//     como a fast-check.
// ES: Una biblioteca de pruebas basadas en propiedades en unas 150 líneas: un generador
//     aleatorio puro, algunos generadores de valores que también saben reducir, y el bucle
//     `check`. Existe para mostrar cómo funciona la técnica; un proyecto real usaría una
//     biblioteca como fast-check.

// EN: The random generator is a pure function. Its whole state is one 32-bit number, the
//     seed, which goes in as an argument and comes out, updated, next to the value. Nothing
//     is hidden in a global, so the same seed always replays the same test run. The formula
//     is a linear congruential generator, and only the 16 high bits are used because the low
//     bits of this kind of generator repeat quickly.
// PT: O gerador aleatório é uma função pura. Todo o seu estado é um número de 32 bits, a
//     semente, que entra como argumento e sai, atualizada, ao lado do valor. Nada fica
//     escondido em uma global, então a mesma semente sempre repete a mesma execução do teste.
//     A fórmula é um gerador congruente linear, e só os 16 bits altos são usados porque os
//     bits baixos desse tipo de gerador se repetem rápido.
// ES: El generador aleatorio es una función pura. Todo su estado es un número de 32 bits, la
//     semilla, que entra como argumento y sale, actualizada, junto al valor. Nada queda
//     escondido en una global, así que la misma semilla siempre repite la misma ejecución de la
//     prueba. La fórmula es un generador congruencial lineal, y solo se usan los 16 bits altos
//     porque los bits bajos de este tipo de generador se repiten rápido.
export type Seed = number;

export function nextSeed(seed: Seed): Seed {
	return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export function randomInt(seed: Seed, min: number, max: number): [number, Seed] {
	const next = nextSeed(seed);
	return [min + ((next >>> 16) % (max - min + 1)), next];
}

// EN: A generator is a pair of pure functions. `generate` turns a seed into a value and the
//     next seed. `shrink` lists simpler versions of a value, the simplest first; it is what
//     turns a large random failure into a small one a person can read.
// PT: Um gerador é um par de funções puras. `generate` transforma uma semente em um valor e
//     na próxima semente. `shrink` lista versões mais simples de um valor, a mais simples
//     primeiro; é ele que transforma uma falha aleatória grande em uma pequena, que uma
//     pessoa consegue ler.
// ES: Un generador es un par de funciones puras. `generate` transforma una semilla en un valor y
//     en la siguiente semilla. `shrink` lista versiones más simples de un valor, la más simple
//     primero; es lo que convierte un fallo aleatorio grande en uno pequeño, que una
//     persona puede leer.
export interface Gen<T> {
	generate(seed: Seed): [T, Seed];
	shrink(value: T): T[];
}

// EN: Integers shrink towards zero (or towards the bound closest to zero): first the target
//     itself, then values that halve the distance, so the search takes few steps.
// PT: Inteiros são reduzidos em direção a zero (ou ao limite mais próximo de zero): primeiro
//     o próprio alvo, depois valores que cortam a distância pela metade, então a busca leva
//     poucos passos.
// ES: Los enteros se reducen hacia cero (o hacia el límite más cercano a cero): primero
//     el propio objetivo, luego valores que recortan la distancia a la mitad, así la búsqueda
//     toma pocos pasos.
export function int(min: number, max: number): Gen<number> {
	const target = Math.min(Math.max(0, min), max);
	return {
		generate: (seed) => randomInt(seed, min, max),
		shrink: (value) => {
			const candidates: number[] = [];
			for (let distance = value - target; distance !== 0; distance = Math.trunc(distance / 2)) {
				candidates.push(value - distance);
			}
			return candidates;
		},
	};
}

// EN: Picks one of a fixed list of values. An earlier position counts as simpler.
// PT: Escolhe um valor de uma lista fixa. Uma posição anterior conta como mais simples.
// ES: Elige un valor de una lista fija. Una posición anterior cuenta como más simple.
export function oneOf<T>(values: readonly T[]): Gen<T> {
	return {
		generate: (seed) => {
			const [index, next] = randomInt(seed, 0, values.length - 1);
			return [values[index] as T, next];
		},
		shrink: (value) => values.slice(0, Math.max(0, values.indexOf(value))),
	};
}

// EN: A fixed-size tuple of independent generators. It shrinks one position at a time.
// PT: Uma tupla de tamanho fixo de geradores independentes. Reduz uma posição por vez.
// ES: Una tupla de tamaño fijo de generadores independientes. Reduce una posición a la vez.
export function tuple<T extends unknown[]>(...gens: { [K in keyof T]: Gen<T[K]> }): Gen<T> {
	return {
		generate: (seed) => {
			const values: unknown[] = [];
			let current = seed;
			for (const gen of gens) {
				const [value, next] = gen.generate(current);
				values.push(value);
				current = next;
			}
			return [values as T, current];
		},
		shrink: (value) =>
			gens.flatMap((gen, index) =>
				gen.shrink(value[index]).map((smaller) => value.map((item, i) => (i === index ? smaller : item)) as T),
			),
	};
}

// EN: The candidates of a list, in order: drop the first or the second half, drop one
//     element, then make one element simpler. Shorter lists come first because a shorter
//     counterexample is the biggest gain.
// PT: Os candidatos de uma lista, em ordem: remover a primeira ou a segunda metade, remover
//     um elemento, e então simplificar um elemento. Listas mais curtas vêm antes porque um
//     contraexemplo mais curto é o maior ganho.
// ES: Los candidatos de una lista, en orden: quitar la primera o la segunda mitad, quitar
//     un elemento, y luego simplificar un elemento. Las listas más cortas van antes porque un
//     contraejemplo más corto es la mayor ganancia.
function shrinkList<T>(items: readonly T[], shrinkItem: (item: T) => T[]): T[][] {
	const half = Math.floor(items.length / 2);
	const halves = items.length > 1 ? [items.slice(half), items.slice(0, half)] : [];
	const withoutOne = items.map((_, index) => items.filter((_item, i) => i !== index));
	const simplerItem = items.flatMap((item, index) =>
		shrinkItem(item).map((smaller) => items.map((other, i) => (i === index ? smaller : other))),
	);
	return [...halves, ...withoutOne, ...simplerItem];
}

export function listOf<T>(item: Gen<T>, maxLength: number): Gen<T[]> {
	return {
		generate: (seed) => {
			const [length, afterLength] = randomInt(seed, 0, maxLength);
			const items: T[] = [];
			let current = afterLength;
			for (let i = 0; i < length; i++) {
				const [value, next] = item.generate(current);
				items.push(value);
				current = next;
			}
			return [items, current];
		},
		shrink: (items) => shrinkList(items, item.shrink),
	};
}

// EN: Builds a string out of runs of the same character, because the codec under test only
//     misbehaves on long runs and a uniformly random string almost never has one. Choosing
//     what the generator produces is part of writing a property. The string shrinks like a
//     list of characters, plus one candidate that replaces every occurrence of a character
//     by the first one of the alphabet, which keeps a run intact while making it simpler.
// PT: Monta um texto a partir de sequências do mesmo caractere, porque o codec em teste só
//     falha em sequências longas, e um texto uniformemente aleatório quase nunca tem uma.
//     Escolher o que o gerador produz faz parte de escrever uma propriedade. O texto é
//     reduzido como uma lista de caracteres, mais um candidato que troca todas as ocorrências
//     de um caractere pelo primeiro do alfabeto, o que mantém a sequência inteira e a
//     simplifica.
// ES: Arma un texto a partir de secuencias del mismo carácter, porque el codec bajo prueba solo
//     falla en secuencias largas, y un texto uniformemente aleatorio casi nunca tiene una.
//     Elegir lo que produce el generador forma parte de escribir una propiedad. El texto se
//     reduce como una lista de caracteres, más un candidato que cambia todas las apariciones
//     de un carácter por el primero del alfabeto, lo que mantiene la secuencia entera y la
//     simplifica.
export function runString(alphabet: string, maxRuns: number, maxRunLength: number): Gen<string> {
	const letters = [...alphabet];
	const simplest = letters[0] as string;
	const runs = listOf(tuple(oneOf(letters), int(1, maxRunLength)), maxRuns);
	return {
		generate: (seed) => {
			const [pairs, next] = runs.generate(seed);
			return [pairs.map(([letter, length]) => letter.repeat(length)).join(""), next];
		},
		shrink: (value) => {
			const chars = [...value];
			const shorter = shrinkList(chars, () => []).map((candidate) => candidate.join(""));
			const simpler = [...new Set(chars)]
				.filter((letter) => letter !== simplest)
				.map((letter) => value.replaceAll(letter, simplest));
			return [...shorter, ...simpler];
		},
	};
}

export type CheckResult<T> =
	| { ok: true; runs: number }
	| { ok: false; run: number; seed: Seed; original: T; shrunk: T; shrinkSteps: number };

// EN: Shrinking is a greedy search: take the first simpler candidate that still breaks the
//     property and start again from it, until no candidate fails. It only works because the
//     property is pure: running it again on a candidate cannot be affected by earlier runs.
// PT: Reduzir é uma busca gulosa: pegue o primeiro candidato mais simples que ainda quebra a
//     propriedade e recomece a partir dele, até nenhum candidato falhar. Só funciona porque a
//     propriedade é pura: executá-la de novo em um candidato não pode ser afetado pelas
//     execuções anteriores.
// ES: Reducir es una búsqueda voraz: toma el primer candidato más simple que todavía rompe la
//     propiedad y vuelve a empezar desde él, hasta que ningún candidato falle. Solo funciona
//     porque la propiedad es pura: ejecutarla de nuevo con un candidato no puede verse afectado
//     por las ejecuciones anteriores.
function shrinkFailure<T>(gen: Gen<T>, property: (value: T) => boolean, failing: T): { value: T; steps: number } {
	let value = failing;
	let steps = 0;
	for (;;) {
		const smaller = gen.shrink(value).find((candidate) => !property(candidate));
		if (smaller === undefined) {
			return { value, steps };
		}
		value = smaller;
		steps += 1;
	}
}

// EN: Generates `runs` values, one after the other from the same seed chain, and stops at
//     the first one that makes the property false. The result is plain data, so a test can
//     assert on the counterexample itself.
// PT: Gera `runs` valores, um depois do outro a partir da mesma cadeia de sementes, e para no
//     primeiro que torna a propriedade falsa. O resultado é um dado comum, então um teste
//     pode fazer asserções sobre o próprio contraexemplo.
// ES: Genera `runs` valores, uno tras otro a partir de la misma cadena de semillas, y se detiene
//     en el primero que vuelve falsa la propiedad. El resultado es un dato común, así que una
//     prueba puede hacer aserciones sobre el propio contraejemplo.
export function check<T>(
	gen: Gen<T>,
	property: (value: T) => boolean,
	options: { runs?: number; seed?: Seed } = {},
): CheckResult<T> {
	const runs = options.runs ?? 200;
	const seed = options.seed ?? 42;
	let current = seed;
	for (let run = 1; run <= runs; run++) {
		const [value, next] = gen.generate(current);
		if (!property(value)) {
			const { value: shrunk, steps } = shrinkFailure(gen, property, value);
			return { ok: false, run, seed, original: value, shrunk, shrinkSteps: steps };
		}
		current = next;
	}
	return { ok: true, runs };
}
