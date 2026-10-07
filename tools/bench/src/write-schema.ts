// EN: Writes `schema.json` from the Zod schema, so implementations in other languages have a
//     standard JSON Schema to validate against. A test fails when the file is out of date.
// PT: Escreve `schema.json` a partir do schema Zod, para que implementações em outras linguagens
//     tenham um JSON Schema padrão para validar. Um teste falha quando o arquivo está desatualizado.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { benchResultSchema } from "./contract";

export function renderSchema(): string {
	return `${JSON.stringify(z.toJSONSchema(benchResultSchema), null, "\t")}\n`;
}

if (import.meta.main) {
	writeFileSync(join(import.meta.dir, "..", "schema.json"), renderSchema());
}
