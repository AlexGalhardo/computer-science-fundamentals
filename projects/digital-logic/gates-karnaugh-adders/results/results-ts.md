# gates-karnaugh-adders: demo output (TypeScript)

## 1. From an expression to its truth table

`A·B + C'` is 1 for minterms 0, 2, 4, 6, 7:

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

`(A + B'·C)'` is 1 for minterms 0, 2, 3:

```text
A B C | F
---------
0 0 0 | 1
0 0 1 | 0
0 1 0 | 1
0 1 1 | 1
1 0 0 | 0
1 0 1 | 0
1 1 0 | 0
1 1 1 | 0
```

`A ^ B ^ C` is 1 for minterms 1, 2, 4, 7:

```text
A B C | F
---------
0 0 0 | 0
0 0 1 | 1
0 1 0 | 1
0 1 1 | 0
1 0 0 | 1
1 0 1 | 0
1 1 0 | 0
1 1 1 | 1
```

## 2. Minimisation by Quine-McCluskey

| Function | Prime implicants | Essential | Minimal sum of products | Literals |
| --- | ---: | ---: | --- | ---: |
| Σm(0, 2, 4, 5, 6) | 2 | 2 | `A·B' + C'` | 3 |
| Σm(1, 3, 7) + d(5) | 1 | 1 | `C` | 1 |
| Σm(1, 2, 4, 7) | 4 | 4 | `A'·B'·C + A'·B·C' + A·B'·C' + A·B·C` | 12 |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | 2 | 2 | `B'·D' + B·D` | 4 |
| Σm(0, 1, 2, 5, 8, 9, 10) | 3 | 3 | `A'·C'·D + B'·C' + B'·D'` | 7 |
| Σm(1, 3, 5, 7, 9) + d(10, 11, 12, 13, 14, 15) | 3 | 1 | `D` | 1 |

## 3. Adders built from gates

```text
carry out of each stage:    01111000
A = 109                     01101101
B = 58                      00111010
sum = 167, carry out = 0    10100111
```

The 8-bit ripple-carry adder agrees with native addition for 65536 of 65536 input pairs.
