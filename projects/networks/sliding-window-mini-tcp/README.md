# sliding-window-mini-tcp

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How reliability is built on top of a channel that loses, duplicates and reorders packets. The mini-project has two parts:

1. A **simulated channel**, deterministic with a fixed seed, and the three classic ARQ protocols on top of it: stop-and-wait, go-back-N and selective repeat. Written in Go and in Elixir.
2. A **mini TCP over UDP** in Go: three-way handshake, byte sequence numbers, cumulative acknowledgements, adaptive retransmission timeout and an orderly close, moving a 10 MB file between two real UDP sockets with injected loss.

Full explanation: [docs/en/networks/sliding-window-mini-tcp.md](../../../docs/en/networks/sliding-window-mini-tcp.md).

## Quiz topics it demonstrates

- `networks` / `data-link-layer`: stop-and-wait, sequence numbers, go-back-N, selective repeat, window size limits, link utilisation
- `networks` / `transport-layer`: three-way handshake, sequence and acknowledgement numbers, retransmission timeout, connection release

## Run

The only requirement is Docker.

```sh
./setup-unix-sliding-window-mini-tcp.sh        # Linux and macOS
./setup-windows-sliding-window-mini-tcp.ps1    # Windows
```

The script builds the images and runs the tests of both languages.

## Demo

```sh
docker compose run --rm -T go-demo        # simulated protocols + 10 MB mini TCP transfer
docker compose run --rm -T elixir-demo    # simulated protocols in Elixir
```

Each command prints a Markdown report. The committed copies are [results/results.md](results/results.md) and [results/results-elixir.md](results/results-elixir.md). The Go demo takes about half a minute and exits with an error if any transfer does not arrive intact (SHA-256). Flags: `-mb`, `-loss`, `-runs`, `-window`, for example `docker compose run --rm -T go-demo go run ./cmd/demo -mb 2 -loss 0.1`.

Nothing uses the network: containers run with `network_mode: none` and the mini TCP talks over the loopback interface of its own container.

## Structure

| Path | What it is |
| --- | --- |
| `go/channel` | the simulated channel: loss, duplication, reordering, one seed |
| `go/arq` | stop-and-wait, go-back-N and selective repeat as one engine with two windows |
| `go/minitcp` | the mini TCP over UDP sockets, with loss injected at each socket |
| `go/cmd/demo` | the report generator |
| `elixir/lib` | channel and ARQ protocols again, as a pure function over immutable state |
| `results/` | committed reports |

Go is the main implementation. Elixir repeats only the simulation, because that is where the lesson changes: the same protocol written without mutable state, with the random generator passed along as a value. The mini TCP exists only in Go.

## Tests

```sh
docker compose run --rm -T go-test
docker compose run --rm -T elixir-test
```

The Go service checks `gofmt`, `go vet` and `go test`; the Elixir one checks `mix format` and `mix test --warnings-as-errors`. The tests cover the determinism of the channel, intact delivery by every protocol at 20% loss, the window limits, and the mini TCP with 5% and 30% loss.

## What the numbers show

- Stop-and-wait uses a small fraction of the link, because it idles for a whole round trip per frame.
- Go-back-N keeps the link busy but pays for every loss, and for every reordered frame, with a whole window of retransmissions.
- Selective repeat sends the same number of frames as stop-and-wait (only what was lost is resent) while keeping the window moving.
- The simulation is exactly repeatable. The mini TCP is not: it runs on real sockets and a real clock, so its table reports mean, deviation and range over several runs.
