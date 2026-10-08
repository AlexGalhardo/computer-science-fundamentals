// EN: Environment variables are external input: a typo in a URL should stop the service at
//     start-up with a clear message, not fail later inside a request. Zod validates them once.
// PT: Variáveis de ambiente são entrada externa: um erro de digitação em uma URL deve parar o
//     serviço na inicialização com uma mensagem clara, e não falhar depois, dentro de uma
//     requisição. O Zod as valida uma única vez.

import { z } from "zod";

const serviceEnvSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	// EN: The standard OpenTelemetry variable. The services only know the collector, never the
	//     back ends: swapping Tempo for another trace store changes no line of application code.
	// PT: A variável padrão do OpenTelemetry. Os serviços só conhecem o collector, nunca os
	//     back ends: trocar o Tempo por outro armazenamento de traces não muda nenhuma linha
	//     do código da aplicação.
	OTEL_EXPORTER_OTLP_ENDPOINT: z.url().default("http://collector:4318"),
	ORDERS_URL: z.url().default("http://orders:3000"),
	INVENTORY_URL: z.url().default("http://inventory:3000"),
});

export type ServiceEnv = z.infer<typeof serviceEnvSchema>;

export function readServiceEnv(env: Record<string, string | undefined> = process.env): ServiceEnv {
	return serviceEnvSchema.parse(env);
}

const labEnvSchema = z.object({
	GATEWAY_URL: z.url().default("http://gateway:3000"),
	TEMPO_URL: z.url().default("http://tempo:3200"),
	PROMETHEUS_URL: z.url().default("http://prometheus:9090"),
	LOKI_URL: z.url().default("http://loki:3100"),
	GRAFANA_URL: z.url().default("http://grafana:3000"),
	PROJECT_DIR: z.string().min(1).default("/project"),
});

export type LabEnv = z.infer<typeof labEnvSchema>;

export function readLabEnv(env: Record<string, string | undefined> = process.env): LabEnv {
	return labEnvSchema.parse(env);
}

/** The SKU that makes the inventory service take its slow path. The Go service has the same default. */
export const SLOW_SKU = "slow-widget";
