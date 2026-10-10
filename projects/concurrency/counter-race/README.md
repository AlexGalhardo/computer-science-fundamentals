# counter-race

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Eight workers add 1 to the same counter 125,000 times each. The answer should be 1,000,000. Without synchronisation it is not, because `counter++` is three steps (read, add, write) and two workers can read the same old value. This mini-project shows that lost update in Go, Rust, Java and TypeScript, and then fixes it in four ways: a mutex, an atomic operation, message passing and an actor.

The longer explanation is in [docs/en/concurrency/counter-race.md](../../../docs/en/concurrency/counter-race.md).

> The buggy counters are **deliberately wrong** and labelled as such in the code. The Rust one uses `unsafe` to switch off the compiler check that would otherwise refuse to build it.

## Quiz topics it demonstrates

- `concurrency` / `race-conditions`: lost updates, critical sections, race detectors
- `concurrency` / `mutexes-and-locks`: the mutex fix
- `concurrency` / `atomics-and-memory-models`: the atomic fix, and why `volatile` is not one
- `concurrency` / `message-passing-and-channels`: one owner of the state behind a channel
- `concurrency` / `actor-model-and-beam`: an Elixir process as the owner of the state

## Run

The only requirement is Docker.

```sh
./setup-unix-counter-race.sh        # Linux and macOS
./setup-windows-counter-race.ps1    # Windows
```

The script builds the five images and runs every test. It takes a few minutes, because each fix is run 100 times.

## Structure

| Folder | Buggy version | Fixes |
| --- | --- | --- |
| `go/` | `BuggyCounter` (`c.n++`) | `sync.Mutex`, `atomic.Int64`, a goroutine that owns the number behind a channel |
| `rust/` | `BuggyCounter` (`UnsafeCell` and a false `unsafe impl Sync`) | `Mutex<u64>`, `AtomicU64`, a thread that owns the number behind an `mpsc` channel |
| `java/` | `BuggyCounter` (`count++` on a `volatile` field) | `synchronized`, `AtomicLong`, a thread that owns the number behind a `BlockingQueue` |
| `ts/` | `incBuggy` on a `SharedArrayBuffer` shared by worker threads | a mutex built with `Atomics.compareExchange` and `Atomics.wait`, `Atomics.add`, `postMessage` to the main thread |
| `elixir/` | `get_then_set` (two messages, so the update is lost again) | `inc`: one process owns the number and handles one message at a time |

Each folder has its own Dockerfile on a pinned image. Containers run with no network.

## Tests

```sh
docker compose run --rm go-test      # also: rust-test, java-test, ts-test, elixir-test
```

| What is tested | Where |
| --- | --- |
| The buggy counter ends below 1,000,000 in at least 24 of 30 runs | Go, Rust, Java, TypeScript |
| Every fix reaches exactly 1,000,000 in 100 consecutive runs | all five languages |
| The Go race detector (`-race`) flags the buggy counter and is silent on the three fixes | `go/counter_test.go` |
| Error Prone (`GuardedBy` check) flags the Java buggy counter and is silent on the three fixes | `java/check-guarded-by.sh` |
| In Elixir, `get` followed by `set` loses updates even with an actor | `elixir/test/` |

`FIXED_RUNS=10` lowers the number of repetitions on a slow machine, for example `docker compose run --rm -e FIXED_RUNS=10 ts-test`.

The detector output of both cases is in the test log, and a copy is committed in [results/race-detector-go.txt](results/race-detector-go.txt) and [results/race-detector-java.txt](results/race-detector-java.txt).

Linters and formatters run inside the same containers, before the tests: `gofmt` and `go vet`, `cargo fmt` and `clippy`, Spotless with google-java-format and `javac -Xlint:all -Werror`, `mix format`. Biome and golangci-lint use the configuration at the repository root:

```sh
bunx biome check projects/concurrency/counter-race
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Demo

```sh
docker compose run --rm go-demo      # also: rust-demo, java-demo, ts-demo, elixir-demo
```

Output of the Go demo on the machine described in [results/results.md](results/results.md):

```text
variant       final       lost         ms
buggy        230786     769214        5.4
mutex       1000000          0       30.7
atomic      1000000          0       13.1
channel     1000000          0      393.6
```

The buggy version is the fastest and loses three quarters of the work.

## Benchmark

```sh
bun run bench -- --project projects/concurrency/counter-race
bun run projects/concurrency/counter-race/throughput.ts
```

The first command measures every implementation with 1, 2, 4 and 8 workers and writes [results/results.md](results/results.md). The second one derives [results/throughput.md](results/throughput.md), in millions of increments per second. `dashboard/index.html` shows the same data as a chart and opens from disk.

What the table shows:

- More workers do **not** make a shared counter faster. All of them fight for one memory location, so the cores spend their time passing that cache line around. Throughput falls from 1 to 8 workers in almost every row.
- An atomic operation beats a mutex in most rows, and message passing is the slowest fix in every language, by up to two orders of magnitude. A message costs a queue operation and often a context switch.
- Message passing and actors earn their cost when the state is bigger than one number and the rules to change it are more than one addition.

Numbers are from one shared machine with other containers running, so read them as orders of magnitude.
