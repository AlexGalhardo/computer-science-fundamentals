// EN: End to end, over the docker-compose network: real services, a real collector and the
//     real back ends. The test sends one slow and a few fast requests, then asks each back end
//     the question a person would ask. Telemetry is batched and arrives seconds later, so
//     every question is retried until it has its answer.
// PT: De ponta a ponta, pela rede do docker-compose: serviços reais, um collector real e os
//     back ends reais. O teste manda uma requisição lenta e algumas rápidas, e depois faz a
//     cada back end a pergunta que uma pessoa faria. A telemetria é enviada em lotes e chega
//     segundos depois, então cada pergunta é repetida até ter a sua resposta.

import { beforeAll, describe, expect, test } from "bun:test";
import { readLabEnv, SLOW_SKU } from "../src/config";
import {
	checkout,
	eventually,
	fetchDashboard,
	fetchTrace,
	logsOfTraceQuery,
	lokiQuery,
	P99_QUERY,
	promQuery,
	SLOW_SPAN_QUERY,
	searchTraces,
	selfTimes,
	waitReady,
} from "../src/lab";

const env = readLabEnv();
const WAIT = 300_000;
let slowTraceId = "";
let fastTraceId = "";

beforeAll(async () => {
	await Promise.all([
		waitReady(`${env.TEMPO_URL}/ready`, 240_000),
		waitReady(`${env.LOKI_URL}/ready`, 240_000),
		waitReady(`${env.PROMETHEUS_URL}/-/ready`, 240_000),
	]);
	for (const sku of ["blue-pen", "red-pen", "notebook", "stapler"]) {
		const fast = await checkout(env.GATEWAY_URL, sku);
		expect(fast.status).toBe(200);
		fastTraceId = fast.traceId;
	}
	const slow = await checkout(env.GATEWAY_URL, SLOW_SKU);
	expect(slow.status).toBe(200);
	expect(slow.durationMs).toBeGreaterThanOrEqual(800);
	slowTraceId = slow.traceId;
}, 300_000);

describe("traces (Tempo)", () => {
	test(
		"one TraceQL query finds the slow request and not the fast ones",
		async () => {
			const found = await eventually(
				async () => {
					const traces = await searchTraces(env.TEMPO_URL, SLOW_SPAN_QUERY);
					return traces.some((trace) => trace.traceID === slowTraceId) ? traces : undefined;
				},
				WAIT,
				"the slow trace in the Tempo search",
			);
			expect(found.map((trace) => trace.traceID)).not.toContain(fastTraceId);
			expect(found.find((trace) => trace.traceID === slowTraceId)?.rootServiceName).toBe("gateway");
		},
		WAIT + 10_000,
	);

	test(
		"a single trace crosses the three services and shows the slow span",
		async () => {
			const spans = await eventually(
				async () => {
					const trace = await fetchTrace(env.TEMPO_URL, slowTraceId);
					return trace.spans.length >= 7 ? trace.spans : undefined;
				},
				WAIT,
				"the seven spans of the slow trace",
			);
			expect(new Set(spans.map((span) => span.service))).toEqual(new Set(["gateway", "orders", "inventory"]));
			expect(spans.map((span) => span.name)).toEqual([
				"GET /checkout",
				"POST orders",
				"POST /orders",
				"orders.price",
				"GET inventory",
				"GET /stock/{sku}",
				"warehouse.lookup",
			]);

			// EN: The whole request took a bit over 800 ms, and one span owns almost all of it.
			// PT: A requisição inteira levou pouco mais de 800 ms, e um span é dono de quase tudo.
			const self = selfTimes(spans);
			const culprit = spans.reduce((a, b) => ((self.get(a.spanId) ?? 0) >= (self.get(b.spanId) ?? 0) ? a : b));
			expect(culprit.name).toBe("warehouse.lookup");
			expect(culprit.service).toBe("inventory");
			expect(culprit.durationMs).toBeGreaterThanOrEqual(800);
			expect(culprit.attributes["warehouse.sku"]).toBe(SLOW_SKU);
			expect(culprit.attributes["warehouse.scan"]).toBe("full");
			const root = spans[0];
			expect((self.get(culprit.spanId) ?? 0) / (root?.durationMs ?? 1)).toBeGreaterThan(0.9);
		},
		WAIT + 10_000,
	);
});

describe("metrics (Prometheus)", () => {
	test(
		"the duration histogram of the three services arrives, with no sku label",
		async () => {
			const counts = await eventually(
				async () => {
					const samples = await promQuery(
						env.PROMETHEUS_URL,
						"sum by (service_name) (http_server_request_duration_seconds_count)",
					);
					return samples.length === 3 && samples.every((sample) => sample.value >= 5) ? samples : undefined;
				},
				WAIT,
				"five requests counted for each of the three services",
			);
			expect(counts.map((sample) => sample.labels.service_name).sort()).toEqual([
				"gateway",
				"inventory",
				"orders",
			]);

			const series = await promQuery(env.PROMETHEUS_URL, "http_server_request_duration_seconds_count");
			for (const sample of series) {
				expect(Object.keys(sample.labels).some((label) => label.includes("sku"))).toBe(false);
			}
		},
		WAIT + 10_000,
	);

	test(
		"the 99th percentile shows the slow request in every service on the path",
		async () => {
			// EN: `rate()` needs the counter to grow between two samples of a series that already
			//     exists. The first requests created the series; these make them grow.
			// PT: `rate()` precisa que o counter cresça entre duas amostras de uma série que já
			//     existe. As primeiras requisições criaram as séries; estas as fazem crescer.
			await checkout(env.GATEWAY_URL, "blue-pen");
			await checkout(env.GATEWAY_URL, SLOW_SKU);
			const p99 = await eventually(
				async () => {
					const samples = await promQuery(env.PROMETHEUS_URL, P99_QUERY);
					return samples.length === 3 && samples.every((sample) => sample.value > 0.5) ? samples : undefined;
				},
				WAIT,
				"a p99 above 0.5 s for the three services",
			);
			// EN: The slow request fell in the bucket (0.5, 1], so the estimate stays inside it.
			// PT: A requisição lenta caiu no bucket (0,5; 1], então a estimativa fica dentro dele.
			for (const sample of p99) {
				expect(sample.value).toBeLessThanOrEqual(1);
			}
		},
		WAIT + 10_000,
	);
});

describe("logs (Loki)", () => {
	test(
		"the trace id finds the log lines of that request in the three services, and the reason",
		async () => {
			const lines = await eventually(
				async () => {
					const found = await lokiQuery(env.LOKI_URL, logsOfTraceQuery(slowTraceId));
					return new Set(found.map((line) => line.service)).size === 3 && found.length >= 5
						? found
						: undefined;
				},
				WAIT,
				"log lines of the slow trace from the three services",
			);
			for (const line of lines) {
				expect(line.fields.trace_id).toBe(slowTraceId);
			}
			const warning = lines.find((line) => line.severity === "WARN");
			expect(warning?.service).toBe("inventory");
			expect(warning?.message).toContain("full shelf scan");

			const fastLines = await lokiQuery(env.LOKI_URL, logsOfTraceQuery(fastTraceId));
			expect(fastLines.some((line) => line.severity === "WARN")).toBe(false);
		},
		WAIT + 10_000,
	);
});

describe("dashboards as code (Grafana)", () => {
	test("the committed dashboard is loaded at start-up, with no click", async () => {
		await waitReady(`${env.GRAFANA_URL}/api/health`, 280_000);
		const dashboard = await eventually(
			async () => fetchDashboard(env.GRAFANA_URL, "three-signals"),
			60_000,
			"the provisioned dashboard",
		);
		expect(dashboard.meta.provisioned).toBe(true);
		expect(dashboard.dashboard.panels.map((panel) => panel.title)).toEqual([
			"Rate: requests per second",
			"Errors: share of 5xx responses",
			"Duration: 99th percentile",
			"Traces with a span slower than 500 ms",
			"One trace: where the time goes",
			"Warnings and errors",
		]);
	}, 360_000);
});
