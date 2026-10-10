# Profiling with a flame graph (MP-OBS-4)

> Versão em português: [docs/pt/observability/flame-graph.md](../../pt/observability/flame-graph.md) · Versión en español: [docs/es/observability/flame-graph.md](../../es/observability/flame-graph.md)

Mini-project: [`projects/observability/flame-graph`](../../../projects/observability/flame-graph/README.md). Quiz topics: `profiling`, `three-signals`.

## The problem

Metrics say that a service is slow. A trace says which service and which span of a request. Neither says which **function** inside the process burns the CPU. Reading the code does not help much either, because expensive lines often look cheap:

```go
match := compileRegex(linePattern).FindStringSubmatch(line)
```

```ts
return quote(order, (sku) => buildPriceIndex(catalog).get(sku));
```

Both read like a lookup. Both do, for every item of a loop, a piece of work that only needs doing once. Guessing where the time goes is unreliable; a profiler measures it.

## 1. A sampling CPU profiler

A sampling profiler does not time every call. Many times per second (about 100 in Go, up to about 1000 in the JavaScript engine of Bun) it interrupts the program and writes down the **call stack** of what was running. A function that uses a lot of CPU is simply found on the stack more often.

Two consequences:

- The overhead is low and constant, so a profile can be taken from a service that is handling real load. That is the idea behind continuous profiling.
- The result is statistical. Ten samples prove nothing; the lab refuses to conclude anything from fewer than 50 samples inside the handler. A profile of an idle service shows only the runtime waiting, so the lab starts the load **before** asking for the profile.

Each runtime exposes its profiler through an HTTP endpoint that profiles the running process for N seconds:

| | Go | TypeScript (Bun) |
| --- | --- | --- |
| Endpoint in the lab | `GET /debug/pprof/profile?seconds=5` | `GET /debug/cpuprofile?seconds=5` |
| Mechanism | `net/http/pprof`, standard library | `node:inspector`: `Profiler.start`, `Profiler.stop` |
| Output | pprof (gzip-compressed protocol buffer) | `.cpuprofile` (JSON call tree, the DevTools format) |

These endpoints reveal internals. In the lab they are reachable only on an internal docker-compose network.

## 2. Folded stacks

Both formats are reduced to the same plain text, one line per distinct call stack:

```text
net/http.(*conn).serve;...;main.handleReportBefore;...;flame-graph/report.compileRegex;regexp.MustCompile;... 37
```

Frames from the root to the leaf, joined by `;`, then the number of samples that had exactly that stack.

- Go: `go tool pprof -traces -sample_index=samples` prints each sample group leaf first; `go/fold` reverses each block and adds the repeated stacks. No library is needed to decode the profile.
- TypeScript: a `.cpuprofile` is a tree in which each node has a `hitCount`, the samples that found the CPU exactly there. Walking from a node up to the root rebuilds its stack.

## 3. Drawing the flame graph

The renderer (`ts/src/svg.ts`) merges the stacks into a tree. Stacks that start with the same frames share those boxes, and that merge is the whole trick: thousands of samples collapse into a picture in which a hot function is one wide box.

![Go, before the fix](../../../projects/observability/flame-graph/results/flame-go-before.svg)

Reading rules:

| What you see | What it means |
| --- | --- |
| A box | A function |
| The box above it | A function it called. A column is a call stack, root at the bottom |
| Width | Share of the samples: the function plus everything it called (`cum` in pprof) |
| A wide box with nothing on top | Self time (`flat` in pprof): the CPU was in that function's own code |
| Left to right | Nothing. Siblings are sorted by name. **The x axis is not time** |
| Colour | Nothing. It only tells neighbours apart. One function is highlighted in purple |

In the picture above the plateaus are inside `regexp/syntax` and the allocator, code of the standard library that cannot be "optimised" from the application. The useful question is: going down the tower, which is the first box that belongs to the application and should not be this wide? It is `compileRegex`, with 90.5% of the samples of the handler.

## 4. The fix

The expensive step is hoisted out of the loop and done once.

```go
var lineRegex = regexp.MustCompile(linePattern) // once, at start-up

match := lineRegex.FindStringSubmatch(line)
```

```ts
const priceIndex = buildPriceIndex(catalog); // once, at start-up

return quote(order, (sku) => index.get(sku));
```

A test in each language checks that the two variants return exactly the same result: a fix must change the cost and nothing else.

After the fix the hot function is absent from the profile (0 samples in both languages), and the picture changes shape:

![Go, after the fix](../../../projects/observability/flame-graph/results/flame-go-after.svg)

## 5. Measuring what the fix is worth

The profile answers "where". It does not answer "how much faster will the service be": removing a function that holds 90% of the handler's CPU does not make every request ten times faster if the rest of the request is network and scheduling. So the lab measures throughput before and after, with the same closed-loop load (16 connections, 1 CPU per server, warm-up discarded, median of 5 runs):

| Service | Before (req/s) | After (req/s) | Factor |
| --- | --- | --- | --- |
| Go | 222 | 3133 | **14.1x** |
| TypeScript (Bun) | 405 | 22894 | **56.5x** |

The machine was shared with other workloads and the spread between runs was large (up to 42% of the median). Two other complete runs gave 14.7x and 24.3x for Go and 57.7x and 44.0x for TypeScript. Full table, spread and machine: [results/results.md](../../../projects/observability/flame-graph/results/results.md).

## Profile, trace, metric

| Question | Signal |
| --- | --- |
| Is the service slower than last week? | Metric (latency histogram) |
| Which service and which step of this request was slow? | Trace |
| Which function of this process uses the CPU? | Profile |

A trace covers one request across processes and includes the time spent waiting. A CPU profile covers all requests of one process and includes only the time on the CPU: a request that waits 800 ms for a database is long in a trace and invisible in a CPU profile. The mini-project [three-signals](three-signals.md) shows the first two rows.

## Things the runtime does to your stacks

- Go inlines small functions. `compileRegex` is inlined into its caller, and the profile still shows it as a frame, because the profile format records inlined calls. `go/fold` keeps them.
- In the TypeScript "before" picture, `quoteBefore` does not appear between `handleQuoteBefore` and `quote`: its last action is a call in tail position, and JavaScriptCore can reuse the stack frame for such a call. A profiler shows the stacks that exist at run time.
- The JavaScript profiler reports JavaScript functions only. The native `Map` code inside `buildPriceIndex` is counted as its self time, so the TypeScript picture is a short tower.

## Run

```sh
cd projects/observability/flame-graph
./setup-unix-flame-graph.sh       # or .\setup-windows-flame-graph.ps1: build, tests, live profile check
docker compose run --rm flame     # regenerate the profiles and the four SVG files in results/
docker compose run --rm bench     # regenerate the before/after table
docker compose down -v
```

Versions: `golang:1.27.1-bookworm` (standard library only), `oven/bun:1.4.2`, `zod` 4.6.5.
