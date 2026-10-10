// EN: Manual instrumentation of HTTP, on both sides of a call. Libraries usually do this for
//     you ("automatic instrumentation"); writing it once by hand shows what they do.
// PT: Instrumentação manual de HTTP, dos dois lados de uma chamada. Bibliotecas costumam fazer
//     isso por você ("instrumentação automática"); escrever uma vez à mão mostra o que elas fazem.
// ES: Instrumentación manual de HTTP, en los dos lados de una llamada. Las bibliotecas suelen hacer
//     eso por ti ("instrumentación automática"); escribirlo una vez a mano muestra lo que hacen.

import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import type { Telemetry } from "./telemetry";

export type Attributes = Record<string, string | number | boolean>;

/** Writes one log record. The SDK attaches the trace id and span id of the active span by itself. */
export function log(
	telemetry: Telemetry,
	level: "info" | "warn" | "error",
	message: string,
	attributes: Attributes = {},
): void {
	const severity = { info: SeverityNumber.INFO, warn: SeverityNumber.WARN, error: SeverityNumber.ERROR }[level];
	telemetry.logger.emit({
		severityNumber: severity,
		severityText: level.toUpperCase(),
		body: message,
		attributes,
	});
}

/**
 * Server side: continue the trace of the caller, time the request and record the three signals.
 *
 * EN: `propagation.extract` reads the `traceparent` header. If it is there, the new span becomes
 *     a child of the caller's span and keeps its trace id: this is what joins the work of
 *     three processes into one trace. If it is missing, the span starts a new trace.
 * PT: `propagation.extract` lê o cabeçalho `traceparent`. Se ele existe, o novo span vira filho
 *     do span de quem chamou e mantém o trace id: é isso que une o trabalho de três processos em
 *     um trace só. Se falta, o span começa um trace novo.
 * ES: `propagation.extract` lee el encabezado `traceparent`. Si existe, el nuevo span se vuelve hijo
 *     del span de quien llamó y mantiene el trace id: eso es lo que une el trabajo de tres procesos en
 *     un solo trace. Si falta, el span empieza un trace nuevo.
 */
export async function handleRequest(
	telemetry: Telemetry,
	request: Request,
	route: string,
	handler: () => Promise<Response>,
): Promise<Response> {
	const parent = propagation.extract(context.active(), Object.fromEntries(request.headers));
	const started = performance.now();
	return telemetry.tracer.startActiveSpan(
		`${request.method} ${route}`,
		{ kind: SpanKind.SERVER, attributes: { "http.request.method": request.method, "http.route": route } },
		parent,
		async (span) => {
			let status = 500;
			try {
				const response = await handler();
				status = response.status;
				return response;
			} catch (error) {
				span.recordException(error instanceof Error ? error : String(error));
				log(telemetry, "error", "request failed", { "http.route": route, error: String(error) });
				return Response.json({ error: "internal error" }, { status: 500 });
			} finally {
				const seconds = (performance.now() - started) / 1000;
				span.setAttribute("http.response.status_code", status);
				// EN: A server span is an error only for 5xx: a 4xx is the client's mistake.
				// PT: Um span de servidor só é erro em 5xx: um 4xx é engano do cliente.
				// ES: Un span de servidor solo es error en 5xx: un 4xx es un error del cliente.
				if (status >= 500) {
					span.setStatus({ code: SpanStatusCode.ERROR });
				}
				// EN: The metric gets only low-cardinality attributes (method, route template,
				//     status). The SKU or the order id would create one time series per value;
				//     those details belong in the span and in the log.
				// PT: A métrica recebe só atributos de baixa cardinalidade (método, rota modelo,
				//     status). O SKU ou o id do pedido criariam uma série temporal por valor;
				//     esses detalhes pertencem ao span e ao log.
				// ES: La métrica recibe solo atributos de baja cardinalidad (método, ruta modelo,
				//     estado). El SKU o el id del pedido crearían una serie temporal por valor;
				//     esos detalles pertenecen al span y al log.
				telemetry.requestDuration.record(seconds, {
					"http.request.method": request.method,
					"http.route": route,
					"http.response.status_code": status,
				});
				log(telemetry, status >= 500 ? "error" : "info", "request handled", {
					"http.route": route,
					"http.response.status_code": status,
					duration_ms: Math.round(seconds * 1000),
				});
				span.end();
			}
		},
	);
}

/**
 * Client side: a CLIENT span around the call, and the context injected into the headers.
 *
 * EN: `propagation.inject` writes `traceparent: 00-<trace id>-<this span id>-01`. The receiver
 *     uses the span id as the parent of its own span.
 * PT: `propagation.inject` escreve `traceparent: 00-<trace id>-<id deste span>-01`. Quem recebe
 *     usa o span id como pai do seu próprio span.
 * ES: `propagation.inject` escribe `traceparent: 00-<trace id>-<id de este span>-01`. Quien recibe
 *     usa el span id como padre de su propio span.
 */
export async function tracedFetch(
	telemetry: Telemetry,
	name: string,
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	return telemetry.tracer.startActiveSpan(
		name,
		{ kind: SpanKind.CLIENT, attributes: { "http.request.method": init.method ?? "GET", "url.full": url } },
		async (span) => {
			try {
				const headers: Record<string, string> = {};
				propagation.inject(context.active(), headers);
				const response = await fetch(url, {
					...init,
					headers: { ...headers, ...(init.headers as Record<string, string>) },
				});
				span.setAttribute("http.response.status_code", response.status);
				// EN: For a client, 4xx is an error too: the call did not do what it was asked to.
				// PT: Para um cliente, 4xx também é erro: a chamada não fez o que foi pedido.
				// ES: Para un cliente, 4xx también es error: la llamada no hizo lo que se pidió.
				if (response.status >= 400) {
					span.setStatus({ code: SpanStatusCode.ERROR });
				}
				return response;
			} catch (error) {
				span.recordException(error instanceof Error ? error : String(error));
				span.setStatus({ code: SpanStatusCode.ERROR });
				throw error;
			} finally {
				span.end();
			}
		},
	);
}

/** The trace id of the active span, or undefined outside a span. Returned to the caller as a header. */
export function activeTraceId(): string | undefined {
	return trace.getActiveSpan()?.spanContext().traceId;
}
