// EN: `bun run src/build-site.ts <folder>` writes the page and its 200 images. It runs while the
//     Caddy image is built, so the generated files are not committed.
// PT: `bun run src/build-site.ts <pasta>` grava a página e suas 200 imagens. Roda durante a
//     construção da imagem do Caddy, então os arquivos gerados não são versionados.
// ES: `bun run src/build-site.ts <carpeta>` escribe la página y sus 200 imágenes. Corre
//     durante la construcción de la imagen de Caddy, así que los archivos generados no se
//     versionan.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { IMAGE_COUNT, imageName, imagePng, indexHtml } from "./site";

const target = process.argv[2];
if (target === undefined) {
	console.error("usage: bun run src/build-site.ts <folder>");
	process.exit(2);
}

mkdirSync(join(target, "img"), { recursive: true });
writeFileSync(join(target, "index.html"), indexHtml());
for (let index = 0; index < IMAGE_COUNT; index += 1) {
	writeFileSync(join(target, "img", imageName(index)), imagePng(index));
}
console.log(`wrote index.html and ${IMAGE_COUNT} images to ${target}`);
