package inventory

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"go.opentelemetry.io/contrib/bridges/otelslog"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

const scope = "three-signals"

// DurationBuckets are the histogram limits in seconds, the same as in the TypeScript services.
var DurationBuckets = []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5}

// NewResource describes who produces the telemetry. The three signals share it.
func NewResource(serviceName string) *resource.Resource {
	return resource.NewSchemaless(
		attribute.String("service.name", serviceName),
		attribute.String("service.namespace", "three-signals"),
	)
}

// NewDurationHistogram creates the request duration instrument on a meter provider.
func NewDurationHistogram(provider metric.MeterProvider) (metric.Float64Histogram, error) {
	return provider.Meter(scope).Float64Histogram("http.server.request.duration",
		metric.WithDescription("Duration of HTTP server requests"),
		metric.WithUnit("s"),
		metric.WithExplicitBucketBoundaries(DurationBuckets...),
	)
}

// StartOTLP builds the three pipelines and returns a Service that exports to the collector.
//
// EN: The exporters read OTEL_EXPORTER_OTLP_ENDPOINT from the environment, the standard
//
//	variable, so this code names no host. The shutdown function flushes the last batches.
//
// PT: Os exporters leem OTEL_EXPORTER_OTLP_ENDPOINT do ambiente, a variável padrão, então este
//
//	código não cita nenhum host. A função de shutdown descarrega os últimos lotes.
//
// ES: Los exporters leen OTEL_EXPORTER_OTLP_ENDPOINT del entorno, la variable estándar, así que este
//
//	código no nombra ningún host. La función de shutdown vacía los últimos lotes.
func StartOTLP(ctx context.Context, serviceName string) (*Service, func(context.Context) error, error) {
	res := NewResource(serviceName)

	traceExporter, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, nil, err
	}
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithResource(res),
		sdktrace.WithBatcher(traceExporter, sdktrace.WithBatchTimeout(time.Second)),
	)

	metricExporter, err := otlpmetrichttp.New(ctx)
	if err != nil {
		return nil, nil, err
	}
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter, sdkmetric.WithInterval(5*time.Second))),
	)

	logExporter, err := otlploghttp.New(ctx)
	if err != nil {
		return nil, nil, err
	}
	loggerProvider := sdklog.NewLoggerProvider(
		sdklog.WithResource(res),
		sdklog.WithProcessor(sdklog.NewBatchProcessor(logExporter, sdklog.WithExportInterval(time.Second))),
	)

	histogram, err := NewDurationHistogram(meterProvider)
	if err != nil {
		return nil, nil, err
	}

	service := &Service{
		Tracer:   tracerProvider.Tracer(scope),
		Duration: histogram,
		// EN: The bridge makes the standard `log/slog` API write OpenTelemetry log records.
		//     Application code keeps using slog and does not import the OpenTelemetry log API.
		// PT: A ponte faz a API padrão `log/slog` escrever registros de log do OpenTelemetry.
		//     O código da aplicação continua usando slog e não importa a API de logs do OpenTelemetry.
		// ES: El puente hace que la API estándar `log/slog` escriba registros de log de OpenTelemetry.
		//     El código de la aplicación sigue usando slog y no importa la API de logs de OpenTelemetry.
		Logger:     otelslog.NewLogger(scope, otelslog.WithLoggerProvider(loggerProvider)),
		Propagator: propagation.TraceContext{},
	}
	shutdown := func(ctx context.Context) error {
		return errors.Join(tracerProvider.Shutdown(ctx), meterProvider.Shutdown(ctx), loggerProvider.Shutdown(ctx))
	}
	return service, shutdown, nil
}

// Discard is a logger that drops everything, for tests that do not look at the logs.
var Discard = slog.New(slog.DiscardHandler)
