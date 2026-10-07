# Árvores de busca balanceadas

> English version: [docs/en/data-structures/balanced-trees.md](../../en/data-structures/balanced-trees.md)

Mini-projeto: [projects/data-structures/balanced-trees](../../../projects/data-structures/balanced-trees). Linguagens: C++, Java. Tópicos do quiz: `data-structures` / `binary-search-trees`, `avl-trees`, `red-black-trees`.

## O problema

Uma árvore binária de busca responde "esta chave está aqui?" indo para a esquerda ou para a direita em cada nó, então toda operação custa a altura da árvore. Com n chaves a altura pode ser qualquer coisa entre cerca de log2(n) e n, e a árvore simples não faz nada para controlá-la: uma chave nova vira folha onde a busca por ela termina.

Quando as chaves chegam já ordenadas, cada uma é maior que todas as outras e vai para a direita da última. A árvore vira uma lista encadeada:

```
inserir 10, 20, 30, 40         uma árvore balanceada com as mesmas chaves

10                                   20
  \                                 /  \
   20                             10    30
     \                                    \
      30                                   40
        \
         40
```

## A ferramenta: rotação

Uma rotação troca os papéis de um nó e de um dos seus filhos, mudando três ponteiros:

```
      x                 y
     / \               / \
    A   y     -->     x   C        rotação à esquerda em x
       / \           / \
      B   C         A   B
```

Lidas da esquerda para a direita, as duas árvores dizem A, x, B, y, C. A ordem das chaves não muda, então o resultado continua sendo uma árvore de busca, mas um lado ficou mais baixo e o outro mais alto. Árvores balanceadas são árvores de busca comuns mais uma regra que diz quando girar.

## Árvore AVL

Regra: em todo nó, as alturas das duas subárvores diferem em no máximo 1.

Cada nó guarda a sua altura. Depois de uma inserção ou remoção, os nós do caminho de volta à raiz são conferidos. O fator de balanceamento é a altura direita menos a altura esquerda, e um nó em +2 ou -2 é consertado:

- **caso de fora** (o neto alto está do lado de fora): uma rotação,
- **caso de dentro** (um zigue-zague): duas rotações, primeiro no filho, para alinhar o caminho, depois no nó.

A altura fica abaixo de cerca de 1,44 log2(n).

## Árvore rubro-negra

Regras: todo nó é vermelho ou preto, a raiz é preta, as folhas NIL são pretas, um nó vermelho não tem filho vermelho, e todo caminho de um nó até as folhas abaixo dele tem o mesmo número de nós pretos. O caminho mais longo tem então no máximo o dobro do mais curto, e a altura fica abaixo de 2 log2(n + 1).

Uma chave nova entra vermelha, o que nunca altera uma contagem de pretos. Se o pai também é vermelho, o tio decide:

- **tio vermelho**: só as cores mudam (pai e tio pretos, avô vermelho) e a verificação sobe dois níveis,
- **tio preto**: uma ou duas rotações com troca de cores, e o conserto termina.

A regra é mais frouxa que a da AVL, então a árvore pode ser mais alta, e em troca as atualizações reestruturam menos.

## O que os testes provam

- Nas três árvores, a invariante vale depois de cada uma de 18.000 operações aleatórias, e toda resposta bate com o conjunto ordenado da linguagem.
- Inserção ordenada de 100.000 chaves: altura 100.000 na árvore sem balanceamento, 17 na AVL e 31 na rubro-negra.

## As medições

Tabela versionada: [results/heights.md](../../../projects/data-structures/balanced-trees/results/heights.md).

| Chaves | Ordem | Altura da ABB | Altura da AVL | Rotações da AVL | Altura da rubro-negra | Rotações da rubro-negra |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 100.000 | ordenada | 100.000 | 17 | 99.983 | 31 | 99.969 |
| 100.000 | aleatória | 41 | 20 | 70.164 | 20 | 58.528 |

Com chaves aleatórias a árvore simples é só cerca de duas vezes mais alta que as balanceadas. O balanceamento é um seguro contra a ordem de chegada, que a árvore não escolhe. O preço é pequeno: cerca de uma rotação por inserção no pior caso, cada uma em O(1).

## O visualizador

O `dashboard/index.html` abre direto do disco e reproduz a inserção de 10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45 nas três árvores, uma mudança por passo. Para essa sequência a árvore sem balanceamento termina com 7 níveis, e a AVL e a rubro-negra terminam com 4 níveis depois de 8 rotações cada. Os nós ficam sempre na mesma coluna (a posição em-ordem), então uma rotação aparece como dois nós trocando de nível.

## Como rodar

```sh
cd projects/data-structures/balanced-trees
./setup-unix-balanced-trees.sh          # ou ./setup-windows-balanced-trees.ps1
docker compose run --rm cpp-test tree_demo heights
```
