# Programação dinâmica

> English version: [docs/en/algorithms/dynamic-programming.md](../../en/algorithms/dynamic-programming.md)

Mini-projeto: [`projects/algorithms/dynamic-programming`](../../../projects/algorithms/dynamic-programming/README.pt-BR.md) (MP-ALG-2). Linguagens: TypeScript e Python. Quiz: área `algorithms`, tópico `dynamic-programming`.

## A ideia

Alguns problemas se quebram em problemas menores que se repetem. A recursão pura resolve cada repetição de novo, e o número de chamadas explode. A programação dinâmica resolve cada subproblema distinto uma vez e guarda a resposta. Ela precisa de duas propriedades:

- **Subproblemas sobrepostos**: o mesmo subproblema é alcançado por muitos caminhos.
- **Subestrutura ótima**: a melhor resposta é montada a partir das melhores respostas de subproblemas.

Há duas formas de escrevê-la, e as duas calculam a mesma recorrência:

| | Memoização | Tabulação |
| --- | --- | --- |
| Direção | de cima para baixo | de baixo para cima |
| Código | a recursão, mais um cache | laços preenchendo uma tabela |
| Subproblemas resolvidos | só os alcançados | todos |
| Risco | recursão profunda | escolher uma ordem de preenchimento errada |
| Truque de memória | nenhum | guardar só as linhas ainda necessárias |

## Os três problemas

| Problema | Subproblema | Recorrência | Custo |
| --- | --- | --- | --- |
| Mochila 0-1 | `best(i, w)`: melhor valor com os itens `i..` e capacidade `w` | `max(pular, valor[i] + best(i + 1, w - peso[i]))` | `O(n · W)` |
| Maior subsequência comum | `lcs(i, j)`: resposta para os sufixos `a[i..]`, `b[j..]` | coincide: `1 + lcs(i + 1, j + 1)`, senão `max(lcs(i + 1, j), lcs(i, j + 1))` | `O(m · n)` |
| Troco | `coins(v)`: menor número de moedas para o valor `v` | `1 + min(coins(v - c))` sobre as moedas `c ≤ v` | `O(valor · moedas)` |

Cada um é implementado três vezes: ingênua (recursão pura), memoizada e tabulada. A versão ingênua é a especificação. Os testes exigem que as outras duas devolvam a mesma resposta em 200 casos aleatórios por problema.

## O que o contador de chamadas mostra

O tempo depende da máquina. O número de chamadas depende só do algoritmo, então é a evidência mais limpa de trabalho repetido. Nos tamanhos documentados:

| Problema | Tamanho | Chamadas da ingênua | Chamadas da memoizada | Razão |
| --- | ---: | ---: | ---: | ---: |
| Mochila | 20 itens | 734.544 | 2.380 | 309 |
| LCS | 12 letras cada | 117.808 | 198 | 595 |
| Troco | valor 30 | 2.550.408 | 86 | 29.656 |

A contagem da memoizada inclui as chamadas que só consultam o cache. TypeScript e Python imprimem exatamente as mesmas contagens, porque as duas montam as mesmas instâncias a partir da mesma semente.

## A tabela, passo a passo

`docker compose run --rm demo` imprime cada tabela enquanto ela é preenchida. Para o troco com moedas 1, 3 e 4 e valor 6:

```text
amount v           0   1   2   3   4   5   6
after dp[6]        0   1   2   1   1   2   2
```

`dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2`, a resposta `3 + 3`. A regra gulosa "maior moeda primeiro" paga `4 + 1 + 1`, três moedas. A tabela não cai nessa armadilha, porque tenta todas as moedas para cada valor.

## Benchmark

`bun run bench -- --project projects/algorithms/dynamic-programming` roda as nove implementações nas duas linguagens. Resultados: [`results/results.md`](../../../projects/algorithms/dynamic-programming/results/results.md).

Trecho medido em milissegundos, da execução versionada (92 linhas):

| Implementação | n | TypeScript | Python |
| --- | ---: | ---: | ---: |
| `knapsack-naive` | 20 | 12,3 | 183 |
| `knapsack-memo` | 20 | 3,69 | 1,56 |
| `knapsack-tab` | 20 | 1,48 | 0,36 |
| `knapsack-memo` | 500 | 30,9 | 2.116 |
| `knapsack-tab` | 500 | 24,6 | 377 |
| `lcs-naive` | 12 | 5,74 | 45,7 |
| `lcs-memo` | 500 | 8,50 | 261 |
| `lcs-tab` | 500 | 15,2 | 57,6 |
| `coins-naive` | 20 | 8,28 | 9,77 |
| `coins-tab` | 500 | 0,45 | 0,13 |

Como ler:

- As versões ingênuas já são as mais lentas com `n` = 20 ou 12, e param aí. As versões memoizada e tabulada chegam a 500 porque o custo delas é polinomial.
- Em Python, a tabulação é 5 vezes mais rápida que a memoização na mochila com 500 itens (377 ms contra 2.116 ms): o mesmo número de subproblemas, sem uma chamada de função e uma consulta a dicionário para cada um.
- Cada linha é uma execução a frio. O TypeScript roda em um compilador JIT, então em entradas que levam um milissegundo ele ainda está aquecendo e pode ficar mais lento que o Python. Nas entradas maiores ele é várias vezes mais rápido.
- A coluna `checksum` é a resposta. As 92 linhas concordam: para cada problema e tamanho, as três versões e as duas linguagens imprimem o mesmo valor.

## Para experimentar

- Mude a mochila para guardar só uma linha e percorrer as capacidades em ordem crescente. Um item passa a ser contado mais de uma vez: a tabela virou a mochila com repetição.
- Aumente o tamanho da LCS da versão ingênua de 12 para 16 e observe o número de chamadas.
- Use moedas 2 e 4 com um valor ímpar: as três versões precisam responder `-1`.
