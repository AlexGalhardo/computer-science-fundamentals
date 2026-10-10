# tree-walking-interpreter

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

An interpreter that runs the mini language by walking its syntax tree. It teaches **how a tree is executed**: an environment per scope, static scope as a chain of environments, functions as closures that remember where they were created, and run-time errors that point at a line and a column.

This is the second step of the compiler track. The language, its grammar and its front end come from [mini-language-parser](../mini-language-parser) (MP-COMP-1), and the same programs are compiled to bytecode by [bytecode-vm](../bytecode-vm) (MP-COMP-3).

Full explanation: [docs/en/compilers/tree-walking-interpreter.md](../../../docs/en/compilers/tree-walking-interpreter.md).

## Quiz topics it demonstrates

- `compilers` / `compiler-structure`: compiler against interpreter, static against dynamic scope, environments.
- `compilers` / `run-time-environments`: activations, access to non-local names, why closures need environments that outlive the call.
- `compilers` / `interpreters-vms-jit`: tree-walking interpretation and where its cost comes from.

## Run

The only requirement is Docker.

```sh
./setup-unix-tree-walking-interpreter.sh        # Linux and macOS
./setup-windows-tree-walking-interpreter.ps1    # Windows
```

The script builds the image and runs the tests. Then:

```sh
docker compose run --rm ts-repl                                           # REPL
docker compose run --rm ts-repl bun run mini ../examples/closures.mini    # run one program
```

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/interpreter.ts` | values, environments, closures and the evaluator, one case per tree node |
| `ts/src/session.ts` | parse, run and collect output and errors; keeps state between pieces of source |
| `ts/src/cli.ts` | the REPL and the one-file mode |
| `ts/src/frontend/` | lexer, parser and tree of MP-COMP-1 |
| `examples/` | the example programs (`.mini`) and the output each must print (`.out`) |

TypeScript on the pinned image `oven/bun:1.4.2`, with no dependency.

**One language definition, copied.** A mini-project must build on its own, so `ts/src/frontend/` and `examples/*.mini` are copies of the files in `mini-language-parser`, not imports. The grammar is defined there. This project adds the `examples/*.out` files, and `bytecode-vm` copies both to prove it prints the same.

## What the language does at run time

| Subject | Rule |
| --- | --- |
| Values | numbers (64-bit floating point), strings, booleans, `nil`, functions |
| Truth | only `false` and `nil` are false; `0` and `""` are true |
| `+` | two numbers, or two strings (concatenation) |
| `-` `*` `/` `%` `<` `<=` `>` `>=` | numbers only; dividing by zero is an error |
| `==` `!=` | any two values; values of different types are never equal |
| `and` `or` | short-circuit, and the result is the operand that decided |
| Scope | static: `let` and `fn` declare in the current block, inner declarations shadow outer ones |
| Functions | first-class values and closures; a function without `return` gives `nil` |
| Recursion | at most 200 nested calls, then the error `stack overflow` |

## Tests

```sh
docker compose run --rm ts-test
```

The tests run the whole example suite against the expected outputs, and cover scopes, static scope, closures, `if`, `while`, short-circuit, and the run-time errors with their line and column: undefined variable, wrong argument count, division by zero, wrong operand types, calling a non-function and unbounded recursion.

## Demo: the REPL keeps state

Every line runs in the same session, so a function defined on one line can be called on a later one. A line with a single expression also shows its value. A recorded session:

```text
mini language: type a statement and press Enter (Ctrl+D or Ctrl+C to leave)
> fn square(x) { return x * x; }
> let side = 7;
> square(side);
49
> fn makeCounter() { let n = 0; fn next() { n = n + 1; return n; } return next; }
> let counter = makeCounter();
> counter();
1
> counter();
2
> print square(counter()) + side;
16
> square(1, 2);
[line 1, column 7] runtime error: expected 1 arguments but got 2
> print side / (side - 7);
[line 1, column 12] runtime error: division by zero
> print missing;
[line 1, column 7] runtime error: undefined variable 'missing'
> side;
7
```

`square` and `side` were defined on the first two lines and are still there at the end, after three lines that failed. `counter` shows a closure at work: the variable `n` belongs to a call of `makeCounter` that has already returned, and it is still alive because `next` holds on to its environment.
