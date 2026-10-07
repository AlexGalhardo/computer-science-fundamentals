# hash-map

> English version: [README.md](README.md)

Um mapa de espalhamento (hash map) escrito do zero, duas vezes: com **encadeamento separado** (uma lista encadeada por balde) e com **endereçamento aberto** (sondagem linear dentro de um único vetor). Ele ensina como as colisões são resolvidas, por que a remoção no endereçamento aberto precisa de lápides (tombstones) e por que o fator de carga decide a velocidade de uma busca.

Explicação completa: [docs/pt/data-structures/hash-map.md](../../../docs/pt/data-structures/hash-map.md).

## Tópicos do quiz que ele demonstra

- `data-structures` / `hash-tables`: colisões, encadeamento separado, sondagem linear, lápides, fator de carga, rehashing, agrupamento primário.
- `data-structures` / `arrays-and-lists`: a lista encadeada dentro de cada balde e a remoção de um nó sem caso especial para a cabeça.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-hash-map.sh        # Linux e macOS
./setup-windows-hash-map.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem e roda checagem de formato, linter e testes em cada uma.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/hash_map.hpp` | `ChainingMap` e `ProbingMap` em C++23, chaves `uint64_t` |
| `rust/src/lib.rs` | os mesmos dois mapas em Rust, chaves `u64` |
| `ts/src/hash-map.ts` | os mesmos dois mapas em TypeScript, chaves inteiras sem sinal de 32 bits |
| `*/bench.*`, `rust/src/bench.rs` | programas de benchmark que seguem o contrato do repositório |
| `bench.json` | a grade do benchmark: 3 linguagens, 2 estratégias, 4 fatores de carga |
| `results/` | resultados versionados da última execução do benchmark |
| `dashboard/` | página estática que desenha `results/results.js` |

As três implementações expõem `put`, `get`, `remove`, tamanho, capacidade e fator de carga, e recebem a função de espalhamento como parâmetro, para que os testes possam forçar colisões.

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
docker compose run --rm ts-test
```

- **Testes de propriedade**: 5 sementes com 20.000 operações aleatórias de `put`, `get` e `remove` cada, para as duas estratégias e para um hash bom e um propositalmente fraco. Toda resposta é comparada com o mapa da linguagem (`std::unordered_map`, `HashMap`, `Map`).
- **Redimensionamento**: 10.000 inserções nunca deixam o fator de carga passar do limite, e todas as chaves sobrevivem aos rehashes.
- **Lápides**: depois de remover uma de três chaves que colidem e inserir outra, o `get` continua devolvendo os valores certos.

## Benchmark

```sh
bun run bench -- --project hash-map
```

Rode a partir da raiz do repositório. Cada linha monta uma tabela com exatamente o fator de carga pedido (sem redimensionar) e cronometra 200.000 buscas de chaves guardadas e 200.000 buscas de chaves ausentes. Os resultados vão para `results/`, e a página `dashboard/index.html` abre direto do disco.

Leia [results/results.md](results/results.md) pela coluna `section` e pela coluna `Variant` (o fator de carga). O limite de 200.000 chaves mantém a execução curta em uma máquina compartilhada. Os números têm ruído abaixo da carga 0,75, então a única conclusão segura é o salto da sondagem linear em 0,9.
