# mini-language-parser

> English version: [README.md](README.md)

O front end de uma pequena linguagem de programação, escrito à mão. Ensina **como o código-fonte vira tokens e depois uma árvore**: um lexer que lê caracteres e produz tokens com linha e coluna, e um parser (descida recursiva para os comandos, análise de Pratt para as expressões) que produz uma árvore sintática abstrata e reporta todos os erros de sintaxe de um arquivo em uma única execução.

Este é o primeiro passo da trilha de compiladores. A mesma linguagem é executada pelo [tree-walking-interpreter](../tree-walking-interpreter) (MP-COMP-2) e compilada para bytecode pelo [bytecode-vm](../bytecode-vm) (MP-COMP-3).

Explicação completa: [docs/pt/compilers/mini-language-parser.md](../../../docs/pt/compilers/mini-language-parser.md).

## Tópicos do quiz que ele demonstra

- `compilers` / `compiler-structure`: as fases de um front end, de caracteres a tokens e a uma árvore.
- `compilers` / `lexical-analysis`: tokens, lexemas e padrões, casamento mais longo, palavras-chave contra identificadores, erros léxicos.
- `compilers` / `syntax-analysis`: gramáticas, precedência e associatividade, descida recursiva, árvores sintáticas abstratas, recuperação de erros em modo pânico.
- `compilers` / `syntax-directed-translation`: construção da árvore durante a análise.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-mini-language-parser.sh        # Linux e macOS
./setup-windows-mini-language-parser.ps1    # Windows
```

O script constrói a imagem e roda os testes. Depois, inicie o REPL:

```sh
docker compose run --rm ts-repl
```

## A linguagem

Números, strings, booleanos, `nil`, variáveis, operadores aritméticos e de comparação, `if`, `while` e funções. Comentários começam com `//` e vão até o fim da linha.

### Gramática (EBNF)

`{ x }` significa zero ou mais, `[ x ]` significa opcional, `|` separa alternativas.

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

Cada nível das regras de expressão é um nível de precedência, do mais fraco (`=`) ao mais forte (chamadas). Operadores binários agrupam à esquerda, a atribuição agrupa à direita. O parser não tem uma função por nível: ele lê essa precedência de uma tabela (análise de Pratt).

### Um programa de exemplo por construção

Os programas estão em [`examples/`](examples). Os testes analisam todos, e os dois próximos mini-projetos os executam.

| Construção | Arquivo | Uma linha dele |
| --- | --- | --- |
| Números | [`numbers.mini`](examples/numbers.mini) | `print 10 / 4;` |
| Strings | [`strings.mini`](examples/strings.mini) | `print "mini" + " " + "language";` |
| Booleanos e `nil` | [`booleans.mini`](examples/booleans.mini) | `print false or "fallback";` |
| Variáveis | [`variables.mini`](examples/variables.mini) | `let y = x * 2;` |
| Operadores aritméticos | [`arithmetic.mini`](examples/arithmetic.mini) | `print 8 - 3 - 2;` |
| Operadores de comparação | [`comparison.mini`](examples/comparison.mini) | `print 1 + 1 == 2;` |
| `if` | [`if.mini`](examples/if.mini) | `if n % 3 == 0 { print "fizz"; } else { print n; }` |
| `while` | [`while.mini`](examples/while.mini) | `while i <= 5 { sum = sum + i; i = i + 1; }` |
| Funções | [`functions.mini`](examples/functions.mini) | `fn add(a, b) { return a + b; }` |
| Blocos e escopos | [`scopes.mini`](examples/scopes.mini) | `{ let x = "inner block"; print x; }` |
| Closures | [`closures.mini`](examples/closures.mini) | `let first = makeCounter();` |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/token.ts` | tipos de token, a tabela de palavras-chave, o tipo de erro |
| `ts/src/lexer.ts` | o lexer: caracteres para tokens, com linha e coluna |
| `ts/src/ast.ts` | os tipos de nó da árvore e dois impressores (uma linha, ou desenhada com ramos) |
| `ts/src/parser.ts` | o parser: descida recursiva, expressões de Pratt, recuperação em modo pânico |
| `ts/src/repl.ts` | o REPL e o modo de um arquivo |
| `examples/` | um programa por construção, compartilhados com MP-COMP-2 e MP-COMP-3 |

TypeScript na imagem fixada `oven/bun:1.4.2`, sem dependências.

## Testes

```sh
docker compose run --rm ts-test
```

Os testes do lexer cobrem todos os tipos de token, posições, casamento mais longo, comentários, uma string não terminada e caracteres desconhecidos. Os testes do parser provam que `1 + 2 * 3` e `(1 + 2) * 3` geram árvores diferentes, conferem cada nível de precedência e a associatividade, e conferem que um arquivo com dois erros reporta os dois e ainda devolve os comandos que estão corretos.

## Demo: o REPL

```sh
docker compose run --rm ts-repl                                      # interativo
docker compose run --rm ts-repl bun run repl ../examples/if.mini     # um arquivo
```

Cada linha é mostrada duas vezes: como a lista plana de tokens que o lexer produziu, e como a árvore que o parser construiu a partir dela. Uma sessão gravada:

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

Os parênteses da segunda linha são tokens, mas não são nós da árvore: seu único efeito é a forma da árvore, em que `+` agora está abaixo de `*`.
