# regex-engine

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A regular expression engine built the textbook way, in Go. It teaches **how a regular expression becomes an automaton**: the pattern is parsed into a tree, the tree becomes a nondeterministic automaton (Thompson construction), and that becomes a deterministic one (subset construction). A naive backtracking matcher is included only to show what the automata avoid.

Full explanation: [docs/en/compilers/regex-engine.md](../../../docs/en/compilers/regex-engine.md).

## Quiz topics it demonstrates

- `compilers` / `lexical-analysis`: regular expressions, NFA and DFA, Thompson construction, epsilon closure, subset construction, the cost of simulating an NFA against running a DFA, backtracking blow-up.

## Run

The only requirement is Docker.

```sh
./setup-unix-regex-engine.sh        # Linux and macOS
./setup-windows-regex-engine.ps1    # Windows
```

The script builds the image and runs the formatter check, `go vet`, the linter and the tests. Then:

```sh
docker compose run --rm regex match "(a|b)*abb" babb      # the three engines, with step counts
docker compose run --rm regex dot nfa "(a|b)*abb"         # the NFA in Graphviz DOT
docker compose run --rm regex dot dfa "(a|b)*abb"         # the DFA in Graphviz DOT
```

```text
pattern "(a|b)*abb", input "babb"
tree: (cat (cat (cat (star (alt a b)) a) b) b)
NFA: 14 states, DFA: 5 states
nfa           match=true  steps=31
dfa           match=true  steps=4
backtracking  match=true  steps=29
```

## What a pattern may contain

| Syntax | Meaning |
| --- | --- |
| `a` | the byte `a` |
| `.` | any byte |
| `[abc]`, `[a-z0-9]`, `[^,]` | one byte of a class, with ranges and negation |
| `AB` | concatenation |
| `A\|B` | alternation |
| `A*`, `A+`, `A?` | zero or more, one or more, zero or one |
| `(A)` | grouping |
| `\.` | the next character as a literal |

Precedence, from the loosest to the tightest: alternation, concatenation, repetition. A match is always of the **whole** input, and the engine works on bytes.

## Structure

| Path | What it is |
| --- | --- |
| `go/regex/parser.go` | pattern to tree, with precedence and syntax errors |
| `go/regex/nfa.go` | Thompson construction, epsilon closure, NFA simulation |
| `go/regex/dfa.go` | subset construction, byte classes, DFA matching |
| `go/regex/backtrack.go` | the naive backtracking matcher used for comparison |
| `go/regex/dot.go` | export of both automata to Graphviz DOT |
| `go/cmd/regex-engine/` | the command: `match`, `dot`, `bench` |
| `results/` | committed benchmark results |

Go on the pinned image `golang:1.27.1-bookworm`, standard library only. The linter is golangci-lint 2.14.0, from its pinned image.

## Tests

```sh
docker compose run --rm go-test
```

- **Parser**: precedence checked on the shape of the tree, classes and escapes, and thirteen invalid patterns with the offset and message of each error.
- **Differential test**: 1,000 generated cases (200 random patterns, 5 inputs each, fixed seed) get the same answer from the NFA, the DFA and the backtracking matcher as from Go's `regexp`. In the committed suite 684 cases match and 316 do not.
- **Automata**: number of states counted from the construction rules, the DOT export, and a pattern whose DFA needs 2^14 states and is refused with an error while the NFA still answers.
- **Pathological case**: step counts prove that backtracking at least doubles per extra letter while the automata grow exactly linearly.

## Benchmark: the pathological pattern

```sh
bun run bench -- --project projects/compilers/regex-engine    # from the repository root
```

The pattern is `(a*)*b` and the input is `n` letters `a`, with no `b`, so nothing matches. A backtracking matcher discovers that only after trying every way of splitting the letters between the two stars. Steps are counted by the engines and do not depend on the machine. Times are the measured section from [`results/results.md`](results/results.md), where the machine, the Go version and the commands are recorded.

| n | Backtracking steps | Backtracking (ms) | NFA steps | NFA (ms) | DFA steps | DFA (ms) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 6,143 | 0.03 | 60 | < 0.01 | 10 | < 0.01 |
| 15 | 196,607 | 1.43 | 90 | < 0.01 | 15 | < 0.01 |
| 20 | 6,291,455 | 48.8 | 120 | < 0.01 | 20 | < 0.01 |
| 25 | 201,326,591 | 1,240 | 150 | < 0.01 | 25 | < 0.01 |
| 1,000 | not run | not run | 6,000 | 0.03 | 1,000 | < 0.01 |
| 100,000 | not run | not run | 600,000 | 5.99 | 100,000 | 0.23 |
| 1,000,000 | not run | not run | 6,000,000 | 44.5 | 1,000,000 | 2.74 |

Backtracking takes `3 · 2^(n+1) − 1` steps: five more letters multiply the work by 32, and 25 letters already cost more than a second. It was not run beyond 25, because 1,000 letters would need more than 10^301 steps. The NFA takes 6 steps per letter and the DFA takes 1, so a million letters cost milliseconds.
