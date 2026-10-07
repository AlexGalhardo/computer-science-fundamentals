import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// EN: `programs/` and `results/` are shared by the Go and the TypeScript implementations, so
//     they live one level above `ts/`. Inside the Docker image they are copied next to `src/`.
//     This helper finds a shared file in either layout.
// PT: `programs/` e `results/` são compartilhadas pelas implementações em Go e em TypeScript,
//     então ficam um nível acima de `ts/`. Dentro da imagem Docker elas são copiadas ao lado de
//     `src/`. Este auxiliar encontra um arquivo compartilhado nos dois arranjos.
export function readSharedFile(relativePath: string): string {
	const candidates = [join(import.meta.dir, "..", relativePath), join(import.meta.dir, "..", "..", relativePath)];
	const found = candidates.find((candidate) => existsSync(candidate));
	if (found === undefined) {
		throw new Error(`${relativePath} not found in ${candidates.join(" or ")}`);
	}
	return readFileSync(found, "utf8");
}
