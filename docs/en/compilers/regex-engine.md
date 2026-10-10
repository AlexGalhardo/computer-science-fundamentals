# Regex engine

> Versão em português: [docs/pt/compilers/regex-engine.md](../../pt/compilers/regex-engine.md) · Versión en español: [docs/es/compilers/regex-engine.md](../../es/compilers/regex-engine.md)

Mini-project MP-COMP-4, in [`projects/compilers/regex-engine`](../../../projects/compilers/regex-engine). It teaches how a regular expression becomes an automaton. This is the machinery behind a lexer generator: the hand-written lexer of [MP-COMP-1](mini-language-parser.md) is such an automaton coded by hand.

## Three forms of the same pattern

```text
pattern text --parse--> tree --Thompson--> NFA --subset construction--> DFA
```

Each form answers "does this text match?", and each is cheaper to run and more expensive to build than the one before.

## The tree

A pattern has its own small grammar, with three levels of precedence:

```text
alternation   = concatenation { "|" concatenation }      loosest
concatenation = { repetition }
repetition    = atom { "*" | "+" | "?" }                 tightest
atom          = literal | "." | class | "(" alternation ")"
```

So `ab|cd*` is `(ab)|(c(d*))`. The parser in `go/regex/parser.go` is recursive descent with one function per rule, and it reports invalid patterns (`*a`, `(ab`, `[z-a]`) with the offset of the problem.

## Thompson construction: tree to NFA

A nondeterministic finite automaton (NFA) may have several transitions for the same byte and **epsilon transitions**, which are taken without reading anything. The construction has one small rule per kind of tree node, and every rule produces a fragment with one entry and one exit, so fragments plug into each other:

```text
a      (s) --a--> (f)
AB     A.exit --ε--> B.entry
A|B    (s) --ε--> A.entry, B.entry        A.exit, B.exit --ε--> (f)
A*     (s) --ε--> A.entry, (f)            A.exit --ε--> A.entry, (f)
A+     (s) --ε--> A.entry                 A.exit --ε--> A.entry, (f)
A?     (s) --ε--> A.entry, (f)            A.exit --ε--> (f)
```

A node adds at most two states, so the NFA is as large as the pattern: `(a|b)*abb` gives 14 states. In this implementation concatenation joins two fragments with an epsilon transition and adds no state.

## Simulating the NFA

"Nondeterministic" does not mean guessing. The simulation keeps the **set** of all states the automaton could be in:

1. start with the epsilon closure of the start state (every state reachable through ε alone);
2. for each input byte, follow that byte from every state of the set and take the epsilon closure of the result;
3. accept when the final set contains the accepting state.

A set holds each state at most once, so one byte costs at most the size of the pattern. The total is O(n · m) for an input of n bytes and a pattern of size m: linear in the input for any pattern.

## Subset construction: NFA to DFA

The sets visited by the simulation depend only on the pattern, not on the input. The subset construction computes them all ahead of time and makes each set one state of a deterministic automaton (DFA):

1. the start state of the DFA is the epsilon closure of the NFA start state;
2. for an unprocessed set and each byte, compute the set the simulation would move to: that is the transition;
3. a set never seen before becomes a new DFA state, and the process repeats until none is left;
4. a DFA state accepts when its set contains the NFA accepting state.

Matching is then one table lookup per byte, O(n), with no dependence on the pattern. For `(a|b)*abb` the DFA has 5 states.

Two practical details in `go/regex/dfa.go`:

- **Byte classes.** Bytes that no part of the pattern tells apart get one shared column in the transition table, so `[a-z]` does not cost 26 columns.
- **The price.** A DFA state is a set of NFA states, so an NFA with m states can need up to 2^m DFA states. "The 14th byte from the end is an `a`" really needs 2^14. The construction stops with an error at 10,000 states, and the NFA remains usable. This is the classic trade: the NFA is small and slower, the DFA is fast and can be huge.

## Why not backtracking

Many regex libraries match by trying one path and going back when it fails. That supports extras such as backreferences, but the same input position can be explored again and again through different chains of choices. With `(a*)*b` and an input of n letters `a`, every way of cutting the run into pieces is tried: `3 · 2^(n+1) − 1` steps in `go/regex/backtrack.go`.

| n | Backtracking steps | NFA steps | DFA steps |
| ---: | ---: | ---: | ---: |
| 10 | 6,143 | 60 | 10 |
| 20 | 6,291,455 | 120 | 20 |
| 25 | 201,326,591 | 150 | 25 |
| 1,000,000 | not run | 6,000,000 | 1,000,000 |

The automata cannot blow up this way, because a set cannot contain the same state twice. The timings, with the machine and versions, are in `results/results.md` of the mini-project. A pattern like this in a service that accepts user input is a denial-of-service risk known as ReDoS, and matching with automata is the structural defence. This project only measures its own engines, locally.

## Seeing the automata

`regex-engine dot nfa <pattern>` and `regex-engine dot dfa <pattern>` print the automaton in the DOT language of Graphviz, as text. Each DFA state is labelled with the set of NFA states it stands for, which makes the subset construction visible.

## Checking against a real engine

The parser and the three matchers are compared with Go's `regexp` package on 1,000 generated cases: random pattern trees over a small alphabet, written back as text and parsed by the real parser, with half of the inputs built to match and half random. `regexp` is itself automaton-based, so it is a trustworthy oracle for regular patterns.

## Running it

```sh
./setup-unix-regex-engine.sh                                   # build, format check, vet, lint, tests
docker compose run --rm regex match "(a|b)*abb" babb           # the three engines, with steps
docker compose run --rm regex dot dfa "(a|b)*abb"              # automaton export
bun run bench -- --project projects/compilers/regex-engine     # benchmark, from the repository root
```

## Acceptance criteria

| Item | Criterion | Where it is checked |
| --- | --- | --- |
| MP-COMP-4.1 | tests cover precedence and invalid patterns | `go/regex/parser_test.go` |
| MP-COMP-4.2 | matches agree with Go's `regexp` on 1,000 generated cases | `TestAgreesWithStandardLibraryOn1000GeneratedCases` in `go/regex/engine_test.go` |
| MP-COMP-4.3 | automaton export, and the engine stays linear where backtracking is exponential, shown in a table | `go/regex/dot.go`, `go/regex/pathological_test.go`, the table in the README and `results/results.md` |

## Related quiz topics

- `compilers` / `lexical-analysis`
