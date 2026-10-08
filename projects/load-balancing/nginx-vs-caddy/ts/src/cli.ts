import { mkdirSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import type { OutageMode } from "./api/app";
import { type LabConfig, loadConfig, type ProxyName } from "./lab/config";
import { ALGORITHMS, type FailureConfig, runDistribution, runFailure } from "./lab/experiments";
import {
	type DistributionResult,
	distributionMarkdown,
	type FailureResult,
	failureMarkdown,
	type Results,
} from "./lab/report";

// EN: `bun run src/cli.ts [distribution|failure|all]`
//     Runs the experiments against the two proxies and writes the tables to OUT_DIR. The
//     configuration is read first, so a target that is not local stops the program before any
//     request is sent.
// PT: `bun run src/cli.ts [distribution|failure|all]`
//     Roda os experimentos contra os dois proxies e escreve as tabelas em OUT_DIR. A
//     configuração é lida primeiro, então um alvo que não é local para o programa antes de
//     qualquer requisição ser enviada.

const PROXIES: ProxyName[] = ["nginx", "caddy"];

async function distribution(config: LabConfig): Promise<DistributionResult[]> {
	const results: DistributionResult[] = [];
	for (const proxy of PROXIES) {
		for (const algorithm of ALGORITHMS) {
			const runs = [];
			for (let run = 0; run < config.repetitions; run++) {
				runs.push(await runDistribution(config, proxy, algorithm));
			}
			console.log(`${proxy} ${algorithm}: ${runs.map((run) => run.counts.join("/")).join("  ")}`);
			results.push({ proxy, algorithm, runs });
		}
	}
	return results;
}

async function failure(config: LabConfig): Promise<FailureResult[]> {
	const results: FailureResult[] = [];
	const modes: OutageMode[] = ["crash", "freeze"];
	const configs: FailureConfig[] = ["default", "tuned"];
	for (const mode of modes) {
		for (const proxy of PROXIES) {
			for (const failureConfig of configs) {
				const runs = [];
				for (let run = 0; run < config.repetitions; run++) {
					runs.push(await runFailure(config, proxy, failureConfig, mode));
				}
				console.log(
					`${proxy} ${failureConfig} ${mode}: errors ${runs.map((run) => run.errors).join(", ")}; recovery ms ${runs.map((run) => run.recoveryMs).join(", ")}`,
				);
				results.push({ proxy, config: failureConfig, mode, runs });
			}
		}
	}
	return results;
}

async function main(): Promise<void> {
	const command = process.argv[2] ?? "all";
	if (!["distribution", "failure", "all"].includes(command)) {
		throw new Error("usage: bun run src/cli.ts [distribution|failure|all]");
	}
	const config = loadConfig(process.env);
	const results: Results = {
		generatedAt: new Date().toISOString(),
		machine: {
			cpu: cpus()[0]?.model.trim() ?? "unknown",
			cores: cpus().length,
			memoryGiB: totalmem() / 2 ** 30,
			bun: Bun.version,
			images: config.images,
		},
		distribution: command === "failure" ? [] : await distribution(config),
		failure: command === "distribution" ? [] : await failure(config),
	};
	mkdirSync(config.outDir, { recursive: true });
	if (results.distribution.length > 0) {
		await Bun.write(join(config.outDir, "distribution.md"), distributionMarkdown(results));
		await Bun.write(
			join(config.outDir, "distribution.json"),
			`${JSON.stringify(results.distribution, null, "\t")}\n`,
		);
	}
	if (results.failure.length > 0) {
		await Bun.write(join(config.outDir, "failure.md"), failureMarkdown(results));
		await Bun.write(join(config.outDir, "failure.json"), `${JSON.stringify(results.failure, null, "\t")}\n`);
	}
	console.log(`results written to ${config.outDir}`);
	const failed = results.distribution.filter((result) => result.runs.some((run) => !run.ok));
	if (failed.length > 0) {
		throw new Error(
			`distribution outside the tolerance: ${failed.map((r) => `${r.proxy} ${r.algorithm}`).join(", ")}`,
		);
	}
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
