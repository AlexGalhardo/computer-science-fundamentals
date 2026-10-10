// EN: The OpenTelemetry SDK, configured by hand. There are three pipelines, one per signal, and
//     they have the same shape: a provider creates the instruments the code uses (tracer, meter,
//     logger), a processor or reader batches what they produce, and an exporter sends the batch
//     to the collector over OTLP. All three share one Resource, which is how a back end knows
//     that a span, a metric and a log line came from the same service.
// PT: O SDK do OpenTelemetry, configurado à mão. São três pipelines, um por sinal, com o mesmo
//     formato: um provider cria os instrumentos que o código usa (tracer, meter, logger), um
//     processor ou reader agrupa o que eles produzem, e um exporter envia o lote ao collector
//     por OTLP. Os três compartilham um Resource, e é assim que um back end sabe que um span,
//     uma métrica e uma linha de log vieram do mesmo serviço.
// ES: El SDK de OpenTelemetry, configurado a mano. Son tres pipelines, uno por señal, con la misma
//     forma: un provider crea los instrumentos que usa el código (tracer, meter, logger), un
//     processor o reader agrupa lo que producen, y un exporter envía el lote al collector
//     por OTLP. Los tres comparten un Resource, y así un back end sabe que un span,
//     una métrica y una línea de log vinieron del mismo servicio.

import { context, type Histogram, propagation, type Tracer } from "@opentelemetry/api";
import type { Logger } from "@opentelemetry/api-logs";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider, type LogRecordProcessor } from "@opentelemetry/sdk-logs";
import { type IMetricReader, MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BasicTracerProvider, BatchSpanProcessor, type SpanProcessor } from "@opentelemetry/sdk-trace-base";

export interface Pipelines {
	spanProcessors: SpanProcessor[];
	metricReaders: IMetricReader[];
	logProcessors: LogRecordProcessor[];
}

export interface Telemetry {
	serviceName: string;
	tracer: Tracer;
	/** `http.server.request.duration`, in seconds: rate, errors and duration come from this one histogram. */
	requestDuration: Histogram;
	logger: Logger;
	shutdown: () => Promise<void>;
}

// EN: Bucket limits in seconds. A histogram does not store each duration: it counts how many
//     requests fell under each limit, so the limits must be chosen around the values that
//     matter. Here the injected delay is 0.8 s, and the limits 0.5 and 1 make it visible.
// PT: Limites dos buckets em segundos. Um histograma não guarda cada duração: ele conta quantas
//     requisições ficaram abaixo de cada limite, então os limites precisam ser escolhidos em
//     torno dos valores que importam. Aqui o atraso injetado é de 0,8 s, e os limites 0,5 e 1
//     o tornam visível.
// ES: Límites de los buckets en segundos. Un histograma no guarda cada duración: cuenta cuántas
//     peticiones quedaron por debajo de cada límite, así que los límites deben elegirse
//     alrededor de los valores que importan. Aquí el retraso inyectado es de 0,8 s, y los límites 0,5 y 1
//     lo hacen visible.
export const DURATION_BUCKETS_SECONDS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

/** The production pipelines: batch each signal and send it to the collector over OTLP/HTTP. */
export function otlpPipelines(endpoint: string): Pipelines {
	const base = endpoint.replace(/\/+$/, "");
	return {
		// EN: A batch processor keeps finished spans in memory and sends them together, off the
		//     request path. A request never waits for the collector.
		// PT: Um batch processor guarda os spans finalizados em memória e os envia juntos, fora
		//     do caminho da requisição. Uma requisição nunca espera pelo collector.
		// ES: Un batch processor guarda los spans finalizados en memoria y los envía juntos, fuera
		//     del camino de la petición. Una petición nunca espera al collector.
		spanProcessors: [
			new BatchSpanProcessor(new OTLPTraceExporter({ url: `${base}/v1/traces` }), { scheduledDelayMillis: 1000 }),
		],
		metricReaders: [
			new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter({ url: `${base}/v1/metrics` }),
				exportIntervalMillis: 5000,
			}),
		],
		logProcessors: [
			new BatchLogRecordProcessor({
				exporter: new OTLPLogExporter({ url: `${base}/v1/logs` }),
				scheduledDelayMillis: 1000,
			}),
		],
	};
}

let globalsInstalled = false;

// EN: Two things are global to the process. The context manager remembers the active span
//     across `await` (it uses AsyncLocalStorage), so a log line written deep in the call chain
//     still knows which trace it belongs to. The propagator turns that context into the W3C
//     `traceparent` header and back.
// PT: Duas coisas são globais ao processo. O context manager lembra o span ativo através dos
//     `await` (ele usa AsyncLocalStorage), então uma linha de log escrita lá no fundo da cadeia
//     de chamadas ainda sabe a qual trace pertence. O propagator transforma esse contexto no
//     cabeçalho W3C `traceparent` e de volta.
// ES: Dos cosas son globales al proceso. El context manager recuerda el span activo a través de los
//     `await` (usa AsyncLocalStorage), así que una línea de log escrita en lo más profundo de la cadena
//     de llamadas todavía sabe a qué trace pertenece. El propagator convierte ese contexto en el
//     encabezado W3C `traceparent` y viceversa.
function installGlobals(): void {
	if (globalsInstalled) {
		return;
	}
	context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
	propagation.setGlobalPropagator(new W3CTraceContextPropagator());
	globalsInstalled = true;
}

export function createTelemetry(serviceName: string, pipelines: Pipelines): Telemetry {
	installGlobals();
	const resource = resourceFromAttributes({ "service.name": serviceName, "service.namespace": "three-signals" });

	const tracerProvider = new BasicTracerProvider({ resource, spanProcessors: pipelines.spanProcessors });
	const meterProvider = new MeterProvider({ resource, readers: pipelines.metricReaders });
	const loggerProvider = new LoggerProvider({ resource, processors: pipelines.logProcessors });

	const requestDuration = meterProvider.getMeter("three-signals").createHistogram("http.server.request.duration", {
		description: "Duration of HTTP server requests",
		unit: "s",
		advice: { explicitBucketBoundaries: DURATION_BUCKETS_SECONDS },
	});

	return {
		serviceName,
		tracer: tracerProvider.getTracer("three-signals"),
		requestDuration,
		logger: loggerProvider.getLogger("three-signals"),
		// EN: Flush on shutdown, or the last batch of each signal dies with the process.
		// PT: Descarrega no encerramento, ou o último lote de cada sinal morre com o processo.
		// ES: Vacía al cerrar, o el último lote de cada señal muere con el proceso.
		shutdown: async (): Promise<void> => {
			await Promise.all([tracerProvider.shutdown(), meterProvider.shutdown(), loggerProvider.shutdown()]);
		},
	};
}
