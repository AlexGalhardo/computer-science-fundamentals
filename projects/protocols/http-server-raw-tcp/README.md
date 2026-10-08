# http-server-raw-tcp

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

An HTTP/1.1 server written in Go directly on TCP sockets, **without `net/http`**. The mini-project teaches what is inside an HTTP request and a response: a request line, header lines, an empty line and a body whose length the headers announce. It parses requests by hand, routes them, keeps connections alive, streams chunked responses, and refuses malformed or oversized requests with the right status code. curl and a real browser check that what it sends is valid HTTP.

Explanation of the concepts: [docs/en/protocols/http-server-raw-tcp.md](../../../docs/en/protocols/http-server-raw-tcp.md).

## Wire trace: the raw bytes of one request and one response

Output of `docker compose run --rm trace` (first scenario). `>` is what the client sent, `<` is what the server answered. `\r\n` is the pair of bytes CR LF (`0d 0a`) that ends every line of the protocol. The notes on the right are added here.

```text
> POST /echo HTTP/1.1\r\n            request line: METHOD, one space, TARGET, one space, VERSION
> Host: localhost\r\n                header: which site is wanted (mandatory in HTTP/1.1)
> Content-Type: text/plain\r\n       header: what the body is
> Content-Length: 11\r\n             header: the body is exactly 11 bytes long
> Connection: close\r\n              header: close the connection after this response
> \r\n                               EMPTY line: end of the headers, the body starts next
> hello world                        body: 11 bytes, no line ending, nothing marks its end

< HTTP/1.1 200 OK\r\n                status line: VERSION, CODE, reason phrase (for people only)
< Connection: close\r\n              the server agrees to close
< Content-Length: 11\r\n             the body of the response is 11 bytes long
< Content-Type: text/plain; charset=utf-8\r\n
< X-Body-Bytes: 11\r\n               a header of this application: bytes it read from the request
< \r\n                               EMPTY line: end of the headers
< hello world                        body: the 11 bytes announced above
```

The same request as the 116 bytes that travel in the TCP stream:

```text
0000  50 4f 53 54 20 2f 65 63 68 6f 20 48 54 54 50 2f  POST /echo HTTP/
0010  31 2e 31 0d 0a 48 6f 73 74 3a 20 6c 6f 63 61 6c  1.1..Host: local
0020  68 6f 73 74 0d 0a 43 6f 6e 74 65 6e 74 2d 54 79  host..Content-Ty
0030  70 65 3a 20 74 65 78 74 2f 70 6c 61 69 6e 0d 0a  pe: text/plain..
0040  43 6f 6e 74 65 6e 74 2d 4c 65 6e 67 74 68 3a 20  Content-Length:
0050  31 31 0d 0a 43 6f 6e 6e 65 63 74 69 6f 6e 3a 20  11..Connection:
0060  63 6c 6f 73 65 0d 0a 0d 0a 68 65 6c 6c 6f 20 77  close....hello w
0070  6f 72 6c 64                                      orld
```

- `20` is the space that separates the three parts of the request line.
- `0d 0a` (shown as `..`) ends each line. At offset `0x65` there are two in a row, `0d 0a 0d 0a`: the end of the last header and the empty line. The parser looks for exactly that.
- The 11 bytes after it (`68 65 6c 6c 6f 20 77 6f 72 6c 64`) are the body. The server knows where to stop only because of `Content-Length: 11`.

### A chunked response

When the size is not known in advance, the body goes in pieces. Each chunk is its size in hexadecimal, CR LF, the data, CR LF. A chunk of size zero ends the body.

```text
> GET /stream HTTP/1.1\r\n
> Host: localhost\r\n
> Connection: close\r\n
> \r\n

< HTTP/1.1 200 OK\r\n
< Connection: close\r\n
< Content-Type: text/plain; charset=utf-8\r\n
< Transfer-Encoding: chunked\r\n     no Content-Length: the body is delimited by the chunks
< \r\n
< 7\r\n                              chunk size: 7 bytes follow
< line 1\n                           the 7 bytes ("line 1" and a line feed)
< \r\n                               end of the chunk
< 7\r\n
< line 2\n
< \r\n
  ... three more chunks ...
< 0\r\n                              chunk of size zero: no more data
< \r\n                               end of the body
```

The other scenarios printed by the command are two requests on one keep-alive connection and a malformed request line answered with `400`.

## What the server does

| Part | File | Behaviour |
| --- | --- | --- |
| Request parser | `go/httpraw/request.go` | request line, headers, body by `Content-Length`. Limits on every part |
| Response writer | `go/httpraw/response.go` | status line, headers, `Content-Length` or `Transfer-Encoding: chunked` |
| Router | `go/httpraw/router.go` | method and path, `:name` segments, `404`, `405` with `Allow`, `HEAD` |
| Connection loop | `go/httpraw/server.go` | keep-alive, `Connection: close`, HTTP/1.0, idle timeout, one answer then close after an error |
| Demo site | `go/app/app.go` | `/`, `/hello/:name`, `POST /echo`, `/stream`, `/health` |
| Wire trace | `go/trace/`, `go/cmd/trace/` | sends raw bytes over TCP and prints both directions |

How a refused request is answered:

| Problem | Status |
| --- | --- |
| malformed request line, header without colon, space before the colon, line folding, bare CR, missing or repeated `Host`, invalid or conflicting `Content-Length`, body shorter than announced | `400 Bad Request` |
| request line longer than the limit | `414 URI Too Long` |
| header section larger than the limit, or too many header fields | `431 Request Header Fields Too Large` |
| body larger than the limit | `413 Content Too Large` |
| request with `Transfer-Encoding` (request bodies are read by `Content-Length` only) | `501 Not Implemented` |
| version other than HTTP/1.0 and HTTP/1.1 | `505 HTTP Version Not Supported` |

After any of these the server sends one response and closes the connection: it can no longer tell where the next request would start.

This is a teaching server. It has no TLS, no request body in chunked encoding, no `Expect: 100-continue` and no HTTP/2. Do not use it in production.

## Quiz topics it demonstrates

Area `protocols`, topic `http-semantics`: request and response message format, `Host`, `Content-Length` against `Transfer-Encoding: chunked`, persistent connections, `HEAD`, `404` against `405`, `400` and `431`.

## Run

The only requirement is Docker.

```sh
./setup-unix-http-server-raw-tcp.sh        # Linux and macOS
./setup-windows-http-server-raw-tcp.ps1    # Windows
```

The script builds the image and runs three checks: the Go tests, curl against the server, and a headless Chromium against the server. Then it removes the containers.

## Demo

The wire trace (four scenarios):

```sh
docker compose run --rm trace
```

The server in your own browser and with your own curl, on a port bound to `127.0.0.1`:

```sh
docker compose --profile demo up --build demo
# in another terminal
curl -v http://127.0.0.1:8089/hello/you
curl -N http://127.0.0.1:8089/stream           # the lines arrive one by one
curl --raw http://127.0.0.1:8089/stream        # the chunks as they are on the wire
# and open http://127.0.0.1:8089/ in a browser
docker compose --profile demo down
```

`DEMO_PORT` changes the port.

## Tests

```sh
docker compose run --rm go-test                 # gofmt, go vet, golangci-lint, go test
docker compose run --rm curl-check              # curl 7.88 against the server
docker compose run --rm browser-check           # headless Chromium against the server
docker compose down -v
```

| Where | What it proves |
| --- | --- |
| `go/httpraw/request_test.go` | the parser: a full request, 22 malformed requests, 6 oversized ones, a request exactly at the limits, and that an oversized header is refused without being read to the end |
| `go/app/app_test.go` | over real TCP on loopback: routing, echo of a 50 kB body, `HEAD`, keep-alive (Go's own `net/http` client reuses the connection), pipelining, `Connection: close`, HTTP/1.0, idle timeout, the chunked bytes on the wire, chunks arriving one by one, errors closing the connection |
| `scripts/curl-check.sh` | curl gets correct responses: parameters, POST, chunked (decoded and raw), connection reuse, `HEAD`, 404, 405, 431 |
| `scripts/browser-check.sh` | Chromium renders the page and its `fetch()` calls get correct responses, the chunked one included |

## Versions

| Component | Version |
| --- | --- |
| Go | 1.27.1 (`golang:1.27.1-bookworm`), standard library only |
| golangci-lint | 2.14.0 (`golangci/golangci-lint:v2.14.0`) |
| curl (check) | 7.88.1, the one shipped in the Go image |
| Chromium (check) | 153, from `mcr.microsoft.com/playwright:v1.63.0-noble` |
