// Package inventory is the third service of the lab, written in Go on purpose: the trace that
// starts in two TypeScript services continues here, which only works because all of them speak
// the same W3C Trace Context header and the same OTLP protocol.
//
// PT: O pacote inventory é o terceiro serviço do laboratório, escrito em Go de propósito: o
// trace que começa em dois serviços TypeScript continua aqui, o que só funciona porque todos
// falam o mesmo cabeçalho W3C Trace Context e o mesmo protocolo OTLP.
package inventory

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"regexp"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

// Service holds the instruments of the three signals and the injected fault.
type Service struct {
	Tracer     trace.Tracer
	Duration   metric.Float64Histogram
	Logger     *slog.Logger
	Propagator propagation.TextMapPropagator

	// EN: The injected slow dependency. Lookups of SlowSKU take SlowDelay, every other SKU
	//     takes FastDelay. Nothing in the metrics says which SKU is slow: only the span
	//     attributes and the logs carry that detail.
	// PT: A dependência lenta injetada. Consultas do SlowSKU levam SlowDelay, qualquer outro
	//     SKU leva FastDelay. Nada nas métricas diz qual SKU é lento: só os atributos do span
	//     e os logs carregam esse detalhe.
	SlowSKU   string
	SlowDelay time.Duration
	FastDelay time.Duration
}

// Stock is the JSON answer of GET /stock/{sku}.
type Stock struct {
	SKU     string `json:"sku"`
	InStock bool   `json:"inStock"`
	Shelf   string `json:"shelf"`
}

var skuPattern = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)

// Handler returns the HTTP routes of the service.
func (s *Service) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("GET /stock/{sku}", s.stock)
	return mux
}

func (s *Service) stock(w http.ResponseWriter, r *http.Request) {
	const route = "/stock/{sku}"
	// EN: Extract reads `traceparent` from the request headers. The span started from this
	//     context is a child of the span of the orders service and keeps its trace id.
	// PT: Extract lê o `traceparent` dos cabeçalhos da requisição. O span iniciado a partir
	//     deste contexto é filho do span do serviço orders e mantém o trace id dele.
	ctx := s.Propagator.Extract(r.Context(), propagation.HeaderCarrier(r.Header))
	ctx, span := s.Tracer.Start(ctx, "GET "+route,
		trace.WithSpanKind(trace.SpanKindServer),
		trace.WithAttributes(attribute.String("http.request.method", r.Method), attribute.String("http.route", route)),
	)
	started := time.Now()
	status := http.StatusOK
	defer func() {
		seconds := time.Since(started).Seconds()
		span.SetAttributes(attribute.Int("http.response.status_code", status))
		if status >= http.StatusInternalServerError {
			span.SetStatus(codes.Error, "")
		}
		// EN: Same metric name, unit and attributes as the TypeScript services, so one query
		//     covers the three services. No SKU here: it would be one time series per product.
		// PT: Mesmo nome de métrica, unidade e atributos dos serviços TypeScript, então uma
		//     consulta cobre os três serviços. Sem SKU aqui: seria uma série temporal por produto.
		s.Duration.Record(ctx, seconds, metric.WithAttributes(
			attribute.String("http.request.method", r.Method),
			attribute.String("http.route", route),
			attribute.Int("http.response.status_code", status),
		))
		s.Logger.InfoContext(ctx, "request handled",
			slog.String("http.route", route), slog.Int("http.response.status_code", status),
			slog.Int64("duration_ms", time.Since(started).Milliseconds()))
		span.End()
	}()

	sku := r.PathValue("sku")
	if !skuPattern.MatchString(sku) {
		status = http.StatusBadRequest
		http.Error(w, `{"error":"invalid sku"}`, status)
		return
	}
	shelf := s.warehouseLookup(ctx, sku)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(Stock{SKU: sku, InStock: true, Shelf: shelf})
}

// warehouseLookup stands for a call to a dependency (a database, another API). It has its own
// span, so the trace shows how much of the request was spent waiting for it.
//
// PT: warehouseLookup representa uma chamada a uma dependência (um banco, outra API). Ela tem o
// seu próprio span, então o trace mostra quanto da requisição foi gasto esperando por ela.
func (s *Service) warehouseLookup(ctx context.Context, sku string) string {
	ctx, span := s.Tracer.Start(ctx, "warehouse.lookup",
		trace.WithSpanKind(trace.SpanKindClient),
		trace.WithAttributes(attribute.String("warehouse.sku", sku)),
	)
	defer span.End()

	started := time.Now()
	scan := "index"
	delay := s.FastDelay
	if sku == s.SlowSKU {
		scan = "full"
		delay = s.SlowDelay
	}
	time.Sleep(delay)
	// EN: The attribute is the explanation. A person who finds this long span reads
	//     `warehouse.scan = full` and knows why it was slow, without opening the code.
	// PT: O atributo é a explicação. Quem encontra este span longo lê `warehouse.scan = full`
	//     e sabe por que foi lento, sem abrir o código.
	span.SetAttributes(attribute.String("warehouse.scan", scan))

	elapsed := time.Since(started).Milliseconds()
	if scan == "full" {
		// EN: Logging with the context is what links the line to the trace: the bridge copies
		//     the trace id and the span id of the active span into the log record.
		// PT: Registrar o log com o contexto é o que liga a linha ao trace: a ponte copia o
		//     trace id e o span id do span ativo para o registro de log.
		s.Logger.WarnContext(ctx, "warehouse lookup was slow: full shelf scan, no index for this sku",
			slog.String("warehouse.sku", sku), slog.Int64("duration_ms", elapsed))
	} else {
		s.Logger.InfoContext(ctx, "warehouse lookup finished",
			slog.String("warehouse.sku", sku), slog.Int64("duration_ms", elapsed))
	}
	return "shelf-" + sku[:1]
}
