# regex-engine

> English version: [README.md](README.md)

Um motor de expressões regulares construído do jeito dos livros-texto, em Go. Ensina **como uma expressão regular vira um autômato**: o padrão é analisado em uma árvore, a árvore vira um autômato não determinístico (construção de Thompson), e este vira um determinístico (construção de subconjuntos). Um casador ingênuo por backtracking está incluído apenas para mostrar o que os autômatos evitam.

Explicação completa: [docs/pt/compilers/regex-engine.md](../../../docs/pt/compilers/regex-engine.md).

## Tópicos do quiz que ele demonstra

- `compilers` / `lexical-analysis`: expressões regulares, AFN e AFD, construção de Thompson, fecho épsilon, construção de subconjuntos, o custo de simular um AFN contra executar um AFD, explosão do backtracking.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-regex-engine.sh        # Linux e macOS
./setup-windows-regex-engine.ps1    # Windows
```

O script constrói a imagem e roda a checagem do formatador, o `go vet`, o linter e os testes. Depois:

```sh
docker compose run --rm regex match "(a|b)*abb" babb      # os três motores, com contagem de passos
docker compose run --rm regex dot nfa "(a|b)*abb"         # o AFN em Graphviz DOT
docker compose run --rm regex dot dfa "(a|b)*abb"         # o AFD em Graphviz DOT
```

```text
pattern "(a|b)*abb", input "babb"
tree: (cat (cat (cat (star (alt a b)) a) b) b)
NFA: 14 states, DFA: 5 states
nfa           match=true  steps=31
dfa           match=true  steps=4
backtracking  match=true  steps=29
```

## O que um padrão pode conter

| Sintaxe | Significado |
| --- | --- |
| `a` | o byte `a` |
| `.` | qualquer byte |
| `[abc]`, `[a-z0-9]`, `[^,]` | um byte de uma classe, com intervalos e negação |
| `AB` | concatenação |
| `A\|B` | alternância |
| `A*`, `A+`, `A?` | zero ou mais, um ou mais, zero ou um |
| `(A)` | agrupamento |
| `\.` | o caractere seguinte como literal |

Precedência, da mais fraca à mais forte: alternância, concatenação, repetição. O casamento é sempre da entrada **inteira**, e o motor trabalha com bytes.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `go/regex/parser.go` | padrão para árvore, com precedência e erros de sintaxe |
| `go/regex/nfa.go` | construção de Thompson, fecho épsilon, simulação do AFN |
| `go/regex/dfa.go` | construção de subconjuntos, classes de bytes, casamento pelo AFD |
| `go/regex/backtrack.go` | o casador ingênuo por backtracking usado na comparação |
| `go/regex/dot.go` | exportação dos dois autômatos para Graphviz DOT |
| `go/cmd/regex-engine/` | o comando: `match`, `dot`, `bench` |
| `results/` | resultados de benchmark versionados |

Go na imagem fixada `golang:1.27.1-bookworm`, apenas biblioteca padrão. O linter é o golangci-lint 2.14.0, da sua imagem fixada.

## Testes

```sh
docker compose run --rm go-test
```

- **Parser**: precedência conferida na forma da árvore, classes e escapes, e treze padrões inválidos com a posição e a mensagem de cada erro.
- **Teste diferencial**: 1.000 casos gerados (200 padrões aleatórios, 5 entradas cada, semente fixa) recebem do AFN, do AFD e do casador por backtracking a mesma resposta que recebem do `regexp` do Go. Na suíte versionada 684 casos casam e 316 não.
- **Autômatos**: número de estados contado a partir das regras de construção, a exportação DOT, e um padrão cujo AFD precisa de 2^14 estados e é recusado com um erro enquanto o AFN continua respondendo.
- **Caso patológico**: a contagem de passos prova que o backtracking pelo menos dobra a cada letra a mais enquanto os autômatos crescem de forma exatamente linear.

## Benchmark: o padrão patológico

```sh
bun run bench -- --project projects/compilers/regex-engine    # a partir da raiz do repositório
```

O padrão é `(a*)*b` e a entrada são `n` letras `a`, sem nenhum `b`, então nada casa. Um casador por backtracking só descobre isso depois de tentar todas as formas de dividir as letras entre os dois asteriscos. Os passos são contados pelos motores e não dependem da máquina. Os tempos são o trecho medido de [`results/results.md`](results/results.md), onde estão registrados a máquina, a versão do Go e os comandos.

| n | Passos do backtracking | Backtracking (ms) | Passos do AFN | AFN (ms) | Passos do AFD | AFD (ms) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 6.143 | 0,03 | 60 | < 0,01 | 10 | < 0,01 |
| 15 | 196.607 | 1,43 | 90 | < 0,01 | 15 | < 0,01 |
| 20 | 6.291.455 | 48,8 | 120 | < 0,01 | 20 | < 0,01 |
| 25 | 201.326.591 | 1.240 | 150 | < 0,01 | 25 | < 0,01 |
| 1.000 | não executado | não executado | 6.000 | 0,03 | 1.000 | < 0,01 |
| 100.000 | não executado | não executado | 600.000 | 5,99 | 100.000 | 0,23 |
| 1.000.000 | não executado | não executado | 6.000.000 | 44,5 | 1.000.000 | 2,74 |

O backtracking leva `3 · 2^(n+1) − 1` passos: cinco letras a mais multiplicam o trabalho por 32, e 25 letras já custam mais de um segundo. Ele não foi executado além de 25, porque 1.000 letras exigiriam mais de 10^301 passos. O AFN leva 6 passos por letra e o AFD leva 1, então um milhão de letras custa milissegundos.
