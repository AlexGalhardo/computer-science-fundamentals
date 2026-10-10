# memory-allocator

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Quatro alocadores de memória sobre uma arena fixa: first fit, best fit e worst fit em uma lista livre, e o sistema buddy. Um benchmark passa a mesma sequência de alocações e liberações por cada um deles e mede alocações que falharam, fragmentação externa e fragmentação interna. Ele ensina que memória livre só é útil quando é contígua, que a estratégia decide com que rapidez a arena se quebra em lacunas, e que a coalescência é o que a junta de volta.

Explicação completa: [docs/pt/operating-systems/memory-allocator.md](../../../docs/pt/operating-systems/memory-allocator.md).

## Tópicos do quiz que ele demonstra

- `operating-systems` / `memory-management`: alocação por lista livre (first fit, best fit, worst fit), fragmentação externa e interna, coalescência e compactação, partições de tamanho variável e segmentação.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-memory-allocator.sh        # Linux e macOS
./setup-windows-memory-allocator.ps1    # Windows
```

O script constrói as imagens, roda os testes das duas linguagens e roda o benchmark.

## Benchmark

```sh
docker compose run --rm demo
```

Ele imprime a tabela abaixo para duas cargas e grava `results/results.md`.

```text
Workload: mixed (arena 1048576 bytes, 20000 steps, seed 2026)
strategy    attempts  failed  failed %  ext frag %  int frag %  peak used
first-fit      11054     905      8.19       80.54        0.00     969266
best-fit       11054     868      7.85       78.65        0.00    1013220
worst-fit      11054    1258     11.38       95.72        0.00     653051
buddy          11054    1098      9.93       68.07       25.48    1047424
```

`docker compose run --rm rust-demo` imprime a mesma tabela a partir da implementação em Rust.

O benchmark é uma simulação determinística, não uma medição de tempo: ele conta eventos e mede a disposição da arena, então os números são os mesmos em qualquer máquina, e nenhuma execução do hyperfine está envolvida.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/allocator.hpp` | o alocador de lista livre com suas três estratégias e o sistema buddy |
| `cpp/workload.hpp` | gerador com semente e o laço do benchmark |
| `cpp/demo.cpp` | imprime a tabela em texto ou em Markdown |
| `cpp/test_allocator.cpp` | testes, sem framework |
| `rust/src/lib.rs` | os mesmos alocadores, benchmark e testes em Rust (um trait no lugar da classe abstrata) |
| `rust/src/main.rs` | imprime a tabela |
| `results/` | tabela versionada |

Cada pasta de linguagem tem seu próprio Dockerfile em uma imagem fixada (`gcc:16.2.0-trixie`, `rust:1.99.0-slim-trixie`) e nenhuma biblioteca como dependência.

## Testes

```sh
docker compose run --rm cpp-test     # checagem do clang-format e depois os testes
docker compose run --rm rust-test    # cargo fmt, clippy -D warnings e depois os testes
```

O teste aleatório executa milhares de alocações e liberações aleatórias em cada estratégia e confere, depois de cada uma, que dois blocos vivos nunca se sobrepõem. Depois ele libera tudo em ordem aleatória e confere que a arena voltou a ser um único bloco livre.

## Resultados

A tabela versionada é [results/results.md](results/results.md).
