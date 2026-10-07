# deadlock-mini-shell

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Two small programs about processes and the resources they share. The first, in Go, finds deadlocks in a resource allocation graph and applies the banker's algorithm to decide whether a state is safe. The second, in C++, is a mini shell that runs pipelines with `fork`, `exec`, `pipe` and `dup2`, supports redirection and survives Ctrl-C. Together they teach how processes are created and connected, and what goes wrong when they wait for each other.

Full explanation: [docs/en/operating-systems/deadlock-mini-shell.md](../../../docs/en/operating-systems/deadlock-mini-shell.md).

## Quiz topics it demonstrates

- `operating-systems` / `deadlocks`: the four conditions, resource allocation graphs, detection, safe and unsafe states, the banker's algorithm.
- `operating-systems` / `introduction-and-system-calls`: `fork`, `exec`, why `cd` is a shell builtin.
- `operating-systems` / `processes-and-threads`: process creation, separate address spaces after `fork`, waiting for children.

## Run

The only requirement is Docker.

```sh
./setup-unix-deadlock-mini-shell.sh        # Linux and macOS
./setup-windows-deadlock-mini-shell.ps1    # Windows
```

The script builds the images, runs the tests of both languages and runs the two demos.

## Demos

```sh
docker compose run --rm demo          # classifies the documented graphs and states, writes results/results.md
docker compose run --rm shell-demo    # runs cpp/demo.msh in the mini shell
docker compose run --rm shell         # an interactive mini shell (leave with exit or Ctrl-D)
```

```
textbook, 7 processes  DEADLOCK     deadlocked: D, E, G    blocked behind the cycle: B
single resource        safe         one safe sequence: P1, P2, P0
  P0 asks for 1 unit                   denied: the resulting state would be unsafe
```

## Structure

| Path | Content |
| --- | --- |
| `go/graph.go` | resource allocation graph: processes on a cycle and processes blocked behind it |
| `go/banker.go` | safe sequence, the banker's decision on a request, detection with several instances |
| `go/examples.go` | the documented graphs and states, used by the tests and by the demo |
| `go/cmd/demo/main.go` | prints the classification |
| `cpp/parser.hpp` | turns a command line into a pipeline (no processes involved) |
| `cpp/msh.cpp` | the shell: `fork`, `exec`, `pipe`, `dup2`, `waitpid`, `SIGINT` |
| `cpp/test_parser.cpp`, `cpp/test_shell.sh` | unit tests of the parser and the integration test script |
| `results/` | committed output of the deadlock demo |

Each language does the part it is best suited for: Go for the graph and matrix algorithms, C++ for the POSIX system calls. Images are pinned (`golang:1.27.1-bookworm`, `gcc:16.2.0-trixie`) and there is no library dependency.

## Tests

```sh
docker compose run --rm go-test     # gofmt, go vet, golangci-lint, then the tests
docker compose run --rm cpp-test    # clang-format check, parser tests, then test_shell.sh
```

The Go tests classify known deadlocked and safe graphs and the textbook states of the banker's algorithm. The shell test script runs pipelines of three commands, with and without redirection, and interrupts a running `sleep 30 | cat | cat` with SIGINT, checking that the pipeline dies at once and the shell runs the next command.

## Scope of the shell

The mini shell is a teaching tool, not a replacement for `sh`. It has no variables, no globbing, no `&&` and no background jobs. It does not create a process group per job, so it relies on the terminal sending Ctrl-C to the whole foreground group.
