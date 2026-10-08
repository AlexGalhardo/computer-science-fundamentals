// EN: A tiny seeded random generator (mulberry32), written by hand so that the TypeScript and the
//     Python implementations draw exactly the same numbers. The built-in generators of the two
//     languages use different algorithms, so `Math.random()` and `random.random()` can never
//     agree. With a fixed seed and the same arithmetic, the random planes of the index are
//     identical in both languages, and so are the buckets.
// PT: Um gerador aleatório pequeno e com semente (mulberry32), escrito à mão para que as
//     implementações em TypeScript e em Python sorteiem exatamente os mesmos números. Os geradores
//     embutidos das duas linguagens usam algoritmos diferentes, então `Math.random()` e
//     `random.random()` nunca coincidem. Com semente fixa e a mesma aritmética, os planos
//     aleatórios do índice são idênticos nas duas linguagens, e os baldes também.

export type Rng = () => number;

/** Returns a function that yields numbers in [0, 1), always the same sequence for the same seed. */
export function mulberry32(seed: number): Rng {
	let state = seed >>> 0;
	return (): number => {
		// EN: Everything here is 32-bit integer arithmetic: `Math.imul` multiplies and keeps the low
		//     32 bits, `>>>` shifts without sign. Integer arithmetic has no rounding, which is why
		//     the sequence can be reproduced bit for bit in another language.
		// PT: Tudo aqui é aritmética inteira de 32 bits: `Math.imul` multiplica e guarda os 32 bits
		//     baixos, `>>>` desloca sem sinal. Aritmética inteira não arredonda, e por isso a
		//     sequência pode ser reproduzida bit a bit em outra linguagem.
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A random integer in [0, n). */
export function randomInt(rng: Rng, n: number): number {
	return Math.floor(rng() * n);
}

/** One item of the list, every item with the same chance. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
	const item = items[randomInt(rng, items.length)];
	if (item === undefined) throw new Error("pick: empty list");
	return item;
}

// EN: A random plane needs coordinates spread like a bell curve around zero. The usual recipe
//     (Box-Muller) calls log and cos, whose last digit may differ between languages. Adding four
//     uniform numbers and subtracting 2 gives a bell-like shape using only additions, which are
//     exact in the same order everywhere.
// PT: Um plano aleatório precisa de coordenadas espalhadas como uma curva em sino ao redor de
//     zero. A receita usual (Box-Muller) chama log e cos, cujo último dígito pode diferir entre
//     linguagens. Somar quatro números uniformes e subtrair 2 dá uma forma parecida com o sino
//     usando só somas, que são exatas na mesma ordem em qualquer lugar.
export function bellRandom(rng: Rng): number {
	return rng() + rng() + rng() + rng() - 2;
}
