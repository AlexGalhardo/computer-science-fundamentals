import type { OutageMode } from "../api/app";
import { type FailureSummary, spread, TOLERANCE } from "./analysis";
import { INSTANCES, type ProxyName } from "./config";
import {
	type Algorithm,
	DISTRIBUTION_DEFAULTS,
	type DistributionRun,
	FAILURE_DEFAULTS,
	type FailureConfig,
	PLANS,
} from "./experiments";

export interface Machine {
	cpu: string;
	cores: number;
	memoryGiB: number;
	bun: string;
	images: Record<ProxyName, string>;
}

export interface DistributionResult {
	proxy: ProxyName;
	algorithm: Algorithm;
	runs: DistributionRun[];
}

export interface FailureResult {
	proxy: ProxyName;
	config: FailureConfig;
	mode: OutageMode;
	runs: FailureSummary[];
}

export interface Results {
	generatedAt: string;
	machine: Machine;
	distribution: DistributionResult[];
	failure: FailureResult[];
}

const percent = (share: number): string => `${(share * 100).toFixed(1)}%`;

function range(values: number[], digits = 0): string {
	const { median, min, max } = spread(values);
	return `${median.toFixed(digits)} (${min.toFixed(digits)} to ${max.toFixed(digits)})`;
}

function machineSection(machine: Machine, command: string): string[] {
	return [
		"## Machine",
		"",
		`- CPU seen by Docker: ${machine.cpu}, ${machine.cores} logical cores`,
		`- Memory seen by Docker: ${machine.memoryGiB.toFixed(1)} GiB`,
		`- Proxies: ${machine.images.nginx} and ${machine.images.caddy}`,
		`- Back ends and load generator: bun ${machine.bun}, on the same machine and docker network as the proxies`,
		`- Command: \`${command}\``,
		"",
	];
}

export function distributionMarkdown(results: Results): string {
	const options = DISTRIBUTION_DEFAULTS;
	const lines = [
		"# NGINX against Caddy: distribution of requests",
		"",
		`Generated at ${results.generatedAt}.`,
		"",
		...machineSection(results.machine, "docker compose --profile lab run --rm lab"),
		"## Method",
		"",
		`Each run sends ${options.total} requests through one route of one proxy, with ${options.concurrency} requests in flight (closed loop), and counts which instance answered each one by the \`X-Instance\` header. The check passes when every observed share is within ${TOLERANCE * 100} percentage points of the expected share. Shares are the median of the runs, with the smallest and largest value in parentheses.`,
		"",
		"| Proxy | Algorithm | Expected | api-1 | api-2 | api-3 | Worst distance | Check |",
		"| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
	];
	for (const result of results.distribution) {
		const plan = PLANS[result.algorithm];
		const column = (index: number): string => {
			const { median, min, max } = spread(result.runs.map((run) => run.shares[index] ?? 0));
			return `${percent(median)} (${percent(min)} to ${percent(max)})`;
		};
		const worst = Math.max(...result.runs.map((run) => run.worst));
		const ok = result.runs.every((run) => run.ok);
		lines.push(
			`| ${result.proxy} | ${result.algorithm} | ${plan.expected.map(percent).join(" / ")} | ${INSTANCES.map((_, index) => column(index)).join(" | ")} | ${(worst * 100).toFixed(1)} points | ${ok ? "pass" : "FAIL"} |`,
		);
	}
	lines.push("", "## Why these shares are expected", "");
	for (const [algorithm, plan] of Object.entries(PLANS)) {
		lines.push(`- **${algorithm}**: ${plan.why}.`);
	}
	lines.push("", "## Stickiness of ip-hash", "");
	lines.push(
		`Each of the ${options.clients} simulated clients sends ${options.total / options.clients} requests. A client is sticky when all of them reached the same instance.`,
		"",
		"| Proxy | Sticky clients, per run |",
		"| --- | --- |",
	);
	for (const result of results.distribution.filter((item) => item.algorithm === "ip-hash")) {
		const cells = result.runs.map((run) => `${run.sticky?.sticky ?? 0} of ${run.sticky?.clients ?? 0}`);
		lines.push(`| ${result.proxy} | ${cells.join(", ")} |`);
	}
	lines.push("");
	return lines.join("\n");
}

export function failureMarkdown(results: Results): string {
	const options = FAILURE_DEFAULTS;
	const requests = (options.ratePerSecond * options.durationMs) / 1000;
	const lines = [
		"# NGINX against Caddy: one instance fails during load",
		"",
		`Generated at ${results.generatedAt}.`,
		"",
		...machineSection(results.machine, "docker compose --profile lab run --rm lab"),
		"## Method",
		"",
		`Each run sends ${options.ratePerSecond} requests per second for ${options.durationMs / 1000} s (${requests} requests, open loop) through one proxy. At ${options.outageAtMs / 1000} s the instance \`api-3\` fails for ${options.outageMs / 1000} s and then comes back. The client gives up on a request after ${options.timeoutMs / 1000} s.`,
		"",
		"- **crash**: the instance closes its listening socket and every open connection, like a process that died. New connections are refused immediately.",
		"- **freeze**: the instance keeps accepting connections and answers nothing until the failure ends, like a process stuck in a lock or in a long pause.",
		"- **default**: three upstreams and round robin, nothing else. **tuned**: timeouts, retries and health checks, as written in `nginx/nginx.conf` and `caddy/Caddyfile`.",
		"- **Errors**: requests with no answer or an answer other than 200.",
		`- **Slow**: requests answered with 200 after more than ${options.slowMs} ms.`,
		"- **Recovery time**: from the failure to the moment the last lost or slow request was sent. Zero means that no client noticed.",
		"- **Back in rotation**: from the return of the instance to its first answer through the proxy.",
		"",
		"Every cell is the median of the runs, with the smallest and largest value in parentheses.",
		"",
		"| Proxy | Configuration | Failure | Runs | Errors | Slow | Recovery time (ms) | Back in rotation (ms) |",
		"| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
	];
	for (const result of results.failure) {
		const back = result.runs.map((run) => run.backInRotationMs);
		const known = back.filter((value): value is number => value !== null);
		const backCell =
			known.length === back.length ? range(known) : `not within the run (${known.length} of ${back.length} runs)`;
		lines.push(
			`| ${result.proxy} | ${result.config} | ${result.mode} | ${result.runs.length} | ${range(result.runs.map((run) => run.errors))} | ${range(result.runs.map((run) => run.slow))} | ${range(result.runs.map((run) => run.recoveryMs))} | ${backCell} |`,
		);
	}
	lines.push("");
	return lines.join("\n");
}
