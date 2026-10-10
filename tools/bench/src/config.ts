// EN: `bench.json` of a mini-project. It describes a grid: each target (a language with its
//     Docker image) runs each implementation at each size, once per variant.
// PT: `bench.json` de um mini-projeto. Ele descreve uma grade: cada alvo (uma linguagem com sua
//     imagem Docker) roda cada implementação em cada tamanho, uma vez por variante.
// ES: `bench.json` de un mini-proyecto. Describe una grilla: cada objetivo (un lenguaje con su
//     imagen Docker) ejecuta cada implementación en cada tamaño, una vez por variante.

import { z } from "zod";

const targetSchema = z.object({
	language: z.string().min(1),
	/** A pinned image, or a Dockerfile (relative to the project) to build. */
	image: z.string().min(1).optional(),
	dockerfile: z.string().min(1).optional(),
	/** Runs once inside the container before any measurement, for example a compile step. */
	build: z.string().min(1).optional(),
	/** Prints the runtime version, recorded with the results. */
	version: z.string().min(1),
	implementations: z.array(z.string().min(1)).min(1),
	/** Command template. `{implementation}`, `{n}` and `{variant}` are replaced. */
	command: z.string().min(1),
});

export const benchConfigSchema = z.object({
	project: z.string().min(1),
	runs: z.number().int().min(1).default(5),
	warmup: z.number().int().min(0).default(1),
	sizes: z.array(z.number().int().min(0)).min(1),
	variants: z.array(z.string().min(1)).min(1).default(["default"]),
	/** Largest `n` allowed per implementation, used to cap quadratic algorithms. */
	maxN: z.record(z.string(), z.number().int().min(0)).default({}),
	targets: z.array(targetSchema).min(1),
});

export type BenchConfig = z.infer<typeof benchConfigSchema>;
export type BenchTarget = z.infer<typeof targetSchema>;

export interface BenchCase {
	language: string;
	implementation: string;
	variant: string;
	n: number;
	command: string;
}

// EN: Expands the grid into a flat list. The order is fixed so two runs of the same
//     configuration always produce the same rows in the same order.
// PT: Expande a grade em uma lista plana. A ordem é fixa para que duas execuções da mesma
//     configuração produzam sempre as mesmas linhas na mesma ordem.
// ES: Expande la grilla en una lista plana. El orden es fijo para que dos ejecuciones de la misma
//     configuración produzcan siempre las mismas filas en el mismo orden.
export function expandCases(config: BenchConfig, target: BenchTarget): BenchCase[] {
	const cases: BenchCase[] = [];
	for (const implementation of target.implementations) {
		for (const variant of config.variants) {
			for (const n of config.sizes) {
				const cap = config.maxN[implementation];
				if (cap !== undefined && n > cap) {
					continue;
				}
				const command = target.command
					.replaceAll("{implementation}", implementation)
					.replaceAll("{variant}", variant)
					.replaceAll("{n}", String(n));
				cases.push({ language: target.language, implementation, variant, n, command });
			}
		}
	}
	return cases;
}
