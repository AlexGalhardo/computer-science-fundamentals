import { describe, expect, test } from "bun:test";
import { describe as describeSearch } from "../src/cli";
import { readData, readLines } from "../src/data";
import { renderMarkdown } from "../src/demo";
import {
	buildVocabulary,
	buildWordVectors,
	cooccurrence,
	cosine,
	indexOf,
	nearestNeighbours,
	overallPrecision,
	ppmi,
	splitSentences,
	tokenize,
	type Vector,
	vectorOf,
} from "../src/embeddings";
import {
	indexData,
	MISSED_QUESTION,
	NEIGHBOURS,
	RELATED_PASSAGES,
	RELATED_QUESTION,
	runExperiment,
	type Summary,
	summarize,
	TOP_PASSAGES,
	topIds,
} from "../src/experiments";
import { generateCorpus, generateQueries } from "../src/generate-corpus";
import { contentKey, distinctByContent, embedText, retrieve, STOP_WORDS } from "../src/retrieval";
import { bellRandom, mulberry32 } from "../src/rng";
import {
	bruteForce,
	bucketKey,
	CHOSEN,
	FAST,
	LshIndex,
	type LshSettings,
	MAX_BITS,
	MAX_TABLES,
	makePlanes,
	PLANES_SEED,
	sameSettings,
	sides,
	type TradeOffRow,
} from "../src/search";

// EN: The experiments are run once for the whole file: every test below reads the same result.
// PT: Os experimentos rodam uma vez para o arquivo inteiro: todo teste abaixo lê o mesmo resultado.
const experiment = runExperiment();
const summary = summarize(experiment);
const expected = JSON.parse(readData("expected.json")) as Summary;
const model = experiment.model;

function rowOf(rows: readonly TradeOffRow[], settings: LshSettings): TradeOffRow {
	const row = rows.find((candidate) =>
		sameSettings(settings, {
			tables: candidate.tables,
			bits: candidate.bits,
			probes: candidate.probes === 1 ? 1 : 0,
		}),
	);
	if (row === undefined) throw new Error("setting not in the table");
	return row;
}

const TINY = ["the dog eats", "the cat eats", "the car stops", "the bus stops"].map((sentence) => tokenize(sentence));

describe("the seeded generator", () => {
	test("mulberry32 gives the sequence that the Python version must reproduce", () => {
		const rng = mulberry32(42);
		expect([rng(), rng(), rng()]).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099]);
		expect(bellRandom(mulberry32(7))).toBe(-0.250400650780648);
	});

	test("the committed corpus and queries are what the generator writes", () => {
		const corpus = generateCorpus();
		expect(corpus).toEqual(readLines("corpus.txt"));
		expect(generateQueries(corpus)).toEqual(readLines("queries.txt"));
	});

	test("no query has the content words of a sentence of the corpus", () => {
		const corpus = new Set(readLines("corpus.txt").map(contentKey));
		expect(readLines("queries.txt").some((query) => corpus.has(contentKey(query)))).toBe(false);
		expect(contentKey("The cat and the dog")).toBe(contentKey("the dog and the cat"));
	});
});

describe("counting", () => {
	test("tokenize keeps lower-case words only", () => {
		expect(tokenize("The DOG, the cat: 2 dogs!")).toEqual(["the", "dog", "the", "cat", "dogs"]);
		expect(splitSentences("One. Two! Three?")).toEqual(["One", "Two", "Three"]);
	});

	test("the co-occurrence table is symmetric and counts both sides of the window", () => {
		const vocabulary = buildVocabulary(TINY);
		expect(vocabulary).toEqual(["bus", "car", "cat", "dog", "eats", "stops", "the"]);
		const counts = cooccurrence(TINY, indexOf(vocabulary), 2);
		const at = (a: string, b: string): number => counts[vocabulary.indexOf(a)]?.[vocabulary.indexOf(b)] ?? -1;
		expect(at("the", "eats")).toBe(2);
		expect(at("eats", "the")).toBe(2);
		expect(at("dog", "the")).toBe(1);
		expect(at("dog", "car")).toBe(0);
	});

	test("a window of 1 sees only the direct neighbours", () => {
		const vocabulary = buildVocabulary(TINY);
		const counts = cooccurrence(TINY, indexOf(vocabulary), 1);
		expect(counts[vocabulary.indexOf("the")]?.[vocabulary.indexOf("eats")]).toBe(0);
	});

	test("the worked example of the docs: PPMI gives log2(1.5) to a frequent pair and log2(3) to a typical one", () => {
		const vocabulary = buildVocabulary(TINY);
		const weighted = ppmi(cooccurrence(TINY, indexOf(vocabulary), 2));
		const at = (a: string, b: string): number => weighted[vocabulary.indexOf(a)]?.[vocabulary.indexOf(b)] ?? -1;
		expect(at("dog", "the")).toBeCloseTo(Math.log2(1.5), 9);
		expect(at("dog", "eats")).toBeCloseTo(Math.log2(3), 9);
		expect(at("dog", "car")).toBe(0);
	});

	test("the worked example of the docs: dog and car look alike with raw counts, not with PPMI", () => {
		const raw = buildWordVectors(TINY, "raw", 2);
		const weighted = buildWordVectors(TINY, "ppmi", 2);
		const similarity = (words: typeof raw, a: string, b: string): number =>
			cosine(vectorOf(words, a) as Vector, vectorOf(words, b) as Vector);
		expect(similarity(raw, "dog", "car")).toBeCloseTo(0.5, 9);
		expect(similarity(weighted, "dog", "car")).toBeCloseTo(0.12, 2);
		expect(similarity(weighted, "dog", "cat")).toBeCloseTo(1, 9);
	});

	test("cosine measures the angle and ignores the length", () => {
		const a = Float64Array.of(1, 0);
		expect(cosine(a, Float64Array.of(1, 1))).toBeCloseTo(Math.SQRT1_2, 12);
		expect(cosine(a, Float64Array.of(0, 5))).toBe(0);
		expect(cosine(a, Float64Array.of(7, 0))).toBeCloseTo(1, 12);
		expect(cosine(a, Float64Array.of(0, 0))).toBe(0);
	});
});

// MP-AI-3.1: for a list of test words, the nearest neighbours by cosine similarity fall in the
// expected group.
describe("MP-AI-3.1 word vectors", () => {
	test("there are 80 test words in 8 groups, all in the vocabulary", () => {
		const words = Object.values(experiment.groups).flat();
		expect(Object.keys(experiment.groups).length).toBe(8);
		expect(words.length).toBe(80);
		expect(words.every((word) => model.words.index.has(word))).toBe(true);
	});

	test("at least 90% of the 5 nearest neighbours belong to the group of the word", () => {
		expect(overallPrecision(experiment.precision)).toBeGreaterThanOrEqual(0.9);
		for (const row of experiment.precision) expect(row.precision).toBeGreaterThanOrEqual(0.8);
	});

	test("the neighbours of dog are animals", () => {
		const animals = new Set(experiment.groups.animals);
		const neighbours = nearestNeighbours(model.words, "dog", NEIGHBOURS);
		expect(neighbours.every((neighbour) => animals.has(neighbour.word))).toBe(true);
		expect(neighbours[0]?.similarity).toBeGreaterThan(neighbours[4]?.similarity ?? 1);
	});

	test("the neighbours table is the committed one, shared with the Python implementation", () => {
		expect(summary.neighbours).toEqual(expected.neighbours);
		expect(summary.precision).toBeCloseTo(expected.precision, 3);
	});

	test("the committed neighbours have no near tie, so rounding cannot reorder them", () => {
		for (const word of Object.keys(expected.neighbours)) {
			const scores = nearestNeighbours(model.words, word, NEIGHBOURS + 1).map(
				(neighbour) => neighbour.similarity,
			);
			for (let i = 1; i < scores.length; i++) {
				expect((scores[i - 1] as number) - (scores[i] as number)).toBeGreaterThan(1e-9);
			}
		}
	});

	test("PPMI separates the groups far more than raw counts do", () => {
		const gap = experiment.contrast.within - experiment.contrast.between;
		const rawGap = experiment.rawContrast.within - experiment.rawContrast.between;
		expect(experiment.rawContrast.between).toBeGreaterThan(0.6);
		expect(experiment.contrast.between).toBeLessThan(0.15);
		expect(gap).toBeGreaterThan(rawGap + 0.2);
	});
});

// MP-AI-3.2: the index returns the same top result as brute force in at least 95% of queries,
// with the number of comparisons tabled.
describe("MP-AI-3.2 brute force against the index", () => {
	const corpus = readLines("corpus.txt");
	const data = indexData(model, corpus, readLines("queries.txt"));
	const planes = makePlanes(PLANES_SEED, MAX_TABLES, MAX_BITS, model.words.vocabulary.length);

	test("brute force compares the query with every vector and finds the best one", () => {
		const vectors = [Float64Array.of(1, 0), Float64Array.of(0, 1), Float64Array.of(0.6, 0.8)];
		const result = bruteForce(vectors, Float64Array.of(0.5, 0.8660254037844386));
		expect(result.best).toBe(2);
		expect(result.comparisons).toBe(3);
	});

	test("the bucket key is the binary number formed by the sides", () => {
		const small = makePlanes(1, 2, 3, 4);
		expect(bucketKey(small, Uint8Array.of(1, 0, 1, 0, 1, 1), 0, 3)).toBe(0b101);
		expect(bucketKey(small, Uint8Array.of(1, 0, 1, 0, 1, 1), 1, 3)).toBe(0b110);
		expect(bucketKey(small, Uint8Array.of(1, 0, 1, 0, 1, 1), 1, 2)).toBe(0b10);
	});

	test("the same seed draws the same planes", () => {
		const again = makePlanes(PLANES_SEED, MAX_TABLES, MAX_BITS, model.words.vocabulary.length);
		expect(again.normals.length).toBe(MAX_TABLES * MAX_BITS);
		expect(Array.from(again.normals[5] ?? []).slice(0, 4)).toEqual(Array.from(planes.normals[5] ?? []).slice(0, 4));
	});

	test("a stored vector always finds itself: identical vectors share every bucket", () => {
		const vectorSides = data.vectors.map((vector) => sides(planes, vector));
		const index = new LshIndex(planes, data.vectors, vectorSides, FAST);
		for (const position of [0, 17, 512, data.vectors.length - 1]) {
			const result = index.search(data.vectors[position] as Vector, vectorSides[position] as Uint8Array);
			expect(result.similarity).toBeCloseTo(1, 9);
			expect(result.comparisons).toBeLessThan(data.vectors.length);
		}
	});

	test("about 2000 vectors are indexed and 400 queries are asked", () => {
		expect(experiment.indexed).toBe(distinctByContent(corpus).length);
		expect(experiment.indexed).toBeGreaterThan(1900);
		expect(experiment.queries).toBe(400);
	});

	test("the chosen index agrees with brute force in at least 95% of the queries, with under a quarter of the work", () => {
		const chosen = rowOf(experiment.tradeOff, CHOSEN);
		expect(chosen.agreement).toBeGreaterThanOrEqual(0.95);
		expect(chosen.comparisons + chosen.hashing).toBeLessThan(experiment.indexed / 4);
	});

	test("the fastest setting is cheaper and below 95%: speed is paid with wrong answers", () => {
		const fast = rowOf(experiment.tradeOff, FAST);
		const chosen = rowOf(experiment.tradeOff, CHOSEN);
		expect(fast.agreement).toBeLessThan(0.95);
		expect(fast.comparisons).toBeLessThan(chosen.comparisons);
	});

	test("more tables never lower the agreement and always cost more comparisons", () => {
		const one = rowOf(experiment.tradeOff, { tables: 1, bits: 12, probes: 0 });
		const four = rowOf(experiment.tradeOff, { tables: 4, bits: 12, probes: 0 });
		const eight = rowOf(experiment.tradeOff, { tables: 8, bits: 12, probes: 0 });
		expect(four.agreement).toBeGreaterThanOrEqual(one.agreement);
		expect(eight.agreement).toBeGreaterThanOrEqual(four.agreement);
		expect(four.comparisons).toBeGreaterThan(one.comparisons);
		expect(eight.comparisons).toBeGreaterThan(four.comparisons);
	});

	test("the comparisons table is the committed one, within a small tolerance", () => {
		expect(summary.indexed).toBe(expected.indexed);
		expect(summary.queries).toBe(expected.queries);
		expect(summary.tradeOff.length).toBe(expected.tradeOff.length);
		summary.tradeOff.forEach((row, position) => {
			const committed = expected.tradeOff[position] as TradeOffRow;
			expect([row.tables, row.bits, row.probes, row.hashing]).toEqual([
				committed.tables,
				committed.bits,
				committed.probes,
				committed.hashing,
			]);
			expect(Math.abs(row.agreement - committed.agreement)).toBeLessThanOrEqual(0.02);
			expect(Math.abs(row.comparisons - committed.comparisons)).toBeLessThanOrEqual(
				0.05 * committed.comparisons + 1,
			);
		});
	});
});

// MP-AI-3.3: one command prints the passages retrieved for a question.
describe("MP-AI-3.3 retrieval", () => {
	test("every demo question retrieves the expected passage first, with a clear margin", () => {
		expect(experiment.questions.length).toBe(10);
		for (const item of experiment.questions) {
			const hits = retrieve(model, item.question, TOP_PASSAGES);
			expect(hits[0]?.passage.id).toBe(item.expected);
			expect((hits[0]?.score ?? 0) - (hits[1]?.score ?? 0)).toBeGreaterThan(0.05);
		}
	});

	test("a question with no shared content word still finds the three weather passages", () => {
		const used = embedText(model, RELATED_QUESTION).known;
		const hits = retrieve(model, RELATED_QUESTION, TOP_PASSAGES);
		expect(topIds(hits).sort()).toEqual([...RELATED_PASSAGES]);
		for (const hit of hits) {
			const words = new Set(tokenize(`${hit.passage.title} ${hit.passage.text}`));
			expect(used.some((word) => words.has(word))).toBe(false);
		}
	});

	test("stop words are skipped and unknown words are reported", () => {
		const embedding = embedText(model, "Which animal guards the farm at night?");
		expect(embedding.known).toEqual(["guards", "farm", "night"]);
		expect(embedding.unknown).toEqual(["animal"]);
		expect(STOP_WORDS.has("which")).toBe(true);
	});

	test("the command prints the three passages with their scores", () => {
		const output = describeSearch(model, "Which animal guards the farm at night?");
		expect(output).toContain("1. score ");
		expect(output).toContain("p01  The farm dog");
		expect(output).toContain("A farm dog sleeps lightly beside the barn.");
		expect(output.split("\n").filter((line) => /^\d\. score /.test(line)).length).toBe(3);
	});

	test("a question made only of unknown words says so and retrieves nothing", () => {
		const output = describeSearch(model, "xylophone zeppelin");
		expect(output).toContain("No word of the question is in the vocabulary");
		expect(output).not.toContain("1. score");
	});

	test("the retrieved passages are the committed ones, shared with the Python implementation", () => {
		expect(summary.retrieval).toEqual(expected.retrieval);
	});

	test("the known miss is reported honestly: the right passage is second", () => {
		const hits = retrieve(model, MISSED_QUESTION.question, TOP_PASSAGES);
		expect(topIds(hits)[0]).not.toBe(MISSED_QUESTION.expected);
		expect(topIds(hits)).toContain(MISSED_QUESTION.expected);
	});
});

describe("results file", () => {
	test("the demo output has the four tables", () => {
		const markdown = renderMarkdown("TypeScript", "docker compose run --rm ts-demo", experiment);
		expect(markdown).toContain("## The nearest neighbours of one word of each group");
		expect(markdown).toContain("## Raw counts against PPMI");
		expect(markdown).toContain("| brute force | - | - | - | 100.0% |");
		expect(markdown).toContain("**index (chosen)**");
		expect(markdown).toContain("## Retrieval: the passages each question picks");
	});
});
