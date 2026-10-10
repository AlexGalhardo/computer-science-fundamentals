// EN: End to end, over the docker-compose network: real services, a real collector and the
//     real back ends. The test sends one slow and a few fast requests, then asks each back end
//     the question a person would ask. Telemetry is batched and arrives seconds later, so
//     every question is retried until it has its answer.
// PT: De ponta a ponta, pela rede do docker-compose: serviços reais, um collector real e os
//     back ends reais. O teste manda uma requisição lenta e algumas rápidas, e depois faz a
//     cada back end a pergunta que uma pessoa faria. A telemetria é enviada em lotes e chega
//     segundos depois, então cada pergunta é repetida até ter a sua resposta.
// ES: De extremo a extremo, por la red de docker-compose: servicios reales, un collector real y los
//     back ends reales. La prueba envía una petición lenta y algunas rápidas, y después le hace a
//     cada back end la pregunta que haría una persona. La telemetría se envía en lotes y llega
//     segundos después, así que cada pregunta se repite hasta tener su respuesta.

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

// EN: A trace id is 16 bytes, written as 32 hex digits. The SDK draws it at random, so one id in
//     sixteen starts with a zero, and ids that came from a 64-bit system start with sixteen of
//     them. Tempo's search prints ids without the leading zeros, and a comparison that ignores
//     this fails for exactly those traces. Waiting for a random id to start with a zero would
//     make the test flaky, so this request carries a `traceparent` with such an id, every run.
// PT: Um trace id tem 16 bytes, escritos como 32 dígitos hexadecimais. O SDK o sorteia, então
//     um id em cada dezesseis começa com zero, e ids vindos de um sistema de 64 bits começam com
//     dezesseis deles. A busca do Tempo imprime os ids sem os zeros à esquerda, e uma comparação
//     que ignora isso falha exatamente para esses traces. Esperar que um id sorteado comece com
//     zero deixaria o teste instável, então esta requisição leva um `traceparent` com um id
//     assim, em toda execução.
// ES: Un trace id tiene 16 bytes, escritos como 32 dígitos hexadecimales. El SDK lo sortea, así
//     que un id de cada dieciséis empieza con cero, y los ids que vienen de un sistema de 64 bits
//     empiezan con dieciséis de ellos. La búsqueda de Tempo imprime los ids sin los ceros a la
//     izquierda, y una comparación que ignora esto falla justo para esos traces. Esperar a que un
//     id sorteado empiece con cero volvería inestable la prueba, así que esta petición lleva un
//     `traceparent` con un id así, en cada ejecución.
const ZERO_PADDED_TRACE_ID = "00000000000000000123456789abcdef";
const ZERO_PADDED_TRACEPARENT = `00-${ZERO_PADDED_TRACE_ID}-1111111111111111-01`;

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
	const zeroPadded = await checkout(env.GATEWAY_URL, SLOW_SKU, ZERO_PADDED_TRACEPARENT);
	expect(zeroPadded.status).toBe(200);
	expect(zeroPadded.traceId).toBe(ZERO_PADDED_TRACE_ID);
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
		"the search finds a trace whose id starts with zeros, under its full 32 digits",
		async () => {
			const found = await eventually(
				async () => {
					const traces = await searchTraces(env.TEMPO_URL, SLOW_SPAN_QUERY);
					return traces.find((trace) => trace.traceID === ZERO_PADDED_TRACE_ID);
				},
				WAIT,
				"the trace with the zero-padded id in the Tempo search",
			);
			// EN: This trace has no root span in Tempo: the gateway span is the child of the span
			//     named in the `traceparent`, which belongs to a caller that reports nowhere.
			// PT: Este trace não tem span raiz no Tempo: o span do gateway é filho do span citado
			//     no `traceparent`, que pertence a um chamador que não reporta a lugar nenhum.
			// ES: Este trace no tiene span raíz en Tempo: el span del gateway es hijo del span citado
			//     en el `traceparent`, que pertenece a un llamador que no reporta a ningún lado.
			expect(found.rootServiceName).not.toBe("gateway");
			// EN: The id found by the search is the one that fetches the trace and filters the logs.
			// PT: O id encontrado pela busca é o mesmo que busca o trace e filtra os logs.
			// ES: El id encontrado por la búsqueda es el mismo que obtiene el trace y filtra los logs.
			const trace = await fetchTrace(env.TEMPO_URL, found.traceID);
			expect(trace.spans.map((span) => span.name)).toContain("warehouse.lookup");
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
			// ES: La petición entera tardó poco más de 800 ms, y un span es dueño de casi todo.
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
			// ES: `rate()` necesita que el counter crezca entre dos muestras de una serie que ya
			//     existe. Las primeras peticiones crearon las series; estas las hacen crecer.
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
			// ES: La petición lenta cayó en el bucket (0,5; 1], así que la estimación queda dentro de él.
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
