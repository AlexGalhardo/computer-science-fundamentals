# bytecode-vm

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A compiler from the syntax tree of the mini language to stack bytecode, and the virtual machine that runs it, in Rust. It teaches **why bytecode runs faster than walking a tree**: the compiler decides ahead of time what the tree-walking interpreter decides again on every visit (which variable a name means, where control goes next), so the machine is left with a flat array of small instructions and a stack.

This is the third step of the compiler track. The language comes from [mini-language-parser](../mini-language-parser) (MP-COMP-1) and the reference behaviour from [tree-walking-interpreter](../tree-walking-interpreter) (MP-COMP-2).

Full explanation: [docs/en/compilers/bytecode-vm.md](../../../docs/en/compilers/bytecode-vm.md).

## Quiz topics it demonstrates

- `compilers` / `compiler-structure`: translating a tree to postfix code for a stack machine.
- `compilers` / `intermediate-code-generation`: control flow as jumps, backpatching of forward jumps.
- `compilers` / `code-generation`: code for a stack machine.
- `compilers` / `run-time-environments`: call frames on a stack, variables that outlive their call.
- `compilers` / `interpreters-vms-jit`: bytecode, the dispatch loop, bytecode against tree walking.

## Run

The only requirement is Docker.

```sh
./setup-unix-bytecode-vm.sh        # Linux and macOS
./setup-windows-bytecode-vm.ps1    # Windows
```

The script builds the image and runs the formatter check, the linter and the tests. Then:

```sh
docker compose run --rm vm disasm ../examples/closures.mini    # print the bytecode
docker compose run --rm vm run ../examples/closures.mini       # run the program
```

## Structure

| Path | What it is |
| --- | --- |
| `rust/src/lexer.rs`, `parser.rs`, `ast.rs` | the front end of MP-COMP-1, ported to Rust (same grammar, same precedence table) |
| `rust/src/compiler.rs` | tree to bytecode: slot resolution, jumps and backpatching, closures |
| `rust/src/chunk.rs` | the instruction set, the compiled chunk and the disassembler |
| `rust/src/vm.rs` | the stack machine: dispatch loop, call frames, upvalues |
| `rust/src/value.rs` | run-time values, compiled functions, closures |
| `rust/tests/snapshots/` | programs and the bytecode listing each must compile to |
| `examples/` | the example programs and expected outputs of MP-COMP-2 |
| `bench/` | the two benchmark programs, run by both implementations |
| `baseline-ts/` | the tree-walking interpreter of MP-COMP-2, used only as the benchmark baseline |
| `results/` | committed benchmark results |

Rust on the pinned image `rust:1.99.0-slim-trixie`, with no dependency.

**One language definition, copied.** A mini-project must build on its own, so nothing is imported across mini-projects. `examples/` (programs and expected outputs) and `baseline-ts/src/` are copies of the files in `tree-walking-interpreter`. The Rust front end is a port of the TypeScript one, and the example suite is what keeps the two in agreement. It stops at the first syntax error: reporting several is the lesson of MP-COMP-1.

## The bytecode

```sh
docker compose run --rm vm disasm ../rust/tests/snapshots/control-flow.mini
```

```text
== script ==
0000    1  CONSTANT                0  ; 0
0001    |  DEFINE_GLOBAL           0  ; i
0002    2  GET_GLOBAL              0  ; i
0003    |  CONSTANT                1  ; 3
0004    |  LESS
0005    |  JUMP_IF_FALSE          23  ; -> 0023
0006    3  GET_GLOBAL              0  ; i
0007    |  CONSTANT                2  ; 2
0008    |  MODULO
...
0022    |  JUMP                    2  ; -> 0002
0023    |  NIL
0024    |  RETURN
```

Each line is the index of the instruction, its source line (`|` when unchanged), its name, its operand, and what the operand refers to. `i < 3` is "push `i`, push `3`, `LESS`": operands first, operator last. The `while` is two jumps.

## Tests

```sh
docker compose run --rm rust-test
```

- **Snapshot tests** (`rust/tests/disassembler.rs`): four programs must compile to the committed listings in `rust/tests/snapshots/`.
- **Example suite** (`rust/tests/examples.rs`): every program of MP-COMP-2 must print exactly its `.out` file.
- Closures (shared, nested, one per loop iteration), `return` from nested blocks, short-circuit, and the same run-time errors as the interpreter, with the same line and column.

## Benchmark

```sh
bun run bench -- --project projects/compilers/bytecode-vm    # from the repository root
```

The two programs in `bench/` run on this virtual machine (`rust`) and on the tree-walking interpreter (`ts`). `loop` adds `i % 7` for `n` iterations. `recursion` calls a function about `2n` times. Both implementations print the same checksum. Measured section, in milliseconds, from [`results/results.md`](results/results.md) (machine, versions and commands are recorded there):

| Program | n | Tree walking (TypeScript on Bun) | Bytecode (Rust) | Ratio |
| --- | ---: | ---: | ---: | ---: |
| `loop` | 100,000 | 36.0 | 17.9 | 2.0× |
| `loop` | 1,000,000 | 376 | 194 | 1.9× |
| `recursion` | 100,000 | 64.5 | 19.6 | 3.3× |
| `recursion` | 1,000,000 | 672 | 136 | 4.9× |

Peak memory was about 2 MiB for the virtual machine and 58 to 98 MiB for the interpreter on Bun.

How to read it: the two rows differ in technique **and** in language, and Bun compiles the interpreter itself to machine code with its JIT, which narrows the gap on the simple loop. The larger gap in `recursion` is where the techniques differ most: a call in the tree-walker allocates an environment (a hash table) and searches names through a chain of them, and a call in the virtual machine only moves the base of a stack window. The numbers depend on the machine, and the runs were noisy, so compare the orders of magnitude and not the decimals.
