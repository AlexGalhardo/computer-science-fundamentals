# Bytecode virtual machine

> Versão em português: [docs/pt/compilers/bytecode-vm.md](../../pt/compilers/bytecode-vm.md) · Versión en español: [docs/es/compilers/bytecode-vm.md](../../es/compilers/bytecode-vm.md)

Mini-project MP-COMP-3, in [`projects/compilers/bytecode-vm`](../../../projects/compilers/bytecode-vm). It teaches why bytecode runs faster than walking a tree. The language is the one of [MP-COMP-1](mini-language-parser.md), and the behaviour to match is the one of [MP-COMP-2](tree-walking-interpreter.md).

## From a tree to a line

The tree-walking interpreter runs the tree directly. This project adds one stage between the tree and the execution:

```text
source text -> tokens -> tree -> bytecode -> virtual machine
```

Bytecode is the program written for an imaginary, very simple machine. The machine here is a **stack machine**: instructions do not name their operands, they take them from a stack and leave the result there.

```text
1 + 2 * 3        CONSTANT 1     stack: 1
                 CONSTANT 2     stack: 1 2
                 CONSTANT 3     stack: 1 2 3
                 MULTIPLY       stack: 1 6
                 ADD            stack: 7
```

The compiler produces this by visiting the tree in post-order: operands first, operator last. That is the tree written in postfix notation, and precedence is already settled by the order of the instructions.

## What the compiler decides ahead of time

The interpreter of MP-COMP-2 repeats some decisions every time a node runs. The compiler takes them once.

| Question | Tree-walking interpreter, at run time | Compiler, before the program runs |
| --- | --- | --- |
| Which variable is `x`? | search the name through a chain of hash tables | a slot number: `GET_LOCAL 2`, `GET_GLOBAL 0`, `GET_UPVALUE 1` |
| What runs after an `if`? | recursion returns through the nested calls | a jump to a known instruction index |
| What kind of node is this? | a `switch` on a node object reached through a pointer | the next element of a flat array |
| Where does a block keep its variables? | a new environment object per block and per call | positions on the one value stack |

## Jumps and backpatching

`if` and `while` become jumps:

```text
if c { A } else { B }        c, JUMP_IF_FALSE else, A, JUMP end, else: B, end:
while c { A }                start: c, JUMP_IF_FALSE exit, A, JUMP start, exit:
```

When the compiler emits a forward jump, the code it jumps over does not exist yet, so the target is unknown. It emits the jump with a placeholder, compiles the branch, and comes back to fill the target in. This is **backpatching**. A backward jump (the end of a loop) needs none, because its target was already emitted.

## Calls and frames

All values live on one stack. A call does not copy its arguments: they are already on top of the stack, so the new call just declares that its slots start there.

```text
stack:  ... | <fn area> | 3 | 4 | result |
                          ^ base of the call: slot 0 = width, slot 1 = height, slot 2 = result
```

What the machine saves about the caller (its function, its next instruction, its base) is a **frame**: the activation record of the language in three fields. `RETURN` cuts the stack back to where the call started, pushes the result and restores the caller.

## Closures: upvalues

Locals on a stack die when their function returns, but a closure may still need them. The compiler knows, for each function, which outer variables it uses, and records them as **upvalues**. At run time an upvalue starts *open*, pointing at the stack slot of the variable. When that slot is about to disappear (`CLOSE_UPVALUE` at the end of a block, or a return), the value is moved into the upvalue, which becomes *closed*. Closures that captured the same variable share one upvalue, so they keep seeing each other's assignments. Variables nobody captures never pay for this.

## The dispatch loop

`rust/src/vm.rs` is a loop: fetch the instruction at `ip`, advance `ip`, execute it. Control flow is an assignment to `ip`. Each instruction is a small fixed-size value in a contiguous array (a Rust enum of 8 bytes here, where production virtual machines pack variable-length bytes), which the processor's cache and branch predictor handle far better than objects scattered in memory.

## Agreement with the interpreter

The example suite of MP-COMP-2 is the specification: `rust/tests/examples.rs` runs every `examples/*.mini` and compares the output with the `.out` file produced by the interpreter. The run-time errors have the same text, line and column, because the compiler stores the source position of every instruction next to it.

One difference is deliberate and instructive. The compiler resolves a name when it compiles the function, and the interpreter looks it up when the function runs. They disagree only on a function that uses a block-level variable declared *after* the function in the same block:

```text
{
	fn peek() { return late; }
	let late = 1;
	print peek();
}
```

The interpreter finds `late` in the block at call time and prints `1`. The compiler has not seen a local `late` when it compiles `peek`, treats the name as a global, and the machine reports `undefined variable 'late'`. At the top level both agree, because globals are looked up late in both. Real languages pick one rule and document it.

## Benchmark

`bun run bench -- --project projects/compilers/bytecode-vm` runs `bench/loop.mini` and `bench/recursion.mini` on both implementations and writes `results/`. In the committed run the virtual machine was about 2 times faster on the loop and 3 to 5 times faster on the recursive function, with about 2 MiB of memory against 58 to 98 MiB.

Read the result with care. The comparison mixes two differences: the technique, and the implementation language (Rust against TypeScript on Bun, whose JIT compiles the interpreter itself to machine code). The recursive program shows the technique best, because a call is where a tree-walker does the most extra work: it allocates an environment and resolves every name by searching. The table, the machine and the exact commands are in `results/results.md`.

## Running it

```sh
./setup-unix-bytecode-vm.sh                                       # build, format check, lint, tests
docker compose run --rm vm disasm ../examples/closures.mini       # print the bytecode of a program
docker compose run --rm vm run ../examples/closures.mini          # run a program
bun run bench -- --project projects/compilers/bytecode-vm         # benchmark, from the repository root
```

## Acceptance criteria

| Item | Criterion | Where it is checked |
| --- | --- | --- |
| MP-COMP-3.1 | a disassembler prints readable bytecode, checked by snapshot tests | `rust/tests/disassembler.rs`, `rust/tests/snapshots/` |
| MP-COMP-3.2 | the example programs of MP-COMP-2 give the same output | `rust/tests/examples.rs` against `examples/*.out` |
| MP-COMP-3.3 | table for a loop and a recursive function, with machine and versions recorded | `results/results.md` |

## Related quiz topics

- `compilers` / `compiler-structure`
- `compilers` / `intermediate-code-generation`
- `compilers` / `code-generation`
- `compilers` / `run-time-environments`
- `compilers` / `interpreters-vms-jit`
