# A NAND-only ALU and a 4-bit CPU

> Versão em português: [docs/pt/digital-logic/nand-alu-cpu.md](../../pt/digital-logic/nand-alu-cpu.md)

Mini-project MP-DL-2, in [`projects/digital-logic/nand-alu-cpu`](../../../projects/digital-logic/nand-alu-cpu). It teaches how a computer is built from one gate. The code has a single primitive, `nand(a, b)`, and everything else is wiring: each layer below is written only with the layer above it.

```text
NAND -> NOT, AND, OR, XOR -> multiplexer, decoder, full adder -> ALU
                          -> SR latch -> D latch -> D flip-flop -> register
ALU + registers + multiplexers + decoder -> CPU -> a program that multiplies
```

## 1. Every gate from NAND

NAND is 0 only when both inputs are 1. It is a **universal** gate: it can build NOT, AND and OR, and those three build any Boolean function.

| Gate | Construction | NANDs |
| --- | --- | ---: |
| NOT A | `NAND(A, A)`, because A·A = A | 1 |
| A AND B | `NOT(NAND(A, B))`, the two inversions cancel | 2 |
| A OR B | `NAND(NOT A, NOT B)`, De Morgan: A + B = (A'·B')' | 3 |
| A XOR B | `M = NAND(A, B)`, then `NAND(NAND(A, M), NAND(B, M))` | 4 |
| 2-to-1 multiplexer | `NAND(NAND(NOT S, I0), NAND(S, I1))` | 4 |
| Full adder | two XORs that share their inner NANDs, plus one NAND for the carry | 9 |

Translating A'·B + A·B' gate by gate would cost 9 NANDs for the XOR. Sharing the signal M brings it down to 4, which is the minimum. The same sharing makes the full adder cost 9 NANDs instead of 15. The code counts every evaluation of `nand`, and the tests check these numbers.

**Acceptance (MP-DL-2.1).** Each derived gate is compared with its truth table.

## 2. The ALU

The arithmetic and logic unit takes two 4-bit words and two control wires and produces a result and four flags.

| op1 op0 | Operation |
| --- | --- |
| 0 0 | X + Y |
| 0 1 | X − Y |
| 1 0 | X and Y |
| 1 1 | X or Y |

Three ideas are worth keeping:

- **Hardware has no `if`.** All four results are computed all the time and multiplexers pick one. The control wires only select.
- **Subtraction reuses the adder.** In two's complement, X − Y = X + Y' + 1. One XOR per bit inverts Y when the `subtract` wire is 1 (XOR with 1 inverts, XOR with 0 passes) and the same wire is the carry-in, which supplies the +1.
- **The flags are free by-products.** Z is the NOR of the result bits. N is the most significant bit. C is the carry out of the adder, and after a subtraction C = 1 means "no borrow", that is, X ≥ Y as unsigned numbers. V, the signed overflow, is the carry into the sign bit differing from the carry out of it.

```text
x     op   y     result  Z N C V
0111  ADD  0001  1000    0 1 0 1     7 + 1 = -8: overflow, with no carry-out
1111  ADD  0001  0000    1 0 1 0     -1 + 1 = 0: carry-out, with no overflow
0101  SUB  0011  0010    0 0 1 0     5 - 3 = 2, no borrow
0011  SUB  0101  1110    0 1 0 0     3 - 5 = -2, a borrow happened
```

The first two rows are the reason carry and overflow are different flags: the carry is about unsigned numbers and the overflow about signed ones.

**Acceptance (MP-DL-2.2).** All 16 × 16 × 4 = 1,024 combinations are compared with a reference written in ordinary arithmetic, result and four flags.

## 3. Memory from feedback

A combinational circuit forgets: its output depends only on its present inputs. Memory appears when an output is fed back into an input.

- **SR latch.** Two NANDs in a cross: Q = NAND(S', Q') and Q' = NAND(R', Q). The inputs are active low: S' = 0 sets, R' = 0 resets, both at 1 hold. Both at 0 force Q = Q' = 1, the forbidden combination.
- **D latch.** Two more NANDs in front make the forbidden combination impossible. While `enable` is 1 the latch is transparent and Q follows D; when it goes to 0, Q is held.
- **D flip-flop.** Two D latches in a row with opposite enables (master-slave). The value is captured at the instant the clock rises and cannot change until the next rising edge.
- **Register.** One flip-flop per bit on the same clock. A multiplexer in front of each one feeds the bit back to itself when `load` is 0, so the register keeps its word although the clock keeps ticking.

The simulator handles the feedback loop by recomputing the two gates of the latch until the outputs stop changing, which is what the real circuit does as it settles. The same waveform shows the difference between level and edge:

```text
t:          0 1 2 3 4 5 6 7 8 9
clock:      0 0 1 1 1 0 0 1 1 0
D:          1 0 0 1 1 0 1 1 0 0
D latch:    0 0 0 1 1 1 1 1 0 0     follows D while the clock is 1
flip-flop:  0 0 0 0 0 0 0 1 1 1     looks at D only when the clock rises
```

## 4. The CPU

An accumulator machine: one working register A, a program counter PC, two flags Z and C, an output register, 16 memory cells of 4 bits and a ROM of 16 instructions. An instruction is one byte, the opcode in the high nibble and the operand in the low nibble. The instruction table is in the [README](../../../projects/digital-logic/nand-alu-cpu/README.md).

One clock cycle has two halves.

1. **The combinational part settles.**
   - *Fetch*: the PC is the select input of a 16-to-1 multiplexer tree over the ROM.
   - *Decode*: a 4-to-16 decoder turns the opcode into one active line. Each control signal is an OR of lines, for example `loadA = LDI + LDA + ADD + SUB + AND + OR + ADDI + SUBI`.
   - *Execute*: multiplexers choose the ALU inputs (A or zero, a memory cell or the operand) and the ALU computes. A load is computed as "0 + operand", so every write to A goes through the ALU and refreshes the flags.
   - *Next PC*: a multiplexer chooses PC + 1 or the jump target. `JZ` and `JC` are an AND of the instruction line with the flag.
2. **The clock rises** and every register captures its input at the same edge. All inputs were computed from the old values, which is why a synchronous design is predictable.

What is not built from NAND: the clock itself and the contents of the ROM, which are constant wires.

## 5. The program

The CPU has no multiply instruction. [`programs/multiply.asm`](../../../projects/digital-logic/nand-alu-cpu/programs/multiply.asm) builds one out of addition and a loop: it adds x to the product y times, counting y down to zero and leaving the loop with `JZ`. The first and the last iteration of 3 × 4, from the committed trace:

```text
step  pc  instr    A     dec  Z C  m0  m1  m2  out
   5   4  LDA 1    0100    4  0 0   3   4   0    0
   6   5  JZ 12    0100    4  0 0   3   4   0    0
   7   6  SUBI 1   0011    3  0 1   3   4   0    0
   8   7  STA 1    0011    3  0 1   3   3   0    0
   9   8  LDA 2    0000    0  1 0   3   3   0    0
  10   9  ADD 0    0011    3  0 0   3   3   0    0
  11  10  STA 2    0011    3  0 0   3   3   3    0
  12  11  JMP 4    0011    3  0 0   3   3   3    0
 ...
  37   4  LDA 1    0000    0  1 0   3   0  12    0
  38   5  JZ 12    0000    0  1 0   3   0  12    0
  39  12  LDA 2    1100   12  0 0   3   0  12    0
  40  13  OUT      1100   12  0 0   3   0  12   12
  41  14  HLT      1100   12  0 0   3   0  12   12
```

The whole run takes 41 instructions and 122,601 NAND evaluations, about 2,990 per clock cycle. Most of them are spent on the 64 memory flip-flops, which is a fair picture of real chips: memory dominates the gate count.

**Acceptance (MP-DL-2.3).** The trace is committed in `results/trace.txt` and printed in both READMEs. The tests of both languages must reproduce that file byte for byte, and they also run the same program for all 256 pairs of 4-bit numbers, checking the product modulo 16.

## Why there is a Go version

TypeScript is the reference. Go changes three things in how the same circuit is written:

- **Width is a type.** A word is `Nibble`, a `[4]Bit` array. Connecting a bundle of the wrong width is a compile error, where the TypeScript version checks the length at run time.
- **The zero value matters.** A struct of zeros would be a latch with Q = Q' = 0, a state no real latch holds, and the first update would wake it up as 1. So latches, flip-flops and registers have constructors that start them in the reset state.
- **Errors are values.** The assembler and the CPU return errors instead of throwing.

The two implementations are tied together by the shared `results/trace.txt`: each test suite compares its own trace with that file, so they are proven to agree instruction by instruction. They also spend the same number of NAND evaluations.

## Limits of the model

The simulation is logical, not electrical. Gates have no delay, so there are no glitches, no setup or hold violations and no metastability. A real design also needs a reset circuit; here every register simply starts cleared.

## Running it

```sh
./setup-unix-nand-alu-cpu.sh        # Linux and macOS
./setup-windows-nand-alu-cpu.ps1    # Windows
```

The script needs only Docker. It builds the images, runs the tests of both languages and then the demos.

## Quiz topics

`logic-gates`, `binary-codes`, `arithmetic-circuits`, `mux-demux-encoders-decoders`, `latches-flip-flops` and `registers-counters`, in the `digital-logic` area. The previous mini-project, [gates-karnaugh-adders](gates-karnaugh-adders.md), covers truth tables, minimisation and the ripple-carry adder.
