# dynamic-programming

> English version: [README.md](README.md)

Três problemas clássicos (mochila 0-1, maior subsequência comum e troco), cada um resolvido três vezes: com recursão pura, com a mesma recursão mais um cache (memoização) e com laços que preenchem uma tabela (tabulação). As três versões calculam a mesma recorrência. O que muda é quantas vezes o mesmo subproblema é resolvido, e um contador de chamadas torna isso visível.

Item do plano: MP-ALG-2. Linguagens: TypeScript (referência) e Python. Texto completo: [docs/pt/algorithms/dynamic-programming.md](../../../docs/pt/algorithms/dynamic-programming.md).

## O que ensina

- Programação dinâmica se aplica quando os subproblemas se sobrepõem e a resposta ótima é montada a partir de respostas ótimas de subproblemas.
- A memoização mantém o código recursivo e acrescenta um cache. A tabulação elimina a recursão e preenche a tabela em uma ordem em que todo valor necessário já está lá.
- O custo passa a ser "número de subproblemas distintos vezes o trabalho de cada um": `n * W` na mochila, `m * n` na LCS, `valor * moedas` no troco.
- Uma regra gulosa não basta para o troco: com moedas 1, 3 e 4 ela paga 6 com três moedas, e a tabela encontra duas.

## Tópicos do quiz que demonstra

Área `algorithms`:

- `dynamic-programming` (subproblemas sobrepostos, memoização e tabulação, mochila, LCS, troco, contagem de chamadas)
- `greedy` (o sistema de moedas em que o guloso falha, e por que a mochila 0-1 precisa de tabela)
- `divide-and-conquer` (por que subproblemas sobrepostos tornam a recursão ingênua exponencial)

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-dynamic-programming.sh        # Linux e macOS
./setup-windows-dynamic-programming.ps1    # Windows
```

## Demo

Um comando imprime a tabela de cada problema sendo preenchida e, depois, as contagens de chamadas:

```sh
docker compose run --rm demo
```

```text
== 0-1 knapsack / mochila 0-1 ==
items (value, weight) / itens (valor, peso): (3,2) (4,3) (5,4) (6,5), capacity / capacidade 5
capacity w         0   1   2   3   4   5
no items           0   0   0   0   0   0
+ item (3,2)       0   0   3   3   3   3
+ item (4,3)       0   0   3   4   4   7
+ item (5,4)       0   0   3   4   5   7
+ item (6,5)       0   0   3   4   5   7
answer / resposta: 7 (items 1 and 2 / itens 1 e 2)

== longest common subsequence / maior subsequência comum ==
a = BANANA, b = ATANA
                       A   T   A   N   A
""                 0   0   0   0   0   0
+ B                0   0   0   0   0   0
+ A                0   1   1   1   1   1
+ N                0   1   1   1   2   2
+ A                0   1   1   2   2   3
+ N                0   1   1   2   3   3
+ A                0   1   1   2   3   4
answer / resposta: 4 (AANA)

== coin change / troco ==
coins / moedas: 1, 3, 4, amount / valor 6
amount v           0   1   2   3   4   5   6
after dp[0]        0
after dp[1]        0   1
after dp[2]        0   1   2
after dp[3]        0   1   2   1
after dp[4]        0   1   2   1   1
after dp[5]        0   1   2   1   1   2
after dp[6]        0   1   2   1   1   2   2
answer / resposta: 2 (3 + 3), greedy / guloso: 3 (4 + 1 + 1)

== calls of the recursive versions / chamadas das versões recursivas ==
problem      n       naive    memo     ratio
knapsack    20      734544    2380      309x
lcs         12      117808     198      595x
coins       30     2550408      86    29656x
```

Cada linha de uma tabela é um passo: ela é calculada só a partir das linhas acima (ou das células à esquerda). `docker compose run --rm python-demo` imprime as mesmas contagens de chamadas pela implementação em Python.

## Contador de chamadas

As versões recursivas recebem um contador que é incrementado a cada chamada, incluindo as que só consultam o cache. Os tamanhos de entrada documentados são 20 itens na mochila, duas strings de 12 letras na LCS e o valor 30 no troco. Nesses tamanhos a versão ingênua faz 309, 595 e 29.656 vezes mais chamadas que a memoizada. Um teste em cada linguagem exige que a razão seja de pelo menos 100, e o teste em Python também exige as contagens exatas da referência em TypeScript.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/knapsack.ts`, `lcs.ts`, `coin-change.ts` | Um arquivo por problema, com as versões ingênua, memoizada e tabulada |
| `ts/src/problems.ts` | Instâncias montadas a partir de um tamanho `n` e de uma semente, usadas por benchmark, demo e testes |
| `ts/src/demo.ts`, `ts/src/bench.ts` | Demo e entrada do benchmark |
| `python/dp.py`, `problems.py`, `demo.py`, `bench.py` | O mesmo em Python |
| `bench.json`, `results/` | Grade do benchmark e resultados versionados |
| `dashboard/` | Página estática que desenha `results/results.js` |

Instâncias: a mochila tem `n` itens com pesos de 1 a 20, valores de 1 a 100 e capacidade `5n`. A LCS compara duas strings de `n` letras sobre A, C, G, T. O troco forma o valor `n` com moedas 1, 3 e 4. Um gerador de Lehmer com semente fixa monta as instâncias, de forma idêntica nas duas linguagens.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

Cada linguagem confere respostas conhecidas, que as três versões concordam em 200 casos aleatórios de cada problema, e a razão entre as contagens de chamadas. Formatadores e linters:

```sh
./lint.sh                                                    # ruff, na imagem base de Python
bunx biome check projects/algorithms/dynamic-programming     # TypeScript, a partir da raiz do repositório
```

## Benchmark

```sh
bun run bench -- --project projects/algorithms/dynamic-programming
```

A grade roda as nove implementações com `n` = 8, 12, 16, 20, 100 e 500 nas duas linguagens, 3 execuções medidas após 1 de aquecimento, e escreve `results/`. Abra `dashboard/index.html` direto do disco para ver o gráfico.

Limites, para a execução inteira levar poucos minutos: `knapsack-naive` e `coins-naive` param em `n` = 20 e `lcs-naive` em `n` = 12, porque o número de chamadas delas cresce de forma exponencial. As versões memoizada e tabulada seguem até 500.

No `results/results.md`, compare a coluna `section` das três versões de um problema no mesmo `n`. A coluna `checksum` é a própria resposta, então checksums iguais em uma linha de TypeScript e em uma de Python mostram que as duas linguagens concordam.
