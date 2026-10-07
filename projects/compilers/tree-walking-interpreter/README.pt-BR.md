# tree-walking-interpreter

> English version: [README.md](README.md)

Um interpretador que executa a mini linguagem percorrendo sua árvore sintática. Ensina **como uma árvore é executada**: um ambiente por escopo, escopo estático como uma cadeia de ambientes, funções como closures que lembram onde foram criadas, e erros de execução que apontam linha e coluna.

Este é o segundo passo da trilha de compiladores. A linguagem, sua gramática e seu front end vêm do [mini-language-parser](../mini-language-parser) (MP-COMP-1), e os mesmos programas são compilados para bytecode pelo [bytecode-vm](../bytecode-vm) (MP-COMP-3).

Explicação completa: [docs/pt/compilers/tree-walking-interpreter.md](../../../docs/pt/compilers/tree-walking-interpreter.md).

## Tópicos do quiz que ele demonstra

- `compilers` / `compiler-structure`: compilador contra interpretador, escopo estático contra dinâmico, ambientes.
- `compilers` / `run-time-environments`: ativações, acesso a nomes não locais, por que closures precisam de ambientes que sobrevivem à chamada.
- `compilers` / `interpreters-vms-jit`: interpretação por caminhamento na árvore e de onde vem o seu custo.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-tree-walking-interpreter.sh        # Linux e macOS
./setup-windows-tree-walking-interpreter.ps1    # Windows
```

O script constrói a imagem e roda os testes. Depois:

```sh
docker compose run --rm ts-repl                                           # REPL
docker compose run --rm ts-repl bun run mini ../examples/closures.mini    # executa um programa
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/interpreter.ts` | valores, ambientes, closures e o avaliador, um caso por nó da árvore |
| `ts/src/session.ts` | analisa, executa e coleta saída e erros; mantém o estado entre trechos de código |
| `ts/src/cli.ts` | o REPL e o modo de um arquivo |
| `ts/src/frontend/` | lexer, parser e árvore do MP-COMP-1 |
| `examples/` | os programas de exemplo (`.mini`) e a saída que cada um deve imprimir (`.out`) |

TypeScript na imagem fixada `oven/bun:1.4.2`, sem dependências.

**Uma definição de linguagem, copiada.** Um mini-projeto precisa ser construído sozinho, então `ts/src/frontend/` e `examples/*.mini` são cópias dos arquivos do `mini-language-parser`, não imports. A gramática é definida lá. Este projeto acrescenta os arquivos `examples/*.out`, e o `bytecode-vm` copia ambos para provar que imprime o mesmo.

## O que a linguagem faz em tempo de execução

| Assunto | Regra |
| --- | --- |
| Valores | números (ponto flutuante de 64 bits), strings, booleanos, `nil`, funções |
| Verdade | apenas `false` e `nil` são falsos; `0` e `""` são verdadeiros |
| `+` | dois números, ou duas strings (concatenação) |
| `-` `*` `/` `%` `<` `<=` `>` `>=` | apenas números; dividir por zero é um erro |
| `==` `!=` | quaisquer dois valores; valores de tipos diferentes nunca são iguais |
| `and` `or` | curto-circuito, e o resultado é o operando que decidiu |
| Escopo | estático: `let` e `fn` declaram no bloco atual, declarações internas sombreiam as externas |
| Funções | valores de primeira classe e closures; uma função sem `return` devolve `nil` |
| Recursão | no máximo 200 chamadas aninhadas, depois o erro `stack overflow` |

## Testes

```sh
docker compose run --rm ts-test
```

Os testes executam toda a suíte de exemplos contra as saídas esperadas, e cobrem escopos, escopo estático, closures, `if`, `while`, curto-circuito, e os erros de execução com sua linha e coluna: variável indefinida, número errado de argumentos, divisão por zero, tipos de operando errados, chamada de algo que não é função e recursão sem limite.

## Demo: o REPL mantém o estado

Toda linha roda na mesma sessão, então uma função definida em uma linha pode ser chamada em uma linha posterior. Uma linha com uma única expressão também mostra o seu valor. Uma sessão gravada:

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

`square` e `side` foram definidos nas duas primeiras linhas e continuam lá no fim, depois de três linhas que falharam. `counter` mostra uma closure em ação: a variável `n` pertence a uma chamada de `makeCounter` que já retornou, e continua viva porque `next` segura o ambiente dela.
