// EN: `bun run src/cli.ts "your question"` builds the word vectors from the corpus and prints the
//     three passages most similar to the question, with their cosine scores.
// PT: `bun run src/cli.ts "sua pergunta"` constrói os vetores de palavras a partir do corpus e
//     imprime as três passagens mais parecidas com a pergunta, com as suas notas de cosseno.
// ES: `bun run src/cli.ts "tu pregunta"` construye los vectores de palabras a partir del corpus y
//     imprime los tres pasajes más parecidos a la pregunta, con sus puntuaciones de coseno.

import { embedText, loadModel, type Model, retrieve } from "./retrieval";

export const DEFAULT_TOP = 3;

export function describe(model: Model, question: string, top: number = DEFAULT_TOP): string {
	const embedding = embedText(model, question);
	const lines = [
		`question: ${JSON.stringify(question)}`,
		`words used: ${embedding.known.join(" ") || "(none)"}`,
		// EN: A word the corpus never showed has no vector, so it cannot help the search.
		// PT: Uma palavra que o corpus nunca mostrou não tem vetor, então não ajuda na busca.
		// ES: Una palabra que el corpus nunca mostró no tiene vector, así que no ayuda en la búsqueda.
		`not in the vocabulary: ${embedding.unknown.join(" ") || "(none)"}`,
		`compared with ${model.passages.length} passages by brute force`,
		"",
	];
	if (embedding.known.length === 0) {
		lines.push("No word of the question is in the vocabulary, so there is nothing to compare.");
		return lines.join("\n");
	}
	retrieve(model, question, top).forEach((hit, position) => {
		lines.push(`${position + 1}. score ${hit.score.toFixed(3)}  ${hit.passage.id}  ${hit.passage.title}`);
		lines.push(`   ${hit.passage.text}`);
	});
	return lines.join("\n");
}

if (import.meta.main) {
	const question = process.argv.slice(2).join(" ").trim();
	if (question.length === 0) {
		console.error('usage: cli "your question"');
		process.exit(2);
	}
	console.log(describe(loadModel(), question));
}
