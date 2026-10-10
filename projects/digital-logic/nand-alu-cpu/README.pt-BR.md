# nand-alu-cpu

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Mini-projeto MP-DL-2. Ele ensina **como um computador é construído a partir de uma única porta**. A única primitiva do código é `nand(a, b)`. Dela saem NOT, AND, OR e XOR, depois um multiplexador e um somador completo, depois uma ALU com flags, depois a memória (latch, flip-flop, registrador) e, por fim, uma CPU de 4 bits que executa um programa que multiplica dois números.

Explicação completa: [docs/pt/digital-logic/nand-alu-cpu.md](../../../docs/pt/digital-logic/nand-alu-cpu.md).

## Tópicos do quiz que ele demonstra

- `digital-logic` / `logic-gates`: a NAND como porta universal, NOT a partir de uma NAND, XOR em 4 NANDs, XOR como inversor controlado.
- `digital-logic` / `binary-codes`: complemento de 2, o bit de sinal.
- `digital-logic` / `arithmetic-circuits`: subtração com somador (inverter e vai-um de entrada 1), estouro, o vai-um de saída como "sem empréstimo".
- `digital-logic` / `mux-demux-encoders-decoders`: multiplexador, árvore de multiplexadores, decodificador, função selecionada por multiplexador.
- `digital-logic` / `latches-flip-flops`: latch SR feito de NANDs, latch D, flip-flop D disparado por borda.
- `digital-logic` / `registers-counters`: registrador com entrada de carga, o contador de programa como um contador que dá a volta.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-nand-alu-cpu.sh        # Linux e macOS
./setup-windows-nand-alu-cpu.ps1    # Windows
```

O script constrói as duas imagens, roda todos os testes e depois as duas demos.

## Estrutura

| Caminho | O que contém |
| --- | --- |
| `ts/src/nand.ts`, `go/nand.go` | A primitiva NAND com um contador de avaliações, e todas as portas derivadas dela |
| `ts/src/alu.ts`, `go/alu.go` | Somador completo em 9 NANDs, a ALU de 4 bits (ADD, SUB, AND, OR) com as flags Z, N, C, V |
| `ts/src/memory.ts`, `go/memory.go` | Latch SR, latch D, flip-flop D mestre-escravo, registrador |
| `ts/src/assembler.ts`, `go/assembler.go` | O conjunto de instruções e um montador de duas passadas |
| `ts/src/cpu.ts`, `go/cpu.go` | Busca, decodificação, execução e a borda do clock; a impressão do trace |
| `programs/multiply.asm` | O programa versionado, compartilhado pelas duas implementações |
| `results/trace.txt` | O trace versionado, que os testes das duas linguagens precisam reproduzir byte a byte |

TypeScript é a implementação de referência. A versão em Go segue o mesmo projeto com o que o Go muda: uma palavra é um array de tamanho fixo (`Nibble` é `[4]Bit`), então um feixe de fios com a largura errada não compila, um latch precisa de construtor porque o seu valor zero (Q = Q' = 0) é um estado que nenhum latch real mantém, e os erros são retornados em vez de lançados. As duas versões gastam exatamente o mesmo número de avaliações de NAND.

## A máquina

| Parte | Tamanho | Feita de |
| --- | --- | --- |
| Contador de programa PC, acumulador A, saída OUT | 4 bits cada | flip-flops D |
| Flags Z (zero) e C (vai-um) | 1 bit cada | flip-flops D |
| RAM | 16 células de 4 bits | flip-flops D, um decodificador para escrever, uma árvore de multiplexadores para ler |
| ROM | 16 instruções de 8 bits | fios constantes lidos por uma árvore de multiplexadores |
| ALU | 4 bits | 4 somadores completos, XOR, AND, OR e multiplexadores |

Uma instrução é um byte: opcode no nibble alto, operando no nibble baixo.

| Opcode | Instrução | Efeito |
| --- | --- | --- |
| 0 | `NOP` | nada |
| 1 | `LDI n` | A ← n |
| 2 | `LDA m` | A ← RAM[m] |
| 3 | `STA m` | RAM[m] ← A |
| 4, 5 | `ADD m`, `SUB m` | A ← A ± RAM[m] |
| 6, 7 | `AND m`, `OR m` | A ← A and/or RAM[m] |
| 8, 9 | `ADDI n`, `SUBI n` | A ← A ± n |
| A | `JMP n` | PC ← n |
| B, C | `JZ n`, `JC n` | PC ← n quando a flag Z (ou C) vale 1 |
| D | `OUT` | OUT ← A |
| F | `HLT` | para |

Toda instrução que escreve em A também escreve nas flags Z e C.

## O programa e o seu trace

[`programs/multiply.asm`](programs/multiply.asm) multiplica por somas repetidas: a célula 0 guarda x = 3, a célula 1 guarda o contador y = 4 e a célula 2 guarda o produto.

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

Cada linha do trace é o estado **depois** de uma instrução: `pc` é o endereço da instrução que rodou, `A` é o acumulador em binário e em decimal, `Z C` são as flags, `m0 m1 m2` são as células de memória 0 a 2 e `out` é o registrador de saída. Este é o [`results/trace.txt`](results/trace.txt):

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

3 × 4 = 12 em 41 instruções e 122.601 avaliações de NAND, cerca de 2.990 por ciclo de clock. Vale procurar no trace: `SUBI 1` deixa C = 1, porque uma subtração sem empréstimo produz vai-um de saída; no passo 9, carregar o produto 0 liga Z, porque as flags sempre descrevem o último valor escrito em A; no passo 38 o contador vale 0, Z vale 1 e o salto sai do laço.

## Testes

```sh
docker compose run --rm go-test    # gofmt, go vet, golangci-lint e depois go test
docker compose run --rm ts-test    # bun test
```

| Critério de aceite | Teste |
| --- | --- |
| As portas derivadas coincidem com as suas tabelas-verdade | `ts/tests/nand.test.ts`, `go/nand_test.go` |
| ALU: teste exaustivo sobre todas as entradas de 4 bits e operações (1.024 casos, resultado e quatro flags) | `ts/tests/alu.test.ts`, `go/alu_test.go` |
| Um programa versionado multiplica dois números e o trace está no README | `ts/tests/cpu.test.ts`, `go/cpu_test.go`: o trace precisa ser igual a `results/trace.txt`, e o mesmo programa é conferido para os 256 pares de números de 4 bits (produto módulo 16) |

O lint e os tipos do código TypeScript rodam a partir da raiz do repositório: `bunx biome check projects/digital-logic/nand-alu-cpu` e `bunx tsc --noEmit -p projects/digital-logic/nand-alu-cpu/ts`.

## Demo

```sh
docker compose run --rm ts-demo    # portas e o seu custo em NANDs, amostras da ALU, o trace da CPU
docker compose run --rm go-demo    # o trace da CPU
```

As duas regravam `results/trace.txt` com os mesmos bytes. Não há dependências além das imagens fixadas (`oven/bun:1.4.2`, `golang:1.27.1-bookworm` e `golangci/golangci-lint:v2.14.0`).

## Limites do modelo

A simulação é lógica, não elétrica: as portas não têm atraso, então não há glitches, violações de setup ou hold, nem metaestabilidade. O clock e o conteúdo da ROM são dados, não construídos. O acumulador de 4 bits guarda de 0 a 15, então o produto dá a volta módulo 16.
