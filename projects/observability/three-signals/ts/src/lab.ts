// EN: The questions a person asks during an investigation, as functions over the HTTP APIs of
//     the three back ends. The demo and the end-to-end test share them. Each back end has its
//     own query language: TraceQL for Tempo, PromQL for Prometheus, LogQL for Loki.
// PT: As perguntas que uma pessoa faz durante uma investigação, como funções sobre as APIs HTTP
//     dos três back ends. A demo e o teste de ponta a ponta as compartilham. Cada back end tem
//     a sua linguagem de consulta: TraceQL no Tempo, PromQL no Prometheus, LogQL no Loki.

import { z } from "zod";

/** TraceQL: spans named `warehouse.lookup` that took more than half a second. */
export const SLOW_SPAN_QUERY = '{ name = "warehouse.lookup" && duration > 500ms }';

/** PromQL: 99th percentile of the request duration, per service, from the histogram buckets. */
export const P99_QUERY =
	"histogram_quantile(0.99, sum by (le, service_name) (rate(http_server_request_duration_seconds_bucket[5m])))";

/** LogQL: every log line of one trace, from every service. The trace id is structured metadata. */
export function logsOfTraceQuery(traceId: string): string {
	return `{service_name=~".+"} | trace_id="${traceId}"`;
}

async function getJson(url: string): Promise<unknown> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`${url} answered ${response.status}: ${await response.text()}`);
	}
	return response.json();
}

/** Polls until `probe` returns a value, or fails after `timeoutMs`. Telemetry is batched, so it arrives late. */
export async function eventually<T>(probe: () => Promise<T | undefined>, timeoutMs: number, what: string): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	let lastError: unknown;
	while (Date.now() < deadline) {
		try {
			const value = await probe();
			if (value !== undefined) {
				return value;
			}
		} catch (error) {
			lastError = error;
		}
		await Bun.sleep(1000);
	}
	throw new Error(
		`timed out waiting for ${what}${lastError === undefined ? "" : ` (last error: ${String(lastError)})`}`,
	);
}

/** Waits until an HTTP endpoint answers 200. Grafana needs a minute or two on its first start. */
export async function waitReady(url: string, timeoutMs: number): Promise<void> {
	await eventually(async () => ((await fetch(url)).ok ? true : undefined), timeoutMs, `${url} to be ready`);
}

export interface Checkout {
	status: number;
	traceId: string;
	durationMs: number;
}

export async function checkout(gatewayUrl: string, sku: string): Promise<Checkout> {
	const started = performance.now();
	const response = await fetch(`${gatewayUrl}/checkout?sku=${encodeURIComponent(sku)}&qty=1`);
	await response.arrayBuffer();
	return {
		status: response.status,
		traceId: response.headers.get("x-trace-id") ?? "",
		durationMs: Math.round(performance.now() - started),
	};
}

// ---------------------------------------------------------------- Tempo

const searchSchema = z.object({
	traces: z
		.array(
			z.object({
				traceID: z.string(),
				rootServiceName: z.string().optional(),
				rootTraceName: z.string().optional(),
				durationMs: z.number().optional(),
			}),
		)
		.default([]),
});

export type FoundTrace = z.infer<typeof searchSchema>["traces"][number];

export async function searchTraces(tempoUrl: string, traceQl: string): Promise<FoundTrace[]> {
	const end = Math.floor(Date.now() / 1000) + 60;
	const url = `${tempoUrl}/api/search?q=${encodeURIComponent(traceQl)}&start=${end - 3600}&end=${end}&limit=50`;
	return searchSchema.parse(await getJson(url)).traces;
}

const attributeSchema = z.object({
	key: z.string(),
	value: z.object({ stringValue: z.string().optional(), intValue: z.union([z.string(), z.number()]).optional() }),
});

const traceSchema = z.object({
	trace: z.object({
		resourceSpans: z.array(
			z.object({
				resource: z.object({ attributes: z.array(attributeSchema).default([]) }),
				scopeSpans: z.array(
					z.object({
						spans: z.array(
							z.object({
								spanId: z.string(),
								parentSpanId: z.string().optional(),
								name: z.string(),
								kind: z.string().optional(),
								startTimeUnixNano: z.string(),
								endTimeUnixNano: z.string(),
								attributes: z.array(attributeSchema).default([]),
							}),
						),
					}),
				),
			}),
		),
	}),
});

export interface SpanRow {
	service: string;
	name: string;
	kind: string;
	spanId: string;
	parentSpanId: string;
	startMs: number;
	durationMs: number;
	attributes: Record<string, string>;
}

function attributesToRecord(attributes: z.infer<typeof attributeSchema>[]): Record<string, string> {
	return Object.fromEntries(
		attributes.map(({ key, value }) => [key, String(value.stringValue ?? value.intValue ?? "")]),
	);
}

/**
 * Flattens the OTLP JSON of one trace into rows, in tree order (parent before children).
 *
 * EN: A trace is stored grouped by resource (one group per service). The tree is rebuilt from
 *     `parentSpanId`, and the rows come out in the order a waterfall draws them.
 * PT: Um trace é guardado agrupado por resource (um grupo por serviço). A árvore é
 *     reconstruída a partir de `parentSpanId`, e as linhas saem na ordem em que uma cascata
 *     as desenha.
 */
export function flattenTrace(raw: unknown): SpanRow[] {
	const rows: (SpanRow & { startNano: bigint })[] = [];
	for (const resourceSpans of traceSchema.parse(raw).trace.resourceSpans) {
		const service = attributesToRecord(resourceSpans.resource.attributes)["service.name"] ?? "unknown_service";
		for (const scope of resourceSpans.scopeSpans) {
			for (const span of scope.spans) {
				const start = BigInt(span.startTimeUnixNano);
				rows.push({
					service,
					name: span.name,
					kind: (span.kind ?? "SPAN_KIND_INTERNAL").replace("SPAN_KIND_", ""),
					spanId: span.spanId,
					parentSpanId: span.parentSpanId ?? "",
					startNano: start,
					startMs: 0,
					durationMs: Number(BigInt(span.endTimeUnixNano) - start) / 1e6,
					attributes: attributesToRecord(span.attributes),
				});
			}
		}
	}
	// EN: Walk the tree from the roots, children by start time. Sorting by start alone is not
	//     enough: clocks of different processes have different resolution (and may disagree),
	//     so a child can appear to start in the same millisecond as its parent, or before it.
	// PT: Percorre a árvore a partir das raízes, filhos por ordem de início. Ordenar só pelo
	//     início não basta: relógios de processos diferentes têm resoluções diferentes (e podem
	//     discordar), então um filho pode parecer começar no mesmo milissegundo do pai, ou antes.
	const ids = new Set(rows.map((row) => row.spanId));
	const byStart = (a: { startNano: bigint }, b: { startNano: bigint }): number =>
		a.startNano < b.startNano ? -1 : a.startNano > b.startNano ? 1 : 0;
	const ordered: typeof rows = [];
	const visit = (row: (typeof rows)[number]): void => {
		ordered.push(row);
		for (const child of rows.filter((candidate) => candidate.parentSpanId === row.spanId).sort(byStart)) {
			visit(child);
		}
	};
	for (const root of rows.filter((row) => !ids.has(row.parentSpanId)).sort(byStart)) {
		visit(root);
	}
	const origin = ordered[0]?.startNano ?? 0n;
	return ordered.map(({ startNano, ...row }) => ({ ...row, startMs: Number(startNano - origin) / 1e6 }));
}

export async function fetchTrace(tempoUrl: string, traceId: string): Promise<{ raw: unknown; spans: SpanRow[] }> {
	const raw = await getJson(`${tempoUrl}/api/v2/traces/${traceId}`);
	return { raw, spans: flattenTrace(raw) };
}

/** Depth of each span in the tree, for indentation. */
export function depths(spans: SpanRow[]): Map<string, number> {
	const byId = new Map(spans.map((span) => [span.spanId, span]));
	const depthOf = (span: SpanRow): number => {
		const parent = byId.get(span.parentSpanId);
		return parent === undefined ? 0 : 1 + depthOf(parent);
	};
	return new Map(spans.map((span) => [span.spanId, depthOf(span)]));
}

/**
 * Self time: the duration of a span minus the time covered by its direct children.
 *
 * EN: Every ancestor of a slow span is slow too, because a parent contains its children. Self
 *     time removes the children and leaves what the span spent on its own, so the largest
 *     self time points at the real culprit.
 * PT: Todo ancestral de um span lento também é lento, porque um pai contém os filhos. O tempo
 *     próprio remove os filhos e deixa o que o span gastou sozinho, então o maior tempo
 *     próprio aponta o verdadeiro culpado.
 */
export function selfTimes(spans: SpanRow[]): Map<string, number> {
	const result = new Map(spans.map((span) => [span.spanId, span.durationMs]));
	for (const span of spans) {
		const parent = result.get(span.parentSpanId);
		if (parent !== undefined) {
			result.set(span.parentSpanId, parent - span.durationMs);
		}
	}
	return result;
}

/** A text waterfall of the trace, the same picture Grafana draws. */
export function waterfall(spans: SpanRow[]): string {
	const depth = depths(spans);
	const self = selfTimes(spans);
	const lines = spans.map((span) => {
		const label = `${"  ".repeat(depth.get(span.spanId) ?? 0)}${span.service}: ${span.name}`;
		const numbers = [span.startMs, span.durationMs, self.get(span.spanId) ?? 0].map((n) =>
			n.toFixed(1).padStart(9),
		);
		return `${label.padEnd(44)}${numbers.join("")}`;
	});
	return [
		`${"span".padEnd(44)}${["start ms", "dur ms", "self ms"].map((h) => h.padStart(9)).join("")}`,
		...lines,
	].join("\n");
}

// ---------------------------------------------------------------- Prometheus

const promSchema = z.object({
	data: z.object({
		result: z.array(
			z.object({ metric: z.record(z.string(), z.string()), value: z.tuple([z.number(), z.string()]) }),
		),
	}),
});

export interface PromSample {
	labels: Record<string, string>;
	value: number;
}

export async function promQuery(prometheusUrl: string, promQl: string): Promise<PromSample[]> {
	const raw = await getJson(`${prometheusUrl}/api/v1/query?query=${encodeURIComponent(promQl)}`);
	return promSchema.parse(raw).data.result.map((row) => ({ labels: row.metric, value: Number(row.value[1]) }));
}

// ---------------------------------------------------------------- Loki

const lokiSchema = z.object({
	data: z.object({
		result: z.array(
			z.object({ stream: z.record(z.string(), z.string()), values: z.array(z.tuple([z.string(), z.string()])) }),
		),
	}),
});

export interface LogLine {
	timestampNs: string;
	service: string;
	severity: string;
	message: string;
	fields: Record<string, string>;
}

export async function lokiQuery(lokiUrl: string, logQl: string): Promise<LogLine[]> {
	const endNs = BigInt(Date.now() + 60_000) * 1_000_000n;
	const startNs = endNs - 3_600_000_000_000n;
	const url = `${lokiUrl}/loki/api/v1/query_range?query=${encodeURIComponent(logQl)}&start=${startNs}&end=${endNs}&limit=500&direction=forward`;
	const lines: LogLine[] = [];
	for (const stream of lokiSchema.parse(await getJson(url)).data.result) {
		for (const [timestampNs, message] of stream.values) {
			lines.push({
				timestampNs,
				service: stream.stream.service_name ?? "",
				severity: stream.stream.severity_text ?? "",
				message,
				fields: stream.stream,
			});
		}
	}
	return lines.sort((a, b) => (BigInt(a.timestampNs) < BigInt(b.timestampNs) ? -1 : 1));
}

// ---------------------------------------------------------------- Grafana

const dashboardSchema = z.object({
	meta: z.object({ provisioned: z.boolean().optional() }),
	dashboard: z.object({ uid: z.string(), title: z.string(), panels: z.array(z.object({ title: z.string() })) }),
});

export type Dashboard = z.infer<typeof dashboardSchema>;

export async function fetchDashboard(grafanaUrl: string, uid: string): Promise<Dashboard> {
	return dashboardSchema.parse(await getJson(`${grafanaUrl}/api/dashboards/uid/${uid}`));
}
