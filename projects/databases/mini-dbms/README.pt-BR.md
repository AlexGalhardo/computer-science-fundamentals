# mini-dbms

> English version: [README.md](README.md)

Um mini SGBD relacional pequeno o bastante para ser lido de uma vez. Ele ensina como a **seleção** e a **projeção** funcionam em uma tabela em memória, e como três algoritmos respondem à mesma junção: **laços aninhados** (nested loop), **junção por hash** e **junção por ordenação e intercalação** (sort-merge). O mesmo motor é escrito em Rust e em Python, toda resposta é conferida com o SQLite, e um benchmark mostra a partir de que tamanho de tabela os laços aninhados ficam para trás.

Explicação completa: [docs/pt/databases/mini-dbms.md](../../../docs/pt/databases/mini-dbms.md).

## Tópicos do quiz que ele demonstra

- `databases` / `relational-algebra`: seleção, projeção (com e sem duplicatas) e junção natural.
- `databases` / `query-optimisation-and-indexes`: custo da junção por laços aninhados, e qual algoritmo de junção se aplica a qual condição.
- `databases` / `relational-calculus-and-sql`: uma tabela SQL mantém linhas repetidas a menos que se escreva `DISTINCT`.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-mini-dbms.sh        # Linux e macOS
./setup-windows-mini-dbms.ps1    # Windows
```

O script constrói as duas imagens fixadas e roda, para cada linguagem, a checagem do formatador, o linter e os testes.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `rust/src/table.rs`, `python/table.py` | tabela, seleção, projeção |
| `rust/src/join.rs`, `python/joins.py` | junção por laços aninhados, por hash e por ordenação e intercalação |
| `rust/src/workload.rs`, `python/workload.py` | as tabelas do benchmark e o checksum, idênticos nas duas linguagens |
| `rust/src/main.rs`, `python/bench.py` | pontos de entrada do benchmark (contrato de benchmark do repositório) |
| `python/make_fixtures.py`, `fixtures/sqlite_cases.tsv` | consultas e as linhas que o SQLite devolveu para elas |
| `python/demo.py` | um passeio pelos operadores em duas tabelas minúsculas |
| `bench.json`, `results/`, `dashboard/` | grade do benchmark, resultados versionados e dashboard estático |

O crate em Rust não tem dependências e o código em Python usa só a biblioteca padrão (incluindo `sqlite3`).

## Testes

```sh
docker compose run --rm rust-test
docker compose run --rm python-test
```

- O Python compara seleção, projeção e as três junções com o SQLite em tabelas aleatórias.
- O Rust não tem SQLite na biblioteca padrão, então compara com `fixtures/sqlite_cases.tsv`, que foi escrito pelo SQLite. Um teste em Python falha se esse arquivo deixar de bater com o que o SQLite responde.
- As duas linguagens conferem que as três junções devolvem as mesmas linhas em 200 tabelas aleatórias.

Para regenerar o fixture depois de mudar as consultas (rode a partir desta pasta; no PowerShell do Windows use `${PWD}` no lugar de `$PWD`):

```sh
docker compose run --rm -v "$PWD/fixtures:/app/fixtures" python-test python make_fixtures.py
```

## Demo

```sh
docker compose run --rm python-test python demo.py
```

## Benchmark

A partir da raiz do repositório (precisa do [Bun](https://bun.sh) na máquina, e tudo o que é medido roda em Docker):

```sh
bun run bench -- --project projects/databases/mini-dbms
```

O comando reescreve `results/`. Abra `dashboard/index.html` para ver o gráfico, ou leia [results/results.md](results/results.md). Resumo da execução versionada (trecho medido, só a junção):

| n | laços aninhados (Rust) | hash (Rust) | ordenação (Rust) | laços aninhados (Python) | hash (Python) | ordenação (Python) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.000 | 4,24 ms | 0,25 ms | 0,20 ms | 44,8 ms | 0,42 ms | 1,10 ms |
| 10.000 | 332 ms | 3,05 ms | 2,63 ms | 4.113 ms | 23,9 ms | 25,4 ms |
| 100.000 | não rodou | 53,9 ms | 107 ms | não rodou | 112 ms | 307 ms |
| 1.000.000 | não rodou | 983 ms | 1.597 ms | não rodou | 2.161 ms | 2.652 ms |

**Onde os laços aninhados ficam para trás:** de imediato. Com 10 vezes mais linhas eles levam cerca de 80 a 90 vezes mais tempo (quadrático), enquanto os outros dois crescem de forma quase linear (10 a 25 vezes por passo na maioria das linhas; uma linha do Python tem mais ruído, porque a máquina estava compartilhada). Com 10.000 linhas os laços aninhados em Rust já são 100 vezes mais lentos que a junção por hash em Rust.

**Limite, dito com honestidade:** os laços aninhados são medidos só até 10.000 linhas (`maxN` em `bench.json`). Uma única execução manual em Rust com 100.000 linhas levou 27,4 s, e 1.000.000 de linhas levaria cerca de 100 vezes isso, em torno de 45 minutos por execução. A máquina é compartilhada com outros contêineres, então esses tamanhos ficaram de fora. Hash e ordenação rodam a faixa inteira, de 10^3 a 10^6.

## Limites

Sem NULLs, sem índices, sem linguagem de consulta e sem armazenamento em disco: as tabelas são listas de linhas em memória, e as junções são por igualdade em uma coluna. São cortes deliberados para manter os três algoritmos à vista.
