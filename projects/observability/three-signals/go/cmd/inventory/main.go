// Command inventory runs the inventory service of the three-signals lab.
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	inventory "three-signals"
)

func envOr(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func main() {
	addr := ":" + envOr("PORT", "3000")

	// EN: `inventory healthcheck` is the container health check: it opens the real TCP port,
	//     the same one the clients use. The image needs no curl for this.
	// PT: `inventory healthcheck` é o health check do contêiner: abre a porta TCP real, a
	//     mesma que os clientes usam. A imagem não precisa de curl para isso.
	// ES: `inventory healthcheck` es el health check del contenedor: abre el puerto TCP real, el
	//     mismo que usan los clientes. La imagen no necesita curl para eso.
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		conn, err := net.DialTimeout("tcp", "127.0.0.1"+addr, 2*time.Second)
		if err != nil {
			os.Exit(1)
		}
		_ = conn.Close()
		return
	}

	if err := run(addr); err != nil {
		log.Fatal(err)
	}
}

func run(addr string) error {
	slowMillis, err := strconv.Atoi(envOr("SLOW_MS", "800"))
	if err != nil || slowMillis < 0 || slowMillis > 10000 {
		return errors.New("SLOW_MS must be an integer from 0 to 10000")
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	service, shutdown, err := inventory.StartOTLP(ctx, "inventory")
	if err != nil {
		return fmt.Errorf("starting telemetry: %w", err)
	}
	service.SlowSKU = envOr("SLOW_SKU", "slow-widget")
	service.SlowDelay = time.Duration(slowMillis) * time.Millisecond
	service.FastDelay = 8 * time.Millisecond

	server := &http.Server{Addr: addr, Handler: service.Handler(), ReadHeaderTimeout: 5 * time.Second}
	// EN: On SIGTERM: stop accepting requests, then flush the last batch of each signal.
	//     Without the flush, the telemetry of the final seconds dies with the process.
	// PT: No SIGTERM: para de aceitar requisições e depois descarrega o último lote de cada
	//     sinal. Sem isso, a telemetria dos segundos finais morre com o processo.
	// ES: En SIGTERM: deja de aceptar peticiones y luego vacía el último lote de cada
	//     señal. Sin eso, la telemetría de los segundos finales muere con el proceso.
	flushed := make(chan struct{})
	go func() {
		defer close(flushed)
		<-ctx.Done()
		flushCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = server.Shutdown(flushCtx)
		_ = shutdown(flushCtx)
	}()

	log.Printf("inventory listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("serving: %w", err)
	}
	<-flushed
	return nil
}
