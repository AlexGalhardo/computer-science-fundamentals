# Árvore B em disco

> English version: [docs/en/data-structures/b-tree-on-disk.md](../../en/data-structures/b-tree-on-disk.md)

Mini-projeto: [projects/data-structures/b-tree-on-disk](../../../projects/data-structures/b-tree-on-disk). Linguagens: C++, Rust. Tópicos do quiz: `data-structures` / `binary-search-trees`, `avl-trees`, `red-black-trees`.

## O problema

Em memória, seguir um ponteiro custa nanossegundos, então o custo de uma árvore de busca é o número de comparações. Em disco, os dados são lidos em **páginas** (aqui, 4096 bytes), e buscar uma página custa milhares de vezes mais do que comparar chaves que já estão na memória. O custo de uma busca passa a ser o número de páginas lidas.

Uma árvore binária balanceada com um milhão de chaves tem cerca de 20 níveis. Se cada nó mora em uma página diferente, uma busca lê cerca de 20 páginas. A árvore B resolve isso fazendo cada nó ter o tamanho de uma página.

## A estrutura

Um nó guarda muitas chaves em ordem, e um filho entre cada par de chaves:

```
                  [ 30 | 60 ]
                 /     |     \
     [ 10 | 20 ]   [ 40 | 50 ]   [ 70 | 80 | 90 ]
```

Com grau mínimo t:

- todo nó, menos a raiz, tem entre t - 1 e 2t - 1 chaves,
- um nó interno com k chaves tem k + 1 filhos,
- as chaves de um nó estão ordenadas, e o filho i guarda só chaves entre a chave i - 1 e a chave i,
- **todas as folhas estão na mesma profundidade**.

Neste mini-projeto cabem em uma página 169 chaves, 169 valores e 170 números de página de filhos, então t = 85. Um milhão de chaves cabe em 3 níveis.

## O arquivo

| Página | Conteúdo |
| --- | --- |
| 0 | cabeçalho: número mágico, grau mínimo, página da raiz, quantidade de chaves, altura, início da lista de páginas livres |
| qualquer outra | um nó, ou uma página livre que guarda o número da próxima página livre |

Os filhos são **números de página**, não endereços de memória. Um ponteiro não significa nada depois que o programa termina, um número de página vale enquanto o arquivo existir. O **pager** é o único código que mexe no arquivo, e conta cada página lida e gravada. Ele não tem cache de propósito: um nó visitado é uma página lida.

## As operações

**A busca** lê uma página por nível, faz busca binária nas chaves dentro dela e segue um filho.

**A inserção** desce uma única vez. Antes de entrar em um filho cheio ela o **divide** (split): a chave do meio sobe para o pai e metade das chaves vai para uma página nova.

```
antes:  pai [ 50 ]               filho [ 10 | 20 | 30 ]  (cheio, t = 2)
depois: pai [ 20 | 50 ]          filhos [ 10 ] e [ 30 ]
```

Quando a própria raiz está cheia, ela é dividida sob uma raiz nova. Esse é o único jeito de a árvore ficar mais alta, e ele deixa todas as folhas um nível mais fundas ao mesmo tempo.

**A remoção** também desce uma única vez. Antes de entrar em um filho com só t - 1 chaves, ela o reabastece:

- **redistribuição**: um irmão com chaves sobrando empresta uma por meio do pai (a chave do pai desce, a chave do irmão sobe),
- **fusão** (merge): quando nenhum irmão pode emprestar, o filho, um irmão e a chave do pai que fica entre eles viram um nó só, e uma página é liberada.

Uma chave achada em um nó interno é trocada pelo seu antecessor ou sucessor, que está em uma folha, e é esse que acaba removido. Quando a raiz fica sem chaves, o único filho dela vira a raiz e a árvore fica um nível mais baixa.

As páginas liberadas vão para uma lista encadeada dentro do arquivo e são reaproveitadas antes de o arquivo crescer.

## O que os testes provam

- 100.000 operações aleatórias com grau mínimo 2, 3 e 85 dão as mesmas respostas que o mapa ordenado da linguagem, e depois delas as invariantes valem: número de chaves por nó, ordem, mesma profundidade das folhas.
- Com 1.000.000 de chaves a árvore tem 3 níveis e nenhuma busca, com ou sem sucesso, lê mais de 3 páginas.

## A comparação

As mesmas chaves entram em uma árvore binária de busca guardada no mesmo tipo de arquivo (128 nós por página, em ordem de chegada). Resultado versionado: [results/page-reads.md](../../../projects/data-structures/b-tree-on-disk/results/page-reads.md).

| Chaves | Níveis da árvore B | Páginas por busca na árvore B (média / máx.) | Altura da ABB (nós) | Páginas por busca na ABB (média / máx.) |
| ---: | ---: | ---: | ---: | ---: |
| 1.000 | 2 | 1,99 / 2 | 25 | 3,26 / 7 |
| 10.000 | 2 | 1,99 / 2 | 33 | 7,33 / 18 |
| 100.000 | 3 | 2,99 / 3 | 41 | 11,90 / 26 |
| 1.000.000 | 3 | 2,99 / 3 | 50 | 16,46 / 34 |

São contagens, não tempos, e os programas em C++ e em Rust imprimem a mesma tabela. A árvore binária aqui não é balanceada (altura 50 para um milhão de chaves aleatórias). Uma perfeitamente balanceada ainda teria cerca de 20 nós de altura, e economizaria só os primeiros níveis, que dividem uma página. O ganho da árvore B vem da largura do nó, não de um balanceamento melhor.

## Limites desta implementação

- O arquivo da ABB é montado em memória e gravado de uma vez. Só as buscas dela rodam contra o arquivo.
- Não há cache, log de escrita antecipada (write-ahead log) nem controle de concorrência. Uma queda no meio de uma divisão pode deixar o arquivo inconsistente. Bancos de dados de verdade acrescentam essas camadas sobre a mesma estrutura.

## Como rodar

```sh
cd projects/data-structures/b-tree-on-disk
./setup-unix-b-tree-on-disk.sh          # ou ./setup-windows-b-tree-on-disk.ps1
docker compose run --rm cpp-test btree_demo
```
