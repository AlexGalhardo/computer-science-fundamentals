// Package server is the Go implementation of the ten-thousand-connections mini-project: an
// HTTP server with an echo route and a delayed-response route.
package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync/atomic"
	"time"
)

// MaxDelayMs is the longest wait accepted by /delay.
const MaxDelayMs = 60_000

// maxEchoBytes limits the body accepted by /echo.
const maxEchoBytes = 1 << 20

// inFlight counts the requests being handled right now.
var inFlight atomic.Int64

// rssKb reads the resident memory of this process from Linux, in KiB.
func rssKb() int {
	data, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return 0
	}
	for line := range strings.SplitSeq(string(data), "\n") {
		if rest, ok := strings.CutPrefix(line, "VmRSS:"); ok {
			kb, _ := strconv.Atoi(strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(rest), "kB")))
			return kb
		}
	}
	return 0
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	_, _ = io.WriteString(w, "ok")
}

func echo(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxEchoBytes))
	if err != nil {
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "body is too large"})
		return
	}
	contentType := r.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	w.Header().Set("Content-Type", contentType)
	_, _ = w.Write(body)
}

// delay answers after the number of milliseconds asked in the query string.
//
// EN: net/http runs every connection in its own goroutine, so this handler can simply sleep.
// A sleeping goroutine uses no thread: the runtime parks it, with a stack of a few kilobytes,
// and the thread goes on to run other goroutines. The code reads like one blocking thread per
// connection, and costs far less than that.
//
// PT: O net/http roda cada conexão em sua própria goroutine, então este handler pode
// simplesmente dormir. Uma goroutine dormindo não usa thread: o runtime a estaciona, com uma
// pilha de poucos kilobytes, e a thread segue rodando outras goroutines. O código parece uma
// thread bloqueante por conexão, e custa muito menos que isso.
//
// ES: net/http ejecuta cada conexión en su propia goroutine, así que este handler puede
// simplemente dormir. Una goroutine dormida no usa un thread: el runtime la estaciona, con una
// pila de pocos kilobytes, y el thread sigue ejecutando otras goroutines. El código parece un
// thread bloqueante por conexión, y cuesta mucho menos que eso.
func delay(w http.ResponseWriter, r *http.Request) {
	ms, err := strconv.Atoi(r.URL.Query().Get("ms"))
	if err != nil || ms < 0 || ms > MaxDelayMs {
		message := fmt.Sprintf("ms must be an integer from 0 to %d", MaxDelayMs)
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": message})
		return
	}
	select {
	case <-time.After(time.Duration(ms) * time.Millisecond):
		writeJSON(w, http.StatusOK, map[string]int{"waitedMs": ms})
	case <-r.Context().Done():
		// The client went away, so nobody is left to answer.
	}
}

func stats(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"runtime": runtime.Version(),
		// This request counts itself, so it is subtracted.
		"inFlight": inFlight.Load() - 1,
		"rssKb":    rssKb(),
	})
}

// NewHandler builds the routes shared by the three implementations.
func NewHandler() http.Handler {
	mux := http.NewServeMux()
	// A pattern with a method makes the mux answer 405 to the other methods by itself.
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("POST /echo", echo)
	mux.HandleFunc("GET /delay", delay)
	mux.HandleFunc("GET /stats", stats)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		inFlight.Add(1)
		defer inFlight.Add(-1)
		mux.ServeHTTP(w, r)
	})
}
