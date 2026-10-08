# REST, GraphQL and JSON-RPC (MP-PROTO-1)

> Versão em português: [docs/pt/protocols/rest-graphql-jsonrpc.md](../../pt/protocols/rest-graphql-jsonrpc.md)

Mini-project: [`projects/protocols/rest-graphql-jsonrpc`](../../../projects/protocols/rest-graphql-jsonrpc/README.md). Quiz topics: `rest`, `graphql`, `json-rpc-grpc`, `http-semantics`.

## The question

An API is a way of asking a server to do something. The three styles answer three questions differently: **what does the client name** (a resource, a set of fields, a procedure), **who decides the shape of the answer**, and **where is the outcome reported**. The mini-project exposes one domain (authors, books, reviews) through the three, with the domain rules written once in `ts/src/domain.ts`, so that everything that differs is the style.

## The three styles side by side

| | REST | GraphQL | JSON-RPC 2.0 |
| --- | --- | --- | --- |
| The client names | a resource, by URL | the fields it wants, in a query | a procedure, by name |
| Endpoints | one URL per resource | one (`/graphql`) | one (`/rpc`) |
| The operation is in | the HTTP method | the query text (`query`, `mutation`) | `"method"` in the body |
| Shape of the answer decided by | the server | the client | the server |
| Outcome reported in | the HTTP status code | `data` and `errors` in the body | `result` or `error` in the body |
| Contract | convention (or OpenAPI) | the typed schema, mandatory | convention |
| HTTP caching of reads | works: `GET` on a URL | hard: `POST` to one URL | hard: `POST` to one URL |

### REST

The URL is a noun (`/rest/books/7`), the method is the verb, and the status code is the outcome: `200` for a read, `201` with a `Location` header for a creation, `404` for a resource that does not exist, `422` for content that breaks a rule. Because the meaning is in standard HTTP parts, generic software understands it: a cache can store a `GET`, a proxy can retry an idempotent `PUT`, and a monitoring tool can count `5xx` without reading any body.

The price is that the server fixes the representation. `GET /rest/books` returns whole books when the screen wanted two fields (**over-fetching**), and a book with its author and reviews takes three requests (**under-fetching**).

### GraphQL

There is one endpoint and a typed schema. The client sends a query that lists the fields it wants, following relations as deep as it needs, and the answer has exactly that shape. One request replaces the three of REST, and the list carries only the two fields.

The price is paid on the server and by the HTTP machinery. Every request is a `POST` to the same URL, so plain HTTP caching does not apply, and by the usual convention the status is `200` even when the operation failed: the client must read `errors`. And the server executes the query field by field, which leads to N+1 (below).

### JSON-RPC 2.0

The body names a procedure and its parameters, and the answer carries `result` **or** `error`, never both, with the `id` of the request echoed so that the two can be matched. A request without `id` is a **notification**, which gets no answer at all, not even an error. An array of requests is a **batch**: one HTTP round trip, answers in any order, matched by `id`.

It is the simplest of the three to implement (the whole API is a table of names and functions in `ts/src/jsonrpc.ts`) and it does not depend on HTTP at all. The price is that nothing generic can tell a safe read from a write, and that a batch only saves round trips between calls that do not depend on each other: the author of a book cannot be asked in the same batch as the book, because its id is in the book's answer.

The predefined error codes are `-32700` (the body is not JSON), `-32600` (not a valid request object), `-32601` (unknown method), `-32602` (invalid parameters) and `-32603` (internal error). The range `-32000` to `-32099` is left for the server, and the mini-project uses `-32004` for "not found".

## One behaviour suite, three styles

`ts/src/clients.ts` has three clients behind one interface (`listTitles`, `getCard`, `getPage`, `addReview`). `ts/tests/behaviour.test.ts` runs the same nine tests against each of them: reads, a missing book, a write, a write to a missing book, an invalid rating. Each client translates the failure vocabulary of its style back into the same two kinds, "not found" and "invalid":

| Domain error | REST | GraphQL | JSON-RPC |
| --- | --- | --- | --- |
| not found | status `404` | `extensions.code: "NOT_FOUND"` | error code `-32004` |
| invalid | status `422` | `extensions.code: "BAD_USER_INPUT"` | error code `-32602` |

## The N+1 problem

A GraphQL server answers a query by calling one function, a **resolver**, per field. For `books { author { name } }` the resolver of `author` runs once per book. If it runs `SELECT ... WHERE id = $1`, a list of 100 books sends 1 statement for the list and 100 for the authors. Ask for the reviews too and it is 201. Each statement is fast. The sum is not, and it grows with the size of the list.

The fix is **batching**. The resolver does not query: it asks a loader for a key and gets a promise. The loader collects all the keys asked during the current turn of the event loop and then sends one statement for all of them, `WHERE id = ANY(...)`. The mini-project writes this loader by hand in about 40 lines (`ts/src/loader.ts`), which is the idea behind the DataLoader library. Two details matter:

- The loader waits with `setImmediate`, which runs after the executor has called the resolvers of every item of the list, so all the keys are collected.
- A loader lives for **one request**. Its cache avoids repeated keys inside the request and must not leak rows between clients.

The server counts its SQL statements per request and returns the count in the `x-db-queries` header. The test asserts 201 statements on `/graphql-naive` and 3 on `/graphql`, with the same response.

## Reading the tables

The committed numbers are in the [README](../../../projects/protocols/rest-graphql-jsonrpc/README.md#latency-and-payload-per-style) and in `results/results.md`.

- Payload: the list is about 9 times smaller in GraphQL (3.0 kB against 27.6 kB), and the nested read about 6 times smaller.
- Round trips for the nested read: REST 3, JSON-RPC 2, GraphQL 1.
- Latency: on loopback a round trip costs a fraction of a millisecond, so the styles are within the standard deviation of each other on the list and nested reads, and GraphQL is the slowest on the small detail read, because it parses and validates the query on every call. The benefit of one round trip appears on a real network, where each one costs tens of milliseconds. The benchmark does not simulate that, and says so.
- N+1: 201 statements against 3, and about 4 times slower in this run, with the database on the same machine.

The repository benchmark runner (`bun run bench`, hyperfine) starts containers with no network, so it does not fit a benchmark that needs a database. This one measures in-process, with warm-up discarded, several rounds, the spread reported, and the machine, versions and command recorded.

## Which one to choose

- **REST** when the API is public or long-lived, the data maps to resources, and HTTP caching and standard tooling matter.
- **GraphQL** when many different screens read the same connected data and each needs a different slice, and the team can pay for the server-side care (batching, depth and complexity limits).
- **JSON-RPC** for actions that are not resources (`reports.rebuild`), for internal services, and for transports that are not HTTP.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-PROTO-1.1 same domain through the three styles | `ts/tests/behaviour.test.ts`: one suite of 9 tests, run with `describe.each` against REST, GraphQL and JSON-RPC |
| MP-PROTO-1.2 N+1 and its fix with batching | `ts/tests/styles.test.ts`, "the N+1 problem": 201 statements on `/graphql-naive`, 3 on `/graphql` |
| MP-PROTO-1.3 latency and payload table | `docker compose run --rm bench` writes `results/results.md`: one row per style for a list, a detail and a nested read |

## Run

```sh
cd projects/protocols/rest-graphql-jsonrpc
./setup-unix-rest-graphql-jsonrpc.sh        # or ./setup-windows-rest-graphql-jsonrpc.ps1
docker compose run --rm bench && docker compose down -v
```
