// EN: Deterministic test data: `count` different lowercase words of 3 to 10 letters, always the
//     same for the same seed. No word file has to be shipped or downloaded.
// PT: Dados de teste determinísticos: `count` palavras minúsculas diferentes, de 3 a 10 letras,
//     sempre as mesmas para a mesma semente. Nenhum arquivo de palavras precisa ser distribuído
//     nem baixado.
// ES: Datos de prueba deterministas: `count` palabras en minúsculas distintas, de 3 a 10 letras,
//     siempre las mismas para la misma semilla. No hace falta distribuir ni descargar ningún
//     archivo de palabras.

export function random(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return (t ^ (t >>> 14)) >>> 0;
	};
}

export function generateWords(count: number, seed: number): string[] {
	const next = random(seed);
	const words = new Set<string>();
	while (words.size < count) {
		const length = 3 + (next() % 8);
		let word = "";
		for (let i = 0; i < length; i++) {
			// EN: Only the first 12 letters are used, so many words share their prefixes.
			// PT: Só as 12 primeiras letras são usadas, então muitas palavras dividem prefixos.
			// ES: Solo se usan las 12 primeras letras, así que muchas palabras comparten prefijos.
			word += String.fromCharCode(97 + (next() % 12));
		}
		words.add(word);
	}
	return [...words];
}
