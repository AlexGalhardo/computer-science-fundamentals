package inventory

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

// EN: The tests use the real SDK with in-memory exporters: spans and metrics are recorded
//
//	exactly as in production, and the test reads them from memory instead of a back end.
//
// PT: Os testes usam o SDK real com exporters em memória: spans e métricas são registrados
//
//	exatamente como em produção, e o teste os lê da memória em vez de um back end.
//
// ES: Las pruebas usan el SDK real con exporters en memoria: los spans y las métricas se registran
//
//	exactamente como en producción, y la prueba los lee de la memoria en lugar de un back end.
func newTestService(t *testing.T) (*Service, *tracetest.SpanRecorder, *sdkmetric.ManualReader) {
	t.Helper()
	recorder := tracetest.NewSpanRecorder()
	tracerProvider := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(recorder))
	reader := sdkmetric.NewManualReader()
	meterProvider := sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader))
	histogram, err := NewDurationHistogram(meterProvider)
	if err != nil {
		t.Fatal(err)
	}
	return &Service{
		Tracer:     tracerProvider.Tracer(scope),
		Duration:   histogram,
		Logger:     Discard,
		Propagator: propagation.TraceContext{},
		SlowSKU:    "slow-widget",
		SlowDelay:  60 * time.Millisecond,
		FastDelay:  time.Millisecond,
	}, recorder, reader
}

func spanByName(t *testing.T, spans []sdktrace.ReadOnlySpan, name string) sdktrace.ReadOnlySpan {
	t.Helper()
	for _, span := range spans {
		if span.Name() == name {
			return span
		}
	}
	t.Fatalf("span %q not found", name)
	return nil
}

func attr(span sdktrace.ReadOnlySpan, key string) attribute.Value {
	for _, kv := range span.Attributes() {
		if string(kv.Key) == key {
			return kv.Value
		}
	}
	return attribute.Value{}
}

func TestContinuesTheTraceOfTheCaller(t *testing.T) {
	service, recorder, _ := newTestService(t)
	request := httptest.NewRequest(http.MethodGet, "/stock/blue-pen", nil)
	request.Header.Set("traceparent", "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01")
	response := httptest.NewRecorder()
	service.Handler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d", response.Code)
	}
	server := spanByName(t, recorder.Ended(), "GET /stock/{sku}")
	if got := server.SpanContext().TraceID().String(); got != "0af7651916cd43dd8448eb211c80319c" {
		t.Errorf("trace id = %s, want the one of the caller", got)
	}
	if got := server.Parent().SpanID().String(); got != "b7ad6b7169203331" {
		t.Errorf("parent span id = %s, want the span id in traceparent", got)
	}
	lookup := spanByName(t, recorder.Ended(), "warehouse.lookup")
	if lookup.Parent().SpanID() != server.SpanContext().SpanID() {
		t.Error("warehouse.lookup must be a child of the server span")
	}
}

func TestWithoutTraceparentANewTraceStarts(t *testing.T) {
	service, recorder, _ := newTestService(t)
	service.Handler().ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/stock/blue-pen", nil))

	server := spanByName(t, recorder.Ended(), "GET /stock/{sku}")
	if server.Parent().IsValid() {
		t.Error("a request with no traceparent must produce a root span")
	}
}

func TestSlowSkuProducesOneLongSpanThatExplainsItself(t *testing.T) {
	service, recorder, _ := newTestService(t)
	service.Handler().ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/stock/slow-widget", nil))
	service.Handler().ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/stock/blue-pen", nil))

	var slow, fast sdktrace.ReadOnlySpan
	for _, span := range recorder.Ended() {
		if span.Name() != "warehouse.lookup" {
			continue
		}
		if attr(span, "warehouse.sku").AsString() == "slow-widget" {
			slow = span
		} else {
			fast = span
		}
	}
	if slow == nil || fast == nil {
		t.Fatal("expected one lookup span per request")
	}
	if got := slow.EndTime().Sub(slow.StartTime()); got < service.SlowDelay {
		t.Errorf("slow span lasted %v, want at least %v", got, service.SlowDelay)
	}
	if got := fast.EndTime().Sub(fast.StartTime()); got >= service.SlowDelay {
		t.Errorf("fast span lasted %v, want less than %v", got, service.SlowDelay)
	}
	if got := attr(slow, "warehouse.scan").AsString(); got != "full" {
		t.Errorf("warehouse.scan = %q, want full", got)
	}
	if got := attr(fast, "warehouse.scan").AsString(); got != "index" {
		t.Errorf("warehouse.scan = %q, want index", got)
	}
}

func TestMetricHasNoSkuAttribute(t *testing.T) {
	service, _, reader := newTestService(t)
	for _, sku := range []string{"blue-pen", "red-pen", "slow-widget"} {
		service.Handler().ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/stock/"+sku, nil))
	}

	var collected metricdata.ResourceMetrics
	if err := reader.Collect(context.Background(), &collected); err != nil {
		t.Fatal(err)
	}
	histogram, ok := collected.ScopeMetrics[0].Metrics[0].Data.(metricdata.Histogram[float64])
	if !ok {
		t.Fatal("expected a float64 histogram")
	}
	// EN: Three different SKUs, one time series: the route template keeps cardinality low.
	// PT: Três SKUs diferentes, uma série temporal: a rota modelo mantém a cardinalidade baixa.
	// ES: Tres SKUs distintos, una serie temporal: la ruta modelo mantiene baja la cardinalidad.
	if len(histogram.DataPoints) != 1 {
		t.Fatalf("data points = %d, want 1", len(histogram.DataPoints))
	}
	if got := histogram.DataPoints[0].Count; got != 3 {
		t.Errorf("count = %d, want 3", got)
	}
}

func TestInvalidSkuIsRejected(t *testing.T) {
	service, _, _ := newTestService(t)
	response := httptest.NewRecorder()
	service.Handler().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/stock/NOT_VALID", nil))
	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", response.Code)
	}
}
