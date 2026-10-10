// EN: `bun run demo` trains once, prints the first merges and the table "vocabulary size
//     against number of tokens", and writes results/results-ts.md and results/table-ts.json.
// PT: `bun run demo` treina uma vez, imprime as primeiras fusões e a tabela "tamanho do
//     vocabulário contra número de tokens", e grava results/results-ts.md e results/table-ts.json.
// ES: `bun run demo` entrena una vez, imprime las primeras fusiones y la tabla "tamaño del
//     vocabulario frente a número de tokens", y escribe results/results-ts.md y
//     results/table-ts.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
	DEFAULT_MERGES,
	TABLE_STEPS,
	type TableRow,
	type Tokenizer,
	textToBytes,
	tokenCountTable,
	tokenLabel,
	train,
} from "./bpe";
import { describe } from "./cli";
import { readData } from "./data";

export const DEMO_SENTENCE = "The tokenizer reads ação, função and 🙂.";

export function renderTable(rows: readonly TableRow[], sampleBytes: number): string[] {
	const lines = [
		"| Merges | Vocabulary size | Tokens of the sample | Bytes per token | Tokens of the corpus |",
		"| ---: | ---: | ---: | ---: | ---: |",
	];
	for (const row of rows) {
		const ratio = (sampleBytes / row.sampleTokens).toFixed(2);
		lines.push(`| ${row.merges} | ${row.vocabulary} | ${row.sampleTokens} | ${ratio} | ${row.corpusTokens} |`);
	}
	return lines;
}

export function renderMerges(tokenizer: Tokenizer, count: number): string[] {
	const lines = [
		"| # | New id | Left | Right | New token | Times seen |",
		"| ---: | ---: | --- | --- | --- | ---: |",
	];
	tokenizer.merges.slice(0, count).forEach((merge, index) => {
		const cell = (id: number): string => `\`${JSON.stringify(tokenLabel(tokenizer, id))}\``;
		lines.push(
			`| ${index + 1} | ${merge.id} | ${cell(merge.left)} | ${cell(merge.right)} | ${cell(merge.id)} | ${merge.count} |`,
		);
	});
	return lines;
}

export function renderMarkdown(language: string, command: string): string {
	const corpus = readData("corpus.txt");
	const sample = readData("sample.txt");
	const tokenizer = train(corpus, DEFAULT_MERGES);
	const rows = tokenCountTable(tokenizer, corpus, sample, TABLE_STEPS);
	return [
		`# Results: bpe-tokenizer (${language})`,
		"",
		`Generated with \`${command}\`. Every number is a count, so the file is the same on any machine.`,
		`Corpus: \`data/corpus.txt\` (${textToBytes(corpus).length} bytes). Sample: \`data/sample.txt\` (${textToBytes(sample).length} bytes, not part of the corpus).`,
		"",
		"## Vocabulary size against number of tokens",
		"",
		...renderTable(rows, textToBytes(sample).length),
		"",
		"## The first 15 merges",
		"",
		...renderMerges(tokenizer, 15),
		"",
		"## The tokens of one sentence",
		"",
		"```text",
		describe(tokenizer, DEMO_SENTENCE),
		"```",
		"",
	].join("\n");
}

if (import.meta.main) {
	const resultsDir = process.env.RESULTS_DIR ?? resolve(import.meta.dir, "..", "..", "results");
	const markdown = renderMarkdown("TypeScript", "docker compose run --rm ts-demo");
	const corpus = readData("corpus.txt");
	const rows = tokenCountTable(train(corpus, DEFAULT_MERGES), corpus, readData("sample.txt"), TABLE_STEPS);
	mkdirSync(resultsDir, { recursive: true });
	writeFileSync(join(resultsDir, "results-ts.md"), markdown);
	writeFileSync(join(resultsDir, "table-ts.json"), `${JSON.stringify(rows, null, "\t")}\n`);
	console.log(markdown);
}
