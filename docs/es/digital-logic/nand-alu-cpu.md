# Una ALU solo de NAND y una CPU de 4 bits

> English version: [docs/en/digital-logic/nand-alu-cpu.md](../../en/digital-logic/nand-alu-cpu.md) · Versão em português: [docs/pt/digital-logic/nand-alu-cpu.md](../../pt/digital-logic/nand-alu-cpu.md)

Mini-proyecto MP-DL-2, en [`projects/digital-logic/nand-alu-cpu`](../../../projects/digital-logic/nand-alu-cpu). Enseña cómo se construye un computador a partir de una sola compuerta. El código tiene una única primitiva, `nand(a, b)`, y todo lo demás es cableado: cada capa de abajo se escribe solo con la capa de arriba.

```text
NAND -> NOT, AND, OR, XOR -> multiplexor, decodificador, sumador completo -> ALU
                          -> latch SR -> latch D -> flip-flop D -> registro
ALU + registros + multiplexores + decodificador -> CPU -> un programa que multiplica
```

## 1. Toda compuerta a partir de NAND

NAND vale 0 solo cuando las dos entradas valen 1. Es una compuerta **universal**: puede construir NOT, AND y OR, y esas tres construyen cualquier función booleana.

| Compuerta | Construcción | NAND |
| --- | --- | ---: |
| NOT A | `NAND(A, A)`, porque A·A = A | 1 |
| A AND B | `NOT(NAND(A, B))`, las dos inversiones se cancelan | 2 |
| A OR B | `NAND(NOT A, NOT B)`, De Morgan: A + B = (A'·B')' | 3 |
| A XOR B | `M = NAND(A, B)`, luego `NAND(NAND(A, M), NAND(B, M))` | 4 |
| Multiplexor 2 a 1 | `NAND(NAND(NOT S, I0), NAND(S, I1))` | 4 |
| Sumador completo | dos XOR que comparten sus NAND internas, más una NAND para el acarreo | 9 |

Traducir A'·B + A·B' compuerta por compuerta costaría 9 NAND para la XOR. Compartir la señal M lo baja a 4, que es el mínimo. Ese mismo compartir hace que el sumador completo cueste 9 NAND en lugar de 15. El código cuenta cada evaluación de `nand`, y las pruebas comprueban estos números.

**Aceptación (MP-DL-2.1).** Cada compuerta derivada se compara con su tabla de verdad.

## 2. La ALU

La unidad aritmético-lógica recibe dos palabras de 4 bits y dos cables de control y produce un resultado y cuatro flags.

| op1 op0 | Operación |
| --- | --- |
| 0 0 | X + Y |
| 0 1 | X − Y |
| 1 0 | X and Y |
| 1 1 | X or Y |

Vale la pena conservar tres ideas:

- **El hardware no tiene `if`.** Los cuatro resultados se calculan todo el tiempo y los multiplexores eligen uno. Los cables de control solo seleccionan.
- **La resta reutiliza el sumador.** En complemento a dos, X − Y = X + Y' + 1. Una XOR por bit invierte Y cuando el cable `subtract` vale 1 (XOR con 1 invierte, XOR con 0 deja pasar) y el mismo cable es el acarreo de entrada, que aporta el +1.
- **Las flags son subproductos gratuitos.** Z es la NOR de los bits del resultado. N es el bit más significativo. C es el acarreo de salida del sumador, y después de una resta C = 1 significa "sin préstamo", es decir, X ≥ Y como números sin signo. V, el desbordamiento con signo, es que el acarreo que entra al bit de signo sea distinto del que sale de él.

```text
x     op   y     result  Z N C V
0111  ADD  0001  1000    0 1 0 1     7 + 1 = -8: overflow, with no carry-out
1111  ADD  0001  0000    1 0 1 0     -1 + 1 = 0: carry-out, with no overflow
0101  SUB  0011  0010    0 0 1 0     5 - 3 = 2, no borrow
0011  SUB  0101  1110    0 1 0 0     3 - 5 = -2, a borrow happened
```

Las dos primeras filas son la razón por la que acarreo y desbordamiento son flags distintas: el acarreo trata de números sin signo y el desbordamiento de números con signo.

**Aceptación (MP-DL-2.2).** Las 16 × 16 × 4 = 1.024 combinaciones se comparan con una referencia escrita en aritmética común, resultado y cuatro flags.

## 3. Memoria a partir de realimentación

Un circuito combinacional olvida: su salida depende solo de sus entradas actuales. La memoria aparece cuando una salida se realimenta a una entrada.

- **Latch SR.** Dos NAND en cruz: Q = NAND(S', Q') y Q' = NAND(R', Q). Las entradas son activas en nivel bajo: S' = 0 pone a 1 (set), R' = 0 pone a 0 (reset), las dos en 1 mantienen. Las dos en 0 fuerzan Q = Q' = 1, la combinación prohibida.
- **Latch D.** Dos NAND más delante hacen imposible la combinación prohibida. Mientras `enable` vale 1 el latch es transparente y Q sigue a D; cuando pasa a 0, Q se mantiene.
- **Flip-flop D.** Dos latches D seguidos con habilitaciones opuestas (maestro-esclavo). El valor se captura en el instante en que el clock sube y no puede cambiar hasta el siguiente flanco de subida.
- **Registro.** Un flip-flop por bit con el mismo clock. Un multiplexor delante de cada uno realimenta el bit hacia sí mismo cuando `load` vale 0, así el registro conserva su palabra aunque el clock siga latiendo.

El simulador resuelve el lazo de realimentación recalculando las dos compuertas del latch hasta que las salidas dejan de cambiar, que es lo que hace el circuito real al asentarse. La misma forma de onda muestra la diferencia entre nivel y flanco:

```text
t:          0 1 2 3 4 5 6 7 8 9
clock:      0 0 1 1 1 0 0 1 1 0
D:          1 0 0 1 1 0 1 1 0 0
D latch:    0 0 0 1 1 1 1 1 0 0     follows D while the clock is 1
flip-flop:  0 0 0 0 0 0 0 1 1 1     looks at D only when the clock rises
```

## 4. La CPU

Una máquina de acumulador: un registro de trabajo A, un contador de programa PC, dos flags Z y C, un registro de salida, 16 celdas de memoria de 4 bits y una ROM de 16 instrucciones. Una instrucción es un byte, con el opcode en el nibble alto y el operando en el nibble bajo. La tabla de instrucciones está en el [README](../../../projects/digital-logic/nand-alu-cpu/README.es.md).

Un ciclo de clock tiene dos mitades.

1. **La parte combinacional se asienta.**
   - *Búsqueda (fetch)*: el PC es la entrada de selección de un árbol de multiplexores de 16 a 1 sobre la ROM.
   - *Decodificación*: un decodificador de 4 a 16 convierte el opcode en una línea activa. Cada señal de control es una OR de líneas, por ejemplo `loadA = LDI + LDA + ADD + SUB + AND + OR + ADDI + SUBI`.
   - *Ejecución*: los multiplexores eligen las entradas de la ALU (A o cero, una celda de memoria o el operando) y la ALU calcula. Una carga se calcula como "0 + operando", así que toda escritura en A pasa por la ALU y actualiza las flags.
   - *Siguiente PC*: un multiplexor elige PC + 1 o el destino del salto. `JZ` y `JC` son una AND de la línea de la instrucción con la flag.
2. **El clock sube** y cada registro captura su entrada en el mismo flanco. Todas las entradas se calcularon a partir de los valores antiguos, y por eso un diseño síncrono es predecible.

Lo que no se construye con NAND: el clock mismo y el contenido de la ROM, que son cables constantes.

## 5. El programa

La CPU no tiene instrucción de multiplicar. [`programs/multiply.asm`](../../../projects/digital-logic/nand-alu-cpu/programs/multiply.asm) construye una con una suma y un bucle: suma x al producto y veces, contando y hasta cero y saliendo del bucle con `JZ`. La primera y la última iteración de 3 × 4, del trace versionado:

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

La ejecución completa toma 41 instrucciones y 122.601 evaluaciones de NAND, unas 2.990 por ciclo de clock. La mayoría se gasta en los 64 flip-flops de la memoria, lo cual es un buen retrato de los chips reales: la memoria domina la cantidad de compuertas.

**Aceptación (MP-DL-2.3).** El trace está versionado en `results/trace.txt` e impreso en ambos README. Las pruebas de los dos lenguajes deben reproducir ese archivo byte a byte, y además ejecutan el mismo programa para los 256 pares de números de 4 bits, comprobando el producto módulo 16.

## Por qué hay una versión en Go

TypeScript es la referencia. Go cambia tres cosas en cómo se escribe el mismo circuito:

- **El ancho es un tipo.** Una palabra es `Nibble`, un array `[4]Bit`. Conectar un haz de cables del ancho equivocado es un error de compilación, mientras que la versión en TypeScript comprueba la longitud en tiempo de ejecución.
- **El valor cero importa.** Una struct de ceros sería un latch con Q = Q' = 0, un estado que ningún latch real mantiene, y la primera actualización lo despertaría como 1. Por eso los latches, flip-flops y registros tienen constructores que los inician en el estado de reset.
- **Los errores son valores.** El ensamblador y la CPU devuelven errores en lugar de lanzarlos.

Las dos implementaciones están atadas por el `results/trace.txt` compartido: cada suite de pruebas compara su propio trace con ese archivo, así que se demuestra que coinciden instrucción por instrucción. También gastan el mismo número de evaluaciones de NAND.

## Límites del modelo

La simulación es lógica, no eléctrica. Las compuertas no tienen retardo, así que no hay glitches, ni violaciones de setup o hold, ni metaestabilidad. Un diseño real necesita además un circuito de reset; aquí todo registro simplemente empieza en cero.

## Ejecución

```sh
./setup-unix-nand-alu-cpu.sh        # Linux y macOS
./setup-windows-nand-alu-cpu.ps1    # Windows
```

El script necesita solo Docker. Construye las imágenes, ejecuta las pruebas de ambos lenguajes y después las demos.

## Temas del quiz

`logic-gates`, `binary-codes`, `arithmetic-circuits`, `mux-demux-encoders-decoders`, `latches-flip-flops` y `registers-counters`, en el área `digital-logic`. El mini-proyecto anterior, [gates-karnaugh-adders](gates-karnaugh-adders.md), cubre las tablas de verdad, la minimización y el sumador ripple-carry.
