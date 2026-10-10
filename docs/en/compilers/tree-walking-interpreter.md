# Tree-walking interpreter

> Versão em português: [docs/pt/compilers/tree-walking-interpreter.md](../../pt/compilers/tree-walking-interpreter.md) · Versión en español: [docs/es/compilers/tree-walking-interpreter.md](../../es/compilers/tree-walking-interpreter.md)

Mini-project MP-COMP-2, in [`projects/compilers/tree-walking-interpreter`](../../../projects/compilers/tree-walking-interpreter). It teaches how a syntax tree is executed: environments, scopes and closures. The language is the one defined in [MP-COMP-1](mini-language-parser.md).

## Executing a tree

The parser leaves a tree. The simplest way to run it is to walk it: to execute a node, execute the children it needs and combine the results. `1 + 2 * 3` is evaluated bottom-up, `2 * 3` first because it is deeper in the tree, with no precedence rule left to apply. The evaluator in `ts/src/interpreter.ts` is one `switch` with one case per kind of node, so it has the same shape as the grammar.

Nothing is translated: the program that runs is the tree itself. That is the difference from a compiler, which would translate the tree into another program (machine code or bytecode) to be run later.

## Environments

A variable needs a place to live. An **environment** is a table from names to values for one scope, with a pointer to the environment of the enclosing scope.

```text
let x = 1;            global:   x = 1, f = <fn f>
fn f(a) {                ▲
	let y = a + x;    call f:   a = 10, y = 11
	{                    ▲
		let x = 5;    block:    x = 5
		print x + y;
	}
}
f(10);
```

- A lookup starts in the current environment and walks outwards. The first match wins, which is why the inner `x` shadows the global one.
- A block creates an environment when it starts and drops it when it ends.
- A call creates an environment for the parameters: this is the activation of the function, the job a stack frame does in compiled code.

## Static scope and closures

When `f` is called, the parent of its new environment is **the environment where `f` was defined**, not the environment of the caller. This is static (lexical) scope: which variable a name refers to can be read from the text of the program. The example `scopes.mini` shows it: `show()` prints the global `x` even when it is called from a block that has its own `x`.

To make that possible, a function value is a **closure**: the code plus the environment that was current when the `fn` statement ran.

```text
fn makeCounter() {
	let count = 0;
	fn increment() { count = count + 1; return count; }
	return increment;
}
let first = makeCounter();
```

After `makeCounter` returns, its environment would normally be garbage. But `increment` still points to it, so `count` stays alive, and each call of `makeCounter` creates a separate `count`. This is the reason environments cannot live on a plain stack in a language with closures: an activation may outlive the call that created it. Here the garbage collector of the host (JavaScript) frees them when the last closure is gone.

## Leaving early

`return` has to abandon every block and loop between it and the call. A tree-walker has no jump instruction, so `execute` returns a small completion value: `undefined` for "carry on", or `{ returned: value }`, which each enclosing statement passes upwards until the call receives it.

## Run-time errors

The lexer and the parser reject text that is not a program. Some mistakes only appear when the program runs: a name that was never declared, a call with the wrong number of arguments, a division by zero, `1 + "a"`. Every tree node carries the line and the column of its token, so the error says where:

```text
[line 2, column 10] runtime error: expected 2 arguments but got 1
```

## Why this is slow

Walking a tree costs more than the work the program asks for. Every node visit is a dispatch on the node kind, the nodes are scattered in memory, and each variable access searches the chain of environments by name in a hash table. [MP-COMP-3](bytecode-vm.md) compiles the same tree to bytecode, resolves local variables to stack slots before running, and measures the difference.

## Running it

```sh
./setup-unix-tree-walking-interpreter.sh                                  # build and test
docker compose run --rm ts-repl                                           # REPL that keeps state
docker compose run --rm ts-repl bun run mini ../examples/closures.mini    # run one program
```

## Acceptance criteria

| Item | Criterion | Where it is checked |
| --- | --- | --- |
| MP-COMP-2.1 | a suite of example programs prints the expected output | `examples/*.mini` against `examples/*.out`, in `ts/tests/interpreter.test.ts` |
| MP-COMP-2.2 | tests cover undefined variable, wrong argument count and division by zero | `ts/tests/interpreter.test.ts` |
| MP-COMP-2.3 | a recorded session defines a function and calls it later | README of the mini-project, and the REPL session test |

## Related quiz topics

- `compilers` / `compiler-structure`
- `compilers` / `run-time-environments`
- `compilers` / `interpreters-vms-jit`
