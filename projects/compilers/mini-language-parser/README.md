# mini-language-parser

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

The front end of a small programming language, written by hand. It teaches **how source text becomes tokens and then a tree**: a lexer that reads characters and produces tokens with line and column, and a parser (recursive descent for statements, Pratt parsing for expressions) that produces an abstract syntax tree and reports every syntax error of a file in one run.

This is the first step of the compiler track. The same language is executed by [tree-walking-interpreter](../tree-walking-interpreter) (MP-COMP-2) and compiled to bytecode by [bytecode-vm](../bytecode-vm) (MP-COMP-3).

Full explanation: [docs/en/compilers/mini-language-parser.md](../../../docs/en/compilers/mini-language-parser.md).

## Quiz topics it demonstrates

- `compilers` / `compiler-structure`: the phases of a front end, from characters to tokens to a tree.
- `compilers` / `lexical-analysis`: tokens, lexemes and patterns, longest match, keywords against identifiers, lexical errors.
- `compilers` / `syntax-analysis`: grammars, precedence and associativity, recursive descent, abstract syntax trees, panic-mode error recovery.
- `compilers` / `syntax-directed-translation`: building the tree while parsing.

## Run

The only requirement is Docker.

```sh
./setup-unix-mini-language-parser.sh        # Linux and macOS
./setup-windows-mini-language-parser.ps1    # Windows
```

The script builds the image and runs the tests. Then start the REPL:

```sh
docker compose run --rm ts-repl
```

## The language

Numbers, strings, booleans, `nil`, variables, arithmetic and comparison operators, `if`, `while` and functions. Comments start with `//` and run to the end of the line.

### Grammar (EBNF)

`{ x }` means zero or more, `[ x ]` means optional, `|` separates choices.

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

Each level of the expression rules is one precedence level, from the loosest (`=`) to the tightest (calls). Binary operators group to the left, assignment groups to the right. The parser does not have one function per level: it reads this precedence from a table (Pratt parsing).

### One example program per construct

The programs are in [`examples/`](examples). The tests parse all of them, and the next two mini-projects run them.

| Construct | File | A line from it |
| --- | --- | --- |
| Numbers | [`numbers.mini`](examples/numbers.mini) | `print 10 / 4;` |
| Strings | [`strings.mini`](examples/strings.mini) | `print "mini" + " " + "language";` |
| Booleans and `nil` | [`booleans.mini`](examples/booleans.mini) | `print false or "fallback";` |
| Variables | [`variables.mini`](examples/variables.mini) | `let y = x * 2;` |
| Arithmetic operators | [`arithmetic.mini`](examples/arithmetic.mini) | `print 8 - 3 - 2;` |
| Comparison operators | [`comparison.mini`](examples/comparison.mini) | `print 1 + 1 == 2;` |
| `if` | [`if.mini`](examples/if.mini) | `if n % 3 == 0 { print "fizz"; } else { print n; }` |
| `while` | [`while.mini`](examples/while.mini) | `while i <= 5 { sum = sum + i; i = i + 1; }` |
| Functions | [`functions.mini`](examples/functions.mini) | `fn add(a, b) { return a + b; }` |
| Blocks and scopes | [`scopes.mini`](examples/scopes.mini) | `{ let x = "inner block"; print x; }` |
| Closures | [`closures.mini`](examples/closures.mini) | `let first = makeCounter();` |

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/token.ts` | token types, the keyword table, the error type |
| `ts/src/lexer.ts` | the lexer: characters to tokens, with line and column |
| `ts/src/ast.ts` | the tree node types and two printers (one line, or drawn with branches) |
| `ts/src/parser.ts` | the parser: recursive descent, Pratt expressions, panic-mode recovery |
| `ts/src/repl.ts` | the REPL and the one-file mode |
| `examples/` | one program per construct, shared with MP-COMP-2 and MP-COMP-3 |

TypeScript on the pinned image `oven/bun:1.4.2`, with no dependency.

## Tests

```sh
docker compose run --rm ts-test
```

The lexer tests cover every token type, positions, longest match, comments, an unterminated string and unknown characters. The parser tests prove that `1 + 2 * 3` and `(1 + 2) * 3` give different trees, check every precedence level and associativity, and check that a file with two errors reports both and still returns the statements that are correct.

## Demo: the REPL

```sh
docker compose run --rm ts-repl                                      # interactive
docker compose run --rm ts-repl bun run repl ../examples/if.mini     # one file
```

Each line is shown twice: as the flat list of tokens the lexer produced, and as the tree the parser built from it. A recorded session:

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

The parentheses of the second line are tokens but not tree nodes: their only effect is the shape of the tree, where `+` is now below `*`.
