# Minilenguaje: lexer y parser

> English version: [docs/en/compilers/mini-language-parser.md](../../en/compilers/mini-language-parser.md) · Versão em português: [docs/pt/compilers/mini-language-parser.md](../../pt/compilers/mini-language-parser.md)

Mini-proyecto MP-COMP-1, en [`projects/compilers/mini-language-parser`](../../../projects/compilers/mini-language-parser). Enseña cómo el texto fuente se convierte en tokens y luego en un árbol. La gramática del lenguaje y sus programas de ejemplo están en el README del mini-proyecto.

## Dos pasos, dos tipos de estructura

Un compilador no entiende el texto de una sola vez. El front end divide el trabajo en dos, porque las dos mitades necesitan herramientas distintas:

| Paso | Entrada | Salida | Qué reconoce | Herramienta formal |
| --- | --- | --- | --- | --- |
| Análisis léxico (lexer) | caracteres | tokens | palabras: números, nombres, operadores | expresiones regulares, autómatas finitos |
| Análisis sintáctico (parser) | tokens | árbol | oraciones: anidamiento de expresiones y bloques | gramáticas libres de contexto |

Las palabras no tienen anidamiento, así que un autómata finito basta para ellas. Las oraciones se anidan sin límite (`((((1))))`, un bloque dentro de un bloque), y contar paréntesis abiertos es exactamente lo que un autómata finito no puede hacer. Por eso el parser necesita una gramática y una pila, que aquí es la pila de llamadas de las funciones recursivas.

## El lexer

`ts/src/lexer.ts` es un autómata finito escrito a mano. Mira el primer carácter del siguiente token para elegir un estado (dígito, letra, comillas, operador) y permanece allí mientras los caracteres siguientes aún pertenezcan al mismo token.

- **Token, lexema, patrón.** El patrón de `NUMBER` es "dígitos, opcionalmente un punto y más dígitos". `3.25` es un lexema que coincide con él. El token es el par (`NUMBER`, `3.25`) más su posición.
- **Coincidencia más larga (maximal munch).** `<=` es un solo token e `iffy` es un solo identificador, porque el lexer siempre toma el texto más largo que aún forma un token.
- **Palabras clave.** Una palabra clave tiene la forma de un identificador, así que el lexer lee primero la palabra completa y luego la busca en la tabla de palabras clave.
- **Qué desaparece.** Los espacios en blanco y los comentarios no producen token. El parser nunca los ve.
- **Errores.** Un carácter desconocido o una string sin terminar se registra con línea y columna, y el lexer continúa, de modo que una ejecución muestra todos los errores léxicos.

## El parser

`ts/src/parser.ts` usa dos técnicas, cada una donde mejor encaja.

**Descenso recursivo para las sentencias.** Cada regla de la gramática se convierte en una función, y el primer token elige la regla: `let` comienza una declaración, `if` comienza un condicional, `{` comienza un bloque. Un token de lookahead siempre basta, y eso es lo que hace predictiva (LL(1)) a esta gramática en el nivel de las sentencias.

**Parsing de Pratt para las expresiones.** Una gramática puede codificar la precedencia con una regla por nivel (`term`, `factor`, `unary` y así sucesivamente), y el descenso recursivo puro necesitaría una función por nivel. El parsing de Pratt las reemplaza por una tabla de fuerzas de enlace y un bucle:

1. lee un operando (un literal, un nombre, una expresión entre paréntesis o un operador prefijo con su operando);
2. mientras el siguiente operador enlace más fuerte que el operador que espera a la izquierda, tómalo y lee su operando derecho recursivamente.

En `1 + 2 * 3`, después de leer `2` el parser ve `*`, que enlaza más fuerte que el `+` en espera, así que `*` se queda con el `2`: el árbol es `1 + (2 * 3)`. En `8 - 3 - 2`, el segundo `-` no enlaza más fuerte que el primero, así que el primero se cierra: `(8 - 3) - 2`, asociatividad a la izquierda. La asignación pide una unidad menos en su lado derecho, lo que la hace asociativa a la derecha: `a = b = 1` es `a = (b = 1)`.

| Fuerza de enlace | Operadores | Asociatividad |
| --- | --- | --- |
| 1 | `=` | derecha |
| 2 | `or` | izquierda |
| 3 | `and` | izquierda |
| 4 | `==` `!=` | izquierda |
| 5 | `<` `<=` `>` `>=` | izquierda |
| 6 | `+` `-` | izquierda |
| 7 | `*` `/` `%` | izquierda |
| 8 | unarios `-` `!` | prefijo |
| 9 | llamada `f(...)` | postfijo |

## El árbol

El árbol de sintaxis abstracta guarda el significado y descarta la puntuación. Los paréntesis, el punto y coma y las llaves son necesarios para leer el texto, pero una vez que el árbol existe, su forma dice lo mismo. `(1 + 2) * 3` no tiene un nodo para los paréntesis: simplemente tiene `+` debajo de `*`.

Cada nodo registra la línea y la columna de su token definitorio. El parser no las necesita, pero el intérprete y la máquina virtual sí, para decir dónde ocurrió un error de ejecución.

## Recuperación de errores

Detenerse en el primer error obliga al programador a corregir un fallo por ejecución. Reportar todo lo que ve el parser confundido después de un fallo es peor, porque la mayoría de esos mensajes son falsos. El parser usa el **modo pánico**: después de un error descarta tokens hasta un punto de sincronización (justo después de un `;`, o justo antes de una palabra clave que comienza una sentencia, o de un `}`) y reanuda desde allí. Cada fallo real da un mensaje, y las sentencias que están correctas aún se devuelven.

## Cómo ejecutarlo

```sh
./setup-unix-mini-language-parser.sh                                  # construye y prueba
docker compose run --rm ts-repl                                      # REPL: tokens y árbol de cada línea
docker compose run --rm ts-repl bun run repl ../examples/if.mini     # tokens y árbol de un archivo
```

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-COMP-1.1 | gramática en EBNF, un programa de ejemplo por construcción | README del mini-proyecto, `examples/` |
| MP-COMP-1.2 | las pruebas cubren todos los tipos de token, los comentarios y una string sin terminar | `ts/tests/lexer.test.ts` |
| MP-COMP-1.3 | `1 + 2 * 3` y `(1 + 2) * 3` dan árboles distintos, un archivo con dos errores reporta ambos | `ts/tests/parser.test.ts` |
| MP-COMP-1.4 | un comando inicia el REPL en Docker, sesión grabada en el README | `docker compose run --rm ts-repl` |

## Temas relacionados del quiz

- `compilers` / `compiler-structure`
- `compilers` / `lexical-analysis`
- `compilers` / `syntax-analysis`
- `compilers` / `syntax-directed-translation`
