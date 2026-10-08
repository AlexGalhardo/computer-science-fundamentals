# rest-graphql-jsonrpc

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

One small domain (authors, books, reviews) exposed through three API styles by the same ElysiaJS server: **REST** (`/rest/...`), **GraphQL** (`/graphql`) and **JSON-RPC 2.0** (`/rpc`). The domain rules are written once, so the only thing that changes is how a call travels over HTTP. The mini-project teaches what each style costs and offers: how many round trips a screen needs, how many bytes come back, where the outcome of a call is reported, and why GraphQL needs batching to avoid the N+1 problem.

Explanation of the concepts: [docs/en/protocols/rest-graphql-jsonrpc.md](../../../docs/en/protocols/rest-graphql-jsonrpc.md).

## The same call in the three styles

"Give me book 7":

```http
GET /rest/books/7 HTTP/1.1
```

```http
POST /graphql HTTP/1.1
Content-Type: application/json

{"query":"query Card($id: Int!) { book(id: $id) { id title year pages } }","variables":{"id":7}}
```

```http
POST /rpc HTTP/1.1
Content-Type: application/json

{"jsonrpc":"2.0","method":"books.get","params":{"id":7},"id":1}
```

And "book 9999", which does not exist:

| Style | HTTP status | Where the failure is |
| --- | --- | --- |
| REST | `404` | the status code itself |
| GraphQL | `200` | `"data": {"book": null}` for a read, an entry in `"errors"` with `extensions.code` for a failed mutation |
| JSON-RPC | `200` | `"error": {"code": -32004, "message": "..."}` in the body, with no `"result"` |

## Latency and payload per style

Measured by `docker compose run --rm bench` (full report with machine and method in [results/results.md](results/results.md)). Client, server and PostgreSQL ran on the same machine, over loopback, with bodies not compressed.

| Read | Style | HTTP requests | Request bytes | Response bytes | SQL statements | Mean (ms) | Std dev (ms) | p50 (ms) | p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| list (id and title of 50 books) | rest | 1 | 0 | 27596 | 1 | 1.505 | 0.670 | 0.946 | 3.548 |
| list (id and title of 50 books) | graphql | 1 | 101 | 2999 | 1 | 1.955 | 0.775 | 1.226 | 4.521 |
| list (id and title of 50 books) | jsonrpc | 1 | 68 | 27630 | 1 | 1.645 | 0.497 | 0.973 | 3.256 |
| detail (4 fields of 1 book) | rest | 1 | 0 | 538 | 1 | 0.605 | 0.113 | 0.502 | 0.764 |
| detail (4 fields of 1 book) | graphql | 1 | 96 | 95 | 1 | 1.184 | 0.219 | 0.891 | 1.523 |
| detail (4 fields of 1 book) | jsonrpc | 1 | 63 | 572 | 1 | 0.951 | 0.561 | 0.526 | 0.800 |
| nested (1 book, its author, its reviews) | rest | 3 | 0 | 1322 | 4 | 1.669 | 0.164 | 1.569 | 2.245 |
| nested (1 book, its author, its reviews) | graphql | 1 | 129 | 229 | 3 | 1.809 | 0.260 | 1.552 | 3.259 |
| nested (1 book, its author, its reviews) | jsonrpc | 2 | 208 | 1427 | 4 | 1.805 | 0.111 | 1.585 | 2.511 |

How to read it:

- **Payload is where the styles really differ.** For the list, REST and JSON-RPC return every field of every book (about 27.6 kB) when the screen wanted two fields: that is **over-fetching**. GraphQL returns 3.0 kB, about 9 times less.
- **Round trips.** The nested read costs REST three requests and JSON-RPC two (a batch, then the author, whose id is only known after the book arrives): that is **under-fetching**. GraphQL needs one.
- **Latency on loopback does not show the benefit of fewer round trips.** A round trip here costs a fraction of a millisecond, so three REST requests take about as long as one GraphQL request, and the differences between styles are inside the standard deviation for the list and the nested read. GraphQL is the slowest on the tiny detail read because it parses and validates a query on every call. On a real network, where each round trip costs tens of milliseconds, the number of requests dominates and the order changes.
- One machine, one data size, one run. This is not a ranking of styles.

## N+1 in GraphQL and its fix with batching

The request asks for 100 books, each with its author and its reviews:

```graphql
query Shelf($limit: Int!) { books(limit: $limit) { id title author { name } reviews { rating } } }
```

| Endpoint | SQL statements | Mean (ms) | Std dev (ms) |
| --- | ---: | ---: | ---: |
| `/graphql-naive` | 201 | 31.666 | 6.986 |
| `/graphql` | 3 | 7.579 | 5.966 |

The naive resolvers fetch one author and one list of reviews **per book**: 1 + 100 + 100 = 201 statements. With the batching loader in [ts/src/loader.ts](ts/src/loader.ts) each resolver only registers a key, and one `WHERE id = ANY(...)` per relation answers all of them: 1 + 1 + 1 = 3 statements, for the same response. The server reports the count in the `x-db-queries` response header, and a test asserts both numbers.

## Quiz topics it demonstrates

Area `protocols`:

- `rest`: resources and methods, status codes of the CRUD operations, over-fetching and under-fetching
- `graphql`: field selection, single endpoint, errors in the body, the N+1 problem and batching
- `json-rpc-grpc`: JSON-RPC 2.0 request, response, error object, notification and batch
- `http-semantics`: 201 with `Location`, 404, 422

## Run

The only requirement is Docker.

```sh
./setup-unix-rest-graphql-jsonrpc.sh        # Linux and macOS
./setup-windows-rest-graphql-jsonrpc.ps1    # Windows
```

The script builds the image, starts a local PostgreSQL on an internal network, runs the typecheck and the tests, and removes the containers.

## Benchmark (the demo)

```sh
docker compose run --rm bench && docker compose down -v
```

It prints the two tables above and writes `results/results.md` and `results/results.json`. `BENCH_ITERATIONS` (default 300) and `BENCH_ROUNDS` (default 3) change the size of the run.

## Tests

```sh
docker compose run --rm ts-test && docker compose down -v
```

| File | What it proves |
| --- | --- |
| `ts/tests/behaviour.test.ts` | one behaviour suite (9 tests) passes against the three styles |
| `ts/tests/styles.test.ts` | status codes in REST, `errors` in GraphQL, error codes, notification and batch in JSON-RPC, N+1 with 201 statements against 3, requests per nested read |
| `ts/tests/unit.test.ts` | the batching loader, the statistics, the deterministic seed |

## Structure

| Path | Content |
| --- | --- |
| `ts/src/domain.ts` | the domain rules and SQL, shared by the three styles |
| `ts/src/rest.ts`, `ts/src/graphql.ts`, `ts/src/jsonrpc.ts` | one adapter per style |
| `ts/src/loader.ts` | the batching loader that fixes N+1 |
| `ts/src/clients.ts` | three clients behind one interface, with a meter of requests and bytes |
| `ts/src/bench.ts` | the benchmark |
| `ts/sql/schema.sql`, `ts/src/seed.ts` | tables and deterministic data (25 authors, 120 books, 360 reviews) |

Everything is local: the services run on an internal docker-compose network, no port is published on the host, and the database password is an obviously fake lab value.

## Versions

| Component | Version |
| --- | --- |
| Bun | 1.4.2 (`oven/bun:1.4.2`) |
| PostgreSQL | 18.6 (`postgres:18.6-alpine`) |
| ElysiaJS | 1.4.30 |
| graphql (graphql-js) | 17.0.2 |
| pg | 8.23.1 |
| Zod | 4.6.5 |

**Why `graphql`.** It is graphql-js, the reference implementation of the specification, maintained by the GraphQL Foundation, and the engine that the popular servers (Apollo Server, GraphQL Yoga) are built on. It runs on Bun with no adapter, and it needs no plugin to sit behind one ElysiaJS `POST` route, which keeps the HTTP part visible: the handler is a dozen lines in `ts/src/graphql.ts`. The batching loader is written by hand instead of adding the `dataloader` package, because the mechanism is the lesson.
