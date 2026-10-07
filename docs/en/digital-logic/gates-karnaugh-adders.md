# Logic gates, Karnaugh and adders

> Versão em português: [docs/pt/digital-logic/gates-karnaugh-adders.md](../../pt/digital-logic/gates-karnaugh-adders.md)

Mini-project MP-DL-1, in [`projects/digital-logic/gates-karnaugh-adders`](../../../projects/digital-logic/gates-karnaugh-adders). It teaches how a Boolean function becomes a circuit: from an expression to a truth table, from a truth table to the smallest expression, and from gates to a circuit that adds.

## 1. An expression is a circuit

`A·B + C'` and the drawing of an AND gate and an inverter feeding an OR gate are the same object. The parser in `ts/src/expression.ts` turns the text into a tree in which every node is a gate and every leaf is an input wire:

```text
        OR
       /  \
    AND    NOT
    / \     |
   A   B    C
```

The priorities are the usual ones: NOT binds first, then AND, then XOR, then OR. Evaluating the tree for given input values is simulating the circuit, and doing it for the 2^n combinations of the inputs, in binary counting order, gives the truth table. Row k of the table is minterm k, with the first variable as the most significant bit.

```text
A B C | F
---------
0 0 0 | 1
0 0 1 | 0
0 1 0 | 1
0 1 1 | 0
1 0 0 | 1
1 0 1 | 0
1 1 0 | 1
1 1 1 | 1
```

The truth table is also the tool that settles any question of Boolean algebra: two expressions are equivalent exactly when their output columns are equal. De Morgan's theorems, absorption and the consensus theorem are all checked this way in the tests, instead of being taken on trust.

**Acceptance.** Twenty truth tables were written by hand and the generator reproduces all of them, in both languages.

## 2. From the truth table to the smallest expression

The canonical sum of products has one term per row with output 1, which is correct and wasteful. The Karnaugh map removes the waste by eye: neighbouring cells differ in one variable, so a pair of 1 cells is a term without that variable (X·Y + X·Y' = X), a group of four loses two variables, and so on.

The Quine-McCluskey method is the same idea written as a procedure, so it works for any number of variables:

1. **Find every prime implicant.** Start from the minterms. Merge every two terms that differ in exactly one variable into a term without it, and repeat with the merged terms. A term that never merged is a group that cannot grow: a prime implicant.
2. **Choose a cover.** A prime implicant is **essential** when it is the only one that covers some minterm, so it must be in the answer. For the minterms still uncovered, `minimise` runs an exact search and keeps the cover with the fewest terms and, among those, the fewest literals.

**Don't-care terms** take part in step 1, where they help to form larger groups, but are not in the list that step 2 must cover.

| Function | Prime implicants | Essential | Minimal sum of products |
| --- | ---: | ---: | --- |
| Σm(0, 2, 4, 5, 6) | 2 | 2 | `A·B' + C'` |
| Σm(1, 3, 7) | 2 | 2 | `A'·C + B·C` |
| Σm(1, 3, 7) + d(5) | 1 | 1 | `C` |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | 2 | 2 | `B'·D' + B·D` |
| Σm(0, 1, 2, 5, 8, 9, 10) | 3 | 3 | `A'·C'·D + B'·C' + B'·D'` |
| Σm(1, 2, 4, 7) | 4 | 4 | the four minterms: nothing merges |
| Σm(0, 1, 2, 5, 6, 7) | 6 | 0 | three terms of two literals |

Three rows deserve a second look. The fourth one is the XNOR of B and D: its groups are the four corners and the four centre cells, which only exist because the map wraps around. The sixth is the chessboard pattern of A xor B xor C, where no two 1 cells are neighbours and the sum of products cannot shrink. The last one is a cyclic map: no prime implicant is essential, so choosing greedily is not enough and the exact search is what guarantees three terms.

**Acceptance.** The minimised expression is written back as text, parsed again, and its truth table is compared with the original on every row. This is done for all 256 functions of 3 variables, all 65,536 functions of 4 variables, and random functions of 5 and 6 variables. With don't-care terms, every required row must match and the don't-care rows are free.

A limit worth knowing: exact minimisation is exponential in the worst case. It is fine for the sizes of a course, and real synthesis tools use heuristics such as Espresso instead.

## 3. From gates to arithmetic

Adding two bits gives a sum bit and a carry. The table shows that the sum is XOR and the carry is AND: that is the **half adder**. To add a column in the middle of a number a third input is needed, the carry coming from the right. The **full adder** is two half adders and an OR:

```text
Sum       = A xor B xor Cin
Carry-out = A·B + Cin·(A xor B)        (1 when at least two inputs are 1)
```

Chaining n full adders, with the carry-out of each stage wired to the carry-in of the next, gives the **ripple-carry adder**:

```text
carry out of each stage:    01111000
A = 109                     01101101
B = 58                      00111010
sum = 167, carry out = 0    10100111
```

The carry line shows the cost of this design: a carry may have to travel through every stage, so the worst-case delay grows with the number of bits. `255 + 1` is the worst case, with a carry out of all eight stages.

**Acceptance.** The 8-bit adder built from gates agrees with native addition for all 65,536 input pairs, carry-out included.

## Why there is a Python version

The TypeScript code simulates one row at a time, which is how the subject is explained on paper. Python integers have no size limit, and that changes the lesson: a whole column of the truth table fits in **one integer**, where bit r is the value of the signal in row r.

```text
A           00001111   = 240
B           00110011   = 204
C           01010101   = 170
A & B | ~C  10101011   = 213
```

A gate then processes every row with a single `&`, `|` or `^`. This is bit-parallel simulation. Two details are worth noticing in `python/logic.py`: NOT is an XOR with the all-ones column, because Python's `~` would give a negative number, and no parser is written, because `ast.parse` already knows the priorities of `~`, `&`, `^` and `|`. Only the node kinds of a Boolean expression are accepted and nothing is executed with `eval`.

The adder shows the gain. The 16 inputs of the 8-bit adder become 16 columns of 65,536 bits each, and running the gate network **once**, 40 gate operations, adds every pair of bytes at the same time.

## Running it

```sh
./setup-unix-gates-karnaugh-adders.sh        # Linux and macOS
./setup-windows-gates-karnaugh-adders.ps1    # Windows
```

The script needs only Docker. It builds the images, runs the tests of both languages and then the demos, which write `results/results-ts.md` and `results/results-python.md`.

## Quiz topics

`logic-gates`, `boolean-algebra`, `karnaugh-maps` and `arithmetic-circuits`, in the `digital-logic` area. The next mini-project, [nand-alu-cpu](nand-alu-cpu.md), starts from a single gate and goes up to a small processor.
