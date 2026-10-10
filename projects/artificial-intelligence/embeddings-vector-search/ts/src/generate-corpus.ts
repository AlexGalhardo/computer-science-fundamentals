// EN: The corpus of this project is generated, not downloaded. Eight groups of words (animals,
//     foods, vehicles and so on) each have their own sentence templates and their own typical
//     context words. A sentence is a template with its slots filled at random by a seeded
//     generator, so the same seed always writes the same file.
//     This is the distributional hypothesis built on purpose: words of one group appear in the
//     same contexts ("the ... slept in the barn"), and the word vectors must rediscover the
//     groups from those contexts alone. Nothing in the vectors code knows the groups.
//     `bun run src/generate-corpus.ts` rewrites data/corpus.txt and data/queries.txt.
// PT: O corpus deste projeto é gerado, não baixado. Oito grupos de palavras (animais, comidas,
//     veículos e assim por diante) têm cada um seus modelos de frase e suas palavras de contexto
//     típicas. Uma frase é um modelo com as lacunas preenchidas ao acaso por um gerador com
//     semente, então a mesma semente sempre escreve o mesmo arquivo.
//     É a hipótese distribucional construída de propósito: palavras de um grupo aparecem nos
//     mesmos contextos ("the ... slept in the barn"), e os vetores de palavras precisam
//     redescobrir os grupos só a partir desses contextos. Nada no código dos vetores conhece os
//     grupos.
//     `bun run src/generate-corpus.ts` regrava data/corpus.txt e data/queries.txt.
// ES: El corpus de este proyecto se genera, no se descarga. Ocho grupos de palabras (animales,
//     comidas, vehículos y así sucesivamente) tienen cada uno sus plantillas de frase y sus
//     palabras de contexto típicas. Una frase es una plantilla con los huecos rellenados al azar
//     por un generador con semilla, así que la misma semilla siempre escribe el mismo archivo.
//     Es la hipótesis distribucional construida a propósito: las palabras de un grupo aparecen en
//     los mismos contextos ("the ... slept in the barn"), y los vectores de palabras tienen que
//     redescubrir los grupos solo a partir de esos contextos. Nada en el código de los vectores
//     conoce los grupos.
//     `bun run src/generate-corpus.ts` reescribe data/corpus.txt y data/queries.txt.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "./data";
import { contentKey } from "./retrieval";
import { mulberry32, pick, type Rng } from "./rng";

export interface Group {
	readonly name: string;
	/** The test words: the nearest neighbours of each one should be the other nine. */
	readonly words: readonly string[];
	/** Sentence templates. `{w}` is a word of the group, `{w2}` a different word of the group. */
	readonly templates: readonly string[];
	/** The other slots of the templates, with the context words typical of the group. */
	readonly slots: Readonly<Record<string, readonly string[]>>;
}

export const GROUPS: readonly Group[] = [
	{
		name: "animals",
		words: ["dog", "cat", "horse", "cow", "sheep", "goat", "rabbit", "fox", "wolf", "deer"],
		templates: [
			"the {w} {v} in the {p}",
			"a {a} {w} {v} near the {p}",
			"the {w} and the {w2} {v} behind the {p}",
			"the farmer fed the {a} {w} every morning",
			"the {b} of the {w} was covered in mud",
			"a {w} chased the {w2} across the {p}",
			"we watched a {a} {w} from the {p}",
		],
		slots: {
			v: ["ran", "slept", "ate", "drank", "jumped", "hid", "waited", "rested"],
			p: ["barn", "meadow", "forest", "field", "stable", "yard", "hill", "river"],
			a: ["hungry", "wild", "tame", "young", "old", "shy"],
			b: ["fur", "tail", "paws", "ears", "teeth"],
		},
	},
	{
		name: "foods",
		words: ["bread", "cheese", "rice", "soup", "pasta", "salad", "cake", "butter", "honey", "stew"],
		templates: [
			"the {c} {v} the {w} in the {p}",
			"we {v} {a} {w} for dinner",
			"the {w} and the {w2} were on the table",
			"she bought {a} {w} at the market",
			"the recipe needs {w} and a little {w2}",
			"the {a} {w} smelled good in the {p}",
			"he {v} the {w} with a spoon",
		],
		slots: {
			v: ["cooked", "tasted", "served", "ate", "shared", "warmed", "prepared"],
			p: ["kitchen", "oven", "pantry", "restaurant", "bowl", "pot"],
			a: ["fresh", "warm", "salty", "sweet", "tasty", "cold"],
			c: ["cook", "baker", "waiter", "grandmother", "guest"],
		},
	},
	{
		name: "vehicles",
		words: ["car", "bus", "train", "truck", "bicycle", "boat", "plane", "tram", "van", "ship"],
		templates: [
			"the {w} {v} at the {p}",
			"a {a} {w} {v} near the {p}",
			"the driver parked the {w} beside the {w2}",
			"passengers boarded the {a} {w} at the {p}",
			"the {b} of the {w} needed repair",
			"the {w} carried passengers along the {p}",
			"a mechanic fixed the {b} of the {w} in the garage",
		],
		slots: {
			v: ["stopped", "arrived", "left", "turned", "waited", "broke", "moved"],
			p: ["station", "road", "bridge", "garage", "harbour", "street", "tunnel", "airport"],
			a: ["fast", "slow", "noisy", "crowded", "empty", "old"],
			b: ["engine", "wheels", "brakes", "seats", "doors"],
		},
	},
	{
		name: "colours",
		words: ["red", "blue", "green", "yellow", "purple", "pink", "brown", "grey", "white", "black"],
		templates: [
			"she painted the {t} {w}",
			"the {t} was {a} {w}",
			"he mixed {w} and {w2} paint on the palette",
			"a {a} shade of {w} covered the {t}",
			"the artist chose {w} instead of {w2}",
			"the colour {w} looked {a} on the {t}",
			"they dyed the cloth {w} and {w2}",
		],
		slots: {
			t: ["wall", "door", "fence", "ceiling", "canvas", "chair", "shirt", "flag"],
			a: ["bright", "dark", "pale", "deep", "soft"],
		},
	},
	{
		name: "weather",
		words: ["rain", "snow", "wind", "storm", "fog", "frost", "hail", "thunder", "sunshine", "drizzle"],
		templates: [
			"the {w} {v} over the {p}",
			"{a} {w} {v} during the {t}",
			"the forecast warned of {w} and {w2}",
			"after the {w} the sky cleared above the {p}",
			"clouds brought {a} {w} to the {p}",
			"the {w} kept everyone indoors all {t}",
			"we expected {w} but the weather brought {w2}",
		],
		slots: {
			v: ["arrived", "returned", "stopped", "continued", "passed", "eased"],
			p: ["valley", "coast", "mountains", "city", "hills", "fields", "island"],
			a: ["heavy", "light", "sudden", "cold", "steady"],
			t: ["morning", "night", "afternoon", "week", "winter", "spring"],
		},
	},
	{
		name: "instruments",
		words: ["piano", "guitar", "violin", "drum", "flute", "trumpet", "cello", "harp", "banjo", "organ"],
		templates: [
			"the {c} {v} the {w} in the {p}",
			"a {a} melody came from the {w}",
			"the {w} and the {w2} played together at the concert",
			"she {v} the {w} before the concert",
			"the sound of the {w} filled the {p}",
			"the orchestra needed a {w} and a {w2}",
			"he learned a {a} tune on the {w}",
		],
		slots: {
			v: ["played", "practised", "tuned", "carried", "borrowed", "repaired"],
			p: ["hall", "stage", "studio", "church", "theatre"],
			a: ["gentle", "loud", "quiet", "sweet", "slow"],
			c: ["musician", "student", "composer", "singer", "child"],
		},
	},
	{
		name: "devices",
		words: ["laptop", "server", "printer", "router", "keyboard", "monitor", "tablet", "phone", "modem", "scanner"],
		templates: [
			"the {c} {v} the {w} in the {p}",
			"the {a} {w} stopped working after the update",
			"we connected the {w} to the {w2} with a cable",
			"the {w} lost its connection to the network",
			"she installed new software on the {w}",
			"the {a} {w} sat next to the {w2}",
			"the computer shop sold a {w} and a {w2}",
		],
		slots: {
			v: ["restarted", "connected", "replaced", "tested", "cleaned", "configured", "unplugged"],
			p: ["office", "lab", "classroom", "library", "workshop"],
			a: ["new", "broken", "slow", "cheap", "modern"],
			c: ["technician", "programmer", "student", "manager", "user"],
		},
	},
	{
		name: "professions",
		words: [
			"doctor",
			"nurse",
			"teacher",
			"lawyer",
			"plumber",
			"chef",
			"pilot",
			"engineer",
			"carpenter",
			"librarian",
		],
		templates: [
			"the {w} {v} at the {p}",
			"the {w} {v} late on {d}",
			"a {a} {w} helped the {w2} with the job",
			"the {w} earned a good salary in the {p}",
			"she trained for years to become a {w}",
			"the {w} and the {w2} met after work",
			"everyone trusted the {a} {w}",
			"he hired a {w} for the job",
		],
		slots: {
			v: ["worked", "arrived", "explained", "helped", "waited", "answered"],
			p: ["town", "school", "clinic", "village", "company", "hospital"],
			a: ["busy", "kind", "young", "tired", "skilled"],
			d: ["monday", "tuesday", "friday", "sunday"],
		},
	},
];

// EN: Real text is not tidy: a dog can appear next to a bus. One sentence in ten mixes two
//     groups, so the vectors have to cope with some noise.
// PT: Texto real não é arrumado: um cachorro pode aparecer ao lado de um ônibus. Uma frase em
//     cada dez mistura dois grupos, então os vetores precisam lidar com algum ruído.
// ES: El texto real no está ordenado: un perro puede aparecer junto a un autobús. Una frase de
//     cada diez mezcla dos grupos, así que los vectores tienen que lidiar con algo de ruido.
const MIXED_TEMPLATES: readonly string[] = [
	"people talked about the {x} and the {y}",
	"nobody noticed the {x} or the {y}",
	"the story mentioned the {x} and then the {y}",
	"a {c} {x} stood beside the {y}",
	"the picture showed the {x} next to the {y}",
];
const MIXED_GROUPS: readonly string[] = ["animals", "vehicles", "instruments", "devices"];
const MIXED_SHARE = 0.1;

function groupByName(name: string): Group {
	const group = GROUPS.find((candidate) => candidate.name === name);
	if (group === undefined) throw new Error(`unknown group ${name}`);
	return group;
}

// EN: The slots are filled from left to right, so the order of the random draws is fixed.
// PT: As lacunas são preenchidas da esquerda para a direita, então a ordem dos sorteios é fixa.
// ES: Los huecos se rellenan de izquierda a derecha, así que el orden de los sorteos es fijo.
function fill(template: string, choose: (slot: string) => string): string {
	return template.replace(/\{(\w+)\}/g, (_match, slot: string) => choose(slot));
}

function groupSentence(rng: Rng, group: Group): string {
	let first = "";
	return fill(pick(rng, group.templates), (slot) => {
		if (slot === "w") {
			first = pick(rng, group.words);
			return first;
		}
		if (slot === "w2") {
			return pick(
				rng,
				group.words.filter((word) => word !== first),
			);
		}
		const options = group.slots[slot];
		if (options === undefined) throw new Error(`group ${group.name} has no slot ${slot}`);
		return pick(rng, options);
	});
}

function mixedSentence(rng: Rng): string {
	const firstGroup = pick(rng, MIXED_GROUPS);
	const secondGroup = pick(
		rng,
		MIXED_GROUPS.filter((name) => name !== firstGroup),
	);
	return fill(pick(rng, MIXED_TEMPLATES), (slot) => {
		if (slot === "x") return pick(rng, groupByName(firstGroup).words);
		if (slot === "y") return pick(rng, groupByName(secondGroup).words);
		return pick(rng, groupByName("colours").words);
	});
}

/** `count` sentences, one per line. The groups take turns, so every group gets the same share. */
export function generateSentences(seed: number, count: number): string[] {
	const rng = mulberry32(seed);
	const sentences: string[] = [];
	for (let index = 0; index < count; index++) {
		const group = GROUPS[index % GROUPS.length];
		if (group === undefined) throw new Error("no groups");
		sentences.push(rng() < MIXED_SHARE ? mixedSentence(rng) : groupSentence(rng, group));
	}
	return sentences;
}

export const CORPUS_SEED = 2026;
export const CORPUS_SENTENCES = 2400;
export const QUERIES_SEED = 7;
export const QUERIES_COUNT = 400;

export function generateCorpus(): string[] {
	return generateSentences(CORPUS_SEED, CORPUS_SENTENCES);
}

// EN: The queries of the search experiment are new sentences from another seed. A query whose
//     content words are already in the corpus, in any order, is dropped: finding a vector
//     identical to the question is too easy to say anything about the index.
// PT: As consultas do experimento de busca são frases novas, de outra semente. Uma consulta
//     cujas palavras de conteúdo já estão no corpus, em qualquer ordem, é descartada: achar um
//     vetor idêntico à pergunta é fácil demais para dizer algo sobre o índice.
// ES: Las consultas del experimento de búsqueda son frases nuevas, de otra semilla. Una consulta
//     cuyas palabras de contenido ya están en el corpus, en cualquier orden, se descarta: encontrar
//     un vector idéntico a la pregunta es demasiado fácil para decir algo sobre el índice.
export function generateQueries(corpus: readonly string[]): string[] {
	const known = new Set(corpus.map(contentKey));
	const queries: string[] = [];
	const rng = mulberry32(QUERIES_SEED);
	while (queries.length < QUERIES_COUNT) {
		const group = GROUPS[queries.length % GROUPS.length];
		if (group === undefined) throw new Error("no groups");
		const sentence = groupSentence(rng, group);
		const key = contentKey(sentence);
		if (known.has(key)) continue;
		known.add(key);
		queries.push(sentence);
	}
	return queries;
}

if (import.meta.main) {
	const corpus = generateCorpus();
	writeFileSync(join(DATA_DIR, "corpus.txt"), `${corpus.join("\n")}\n`);
	writeFileSync(join(DATA_DIR, "queries.txt"), `${generateQueries(corpus).join("\n")}\n`);
	const groups = Object.fromEntries(GROUPS.map((group) => [group.name, group.words]));
	writeFileSync(join(DATA_DIR, "groups.json"), `${JSON.stringify(groups, null, "\t")}\n`);
	console.log(`wrote ${corpus.length} sentences and ${QUERIES_COUNT} queries to ${DATA_DIR}`);
}
