# b-tree-on-disk

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Uma árvore B guardada em um arquivo, um nó por página de 4096 bytes, com inserção (divisão de nó), busca e remoção (redistribuição e fusão), escrita em C++ e em Rust. Um pager conta cada página lida. Ela ensina por que bancos de dados e sistemas de arquivos usam árvores largas: o custo de uma busca em disco é o número de páginas lidas, e uma árvore larga lê 3 páginas onde uma árvore binária lê 16.

Explicação completa: [docs/pt/data-structures/b-tree-on-disk.md](../../../docs/pt/data-structures/b-tree-on-disk.md).

## Tópicos do quiz que ele demonstra

- `data-structures` / `binary-search-trees`: a propriedade de ordem generalizada para muitas chaves por nó, busca por descarte de subárvores, remoção pelo antecessor ou sucessor.
- `data-structures` / `avl-trees` e `data-structures` / `red-black-trees`: o mesmo objetivo, altura logarítmica garantida, alcançado por outro caminho: todas as folhas na mesma profundidade, com divisões e fusões em vez de rotações.
- `data-structures` / `binary-trees-and-traversals`: altura contra número de nós, e por que a altura é o que uma busca paga.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-b-tree-on-disk.sh        # Linux e macOS
./setup-windows-b-tree-on-disk.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem e roda checagem de formato, linter e testes em cada uma. Os testes levam cerca de 30 segundos por linguagem, porque montam uma árvore com um milhão de chaves pelo pager. Todos os arquivos são gravados em `/tmp` dentro do contêiner.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/pager.hpp`, `rust/src/pager.rs` | o arquivo visto como um vetor de páginas, com contadores de leitura e escrita |
| `cpp/btree.hpp`, `rust/src/btree.rs` | a árvore B: busca, inserção com divisão, remoção com redistribuição e fusão, verificador de invariantes, lista de páginas livres |
| `cpp/disk_bst.hpp`, `rust/src/disk_bst.rs` | uma árvore binária de busca no mesmo tipo de arquivo, para comparação |
| `cpp/workload.hpp`, `rust/src/workload.rs` | monta as duas estruturas com as mesmas chaves e mede as páginas lidas |
| `cpp/demo.cpp`, `rust/src/demo.rs` | a demo que imprime a tabela de comparação |
| `results/page-reads.md` | a tabela de comparação versionada |

As duas linguagens usam o mesmo layout de arquivo (inteiros little-endian em posições fixas) e os mesmos algoritmos.

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- **Básico**: divisões com grau mínimo 2, busca, troca de valor, remoção, e a árvore lida de volta depois de fechar e reabrir o arquivo.
- **100.000 operações aleatórias**, três vezes (grau mínimo 2, 3 e 85): toda inserção, remoção e busca é comparada com o mapa ordenado da linguagem, e as invariantes são conferidas a cada 5.000 operações e no fim: número legal de chaves por nó, chaves em ordem, todas as folhas na mesma profundidade, contagem de chaves igual à do cabeçalho. Depois todas as chaves são removidas (a árvore volta a ser uma folha vazia) e inseridas de novo duas vezes, para provar que as páginas liberadas são reaproveitadas.
- **Páginas lidas**: com 1.000.000 de chaves a árvore tem 3 níveis, e nenhuma de 10.000 buscas com sucesso e 10.000 buscas sem sucesso lê mais de 3 páginas.

## Demo: a tabela de comparação

```sh
docker compose run --rm cpp-test btree_demo
docker compose run --rm rust-test btree_demo
```

Imprime as páginas lidas por busca em uma árvore B e em uma árvore binária de busca em disco, com 1.000 a 1.000.000 de chaves. Passe um limite menor como primeiro argumento para uma execução mais rápida, por exemplo `btree_demo 100000`. A saída versionada é [results/page-reads.md](results/page-reads.md).
