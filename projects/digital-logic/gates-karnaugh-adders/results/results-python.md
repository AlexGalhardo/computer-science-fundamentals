# gates-karnaugh-adders: demo output (Python)

## 1. A truth table is a handful of integers

Each signal is one integer whose bit r is the value in row r (row 0 on the left):

```text
A           00001111   = 240
B           00110011   = 204
C           01010101   = 170
1           11111111   = 255
A & B | ~C  10101011   = 213
```

`A & B | ~C` is 1 for minterms [0, 2, 4, 6, 7].

## 2. Minimisation by Quine-McCluskey

| Function | Prime implicants | Essential | Minimal sum of products | Literals |
| --- | ---: | ---: | --- | ---: |
| Σm(0, 2, 4, 5, 6) | 2 | 2 | `A & ~B \| ~C` | 3 |
| Σm(1, 3, 7) + d(5) | 1 | 1 | `C` | 1 |
| Σm(1, 2, 4, 7) | 4 | 4 | `~A & ~B & C \| ~A & B & ~C \| A & ~B & ~C \| A & B & C` | 12 |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | 2 | 2 | `~B & ~D \| B & D` | 4 |
| Σm(0, 1, 2, 5, 8, 9, 10) | 3 | 3 | `~A & ~C & D \| ~B & ~C \| ~B & ~D` | 7 |
| Σm(1, 3, 5, 7, 9) + d(10, 11, 12, 13, 14, 15) | 3 | 1 | `D` | 1 |

## 3. All 65,536 additions in one pass

The 8-bit ripple-carry adder ran once, on 16 input columns of 65,536 bits each:
8 full adders of 5 gates, 40 gate operations for every input pair together.

It agrees with native addition for 65536 of 65536 input pairs.
