// Command lb runs the load balancer. Configuration comes from environment variables:
//
//	LISTEN           address to listen on (default :8080)
//	BACKENDS         comma-separated list, for example http://api-1:3000,http://api-2:3000
//	STRATEGY         round-robin (default) or least-connections
//	HEALTH_PATH      path of the active health check (default /health)
//	HEALTH_INTERVAL  time between probes (default 1s)
//	HEALTH_TIMEOUT   time to wait for a probe (default 500ms)
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"l7-load-balancer/balancer"
)

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func duration(name, fallback string) (time.Duration, error) {
	value, err := time.ParseDuration(env(name, fallback))
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("%s: expected a positive duration such as 1s", name)
	}
	return value, nil
}

func run() error {
	pool, err := balancer.NewPool(strings.Split(os.Getenv("BACKENDS"), ","))
	if err != nil {
		return fmt.Errorf("BACKENDS: %w", err)
	}
	strategy, err := balancer.StrategyByName(env("STRATEGY", "round-robin"))
	if err != nil {
		return fmt.Errorf("STRATEGY: %w", err)
	}
	interval, err := duration("HEALTH_INTERVAL", "1s")
	if err != nil {
		return err
	}
	timeout, err := duration("HEALTH_TIMEOUT", "500ms")
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go balancer.NewChecker(pool, env("HEALTH_PATH", "/health"), interval, timeout).Run(ctx)

	mux := http.NewServeMux()
	// EN: The balancer answers this one path itself. Everything else goes to a back end.
	// PT: O balanceador responde este único caminho por conta própria. Todo o resto vai para
	// um back end.
	// ES: El balanceador responde por sí mismo solo esta ruta. Todo lo demás va a un back end.
	mux.HandleFunc("GET /lb/status", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"strategy": strategy.Name(), "backends": pool.Snapshot()})
	})
	mux.Handle("/", balancer.NewProxy(pool, strategy, balancer.DefaultOptions()))

	server := &http.Server{Addr: env("LISTEN", ":8080"), Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() {
		<-ctx.Done()
		// EN: Graceful shutdown: stop accepting, let the requests in progress finish.
		// PT: Desligamento gracioso: para de aceitar e deixa as requisições em andamento
		// terminarem.
		// ES: Apagado ordenado: deja de aceptar y deja que terminen las solicitudes en curso.
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdown)
	}()
	slog.Info("load balancer listening", "address", server.Addr, "strategy", strategy.Name(), "backends", len(pool.Backends()))
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func main() {
	if err := run(); err != nil {
		slog.Error(err.Error())
		os.Exit(1)
	}
}
