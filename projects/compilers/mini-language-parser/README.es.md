# mini-language-parser

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

El front end de un lenguaje de programación pequeño, escrito a mano. Enseña **cómo el texto fuente se convierte en tokens y luego en un árbol**: un lexer que lee caracteres y produce tokens con línea y columna, y un parser (descenso recursivo para las sentencias, parsing de Pratt para las expresiones) que produce un árbol de sintaxis abstracta y reporta todos los errores de sintaxis de un archivo en una sola ejecución.

Este es el primer paso de la ruta de compiladores. El mismo lenguaje lo ejecuta [tree-walking-interpreter](../tree-walking-interpreter) (MP-COMP-2) y lo compila a bytecode [bytecode-vm](../bytecode-vm) (MP-COMP-3).

Explicación completa: [docs/es/compilers/mini-language-parser.md](../../../docs/es/compilers/mini-language-parser.md).

## Temas del quiz que demuestra

- `compilers` / `compiler-structure`: las fases de un front end, de los caracteres a los tokens y de los tokens a un árbol.
- `compilers` / `lexical-analysis`: tokens, lexemas y patrones, coincidencia más larga, palabras clave frente a identificadores, errores léxicos.
- `compilers` / `syntax-analysis`: gramáticas, precedencia y asociatividad, descenso recursivo, árboles de sintaxis abstracta, recuperación de errores en modo pánico.
- `compilers` / `syntax-directed-translation`: construir el árbol mientras se hace el parsing.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-mini-language-parser.sh        # Linux and macOS
./setup-windows-mini-language-parser.ps1    # Windows
```

El script construye la imagen y ejecuta las pruebas. Luego inicia el REPL:

```sh
docker compose run --rm ts-repl
```

## El lenguaje

Números, strings, booleanos, `nil`, variables, operadores aritméticos y de comparación, `if`, `while` y funciones. Los comentarios empiezan con `//` y llegan hasta el final de la línea.

### Gramática (EBNF)

`{ x }` significa cero o más, `[ x ]` significa opcional, `|` separa alternativas.

```ebnf
program     = { declaration } EOF ;

declaration = letDecl | fnDecl | statement ;
letDecl     = "let" IDENTIFIER "=" expression ";" ;
fnDecl      = "fn" IDENTIFIER "(" [ parameters ] ")" block ;
parameters  = IDENTIFIER { "," IDENTIFIER } ;

statement   = ifStmt | whileStmt | returnStmt | printStmt | block | exprStmt ;
ifStmt      = "if" expression block [ "else" ( ifStmt | block ) ] ;
whileStmt   = "while" expression block ;
returnStmt  = "return" [ expression ] ";" ;
printStmt   = "print" expression ";" ;
block       = "{" { declaration } "}" ;
exprStmt    = expression ";" ;

expression  = assignment ;
assignment  = IDENTIFIER "=" assignment | logicOr ;
logicOr     = logicAnd { "or" logicAnd } ;
logicAnd    = equality { "and" equality } ;
equality    = comparison { ( "==" | "!=" ) comparison } ;
comparison  = term { ( "<" | "<=" | ">" | ">=" ) term } ;
term        = factor { ( "+" | "-" ) factor } ;
factor      = unary { ( "*" | "/" | "%" ) unary } ;
unary       = ( "-" | "!" ) unary | call ;
call        = primary { "(" [ arguments ] ")" } ;
arguments   = expression { "," expression } ;
primary     = NUMBER | STRING | "true" | "false" | "nil" | IDENTIFIER
            | "(" expression ")" ;

NUMBER      = digit { digit } [ "." digit { digit } ] ;
STRING      = '"' { any character except '"' and newline } '"' ;
IDENTIFIER  = letter { letter | digit } ;       (* and not a keyword *)
letter      = "a" … "z" | "A" … "Z" | "_" ;
digit       = "0" … "9" ;
```

Cada nivel de las reglas de expresión es un nivel de precedencia, del más laxo (`=`) al más fuerte (las llamadas). Los operadores binarios se agrupan a la izquierda, la asignación se agrupa a la derecha. El parser no tiene una función por nivel: lee esta precedencia de una tabla (parsing de Pratt).

### Un programa de ejemplo por construcción

Los programas están en [`examples/`](examples). Las pruebas analizan todos, y los dos mini-proyectos siguientes los ejecutan.

| Construcción | Archivo | Una línea de él |
| --- | --- | --- |
| Números | [`numbers.mini`](examples/numbers.mini) | `print 10 / 4;` |
| Strings | [`strings.mini`](examples/strings.mini) | `print "mini" + " " + "language";` |
| Booleanos y `nil` | [`booleans.mini`](examples/booleans.mini) | `print false or "fallback";` |
| Variables | [`variables.mini`](examples/variables.mini) | `let y = x * 2;` |
| Operadores aritméticos | [`arithmetic.mini`](examples/arithmetic.mini) | `print 8 - 3 - 2;` |
| Operadores de comparación | [`comparison.mini`](examples/comparison.mini) | `print 1 + 1 == 2;` |
| `if` | [`if.mini`](examples/if.mini) | `if n % 3 == 0 { print "fizz"; } else { print n; }` |
| `while` | [`while.mini`](examples/while.mini) | `while i <= 5 { sum = sum + i; i = i + 1; }` |
| Funciones | [`functions.mini`](examples/functions.mini) | `fn add(a, b) { return a + b; }` |
| Bloques y ámbitos | [`scopes.mini`](examples/scopes.mini) | `{ let x = "inner block"; print x; }` |
| Closures | [`closures.mini`](examples/closures.mini) | `let first = makeCounter();` |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/token.ts` | tipos de token, la tabla de palabras clave, el tipo de error |
| `ts/src/lexer.ts` | el lexer: de caracteres a tokens, con línea y columna |
| `ts/src/ast.ts` | los tipos de nodo del árbol y dos impresores (una línea, o dibujado con ramas) |
| `ts/src/parser.ts` | el parser: descenso recursivo, expresiones con Pratt, recuperación en modo pánico |
| `ts/src/repl.ts` | el REPL y el modo de un solo archivo |
| `examples/` | un programa por construcción, compartido con MP-COMP-2 y MP-COMP-3 |

TypeScript sobre la imagen fijada `oven/bun:1.4.2`, sin dependencias.

## Pruebas

```sh
docker compose run --rm ts-test
```

Las pruebas del lexer cubren todos los tipos de token, las posiciones, la coincidencia más larga, los comentarios, una string sin terminar y los caracteres desconocidos. Las pruebas del parser demuestran que `1 + 2 * 3` y `(1 + 2) * 3` dan árboles distintos, comprueban cada nivel de precedencia y la asociatividad, y comprueban que un archivo con dos errores reporta ambos y aun así devuelve las sentencias que están correctas.

## Demo: el REPL

```sh
docker compose run --rm ts-repl                                      # interactive
docker compose run --rm ts-repl bun run repl ../examples/if.mini     # one file
```

Cada línea se muestra dos veces: como la lista plana de tokens que produjo el lexer, y como el árbol que el parser construyó a partir de ella. Una sesión grabada:

```text
mini language: type a statement and press Enter (Ctrl+D or Ctrl+C to leave)
> let total = 1 + 2 * 3;
tokens:
  1:1    LET           let
  1:5    IDENTIFIER    total
  1:11   EQUAL         =
  1:13   NUMBER        1
  1:15   PLUS          +
  1:17   NUMBER        2
  1:19   STAR          *
  1:21   NUMBER        3
  1:22   SEMICOLON     ;
  1:23   EOF
tree:
└─ let total
   └─ +
      ├─ 1
      └─ *
         ├─ 2
         └─ 3
> print (1 + 2) * 3;
tokens:
  1:1    PRINT         print
  1:7    LEFT_PAREN    (
  1:8    NUMBER        1
  1:10   PLUS          +
  1:12   NUMBER        2
  1:13   RIGHT_PAREN   )
  1:15   STAR          *
  1:17   NUMBER        3
  1:18   SEMICOLON     ;
  1:19   EOF
tree:
└─ print
   └─ *
      ├─ +
      │  ├─ 1
      │  └─ 2
      └─ 3
> if total > 6 { print "big"; }
tokens:
  1:1    IF            if
  1:4    IDENTIFIER    total
  1:10   GREATER       >
  1:12   NUMBER        6
  1:14   LEFT_BRACE    {
  1:16   PRINT         print
  1:22   STRING        "big"
  1:27   SEMICOLON     ;
  1:29   RIGHT_BRACE   }
  1:30   EOF
tree:
└─ if
   ├─ >
   │  ├─ total
   │  └─ 6
   └─ block
      └─ print
         └─ "big"
> print 1 +;
tokens:
  1:1    PRINT         print
  1:7    NUMBER        1
  1:9    PLUS          +
  1:10   SEMICOLON     ;
  1:11   EOF
tree:
[line 1, column 10] syntax error: expected an expression, found ';'
```

Los paréntesis de la segunda línea son tokens pero no nodos del árbol: su único efecto es la forma del árbol, donde `+` ahora está debajo de `*`.
