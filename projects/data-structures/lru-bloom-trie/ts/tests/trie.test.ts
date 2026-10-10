import { expect, test } from "bun:test";
import { Trie } from "../src/trie";
import { generateWords, random } from "../src/words";

test("insert, contains and prefix listing on a small set", () => {
	const trie = new Trie();
	for (const word of ["car", "card", "care", "cat", "dog"]) {
		expect(trie.insert(word)).toBe(true);
	}
	expect(trie.insert("car")).toBe(false);
	expect(trie.size).toBe(5);
	expect(trie.contains("car")).toBe(true);
	expect(trie.contains("ca")).toBe(false);
	expect(trie.contains("cards")).toBe(false);
	expect(trie.withPrefix("car")).toEqual(["car", "card", "care"]);
	expect(trie.withPrefix("")).toEqual(["car", "card", "care", "cat", "dog"]);
	expect(trie.withPrefix("x")).toEqual([]);
});

// EN: The linear filter is the definition of the answer: look at every word and keep the ones
//     that start with the prefix. The trie has to return exactly the same set, for prefixes
//     that exist, for whole words and for prefixes that match nothing.
// PT: O filtro linear é a definição da resposta: olhar todas as palavras e ficar com as que
//     começam com o prefixo. A trie precisa devolver exatamente o mesmo conjunto, para prefixos
//     que existem, para palavras inteiras e para prefixos que não casam com nada.
// ES: El filtro lineal es la definición de la respuesta: mirar todas las palabras y quedarse con las
//     que empiezan con el prefijo. El trie debe devolver exactamente el mismo conjunto, para prefijos
//     que existen, para palabras enteras y para prefijos que no coinciden con nada.
test("prefix search over 100,000 words returns the same set as a linear filter", () => {
	const words = generateWords(100_000, 7);
	expect(words.length).toBe(100_000);
	const trie = new Trie();
	for (const word of words) {
		trie.insert(word);
	}
	expect(trie.size).toBe(100_000);

	const next = random(99);
	const prefixes = ["", "a", "ab", "zz", "abcabcabcabc"];
	for (let i = 0; i < 300; i++) {
		const word = words[next() % words.length] ?? "";
		prefixes.push(word.slice(0, 1 + (next() % word.length)));
	}
	for (const prefix of prefixes) {
		const expected = words.filter((word) => word.startsWith(prefix)).sort();
		expect(trie.withPrefix(prefix)).toEqual(expected);
	}
});
