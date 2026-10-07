# nand-alu-cpu

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Mini-project MP-DL-2. It teaches **how a computer is built from one gate**. The only primitive in the code is `nand(a, b)`. From it come NOT, AND, OR and XOR, then a multiplexer and a full adder, then an ALU with flags, then memory (latch, flip-flop, register), and finally a 4-bit CPU that runs a program which multiplies two numbers.

Full explanation: [docs/en/digital-logic/nand-alu-cpu.md](../../../docs/en/digital-logic/nand-alu-cpu.md).

## Quiz topics it demonstrates

- `digital-logic` / `logic-gates`: NAND as a universal gate, NOT from a NAND, XOR in 4 NANDs, XOR as a controlled inverter.
- `digital-logic` / `binary-codes`: two's complement, the sign bit.
- `digital-logic` / `arithmetic-circuits`: subtraction with an adder (invert and carry-in 1), overflow, the carry-out as "no borrow".
- `digital-logic` / `mux-demux-encoders-decoders`: multiplexer, multiplexer tree, decoder, a function selected by a multiplexer.
- `digital-logic` / `latches-flip-flops`: SR latch made of NANDs, D latch, edge-triggered D flip-flop.
- `digital-logic` / `registers-counters`: register with a load input, the program counter as a counter that wraps.

## Run

The only requirement is Docker.

```sh
./setup-unix-nand-alu-cpu.sh        # Linux and macOS
./setup-windows-nand-alu-cpu.ps1    # Windows
```

The script builds the two images, runs every test and then the two demos.

## Structure

| Path | What it holds |
| --- | --- |
| `ts/src/nand.ts`, `go/nand.go` | The NAND primitive with an evaluation counter, and every gate derived from it |
| `ts/src/alu.ts`, `go/alu.go` | Full adder in 9 NANDs, the 4-bit ALU (ADD, SUB, AND, OR) with flags Z, N, C, V |
| `ts/src/memory.ts`, `go/memory.go` | SR latch, D latch, master-slave D flip-flop, register |
| `ts/src/assembler.ts`, `go/assembler.go` | The instruction set and a two-pass assembler |
| `ts/src/cpu.ts`, `go/cpu.go` | Fetch, decode, execute and the clock edge; the trace printer |
| `programs/multiply.asm` | The committed program, shared by both implementations |
| `results/trace.txt` | The committed trace, which the tests of both languages must reproduce byte for byte |

TypeScript is the reference implementation. The Go version follows the same design with what Go changes: a word is a fixed-size array (`Nibble` is `[4]Bit`), so a bundle of wires of the wrong width does not compile, a latch needs a constructor because its zero value (Q = Q' = 0) is a state no real latch holds, and errors are returned instead of thrown. Both versions spend exactly the same number of NAND evaluations.

## The machine

| Part | Size | Built from |
| --- | --- | --- |
| Program counter PC, accumulator A, output OUT | 4 bits each | D flip-flops |
| Flags Z (zero) and C (carry) | 1 bit each | D flip-flops |
| RAM | 16 cells of 4 bits | D flip-flops, a decoder to write, a multiplexer tree to read |
| ROM | 16 instructions of 8 bits | constant wires read by a multiplexer tree |
| ALU | 4 bits | 4 full adders, XOR, AND, OR and multiplexers |

An instruction is one byte: opcode in the high nibble, operand in the low nibble.

| Opcode | Instruction | Effect |
| --- | --- | --- |
| 0 | `NOP` | nothing |
| 1 | `LDI n` | A ← n |
| 2 | `LDA m` | A ← RAM[m] |
| 3 | `STA m` | RAM[m] ← A |
| 4, 5 | `ADD m`, `SUB m` | A ← A ± RAM[m] |
| 6, 7 | `AND m`, `OR m` | A ← A and/or RAM[m] |
| 8, 9 | `ADDI n`, `SUBI n` | A ← A ± n |
| A | `JMP n` | PC ← n |
| B, C | `JZ n`, `JC n` | PC ← n when flag Z (or C) is 1 |
| D | `OUT` | OUT ← A |
| F | `HLT` | stop |

Every instruction that writes A also writes the flags Z and C.

## The program and its trace

[`programs/multiply.asm`](programs/multiply.asm) multiplies by repeated addition: cell 0 holds x = 3, cell 1 holds the counter y = 4, cell 2 holds the product.

```asm
        LDI 3       ; x = 3
        STA 0
        LDI 4       ; y = 4
        STA 1
loop:   LDA 1       ; A = counter, and the Z flag says whether it reached 0
        JZ done
        SUBI 1      ; counter = counter - 1
        STA 1
        LDA 2       ; product = product + x
        ADD 0
        STA 2
        JMP loop
done:   LDA 2
        OUT         ; show the product
        HLT
```

Each line of the trace is the state **after** one instruction: `pc` is the address of the instruction that ran, `A` is the accumulator in binary and in decimal, `Z C` are the flags, `m0 m1 m2` are memory cells 0 to 2 and `out` is the output register. This is [`results/trace.txt`](results/trace.txt):

```text
step  pc  instr    A     dec  Z C  m0  m1  m2  out
   1   0  LDI 3    0011    3  0 0   0   0   0    0
   2   1  STA 0    0011    3  0 0   3   0   0    0
   3   2  LDI 4    0100    4  0 0   3   0   0    0
   4   3  STA 1    0100    4  0 0   3   4   0    0
   5   4  LDA 1    0100    4  0 0   3   4   0    0
   6   5  JZ 12    0100    4  0 0   3   4   0    0
   7   6  SUBI 1   0011    3  0 1   3   4   0    0
   8   7  STA 1    0011    3  0 1   3   3   0    0
   9   8  LDA 2    0000    0  1 0   3   3   0    0
  10   9  ADD 0    0011    3  0 0   3   3   0    0
  11  10  STA 2    0011    3  0 0   3   3   3    0
  12  11  JMP 4    0011    3  0 0   3   3   3    0
  13   4  LDA 1    0011    3  0 0   3   3   3    0
  14   5  JZ 12    0011    3  0 0   3   3   3    0
  15   6  SUBI 1   0010    2  0 1   3   3   3    0
  16   7  STA 1    0010    2  0 1   3   2   3    0
  17   8  LDA 2    0011    3  0 0   3   2   3    0
  18   9  ADD 0    0110    6  0 0   3   2   3    0
  19  10  STA 2    0110    6  0 0   3   2   6    0
  20  11  JMP 4    0110    6  0 0   3   2   6    0
  21   4  LDA 1    0010    2  0 0   3   2   6    0
  22   5  JZ 12    0010    2  0 0   3   2   6    0
  23   6  SUBI 1   0001    1  0 1   3   2   6    0
  24   7  STA 1    0001    1  0 1   3   1   6    0
  25   8  LDA 2    0110    6  0 0   3   1   6    0
  26   9  ADD 0    1001    9  0 0   3   1   6    0
  27  10  STA 2    1001    9  0 0   3   1   9    0
  28  11  JMP 4    1001    9  0 0   3   1   9    0
  29   4  LDA 1    0001    1  0 0   3   1   9    0
  30   5  JZ 12    0001    1  0 0   3   1   9    0
  31   6  SUBI 1   0000    0  1 1   3   1   9    0
  32   7  STA 1    0000    0  1 1   3   0   9    0
  33   8  LDA 2    1001    9  0 0   3   0   9    0
  34   9  ADD 0    1100   12  0 0   3   0   9    0
  35  10  STA 2    1100   12  0 0   3   0  12    0
  36  11  JMP 4    1100   12  0 0   3   0  12    0
  37   4  LDA 1    0000    0  1 0   3   0  12    0
  38   5  JZ 12    0000    0  1 0   3   0  12    0
  39  12  LDA 2    1100   12  0 0   3   0  12    0
  40  13  OUT      1100   12  0 0   3   0  12   12
  41  14  HLT      1100   12  0 0   3   0  12   12
```

3 × 4 = 12 in 41 instructions and 122,601 NAND evaluations, about 2,990 per clock cycle. Things worth finding in it: `SUBI 1` leaves C = 1, because a subtraction with no borrow produces a carry-out; at step 9, loading the product 0 raises Z, because the flags always describe the last value written to A; at step 38 the counter is 0, Z is 1 and the jump leaves the loop.

## Tests

```sh
docker compose run --rm go-test    # gofmt, go vet, golangci-lint, then go test
docker compose run --rm ts-test    # bun test
```

| Acceptance criterion | Test |
| --- | --- |
| Derived gates match their truth tables | `ts/tests/nand.test.ts`, `go/nand_test.go` |
| ALU: exhaustive test over all 4-bit inputs and operations (1,024 cases, result and four flags) | `ts/tests/alu.test.ts`, `go/alu_test.go` |
| A committed program multiplies two numbers and the trace is in the README | `ts/tests/cpu.test.ts`, `go/cpu_test.go`: the trace must equal `results/trace.txt`, and the same program is checked for all 256 pairs of 4-bit numbers (product modulo 16) |

Lint and types of the TypeScript code run from the repository root: `bunx biome check projects/digital-logic/nand-alu-cpu` and `bunx tsc --noEmit -p projects/digital-logic/nand-alu-cpu/ts`.

## Demo

```sh
docker compose run --rm ts-demo    # gates and their NAND cost, ALU samples, the CPU trace
docker compose run --rm go-demo    # the CPU trace
```

Both rewrite `results/trace.txt` with the same bytes. There are no dependencies beyond the pinned images (`oven/bun:1.4.2`, `golang:1.27.1-bookworm` and `golangci/golangci-lint:v2.14.0`).

## Limits of the model

The simulation is logical, not electrical: gates have no delay, so there are no glitches, no setup or hold violations and no metastability. The clock and the contents of the ROM are given, not built. The 4-bit accumulator holds 0 to 15, so the product wraps modulo 16.
