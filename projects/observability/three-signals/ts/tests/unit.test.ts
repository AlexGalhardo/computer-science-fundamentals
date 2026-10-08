// EN: Unit tests with the real SDK and in-memory exporters: no collector, no network. Two
//     in-process "services" call each other through a fake `fetch`, which is enough to prove
//     that the trace context crosses an HTTP hop in a header.
// PT: Testes unitários com o SDK real e exporters em memória: sem collector, sem rede. Dois
//     "serviços" no mesmo processo chamam um ao outro por um `fetch` falso, o que basta para
//     provar que o contexto do trace atravessa um salto HTTP em um cabeçalho.

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SpanKind } from "@opentelemetry/api";
import { InMemoryLogRecordExporter, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import {
	AggregationTemporality,
	DataPointType,
	InMemoryMetricExporter,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { gatewayApp, ordersApp } from "../src/apps";
import { readServiceEnv } from "../src/config";
import { flattenTrace, selfTimes, waterfall } from "../src/lab";
import { createTelemetry, DURATION_BUCKETS_SECONDS, type Telemetry } from "../src/telemetry";

interface Harness {
	telemetry: Telemetry;
	spans: InMemorySpanExporter;
	logs: InMemoryLogRecordExporter;
	metrics: InMemoryMetricExporter;
	reader: PeriodicExportingMetricReader;
}

function harness(serviceName: string): Harness {
	const spans = new InMemorySpanExporter();
	const logs = new InMemoryLogRecordExporter();
	const metrics = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
	const reader = new PeriodicExportingMetricReader({ exporter: metrics, exportIntervalMillis: 3_600_000 });
	const telemetry = createTelemetry(serviceName, {
		spanProcessors: [new SimpleSpanProcessor(spans)],
		metricReaders: [reader],
		logProcessors: [new SimpleLogRecordProcessor({ exporter: logs })],
	});
	return { telemetry, spans, logs, metrics, reader };
}

const realFetch = globalThis.fetch;
let gateway: Harness;
let orders: Harness;
let inventoryHeaders: Headers[];

beforeEach(() => {
	gateway = harness("gateway");
	orders = harness("orders");
	inventoryHeaders = [];
	const ordersHandler = ordersApp(orders.telemetry, "http://inventory.test");
	const gatewayHandler = gatewayApp(gateway.telemetry, "http://orders.test");
	// EN: The fake network: a URL of orders goes to the orders handler, a URL of inventory
	//     gets a canned answer and its headers are kept for inspection.
	// PT: A rede falsa: uma URL de orders vai para o handler de orders, uma URL de inventory
	//     recebe uma resposta pronta e os cabeçalhos são guardados para inspeção.
	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
		const request = input instanceof Request ? input : new Request(String(input), init);
		if (request.url.startsWith("http://orders.test")) {
			return ordersHandler(request);
		}
		if (request.url.startsWith("http://inventory.test")) {
			inventoryHeaders.push(request.headers);
			const sku = request.url.split("/").pop() ?? "";
			return Response.json({ sku, inStock: true, shelf: "shelf-x" });
		}
		if (request.url.startsWith("http://gateway.test")) {
			return gatewayHandler(request);
		}
		return new Response("unexpected url", { status: 599 });
	}) as typeof fetch;
});

afterEach(async () => {
	globalThis.fetch = realFetch;
	await gateway.telemetry.shutdown();
	await orders.telemetry.shutdown();
});

describe("context propagation", () => {
	test("gateway and orders produce spans of one trace, linked parent to child", async () => {
		const response = await fetch("http://gateway.test/checkout?sku=blue-pen&qty=2");
		expect(response.status).toBe(200);

		const gatewaySpans = gateway.spans.getFinishedSpans();
		const ordersSpans = orders.spans.getFinishedSpans();
		const root = gatewaySpans.find((span) => span.name === "GET /checkout");
		const client = gatewaySpans.find((span) => span.name === "POST orders");
		const server = ordersSpans.find((span) => span.name === "POST /orders");
		if (root === undefined || client === undefined || server === undefined) {
			throw new Error("expected spans are missing");
		}

		const traceId = root.spanContext().traceId;
		expect(response.headers.get("x-trace-id")).toBe(traceId);
		for (const span of [...gatewaySpans, ...ordersSpans]) {
			expect(span.spanContext().traceId).toBe(traceId);
		}
		// EN: The chain: root SERVER span -> CLIENT span in gateway -> SERVER span in orders.
		// PT: A cadeia: span SERVER raiz -> span CLIENT no gateway -> span SERVER em orders.
		expect(root.parentSpanContext).toBeUndefined();
		expect(root.kind).toBe(SpanKind.SERVER);
		expect(client.kind).toBe(SpanKind.CLIENT);
		expect(client.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
		expect(server.parentSpanContext?.spanId).toBe(client.spanContext().spanId);
	});

	test("the call to inventory carries a W3C traceparent header with the trace id", async () => {
		const response = await fetch("http://gateway.test/checkout?sku=blue-pen");
		const traceId = response.headers.get("x-trace-id");
		const traceparent = inventoryHeaders[0]?.get("traceparent") ?? "";
		expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
		expect(traceparent.split("-")[1]).toBe(traceId ?? "");

		const client = orders.spans.getFinishedSpans().find((span) => span.name === "GET inventory");
		expect(traceparent.split("-")[2]).toBe(client?.spanContext().spanId ?? "");
	});

	test("a request with a traceparent continues that trace instead of starting one", async () => {
		const handler = ordersApp(orders.telemetry, "http://inventory.test");
		await handler(
			new Request("http://orders.test/orders", {
				method: "POST",
				headers: { traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" },
				body: JSON.stringify({ sku: "blue-pen", qty: 1 }),
			}),
		);
		const server = orders.spans.getFinishedSpans().find((span) => span.name === "POST /orders");
		expect(server?.spanContext().traceId).toBe("0af7651916cd43dd8448eb211c80319c");
		expect(server?.parentSpanContext?.spanId).toBe("b7ad6b7169203331");
	});
});

describe("the three signals of one request", () => {
	test("log records carry the trace id and span id of the active span", async () => {
		const response = await fetch("http://gateway.test/checkout?sku=blue-pen");
		const traceId = response.headers.get("x-trace-id") ?? "";
		const records = orders.logs.getFinishedLogRecords();
		expect(records.length).toBeGreaterThanOrEqual(2);
		for (const record of records) {
			expect(record.spanContext?.traceId).toBe(traceId);
		}
		expect(records.map((record) => record.body)).toContain("order priced and stock checked");
	});

	test("the metric has the route template and the status, never the sku", async () => {
		for (const sku of ["blue-pen", "red-pen", "notebook"]) {
			await fetch(`http://gateway.test/checkout?sku=${sku}`);
		}
		await gateway.reader.forceFlush();
		const metric = gateway.metrics
			.getMetrics()
			.flatMap((resource) => resource.scopeMetrics)
			.flatMap((scope) => scope.metrics)
			.find((candidate) => candidate.descriptor.name === "http.server.request.duration");
		if (metric === undefined || metric.dataPointType !== DataPointType.HISTOGRAM) {
			throw new Error("histogram not exported");
		}
		// EN: Three SKUs, one data point: one time series, whatever the number of products.
		// PT: Três SKUs, um ponto de dados: uma série temporal, seja qual for o número de produtos.
		expect(metric.dataPoints).toHaveLength(1);
		const point = metric.dataPoints[0];
		expect(point?.value.count).toBe(3);
		expect(point?.attributes).toEqual({
			"http.request.method": "GET",
			"http.route": "/checkout",
			"http.response.status_code": 200,
		});
		expect(point?.value.buckets.boundaries).toEqual(DURATION_BUCKETS_SECONDS);
		expect(metric.descriptor.unit).toBe("s");
	});

	test("invalid input is a 400, recorded in the metric but not as a span error", async () => {
		const response = await fetch("http://gateway.test/checkout?sku=NOT%20VALID");
		expect(response.status).toBe(400);
		const root = gateway.spans.getFinishedSpans().find((span) => span.name === "GET /checkout");
		expect(root?.attributes["http.response.status_code"]).toBe(400);
		expect(root?.status.code).toBe(0);
		expect(orders.spans.getFinishedSpans()).toHaveLength(0);
	});
});

describe("reading a trace", () => {
	const nano = (ms: number): string => String(1_700_000_000_000_000_000n + BigInt(ms) * 1_000_000n);
	const span = (spanId: string, parentSpanId: string, name: string, start: number, end: number): object => ({
		spanId,
		parentSpanId,
		name,
		kind: "SPAN_KIND_SERVER",
		startTimeUnixNano: nano(start),
		endTimeUnixNano: nano(end),
		attributes: [],
	});
	const resource = (service: string, spans: object[]): object => ({
		resource: { attributes: [{ key: "service.name", value: { stringValue: service } }] },
		scopeSpans: [{ spans }],
	});
	const raw = {
		trace: {
			resourceSpans: [
				resource("inventory", [
					span("d", "c", "GET /stock/{sku}", 30, 840),
					span("e", "d", "warehouse.lookup", 35, 835),
				]),
				resource("gateway", [span("a", "", "GET /checkout", 0, 900)]),
				resource("orders", [span("b", "a", "POST /orders", 10, 880), span("c", "b", "GET inventory", 20, 860)]),
			],
		},
	};

	test("spans come out in tree order, with their service", () => {
		const spans = flattenTrace(raw);
		expect(spans.map((row) => `${row.service}:${row.name}`)).toEqual([
			"gateway:GET /checkout",
			"orders:POST /orders",
			"orders:GET inventory",
			"inventory:GET /stock/{sku}",
			"inventory:warehouse.lookup",
		]);
		expect(spans[4]?.startMs).toBe(35);
		expect(spans[4]?.durationMs).toBe(800);
	});

	test("self time points at the leaf, not at the long parents", () => {
		const spans = flattenTrace(raw);
		const self = selfTimes(spans);
		// EN: Worked by hand: root 900 - 870 = 30, POST /orders 870 - 840 = 30,
		//     GET inventory 840 - 810 = 30, GET /stock 810 - 800 = 10, lookup 800.
		// PT: Feito à mão: raiz 900 - 870 = 30, POST /orders 870 - 840 = 30,
		//     GET inventory 840 - 810 = 30, GET /stock 810 - 800 = 10, lookup 800.
		expect(spans.map((row) => self.get(row.spanId))).toEqual([30, 30, 30, 10, 800]);
		expect(waterfall(spans)).toContain("        inventory: warehouse.lookup");
	});
});

describe("configuration", () => {
	test("defaults point at the collector and a bad URL is refused", () => {
		expect(readServiceEnv({}).OTEL_EXPORTER_OTLP_ENDPOINT).toBe("http://collector:4318");
		expect(() => readServiceEnv({ ORDERS_URL: "not a url" })).toThrow();
		expect(() => readServiceEnv({ PORT: "70000" })).toThrow();
	});
});
