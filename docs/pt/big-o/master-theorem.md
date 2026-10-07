# Teorema mestre interativo

> English version: [docs/en/big-o/master-theorem.md](../../en/big-o/master-theorem.md)

Mini-projeto MP-BIGO-2, em [`projects/big-o/master-theorem`](../../../projects/big-o/master-theorem). Ele ensina como os três casos do teorema mestre decidem o custo de uma recorrência.

## A recorrência

Um algoritmo de divisão e conquista divide um problema de tamanho n em `a` subproblemas de tamanho `n/b`, e faz `f(n)` de trabalho fora das chamadas recursivas (dividir e combinar):

```
T(n) = a·T(n/b) + f(n)        a ≥ 1, b > 1
```

O merge sort é `2T(n/2) + n`, a busca binária é `T(n/2) + 1`, e a multiplicação de matrizes de Strassen é `7T(n/2) + n²`.

## Uma comparação, três casos

A árvore de recursão tem `a^i` chamadas na profundidade `i`, cada uma sobre uma entrada de tamanho `n/b^i`. Suas folhas são `n^(log_b a)`. O teorema compara `f(n)` com esse número:

| Caso | Condição | Quem paga a conta | Solução |
| --- | --- | --- | --- |
| 1 | f(n) é polinomialmente menor que n^(log_b a) | as folhas | Θ(n^(log_b a)) |
| 2 | f(n) tem a mesma ordem de n^(log_b a) | todos os níveis, igualmente | Θ(n^(log_b a) · log n) |
| 3 | f(n) é polinomialmente maior que n^(log_b a) | a raiz | Θ(f(n)) |

"Polinomialmente" significa por um fator `n^ε` para algum ε > 0. O caso 3 também exige a condição de regularidade `a·f(n/b) ≤ c·f(n)` com `c < 1`, que sempre vale para as funções usadas aqui.

## Quando o teorema não se aplica

O classificador informa duas situações em vez de inventar uma resposta:

- **Fora das hipóteses**: `a < 1` ou `b ≤ 1`, por exemplo uma recorrência que subtrai em vez de dividir. A entrada é rejeitada com a hipótese que ela quebra.
- **Na lacuna entre os casos**: `f(n)` difere de `n^(log_b a)` só por um fator logarítmico, como em `2T(n/2) + n log n`. Os três casos básicos não dizem nada. Para uma potência positiva do logaritmo, a ferramenta também mostra o que o caso 2 estendido fornece (mais um fator log, aqui Θ(n log² n)). Para `n / log n` ele não fornece solução.

`f(n)` fica restrita a `n^d · (log n)^k`, que cobre as recorrências usuais dos livros.

## A conferência empírica

Uma previsão vale mais quando pode falhar. `ts/src/empirical.ts` gera a função recursiva que a recorrência descreve, roda essa função sem memoização e conta suas chamadas e seu trabalho total `W(n)`. Se o teorema prevê Θ(g(n)), a razão `W(n) / g(n)` precisa se estabilizar em uma constante.

A conferência mede a **deriva** dessa razão entre os dois maiores tamanhos, para a classe prevista e para suas duas vizinhas (um fator log a menos, um a mais). O crescimento medido concorda quando a classe prevista tem deriva abaixo de 5% e menor que a das duas vizinhas. Resultados, de [`results/results.md`](../../../projects/big-o/master-theorem/results/results.md):

| Recorrência | Previsto | Maior n | Chamadas | Deriva prevista / um log a menos / um log a mais |
| --- | --- | ---: | ---: | --- |
| merge sort, 2T(n/2) + n | Θ(n log n) | 65.536 | 131.071 | 0,0039 / 0,0625 / 0,0662 |
| busca binária, T(n/2) + 1 | Θ(log n) | 16.777.216 | 25 | 0,0017 / 0,0417 / 0,0433 |
| divisão em 7, 7T(n/2) + n² | Θ(n^2,81) | 128 | 960.800 | 0,0087 / 0,1768 / 0,1354 |

São contagens, não tempos, então são iguais em qualquer máquina.

## A árvore de recursão

`bun run classify` imprime a árvore como texto, e a página estática a desenha: as chamadas de cada nível à esquerda, e uma barra com o custo total do nível à direita. Barras que crescem para baixo são o caso 1, barras iguais são o caso 2, e barras que diminuem são o caso 3. O último nível são os casos base, que custam 1 cada.

A página oferece `a` de 1 a 9, `b` de 2 a 4 e oito funções f(n). Toda combinação foi classificada pelo código TypeScript testado e gravada em `results/results.js`, então a página nunca reimplementa o teorema.

## Como rodar

```sh
cd projects/big-o/master-theorem
docker compose run --rm ts-test                          # testes
docker compose run --rm ts-demo                          # bun run demo
docker compose run --rm ts-demo bun run classify 7 2 2   # uma recorrência
```

Depois abra `dashboard/index.html` direto do disco.

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-BIGO-2.1 | os testes unitários cobrem uma recorrência por caso e uma que não se encaixa | `ts/tests/classify.test.ts` |
| MP-BIGO-2.2 | o crescimento medido concorda com a classe prevista para merge sort, busca binária e uma divisão em 7 | `ts/tests/empirical.test.ts`, `results/results.md` |
| MP-BIGO-2.3 | um comando imprime o caso e a página desenha a árvore para o a e o b escolhidos | `bun run classify`, `dashboard/index.html` |

## Tópicos do quiz relacionados

`big-o` / `recurrences-master-theorem`.
