// EN: HTTP server of the benchmark in Go, with only the standard library (net/http).
// Model: the server starts one goroutine per connection. Handlers are written as plain
// blocking code, and the runtime multiplexes the goroutines over a few OS threads, using
// every core it is allowed to use.
// Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
// PT: Servidor HTTP do benchmark em Go, só com a biblioteca padrão (net/http).
// Modelo: o servidor sobe uma goroutine por conexão. Os handlers são escritos como código
// bloqueante comum, e o runtime multiplexa as goroutines sobre poucas threads do SO, usando
// todos os núcleos que pode usar.
// Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.
// ES: Servidor HTTP del benchmark en Go, solo con la biblioteca estándar (net/http).
// Modelo: el servidor levanta una goroutine por conexión. Los handlers se escriben como código
// bloqueante común, y el runtime multiplexa las goroutines sobre pocos threads del SO, usando
// todos los núcleos que puede usar.
// Protocolo (el mismo en los 7 lenguajes): GET /health, POST /echo, GET /primes?limit=N.
package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
)

const maxLimit = 100000

func isPrime(k int) bool {
	if k < 2 {
		return false
	}
	if k < 4 {
		return true
	}
	if k%2 == 0 {
		return false
	}
	for d := 3; d*d <= k; d += 2 {
		if k%d == 0 {
			return false
		}
	}
	return true
}

// EN: The CPU-bound endpoint: count the primes up to limit by trial division.
// PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
// ES: El endpoint limitado por CPU: cuenta los primos hasta limit por división de prueba.
func countPrimes(limit int) int {
	count := 0
	for k := 2; k <= limit; k++ {
		if isPrime(k) {
			count++
		}
	}
	return count
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("writing response: %v", err)
	}
}

// EN: The echo endpoint parses the JSON body and serialises it again, so it measures the JSON
// library and the HTTP stack, not a copy of bytes.
// PT: O endpoint de eco interpreta o corpo JSON e o serializa de novo, então mede a biblioteca
// de JSON e a pilha HTTP, não uma cópia de bytes.
// ES: El endpoint de eco interpreta el cuerpo JSON y lo serializa de nuevo, así que mide la biblioteca
// de JSON y la pila HTTP, no una copia de bytes.
func echo(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	var value any
	if err == nil {
		err = json.Unmarshal(body, &value)
	}
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"language": "go", "echo": value})
}

func primes(w http.ResponseWriter, r *http.Request) {
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit < 2 || limit > maxLimit {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid limit"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"language": "go", "limit": limit, "count": countPrimes(limit)})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("POST /echo", echo)
	mux.HandleFunc("GET /primes", primes)
	log.Fatal(http.ListenAndServe(":8080", mux))
}
