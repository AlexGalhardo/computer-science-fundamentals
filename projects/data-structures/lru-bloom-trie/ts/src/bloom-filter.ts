// EN: Bloom filter: a set that answers "is this key in?" using a few bits per key instead of
//     storing the keys. The price is that the answer is "definitely not" or "probably yes".
//     Adding a key sets k bits chosen by k hash functions, and a lookup checks the same k bits.
//     If any of them is 0 the key was never added. If all are 1, the key was added, or other
//     keys happened to set those same bits: that is a false positive. A false negative is
//     impossible, because bits are never cleared.
// PT: Filtro de Bloom: um conjunto que responde "esta chave está aqui?" usando poucos bits por
//     chave em vez de guardar as chaves. O preço é que a resposta é "com certeza não" ou
//     "provavelmente sim". Adicionar uma chave liga k bits escolhidos por k funções de
//     espalhamento, e a consulta confere os mesmos k bits. Se algum deles é 0, a chave nunca foi
//     adicionada. Se todos são 1, a chave foi adicionada, ou outras chaves ligaram por acaso
//     esses mesmos bits: isso é um falso positivo. Falso negativo é impossível, porque os bits
//     nunca são desligados.

// EN: FNV-1a walks the text and mixes each character into a 32-bit state. A different seed
//     gives a different hash function over the same text.
// PT: O FNV-1a percorre o texto e mistura cada caractere em um estado de 32 bits. Uma semente
//     diferente dá uma função de espalhamento diferente sobre o mesmo texto.
function fnv1a(text: string, seed: number): number {
	let hash = seed;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	// EN: Final scramble (the MurmurHash3 finaliser), so that texts that differ only in the
	//     last characters still differ in every bit.
	// PT: Embaralhamento final (o finalizador do MurmurHash3), para que textos que diferem só
	//     nos últimos caracteres ainda difiram em todos os bits.
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash ^= hash >>> 16;
	return hash >>> 0;
}

export class BloomFilter {
	private readonly bits: Uint8Array;

	constructor(
		readonly sizeInBits: number,
		readonly hashCount: number,
	) {
		if (!Number.isInteger(sizeInBits) || sizeInBits < 1 || !Number.isInteger(hashCount) || hashCount < 1) {
			throw new RangeError("size and hash count must be positive integers");
		}
		this.bits = new Uint8Array(Math.ceil(sizeInBits / 8));
	}

	// EN: Sizing formulas. For n keys and a wanted false-positive rate p, the best number of
	//     bits is m = -n ln p / (ln 2)^2 and the best number of hashes is k = (m / n) ln 2.
	// PT: Fórmulas de dimensionamento. Para n chaves e uma taxa de falsos positivos p desejada,
	//     o melhor número de bits é m = -n ln p / (ln 2)^2 e o melhor número de funções é
	//     k = (m / n) ln 2.
	static optimal(expectedKeys: number, falsePositiveRate: number): BloomFilter {
		const size = Math.ceil((-expectedKeys * Math.log(falsePositiveRate)) / Math.LN2 ** 2);
		const hashes = Math.max(1, Math.round((size / expectedKeys) * Math.LN2));
		return new BloomFilter(size, hashes);
	}

	// EN: The k positions come from only two real hashes: position i is h1 + i * h2. This
	//     "double hashing" trick behaves like k independent functions and costs two passes over
	//     the key instead of k. h2 is made odd so that it is never zero.
	// PT: As k posições saem de apenas dois hashes de verdade: a posição i é h1 + i * h2. Esse
	//     truque de "hash duplo" se comporta como k funções independentes e custa duas passadas
	//     pela chave em vez de k. O h2 é tornado ímpar para nunca ser zero.
	private positions(key: string): number[] {
		const first = fnv1a(key, 0x811c9dc5);
		// EN: In JavaScript `|` returns a signed 32-bit number, which may be negative, and a
		//     negative position would silently miss the bit array. `>>> 0` makes it unsigned.
		// PT: Em JavaScript o `|` devolve um número de 32 bits com sinal, que pode ser negativo,
		//     e uma posição negativa erraria o vetor de bits em silêncio. O `>>> 0` o torna sem
		//     sinal.
		const second = (fnv1a(key, 0x01234567) | 1) >>> 0;
		const positions: number[] = [];
		for (let i = 0; i < this.hashCount; i++) {
			positions.push((first + i * second) % this.sizeInBits);
		}
		return positions;
	}

	add(key: string): void {
		for (const position of this.positions(key)) {
			this.bits[position >> 3] = (this.bits[position >> 3] ?? 0) | (1 << (position & 7));
		}
	}

	mightContain(key: string): boolean {
		return this.positions(key).every((position) => ((this.bits[position >> 3] ?? 0) & (1 << (position & 7))) !== 0);
	}

	// EN: After n keys, a given bit is still 0 with probability e^(-kn/m). A false positive
	//     needs k bits that are all 1, so the expected rate is (1 - e^(-kn/m))^k.
	// PT: Depois de n chaves, um bit qualquer ainda vale 0 com probabilidade e^(-kn/m). Um falso
	//     positivo precisa de k bits todos valendo 1, então a taxa esperada é (1 - e^(-kn/m))^k.
	expectedFalsePositiveRate(insertedKeys: number): number {
		return (1 - Math.exp((-this.hashCount * insertedKeys) / this.sizeInBits)) ** this.hashCount;
	}
}
