# Mapa de espalhamento do zero

> English version: [docs/en/data-structures/hash-map.md](../../en/data-structures/hash-map.md) · Versión en español: [docs/es/data-structures/hash-map.md](../../es/data-structures/hash-map.md)

Mini-projeto: [projects/data-structures/hash-map](../../../projects/data-structures/hash-map). Linguagens: C++, Rust, TypeScript. Tópico do quiz: `data-structures` / `hash-tables`.

## A ideia

Um mapa de espalhamento transforma a chave em um índice de vetor com uma função de espalhamento (hash), então a busca vai direto a uma posição em vez de procurar. Existem muito mais chaves possíveis do que posições, então duas chaves diferentes às vezes recebem o mesmo índice. Isso é uma **colisão**, e as duas formas clássicas de resolvê-la são as duas implementações deste mini-projeto.

## Encadeamento separado

Cada posição (balde) guarda uma lista encadeada com todas as entradas que caíram ali.

```text
balde 0: (8, h) -> (4, d)
balde 1: (5, e)
balde 2: vazio
balde 3: (7, g) -> (3, c)
```

- `put` percorre a lista procurando a chave e, quando ela é nova, liga um nó no início.
- `get` percorre a mesma lista.
- `remove` desliga um nó.

Uma colisão só deixa uma lista mais longa. O custo de uma operação é o tamanho da lista, que em média é o fator de carga.

## Endereçamento aberto com sondagem linear

Toda entrada mora no próprio vetor. Quando a posição dada pelo hash está ocupada, tenta-se a seguinte, depois a seguinte, dando a volta no fim.

```text
h(k) = k mod 7        inserir 10, 17, 24, 3

índice:  0    1    2    3    4    5    6
       [  ] [  ] [  ] [10] [17] [24] [ 3]
```

A busca segue a mesma sequência e para quando acha a chave ou uma posição **vazia**.

### Por que a remoção precisa de lápides

Posição vazia significa "nenhuma chave passou por aqui". Se remover o 10 simplesmente esvaziasse o índice 3, uma busca pelo 17 começaria no índice 3, o encontraria vazio e responderia, errado, "não existe". Por isso a remoção grava uma **lápide** (tombstone): as buscas passam por cima dela, e uma inserção pode reaproveitá-la.

Lápides continuam alongando toda sondagem. As implementações contam as lápides junto com as entradas vivas, e reconstruir a tabela (rehash) joga todas fora.

## Fator de carga e rehashing

O fator de carga é o número de entradas dividido pelo número de posições. Quando ele passa de um limite (por padrão, 0,75 no encadeamento e 0,5 na sondagem) a tabela dobra, e todas as entradas são inseridas de novo, porque o índice `hash % capacidade` depende da capacidade. Um rehash custa O(n), mas dobrar torna isso raro o bastante para a inserção continuar O(1) amortizado.

Para uma busca que falha, o trabalho esperado é:

| Fator de carga | Encadeamento (entradas examinadas) | Sondagem linear (posições examinadas) |
| ---: | ---: | ---: |
| 0,25 | 0,25 | 1,4 |
| 0,5 | 0,5 | 2,5 |
| 0,75 | 0,75 | 8,5 |
| 0,9 | 0,9 | 50,5 |

O encadeamento cresce de forma linear. A sondagem linear segue aproximadamente (1 + 1/(1 - a)^2) / 2, porque as posições ocupadas se juntam em blocos longos (**agrupamento primário**): uma chave que cai em qualquer ponto de um bloco precisa caminhar até o fim dele, e o deixa maior.

## O que os testes provam

- Os **testes de propriedade** rodam 20.000 operações aleatórias por semente no nosso mapa e no mapa da linguagem, e comparam cada resposta. Um hash fraco (`chave % 4`) força colisões em quase toda operação.
- **Redimensionamento**: o fator de carga nunca passa do limite durante 10.000 inserções.
- **Lápides**: com três chaves que colidem, um `get` depois de remover e inserir devolve o valor certo.

## O que o benchmark mostra

`bun run bench -- --project hash-map` monta tabelas com cargas 0,25, 0,5, 0,75 e 0,9 com 200.000 chaves e cronometra 400.000 buscas, metade delas de chaves ausentes. A tabela versionada é [results/results.md](../../../projects/data-structures/hash-map/results/results.md).

Na execução versionada, as buscas da sondagem linear com carga 0,9 levaram entre 3 e 4,5 vezes mais tempo do que com carga 0,5 nas três linguagens, enquanto o encadeamento ficou dentro do ruído da máquina. Diferenças menores que o desvio padrão, que é grande abaixo da carga 0,75 em uma máquina compartilhada, não são conclusões. Com cargas baixas, a tabela maior custa mais faltas de cache, e por isso "mais vazia" nem sempre é mais rápida.

## Como rodar

```sh
cd projects/data-structures/hash-map
./setup-unix-hash-map.sh          # ou ./setup-windows-hash-map.ps1
```
