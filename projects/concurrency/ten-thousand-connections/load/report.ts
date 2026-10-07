// EN: Reads the summary that each k6 run left in /results and writes one comparison table in
//     /out/results.md, with the machine and the exact command, so the numbers can be reproduced.
// PT: Lê o resumo que cada execução do k6 deixou em /results e escreve uma tabela comparativa
//     em /out/results.md, com a máquina e o comando exato, para os números serem reproduzíveis.

import { readFileSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";

interface Summary {
	name: string;
	target: string;
	runtime: string;
	connectionsAsked: number;
	connectionsHeld: number;
	inFlightAtProbe: number;
	rssIdleKb: number;
	rssHoldingKb: number;
	kbPerConnection: number;
	holdSeconds: number;
	rampSeconds: number;
	holdFailedRate: number;
	echo: { ratePerSecond: number; count: number; p50Ms: number; p95Ms: number; p99Ms: number; maxMs: number };
}

// EN: The summaries are files written by another program, so every field is checked.
// PT: Os resumos são arquivos escritos por outro programa, então cada campo é conferido.
function parseSummary(file: string): Summary {
	const data: unknown = JSON.parse(readFileSync(file, "utf8"));
	const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
	if (!isRecord(data) || !isRecord(data.echo)) {
		throw new Error(`${file}: not a k6 summary of this project`);
	}
	const text = (source: Record<string, unknown>, key: string): string => {
		const value = source[key];
		if (typeof value !== "string") {
			throw new Error(`${file}: "${key}" must be a string`);
		}
		return value;
	};
	const number = (source: Record<string, unknown>, key: string): number => {
		const value = source[key];
		if (typeof value !== "number" || !Number.isFinite(value)) {
			throw new Error(`${file}: "${key}" must be a number, got ${JSON.stringify(value)}`);
		}
		return value;
	};
	return {
		name: text(data, "name"),
		target: text(data, "target"),
		runtime: text(data, "runtime"),
		connectionsAsked: number(data, "connectionsAsked"),
		connectionsHeld: number(data, "connectionsHeld"),
		inFlightAtProbe: number(data, "inFlightAtProbe"),
		rssIdleKb: number(data, "rssIdleKb"),
		rssHoldingKb: number(data, "rssHoldingKb"),
		kbPerConnection: number(data, "kbPerConnection"),
		holdSeconds: number(data, "holdSeconds"),
		rampSeconds: number(data, "rampSeconds"),
		holdFailedRate: number(data, "holdFailedRate"),
		echo: {
			ratePerSecond: number(data.echo, "ratePerSecond"),
			count: number(data.echo, "count"),
			p50Ms: number(data.echo, "p50Ms"),
			p95Ms: number(data.echo, "p95Ms"),
			p99Ms: number(data.echo, "p99Ms"),
			maxMs: number(data.echo, "maxMs"),
		},
	};
}

const resultsDir = process.env.RESULTS_DIR ?? "/results";
const outDir = process.env.OUT_DIR ?? "/out";
const summaries = ["ts", "go", "elixir"].map((name) => parseSummary(join(resultsDir, `${name}.json`)));
const first = summaries[0];
if (first === undefined) {
	throw new Error("no summary found");
}

const mib = (kb: number): string => (kb / 1024).toFixed(1);
const ms = (value: number): string => value.toFixed(2);
const model = cpus()[0]?.model.trim() ?? "unknown";

const lines = [
	"# Ten thousand connections: results",
	"",
	`Generated at ${new Date().toISOString()} by \`docker compose --profile load run --rm report\`${
		first.connectionsAsked === 10000 ? "" : ` with \`CONNECTIONS=${first.connectionsAsked}\``
	}.`,
	"",
	"## Machine",
	"",
	`- CPU seen by Docker: ${model}, ${cpus().length} logical cores`,
	`- Memory seen by Docker: ${(totalmem() / 1024 ** 3).toFixed(1)} GiB`,
	"- Load generator: grafana/k6:2.3.0, on the same machine and docker network as the servers",
	...summaries.map((summary) => `- ${summary.name}: ${summary.runtime}`),
	"",
	"## Scenario",
	"",
	`k6 opens ${first.connectionsAsked} connections over ${first.rampSeconds} seconds. Each one is a \`GET /delay?ms=${first.holdSeconds * 1000}\`, so it stays open and idle for ${first.holdSeconds} seconds. While they are held, k6 sends ${first.echo.ratePerSecond} \`POST /echo\` per second and records the latency, and one \`GET /stats\` reads the memory of the server.`,
	"",
	"## Memory",
	"",
	"`held` counts the connections answered with 200 after the full wait. `open at probe` is the number of requests in flight that the server itself reported. Memory per connection is the growth of the resident memory divided by `open at probe`.",
	"",
	"| Server | Asked | Held | Open at probe | Idle memory (MiB) | Memory while holding (MiB) | Memory per connection (KiB) |",
	"| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
	...summaries.map(
		(s) =>
			`| ${s.name} | ${s.connectionsAsked} | ${s.connectionsHeld} | ${s.inFlightAtProbe} | ${mib(s.rssIdleKb)} | ${mib(s.rssHoldingKb)} | ${s.kbPerConnection.toFixed(1)} |`,
	),
	"",
	"## Latency of `POST /echo` while the connections are held",
	"",
	"| Server | Requests | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) |",
	"| --- | ---: | ---: | ---: | ---: | ---: |",
	...summaries.map(
		(s) =>
			`| ${s.name} | ${s.echo.count} | ${ms(s.echo.p50Ms)} | ${ms(s.echo.p95Ms)} | ${ms(s.echo.p99Ms)} | ${ms(s.echo.maxMs)} |`,
	),
	"",
	"One run per server, on a shared machine. Read the numbers as orders of magnitude, and run the scenario again before comparing two servers that are close.",
	"",
];

writeFileSync(join(outDir, "results.md"), lines.join("\n"));
writeFileSync(join(outDir, "results.json"), `${JSON.stringify(summaries, null, "\t")}\n`);
console.log(lines.join("\n"));
