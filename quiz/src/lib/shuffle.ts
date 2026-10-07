// EN: Shuffling with a seed. `Math.random` cannot be replayed, so a test could never prove
//     that the answer key survives a shuffle. A small seeded generator gives the same order for
//     the same seed, which makes an attempt reproducible and testable.
// PT: Embaralhamento com semente. `Math.random` não pode ser repetido, então um teste nunca
//     conseguiria provar que o gabarito sobrevive ao embaralhamento. Um pequeno gerador com
//     semente dá a mesma ordem para a mesma semente, o que torna a tentativa reproduzível e testável.

export type Random = () => number;

// EN: mulberry32, a tiny 32-bit generator. Good enough to shuffle quiz questions, and never
//     to be used for anything related to security.
// PT: mulberry32, um gerador minúsculo de 32 bits. Bom o bastante para embaralhar questões,
//     e nunca deve ser usado para nada ligado a segurança.
export function createRandom(seed: number): Random {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

// EN: Fisher-Yates: walk from the end, and swap each position with a random one at or before
//     it. Every permutation is equally likely, and the input list is not modified.
// PT: Fisher-Yates: percorre do fim para o início e troca cada posição com uma aleatória igual
//     ou anterior a ela. Toda permutação é igualmente provável, e a lista original não é alterada.
export function shuffle<T>(items: readonly T[], random: Random): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const current = result[i] as T;
		result[i] = result[j] as T;
		result[j] = current;
	}
	return result;
}
