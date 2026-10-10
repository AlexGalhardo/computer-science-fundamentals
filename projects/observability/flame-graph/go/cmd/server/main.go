// Command server exposes the two variants of the report and the Go CPU profiler.
package main

import (
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"net/http/pprof"
	"os"
	"runtime"
	"time"

	"flame-graph/report"
)

func envOr(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func writeJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("encode: %v", err)
	}
}

// EN: The same 300 lines for every request. The work per request is identical, so the only
// difference between the two routes is the variant of the code.
//
// PT: As mesmas 300 linhas para toda requisição. O trabalho por requisição é idêntico, então a
// única diferença entre as duas rotas é a variante do código.
// ES: Las mismas 300 líneas para cada petición. El trabajo por petición es idéntico, así que la
// única diferencia entre las dos rutas es la variante del código.
var lines = report.SampleLines(300)

// EN: Named handlers, so their names show up as frames in the profile.
// PT: Handlers com nome, para que os nomes apareçam como quadros no perfil.
// ES: Handlers con nombre, para que los nombres aparezcan como cuadros en el perfil.
func handleReportBefore(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, report.SummarizeBefore(lines))
}

func handleReportAfter(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, report.SummarizeAfter(lines))
}

func newMux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("GET /version", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, map[string]string{"runtime": runtime.Version()})
	})
	mux.HandleFunc("GET /before/report", handleReportBefore)
	mux.HandleFunc("GET /after/report", handleReportAfter)

	// EN: `GET /debug/pprof/profile?seconds=N` samples the stacks of the running goroutines
	//     about 100 times per second for N seconds and returns the profile. The cost is low
	//     enough to run in production, but the endpoint reveals internals, so it must never be
	//     reachable from outside. Here the network of docker-compose is internal.
	// PT: `GET /debug/pprof/profile?seconds=N` amostra as pilhas das goroutines em execução
	//     cerca de 100 vezes por segundo durante N segundos e devolve o perfil. O custo é
	//     baixo o bastante para rodar em produção, mas o endpoint revela detalhes internos,
	//     então nunca pode ser alcançável de fora. Aqui a rede do docker-compose é interna.
	// ES: `GET /debug/pprof/profile?seconds=N` muestrea las pilas de las goroutines en ejecución
	//     unas 100 veces por segundo durante N segundos y devuelve el perfil. El costo es
	//     lo bastante bajo para ejecutarse en producción, pero el endpoint revela detalles internos,
	//     así que nunca debe ser alcanzable desde fuera. Aquí la red de docker-compose es interna.
	mux.HandleFunc("GET /debug/pprof/profile", pprof.Profile)
	return mux
}

func main() {
	addr := ":" + envOr("PORT", "8080")

	// EN: `server healthcheck` opens the real TCP port, the same one the clients use.
	// PT: `server healthcheck` abre a porta TCP real, a mesma que os clientes usam.
	// ES: `server healthcheck` abre el puerto TCP real, el mismo que usan los clientes.
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		conn, err := net.DialTimeout("tcp", "127.0.0.1"+addr, 2*time.Second)
		if err != nil {
			os.Exit(1)
		}
		_ = conn.Close()
		return
	}

	server := &http.Server{Addr: addr, Handler: newMux(), ReadHeaderTimeout: 5 * time.Second}
	log.Printf("go server listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server: %v", err)
	}
}
