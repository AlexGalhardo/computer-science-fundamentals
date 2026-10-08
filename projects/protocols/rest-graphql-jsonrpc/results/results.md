# rest-graphql-jsonrpc: results

- Command: `docker compose run --rm bench`
- Machine: AMD Ryzen 7 5700X3D 8-Core Processor, 16 cores, 16 GB visible to the container, linux x64
- Runtime: Bun 1.4.2, PostgreSQL from the `db` service of docker-compose
- Method: 50 warm-up calls discarded, then 3 rounds of 300 calls per style, styles interleaved. Client, server and database on the same machine, HTTP/1.1 over loopback, bodies not compressed.
- Std dev is the standard deviation between the round means. A difference smaller than it is not a difference.

## Latency and payload per style

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

## N+1 in GraphQL: 100 books with author and reviews

Mean of 20 runs after one warm-up call.

| Endpoint | SQL statements | Mean (ms) | Std dev (ms) |
| --- | ---: | ---: | ---: |
| `/graphql-naive` | 201 | 31.666 | 6.986 |
| `/graphql` | 3 | 7.579 | 5.966 |
