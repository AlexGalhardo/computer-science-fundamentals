# tree-walking-interpreter

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un intérprete que ejecuta el minilenguaje recorriendo su árbol de sintaxis. Enseña **cómo se ejecuta un árbol**: un entorno por ámbito, el ámbito estático como una cadena de entornos, funciones como closures que recuerdan dónde fueron creadas, y errores de ejecución que señalan una línea y una columna.

Este es el segundo paso de la ruta de compiladores. El lenguaje, su gramática y su front end vienen de [mini-language-parser](../mini-language-parser) (MP-COMP-1), y los mismos programas los compila a bytecode [bytecode-vm](../bytecode-vm) (MP-COMP-3).

Explicación completa: [docs/es/compilers/tree-walking-interpreter.md](../../../docs/es/compilers/tree-walking-interpreter.md).

## Temas del quiz que demuestra

- `compilers` / `compiler-structure`: compilador frente a intérprete, ámbito estático frente a dinámico, entornos.
- `compilers` / `run-time-environments`: activaciones, acceso a nombres no locales, por qué las closures necesitan entornos que sobrevivan a la llamada.
- `compilers` / `interpreters-vms-jit`: la interpretación recorriendo el árbol y de dónde viene su costo.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-tree-walking-interpreter.sh        # Linux and macOS
./setup-windows-tree-walking-interpreter.ps1    # Windows
```

El script construye la imagen y ejecuta las pruebas. Luego:

```sh
docker compose run --rm ts-repl                                           # REPL
docker compose run --rm ts-repl bun run mini ../examples/closures.mini    # run one program
```

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/interpreter.ts` | valores, entornos, closures y el evaluador, un caso por nodo del árbol |
| `ts/src/session.ts` | analiza, ejecuta y recolecta la salida y los errores; mantiene el estado entre fragmentos de código fuente |
| `ts/src/cli.ts` | el REPL y el modo de un solo archivo |
| `ts/src/frontend/` | lexer, parser y árbol del MP-COMP-1 |
| `examples/` | los programas de ejemplo (`.mini`) y la salida que cada uno debe imprimir (`.out`) |

TypeScript sobre la imagen fijada `oven/bun:1.4.2`, sin dependencias.

**Una definición del lenguaje, copiada.** Un mini-proyecto debe construirse por sí solo, así que `ts/src/frontend/` y `examples/*.mini` son copias de los archivos de `mini-language-parser`, no importaciones. La gramática se define allí. Este proyecto agrega los archivos `examples/*.out`, y `bytecode-vm` copia ambos para demostrar que imprime lo mismo.

## Qué hace el lenguaje en tiempo de ejecución

| Tema | Regla |
| --- | --- |
| Valores | números (punto flotante de 64 bits), strings, booleanos, `nil`, funciones |
| Verdad | solo `false` y `nil` son falsos; `0` y `""` son verdaderos |
| `+` | dos números, o dos strings (concatenación) |
| `-` `*` `/` `%` `<` `<=` `>` `>=` | solo números; dividir entre cero es un error |
| `==` `!=` | dos valores cualesquiera; los valores de tipos distintos nunca son iguales |
| `and` `or` | cortocircuito, y el resultado es el operando que decidió |
| Ámbito | estático: `let` y `fn` declaran en el bloque actual, las declaraciones internas ocultan a las externas |
| Funciones | valores de primera clase y closures; una función sin `return` da `nil` |
| Recursión | como máximo 200 llamadas anidadas, luego el error `stack overflow` |

## Pruebas

```sh
docker compose run --rm ts-test
```

Las pruebas ejecutan toda la suite de ejemplos contra las salidas esperadas, y cubren ámbitos, ámbito estático, closures, `if`, `while`, cortocircuito, y los errores de ejecución con su línea y columna: variable no definida, cantidad incorrecta de argumentos, división entre cero, tipos de operandos incorrectos, llamar a algo que no es una función y recursión sin límite.

## Demo: el REPL conserva el estado

Cada línea corre en la misma sesión, así que una función definida en una línea puede llamarse en una línea posterior. Una línea con una sola expresión también muestra su valor. Una sesión grabada:

```text
mini language: type a statement and press Enter (Ctrl+D or Ctrl+C to leave)
> fn square(x) { return x * x; }
> let side = 7;
> square(side);
49
> fn makeCounter() { let n = 0; fn next() { n = n + 1; return n; } return next; }
> let counter = makeCounter();
> counter();
1
> counter();
2
> print square(counter()) + side;
16
> square(1, 2);
[line 1, column 7] runtime error: expected 1 arguments but got 2
> print side / (side - 7);
[line 1, column 12] runtime error: division by zero
> print missing;
[line 1, column 7] runtime error: undefined variable 'missing'
> side;
7
```

`square` y `side` se definieron en las dos primeras líneas y siguen ahí al final, después de tres líneas que fallaron. `counter` muestra una closure en acción: la variable `n` pertenece a una llamada de `makeCounter` que ya retornó, y sigue viva porque `next` conserva su entorno.
