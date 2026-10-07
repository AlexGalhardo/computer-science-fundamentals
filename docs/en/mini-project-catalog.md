# Mini-project catalog

> Versão em português: [docs/pt/mini-project-catalog.md](../pt/mini-project-catalog.md)

Ideas agreed in the Phase 2 brainstorming, grouped by area. This is the backlog that `PLAN.md` turns into tasks with acceptance criteria. TypeScript is the reference language unless another one is listed first.

## Algorithms and Big O

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Sorting race (bubble, insertion, merge, quick, heap, radix) | all 7 | time per `n` on random, sorted and reversed input |
| Big O lab | TS | measures a function, fits the curve and shows the empirical complexity |
| Dynamic programming (knapsack, LCS, coin change) | TS, Python | naive recursion, memoisation and tabulation side by side |
| Travelling salesman | TS, Rust | brute force against a heuristic, showing where `n!` becomes unusable |

## Data structures

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Hash map from scratch | C++, Rust, TS | chaining against open addressing, by load factor |
| Graphs (Dijkstra, Bellman-Ford, topological sort, spanning tree) | C++, Go | the 10 `.in/.out` cases in `references/usp/data-structures-2` become automated tests |
| B-tree on disk | C++, Rust | page reads against a binary tree |
| LRU cache, bloom filter and trie | TS, Go | measured hit rate and false positives |

## Compilers

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Mini language: lexer, parser, AST and interpreter | TS | REPL showing tokens and tree for each line |
| Bytecode VM for the same language | Rust | tree-walking interpreter against bytecode |
| Regex engine (NFA to DFA) | Go | automaton visualisation |

## State machines and information theory

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Order state machine (paid, shipped, cancelled) | TS, Elixir | invalid transitions rejected, diagram generated from the code |
| Huffman and LZ77 | Rust, Python | compression ratio against the Shannon entropy of the file |
| Error detection and correction (CRC, Hamming) | C++ | flips bits and shows what is detected and corrected |

## Concurrency and parallelism

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Counter race condition: buggy version and fix | Go, Rust, Java, Elixir, TS | mutex, atomic, channel and actor solving the same problem |
| Deadlock: dining philosophers | Go, Java | locks on purpose, then solved with lock ordering |
| Scaling by cores (primes, Mandelbrot) | Rust, Go, C++ | real speed-up against Amdahl's law |
| 10 thousand connections | TS, Go, Elixir | event loop, goroutines and BEAM processes under local k6 |

## Transactions and databases

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Isolation levels in PostgreSQL | TS + SQL | dirty read, phantom and lost update reproduced in tests |
| Overselling at checkout | TS | optimistic lock, pessimistic lock and `SERIALIZABLE` under load |
| Prisma, Drizzle and raw SQL | TS | same query, latency and generated SQL |
| Outbox and saga | TS | failure injected midway, consistency verified |

## Load balancing, performance and protocols

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| NGINX against Caddy (round-robin, least-conn, ip-hash) | config + TS | request distribution and loss of one node |
| Hand-written L7 load balancer | Go | health check and retry, compared with NGINX |
| REST, GraphQL and JSON-RPC on the same API | TS (Elysia) | latency and payload size, N+1 problem in GraphQL |
| HTTP/1.1, HTTP/2 and HTTP/3 | Caddy + TS | request waterfall with many small images |
| HTTP server on raw TCP | Go or Rust | protocol parser written by hand |
| Bun against Node, with and without PM2 cluster | TS | requests per second and memory |

## Messaging

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Same task on BullMQ, RabbitMQ, Kafka and SQS (LocalStack) | TS | throughput, ordering and redelivery |
| Idempotency and dead-letter queue | TS, Go | failing consumer, effect applied exactly once |
| Queue against pub/sub, with backpressure | TS, Elixir | producer faster than the consumer |

## OOP, functional programming, patterns and SOLID

| Mini-project | Languages | Demo or benchmark |
| --- | --- | --- |
| Same domain (cart) in OOP and functional style | Java, Elixir, TS | lines, testability and mutation compared |
| SOLID before and after | TS, Java | violating code, refactor, same tests passing |
| About 10 back-end patterns | TS | one small example per pattern |
| Pure functions with property-based tests | TS, Elixir | a property finds the bug the example test misses |

## Security

One isolated lab per flaw: vulnerable version, fixed version and a test proving the fix. Local only, in Docker, on an internal network.

| Lab | What it teaches |
| --- | --- |
| SQL injection | concatenation against parameterised queries |
| XSS (stored, reflected, DOM) and CSP | output escaping and content policy |
| CSRF | token and `SameSite` cookies |
| Broken access control (IDOR) | ownership check on the server |
| SSRF | allow-list of destinations, inside the Docker internal network |
| Passwords and sessions | MD5 against Argon2, attempt limiting |
| Common JWT mistakes | fixed algorithm, strong secret, expiry |
| Upload and path traversal | path and type validation |

## Testing

| Mini-project | Demo |
| --- | --- |
| Full pyramid on one app (unit, integration, Playwright e2e, smoke, regression) | time and cost of each layer |
| TDD kata with a red, green, refactor commit history | the history is the lesson |
| Mutation testing | 100% coverage that misses the bug |
| Flaky test lab | causes (time, order, network) and fixes |

## Observability

Stack: OpenTelemetry, Prometheus, Grafana, Loki and Tempo, all local.

| Mini-project | Demo |
| --- | --- |
| Three services with traces, metrics and logs | a slow request traced end to end |
| Structured logs and correlation id | finding an error by request id |
| SLO and alert | local k6 causes the violation and the alert fires |
| Profiling with a flame graph | bottleneck found and fixed, before and after |

## Extra areas

| Area | Mini-project idea |
| --- | --- |
| Cache | Redis, invalidation strategies, cache stampede, cache-aside against write-through, measured with local k6 |
| Rate limiter | token bucket, leaky bucket and sliding window, in memory and on Redis |
| File systems | file organisation, indexes, compression and defragmentation |
| Digital logic | logic gates, adder, flip-flop and a circuit simulator |
| Networks | TCP and UDP sockets, handshake, DNS and a simple hand-made protocol |
| Operating systems | process scheduler, virtual memory and paging, semaphores, simulated and visualised |
| Blockchain | chain of blocks with hashing, proof of work and validation |
| CI | GitHub Actions running lint, tests and benchmarks of each mini-project |

## New areas from the books

| Area | Mini-project idea |
| --- | --- |
| Electronics | theory only: no mini-project, a 170-question quiz following the 34 chapters of the book |
| Software architecture | the same small application in clean architecture layers, showing the dependency rule with entities, use cases and adapters |
| Databases (theory) | mini relational DBMS with nested-loop, hash and merge joins, and a normalisation tool (closure, candidate keys, 3NF and BCNF) |
| Software engineering | theory only: no mini-project, a 150-question quiz |

## Ideas from the books and lectures

Added after reading the summaries in `references/summaries/`.

| Area | Mini-project idea | Source |
| --- | --- | --- |
| Operating systems | CPU scheduling simulator with Gantt chart (FCFS, SJF, round-robin, priority) | Tanenbaum |
| Operating systems | paging and TLB simulator with page replacement and Belady's anomaly | Tanenbaum |
| Operating systems | memory allocator (first, best and worst fit, buddy) with fragmentation benchmark | Tanenbaum |
| Operating systems | deadlock detector and banker's algorithm, mini shell with pipes and signals | Tanenbaum |
| Networks | sliding-window protocols over a lossy channel, mini TCP over UDP | Tanenbaum |
| Networks | ALOHA and CSMA/CD simulator, iterative DNS resolver, subnet calculator | Tanenbaum |
| File systems | external sorting with multiway merge, on-disk indexes with inverted lists | USP Data Structures II |
| Compilers | mark-and-sweep garbage collector, simple optimisations over three-address code | Dragon Book |
| Performance | naive against blocked matrix multiplication, measuring cache misses | Dragon Book |
| Big O | interactive master theorem, the Ω(n lg n) bound shown with a decision tree | USP Algorithm Analysis |
| Algorithms | hybrid quicksort, varying the insertion-sort threshold and the pivot strategy | USP Algorithm Analysis |
| Data structures | unbalanced BST against AVL and red-black trees, with rotation visualiser | USP Data Structures I |
| Digital logic | Karnaugh and Quine-McCluskey minimisation, NAND-only ALU, 4-bit mini CPU | USP Digital Logic |
| Testing | multi-currency money kata, mini xUnit from scratch | Kent Beck |
| OOP and SOLID | executable code smell catalogue with before and after | Clean Code, OO and SOLID |
