# graph-algorithms

> English version: [README.md](README.md)

Uma pequena biblioteca de grafos, escrita em C++ e em Go, com duas representações intercambiáveis (lista de adjacência e matriz de adjacência) e os algoritmos clássicos sobre elas: Dijkstra, Bellman-Ford, ordenação topológica, Prim e Kruskal. Ela ensina que o algoritmo depende da interface do grafo, não de como o grafo é guardado, e quanto custa cada representação.

Explicação completa: [docs/pt/data-structures/graph-algorithms.md](../../../docs/pt/data-structures/graph-algorithms.md).

## Tópicos do quiz que ele demonstra

- `data-structures` / `graphs`: lista de adjacência e matriz de adjacência, seus custos de memória e de operação, ordem de percurso, detecção de ciclo em grafos dirigidos, ordenação topológica.
- `data-structures` / `heaps-and-priority-queues`: o heap de mínimo que conduz Dijkstra, Prim e a ordenação topológica.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-graph-algorithms.sh        # Linux e macOS
./setup-windows-graph-algorithms.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem e roda checagem de formato, linter e testes em cada uma. Os dez casos de referência são montados como somente leitura a partir de `reference-cases/`, então rode a partir de um checkout completo do repositório.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/graph.hpp`, `go/graph.go` | a interface `Graph`, `AdjacencyList` e `AdjacencyMatrix` |
| `cpp/algorithms.hpp`, `go/algorithms.go` | Dijkstra, Bellman-Ford, ordenação topológica, caminhos mínimos em DAG, Prim, Kruskal, union-find |
| `go/heap.go` | o heap binário de mínimo usado pelos algoritmos em Go |
| `cpp/cases.hpp`, `go/cases.go` | leitor e solucionador dos arquivos de caso de referência |
| `cpp/cli.cpp`, `go/cmd/graphcli` | linha de comando: resolver um caso, imprimir um caminho |
| `cpp/bench.cpp`, `go/cmd/bench` | programas de benchmark que seguem o contrato do repositório |
| `cases/sample-path.in` | um pequeno grafo com pesos para o comando `path` |
| `results/`, `dashboard/` | resultados versionados do benchmark e a página estática que os desenha |

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm go-test
```

- **Uma suíte, duas representações**: as mesmas verificações rodam na lista e na matriz (distâncias e caminhos conhecidos, pesos negativos, ciclo negativo avisado, ciclo avisado pela ordenação topológica, menor ordenação topológica, árvore geradora mínima, grafo desconexo).
- **Grafos aleatórios**: em 200 grafos aleatórios, Dijkstra, Bellman-Ford e o algoritmo para DAG concordam entre si, Prim concorda com Kruskal, e a lista concorda com a matriz.
- **Casos de referência**: os 10 arquivos `.in`/`.out` do trabalho da disciplina. A lista de adjacência resolve os 10. A matriz resolve os 6 cujo grafo tem no máximo 4.096 vértices (casos 1, 2, 3, 6, 7 e 8) e recusa os outros 4, que pediriam até 10^10 células.

## Demo: um comando por caso

```sh
docker compose run --rm cpp-test graph_cli case /cases/1.in
docker compose run --rm go-test graphcli case /cases/8.in matrix
docker compose run --rm go-test graphcli path /samples/sample-path.in 0 4
```

`case` imprime a resposta no formato do arquivo `.out`. `path` imprime a distância e o caminho, por exemplo `distance: 2` e `path: 0 -> 2 -> 1 -> 3 -> 4`.

## Benchmark

```sh
bun run bench -- --project graph-algorithms
```

Rode a partir da raiz do repositório. Cada linha cronometra um algoritmo em um grafo conexo gerado com n vértices e cerca de 8n arcos, para n = 1.000 e n = 4.000 (o limite da matriz é 4.096 vértices, e o teto mantém a execução curta em uma máquina compartilhada). C++ e Go usam o mesmo gerador e a mesma semente, e o `checksum` de cada linha é igual nas duas linguagens. Resultados: [results/results.md](results/results.md), página: `dashboard/index.html`.
