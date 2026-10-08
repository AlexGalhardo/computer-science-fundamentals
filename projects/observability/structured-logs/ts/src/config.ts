// EN: Environment variables are external input. They are validated once, at start-up, so a
//     typo stops the service with a clear message instead of failing inside a request.
// PT: Variáveis de ambiente são entrada externa. Elas são validadas uma vez, na inicialização,
//     então um erro de digitação para o serviço com uma mensagem clara em vez de falhar dentro
//     de uma requisição.

import { z } from "zod";

export const LOG_FORMATS = ["json", "text"] as const;
export type LogFormat = (typeof LOG_FORMATS)[number];

const serviceEnvSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	// EN: The one switch of the lab: the same services write structured JSON or free text.
	// PT: A única chave do laboratório: os mesmos serviços escrevem JSON estruturado ou texto livre.
	LOG_FORMAT: z.enum(LOG_FORMATS).default("json"),
	LOKI_URL: z.url().default("http://loki:3100"),
	BROKER_URL: z.string().regex(/^amqp:\/\//, "must be an amqp:// URL"),
	QUEUE: z
		.string()
		.regex(/^[a-z0-9.-]{1,60}$/)
		.default("orders.json"),
	ORDERS_URL: z.url().default("http://orders-json:3000"),
});

export type ServiceEnv = z.infer<typeof serviceEnvSchema>;

export function readServiceEnv(env: Record<string, string | undefined> = process.env): ServiceEnv {
	return serviceEnvSchema.parse(env);
}

const labEnvSchema = z.object({
	API_JSON_URL: z.url().default("http://api-json:3000"),
	API_TEXT_URL: z.url().default("http://api-text:3000"),
	LOKI_URL: z.url().default("http://loki:3100"),
	PROJECT_DIR: z.string().min(1).default("/project"),
});

export type LabEnv = z.infer<typeof labEnvSchema>;

export function readLabEnv(env: Record<string, string | undefined> = process.env): LabEnv {
	return labEnvSchema.parse(env);
}
