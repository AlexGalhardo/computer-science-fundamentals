// EN: The corpus, the sample text and the expected table live in ../data, shared by the
//     TypeScript and the Python implementations. In Docker the folder is mounted and DATA_DIR
//     points at it.
// PT: O corpus, o texto de amostra e a tabela esperada ficam em ../data, compartilhados pelas
//     implementações em TypeScript e em Python. No Docker a pasta é montada e DATA_DIR aponta
//     para ela.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const DATA_DIR = process.env.DATA_DIR ?? resolve(import.meta.dir, "..", "..", "data");

export function readData(name: string): string {
	return readFileSync(join(DATA_DIR, name), "utf8");
}
