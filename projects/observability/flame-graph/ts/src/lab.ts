// EN: What the lab commands (capture, flame, bench) share: the environment, validated once,
//     and the description of the two services under study.
// PT: O que os comandos do laboratório (capture, flame, bench) compartilham: o ambiente,
//     validado uma vez, e a descrição dos dois serviços estudados.
// ES: Lo que comparten los comandos del laboratorio (capture, flame, bench): el entorno,
//     validado una vez, y la descripción de los dos servicios estudiados.

import { join } from "node:path";
import { z } from "zod";

const labEnvSchema = z.object({
	GO_URL: z.url().default("http://go-server:8080"),
	TS_URL: z.url().default("http://ts-server:8080"),
	PROJECT_DIR: z.string().min(1).default("/project"),
	// EN: `results` is committed. The setup scripts use `out`, which git ignores, so running
	//     the tests never changes the committed pictures.
	// PT: `results` é versionada. Os scripts de setup usam `out`, que o git ignora, então rodar
	//     os testes nunca altera as figuras versionadas.
	// ES: `results` está versionada. Los scripts de setup usan `out`, que git ignora, así que ejecutar
	//     las pruebas nunca altera las figuras versionadas.
	OUT_DIR: z.enum(["results", "out"]).default("results"),
	PROFILE_SECONDS: z.coerce.number().int().min(1).max(30).default(5),
	LOAD_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(16),
	BENCH_RUNS: z.coerce.number().int().min(3).max(10).default(5),
	BENCH_SECONDS: z.coerce.number().int().min(1).max(60).default(5),
	WARMUP_SECONDS: z.coerce.number().int().min(1).max(30).default(2),
});

export type LabEnv = z.infer<typeof labEnvSchema> & { outDir: string; profilesDir: string };

export function readLabEnv(env: Record<string, string | undefined> = process.env): LabEnv {
	const parsed = labEnvSchema.parse(env);
	return {
		...parsed,
		outDir: join(parsed.PROJECT_DIR, parsed.OUT_DIR),
		// Raw profiles are binary and large: they stay out of git.
		profilesDir: join(parsed.PROJECT_DIR, "profiles"),
	};
}

export const VARIANTS = ["before", "after"] as const;
export type Variant = (typeof VARIANTS)[number];

export interface Subject {
	language: "go" | "ts";
	label: string;
	baseUrl: string;
	/** Path of the endpoint under load, after the variant: `/before/report`. */
	endpoint: string;
	/** Frame of the HTTP handler of each variant, as it appears in the profile. */
	handler: Record<Variant, string>;
	/** The function the "before" flame graph must point at. */
	hotFrame: string;
}

export function subjects(env: LabEnv): Subject[] {
	return [
		{
			language: "go",
			label: "Go",
			baseUrl: env.GO_URL,
			endpoint: "report",
			handler: { before: "main.handleReportBefore", after: "main.handleReportAfter" },
			hotFrame: "flame-graph/report.compileRegex",
		},
		{
			language: "ts",
			label: "TypeScript (Bun)",
			baseUrl: env.TS_URL,
			endpoint: "quote",
			handler: { before: "handleQuoteBefore", after: "handleQuoteAfter" },
			hotFrame: "buildPriceIndex",
		},
	];
}

export function endpointUrl(subject: Subject, variant: Variant): string {
	return `${subject.baseUrl.replace(/\/+$/, "")}/${variant}/${subject.endpoint}`;
}
