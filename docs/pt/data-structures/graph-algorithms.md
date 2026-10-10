# Algoritmos em grafos

> English version: [docs/en/data-structures/graph-algorithms.md](../../en/data-structures/graph-algorithms.md) · Versión en español: [docs/es/data-structures/graph-algorithms.md](../../es/data-structures/graph-algorithms.md)

Mini-projeto: [projects/data-structures/graph-algorithms](../../../projects/data-structures/graph-algorithms). Linguagens: C++, Go. Tópico do quiz: `data-structures` / `graphs`.

## A ideia

Um grafo é um conjunto de vértices e um conjunto de arestas entre eles. Antes de qualquer algoritmo existe uma decisão de projeto: como guardá-lo. Este mini-projeto define uma interface pequena (`número de vértices`, `adicionar arco`, `existe arco`, `vizinhos`), implementa essa interface duas vezes e escreve todos os algoritmos contra ela. A mesma suíte de testes roda depois nas duas implementações.

## Duas representações

```text
arcos: 0->1 (4), 0->2 (1), 2->1 (2)

lista de adjacência          matriz de adjacência
0: (1, 4) (2, 1)                  0    1    2
1:                           0    -    4    1
2: (1, 2)                    1    -    -    -
                             2    -    2    -
```

| Operação | Lista de adjacência | Matriz de adjacência |
| --- | --- | --- |
| Memória | O(V + E) | O(V^2) |
| O arco (u, v) existe? | O(grau de u) | O(1) |
| Vizinhos de u | O(grau de u) | O(V) |
| Visitar todos os arcos | O(V + E) | O(V^2) |
| Arcos paralelos | todos ficam | só o mais leve |

A lista serve bem a grafos esparsos, que são o caso comum. A matriz compensa quando o grafo é denso ou quando o teste de arco domina. O limite de vértices dela aqui é 4.096: uma matriz para os 100.000 vértices dos casos de referência 4 e 5 pediria 10^10 células.

## Os algoritmos

| Algoritmo | Problema | Ideia | Custo com lista |
| --- | --- | --- | --- |
| Dijkstra | caminhos mínimos a partir de uma origem, sem peso negativo | finalizar o vértice não finalizado mais próximo, tirado de um heap de mínimo | O((V + E) log V) |
| Bellman-Ford | caminhos mínimos com pesos negativos | relaxar todos os arcos V - 1 vezes | O(V E) |
| Ordenação topológica (Kahn) | uma ordem em que todo arco aponta para a frente | listar um vértice quando sua contagem de entradas chega a zero | O((V + E) log V) com o heap |
| Caminhos mínimos em DAG | caminhos mínimos em grafo acíclico | relaxar na ordem topológica, uma vez | O(V + E) |
| Prim | árvore geradora mínima | fazer uma árvore crescer com a aresta mais leve que sai dela | O(E log V) |
| Kruskal | árvore geradora mínima | pegar as arestas da mais leve para a mais pesada, pulando as que fecham ciclo (union-find) | O(E log E) |

### O que significa "avisar"

- **Dijkstra** recusa um grafo com peso negativo, porque a escolha gulosa deixaria de ser segura.
- **Bellman-Ford** marca `negative cycle` quando mais uma rodada de relaxamento ainda melhora uma distância. Com um ciclo assim, "caminho mínimo" perde o sentido.
- **A ordenação topológica** marca `has cycle` quando menos de V vértices puderam ser listados. Um vértice que está em um ciclo, ou que depende de um ciclo, nunca chega à contagem de entradas zero. A ordem parcial é devolvida mesmo assim.
- **Prim e Kruskal** marcam `connected` como falso quando o grafo tem mais de um componente.

## Os dez casos de referência

Os casos vêm de um trabalho da disciplina e têm dois tipos de problema.

1. **Menor ordenação topológica** (casos 1 a 5). Os vértices prontos esperam em um heap de mínimo, então o menor rótulo sai sempre primeiro. Os casos 4 e 5 são grafos aleatórios de 100.000 vértices que contêm ciclos: 79 e 28 vértices, respectivamente, não podem ser ordenados, e a saída esperada lista só os demais. A biblioteca avisa do ciclo e imprime a ordem parcial, o que confere com os arquivos esperados.
2. **Empacotar objetos em caixas** (casos 6 a 10). n objetos, em ordem, vão para exatamente k caixas de volume V, e o custo é a soma dos quadrados da sobra de cada caixa. O problema é resolvido como caminho mínimo em um grafo acíclico em camadas: o vértice (j, i) significa "j caixas fechadas, i objetos guardados". É a mesma conta da tabela de programação dinâmica, vista como um grafo.

As duas linguagens passam nos 10 casos com a lista de adjacência. A matriz passa nos 6 casos que cabem no limite de vértices dela.

## O que o benchmark mostra

`bun run bench -- --project graph-algorithms` roda cada algoritmo em grafos gerados com 1.000 e 4.000 vértices e cerca de 8 arcos por vértice. A tabela versionada é [results/results.md](../../../projects/data-structures/graph-algorithms/results/results.md).

Na execução versionada, com 4.000 vértices, o Dijkstra na matriz levou cerca de 15 vezes mais tempo do que na lista nas duas linguagens (coluna `section`), e o processo usou cerca de 129 MiB em vez de 5 MiB. O grafo e a resposta são os mesmos: a coluna de checksum é idêntica para lista e matriz, e para C++ e Go. Tempos de poucos milissegundos têm ruído em uma máquina compartilhada, então só razões grandes como essa são conclusões.

## Como rodar

```sh
cd projects/data-structures/graph-algorithms
./setup-unix-graph-algorithms.sh          # ou ./setup-windows-graph-algorithms.ps1
docker compose run --rm cpp-test graph_cli case /cases/1.in
```
