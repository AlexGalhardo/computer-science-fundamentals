// EN: The questions a person asks during an investigation, as functions over the HTTP APIs of
//     the three back ends. The demo and the end-to-end test share them. Each back end has its
//     own query language: TraceQL for Tempo, PromQL for Prometheus, LogQL for Loki.
// PT: As perguntas que uma pessoa faz durante uma investigação, como funções sobre as APIs HTTP
//     dos três back ends. A demo e o teste de ponta a ponta as compartilham. Cada back end tem
//     a sua linguagem de consulta: TraceQL no Tempo, PromQL no Prometheus, LogQL no Loki.
// ES: Las preguntas que una persona hace durante una investigación, como funciones sobre las APIs HTTP
//     de los tres back ends. La demo y la prueba de extremo a extremo las comparten. Cada back end tiene
//     su lenguaje de consulta: TraceQL en Tempo, PromQL en Prometheus, LogQL en Loki.

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

/**
 * Sends one checkout. With `traceparent`, the gateway continues that trace instead of starting
 * one, so the caller chooses the trace id.
 */
export async function checkout(gatewayUrl: string, sku: string, traceparent?: string): Promise<Checkout> {
	const started = performance.now();
	const response = await fetch(`${gatewayUrl}/checkout?sku=${encodeURIComponent(sku)}&qty=1`, {
		headers: traceparent === undefined ? {} : { traceparent },
	});
	await response.arrayBuffer();
	return {
		status: response.status,
		traceId: response.headers.get("x-trace-id") ?? "",
		durationMs: Math.round(performance.now() - started),
	};
}

// ---------------------------------------------------------------- Tempo

/**
 * Writes a trace id in its canonical form: 32 hex digits (W3C Trace Context).
 *
 * EN: A trace id is 16 bytes. Tempo's search API prints it as a number, without the leading
 *     zeros: `0af7...` comes back as `af7...`, 31 digits. The `traceparent` header, the SDK, the
 *     logs in Loki and Tempo's own fetch by id all use the 32 digits. Comparing the two forms as
 *     text fails for one random id in sixteen, so every id read from the search is padded here,
 *     at the boundary, and the rest of the code sees one form only.
 * PT: Um trace id tem 16 bytes. A API de busca do Tempo o imprime como um número, sem os zeros
 *     à esquerda: `0af7...` volta como `af7...`, com 31 dígitos. O cabeçalho `traceparent`, o
 *     SDK, os logs no Loki e a própria busca por id do Tempo usam os 32 dígitos. Comparar as
 *     duas formas como texto falha para um id sorteado em cada dezesseis, então todo id lido da
 *     busca é completado aqui, na fronteira, e o resto do código vê uma forma só.
 * ES: Un trace id tiene 16 bytes. La API de búsqueda de Tempo lo imprime como un número, sin los
 *     ceros a la izquierda: `0af7...` vuelve como `af7...`, con 31 dígitos. El encabezado
 *     `traceparent`, el SDK, los logs en Loki y la propia consulta por id de Tempo usan los 32
 *     dígitos. Comparar las dos formas como texto falla para un id sorteado de cada dieciséis,
 *     así que todo id leído de la búsqueda se completa aquí, en la frontera, y el resto del
 *     código ve una sola forma.
 */
export function canonicalTraceId(traceId: string): string {
	return traceId.padStart(32, "0");
}

const searchSchema = z.object({
	traces: z
		.array(
			z.object({
				traceID: z
					.string()
					.regex(/^[0-9a-f]{1,32}$/)
					.transform(canonicalTraceId),
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
 * ES: Un trace se guarda agrupado por resource (un grupo por servicio). El árbol se
 *     reconstruye a partir de `parentSpanId`, y las filas salen en el orden en que una cascada
 *     las dibuja.
 */
export function flattenTrace(raw: unknown): SpanRow[] {
	const rows: (SpanRow & { startNano: bigint; endNano: bigint })[] = [];
	for (const resourceSpans of traceSchema.parse(raw).trace.resourceSpans) {
		const service = attributesToRecord(resourceSpans.resource.attributes)["service.name"] ?? "unknown_service";
		for (const scope of resourceSpans.scopeSpans) {
			for (const span of scope.spans) {
				const start = BigInt(span.startTimeUnixNano);
				const end = BigInt(span.endTimeUnixNano);
				rows.push({
					service,
					name: span.name,
					kind: (span.kind ?? "SPAN_KIND_INTERNAL").replace("SPAN_KIND_", ""),
					spanId: span.spanId,
					parentSpanId: span.parentSpanId ?? "",
					startNano: start,
					endNano: end,
					startMs: 0,
					durationMs: Number(end - start) / 1e6,
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
	// ES: Recorre el árbol desde las raíces, los hijos por orden de inicio. Ordenar solo por el
	//     inicio no basta: los relojes de procesos distintos tienen resoluciones distintas (y pueden
	//     discrepar), así que un hijo puede parecer empezar en el mismo milisegundo que el padre, o antes.
	// EN: Start times can also tie. The JS SDK reads the start of a span from a millisecond
	//     clock, so two steps of one handler (`orders.price`, then `GET inventory`) often start
	//     in the same millisecond. Tempo returns the spans in no fixed order, so a tie is broken
	//     by the end time: the step that finished first is drawn first.
	// PT: Os inícios também podem empatar. O SDK de JS lê o início de um span em um relógio de
	//     milissegundos, então duas etapas de um handler (`orders.price`, depois `GET inventory`)
	//     muitas vezes começam no mesmo milissegundo. O Tempo devolve os spans sem ordem fixa,
	//     então o empate é decidido pelo fim: a etapa que terminou primeiro é desenhada primeiro.
	// ES: Los inicios también pueden empatar. El SDK de JS lee el inicio de un span en un reloj de
	//     milisegundos, así que dos pasos de un handler (`orders.price`, luego `GET inventory`)
	//     muchas veces empiezan en el mismo milisegundo. Tempo devuelve los spans sin orden fijo,
	//     así que el empate se decide por el final: el paso que terminó primero se dibuja primero.
	const ids = new Set(rows.map((row) => row.spanId));
	type Timed = { startNano: bigint; endNano: bigint };
	const compare = (a: bigint, b: bigint): number => (a < b ? -1 : a > b ? 1 : 0);
	const byStart = (a: Timed, b: Timed): number => compare(a.startNano, b.startNano) || compare(a.endNano, b.endNano);
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
	return ordered.map(({ startNano, endNano, ...row }) => ({ ...row, startMs: Number(startNano - origin) / 1e6 }));
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
 * ES: Todo ancestro de un span lento también es lento, porque un padre contiene a los hijos. El tiempo
 *     propio quita a los hijos y deja lo que el span gastó solo, así que el mayor tiempo
 *     propio señala al verdadero culpable.
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
