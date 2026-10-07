// EN: `bun run diagram` rewrites `diagram.md` from `machine.json`.
//     `bun run diagram --check` writes nothing and fails when the committed file is out of date.
// PT: `bun run diagram` regrava `diagram.md` a partir de `machine.json`.
//     `bun run diagram --check` não grava nada e falha quando o arquivo versionado está
//     desatualizado.

import { readFileSync, writeFileSync } from "node:fs";
import { DIAGRAM_PATH, renderDiagram } from "./diagram";
import { loadTable } from "./table";

// EN: Inside Docker the image is read-only for our purposes, so the compose service mounts the
//     project folder and passes the output path in this variable.
// PT: Dentro do Docker a imagem é, para os nossos fins, somente leitura, então o serviço do
//     compose monta a pasta do projeto e passa o caminho de saída nesta variável.
const outPath = process.env.DIAGRAM_OUT ?? DIAGRAM_PATH;
const expected = renderDiagram(loadTable());

if (process.argv.includes("--check")) {
	if (readFileSync(outPath, "utf8") !== expected) {
		console.error(`${outPath} is out of date: run the diagram command of the README`);
		process.exit(1);
	}
	console.log(`${outPath} is up to date`);
} else {
	writeFileSync(outPath, expected);
	console.log(`wrote ${outPath}`);
}
