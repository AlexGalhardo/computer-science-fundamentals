# HTTP server on raw TCP (MP-PROTO-3)

> Versão em português: [docs/pt/protocols/http-server-raw-tcp.md](../../pt/protocols/http-server-raw-tcp.md)

Mini-project: [`projects/protocols/http-server-raw-tcp`](../../../projects/protocols/http-server-raw-tcp/README.md). Quiz topic: `http-semantics`.

## The question

TCP gives a program a stream of bytes, with no idea of "message". HTTP/1.1 is a set of rules for cutting that stream into requests and responses. Writing the server without an HTTP library forces every rule to appear in the code: where a line ends, where the headers end, where the body ends, and when the connection may be reused.

## The shape of a message

```
request line     POST /echo HTTP/1.1\r\n
header fields    Host: localhost\r\n
                 Content-Length: 11\r\n
empty line       \r\n
body             hello world
```

- Every line ends with CR LF (`\r\n`, bytes `0d 0a`).
- The **request line** has three parts separated by one space: method, target, version. A response starts with a **status line** instead: version, status code, reason phrase.
- Each **header field** is `Name: value`. Names are case-insensitive. No space is allowed before the colon.
- An **empty line** ends the headers. It is the only separator between headers and body.
- The **body** is plain bytes. Nothing inside it marks its end.

The annotated bytes of a real exchange are in the [README](../../../projects/protocols/http-server-raw-tcp/README.md#wire-trace-the-raw-bytes-of-one-request-and-one-response).

## Where does the body end?

This is the central question of HTTP/1.1, because the connection stays open and the next message comes right after. There are two answers:

| | `Content-Length: N` | `Transfer-Encoding: chunked` |
| --- | --- | --- |
| When | the size is known before sending | the size is not known yet |
| How | read exactly N bytes | read chunks until the one of size zero |
| On the wire | `hello world` | `b\r\nhello world\r\n0\r\n\r\n` |

A chunk is its size in **hexadecimal**, CR LF, the data, CR LF. The mini-project reads request bodies by `Content-Length` and writes chunked **responses** for the `/stream` route, flushing each chunk as it is produced: with `curl -N` the lines appear one by one.

A message that has both headers is a classic source of attacks (request smuggling): a proxy that believes one and a server that believes the other disagree about where the request ends, and the leftover bytes are read as a new request. This server refuses a request with `Transfer-Encoding` (`501`) instead of guessing, and refuses two `Content-Length` values that disagree (`400`).

## Parsing defensively

A parser reads what a stranger sends, so it is written against the worst input:

- **Limits on everything.** Request line, header section, number of headers and body each have a maximum. Without them a client that never sends the end of a line makes the server hold memory forever. The parser stops reading as soon as a limit is passed, and a test proves it with a reader that counts the bytes consumed.
- **The right status for each refusal.** `400` for a malformed message, `414` for a request line that is too long, `431` for headers that are too large, `413` for a body that is too large, `505` for an unsupported version.
- **Strict where ambiguity is dangerous.** A space before the colon, a header continued on the next line, a bare CR, a `Content-Length` that is not only digits: all refused, because two programs reading the same bytes differently is the root of smuggling.
- **One error, then close.** After a malformed request the server cannot know where the next one starts, so it answers once and closes the connection.

## Keep-alive

Opening a TCP connection costs a round trip (and TLS costs more). HTTP/1.1 therefore keeps the connection open by default: after the response the server waits for another request on the same socket. It closes when one side sends `Connection: close`, when the connection stays idle for too long, or after an error. HTTP/1.0 is the opposite: it closes unless the client asks for `Connection: keep-alive`.

In the code this is a loop around "read one request, write one response", with **one buffered reader for the whole connection**. A client may send the second request before the first response arrives (pipelining), so bytes of request 2 can already be in the buffer when request 1 ends. They are not lost because the parser consumed exactly the bytes of request 1.

## Routing

The router answers two questions, and each has its own error:

- Does any route know this **path**? If not, `404 Not Found`.
- Does a route for this path accept this **method**? If not, `405 Method Not Allowed`, with an `Allow` header listing the methods that work.

`HEAD` is served by the `GET` handler: same status and headers, including the `Content-Length` the body would have, and no body.

## Checked by clients we did not write

A server tested only with its own parser can be consistently wrong. Three independent clients check this one:

- Go's `net/http` client, in the unit tests: it decodes the chunked response and reports that it **reused** the connection on the second and third requests.
- **curl**: parameters, POST, chunked (decoded and with `--raw`), connection reuse, `HEAD`, 404, 405, 431.
- **Chromium**, headless: it renders the HTML page, and the page's `fetch()` calls get the expected text, including the chunked stream.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-PROTO-3.1 request parser | `go/httpraw/request_test.go`: 22 malformed requests and 6 oversized ones, each with its expected status. `docker compose run --rm go-test` |
| MP-PROTO-3.2 router, keep-alive and chunked responses | `docker compose run --rm curl-check` and `docker compose run --rm browser-check`, plus `go/app/app_test.go` |
| MP-PROTO-3.3 wire trace | the README shows the annotated bytes of one request and one response, produced by `docker compose run --rm trace` |

## Run

```sh
cd projects/protocols/http-server-raw-tcp
./setup-unix-http-server-raw-tcp.sh        # or ./setup-windows-http-server-raw-tcp.ps1
docker compose run --rm trace
```
