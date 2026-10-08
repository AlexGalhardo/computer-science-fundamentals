// EN: `bun run src/cli.ts [--merges N] "a sentence"` trains the tokenizer on the corpus and
//     prints the tokens of the sentence: id, bytes and text of each one, and the boundaries.
// PT: `bun run src/cli.ts [--merges N] "uma frase"` treina o tokenizador no corpus e imprime os
//     tokens da frase: id, bytes e texto de cada um, e as fronteiras.

import { DEFAULT_MERGES, decode, encode, hex, type Tokenizer, textToBytes, tokenBytes, tokenLabel, train } from "./bpe";
import { readData } from "./data";

export function describe(tokenizer: Tokenizer, text: string): string {
	const ids = encode(tokenizer, text);
	const characters = Array.from(text).length;
	const lines = [
		`text:       ${JSON.stringify(text)}`,
		`characters: ${characters}   bytes: ${textToBytes(text).length}   tokens: ${ids.length}`,
		`vocabulary: ${tokenizer.vocabulary.length} (256 bytes + ${tokenizer.merges.length} merges)`,
		"",
		"   id  bytes                 text",
	];
	for (const id of ids) {
		const bytes = hex(tokenBytes(tokenizer, [id]));
		lines.push(`${String(id).padStart(5)}  ${bytes.padEnd(20)}  ${JSON.stringify(tokenLabel(tokenizer, id))}`);
	}
	// EN: The boundaries line shows where the cuts fall in the sentence.
	// PT: A linha de fronteiras mostra onde os cortes caem na frase.
	const pieces = ids.map((id) => tokenLabel(tokenizer, id).replaceAll("\n", "\\n"));
	lines.push("", `boundaries: ${pieces.join("|")}`);
	lines.push(`ids:        ${ids.join(" ")}`);
	lines.push(`round trip: ${decode(tokenizer, ids) === text ? "decode(encode(text)) == text" : "MISMATCH"}`);
	return lines.join("\n");
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const flag = args.indexOf("--merges");
	const merges = flag >= 0 ? Number(args[flag + 1]) : DEFAULT_MERGES;
	const words = args.filter((_, index) => flag < 0 || (index !== flag && index !== flag + 1));
	if (words.length === 0 || !Number.isInteger(merges) || merges < 0) {
		console.error('usage: cli [--merges N] "a sentence"');
		process.exit(2);
	}
	console.log(describe(train(readData("corpus.txt"), merges), words.join(" ")));
}
