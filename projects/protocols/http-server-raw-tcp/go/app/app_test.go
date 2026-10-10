package app

import (
	"bufio"
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptrace"
	"strings"
	"testing"
	"time"

	"http-server-raw-tcp/httpraw"
	"http-server-raw-tcp/trace"
)

// start runs the demo site on a loopback port and returns its address.
func start(t *testing.T, configure func(*httpraw.Server)) string {
	t.Helper()
	var config net.ListenConfig
	listener, err := config.Listen(t.Context(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	server := &httpraw.Server{Handler: Routes(0).Serve, IdleTimeout: 2 * time.Second}
	if configure != nil {
		configure(server)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- server.Serve(ctx, listener) }()
	t.Cleanup(func() {
		cancel()
		if err := <-done; err != nil {
			t.Errorf("serve: %v", err)
		}
	})
	return listener.Addr().String()
}

// exchange sends raw bytes on a new connection and returns everything the server answered
// until it closed the connection.
func exchange(t *testing.T, addr, raw string) string {
	t.Helper()
	var dialer net.Dialer
	conn, err := dialer.DialContext(t.Context(), "tcp", addr)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()
	if _, err := io.WriteString(conn, raw); err != nil {
		t.Fatalf("send: %v", err)
	}
	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	answer, err := io.ReadAll(conn)
	if err != nil {
		t.Fatalf("receive: %v", err)
	}
	return string(answer)
}

// EN: The tests below use Go's own net/http CLIENT against the hand-written server. It is an
//     independent implementation of HTTP/1.1: if it understands the responses, they are valid,
//     not merely consistent with our own parser.
// PT: Os testes abaixo usam o CLIENTE net/http do próprio Go contra o servidor escrito à mão. É
//     uma implementação independente do HTTP/1.1: se ele entende as respostas, elas são válidas,
//     e não apenas coerentes com o nosso próprio parser.
// ES: Las pruebas de abajo usan el CLIENTE net/http del propio Go contra el servidor escrito a
//     mano. Es una implementación independiente de HTTP/1.1: si entiende las respuestas, son
//     válidas, y no solo coherentes con nuestro propio parser.

func get(t *testing.T, client *http.Client, url string) (*http.Response, string) {
	t.Helper()
	req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, url, http.NoBody)
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("GET %s: %v", url, err)
	}
	defer func() { _ = resp.Body.Close() }()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body of %s: %v", url, err)
	}
	return resp, string(body)
}

func TestRouterAnswersAStandardClient(t *testing.T) {
	base := "http://" + start(t, nil)
	client := &http.Client{}

	resp, body := get(t, client, base+"/hello/ana?x=1")
	if resp.StatusCode != 200 || body != "hello, ana\n" {
		t.Errorf("GET /hello/ana = %d %q", resp.StatusCode, body)
	}
	if got := resp.Header.Get("Content-Type"); got != "text/plain; charset=utf-8" {
		t.Errorf("Content-Type = %q", got)
	}
	if resp.ContentLength != int64(len(body)) {
		t.Errorf("Content-Length = %d, body has %d bytes", resp.ContentLength, len(body))
	}

	resp, body = get(t, client, base+"/")
	if resp.StatusCode != 200 || !strings.Contains(body, "<h1>HTTP on raw TCP</h1>") {
		t.Errorf("GET / = %d, %d bytes", resp.StatusCode, len(body))
	}

	resp, _ = get(t, client, base+"/nowhere")
	if resp.StatusCode != 404 {
		t.Errorf("unknown path = %d, want 404", resp.StatusCode)
	}

	// A known path with the wrong method is 405, and Allow says what would work.
	resp, _ = get(t, client, base+"/echo")
	if resp.StatusCode != 405 || resp.Header.Get("Allow") != "POST" {
		t.Errorf("GET /echo = %d, Allow %q", resp.StatusCode, resp.Header.Get("Allow"))
	}
}

func TestEchoReturnsTheBodyDelimitedByContentLength(t *testing.T) {
	base := "http://" + start(t, nil)
	payload := strings.Repeat("0123456789", 5000) // 50 kB: many TCP segments
	req, err := http.NewRequestWithContext(t.Context(), http.MethodPost, base+"/echo", strings.NewReader(payload))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST /echo: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()
	body, _ := io.ReadAll(resp.Body)
	if string(body) != payload || resp.Header.Get("X-Body-Bytes") != "50000" {
		t.Errorf("echo returned %d bytes, X-Body-Bytes %q", len(body), resp.Header.Get("X-Body-Bytes"))
	}
}

func TestHeadSendsTheHeadersOfGetAndNoBody(t *testing.T) {
	addr := start(t, nil)
	answer := exchange(t, addr, "HEAD /hello/ana HTTP/1.1\r\nHost: a\r\nConnection: close\r\n\r\n")
	head, body, _ := strings.Cut(answer, "\r\n\r\n")
	if !strings.HasPrefix(head, "HTTP/1.1 200 OK\r\n") || !strings.Contains(head, "Content-Length: 11") {
		t.Errorf("HEAD headers:\n%s", head)
	}
	if body != "" {
		t.Errorf("HEAD must not send a body, got %q", body)
	}
}

func TestKeepAliveReusesTheConnection(t *testing.T) {
	base := "http://" + start(t, nil)
	client := &http.Client{}
	reused := []bool{}
	for range 3 {
		clientTrace := &httptrace.ClientTrace{
			GotConn: func(info httptrace.GotConnInfo) { reused = append(reused, info.Reused) },
		}
		req, err := http.NewRequestWithContext(
			httptrace.WithClientTrace(t.Context(), clientTrace), http.MethodGet, base+"/hello/ana", http.NoBody,
		)
		if err != nil {
			t.Fatalf("new request: %v", err)
		}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("GET: %v", err)
		}
		_, _ = io.Copy(io.Discard, resp.Body)
		_ = resp.Body.Close()
	}
	// The first request opens the connection, the next two travel on the same one.
	if len(reused) != 3 || reused[0] || !reused[1] || !reused[2] {
		t.Errorf("connection reused per request = %v, want [false true true]", reused)
	}
}

func TestPipelinedRequestsAreAnsweredInOrderOnOneConnection(t *testing.T) {
	addr := start(t, nil)
	raw := "GET /hello/one HTTP/1.1\r\nHost: a\r\n\r\n" +
		"POST /echo HTTP/1.1\r\nHost: a\r\nContent-Length: 3\r\n\r\ntwo" +
		"GET /hello/three HTTP/1.1\r\nHost: a\r\nConnection: close\r\n\r\n"
	answer := exchange(t, addr, raw)
	if got := strings.Count(answer, "HTTP/1.1 200 OK\r\n"); got != 3 {
		t.Fatalf("want 3 responses on one connection, got %d:\n%s", got, answer)
	}
	one := strings.Index(answer, "hello, one")
	two := strings.Index(answer, "two")
	three := strings.Index(answer, "hello, three")
	if one < 0 || two < one || three < two {
		t.Errorf("responses out of order:\n%s", answer)
	}
	if strings.Count(answer, "Connection: keep-alive") != 2 || strings.Count(answer, "Connection: close") != 1 {
		t.Errorf("want keep-alive, keep-alive, close:\n%s", answer)
	}
}

func TestConnectionCloseAndHTTP10(t *testing.T) {
	addr := start(t, func(server *httpraw.Server) { server.MaxRequestsPerConn = 2 })

	// HTTP/1.1 with "Connection: close": one response, then the server closes.
	answer := exchange(t, addr, "GET /health HTTP/1.1\r\nHost: a\r\nConnection: close\r\n\r\nGET /health HTTP/1.1\r\nHost: a\r\n\r\n")
	if strings.Count(answer, "HTTP/1.1 200 OK") != 1 || !strings.Contains(answer, "Connection: close") {
		t.Errorf("Connection: close was not honoured:\n%s", answer)
	}

	// HTTP/1.0 closes by default, and needs no Host header.
	answer = exchange(t, addr, "GET /health HTTP/1.0\r\n\r\n")
	if !strings.Contains(answer, "Connection: close") || !strings.HasSuffix(answer, "ok\n") {
		t.Errorf("HTTP/1.0 answer:\n%s", answer)
	}

	// The server closes after MaxRequestsPerConn requests, and says so in the last response.
	answer = exchange(t, addr, strings.Repeat("GET /health HTTP/1.1\r\nHost: a\r\n\r\n", 3))
	if strings.Count(answer, "HTTP/1.1 200 OK") != 2 || !strings.HasSuffix(answer, "Connection: close\r\nContent-Length: 3\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nok\n") {
		t.Errorf("request limit per connection:\n%s", answer)
	}
}

func TestIdleConnectionIsClosedByTheServer(t *testing.T) {
	addr := start(t, func(server *httpraw.Server) { server.IdleTimeout = 100 * time.Millisecond })
	var dialer net.Dialer
	conn, err := dialer.DialContext(t.Context(), "tcp", addr)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()
	_ = conn.SetReadDeadline(time.Now().Add(3 * time.Second))
	started := time.Now()
	// The client sends nothing. The read ends when the server gives up and closes.
	if _, err := conn.Read(make([]byte, 1)); err != io.EOF { //nolint:errorlint // a raw conn returns io.EOF itself
		t.Fatalf("want the server to close the idle connection, got %v", err)
	}
	if elapsed := time.Since(started); elapsed > 2*time.Second {
		t.Errorf("idle connection closed after %v", elapsed)
	}
}

func TestChunkedResponseOnTheWire(t *testing.T) {
	addr := start(t, nil)
	answer := exchange(t, addr, "GET /stream HTTP/1.1\r\nHost: a\r\nConnection: close\r\n\r\n")
	head, body, _ := strings.Cut(answer, "\r\n\r\n")
	if !strings.Contains(head, "Transfer-Encoding: chunked") || strings.Contains(head, "Content-Length") {
		t.Errorf("a chunked response has Transfer-Encoding and no Content-Length:\n%s", head)
	}
	// Each chunk: size in hexadecimal, CRLF, data, CRLF. "line 1\n" is 7 bytes. Then the zero chunk.
	want := strings.Repeat("7\r\nline N\n\r\n", StreamLines)
	for line := 1; line <= StreamLines; line++ {
		want = strings.Replace(want, "N", string(rune('0'+line)), 1)
	}
	want += "0\r\n\r\n"
	if body != want {
		t.Errorf("chunked body on the wire:\n%q\nwant:\n%q", body, want)
	}
}

func TestChunkedResponseIsDecodedByAStandardClient(t *testing.T) {
	base := "http://" + start(t, nil)
	resp, body := get(t, &http.Client{}, base+"/stream")
	if len(resp.TransferEncoding) != 1 || resp.TransferEncoding[0] != "chunked" {
		t.Errorf("TransferEncoding = %v", resp.TransferEncoding)
	}
	if body != "line 1\nline 2\nline 3\nline 4\nline 5\n" {
		t.Errorf("decoded body = %q", body)
	}
}

func TestChunksArriveOneByOne(t *testing.T) {
	var config net.ListenConfig
	listener, err := config.Listen(t.Context(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	server := &httpraw.Server{Handler: Routes(150 * time.Millisecond).Serve}
	done := make(chan error, 1)
	go func() { done <- server.Serve(ctx, listener) }()
	defer func() {
		cancel()
		<-done
	}()

	var dialer net.Dialer
	conn, err := dialer.DialContext(t.Context(), "tcp", listener.Addr().String())
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()
	_, _ = io.WriteString(conn, "GET /stream HTTP/1.1\r\nHost: a\r\nConnection: close\r\n\r\n")
	reader := bufio.NewReader(conn)
	started := time.Now()
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("the first chunk never arrived: %v", err)
		}
		if line == "line 1\n" {
			break
		}
	}
	// The whole stream takes 5 x 150 ms. The first line must be readable long before that.
	if elapsed := time.Since(started); elapsed > 400*time.Millisecond {
		t.Errorf("first chunk arrived after %v: the response was buffered, not streamed", elapsed)
	}
}

func TestHTTP10ClientGetsTheStreamWithContentLength(t *testing.T) {
	addr := start(t, nil)
	answer := exchange(t, addr, "GET /stream HTTP/1.0\r\n\r\n")
	if strings.Contains(answer, "Transfer-Encoding") || !strings.Contains(answer, "Content-Length: 35") {
		t.Errorf("HTTP/1.0 has no chunked encoding:\n%s", answer)
	}
}

func TestMalformedAndOversizedRequestsGetAnErrorAndTheConnectionCloses(t *testing.T) {
	addr := start(t, func(server *httpraw.Server) {
		server.Limits = httpraw.Limits{MaxRequestLine: 64, MaxHeaderBytes: 128, MaxHeaderCount: 8, MaxBodyBytes: 16}
	})
	cases := []struct {
		name string
		raw  string
		want string
	}{
		{"malformed request line", "GET /hello/ana\r\nHost: a\r\n\r\n", "HTTP/1.1 400 Bad Request\r\n"},
		{"missing Host", "GET / HTTP/1.1\r\n\r\n", "HTTP/1.1 400 Bad Request\r\n"},
		{"oversized headers", "GET / HTTP/1.1\r\nHost: a\r\nX-Big: " + strings.Repeat("b", 500) + "\r\n\r\n", "HTTP/1.1 431 Request Header Fields Too Large\r\n"},
		{"request line too long", "GET /" + strings.Repeat("a", 200) + " HTTP/1.1\r\nHost: a\r\n\r\n", "HTTP/1.1 414 URI Too Long\r\n"},
		{"body too large", "POST /echo HTTP/1.1\r\nHost: a\r\nContent-Length: 999\r\n\r\n", "HTTP/1.1 413 Content Too Large\r\n"},
		{"unsupported version", "GET / HTTP/3.0\r\nHost: a\r\n\r\n", "HTTP/1.1 505 HTTP Version Not Supported\r\n"},
		{"chunked request body", "POST /echo HTTP/1.1\r\nHost: a\r\nTransfer-Encoding: chunked\r\n\r\n", "HTTP/1.1 501 Not Implemented\r\n"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			// A valid request is glued after the bad one. It must NOT be answered: after an
			// error the server cannot trust where the next request starts.
			answer := exchange(t, addr, c.raw+"GET /health HTTP/1.1\r\nHost: a\r\n\r\n")
			if !strings.HasPrefix(answer, c.want) {
				t.Errorf("answer starts with %q, want %q", firstLine(answer), c.want)
			}
			if !strings.Contains(answer, "Connection: close") || strings.Count(answer, "\r\nConnection: ") != 1 {
				t.Errorf("want exactly one response and a closed connection:\n%s", answer)
			}
		})
	}
}

func firstLine(text string) string {
	line, _, _ := strings.Cut(text, "\n")
	return line
}

func TestTraceShowsTheBytesOfBothDirections(t *testing.T) {
	raw := "POST /echo HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2\r\nConnection: close\r\n\r\nhi"
	result, err := trace.Run(t.Context(), Routes(0).Serve, raw)
	if err != nil {
		t.Fatalf("trace: %v", err)
	}
	sent := trace.Visible("> ", result.Sent)
	if !strings.HasPrefix(sent, "> POST /echo HTTP/1.1\\r\\n\n> Host: localhost\\r\\n\n") || !strings.HasSuffix(sent, "> \\r\\n\n> hi\n") {
		t.Errorf("visible request:\n%s", sent)
	}
	received := trace.Visible("< ", result.Received)
	if !strings.HasPrefix(received, "< HTTP/1.1 200 OK\\r\\n\n") || !strings.HasSuffix(received, "< hi\n") {
		t.Errorf("visible response:\n%s", received)
	}
	dump := trace.HexDump([]byte("GET / HTTP/1.1\r\n"))
	if dump != "0000  47 45 54 20 2f 20 48 54 54 50 2f 31 2e 31 0d 0a  GET / HTTP/1.1..\n" {
		t.Errorf("hex dump:\n%s", dump)
	}
}
