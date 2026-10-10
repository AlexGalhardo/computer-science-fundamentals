// EN: The benchmark contract. Every implementation, in any language, prints one JSON object in
//     this shape on its last line of output. A shared shape is what makes a C++ result and a
//     Python result comparable in the same table.
// PT: O contrato de benchmark. Toda implementação, em qualquer linguagem, imprime um objeto JSON
//     neste formato na última linha da saída. Um formato comum é o que torna um resultado em C++
//     e um em Python comparáveis na mesma tabela.
// ES: El contrato de benchmark. Toda implementación, en cualquier lenguaje, imprime un objeto JSON
//     con este formato en la última línea de la salida. Un formato común es lo que hace que un
//     resultado en C++ y uno en Python sean comparables en la misma tabla.

import { z } from "zod";

export const benchResultSchema = z
	.object({
		/** Size of the input the program processed. */
		n: z.number().int().min(0),
		/** Time of the measured section only, without start-up and input parsing. */
		elapsedMs: z.number().min(0),
		/** Peak resident memory of the process, in kibibytes. */
		memoryKb: z.number().min(0),
		language: z.string().min(1),
		implementation: z.string().min(1),
		/** Optional digest of the output, to prove that implementations agree. */
		checksum: z.string().min(1).optional(),
	})
	.strict();

export type BenchResult = z.infer<typeof benchResultSchema>;

// EN: Programs may log before the result, so only the last non-empty line is parsed.
// PT: Os programas podem imprimir logs antes do resultado, então só a última linha não vazia é lida.
// ES: Los programas pueden imprimir logs antes del resultado, así que solo se lee la última línea no vacía.
export function parseBenchOutput(output: string): BenchResult {
	const line = output
		.split(/\r?\n/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.at(-1);
	if (line === undefined) {
		throw new Error("the program printed nothing");
	}
	let data: unknown;
	try {
		data = JSON.parse(line);
	} catch {
		throw new Error(`the last line of output is not JSON: ${line}`);
	}
	const parsed = benchResultSchema.safeParse(data);
	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
		throw new Error(`the output breaks the benchmark contract (${issues.join("; ")})`);
	}
	return parsed.data;
}
