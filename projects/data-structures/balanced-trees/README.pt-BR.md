# balanced-trees

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Três árvores de busca com a mesma interface, escritas em C++ e em Java: uma árvore binária de busca sem balanceamento, uma árvore AVL e uma árvore rubro-negra. Ele ensina como uma árvore sem balanceamento degenera em lista quando as chaves chegam ordenadas, e como as rotações evitam isso. Uma página estática reproduz a inserção de uma sequência fixa e mostra cada rotação.

Explicação completa: [docs/pt/data-structures/balanced-trees.md](../../../docs/pt/data-structures/balanced-trees.md).

## Tópicos do quiz que ele demonstra

- `data-structures` / `binary-search-trees`: a propriedade de ordem, inserção, remoção em três casos, e a degeneração com chaves ordenadas.
- `data-structures` / `avl-trees`: fator de balanceamento, rotações simples e duplas, rebalanceamento depois de inserir e remover, limite de altura.
- `data-structures` / `red-black-trees`: as regras de cor, inserção como nó vermelho, troca de cores com tio vermelho, rotações com tio preto, comparação com a AVL.
- `data-structures` / `binary-trees-and-traversals`: altura, e o percurso em-ordem como teste da propriedade de busca.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-balanced-trees.sh        # Linux e macOS
./setup-windows-balanced-trees.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem e roda os testes em cada uma. A imagem de C++ confere o formato com o clang-format quando os testes rodam. A imagem de Java confere o formato com o Spotless (google-java-format) durante o build, que é a única etapa que precisa de rede, e compila com `javac -Xlint:all -Werror`.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/search_tree.hpp`, `java/src/SearchTree.java` | a interface comum: inserir, remover, contém, tamanho, altura, contador de rotações, verificação de invariante |
| `cpp/bst.hpp`, `java/src/Bst.java` | árvore sem balanceamento, escrita com laços para que uma árvore de 100.000 níveis não estoure a pilha de chamadas |
| `cpp/avl.hpp`, `java/src/AvlTree.java` | árvore AVL |
| `cpp/red_black.hpp`, `java/src/RedBlackTree.java` | árvore rubro-negra com sentinela NIL |
| `cpp/steps.hpp`, `java/src/Steps.java` | grava um quadro por mudança para o visualizador |
| `cpp/demo.cpp`, `java/src/Demo.java` | a demo: tabela de alturas e dados do visualizador |
| `dashboard/` | o visualizador estático de rotações |
| `results/heights.md` | tabela versionada de alturas e rotações |

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm java-test
```

- **Testes de propriedade**: para cada árvore e 3 sementes, 6.000 inserções, remoções e buscas aleatórias são comparadas com o conjunto ordenado da linguagem (`std::set`, `TreeSet`). A invariante da árvore é conferida depois de **cada** operação: ordem das chaves nas três, balanceamento e alturas guardadas na AVL, cor da raiz, nenhum par vermelho-vermelho e alturas negras iguais na rubro-negra.
- **Inserção ordenada de 100.000 chaves**: a árvore sem balanceamento chega à altura 100.000 com 0 rotações. A AVL chega à altura 17 e a rubro-negra à altura 31, as duas abaixo de 40. Depois metade das chaves é removida das árvores balanceadas e as invariantes continuam valendo.
- **Dados do visualizador**: os quadros gravados têm um quadro por chave inserida e exatamente um quadro por rotação contada.

Os programas em C++ e em Java produzem dados de visualizador e tabelas de altura idênticos byte a byte.

## Demo

```sh
docker compose run --rm cpp-test tree_demo heights
docker compose run --rm java-test java -cp /opt/classes Demo heights
```

Imprime a altura e o número de rotações das três árvores depois da inserção ordenada e da aleatória de 1.000 a 100.000 chaves. Saída versionada: [results/heights.md](results/heights.md).

## Visualizador de rotações

Abra `dashboard/index.html` em um navegador, direto do disco. Escolha uma árvore e use Next, Previous, Play ou o controle deslizante para reproduzir a inserção de 10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45. Cada rotação e cada troca de cores é um passo. A página usa um arquivo CSS versionado e nenhuma rede.

O arquivo de dados é gerado pela implementação e depois formatado com o Biome, como todo script do repositório:

```sh
docker compose run --rm cpp-test tree_demo steps > dashboard/steps.js
bunx biome format --write dashboard/steps.js
```

O `dashboard/tailwind.css` foi gerado a partir do `dashboard/input.css` com a CLI do Tailwind CSS 4.3.3 que o repositório instala para o `tools/scaffold`. Só é preciso gerar de novo quando as classes usadas pela página mudam.
