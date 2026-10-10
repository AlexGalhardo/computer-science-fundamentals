# Protocols

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Application protocols are the agreements that let programs written by different people talk to each other. This area follows HTTP from its semantics (methods, status codes, headers, caching, cookies) through its three wire formats (HTTP/1.1, HTTP/2 and HTTP/3 over QUIC), the TLS handshake underneath, and the API styles built on top: REST, GraphQL, JSON-RPC, gRPC, WebSocket and server-sent events.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| REST, GraphQL and JSON-RPC (`rest-graphql-jsonrpc`) | What each API style costs and offers on the same domain | planned |
| HTTP/1.1, HTTP/2 and HTTP/3 (`http-versions`) | What multiplexing and QUIC change for a page with many resources | planned |
| HTTP server on raw TCP (`http-server-raw-tcp`) | What is inside an HTTP request and response | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/protocols/`).
- Documentation: planned (`docs/en/protocols/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), Mozilla. Free. The best starting point: overview, messages, methods, status codes, headers, caching, cookies and CORS.
- [MDN: HTTP (em português)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP), Mozilla. In Portuguese. Free. The Brazilian Portuguese translation of the MDN HTTP guides and reference.
- [HTTP/3 explained](https://http3-explained.haxx.se/), Daniel Stenberg. Free. A short free book by the author of curl on why QUIC exists and how HTTP/3 works.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), Michael Driscoll. Free. Every byte of a real TLS 1.3 handshake, annotated and explained.

### Books

- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Free online, paid in print. Free online: TCP, TLS, HTTP/1.x, HTTP/2, WebSocket and server-sent events from the performance side.
- [http2 explained](https://http2-explained.haxx.se/), Daniel Stenberg. Free. A short free book on streams, multiplexing, header compression and what HTTP/2 fixed.
- [Everything curl](https://everything.curl.dev/), Daniel Stenberg. Free. A free book on curl that doubles as a practical tour of HTTP, TLS and proxies.

### Papers and specifications

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham and Reschke, IETF. Free. The current definition of methods, status codes, headers and content negotiation for every HTTP version.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson and Benfield, IETF. Free. Frames, streams, flow control and header compression in HTTP/2.
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), Mike Bishop, IETF. Free. How HTTP semantics are mapped onto QUIC streams.
- [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000), Iyengar and Thomson, IETF. Free. The transport protocol under HTTP/3: connections, streams, loss recovery and migration over UDP.
- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112), Fielding, Nottingham and Reschke, IETF. Free. The text message format to follow when writing an HTTP server by hand.
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446), Eric Rescorla, IETF. Free. The specification of the handshake, key schedule and record protocol.
- [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455), Fette and Melnikov, IETF. Free. The upgrade handshake and the frame format of WebSocket.
- [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm), Roy Fielding (2000). Free. The dissertation that defined REST and its constraints.
- [GraphQL Specification](https://spec.graphql.org/), GraphQL Foundation. Free. The official definition of the type system, queries, validation and execution.
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification), JSON-RPC Working Group. Free. A two-page specification of requests, responses, notifications, batches and error codes.

### Official documentation

- [Learn GraphQL](https://graphql.org/learn/), GraphQL Foundation. Free. The official introduction to schemas, queries, mutations and best practices.
- [gRPC: Core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/), gRPC Authors. Free. Service definitions, the four kinds of calls, deadlines and metadata.
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), Mozilla. Free. How the event stream format works and when it is simpler than WebSocket.
- [Caddy documentation](https://caddyserver.com/docs/), Caddy project. Free. The server used in the mini-projects, with automatic HTTPS and HTTP/3 enabled by default.

### Videos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Free. Detailed videos comparing HTTP versions, TLS, WebSocket, gRPC and their trade-offs.

### Practice and tools

- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html), Martin Fowler. Free. Explains the steps from remote procedure calls over HTTP to resources, verbs and hypermedia.

### Communities

- [Stack Overflow: http tag](https://stackoverflow.com/questions/tagged/http), Stack Overflow. Free. Canonical answers on status codes, headers, caching and CORS.
- [HTTP Working Group](https://github.com/httpwg), IETF. Free. Where the HTTP specifications are written and discussed in the open.
