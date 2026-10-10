// EN: `bun run demo`: runs the two behaviour experiments and the throughput benchmark on each
//     broker, one broker after the other, prints the tables and rewrites `results/results.md`.
// PT: `bun run demo`: roda os dois experimentos de comportamento e o benchmark de vazão em cada
//     broker, um broker depois do outro, mostra as tabelas e reescreve `results/results.md`.
// ES: `bun run demo`: ejecuta los dos experimentos de comportamiento y el benchmark de throughput
//     en cada broker, un broker después del otro, imprime las tablas y reescribe
//     `results/results.md`.

import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, release, totalmem } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import packageJson from "../package.json";
import { adapterFactory } from "./adapters";
import { loadConfig } from "./config";
import { orderingExperiment, redeliveryExperiment, throughputExperiment } from "./experiments";
import { type BrokerName, isBrokerName } from "./queue";
import { type BrokerResult, type Environment, renderReport } from "./report";

const config = loadConfig();
const brokers = config.BROKERS.split(",")
	.map((name) => name.trim())
	.filter(isBrokerName);
if (brokers.length === 0) {
	throw new Error("BROKERS has no known broker (bullmq, rabbitmq, kafka, sqs)");
}

const dependencies = z.record(z.string(), z.string()).parse(packageJson.dependencies);
const client = (name: string): string => `${name} ${dependencies[name] ?? "?"}`;

const results: BrokerResult[] = [];
for (const broker of brokers) {
	const factory = adapterFactory(broker, config);
	console.log(`${broker}: ordering`);
	const ordering = await orderingExperiment(factory);
	console.log(`${broker}: redelivery`);
	const redelivery = await redeliveryExperiment(broker, factory);
	console.log(`${broker}: throughput (${config.BENCH_RUNS} runs of ${config.BENCH_MESSAGES})`);
	const throughput = await throughputExperiment(factory, config.BENCH_MESSAGES, config.BENCH_RUNS);
	results.push({ broker, ordering, redelivery, throughput });
}

const images: Record<BrokerName, string> = {
	bullmq: config.REDIS_IMAGE,
	rabbitmq: config.RABBITMQ_IMAGE,
	kafka: config.KAFKA_IMAGE,
	sqs: config.LOCALSTACK_IMAGE,
};
const clients: Record<BrokerName, string> = {
	bullmq: client("bullmq"),
	rabbitmq: client("amqplib"),
	kafka: client("kafkajs"),
	sqs: client("@aws-sdk/client-sqs"),
};
const environment: Environment = {
	date: new Date().toISOString().slice(0, 10),
	cpu: cpus()[0]?.model ?? "unknown CPU",
	cores: cpus().length,
	memoryGb: totalmem() / 1024 ** 3,
	kernel: release(),
	bun: Bun.version,
	images,
	clients,
	command: "docker compose run --rm demo",
};

const report = renderReport(results, environment);
console.log(`\n${report}`);
const resultsDir = join(config.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "results.md"), report);
writeFileSync(join(resultsDir, "results.json"), `${JSON.stringify({ environment, results }, null, "\t")}\n`);
console.log(`written to ${join(resultsDir, "results.md")}`);
// EN: Client libraries keep sockets open; the work is done, so the process ends here.
// PT: As bibliotecas cliente mantêm sockets abertos; o trabalho terminou, então o processo acaba aqui.
// ES: Las bibliotecas cliente mantienen sockets abiertos; el trabajo terminó, así que el proceso
//     acaba aquí.
process.exit(0);
