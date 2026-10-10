// EN: `bun run demo` draws the decision tree for n = 3, measures the trees for n = 3 and 4,
//     checks every permutation of small inputs, counts comparisons on 1,000 random inputs and
//     writes the tables to results/.
// PT: `bun run demo` desenha a árvore de decisão para n = 3, mede as árvores para n = 3 e 4,
//     confere todas as permutações de entradas pequenas, conta comparações em 1.000 entradas
//     aleatórias e grava as tabelas em results/.
// ES: `bun run demo` dibuja el árbol de decisión para n = 3, mide los árboles para n = 3 y 4,
//     comprueba todas las permutaciones de entradas pequeñas, cuenta comparaciones en 1,000
//     entradas aleatorias y escribe las tablas en results/.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
	buildDecisionTree,
	countLeaves,
	height,
	permutations,
	renderDecisionTree,
	totalLeafDepth,
} from "./decision-tree";
import {
	type ExhaustiveRow,
	exhaustive,
	log2Factorial,
	minimumComparisons,
	type RandomReport,
	randomExperiment,
} from "./experiment";
import { COMPARISON_SORTS, mergeSort } from "./sorts";

export interface TreeRow {
	algorithm: string;
	n: number;
	leaves: number;
	height: number;
	averageDepth: number;
	minimumHeight: number;
}

export const RANDOM_N = 1000;
export const RANDOM_INPUTS = 1000;
export const SEED = 20261007;

export function treeRows(sizes: number[]): TreeRow[] {
	return sizes.flatMap((n) =>
		COMPARISON_SORTS.map(({ name, sort }) => {
			const tree = buildDecisionTree(sort, n);
			const leaves = countLeaves(tree);
			return {
				algorithm: name,
				n,
				leaves,
				height: height(tree),
				averageDepth: totalLeafDepth(tree) / leaves,
				minimumHeight: minimumComparisons(n),
			};
		}),
	);
}

function formatNumber(value: number, digits = 2): string {
	return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(digits);
}

export function renderMarkdown(
	generatedAt: string,
	trees: TreeRow[],
	small: ExhaustiveRow[],
	random: RandomReport,
): string {
	const lines = [
		"# Results: sorting-lower-bound",
		"",
		`Generated at ${generatedAt} with \`docker compose run --rm ts-demo\` (Bun ${Bun.version}, image oven/bun:1.4.2).`,
		"Every number is a count of comparisons, not a time, so it is the same on every machine.",
		"",
		"## Decision trees",
		"",
		"A tree needs n! leaves, so its height is at least ceil(log2 n!). Merge sort reaches that height for n = 3 and n = 4.",
		"",
		"| Algorithm | n | leaves | n! | height (worst case) | ceil(log2 n!) | average depth | log2 n! |",
		"| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
		...trees.map(
			(row) =>
				`| ${row.algorithm} | ${row.n} | ${row.leaves} | ${permutations(row.n).length} | ${row.height} | ${row.minimumHeight} | ${formatNumber(row.averageDepth)} | ${formatNumber(log2Factorial(row.n))} |`,
		),
		"",
		"## Every permutation of small inputs",
		"",
		"The bound is about the worst case (at least ceil(log2 n!)) and the average (at least log2 n!). The best case may be smaller.",
		"",
		"| Algorithm | n | best | average | worst | log2 n! | ceil(log2 n!) |",
		"| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
		...small.map(
			(row) =>
				`| ${row.algorithm} | ${row.n} | ${row.best} | ${formatNumber(row.average)} | ${row.worst} | ${formatNumber(log2Factorial(row.n))} | ${minimumComparisons(row.n)} |`,
		),
		"",
		`## ${formatNumber(random.inputs)} random inputs of n = ${formatNumber(random.n)}`,
		"",
		`Random permutations of 0..n-1 from seed ${random.seed}. log2(n!) = ${formatNumber(random.log2Factorial)}. Counting sort and radix sort index an array by the key and make no comparison between elements.`,
		"",
		"| Algorithm | min comparisons | mean | max | min / log2 n! | inputs sorted |",
		"| --- | ---: | ---: | ---: | ---: | ---: |",
		...random.rows.map(
			(row) =>
				`| ${row.algorithm} | ${formatNumber(row.minimum)} | ${formatNumber(row.mean, 1)} | ${formatNumber(row.maximum)} | ${(row.minimum / random.log2Factorial).toFixed(3)} | ${row.sortedInputs} of ${random.inputs} |`,
		),
	];
	return `${lines.join("\n")}\n`;
}

function main(): void {
	console.log("Decision tree of merge sort for n = 3 (items a, b, c by input position):\n");
	console.log(renderDecisionTree(buildDecisionTree(mergeSort, 3)));

	const trees = treeRows([3, 4]);
	const small = [2, 3, 4, 5, 6, 7, 8].flatMap((n) => exhaustive(n));
	const random = randomExperiment(RANDOM_N, RANDOM_INPUTS, SEED);
	const generatedAt = new Date().toISOString();
	const markdown = renderMarkdown(generatedAt, trees, small, random);
	console.log(`\n${markdown.split("\n").slice(4).join("\n")}`);

	const directory = resolve(process.env.RESULTS_DIR ?? join(import.meta.dir, "..", "..", "results"));
	mkdirSync(directory, { recursive: true });
	const results = { project: "sorting-lower-bound", generatedAt, trees, small, random };
	writeFileSync(join(directory, "results.json"), `${JSON.stringify(results, null, "\t")}\n`);
	writeFileSync(join(directory, "results.md"), markdown);
	console.log(`results written to ${directory}`);
}

if (import.meta.main) {
	main();
}
