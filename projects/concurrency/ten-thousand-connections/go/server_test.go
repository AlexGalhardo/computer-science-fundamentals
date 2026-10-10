package server

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestEchoReturnsTheBody(t *testing.T) {
	srv := httptest.NewServer(NewHandler())
	defer srv.Close()
	response, err := http.Post(srv.URL+"/echo", "text/plain", strings.NewReader("hello"))
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = response.Body.Close() }()
	body, _ := io.ReadAll(response.Body)
	if response.StatusCode != http.StatusOK || string(body) != "hello" {
		t.Fatalf("got %d %q, want 200 \"hello\"", response.StatusCode, body)
	}
}

func TestDelayRejectsBadInput(t *testing.T) {
	srv := httptest.NewServer(NewHandler())
	defer srv.Close()
	for _, query := range []string{"", "?ms=abc", "?ms=-1", "?ms=60001"} {
		response, err := http.Get(srv.URL + "/delay" + query)
		if err != nil {
			t.Fatal(err)
		}
		_ = response.Body.Close()
		if response.StatusCode != http.StatusBadRequest {
			t.Fatalf("/delay%s: got %d, want 400", query, response.StatusCode)
		}
	}
}

// EN: 200 requests that each wait 300 ms finish together in well under a second, because every
// one of them waits in its own goroutine. Served one after the other they would take a minute.
// PT: 200 requisições que esperam 300 ms cada terminam juntas em bem menos de um segundo,
// porque cada uma espera em sua própria goroutine. Atendidas uma depois da outra, levariam
// um minuto.
// ES: 200 solicitudes que esperan 300 ms cada una terminan juntas en bastante menos de un segundo,
// porque cada una espera en su propia goroutine. Atendidas una tras otra, tardarían
// un minuto.
func TestDelaysRunConcurrently(t *testing.T) {
	srv := httptest.NewServer(NewHandler())
	defer srv.Close()
	start := time.Now()
	var wg sync.WaitGroup
	for range 200 {
		wg.Go(func() {
			response, err := http.Get(srv.URL + "/delay?ms=300")
			if err != nil {
				t.Error(err)
				return
			}
			_ = response.Body.Close()
		})
	}
	wg.Wait()
	if elapsed := time.Since(start); elapsed > 5*time.Second {
		t.Fatalf("200 concurrent delays took %s, want far less than 60 s", elapsed)
	}
}
