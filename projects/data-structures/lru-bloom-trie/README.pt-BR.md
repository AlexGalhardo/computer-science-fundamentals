# lru-bloom-trie

> English version: [README.md](README.md)

Três estruturas pequenas que ficam por trás de sistemas do dia a dia, escritas em TypeScript e em Go: uma **cache LRU** com `get` e `put` em O(1) (o que uma cache faz quando enche), um **filtro de Bloom** com tamanho e número de funções de espalhamento configuráveis (um teste de pertinência com poucos bits por chave, com falsos positivos e sem falsos negativos), e uma **trie** (busca por prefixo, como no autocompletar).

Explicação completa: [docs/pt/data-structures/lru-bloom-trie.md](../../../docs/pt/data-structures/lru-bloom-trie.md).

## Tópicos do quiz que ele demonstra

- `data-structures` / `arrays-and-lists`: a lista duplamente encadeada, e por que a cache LRU precisa dos dois ponteiros para desligar um nó em O(1).
- `data-structures` / `hash-tables`: o mapa de espalhamento da chave para o nó na cache, e funções de espalhamento usadas para escolher bits no filtro de Bloom.
- `data-structures` / `binary-trees-and-traversals`: a trie é uma árvore com muitos filhos por nó, listada com um percurso em profundidade.
- `data-structures` / `abstract-data-types`: cada estrutura é testada contra um modelo de referência simples que tem a mesma interface.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-lru-bloom-trie.sh        # Linux e macOS
./setup-windows-lru-bloom-trie.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem e roda os testes em cada uma. A imagem de Go também roda `gofmt`, `go vet` e `golangci-lint`. O TypeScript é formatado e analisado com o Biome e tem os tipos conferidos a partir da raiz do repositório: `bunx biome check projects/data-structures/lru-bloom-trie` e `bunx tsc --noEmit -p projects/data-structures/lru-bloom-trie/ts`.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/lru-cache.ts`, `go/lru.go` | cache LRU: mapa de espalhamento mais lista duplamente encadeada |
| `ts/src/bloom-filter.ts`, `go/bloom.go` | filtro de Bloom: vetor de bits, hash duplo, fórmulas de dimensionamento |
| `ts/src/trie.ts`, `go/trie.go` | trie: inserção, busca exata, listagem por prefixo em ordem alfabética |
| `ts/src/words.ts`, `go/words.go` | gerador determinístico das 100.000 palavras de teste |
| `ts/demo.ts`, `go/cmd/demo` | a demo |
| `results/demo-output.md` | saída versionada da demo |

Não há dependências em nenhuma das duas linguagens.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm go-test
```

- **Cache LRU**: para capacidades de 1 a 8, 5.000 operações aleatórias de `get` e `put` cada são comparadas com um modelo de referência (uma lista simples mantida em ordem de uso). O valor devolvido, a chave descartada e a ordem inteira das chaves precisam bater depois de cada operação.
- **Filtro de Bloom**: quatro configurações, de 4 a 10 bits por chave. Nenhuma chave adicionada é dada como ausente, e a taxa de falsos positivos medida com 200.000 chaves que nunca foram adicionadas fica a menos de 20% da taxa teórica (1 - e^(-kn/m))^k. Na execução versionada a diferença ficou abaixo de 3%.
- **Trie**: sobre 100.000 palavras geradas, 305 prefixos devolvem exatamente o mesmo conjunto que um filtro linear com `startsWith`.

## Demo

```sh
docker compose run --rm ts-test bun run demo.ts
docker compose run --rm go-test lbt_demo
```

Imprime um traço da LRU com descartes, a taxa de falsos positivos medida contra a teórica do filtro de Bloom, e buscas por prefixo sobre 100.000 palavras. Saída versionada: [results/demo-output.md](results/demo-output.md).
