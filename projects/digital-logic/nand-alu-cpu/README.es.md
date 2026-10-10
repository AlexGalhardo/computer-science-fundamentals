# nand-alu-cpu

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Mini-proyecto MP-DL-2. Enseña **cómo se construye un computador a partir de una sola compuerta**. La única primitiva del código es `nand(a, b)`. De ella salen NOT, AND, OR y XOR, luego un multiplexor y un sumador completo, luego una ALU con flags, luego la memoria (latch, flip-flop, registro) y, por último, una CPU de 4 bits que ejecuta un programa que multiplica dos números.

Explicación completa: [docs/es/digital-logic/nand-alu-cpu.md](../../../docs/es/digital-logic/nand-alu-cpu.md).

## Temas del quiz que demuestra

- `digital-logic` / `logic-gates`: NAND como compuerta universal, NOT a partir de una NAND, XOR en 4 NAND, XOR como inversor controlado.
- `digital-logic` / `binary-codes`: complemento a dos, el bit de signo.
- `digital-logic` / `arithmetic-circuits`: resta con un sumador (invertir y acarreo de entrada 1), desbordamiento, el acarreo de salida como "sin préstamo".
- `digital-logic` / `mux-demux-encoders-decoders`: multiplexor, árbol de multiplexores, decodificador, una función seleccionada por un multiplexor.
- `digital-logic` / `latches-flip-flops`: latch SR hecho de NAND, latch D, flip-flop D activado por flanco.
- `digital-logic` / `registers-counters`: registro con entrada de carga, el contador de programa como un contador que da la vuelta.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-nand-alu-cpu.sh        # Linux y macOS
./setup-windows-nand-alu-cpu.ps1    # Windows
```

El script construye las dos imágenes, ejecuta todas las pruebas y después las dos demos.

## Estructura

| Ruta | Qué contiene |
| --- | --- |
| `ts/src/nand.ts`, `go/nand.go` | La primitiva NAND con un contador de evaluaciones, y toda compuerta derivada de ella |
| `ts/src/alu.ts`, `go/alu.go` | Sumador completo en 9 NAND, la ALU de 4 bits (ADD, SUB, AND, OR) con flags Z, N, C, V |
| `ts/src/memory.ts`, `go/memory.go` | Latch SR, latch D, flip-flop D maestro-esclavo, registro |
| `ts/src/assembler.ts`, `go/assembler.go` | El conjunto de instrucciones y un ensamblador de dos pasadas |
| `ts/src/cpu.ts`, `go/cpu.go` | Búsqueda, decodificación, ejecución y el flanco del clock; el impresor del trace |
| `programs/multiply.asm` | El programa versionado, compartido por las dos implementaciones |
| `results/trace.txt` | El trace versionado, que las pruebas de ambos lenguajes deben reproducir byte a byte |

TypeScript es la implementación de referencia. La versión en Go sigue el mismo diseño con lo que Go cambia: una palabra es un array de tamaño fijo (`Nibble` es `[4]Bit`), así que un haz de cables con el ancho equivocado no compila, un latch necesita un constructor porque su valor cero (Q = Q' = 0) es un estado que ningún latch real mantiene, y los errores se devuelven en lugar de lanzarse. Las dos versiones gastan exactamente el mismo número de evaluaciones de NAND.

## La máquina

| Parte | Tamaño | Construida con |
| --- | --- | --- |
| Contador de programa PC, acumulador A, salida OUT | 4 bits cada uno | flip-flops D |
| Flags Z (cero) y C (acarreo) | 1 bit cada una | flip-flops D |
| RAM | 16 celdas de 4 bits | flip-flops D, un decodificador para escribir, un árbol de multiplexores para leer |
| ROM | 16 instrucciones de 8 bits | cables constantes leídos por un árbol de multiplexores |
| ALU | 4 bits | 4 sumadores completos, XOR, AND, OR y multiplexores |

Una instrucción es un byte: opcode en el nibble alto, operando en el nibble bajo.

| Opcode | Instrucción | Efecto |
| --- | --- | --- |
| 0 | `NOP` | nada |
| 1 | `LDI n` | A ← n |
| 2 | `LDA m` | A ← RAM[m] |
| 3 | `STA m` | RAM[m] ← A |
| 4, 5 | `ADD m`, `SUB m` | A ← A ± RAM[m] |
| 6, 7 | `AND m`, `OR m` | A ← A and/or RAM[m] |
| 8, 9 | `ADDI n`, `SUBI n` | A ← A ± n |
| A | `JMP n` | PC ← n |
| B, C | `JZ n`, `JC n` | PC ← n cuando la flag Z (o C) vale 1 |
| D | `OUT` | OUT ← A |
| F | `HLT` | detener |

Toda instrucción que escribe en A escribe también las flags Z y C.

## El programa y su trace

[`programs/multiply.asm`](programs/multiply.asm) multiplica por sumas repetidas: la celda 0 guarda x = 3, la celda 1 guarda el contador y = 4, la celda 2 guarda el producto.

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

Cada línea del trace es el estado **después** de una instrucción: `pc` es la dirección de la instrucción que se ejecutó, `A` es el acumulador en binario y en decimal, `Z C` son las flags, `m0 m1 m2` son las celdas de memoria 0 a 2 y `out` es el registro de salida. Este es el [`results/trace.txt`](results/trace.txt):

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

3 × 4 = 12 en 41 instrucciones y 122.601 evaluaciones de NAND, unas 2.990 por ciclo de clock. Cosas que vale la pena buscar en él: `SUBI 1` deja C = 1, porque una resta sin préstamo produce acarreo de salida; en el paso 9, cargar el producto 0 enciende Z, porque las flags siempre describen el último valor escrito en A; en el paso 38 el contador vale 0, Z vale 1 y el salto sale del bucle.

## Pruebas

```sh
docker compose run --rm go-test    # gofmt, go vet, golangci-lint, then go test
docker compose run --rm ts-test    # bun test
```

| Criterio de aceptación | Prueba |
| --- | --- |
| Las compuertas derivadas coinciden con sus tablas de verdad | `ts/tests/nand.test.ts`, `go/nand_test.go` |
| ALU: prueba exhaustiva sobre todas las entradas y operaciones de 4 bits (1.024 casos, resultado y cuatro flags) | `ts/tests/alu.test.ts`, `go/alu_test.go` |
| Un programa versionado multiplica dos números y el trace está en el README | `ts/tests/cpu.test.ts`, `go/cpu_test.go`: el trace debe ser igual a `results/trace.txt`, y el mismo programa se comprueba para los 256 pares de números de 4 bits (producto módulo 16) |

El lint y los tipos del código TypeScript se ejecutan desde la raíz del repositorio: `bunx biome check projects/digital-logic/nand-alu-cpu` y `bunx tsc --noEmit -p projects/digital-logic/nand-alu-cpu/ts`.

## Demo

```sh
docker compose run --rm ts-demo    # gates and their NAND cost, ALU samples, the CPU trace
docker compose run --rm go-demo    # the CPU trace
```

Ambas reescriben `results/trace.txt` con los mismos bytes. No hay dependencias más allá de las imágenes fijadas (`oven/bun:1.4.2`, `golang:1.27.1-bookworm` y `golangci/golangci-lint:v2.14.0`).

## Límites del modelo

La simulación es lógica, no eléctrica: las compuertas no tienen retardo, así que no hay glitches, ni violaciones de setup o hold, ni metaestabilidad. El clock y el contenido de la ROM se dan, no se construyen. El acumulador de 4 bits guarda de 0 a 15, así que el producto da la vuelta módulo 16.
