import { readFileSync } from "node:fs";
import { z } from "zod";
import { ALGORITHMS } from "./limiter";

// EN: The table of cases is a JSON file read by two languages, so it is external input: it is
//     validated with a schema before any test trusts it. A typo such as "alowed" fails here
//     with a clear message instead of silently becoming `undefined`.
// PT: A tabela de casos é um arquivo JSON lido por duas linguagens, então é entrada externa:
//     ela é validada com um schema antes que qualquer teste confie nela. Um erro de digitação
//     como "alowed" falha aqui com uma mensagem clara, em vez de virar `undefined` em silêncio.
// ES: La tabla de casos es un archivo JSON leído por dos lenguajes, así que es entrada externa:
//     se valida con un schema antes de que cualquier prueba confíe en ella. Un error de tipeo
//     como "alowed" falla aquí con un mensaje claro, en lugar de volverse `undefined` en silencio.
const requestSchema = z.strictObject({
	atMs: z.number().int().min(0),
	allowed: z.boolean(),
	departAtMs: z.number().int().min(0).optional(),
});

const caseSchema = z.strictObject({
	name: z.string().min(1),
	algorithm: z.enum(ALGORITHMS),
	limit: z.number().int().min(1),
	windowMs: z.number().int().min(1),
	requests: z.array(requestSchema).min(1),
});

const fileSchema = z.strictObject({
	description: z.string(),
	cases: z.array(caseSchema).min(1),
});

export type LimiterCase = z.infer<typeof caseSchema>;

export function loadCases(path: string): LimiterCase[] {
	return fileSchema.parse(JSON.parse(readFileSync(path, "utf8"))).cases;
}
