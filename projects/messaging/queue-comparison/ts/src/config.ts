// EN: Environment variables are external input, so they are validated at the edge. The defaults
//     point at the services of docker-compose, with obviously fake lab credentials.
// PT: Variáveis de ambiente são entrada externa, então são validadas na borda. Os padrões apontam
//     para os serviços do docker-compose, com credenciais de laboratório claramente falsas.

import { resolve } from "node:path";
import { z } from "zod";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

// EN: This project sends thousands of messages as fast as it can, so it must never point at
//     somebody else's broker. A host is accepted only when it is the loopback or a bare
//     docker-compose service name (no dot, so it cannot be a public domain or an IP address).
// PT: Este projeto envia milhares de mensagens o mais rápido que consegue, então nunca pode
//     apontar para o broker de outra pessoa. Um host só é aceito quando é o loopback ou um nome
//     simples de serviço do docker-compose (sem ponto, logo não é domínio público nem IP).
export function isLocalHost(host: string): boolean {
	return LOOPBACK.has(host) || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(host);
}

function localUrl(protocols: string[]): z.ZodType<string> {
	return z.url().refine(
		(value) => {
			const url = new URL(value);
			return protocols.includes(url.protocol) && isLocalHost(url.hostname);
		},
		{ error: `must be a ${protocols.join(" or ")} URL of a local service` },
	);
}

const localHostPort = z.string().refine(
	(value) => {
		const [host, port] = value.split(":");
		return host !== undefined && isLocalHost(host) && /^\d+$/.test(port ?? "");
	},
	{ error: "must be host:port of a local service" },
);

const envSchema = z.object({
	REDIS_URL: localUrl(["redis:"]).default("redis://redis:6379"),
	AMQP_URL: localUrl(["amqp:"]).default("amqp://lab:lab-fake-password@rabbitmq:5672"),
	KAFKA_BROKER: localHostPort.default("kafka:9092"),
	SQS_ENDPOINT: localUrl(["http:"]).default("http://localstack:4566"),
	// EN: LocalStack accepts any credentials. These are fake on purpose and never reach AWS.
	// PT: O LocalStack aceita qualquer credencial. Estas são falsas de propósito e nunca chegam à AWS.
	AWS_REGION: z.string().min(1).default("us-east-1"),
	AWS_ACCESS_KEY_ID: z.string().min(1).default("fake-lab-access-key"),
	AWS_SECRET_ACCESS_KEY: z.string().min(1).default("fake-lab-secret-key"),
	/** Folder of the mini-project, where `results/` lives. */
	PROJECT_DIR: z
		.string()
		.min(1)
		.default(resolve(import.meta.dir, "..", "..")),
	/** Comma-separated brokers for the demo. */
	BROKERS: z.string().default("bullmq,rabbitmq,kafka,sqs"),
	BENCH_MESSAGES: z.coerce.number().int().min(100).max(200_000).default(5000),
	BENCH_RUNS: z.coerce.number().int().min(1).max(20).default(3),
	/** Image tags, recorded with the results so the numbers can be reproduced. */
	REDIS_IMAGE: z.string().default("unknown"),
	RABBITMQ_IMAGE: z.string().default("unknown"),
	KAFKA_IMAGE: z.string().default("unknown"),
	LOCALSTACK_IMAGE: z.string().default("unknown"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	const known = Object.fromEntries(Object.keys(envSchema.shape).map((key) => [key, env[key]]));
	return envSchema.parse(known);
}
