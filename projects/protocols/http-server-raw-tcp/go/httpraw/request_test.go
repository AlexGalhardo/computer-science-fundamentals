package httpraw

import (
	"bufio"
	"errors"
	"io"
	"strings"
	"testing"
)

func parse(raw string, limits Limits) (*Request, error) {
	return ReadRequest(bufio.NewReader(strings.NewReader(raw)), limits)
}

func TestReadRequestParsesLineHeadersAndBody(t *testing.T) {
	raw := "POST /echo?lang=pt&x=1 HTTP/1.1\r\n" +
		"Host: localhost\r\n" +
		"content-TYPE:   text/plain  \r\n" +
		"Accept: text/html\r\n" +
		"Accept: application/json\r\n" +
		"Content-Length: 11\r\n" +
		"\r\n" +
		"hello world" +
		"GET /next HTTP/1.1\r\n"
	reader := bufio.NewReader(strings.NewReader(raw))
	req, err := ReadRequest(reader, DefaultLimits)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if req.Method != "POST" || req.Target != "/echo?lang=pt&x=1" || req.Proto != "HTTP/1.1" {
		t.Errorf("request line parsed as %q %q %q", req.Method, req.Target, req.Proto)
	}
	if req.Path != "/echo" || req.Query != "lang=pt&x=1" {
		t.Errorf("target split as path %q and query %q", req.Path, req.Query)
	}
	// Header names are case-insensitive, and the spaces around the value are not part of it.
	if got := req.Header.Get("Content-Type"); got != "text/plain" {
		t.Errorf("Content-Type = %q", got)
	}
	if got := req.Header["accept"]; len(got) != 2 || got[1] != "application/json" {
		t.Errorf("repeated header kept as %q", got)
	}
	if string(req.Body) != "hello world" {
		t.Errorf("body = %q", req.Body)
	}
	// The body ends exactly where Content-Length says, so the next request is still unread.
	rest, _ := io.ReadAll(reader)
	if string(rest) != "GET /next HTTP/1.1\r\n" {
		t.Errorf("bytes left after the body: %q", rest)
	}
}

func TestReadRequestAcceptsBareLineFeedAndNoBody(t *testing.T) {
	req, err := parse("GET / HTTP/1.1\nHost: localhost\n\n", DefaultLimits)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if req.Path != "/" || len(req.Body) != 0 {
		t.Errorf("parsed as path %q with %d body bytes", req.Path, len(req.Body))
	}
}

func TestReadRequestReturnsEOFOnAnIdleClosedConnection(t *testing.T) {
	if _, err := parse("", DefaultLimits); !errors.Is(err, io.EOF) {
		t.Errorf("want io.EOF, got %v", err)
	}
}

func TestReadRequestRefusesMalformedRequests(t *testing.T) {
	cases := []struct {
		name   string
		raw    string
		status int
	}{
		{"no version", "GET /\r\nHost: a\r\n\r\n", 400},
		{"extra space in the request line", "GET  / HTTP/1.1\r\nHost: a\r\n\r\n", 400},
		{"four parts", "GET / HTTP/1.1 extra\r\nHost: a\r\n\r\n", 400},
		{"method with an invalid character", "G(ET / HTTP/1.1\r\nHost: a\r\n\r\n", 400},
		{"target without a leading slash", "GET index.html HTTP/1.1\r\nHost: a\r\n\r\n", 400},
		{"not HTTP at all", "GET / FTP/1.1\r\nHost: a\r\n\r\n", 400},
		{"unsupported HTTP version", "GET / HTTP/2.0\r\nHost: a\r\n\r\n", 505},
		{"HTTP/1.1 without Host", "GET / HTTP/1.1\r\n\r\n", 400},
		{"two Host headers", "GET / HTTP/1.1\r\nHost: a\r\nHost: b\r\n\r\n", 400},
		{"header without a colon", "GET / HTTP/1.1\r\nHost: a\r\nBroken\r\n\r\n", 400},
		{"space before the colon", "GET / HTTP/1.1\r\nHost : a\r\n\r\n", 400},
		{"empty header name", "GET / HTTP/1.1\r\nHost: a\r\n: value\r\n\r\n", 400},
		{"obsolete line folding", "GET / HTTP/1.1\r\nHost: a\r\nX-A: 1\r\n continued\r\n\r\n", 400},
		{"bare CR inside a line", "GET / HTTP/1.1\r\nHost: a\rX: 1\r\n\r\n", 400},
		{"headers never end", "GET / HTTP/1.1\r\nHost: a\r\n", 400},
		{"Content-Length is not a number", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: ten\r\n\r\n", 400},
		{"Content-Length with a sign", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: +5\r\n\r\nhello", 400},
		{"negative Content-Length", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: -1\r\n\r\n", 400},
		{"Content-Length too big for an integer", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: 99999999999999999999\r\n\r\n", 400},
		{"conflicting Content-Length", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: 5\r\nContent-Length: 6\r\n\r\nhello!", 400},
		{"body shorter than Content-Length", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: 10\r\n\r\nshort", 400},
		{"Transfer-Encoding in a request", "POST / HTTP/1.1\r\nHost: a\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n", 501},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			_, err := parse(c.raw, DefaultLimits)
			var parseErr *ParseError
			if !errors.As(err, &parseErr) {
				t.Fatalf("want a ParseError, got %v", err)
			}
			if parseErr.Status != c.status {
				t.Errorf("status = %d (%s), want %d", parseErr.Status, parseErr.Reason, c.status)
			}
		})
	}
}

func TestReadRequestAcceptsRepeatedEqualContentLength(t *testing.T) {
	req, err := parse("POST / HTTP/1.1\r\nHost: a\r\nContent-Length: 5\r\nContent-Length: 5\r\n\r\nhello", DefaultLimits)
	if err != nil || string(req.Body) != "hello" {
		t.Errorf("got body %v and error %v", req, err)
	}
}

func TestReadRequestEnforcesTheSizeLimits(t *testing.T) {
	limits := Limits{MaxRequestLine: 64, MaxHeaderBytes: 128, MaxHeaderCount: 4, MaxBodyBytes: 16}
	cases := []struct {
		name   string
		raw    string
		status int
	}{
		{"request line too long", "GET /" + strings.Repeat("a", 100) + " HTTP/1.1\r\nHost: a\r\n\r\n", 414},
		{"one oversized header", "GET / HTTP/1.1\r\nHost: a\r\nX-Big: " + strings.Repeat("b", 200) + "\r\n\r\n", 431},
		{
			"many headers that are oversized together",
			"GET / HTTP/1.1\r\nHost: a\r\n" + strings.Repeat("X-A: "+strings.Repeat("c", 50)+"\r\n", 3) + "\r\n",
			431,
		},
		{"too many header fields", "GET / HTTP/1.1\r\nHost: a\r\nA: 1\r\nB: 2\r\nC: 3\r\nD: 4\r\n\r\n", 431},
		{"a header line that never ends", "GET / HTTP/1.1\r\nHost: a\r\nX-Endless: " + strings.Repeat("d", 5000), 431},
		{"body larger than the limit", "POST / HTTP/1.1\r\nHost: a\r\nContent-Length: 17\r\n\r\n" + strings.Repeat("e", 17), 413},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			_, err := parse(c.raw, limits)
			var parseErr *ParseError
			if !errors.As(err, &parseErr) {
				t.Fatalf("want a ParseError, got %v", err)
			}
			if parseErr.Status != c.status {
				t.Errorf("status = %d (%s), want %d", parseErr.Status, parseErr.Reason, c.status)
			}
		})
	}

	t.Run("a request exactly at the limits is accepted", func(t *testing.T) {
		target := "/" + strings.Repeat("a", 64-len("GET  HTTP/1.1")-1)
		header := "X-A: " + strings.Repeat("b", 128-len("Host: a")-len("X-A: "))
		raw := "GET " + target + " HTTP/1.1\r\nHost: a\r\n" + header + "\r\nContent-Length: 0\r\n\r\n"
		// Content-Length adds bytes to the header section, so it gets its own budget here.
		roomy := limits
		roomy.MaxHeaderBytes += len("Content-Length: 0")
		if _, err := parse(raw, roomy); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	// EN: The parser must stop reading as soon as the limit is passed, not after buffering the
	//     whole oversized line. A reader that fails when read too far proves it.
	// PT: O parser precisa parar de ler assim que o limite é ultrapassado, não depois de guardar
	//     a linha gigante inteira. Um leitor que falha quando é lido além da conta prova isso.
	// ES: El parser debe dejar de leer en cuanto se supera el límite, no después de guardar la
	//     línea gigante completa. Un lector que falla cuando se lee más de la cuenta lo prueba.
	t.Run("an oversized header is refused without reading all of it", func(t *testing.T) {
		head := "GET / HTTP/1.1\r\nHost: a\r\nX-Big: "
		reader := &countingReader{data: head + strings.Repeat("z", 1<<20)}
		_, err := ReadRequest(bufio.NewReaderSize(reader, 16), limits)
		var parseErr *ParseError
		if !errors.As(err, &parseErr) || parseErr.Status != 431 {
			t.Fatalf("want 431, got %v", err)
		}
		if reader.read > len(head)+limits.MaxHeaderBytes+64 {
			t.Errorf("read %d bytes before refusing a header limited to %d", reader.read, limits.MaxHeaderBytes)
		}
	})
}

type countingReader struct {
	data string
	read int
}

func (r *countingReader) Read(p []byte) (int, error) {
	if r.read >= len(r.data) {
		return 0, io.EOF
	}
	n := copy(p, r.data[r.read:])
	r.read += n
	return n, nil
}

func TestHeaderHasToken(t *testing.T) {
	h := Header{}
	h.Add("Connection", "Keep-Alive, Upgrade")
	if !h.HasToken("connection", "keep-alive") || !h.HasToken("Connection", "upgrade") {
		t.Error("tokens of a comma-separated header must be found ignoring case")
	}
	if h.HasToken("Connection", "close") || h.HasToken("Connection", "keep") {
		t.Error("a token must match as a whole")
	}
}
