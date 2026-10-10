package balancer

import (
	"context"
	"io"
	"math"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// EN: Every test here is an integration test in the small: real HTTP servers on the loopback
// interface play the back ends, and the requests go through the real proxy handler. No
// network outside the machine is involved.
// PT: Todo teste aqui é um teste de integração em miniatura: servidores HTTP reais na
// interface de loopback fazem o papel dos back ends, e as requisições passam pelo handler
// real do proxy. Nenhuma rede fora da máquina é usada.
// ES: Cada prueba aquí es una prueba de integración en miniatura: servidores HTTP reales en la
// interfaz de loopback hacen el papel de los back ends, y las solicitudes pasan por el handler
// real del proxy. No se usa ninguna red fuera de la máquina.

type fakeBackend struct {
	server *httptest.Server
	name   string
	hits   atomic.Int64
	// seen keeps the last request headers received, for the header tests.
	mu   sync.Mutex
	seen http.Header
}

func startBackend(t *testing.T, name string, delay time.Duration) *fakeBackend {
	t.Helper()
	backend := &fakeBackend{name: name}
	backend.server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" {
			w.WriteHeader(http.StatusOK)
			return
		}
		backend.hits.Add(1)
		backend.mu.Lock()
		backend.seen = r.Header.Clone()
		backend.mu.Unlock()
		if delay > 0 {
			time.Sleep(delay)
		}
		w.Header().Set("X-Instance", name)
		w.Header().Set("Connection", "X-Secret-Hop")
		w.Header().Set("X-Secret-Hop", "must not reach the client")
		_, _ = io.WriteString(w, name)
	}))
	t.Cleanup(backend.server.Close)
	return backend
}

func newProxy(t *testing.T, strategy Strategy, backends ...*fakeBackend) (*Proxy, *Pool, *httptest.Server) {
	t.Helper()
	addresses := make([]string, 0, len(backends))
	for _, backend := range backends {
		addresses = append(addresses, backend.server.URL)
	}
	pool, err := NewPool(addresses)
	if err != nil {
		t.Fatal(err)
	}
	options := DefaultOptions()
	// EN: Generous on purpose. A failed request also removes its back end (passive check), so a
	// short timeout on a busy test machine would remove healthy back ends and spoil the counts.
	// PT: Folgado de propósito. Uma requisição que falha também remove o back end (verificação
	// passiva), então um timeout curto em uma máquina de teste ocupada removeria back ends
	// saudáveis e estragaria as contagens.
	// ES: Holgado a propósito. Una solicitud que falla también saca su back end (verificación
	// pasiva), así que un timeout corto en una máquina de prueba ocupada sacaría back ends sanos
	// y arruinaría los conteos.
	options.ResponseTimeout = 10 * time.Second
	proxy := NewProxy(pool, strategy, options)
	front := httptest.NewServer(proxy)
	t.Cleanup(front.Close)
	return proxy, pool, front
}

func get(t *testing.T, url string) (int, string) {
	t.Helper()
	response, err := http.Get(url)
	if err != nil {
		t.Fatalf("GET %s: %v", url, err)
	}
	defer response.Body.Close() //nolint:errcheck // test helper
	body, _ := io.ReadAll(response.Body)
	return response.StatusCode, string(body)
}

func TestRoundRobinSplitsRequestsEvenly(t *testing.T) {
	a, b, c := startBackend(t, "a", 0), startBackend(t, "b", 0), startBackend(t, "c", 0)
	_, _, front := newProxy(t, &RoundRobin{}, a, b, c)

	order := make([]string, 0, 6)
	for range 300 {
		status, body := get(t, front.URL+"/work")
		if status != http.StatusOK {
			t.Fatalf("status %d", status)
		}
		if len(order) < 6 {
			order = append(order, body)
		}
	}
	if got := strings.Join(order, ""); got != "abcabc" {
		t.Errorf("order of the first six requests = %q, want abcabc", got)
	}
	for _, backend := range []*fakeBackend{a, b, c} {
		if hits := backend.hits.Load(); hits != 100 {
			t.Errorf("back end %s served %d requests, want exactly 100", backend.name, hits)
		}
	}
}

func TestRoundRobinSkipsUnhealthyBackend(t *testing.T) {
	a, b, c := startBackend(t, "a", 0), startBackend(t, "b", 0), startBackend(t, "c", 0)
	_, pool, front := newProxy(t, &RoundRobin{}, a, b, c)
	pool.Backends()[1].SetHealthy(false)

	for range 100 {
		get(t, front.URL+"/work")
	}
	if a.hits.Load() != 50 || b.hits.Load() != 0 || c.hits.Load() != 50 {
		t.Errorf("hits = %d/%d/%d, want 50/0/50", a.hits.Load(), b.hits.Load(), c.hits.Load())
	}
}

func TestLeastConnectionsPicksTheIdlestBackend(t *testing.T) {
	pool, err := NewPool([]string{"http://a:1", "http://b:1", "http://c:1"})
	if err != nil {
		t.Fatal(err)
	}
	backends := pool.Backends()
	backends[0].inFlight.Store(5)
	backends[1].inFlight.Store(2)
	backends[2].inFlight.Store(7)
	strategy := &LeastConnections{}
	all := func(*Backend) bool { return true }
	for range 5 {
		if picked := strategy.Pick(backends, all); picked != backends[1] {
			t.Fatalf("picked %s, want the back end with 2 requests in flight", picked.URL.Host)
		}
	}
	// With the idlest one unusable, the next idlest is chosen.
	if picked := strategy.Pick(backends, func(b *Backend) bool { return b != backends[1] }); picked != backends[0] {
		t.Errorf("picked %s, want the back end with 5 requests in flight", picked.URL.Host)
	}
	if picked := strategy.Pick(backends, func(*Backend) bool { return false }); picked != nil {
		t.Errorf("picked %s with no usable back end", picked.URL.Host)
	}
}

func TestLeastConnectionsBreaksTiesInRotation(t *testing.T) {
	pool, _ := NewPool([]string{"http://a:1", "http://b:1", "http://c:1"})
	strategy := &LeastConnections{}
	counts := map[string]int{}
	for range 300 {
		counts[strategy.Pick(pool.Backends(), func(*Backend) bool { return true }).URL.Host]++
	}
	for host, count := range counts {
		if count != 100 {
			t.Errorf("%s picked %d times on ties, want 100", host, count)
		}
	}
}

// closedLoop sends `total` requests with `workers` requests in flight at all times.
func closedLoop(t *testing.T, url string, total, workers int) (failures int64) {
	t.Helper()
	var next, failed atomic.Int64
	var wait sync.WaitGroup
	client := &http.Client{Timeout: 30 * time.Second}
	for range workers {
		wait.Go(func() {
			for next.Add(1) <= int64(total) {
				response, err := client.Get(url)
				if err != nil {
					failed.Add(1)
					continue
				}
				_, _ = io.Copy(io.Discard, response.Body)
				_ = response.Body.Close()
				if response.StatusCode != http.StatusOK {
					failed.Add(1)
				}
			}
		})
	}
	wait.Wait()
	return failed.Load()
}

// EN: Two back ends answer in 20 ms and one in 80 ms. With the same number of requests in
// flight on each, the rates are 1/20 : 1/20 : 1/80 = 4 : 4 : 1, so the slow one should
// serve 1/9 of the requests. Round robin, under the same load, gives it one third.
// PT: Dois back ends respondem em 20 ms e um em 80 ms. Com o mesmo número de requisições em
// andamento em cada um, as taxas são 1/20 : 1/20 : 1/80 = 4 : 4 : 1, então o lento deve
// atender 1/9 das requisições. O round robin, sob a mesma carga, dá a ele um terço.
// ES: Dos back ends responden en 20 ms y uno en 80 ms. Con el mismo número de solicitudes en
// curso en cada uno, las tasas son 1/20 : 1/20 : 1/80 = 4 : 4 : 1, así que el lento debe
// atender 1/9 de las solicitudes. El round robin, bajo la misma carga, le da un tercio.
func TestDistributionWithOneSlowBackend(t *testing.T) {
	const total, workers, tolerance = 1200, 30, 0.05
	cases := []struct {
		strategy Strategy
		want     [3]float64
	}{
		{&LeastConnections{}, [3]float64{4.0 / 9, 4.0 / 9, 1.0 / 9}},
		{&RoundRobin{}, [3]float64{1.0 / 3, 1.0 / 3, 1.0 / 3}},
	}
	for _, tc := range cases {
		t.Run(tc.strategy.Name(), func(t *testing.T) {
			fast1 := startBackend(t, "fast1", 20*time.Millisecond)
			fast2 := startBackend(t, "fast2", 20*time.Millisecond)
			slow := startBackend(t, "slow", 80*time.Millisecond)
			_, _, front := newProxy(t, tc.strategy, fast1, fast2, slow)

			if failures := closedLoop(t, front.URL+"/work", total, workers); failures != 0 {
				t.Fatalf("%d requests failed", failures)
			}
			for index, backend := range []*fakeBackend{fast1, fast2, slow} {
				share := float64(backend.hits.Load()) / total
				if math.Abs(share-tc.want[index]) > tolerance {
					t.Errorf("%s served %.1f%%, want %.1f%% within %.0f points",
						backend.name, share*100, tc.want[index]*100, tolerance*100)
				}
			}
		})
	}
}

func TestActiveCheckRemovesStoppedBackendWithinTheInterval(t *testing.T) {
	const interval = 100 * time.Millisecond
	a, b, c := startBackend(t, "a", 0), startBackend(t, "b", 0), startBackend(t, "c", 0)
	_, pool, _ := newProxy(t, &RoundRobin{}, a, b, c)
	checker := NewChecker(pool, "/health", interval, 50*time.Millisecond)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go checker.Run(ctx)

	time.Sleep(interval / 2)
	stopped := time.Now()
	c.server.Close()

	// No client traffic at all: only the probe can find the failure.
	// One interval, plus the probe timeout and some room for a busy test machine.
	deadline := stopped.Add(interval + 150*time.Millisecond)
	for pool.Backends()[2].Healthy() {
		if time.Now().After(deadline) {
			t.Fatalf("back end still in rotation %v after it stopped (interval %v)", time.Since(stopped), interval)
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Logf("removed %v after it stopped (interval %v)", time.Since(stopped).Round(time.Millisecond), interval)
	if !pool.Backends()[0].Healthy() || !pool.Backends()[1].Healthy() {
		t.Error("a healthy back end was removed")
	}
}

func TestNoRequestFailsWhileABackendStops(t *testing.T) {
	a, b, c := startBackend(t, "a", time.Millisecond), startBackend(t, "b", time.Millisecond), startBackend(t, "c", time.Millisecond)
	_, pool, front := newProxy(t, &RoundRobin{}, a, b, c)
	checker := NewChecker(pool, "/health", 100*time.Millisecond, 50*time.Millisecond)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go checker.Run(ctx)

	// EN: The back end is stopped in the middle of the load. CloseClientConnections drops the
	// connections that are open, which is what the death of a process looks like.
	// PT: O back end é parado no meio da carga. CloseClientConnections derruba as conexões
	// abertas, que é como a morte de um processo se parece.
	// ES: El back end se detiene en medio de la carga. CloseClientConnections corta las
	// conexiones abiertas, que es como se ve la muerte de un proceso.
	go func() {
		time.Sleep(150 * time.Millisecond)
		c.server.CloseClientConnections()
		c.server.Close()
	}()
	failures := closedLoop(t, front.URL+"/work", 3000, 20)
	if failures != 0 {
		t.Errorf("%d of 3000 requests failed while a back end stopped", failures)
	}
	if pool.Backends()[2].Healthy() {
		t.Error("the stopped back end is still in rotation")
	}
	if a.hits.Load()+b.hits.Load() < 2000 {
		t.Errorf("the two survivors served only %d requests", a.hits.Load()+b.hits.Load())
	}
}

func TestBackendReturnsAfterASuccessfulProbe(t *testing.T) {
	a, b := startBackend(t, "a", 0), startBackend(t, "b", 0)
	_, pool, front := newProxy(t, &RoundRobin{}, a, b)
	checker := NewChecker(pool, "/health", time.Hour, 50*time.Millisecond)
	checker.PassAfter = 2

	pool.Backends()[1].SetHealthy(false)
	checker.CheckOnce(context.Background())
	if pool.Backends()[1].Healthy() {
		t.Fatal("back in rotation after one probe, want two consecutive passes")
	}
	checker.CheckOnce(context.Background())
	if !pool.Backends()[1].Healthy() {
		t.Fatal("not back in rotation after two passes")
	}
	for range 10 {
		get(t, front.URL+"/work")
	}
	if b.hits.Load() != 5 {
		t.Errorf("returned back end served %d of 10 requests, want 5", b.hits.Load())
	}
}

// brokenBackend accepts the request and closes the connection without answering.
func brokenBackend(t *testing.T) (*httptest.Server, *atomic.Int64) {
	t.Helper()
	var hits atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
		hijacker, ok := w.(http.Hijacker)
		if !ok {
			t.Error("cannot hijack")
			return
		}
		connection, _, err := hijacker.Hijack()
		if err == nil {
			_ = connection.Close()
		}
	}))
	t.Cleanup(server.Close)
	return server, &hits
}

func TestRetryAfterSendingOnlyForIdempotentRequests(t *testing.T) {
	for _, tc := range []struct {
		method          string
		wantStatus      int
		wantHealthyHits int64
	}{
		{http.MethodGet, http.StatusOK, 1},
		{http.MethodPost, http.StatusBadGateway, 0},
	} {
		t.Run(tc.method, func(t *testing.T) {
			broken, brokenHits := brokenBackend(t)
			healthy := startBackend(t, "healthy", 0)
			pool, err := NewPool([]string{broken.URL, healthy.server.URL})
			if err != nil {
				t.Fatal(err)
			}
			front := httptest.NewServer(NewProxy(pool, &RoundRobin{}, DefaultOptions()))
			defer front.Close()

			request, _ := http.NewRequest(tc.method, front.URL+"/work", strings.NewReader("order=1"))
			response, err := http.DefaultClient.Do(request)
			if err != nil {
				t.Fatal(err)
			}
			_ = response.Body.Close()
			if response.StatusCode != tc.wantStatus {
				t.Errorf("status = %d, want %d", response.StatusCode, tc.wantStatus)
			}
			if brokenHits.Load() != 1 {
				t.Errorf("broken back end received %d requests, want 1", brokenHits.Load())
			}
			if healthy.hits.Load() != tc.wantHealthyHits {
				t.Errorf("healthy back end received %d requests, want %d", healthy.hits.Load(), tc.wantHealthyHits)
			}
			if pool.Backends()[0].Healthy() {
				t.Error("the back end that failed is still in rotation")
			}
		})
	}
}

// EN: A connection that was never opened is different: the back end saw nothing, so even a
// POST can go to another one.
// PT: Uma conexão que nem chegou a abrir é diferente: o back end não viu nada, então até um
// POST pode ir para outro.
// ES: Una conexión que nunca llegó a abrirse es distinta: el back end no vio nada, así que
// incluso un POST puede ir a otro.
func TestPostIsRetriedWhenTheConnectionWasRefused(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	dead := "http://" + listener.Addr().String()
	_ = listener.Close()
	healthy := startBackend(t, "healthy", 0)
	pool, err := NewPool([]string{dead, healthy.server.URL})
	if err != nil {
		t.Fatal(err)
	}
	front := httptest.NewServer(NewProxy(pool, &RoundRobin{}, DefaultOptions()))
	defer front.Close()

	response, err := http.Post(front.URL+"/work", "text/plain", strings.NewReader("order=1"))
	if err != nil {
		t.Fatal(err)
	}
	_ = response.Body.Close()
	if response.StatusCode != http.StatusOK || healthy.hits.Load() != 1 {
		t.Errorf("status %d, healthy hits %d; want 200 and 1", response.StatusCode, healthy.hits.Load())
	}
}

func TestNoHealthyBackendAnswers503(t *testing.T) {
	a := startBackend(t, "a", 0)
	_, pool, front := newProxy(t, &RoundRobin{}, a)
	pool.Backends()[0].SetHealthy(false)
	if status, _ := get(t, front.URL+"/work"); status != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", status)
	}
	if a.hits.Load() != 0 {
		t.Error("an unhealthy back end received a request")
	}
}

func TestHeadersAreRewrittenForTheNextHop(t *testing.T) {
	a := startBackend(t, "a", 0)
	_, _, front := newProxy(t, &RoundRobin{}, a)

	request, _ := http.NewRequest(http.MethodGet, front.URL+"/work?x=1", http.NoBody)
	request.Header.Set("X-Forwarded-For", "203.0.113.7")
	request.Header.Set("Connection", "X-Client-Hop")
	request.Header.Set("X-Client-Hop", "must not reach the back end")
	request.Header.Set("X-Kept", "yes")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	_ = response.Body.Close()

	a.mu.Lock()
	seen := a.seen
	a.mu.Unlock()
	if got := seen.Get("X-Forwarded-For"); got != "203.0.113.7, 127.0.0.1" {
		t.Errorf("X-Forwarded-For = %q, want the client appended to the existing value", got)
	}
	if seen.Get("X-Client-Hop") != "" || seen.Get("Connection") != "" {
		t.Error("a hop-by-hop request header reached the back end")
	}
	if seen.Get("X-Kept") != "yes" || seen.Get("X-Forwarded-Proto") != "http" {
		t.Error("an end-to-end header was lost")
	}
	if response.Header.Get("X-Secret-Hop") != "" {
		t.Error("a hop-by-hop response header reached the client")
	}
	if response.Header.Get("X-Instance") != "a" {
		t.Error("an end-to-end response header was lost")
	}
}

func TestPoolRejectsBadAddresses(t *testing.T) {
	for _, addresses := range [][]string{
		{},
		{"api-1:3000"},
		{"https://api-1:3000"},
		{"http://api-1:3000/path"},
		{"http://"},
	} {
		if _, err := NewPool(addresses); err == nil {
			t.Errorf("NewPool(%q) accepted a bad list", addresses)
		}
	}
	if _, err := StrategyByName("fastest"); err == nil {
		t.Error("an unknown strategy was accepted")
	}
}
