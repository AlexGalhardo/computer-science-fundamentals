# sorting-lower-bound

> English version: [README.md](README.md)

Ensina **por que nenhuma ordenação por comparação supera Ω(n lg n) e como as ordenações por contagem escapam disso**. Um gerador constrói a árvore de decisão de um algoritmo de ordenação de verdade, contadores de comparações medem merge sort, heapsort e quicksort contra lg(n!), e counting sort e radix sort ordenam as mesmas entradas sem uma única comparação entre elementos.

Explicação completa: [docs/pt/big-o/sorting-lower-bound.md](../../../docs/pt/big-o/sorting-lower-bound.md).

## Tópicos do quiz que ele demonstra

- `big-o` / `sorting-lower-bound`: árvores de decisão, n! folhas, a altura ⌈lg n!⌉ e as ordenações que ficam fora do modelo de comparação.
- `big-o` / `asymptotic-notation`: lg(n!) é Θ(n lg n).
- `big-o` / `best-worst-average-case`: o limite fala do pior caso e da média, não de toda entrada.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-sorting-lower-bound.sh        # Linux e macOS
./setup-windows-sorting-lower-bound.ps1    # Windows
```

O script constrói as duas imagens, roda os testes e roda as demos.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/sorts.ts` | merge sort, heapsort e quicksort que recebem a comparação como função |
| `ts/src/decision-tree.ts` | constrói a árvore de decisão de qualquer uma dessas ordenações para n pequeno |
| `ts/src/linear-sorts.ts` | counting sort e radix sort |
| `ts/src/experiment.ts` | lg(n!), todas as permutações de entradas pequenas, 1.000 entradas aleatórias |
| `ts/src/demo.ts` | `bun run demo`: imprime a árvore e as tabelas, grava `results/` |
| `python/lower_bound.py` | o mesmo experimento com uma classe de chave que sobrecarrega os operadores de comparação |
| `python/demo.py` | `python demo.py`: imprime as tabelas, grava `results/results-python.md` |
| `results/` | resultados versionados: `results.md`, `results.json`, `results-python.md` |

TypeScript é a implementação de referência (`oven/bun:1.4.2`). O Python (`python:3.14.8-slim-trixie`) está aqui porque a lição muda: a sobrecarga de operadores conta as comparações feitas dentro do `sorted` embutido, que não podemos editar, e prova que o counting sort não faz nenhuma. Nenhuma das implementações tem dependências de execução.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

O serviço do Python também roda `ruff check` e `ruff format --check`.

## Demo

```sh
docker compose run --rm ts-demo        # bun run demo
docker compose run --rm python-demo    # python demo.py
```

A demo em TypeScript desenha a árvore de decisão do merge sort para n = 3 e imprime três tabelas: as árvores para n = 3 e 4, todas as permutações para n até 8, e 1.000 entradas aleatórias de n = 1.000 com as ordenações por comparação ao lado do counting sort e do radix sort. Não há dashboard: as tabelas em [`results/results.md`](results/results.md) são o resultado.
