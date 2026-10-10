# Cache LRU, filtro de Bloom e trie

> English version: [docs/en/data-structures/lru-bloom-trie.md](../../en/data-structures/lru-bloom-trie.md) · Versión en español: [docs/es/data-structures/lru-bloom-trie.md](../../es/data-structures/lru-bloom-trie.md)

Mini-projeto: [projects/data-structures/lru-bloom-trie](../../../projects/data-structures/lru-bloom-trie). Linguagens: TypeScript, Go. Tópicos do quiz: `data-structures` / `arrays-and-lists`, `hash-tables`, `binary-trees-and-traversals`.

Três estruturas, cada uma a resposta padrão para uma pergunta que sistemas reais fazem o tempo todo.

| Pergunta | Estrutura | Custo |
| --- | --- | --- |
| A cache encheu. O que eu jogo fora? | Cache LRU | O(1) por `get` e `put` |
| Esta chave com certeza não existe, para eu poder pular a consulta cara? | Filtro de Bloom | O(k) por operação, poucos bits por chave |
| Quais palavras começam com estas letras? | Trie | O(tamanho do prefixo + tamanho da resposta) |

## Cache LRU

LRU significa least recently used (menos recentemente usada): quando a cache está cheia, é descartada a entrada que está há mais tempo sem ser lida nem gravada. Duas estruturas são combinadas:

```text
mapa:       chave -> nó                     (acha um nó em O(1))

lista:      mais nova <-> ... <-> ... <-> mais antiga
            todo get ou put move o seu nó para a frente
            o descarte remove o nó do fim
```

A lista precisa ser **duplamente** encadeada. Um `get` chega a um nó no meio da lista pelo mapa e precisa desligá-lo. Desligar exige o anterior do nó, e só um ponteiro `previous` entrega isso sem percorrer a lista. Com lista simplesmente encadeada, o `get` seria O(n).

A versão em TypeScript mantém as pontas `newest` e `oldest` explícitas. A versão em Go fecha a lista em um anel com um nó sentinela, o que elimina os casos especiais do primeiro e do último nó. As duas passam no mesmo teste de propriedade contra um modelo de referência.

## Filtro de Bloom

Um filtro de Bloom é um conjunto que não guarda chaves, só um vetor de m bits.

- `add(chave)`: k funções de espalhamento escolhem k posições, e esses bits passam a valer 1.
- `mightContain(chave)`: as mesmas k posições são lidas. Qualquer 0 significa **com certeza não foi adicionada**. Todos 1 significa **provavelmente foi adicionada**.

Os bits nunca são desligados, então uma chave adicionada é sempre reconhecida: **não há falsos negativos**. Uma chave que nunca foi adicionada pode encontrar os seus k bits ligados por outras chaves: isso é um **falso positivo**, e a probabilidade dele depois de n chaves é

```text
p = (1 - e^(-k n / m))^k
```

Para uma taxa p desejada, o melhor tamanho é m = -n ln p / (ln 2)^2 bits e o melhor número de funções é k = (m / n) ln 2. Cerca de 10 bits por chave e 7 funções dão 1%.

As k posições saem de dois hashes combinados como h1 + i * h2 (hash duplo), o que se comporta como k funções independentes.

Uso típico: na frente de algo caro, como uma leitura de disco ou uma chamada de rede. Se o filtro diz "não", a etapa cara é pulada com certeza. Se diz "sim", a consulta de verdade roda e resolve a dúvida.

Medido na execução versionada (200.000 sondagens que nunca foram adicionadas):

| Bits | Funções | Chaves | Teoria | Medido (Go) | Medido (TypeScript) | Falsos negativos |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 200.000 | 7 | 20.000 | 0,82% | 0,81% | 0,83% | 0 |
| 100.000 | 3 | 10.000 | 1,74% | 1,75% | 1,71% | 0 |
| 64.000 | 2 | 16.000 | 15,48% | 15,52% | 15,60% | 0 |
| 150.000 | 5 | 30.000 | 10,09% | 10,11% | 10,27% | 0 |

## Trie

Uma trie é uma árvore em que cada aresta é um caractere, então cada caminho a partir da raiz soletra um prefixo.

```text
(raiz)
  c
  └─ a
     ├─ r *          car
     │  ├─ d *       card
     │  └─ e *       care
     └─ t *          cat

* marca o fim de uma palavra
```

Palavras com o mesmo começo dividem os primeiros nós. Para listar todas as palavras com um prefixo, a busca desce pelos caracteres do prefixo e depois recolhe a subárvore abaixo, em profundidade. O custo é o tamanho do prefixo mais o tamanho da resposta, seja qual for o número de palavras guardadas. Um filtro linear precisa olhar todas as palavras.

Um nó pode ser o fim de uma palavra e o meio de outras mais longas ("car" dentro de "card"), então o fim de palavra é uma marca explícita.

## O que os testes provam

- **LRU**: a ordem de descarte bate com um modelo de referência depois de cada uma de 40.000 operações aleatórias (capacidades de 1 a 8).
- **Filtro de Bloom**: nenhum falso negativo, e a taxa de falsos positivos medida fica a menos de 20% da fórmula em quatro configurações.
- **Trie**: sobre 100.000 palavras, a busca por prefixo devolve o mesmo conjunto que um filtro linear para 305 prefixos.

## Como rodar

```sh
cd projects/data-structures/lru-bloom-trie
./setup-unix-lru-bloom-trie.sh          # ou ./setup-windows-lru-bloom-trie.ps1
docker compose run --rm go-test lbt_demo
```
