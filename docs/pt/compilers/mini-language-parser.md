# Mini linguagem: lexer e parser

> English version: [docs/en/compilers/mini-language-parser.md](../../en/compilers/mini-language-parser.md) · Versión en español: [docs/es/compilers/mini-language-parser.md](../../es/compilers/mini-language-parser.md)

Mini-projeto MP-COMP-1, em [`projects/compilers/mini-language-parser`](../../../projects/compilers/mini-language-parser). Ensina como o código-fonte vira tokens e depois uma árvore. A gramática da linguagem e seus programas de exemplo estão no README do mini-projeto.

## Dois passos, dois tipos de estrutura

Um compilador não entende o texto de uma vez só. O front end divide o trabalho em dois, porque as duas metades pedem ferramentas diferentes:

| Passo | Entrada | Saída | O que reconhece | Ferramenta formal |
| --- | --- | --- | --- | --- |
| Análise léxica (lexer) | caracteres | tokens | palavras: números, nomes, operadores | expressões regulares, autômatos finitos |
| Análise sintática (parser) | tokens | árvore | frases: aninhamento de expressões e blocos | gramáticas livres de contexto |

Palavras não têm aninhamento, então um autômato finito basta para elas. Frases aninham sem limite (`((((1))))`, um bloco dentro de um bloco), e contar parênteses abertos é exatamente o que um autômato finito não consegue fazer. Por isso o parser precisa de uma gramática e de uma pilha, que aqui é a pilha de chamadas das funções recursivas.

## O lexer

`ts/src/lexer.ts` é um autômato finito escrito à mão. Ele olha o primeiro caractere do próximo token para escolher um estado (dígito, letra, aspas, operador) e permanece ali enquanto os caracteres seguintes ainda pertencem ao mesmo token.

- **Token, lexema, padrão.** O padrão de `NUMBER` é "dígitos, opcionalmente um ponto e mais dígitos". `3.25` é um lexema que casa com ele. O token é o par (`NUMBER`, `3.25`) mais a sua posição.
- **Casamento mais longo (maximal munch).** `<=` é um token só e `iffy` é um identificador só, porque o lexer sempre pega o texto mais longo que ainda forma um token.
- **Palavras-chave.** Uma palavra-chave tem a forma de um identificador, então o lexer lê a palavra inteira primeiro e depois a procura na tabela de palavras-chave.
- **O que desaparece.** Espaços em branco e comentários não produzem token. O parser nunca os vê.
- **Erros.** Um caractere desconhecido ou uma string não terminada é registrado com linha e coluna, e o lexer continua, de modo que uma execução mostra todos os erros léxicos.

## O parser

`ts/src/parser.ts` usa duas técnicas, cada uma onde se encaixa melhor.

**Descida recursiva para os comandos.** Cada regra da gramática vira uma função, e o primeiro token escolhe a regra: `let` começa uma declaração, `if` começa uma condicional, `{` começa um bloco. Um token de lookahead sempre basta, e é isso que torna esta gramática preditiva (LL(1)) no nível dos comandos.

**Análise de Pratt para as expressões.** Uma gramática pode codificar a precedência com uma regra por nível (`term`, `factor`, `unary` e assim por diante), e a descida recursiva pura precisaria de uma função por nível. A análise de Pratt as substitui por uma tabela de forças de ligação e um laço:

1. leia um operando (um literal, um nome, uma expressão entre parênteses ou um operador prefixo com seu operando);
2. enquanto o próximo operador ligar mais forte que o operador que espera à esquerda, consuma-o e leia seu operando direito recursivamente.

Em `1 + 2 * 3`, depois de ler `2` o parser vê `*`, que liga mais forte que o `+` em espera, então `*` fica com o `2`: a árvore é `1 + (2 * 3)`. Em `8 - 3 - 2`, o segundo `-` não liga mais forte que o primeiro, então o primeiro se fecha: `(8 - 3) - 2`, associatividade à esquerda. A atribuição pede uma unidade a menos do lado direito, o que a torna associativa à direita: `a = b = 1` é `a = (b = 1)`.

| Força de ligação | Operadores | Associatividade |
| --- | --- | --- |
| 1 | `=` | direita |
| 2 | `or` | esquerda |
| 3 | `and` | esquerda |
| 4 | `==` `!=` | esquerda |
| 5 | `<` `<=` `>` `>=` | esquerda |
| 6 | `+` `-` | esquerda |
| 7 | `*` `/` `%` | esquerda |
| 8 | unários `-` `!` | prefixo |
| 9 | chamada `f(...)` | pós-fixo |

## A árvore

A árvore sintática abstrata guarda o significado e descarta a pontuação. Parênteses, ponto e vírgula e chaves são necessários para ler o texto, mas, uma vez que a árvore existe, sua forma diz a mesma coisa. `(1 + 2) * 3` não tem nó para os parênteses: simplesmente tem `+` abaixo de `*`.

Todo nó registra a linha e a coluna do token que o define. O parser não precisa delas, mas o interpretador e a máquina virtual precisam, para dizer onde um erro de execução aconteceu.

## Recuperação de erros

Parar no primeiro erro obriga o programador a corrigir um erro por execução. Reportar tudo o que o parser confuso vê depois de um erro é pior, porque a maioria dessas mensagens é falsa. O parser usa o **modo pânico**: depois de um erro ele descarta tokens até um ponto de sincronização (logo depois de um `;`, ou logo antes de uma palavra-chave que começa um comando, ou de um `}`) e retoma dali. Cada erro real gera uma mensagem, e os comandos corretos ainda são devolvidos.

## Como rodar

```sh
./setup-unix-mini-language-parser.sh                                  # constrói e testa
docker compose run --rm ts-repl                                      # REPL: tokens e árvore de cada linha
docker compose run --rm ts-repl bun run repl ../examples/if.mini     # tokens e árvore de um arquivo
```

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-COMP-1.1 | gramática em EBNF, um programa de exemplo por construção | README do mini-projeto, `examples/` |
| MP-COMP-1.2 | testes cobrem todos os tipos de token, comentários e uma string não terminada | `ts/tests/lexer.test.ts` |
| MP-COMP-1.3 | `1 + 2 * 3` e `(1 + 2) * 3` geram árvores diferentes, um arquivo com dois erros reporta os dois | `ts/tests/parser.test.ts` |
| MP-COMP-1.4 | um comando inicia o REPL no Docker, sessão gravada no README | `docker compose run --rm ts-repl` |

## Tópicos relacionados do quiz

- `compilers` / `compiler-structure`
- `compilers` / `lexical-analysis`
- `compilers` / `syntax-analysis`
- `compilers` / `syntax-directed-translation`
