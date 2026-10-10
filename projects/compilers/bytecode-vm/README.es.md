# bytecode-vm

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un compilador del árbol de sintaxis del minilenguaje a bytecode de pila, y la máquina virtual que lo ejecuta, en Rust. Enseña **por qué el bytecode se ejecuta más rápido que recorrer un árbol**: el compilador decide por adelantado lo que el intérprete que recorre el árbol decide de nuevo en cada visita (qué variable significa un nombre, a dónde va el control después), así que a la máquina le queda un arreglo plano de instrucciones pequeñas y una pila.

Este es el tercer paso de la ruta de compiladores. El lenguaje viene de [mini-language-parser](../mini-language-parser) (MP-COMP-1) y el comportamiento de referencia de [tree-walking-interpreter](../tree-walking-interpreter) (MP-COMP-2).

Explicación completa: [docs/es/compilers/bytecode-vm.md](../../../docs/es/compilers/bytecode-vm.md).

## Temas del quiz que demuestra

- `compilers` / `compiler-structure`: traducir un árbol a código postfijo para una máquina de pila.
- `compilers` / `intermediate-code-generation`: el flujo de control como saltos, backpatching de los saltos hacia adelante.
- `compilers` / `code-generation`: código para una máquina de pila.
- `compilers` / `run-time-environments`: marcos de llamada en una pila, variables que sobreviven a su llamada.
- `compilers` / `interpreters-vms-jit`: bytecode, el bucle de despacho, bytecode frente a recorrer el árbol.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-bytecode-vm.sh        # Linux and macOS
./setup-windows-bytecode-vm.ps1    # Windows
```

El script construye la imagen y ejecuta la verificación del formateador, el linter y las pruebas. Luego:

```sh
docker compose run --rm vm disasm ../examples/closures.mini    # print the bytecode
docker compose run --rm vm run ../examples/closures.mini       # run the program
```

## Estructura

| Ruta | Qué es |
| --- | --- |
| `rust/src/lexer.rs`, `parser.rs`, `ast.rs` | el front end del MP-COMP-1, portado a Rust (misma gramática, misma tabla de precedencia) |
| `rust/src/compiler.rs` | de árbol a bytecode: resolución de posiciones, saltos y backpatching, closures |
| `rust/src/chunk.rs` | el conjunto de instrucciones, el chunk compilado y el desensamblador |
| `rust/src/vm.rs` | la máquina de pila: bucle de despacho, marcos de llamada, upvalues |
| `rust/src/value.rs` | valores en tiempo de ejecución, funciones compiladas, closures |
| `rust/tests/snapshots/` | programas y el listado de bytecode al que cada uno debe compilar |
| `examples/` | los programas de ejemplo y las salidas esperadas del MP-COMP-2 |
| `bench/` | los dos programas de benchmark, ejecutados por ambas implementaciones |
| `baseline-ts/` | el intérprete que recorre el árbol del MP-COMP-2, usado solo como línea base del benchmark |
| `results/` | resultados de benchmark registrados en el repositorio |

Rust sobre la imagen fijada `rust:1.99.0-slim-trixie`, sin dependencias.

**Una definición del lenguaje, copiada.** Un mini-proyecto debe construirse por sí solo, así que nada se importa entre mini-proyectos. `examples/` (programas y salidas esperadas) y `baseline-ts/src/` son copias de los archivos de `tree-walking-interpreter`. El front end en Rust es un port del de TypeScript, y la suite de ejemplos es lo que mantiene a ambos de acuerdo. Se detiene en el primer error de sintaxis: reportar varios es la lección del MP-COMP-1.

## El bytecode

```sh
docker compose run --rm vm disasm ../rust/tests/snapshots/control-flow.mini
```

```text
== script ==
0000    1  CONSTANT                0  ; 0
0001    |  DEFINE_GLOBAL           0  ; i
0002    2  GET_GLOBAL              0  ; i
0003    |  CONSTANT                1  ; 3
0004    |  LESS
0005    |  JUMP_IF_FALSE          23  ; -> 0023
0006    3  GET_GLOBAL              0  ; i
0007    |  CONSTANT                2  ; 2
0008    |  MODULO
...
0022    |  JUMP                    2  ; -> 0002
0023    |  NIL
0024    |  RETURN
```

Cada línea es el índice de la instrucción, su línea de código fuente (`|` cuando no cambia), su nombre, su operando y a qué se refiere el operando. `i < 3` es "apila `i`, apila `3`, `LESS`": primero los operandos, al final el operador. El `while` son dos saltos.

## Pruebas

```sh
docker compose run --rm rust-test
```

- **Pruebas de snapshot** (`rust/tests/disassembler.rs`): cuatro programas deben compilar a los listados registrados en `rust/tests/snapshots/`.
- **Suite de ejemplos** (`rust/tests/examples.rs`): todo programa del MP-COMP-2 debe imprimir exactamente su archivo `.out`.
- Closures (compartidas, anidadas, una por iteración de bucle), `return` desde bloques anidados, cortocircuito, y los mismos errores de ejecución que el intérprete, con la misma línea y columna.

## Benchmark

```sh
bun run bench -- --project projects/compilers/bytecode-vm    # from the repository root
```

Los dos programas de `bench/` corren en esta máquina virtual (`rust`) y en el intérprete que recorre el árbol (`ts`). `loop` suma `i % 7` durante `n` iteraciones. `recursion` llama a una función unas `2n` veces. Ambas implementaciones imprimen el mismo checksum. Sección medida, en milisegundos, de [`results/results.md`](results/results.md) (allí se registran la máquina, las versiones y los comandos):

| Programa | n | Recorrido del árbol (TypeScript en Bun) | Bytecode (Rust) | Razón |
| --- | ---: | ---: | ---: | ---: |
| `loop` | 100,000 | 36.0 | 17.9 | 2.0× |
| `loop` | 1,000,000 | 376 | 194 | 1.9× |
| `recursion` | 100,000 | 64.5 | 19.6 | 3.3× |
| `recursion` | 1,000,000 | 672 | 136 | 4.9× |

El pico de memoria fue de unos 2 MiB para la máquina virtual y de 58 a 98 MiB para el intérprete en Bun.

Cómo leerlo: las dos filas difieren en técnica **y** en lenguaje, y Bun compila el propio intérprete a código máquina con su JIT, lo que reduce la brecha en el bucle simple. La brecha mayor en `recursion` es donde más difieren las técnicas: una llamada en el intérprete de árbol asigna un entorno (una tabla hash) y busca los nombres a través de una cadena de ellos, y una llamada en la máquina virtual solo mueve la base de una ventana de la pila. Los números dependen de la máquina, y las ejecuciones fueron ruidosas, así que compara los órdenes de magnitud y no los decimales.
