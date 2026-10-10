# paging-tlb

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um simulador de paginação. Ele traduz endereços virtuais por meio de uma TLB e de uma tabela de páginas, contando acertos e faltas de TLB e faltas de página, e compara quatro algoritmos de substituição de páginas (FIFO, relógio, LRU e ótimo) em sequências de referências. Ele ensina quanto custa uma tradução, por que a TLB importa, e que a escolha da página a retirar muda o número de faltas de página, até chegar à anomalia de Belady, em que o FIFO tem mais faltas com mais memória.

Explicação completa: [docs/pt/operating-systems/paging-tlb.md](../../../docs/pt/operating-systems/paging-tlb.md).

## Tópicos do quiz que ele demonstra

- `operating-systems` / `memory-management`: tradução de endereços (número de página e deslocamento), faltas de página, a TLB e o tempo efetivo de acesso, substituição FIFO, relógio, LRU e ótima, anomalia de Belady.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-paging-tlb.sh        # Linux e macOS
./setup-windows-paging-tlb.ps1    # Windows
```

O script constrói as imagens, roda os testes das duas linguagens e roda a demo.

## Demo

```sh
docker compose run --rm demo
```

Ela imprime as tabelas de faltas de página e o experimento da TLB, e grava `results/results.md` e `results/results.json`.

```text
Belady's anomaly
reference string: 1 2 3 4 1 2 5 1 2 3 4 5
frames      1    2    3    4    5
fifo       12   12    9   10    5
lru        12   12   10    8    5
optimal    12    9    7    6    5
```

`docker compose run --rm rust-demo` imprime as mesmas tabelas de faltas de página a partir da implementação em Rust.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/replacement.ts` | FIFO, relógio, LRU e ótimo (implementação de referência) |
| `ts/src/mmu.ts` | tabela de páginas, TLB, contadores e tempo efetivo de acesso |
| `ts/src/report.ts`, `ts/src/cli.ts` | demo, tabelas e arquivos de resultado |
| `rust/src/lib.rs` | os mesmos algoritmos e a MMU em Rust, com `enum` e `match` no lugar de classes |
| `rust/src/main.rs` | imprime as tabelas de faltas de página |
| `results/` | tabelas versionadas |

Cada pasta de linguagem tem seu próprio Dockerfile em uma imagem fixada (`oven/bun:1.4.2`, `rust:1.99.0-slim-trixie`) e nenhuma dependência.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

Os testes conferem o traço de referência da MMU (acertos e faltas de TLB e faltas de página esperados), as contagens de faltas dos exemplos de livro e a anomalia de Belady. O serviço de Rust também roda `cargo fmt --check` e `cargo clippy -D warnings`.

## Resultados

A tabela versionada é [results/results.md](results/results.md). A simulação é determinística, então os números são os mesmos em qualquer máquina.
