// Command backend is the server that sits behind the balancers in the benchmark. It does
// almost nothing on purpose: the benchmark measures the cost of the proxy in front of it.
package main

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"
)

func main() {
	name := os.Getenv("INSTANCE")
	if name == "" {
		name = "backend"
	}
	listen := os.Getenv("LISTEN")
	if listen == "" {
		listen = ":3000"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = fmt.Fprintln(w, "ok")
	})
	// EN: The name of the instance goes in a header, so a client can see which back end the
	// balancer chose.
	// PT: O nome da instância vai em um cabeçalho, então um cliente consegue ver qual back end
	// o balanceador escolheu.
	mux.HandleFunc("GET /work", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Instance", name)
		_, _ = fmt.Fprintf(w, "{\"instance\":%q}\n", name)
	})

	server := &http.Server{Addr: listen, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	slog.Info("back end listening", "instance", name, "address", listen)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		slog.Error(err.Error())
		os.Exit(1)
	}
}
