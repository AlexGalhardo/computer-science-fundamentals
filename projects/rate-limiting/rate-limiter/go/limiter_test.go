package ratelimiter

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
)

type request struct {
	AtMs       int64  `json:"atMs"`
	Allowed    bool   `json:"allowed"`
	DepartAtMs *int64 `json:"departAtMs"`
}

type limiterCase struct {
	Name      string    `json:"name"`
	Algorithm string    `json:"algorithm"`
	Limit     int64     `json:"limit"`
	WindowMs  int64     `json:"windowMs"`
	Requests  []request `json:"requests"`
}

// EN: The table is the same file the TypeScript tests read. Both languages must reach the
// decisions written there by hand.
// PT: A tabela é o mesmo arquivo que os testes em TypeScript leem. As duas linguagens
// precisam chegar às decisões escritas lá à mão.
// ES: La tabla es el mismo archivo que leen las pruebas en TypeScript. Los dos lenguajes
// deben llegar a los veredictos escritos allí a mano.
func loadCases(t *testing.T) []limiterCase {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("..", "cases", "cases.json"))
	if err != nil {
		t.Fatalf("reading the table of cases: %v", err)
	}
	var file struct {
		Cases []limiterCase `json:"cases"`
	}
	if err := json.Unmarshal(data, &file); err != nil {
		t.Fatalf("parsing the table of cases: %v", err)
	}
	if len(file.Cases) == 0 {
		t.Fatal("the table of cases is empty")
	}
	return file.Cases
}

func TestTableOfAllowedAndRejectedRequests(t *testing.T) {
	seen := map[string]int{}
	for _, item := range loadCases(t) {
		seen[item.Algorithm]++
		t.Run(item.Name, func(t *testing.T) {
			limiter, err := New(item.Algorithm, Config{Limit: item.Limit, WindowMs: item.WindowMs})
			if err != nil {
				t.Fatal(err)
			}
			for index, req := range item.Requests {
				if got := limiter.Allow(req.AtMs); got != req.Allowed {
					t.Errorf("request %d at %d ms: allowed = %v, want %v", index, req.AtMs, got, req.Allowed)
				}
			}
		})
	}
	for _, algorithm := range Algorithms {
		if seen[algorithm] < 3 {
			t.Errorf("%s has %d cases, want at least 3", algorithm, seen[algorithm])
		}
	}
}

func TestLeakyBucketDepartures(t *testing.T) {
	for _, item := range loadCases(t) {
		if item.Algorithm != "leaky-bucket" {
			continue
		}
		t.Run(item.Name, func(t *testing.T) {
			bucket := &LeakyBucket{config: Config{Limit: item.Limit, WindowMs: item.WindowMs}}
			for index, req := range item.Requests {
				departAt, ok := bucket.Schedule(req.AtMs)
				if ok != req.Allowed {
					t.Fatalf("request %d at %d ms: admitted = %v, want %v", index, req.AtMs, ok, req.Allowed)
				}
				if ok && (req.DepartAtMs == nil || departAt != *req.DepartAtMs) {
					t.Errorf("request %d at %d ms: departs at %d, want %v", index, req.AtMs, departAt, req.DepartAtMs)
				}
			}
		})
	}
}

func TestNewRejectsBadInput(t *testing.T) {
	if _, err := New("fixed-window", Config{Limit: 0, WindowMs: 1000}); err == nil {
		t.Error("limit 0 was accepted")
	}
	if _, err := New("magic", Config{Limit: 1, WindowMs: 1000}); err == nil {
		t.Error("an unknown algorithm was accepted")
	}
}

// EN: The part that is specific to Go. 64 goroutines hit the same limiter at the same
// logical instant. With the mutex, exactly Limit requests pass. Remove the Lock from any
// Allow and this test fails in two ways: more than Limit pass, and `go test -race` reports
// the data race.
// PT: A parte específica do Go. 64 goroutines atingem o mesmo limitador no mesmo instante
// lógico. Com o mutex, passam exatamente Limit requisições. Remova o Lock de qualquer Allow
// e este teste falha de duas formas: passam mais que Limit, e o `go test -race` denuncia a
// corrida de dados.
// ES: La parte específica de Go. 64 goroutines golpean el mismo limitador en el mismo instante
// lógico. Con el mutex, pasan exactamente Limit solicitudes. Quita el Lock de cualquier Allow
// y esta prueba falla de dos formas: pasan más que Limit, y `go test -race` delata la
// carrera de datos.
func TestConcurrentCallersNeverExceedTheLimit(t *testing.T) {
	const goroutines, perGoroutine, limit = 64, 200, 100
	for _, algorithm := range Algorithms {
		t.Run(algorithm, func(t *testing.T) {
			limiter, err := New(algorithm, Config{Limit: limit, WindowMs: 60_000})
			if err != nil {
				t.Fatal(err)
			}
			var admitted atomic.Int64
			var wg sync.WaitGroup
			for range goroutines {
				wg.Go(func() {
					for range perGoroutine {
						if limiter.Allow(1000) {
							admitted.Add(1)
						}
					}
				})
			}
			wg.Wait()
			if got := admitted.Load(); got != limit {
				t.Errorf("admitted %d of %d concurrent requests, want exactly %d", got, goroutines*perGoroutine, limit)
			}
		})
	}
}
