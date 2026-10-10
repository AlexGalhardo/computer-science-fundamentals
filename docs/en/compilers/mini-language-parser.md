# Mini language: lexer and parser

> Versão em português: [docs/pt/compilers/mini-language-parser.md](../../pt/compilers/mini-language-parser.md) · Versión en español: [docs/es/compilers/mini-language-parser.md](../../es/compilers/mini-language-parser.md)

Mini-project MP-COMP-1, in [`projects/compilers/mini-language-parser`](../../../projects/compilers/mini-language-parser). It teaches how source text becomes tokens and then a tree. The grammar of the language and its example programs are in the README of the mini-project.

## Two steps, two kinds of structure

A compiler does not understand text in one go. The front end splits the job in two, because the two halves need different tools:

| Step | Input | Output | What it recognises | Formal tool |
| --- | --- | --- | --- | --- |
| Lexical analysis (lexer) | characters | tokens | words: numbers, names, operators | regular expressions, finite automata |
| Syntax analysis (parser) | tokens | tree | sentences: nesting of expressions and blocks | context-free grammars |

Words have no nesting, so a finite automaton is enough for them. Sentences nest without limit (`((((1))))`, a block inside a block), and counting open brackets is exactly what a finite automaton cannot do. That is why the parser needs a grammar and a stack, which here is the call stack of the recursive functions.

## The lexer

`ts/src/lexer.ts` is a finite automaton written by hand. It looks at the first character of the next token to choose a state (digit, letter, quote, operator) and stays there while the following characters still belong to the same token.

- **Token, lexeme, pattern.** The pattern of `NUMBER` is "digits, optionally a dot and more digits". `3.25` is a lexeme that matches it. The token is the pair (`NUMBER`, `3.25`) plus its position.
- **Longest match (maximal munch).** `<=` is one token and `iffy` is one identifier, because the lexer always takes the longest text that still forms a token.
- **Keywords.** A keyword has the shape of an identifier, so the lexer reads the whole word first and then looks it up in the keyword table.
- **What disappears.** White space and comments produce no token. The parser never sees them.
- **Errors.** An unknown character or an unterminated string is recorded with line and column, and the lexer goes on, so one run shows every lexical error.

## The parser

`ts/src/parser.ts` uses two techniques, each where it fits best.

**Recursive descent for statements.** Each grammar rule becomes one function, and the first token chooses the rule: `let` starts a declaration, `if` starts a conditional, `{` starts a block. One token of lookahead is always enough, which is what makes this grammar predictive (LL(1)) at the statement level.

**Pratt parsing for expressions.** A grammar can encode precedence with one rule per level (`term`, `factor`, `unary` and so on), and plain recursive descent would need one function per level. Pratt parsing replaces them with a table of binding powers and one loop:

1. read an operand (a literal, a name, a parenthesised expression or a prefix operator with its operand);
2. while the next operator binds tighter than the operator waiting on the left, take it and read its right operand recursively.

In `1 + 2 * 3`, after reading `2` the parser sees `*`, which binds tighter than the waiting `+`, so `*` takes the `2`: the tree is `1 + (2 * 3)`. In `8 - 3 - 2`, the second `-` does not bind tighter than the first, so the first one closes: `(8 - 3) - 2`, left associativity. Assignment asks for one unit less on its right side, which makes it right-associative: `a = b = 1` is `a = (b = 1)`.

| Binding power | Operators | Associativity |
| --- | --- | --- |
| 1 | `=` | right |
| 2 | `or` | left |
| 3 | `and` | left |
| 4 | `==` `!=` | left |
| 5 | `<` `<=` `>` `>=` | left |
| 6 | `+` `-` | left |
| 7 | `*` `/` `%` | left |
| 8 | unary `-` `!` | prefix |
| 9 | call `f(...)` | postfix |

## The tree

The abstract syntax tree keeps the meaning and drops the punctuation. Parentheses, semicolons and braces are needed to read the text, but once the tree exists its shape says the same thing. `(1 + 2) * 3` has no node for the parentheses: it simply has `+` below `*`.

Every node records the line and column of its defining token. The parser does not need them, but the interpreter and the virtual machine do, to say where a run-time error happened.

## Error recovery

Stopping at the first error makes the programmer fix one mistake per run. Reporting everything the confused parser sees after a mistake is worse, because most of those messages are false. The parser uses **panic mode**: after an error it discards tokens up to a synchronising point (just after a `;`, or just before a keyword that starts a statement, or a `}`) and resumes there. Each real mistake gives one message, and the statements that are correct are still returned.

## Running it

```sh
./setup-unix-mini-language-parser.sh                                  # build and test
docker compose run --rm ts-repl                                      # REPL: tokens and tree of each line
docker compose run --rm ts-repl bun run repl ../examples/if.mini     # tokens and tree of a file
```

## Acceptance criteria

| Item | Criterion | Where it is checked |
| --- | --- | --- |
| MP-COMP-1.1 | grammar in EBNF, one example program per construct | README of the mini-project, `examples/` |
| MP-COMP-1.2 | tests cover every token type, comments and an unterminated string | `ts/tests/lexer.test.ts` |
| MP-COMP-1.3 | `1 + 2 * 3` and `(1 + 2) * 3` give different trees, a file with two errors reports both | `ts/tests/parser.test.ts` |
| MP-COMP-1.4 | one command starts the REPL in Docker, recorded session in the README | `docker compose run --rm ts-repl` |

## Related quiz topics

- `compilers` / `compiler-structure`
- `compilers` / `lexical-analysis`
- `compilers` / `syntax-analysis`
- `compilers` / `syntax-directed-translation`
