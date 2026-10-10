# O limite inferior da ordenação por comparação

> English version: [docs/en/big-o/sorting-lower-bound.md](../../en/big-o/sorting-lower-bound.md) · Versión en español: [docs/es/big-o/sorting-lower-bound.md](../../es/big-o/sorting-lower-bound.md)

Mini-projeto MP-BIGO-3, em [`projects/big-o/sorting-lower-bound`](../../../projects/big-o/sorting-lower-bound). Ele ensina por que nenhuma ordenação por comparação supera Ω(n lg n) e como as ordenações por contagem escapam disso.

## O argumento

Uma ordenação por comparação só aprende sobre a entrada perguntando "a é menor que b?". Cada execução dela é um caminho em uma **árvore de decisão**: cada comparação é um nó, cada resposta é um ramo, e a ordem final é uma folha.

1. n elementos distintos podem chegar em n! ordens, e cada ordem exige uma reorganização diferente. Logo a árvore precisa de pelo menos **n! folhas**.
2. Uma árvore binária de altura h tem no máximo 2^h folhas.
3. Portanto 2^h ≥ n!, isto é, **h ≥ lg(n!)**. A altura é o número de comparações do pior caso, e é um número inteiro, então o pior caso é pelo menos ⌈lg(n!)⌉.
4. lg(n!) = lg 1 + lg 2 + ... + lg n é Θ(n lg n).

O limite é uma afirmação sobre o problema, não sobre um algoritmo.

## O gerador de árvores de decisão

`ts/src/decision-tree.ts` não desenha uma árvore à mão: ele descobre a árvore de uma ordenação de verdade. O algoritmo roda sobre itens de ordem desconhecida, e o comparador repete uma lista de respostas. Quando o algoritmo faz mais uma pergunta, a execução para, a pergunta vira um nó, e o algoritmo roda de novo para "sim" e para "não". Um ramo que nenhuma ordem de entrada alcança fica vazio.

| Algoritmo | n | folhas | altura | ⌈lg n!⌉ |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 3 | 6 | 3 | 3 |
| merge sort | 4 | 24 | 5 | 5 |
| heapsort | 4 | 24 | 7 | 5 |
| quicksort | 4 | 24 | 6 | 5 |

Toda ordenação correta tem exatamente n! folhas alcançáveis. O merge sort atinge a altura mínima para n = 3 e n = 4. Heapsort e quicksort são corretos, porém mais altos, e o próprio merge sort deixa de ser ótimo em n = 5 (8 comparações no pior caso contra um limite de 7): o limite diz o que é impossível, não que um dado algoritmo o alcança.

## O que o limite promete, e o que não promete

Conferir todas as permutações para n até 8 mostra os três casos lado a lado:

| Algoritmo | n | melhor | média | pior | lg n! | ⌈lg n!⌉ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| merge sort | 5 | 5 | 7,17 | 8 | 6,91 | 7 |
| heapsort | 5 | 9 | 10,95 | 12 | 6,91 | 7 |
| quicksort | 5 | 6 | 7,40 | 10 | 6,91 | 7 |

O **pior caso** nunca fica abaixo de ⌈lg n!⌉ e a **média** nunca fica abaixo de lg n!. O **melhor caso** pode ficar: o merge sort ordena algumas entradas de 5 elementos com 5 comparações. Em Python, o `sorted` em 1.000 chaves já em ordem faz 999 comparações, contra lg(1000!) ≈ 8.529.

Isso importa para ler o critério de aceite "as comparações contadas nunca ficam abaixo de lg(n!) em 1.000 entradas aleatórias". Ele vale, e os testes o conferem, mas como uma observação sobre entradas aleatórias de n = 1.000, em que a contagem se concentra perto da média. Não é uma consequência do teorema para cada entrada isolada.

## 1.000 entradas aleatórias de n = 1.000

Permutações aleatórias de 0..999 a partir de uma semente fixa, lg(1000!) = 8.529,40:

| Algoritmo | mín. de comparações | média | máx. | mín. / lg n! |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 8.654 | 8.708,4 | 8.762 | 1,015 |
| heapsort | 16.758 | 16.854,7 | 16.945 | 1,965 |
| quicksort | 9.664 | 11.003,2 | 13.515 | 1,133 |
| counting sort | 0 | 0 | 0 | 0 |
| radix sort | 0 | 0 | 0 | 0 |

O merge sort fica a menos de 2% do limite. O heapsort faz cerca do dobro das comparações, porque descer um item custa duas por nível. Os cinco algoritmos ordenaram as 1.000 entradas.

## Como counting sort e radix sort escapam

Eles nunca comparam dois elementos. O counting sort usa a chave como índice em um vetor de contadores, em Θ(n + k) para chaves em [0, k). O radix sort aplica um counting sort estável a cada dígito, em Θ(d·(n + k)). Um algoritmo que não funciona por comparações não é descrito por uma árvore de decisão, então o teorema não diz nada sobre ele. O preço é a generalidade: essas ordenações só servem para chaves que são inteiros pequenos ou que podem ser cortadas em dígitos.

## Por que existe uma versão em Python

Em TypeScript a comparação é uma função passada para as nossas próprias ordenações, e o counting sort faz zero comparações por construção. O Python permite um experimento mais forte. `python/lower_bound.py` define uma classe `Key` que sobrecarrega `<`, `<=`, `>`, `>=` e `==`, então **toda** comparação entre duas chaves é contada, inclusive as feitas dentro do `sorted` embutido (Timsort). Counting sort e radix sort rodam sobre as mesmas chaves e seu contador fica em zero: a afirmação é medida, não suposta. Os inteiros ilimitados do Python também dão ⌈lg n!⌉ exatamente, como o número de bits de n! − 1.

| Algoritmo (Python, n = 1.000, 1.000 entradas) | mín. de comparações | média | máx. |
| --- | ---: | ---: | ---: |
| merge sort | 8.650 | 8.708,14 | 8.756 |
| sorted() (Timsort) | 8.620 | 8.657,43 | 8.701 |
| counting sort | 0 | 0 | 0 |
| radix sort | 0 | 0 | 0 |

As entradas diferem das do TypeScript porque cada linguagem usa seu próprio gerador com semente.

## Como rodar

```sh
cd projects/big-o/sorting-lower-bound
docker compose run --rm ts-test
docker compose run --rm python-test
docker compose run --rm ts-demo        # results/results.md e results.json
docker compose run --rm python-demo    # results/results-python.md
```

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-BIGO-3.1 | a árvore tem n! folhas e sua altura é igual a ⌈lg(n!)⌉, para n = 3 e 4 | `ts/tests/decision-tree.test.ts` (merge sort) |
| MP-BIGO-3.2 | as comparações contadas nunca ficam abaixo de lg(n!) em 1.000 entradas aleatórias | `ts/tests/experiment.test.ts`, `results/results.md` |
| MP-BIGO-3.3 | counting e radix sort ordenam as mesmas entradas com zero comparações entre elementos, na mesma tabela | `ts/tests/experiment.test.ts`, `python/test_lower_bound.py`, `results/` |

## Tópicos do quiz relacionados

`big-o` / `sorting-lower-bound`, `asymptotic-notation` e `best-worst-average-case`.
