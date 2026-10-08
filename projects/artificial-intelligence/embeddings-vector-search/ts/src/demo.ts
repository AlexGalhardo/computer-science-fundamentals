// EN: `bun run src/demo.ts` runs the three experiments, prints their tables and writes
//     results/results-ts.md and results/table-ts.json.
// PT: `bun run src/demo.ts` roda os três experimentos, imprime as tabelas e grava
//     results/results-ts.md e results/table-ts.json.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe } from "./cli";
import { nearestNeighbours, overallPrecision } from "./embeddings";
import {
	type Experiment,
	MISSED_QUESTION,
	NEIGHBOURS,
	RELATED_QUESTION,
	runExperiment,
	summarize,
	TOP_PASSAGES,
} from "./experiments";
import { retrieve } from "./retrieval";
import { CHOSEN, sameSettings } from "./search";

// EN: One decimal, with halves always rounded up. JavaScript and Python round an exact half
//     such as 94.25 in different directions, and the two results files should show the same
//     numbers.
// PT: Uma casa decimal, com metades sempre arredondadas para cima. JavaScript e Python
//     arredondam uma metade exata como 94.25 em direções diferentes, e os dois arquivos de
//     resultados devem mostrar os mesmos números.
function oneDecimal(value: number): string {
	return (Math.floor(value * 10 + 0.5) / 10).toFixed(1);
}

function percent(share: number): string {
	return `${oneDecimal(share * 100)}%`;
}

export function renderNeighbours(experiment: Experiment): string[] {
	const lines = [`| Word | Group | ${NEIGHBOURS} nearest neighbours (cosine similarity) |`, "| --- | --- | --- |"];
	for (const [group, words] of Object.entries(experiment.groups)) {
		const word = words[0];
		if (word === undefined) continue;
		const neighbours = nearestNeighbours(experiment.model.words, word, NEIGHBOURS)
			.map((neighbour) => `${neighbour.word} ${neighbour.similarity.toFixed(3)}`)
			.join(", ");
		lines.push(`| ${word} | ${group} | ${neighbours} |`);
	}
	return lines;
}

export function renderPrecision(experiment: Experiment): string[] {
	const lines = [
		`| Group | Test words | Neighbours in the group (PPMI) | Words with all ${NEIGHBOURS} in the group | Neighbours in the group (raw counts) |`,
		"| --- | ---: | ---: | ---: | ---: |",
	];
	experiment.precision.forEach((row, position) => {
		const raw = experiment.rawPrecision[position]?.precision ?? 0;
		lines.push(
			`| ${row.group} | ${row.words} | ${percent(row.precision)} | ${row.perfectWords} | ${percent(raw)} |`,
		);
	});
	const words = experiment.precision.reduce((acc, row) => acc + row.words, 0);
	const perfect = experiment.precision.reduce((acc, row) => acc + row.perfectWords, 0);
	lines.push(
		`| **all** | ${words} | ${percent(overallPrecision(experiment.precision))} | ${perfect} | ${percent(overallPrecision(experiment.rawPrecision))} |`,
	);
	return lines;
}

export function renderContrast(experiment: Experiment): string[] {
	const row = (name: string, within: number, between: number): string =>
		`| ${name} | ${within.toFixed(3)} | ${between.toFixed(3)} | ${(within - between).toFixed(3)} |`;
	return [
		"| Weighting | Mean cosine, same group | Mean cosine, different groups | Gap |",
		"| --- | ---: | ---: | ---: |",
		row("raw counts", experiment.rawContrast.within, experiment.rawContrast.between),
		row("PPMI", experiment.contrast.within, experiment.contrast.between),
	];
}

export function renderTradeOff(experiment: Experiment): string[] {
	const n = experiment.indexed;
	const lines = [
		"| Search | Tables | Bits | Probing | Same top result as brute force | Vectors compared (average) | Plane dot products | Total | Share of brute force |",
		"| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |",
		`| brute force | - | - | - | 100.0% | ${n} | 0 | ${n} | 100.0% |`,
	];
	for (const row of experiment.tradeOff) {
		const total = row.comparisons + row.hashing;
		const name = sameSettings(CHOSEN, { tables: row.tables, bits: row.bits, probes: row.probes === 1 ? 1 : 0 })
			? "**index (chosen)**"
			: "index";
		lines.push(
			`| ${name} | ${row.tables} | ${row.bits} | ${row.probes === 1 ? "1 bit" : "no"} | ${percent(row.agreement)} | ${oneDecimal(row.comparisons)} | ${row.hashing} | ${oneDecimal(total)} | ${percent(total / n)} |`,
		);
	}
	return lines;
}

export function renderRetrieval(experiment: Experiment): string[] {
	const lines = ["| Question | Expected | 1st | 2nd | 3rd |", "| --- | --- | --- | --- | --- |"];
	const asked = [
		...experiment.questions,
		{ question: RELATED_QUESTION, expected: "p13, p14 or p15" },
		MISSED_QUESTION,
	];
	for (const item of asked) {
		const hits = retrieve(experiment.model, item.question, TOP_PASSAGES).map(
			(hit) => `${hit.passage.id} ${hit.passage.title} (${hit.score.toFixed(3)})`,
		);
		lines.push(`| ${item.question} | ${item.expected} | ${hits.join(" | ")} |`);
	}
	return lines;
}

export function renderMarkdown(language: string, command: string, experiment: Experiment): string {
	const { model } = experiment;
	const first = experiment.questions[0]?.question ?? RELATED_QUESTION;
	return [
		`# Results: embeddings-vector-search (${language})`,
		"",
		`Generated with \`${command}\`. Every random choice has a fixed seed, so the tables are reproducible.`,
		"",
		`Corpus: \`data/corpus.txt\` (${experiment.corpusSentences} generated sentences) plus the sentences of the ${model.passages.length} passages of \`data/passages.json\`: ${experiment.trainingSentences} sentences, ${model.words.vocabulary.length} distinct words. Each word vector has ${model.words.vocabulary.length} numbers (one per word of the vocabulary).`,
		"",
		"## The nearest neighbours of one word of each group",
		"",
		...renderNeighbours(experiment),
		"",
		`## Do the neighbours fall in the expected group? (${NEIGHBOURS} neighbours of each test word)`,
		"",
		...renderPrecision(experiment),
		"",
		"## Raw counts against PPMI",
		"",
		...renderContrast(experiment),
		"",
		"## Brute force against the index",
		"",
		`Indexed: the ${experiment.indexed} sentences of the corpus with distinct content words, one vector each. Queries: the ${experiment.queries} sentences of \`data/queries.txt\`, none of them in the corpus. One comparison = one dot product between two vectors of ${model.words.vocabulary.length} numbers.`,
		"",
		...renderTradeOff(experiment),
		"",
		"## Retrieval: the passages each question picks",
		"",
		...renderRetrieval(experiment),
		"",
		"## The output of the search command",
		"",
		"```text",
		describe(model, first),
		"```",
		"",
		"A question with no content word in common with the passages it finds:",
		"",
		"```text",
		describe(model, RELATED_QUESTION),
		"```",
		"",
		"A question it gets wrong:",
		"",
		"```text",
		describe(model, MISSED_QUESTION.question),
		"```",
		"",
	].join("\n");
}

if (import.meta.main) {
	const resultsDir = process.env.RESULTS_DIR ?? resolve(import.meta.dir, "..", "..", "results");
	const experiment = runExperiment();
	const markdown = renderMarkdown("TypeScript", "docker compose run --rm ts-demo", experiment);
	mkdirSync(resultsDir, { recursive: true });
	writeFileSync(join(resultsDir, "results-ts.md"), markdown);
	writeFileSync(join(resultsDir, "table-ts.json"), `${JSON.stringify(summarize(experiment), null, "\t")}\n`);
	console.log(markdown);
}
