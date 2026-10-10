# Motor de regex

> English version: [docs/en/compilers/regex-engine.md](../../en/compilers/regex-engine.md) · Versión en español: [docs/es/compilers/regex-engine.md](../../es/compilers/regex-engine.md)

Mini-projeto MP-COMP-4, em [`projects/compilers/regex-engine`](../../../projects/compilers/regex-engine). Ensina como uma expressão regular vira um autômato. Este é o maquinário por trás de um gerador de analisadores léxicos: o lexer escrito à mão do [MP-COMP-1](mini-language-parser.md) é um autômato desses, codificado manualmente.

## Três formas do mesmo padrão

```text
texto do padrão --análise--> árvore --Thompson--> AFN --construção de subconjuntos--> AFD
```

Cada forma responde "este texto casa?", e cada uma é mais barata de executar e mais cara de construir do que a anterior.

## A árvore

Um padrão tem a sua própria pequena gramática, com três níveis de precedência:

```text
alternation   = concatenation { "|" concatenation }      mais fraca
concatenation = { repetition }
repetition    = atom { "*" | "+" | "?" }                 mais forte
atom          = literal | "." | class | "(" alternation ")"
```

Assim, `ab|cd*` é `(ab)|(c(d*))`. O parser em `go/regex/parser.go` é de descida recursiva, com uma função por regra, e reporta padrões inválidos (`*a`, `(ab`, `[z-a]`) com a posição do problema.

## Construção de Thompson: da árvore ao AFN

Um autômato finito não determinístico (AFN) pode ter várias transições para o mesmo byte e **transições épsilon**, que são tomadas sem ler nada. A construção tem uma regra pequena por tipo de nó da árvore, e toda regra produz um fragmento com uma entrada e uma saída, de modo que os fragmentos se encaixam:

```text
a      (s) --a--> (f)
AB     A.exit --ε--> B.entry
A|B    (s) --ε--> A.entry, B.entry        A.exit, B.exit --ε--> (f)
A*     (s) --ε--> A.entry, (f)            A.exit --ε--> A.entry, (f)
A+     (s) --ε--> A.entry                 A.exit --ε--> A.entry, (f)
A?     (s) --ε--> A.entry, (f)            A.exit --ε--> (f)
```

Um nó acrescenta no máximo dois estados, então o AFN tem o tamanho do padrão: `(a|b)*abb` gera 14 estados. Nesta implementação a concatenação une dois fragmentos com uma transição épsilon e não acrescenta estado.

## Simulando o AFN

"Não determinístico" não significa chutar. A simulação mantém o **conjunto** de todos os estados em que o autômato poderia estar:

1. comece com o fecho épsilon do estado inicial (todo estado alcançável apenas por ε);
2. para cada byte da entrada, siga esse byte a partir de cada estado do conjunto e tome o fecho épsilon do resultado;
3. aceite quando o conjunto final contiver o estado de aceitação.

Um conjunto contém cada estado no máximo uma vez, então um byte custa no máximo o tamanho do padrão. O total é O(n · m) para uma entrada de n bytes e um padrão de tamanho m: linear na entrada para qualquer padrão.

## Construção de subconjuntos: do AFN ao AFD

Os conjuntos visitados pela simulação dependem apenas do padrão, não da entrada. A construção de subconjuntos calcula todos com antecedência e faz de cada conjunto um estado de um autômato determinístico (AFD):

1. o estado inicial do AFD é o fecho épsilon do estado inicial do AFN;
2. para um conjunto ainda não processado e cada byte, calcule o conjunto para o qual a simulação iria: essa é a transição;
3. um conjunto nunca visto vira um novo estado do AFD, e o processo se repete até não sobrar nenhum;
4. um estado do AFD aceita quando seu conjunto contém o estado de aceitação do AFN.

Casar passa a ser uma consulta à tabela por byte, O(n), sem depender do padrão. Para `(a|b)*abb` o AFD tem 5 estados.

Dois detalhes práticos em `go/regex/dfa.go`:

- **Classes de bytes.** Bytes que nenhuma parte do padrão distingue recebem uma coluna compartilhada na tabela de transições, então `[a-z]` não custa 26 colunas.
- **O preço.** Um estado do AFD é um conjunto de estados do AFN, então um AFN com m estados pode precisar de até 2^m estados no AFD. "O 14º byte a partir do fim é um `a`" realmente precisa de 2^14. A construção para com um erro em 10.000 estados, e o AFN continua utilizável. Essa é a troca clássica: o AFN é pequeno e mais lento, o AFD é rápido e pode ser enorme.

## Por que não backtracking

Muitas bibliotecas de regex casam tentando um caminho e voltando quando ele falha. Isso permite extras como retrovisores (backreferences), mas a mesma posição da entrada pode ser explorada repetidas vezes por cadeias diferentes de escolhas. Com `(a*)*b` e uma entrada de n letras `a`, todas as formas de cortar a sequência em pedaços são tentadas: `3 · 2^(n+1) − 1` passos em `go/regex/backtrack.go`.

| n | Passos do backtracking | Passos do AFN | Passos do AFD |
| ---: | ---: | ---: | ---: |
| 10 | 6.143 | 60 | 10 |
| 20 | 6.291.455 | 120 | 20 |
| 25 | 201.326.591 | 150 | 25 |
| 1.000.000 | não executado | 6.000.000 | 1.000.000 |

Os autômatos não conseguem explodir desse jeito, porque um conjunto não pode conter o mesmo estado duas vezes. Os tempos, com a máquina e as versões, estão em `results/results.md` do mini-projeto. Um padrão como esse em um serviço que aceita entrada de usuários é um risco de negação de serviço conhecido como ReDoS, e casar com autômatos é a defesa estrutural. Este projeto mede apenas os seus próprios motores, localmente.

## Vendo os autômatos

`regex-engine dot nfa <padrão>` e `regex-engine dot dfa <padrão>` imprimem o autômato na linguagem DOT do Graphviz, como texto. Cada estado do AFD é rotulado com o conjunto de estados do AFN que ele representa, o que torna visível a construção de subconjuntos.

## Conferindo com um motor real

O parser e os três casadores são comparados com o pacote `regexp` do Go em 1.000 casos gerados: árvores de padrão aleatórias sobre um alfabeto pequeno, escritas de volta como texto e analisadas pelo parser real, com metade das entradas construídas para casar e metade aleatórias. O próprio `regexp` é baseado em autômatos, então é um oráculo confiável para padrões regulares.

## Como rodar

```sh
./setup-unix-regex-engine.sh                                   # constrói, checa formato, vet, lint, testes
docker compose run --rm regex match "(a|b)*abb" babb           # os três motores, com passos
docker compose run --rm regex dot dfa "(a|b)*abb"              # exportação do autômato
bun run bench -- --project projects/compilers/regex-engine     # benchmark, a partir da raiz do repositório
```

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-COMP-4.1 | testes cobrem precedência e padrões inválidos | `go/regex/parser_test.go` |
| MP-COMP-4.2 | os casamentos concordam com o `regexp` do Go em 1.000 casos gerados | `TestAgreesWithStandardLibraryOn1000GeneratedCases` em `go/regex/engine_test.go` |
| MP-COMP-4.3 | exportação do autômato, e o motor permanece linear onde o backtracking é exponencial, mostrado em uma tabela | `go/regex/dot.go`, `go/regex/pathological_test.go`, a tabela no README e `results/results.md` |

## Tópicos relacionados do quiz

- `compilers` / `lexical-analysis`
