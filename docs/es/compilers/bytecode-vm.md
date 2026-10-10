# Máquina virtual de bytecode

> English version: [docs/en/compilers/bytecode-vm.md](../../en/compilers/bytecode-vm.md) · Versão em português: [docs/pt/compilers/bytecode-vm.md](../../pt/compilers/bytecode-vm.md)

Mini-proyecto MP-COMP-3, en [`projects/compilers/bytecode-vm`](../../../projects/compilers/bytecode-vm). Enseña por qué el bytecode se ejecuta más rápido que recorrer un árbol. El lenguaje es el de [MP-COMP-1](mini-language-parser.md), y el comportamiento a igualar es el de [MP-COMP-2](tree-walking-interpreter.md).

## De un árbol a una línea

El intérprete que recorre el árbol ejecuta el árbol directamente. Este proyecto agrega una etapa entre el árbol y la ejecución:

```text
source text -> tokens -> tree -> bytecode -> virtual machine
```

El bytecode es el programa escrito para una máquina imaginaria, muy simple. La máquina aquí es una **máquina de pila**: las instrucciones no nombran sus operandos, los toman de una pila y dejan el resultado allí.

```text
1 + 2 * 3        CONSTANT 1     stack: 1
                 CONSTANT 2     stack: 1 2
                 CONSTANT 3     stack: 1 2 3
                 MULTIPLY       stack: 1 6
                 ADD            stack: 7
```

El compilador produce esto visitando el árbol en postorden: primero los operandos, al final el operador. Es el árbol escrito en notación postfija, y la precedencia ya queda resuelta por el orden de las instrucciones.

## Lo que el compilador decide por adelantado

El intérprete de MP-COMP-2 repite algunas decisiones cada vez que se ejecuta un nodo. El compilador las toma una sola vez.

| Pregunta | Intérprete que recorre el árbol, en tiempo de ejecución | Compilador, antes de que el programa corra |
| --- | --- | --- |
| ¿Cuál variable es `x`? | busca el nombre a través de una cadena de tablas hash | un número de posición: `GET_LOCAL 2`, `GET_GLOBAL 0`, `GET_UPVALUE 1` |
| ¿Qué corre después de un `if`? | la recursión retorna a través de las llamadas anidadas | un salto a un índice de instrucción conocido |
| ¿Qué tipo de nodo es este? | un `switch` sobre un objeto nodo alcanzado mediante un puntero | el siguiente elemento de un arreglo plano |
| ¿Dónde guarda un bloque sus variables? | un nuevo objeto entorno por bloque y por llamada | posiciones en la única pila de valores |

## Saltos y backpatching

`if` y `while` se convierten en saltos:

```text
if c { A } else { B }        c, JUMP_IF_FALSE else, A, JUMP end, else: B, end:
while c { A }                start: c, JUMP_IF_FALSE exit, A, JUMP start, exit:
```

Cuando el compilador emite un salto hacia adelante, el código que salta aún no existe, así que el destino se desconoce. Emite el salto con un valor provisional, compila la rama y vuelve para rellenar el destino. Esto es el **backpatching**. Un salto hacia atrás (el final de un bucle) no necesita ninguno, porque su destino ya se emitió.

## Llamadas y marcos

Todos los valores viven en una sola pila. Una llamada no copia sus argumentos: ya están en el tope de la pila, así que la nueva llamada solo declara que sus posiciones empiezan allí.

```text
stack:  ... | <fn area> | 3 | 4 | result |
                          ^ base of the call: slot 0 = width, slot 1 = height, slot 2 = result
```

Lo que la máquina guarda sobre quien llama (su función, su siguiente instrucción, su base) es un **marco**: el registro de activación del lenguaje en tres campos. `RETURN` recorta la pila hasta donde empezó la llamada, apila el resultado y restaura a quien llamó.

## Closures: upvalues

Los locales en una pila mueren cuando su función retorna, pero una closure aún puede necesitarlos. El compilador sabe, para cada función, qué variables externas usa, y las registra como **upvalues**. En tiempo de ejecución un upvalue empieza *abierto*, apuntando a la posición de la pila de la variable. Cuando esa posición está a punto de desaparecer (`CLOSE_UPVALUE` al final de un bloque, o un retorno), el valor se mueve al upvalue, que pasa a estar *cerrado*. Las closures que capturaron la misma variable comparten un upvalue, así que siguen viendo las asignaciones de las demás. Las variables que nadie captura nunca pagan por esto.

## El bucle de despacho

`rust/src/vm.rs` es un bucle: busca la instrucción en `ip`, avanza `ip`, ejecútala. El flujo de control es una asignación a `ip`. Cada instrucción es un pequeño valor de tamaño fijo en un arreglo contiguo (un enum de Rust de 8 bytes aquí, donde las máquinas virtuales de producción empaquetan bytes de longitud variable), que la caché y el predictor de saltos del procesador manejan mucho mejor que objetos dispersos en la memoria.

## Acuerdo con el intérprete

La suite de ejemplos de MP-COMP-2 es la especificación: `rust/tests/examples.rs` ejecuta cada `examples/*.mini` y compara la salida con el archivo `.out` producido por el intérprete. Los errores de ejecución tienen el mismo texto, línea y columna, porque el compilador guarda la posición en el código fuente de cada instrucción junto a ella.

Una diferencia es deliberada e instructiva. El compilador resuelve un nombre cuando compila la función, y el intérprete lo busca cuando la función corre. Solo discrepan en una función que usa una variable a nivel de bloque declarada *después* de la función en el mismo bloque:

```text
{
	fn peek() { return late; }
	let late = 1;
	print peek();
}
```

El intérprete encuentra `late` en el bloque en el momento de la llamada e imprime `1`. El compilador no ha visto un local `late` cuando compila `peek`, trata el nombre como global, y la máquina reporta `undefined variable 'late'`. En el nivel superior ambos coinciden, porque los globales se buscan tarde en los dos. Los lenguajes reales eligen una regla y la documentan.

## Benchmark

`bun run bench -- --project projects/compilers/bytecode-vm` ejecuta `bench/loop.mini` y `bench/recursion.mini` en ambas implementaciones y escribe `results/`. En la ejecución registrada en el repositorio la máquina virtual fue unas 2 veces más rápida en el bucle y de 3 a 5 veces más rápida en la función recursiva, con unos 2 MiB de memoria contra 58 a 98 MiB.

Lee el resultado con cuidado. La comparación mezcla dos diferencias: la técnica, y el lenguaje de implementación (Rust frente a TypeScript en Bun, cuyo JIT compila el propio intérprete a código máquina). El programa recursivo muestra mejor la técnica, porque una llamada es donde un intérprete de árbol hace más trabajo extra: asigna un entorno y resuelve cada nombre buscando. La tabla, la máquina y los comandos exactos están en `results/results.md`.

## Cómo ejecutarlo

```sh
./setup-unix-bytecode-vm.sh                                       # construye, verifica el formato, lint, pruebas
docker compose run --rm vm disasm ../examples/closures.mini       # imprime el bytecode de un programa
docker compose run --rm vm run ../examples/closures.mini          # ejecuta un programa
bun run bench -- --project projects/compilers/bytecode-vm         # benchmark, desde la raíz del repositorio
```

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-COMP-3.1 | un desensamblador imprime bytecode legible, verificado con pruebas de snapshot | `rust/tests/disassembler.rs`, `rust/tests/snapshots/` |
| MP-COMP-3.2 | los programas de ejemplo de MP-COMP-2 dan la misma salida | `rust/tests/examples.rs` contra `examples/*.out` |
| MP-COMP-3.3 | tabla para un bucle y una función recursiva, con la máquina y las versiones registradas | `results/results.md` |

## Temas relacionados del quiz

- `compilers` / `compiler-structure`
- `compilers` / `intermediate-code-generation`
- `compilers` / `code-generation`
- `compilers` / `run-time-environments`
- `compilers` / `interpreters-vms-jit`
