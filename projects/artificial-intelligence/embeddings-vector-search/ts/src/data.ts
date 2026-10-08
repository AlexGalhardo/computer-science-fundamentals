// EN: The corpus, the passages, the questions and the expected tables live in ../data, shared by
//     the TypeScript and the Python implementations, so both read the same bytes. In Docker the
//     folder is mounted and DATA_DIR points at it.
// PT: O corpus, as passagens, as perguntas e as tabelas esperadas ficam em ../data,
//     compartilhados pelas implementações em TypeScript e em Python, então as duas leem os mesmos
//     bytes. No Docker a pasta é montada e DATA_DIR aponta para ela.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const DATA_DIR = process.env.DATA_DIR ?? resolve(import.meta.dir, "..", "..", "data");

export function readData(name: string): string {
	return readFileSync(join(DATA_DIR, name), "utf8");
}

export function readLines(name: string): string[] {
	return readData(name)
		.split("\n")
		.filter((line) => line.length > 0);
}

export interface Passage {
	readonly id: string;
	readonly title: string;
	readonly text: string;
}

export interface DemoQuestion {
	readonly question: string;
	/** The id of the passage a person would pick. */
	readonly expected: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(record: Record<string, unknown>, key: string, file: string): string {
	const value = record[key];
	if (typeof value !== "string") throw new Error(`${file}: "${key}" must be a string`);
	return value;
}

// EN: JSON.parse returns "anything", so each file is checked field by field before it is used.
// PT: JSON.parse devolve "qualquer coisa", então cada arquivo é conferido campo a campo antes de
//     ser usado.
function readRecords(name: string): Record<string, unknown>[] {
	const parsed: unknown = JSON.parse(readData(name));
	if (!Array.isArray(parsed) || !parsed.every(isRecord)) throw new Error(`${name}: expected a list of objects`);
	return parsed;
}

export function readPassages(): Passage[] {
	const file = "passages.json";
	return readRecords(file).map((record) => ({
		id: text(record, "id", file),
		title: text(record, "title", file),
		text: text(record, "text", file),
	}));
}

export function readQuestions(): DemoQuestion[] {
	const file = "questions.json";
	return readRecords(file).map((record) => ({
		question: text(record, "question", file),
		expected: text(record, "expected", file),
	}));
}

export function readGroups(): Record<string, string[]> {
	const parsed: unknown = JSON.parse(readData("groups.json"));
	if (!isRecord(parsed)) throw new Error("groups.json: expected an object");
	const groups: Record<string, string[]> = {};
	for (const [name, words] of Object.entries(parsed)) {
		if (!Array.isArray(words) || !words.every((word): word is string => typeof word === "string")) {
			throw new Error(`groups.json: "${name}" must be a list of words`);
		}
		groups[name] = words;
	}
	return groups;
}
