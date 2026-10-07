# Mini SGBD relacional (MP-DB-1)

> English version: [docs/en/databases/mini-dbms.md](../../en/databases/mini-dbms.md)

Código: [projects/databases/mini-dbms](../../../projects/databases/mini-dbms). Linguagens: Rust e Python.

## O que ele ensina

Um SGBD relacional responde a uma consulta combinando poucos operadores. Este mini-projeto implementa os três que aparecem em quase toda consulta e mostra que o *mesmo* operador pode ser calculado por algoritmos muito diferentes.

| Operador | Álgebra | SQL | O que faz |
| --- | --- | --- | --- |
| Seleção (restrição) | σ | `WHERE` | mantém as linhas que satisfazem uma condição, com todas as colunas |
| Projeção | π | a lista do `SELECT` | mantém algumas colunas de cada linha |
| Junção | ⋈ | `JOIN ... ON` | combina linhas de duas tabelas que têm a mesma chave |

## Seleção e projeção

Uma tabela é um cabeçalho (nomes das colunas) e uma lista de linhas. A seleção lê cada linha uma vez e mantém aquelas em que `coluna op constante` é verdadeiro. Sem índice não há atalho, então o custo é O(n).

A projeção mantém as colunas pedidas. Descartar colunas pode tornar iguais linhas que eram diferentes, e aqui o modelo relacional e o SQL discordam:

- na álgebra relacional uma relação é um **conjunto**, então as duplicatas desaparecem;
- no SQL uma tabela é um **multiconjunto**, então elas ficam, a menos que se escreva `DISTINCT`.

`project(columns, distinct)` implementa os dois, e os testes conferem cada um com o SQLite (`SELECT` e `SELECT DISTINCT`).

## Três formas de calcular uma junção

Os três recebem duas tabelas e uma coluna de cada, e devolvem os pares de linhas cujas chaves são iguais.

```
laços aninhados      junção por hash              ordenação e intercalação

para r em R:         construção: para s em S:     ordena R pela chave
  para s em S:         balde[s.chave].add(s)      ordena S pela chave
    se r.k == s.k:   sondagem: para r em R:       percorre as duas listas juntas,
      emite(r, s)      emite(r, cada s em           avançando a menor chave
                       balde[r.chave])
n * m comparações    cerca de n + m passos        n log n + m log m, depois n + m
```

- **Laços aninhados** compara cada linha de R com cada linha de S. É o único que funciona para qualquer condição (`<`, `<>`, uma função), e o único cujo custo é o *produto* dos tamanhos.
- **Junção por hash** se apoia em um fato: chaves iguais têm o mesmo hash, então caem no mesmo balde. Ela lê cada tabela uma vez. Precisa de memória para a tabela hash e só funciona para igualdade.
- **Junção por ordenação e intercalação** se apoia na ordem: com os dois lados ordenados, as chaves que casam se encontram em uma única passada. Chaves repetidas formam um trecho de cada lado, e toda linha de um trecho casa com toda linha do outro. Se as entradas já estão ordenadas (por exemplo, lidas por um índice ordenado), a etapa de ordenação sai de graça.

Um otimizador de consultas escolhe entre eles usando os tamanhos das tabelas e o tipo da condição. Essa escolha é invisível no SQL, que só diz *o que* juntar.

## Como as respostas são verificadas

O SQLite é o árbitro.

- **Python** carrega as mesmas linhas aleatórias em um banco SQLite em memória (módulo `sqlite3` da biblioteca padrão) e compara o motor com `SELECT ... WHERE ...`, `SELECT DISTINCT` e `JOIN ... ON`. Os resultados são comparados ordenados, porque uma consulta sem `ORDER BY` não promete ordem.
- **Rust** não tem SQLite na biblioteca padrão, e o crate não tem dependências. `python/make_fixtures.py` roda uma lista fixa de consultas no SQLite e escreve as tabelas, as consultas e as linhas que o SQLite devolveu em `fixtures/sqlite_cases.tsv`. Os testes em Rust rodam as mesmas consultas e comparam. Um teste em Python regenera o arquivo em memória e falha se a cópia versionada for diferente, então as linhas esperadas são sempre as do SQLite.
- **As duas** rodam as três junções em 200 tabelas aleatórias com chaves repetidas e chaves ausentes, e exigem os mesmos pares.

## Benchmark

Carga: `R(id, k)` e `S(k, v)` com n linhas cada. `R.k` é aleatório, `S.k` tem cada valor de 0 a n-1 uma vez em ordem embaralhada, então a junção devolve exatamente n linhas. Um gerador pseudoaleatório escrito à mão, com as mesmas constantes nas duas linguagens, torna as tabelas idênticas, e cada execução imprime um checksum (quantidade de pares e a soma de `R.id * S.v`). O checksum é o mesmo para os três algoritmos e para as duas linguagens.

```sh
bun run bench -- --project projects/databases/mini-dbms
```

Resultados versionados: [results.md](../../../projects/databases/mini-dbms/results/results.md), também mostrados por `dashboard/index.html`. Trecho medido (só a junção), da execução versionada:

| n | laços aninhados (Rust) | hash (Rust) | ordenação (Rust) |
| ---: | ---: | ---: | ---: |
| 1.000 | 4,24 ms | 0,25 ms | 0,20 ms |
| 10.000 | 332 ms | 3,05 ms | 2,63 ms |
| 100.000 | não rodou | 53,9 ms | 107 ms |
| 1.000.000 | não rodou | 983 ms | 1.597 ms |

Como ler:

- Dez vezes mais linhas custam aos laços aninhados cerca de 80 vezes mais tempo. Essa é a assinatura de um algoritmo quadrático (o fator teórico é 100).
- Hash e ordenação crescem de forma quase linear, e a ordenação perde terreno nos tamanhos grandes por causa do `n log n`.
- Rust e Python mostram a mesma *forma* com constantes diferentes: o algoritmo decide o crescimento, a linguagem decide a constante.

Os laços aninhados estão limitados a 10.000 linhas em `bench.json`. Uma execução manual em Rust com 100.000 linhas levou 27,4 s, e 1.000.000 de linhas levaria cerca de 45 minutos por execução, então os tamanhos maiores ficaram de fora em uma máquina compartilhada. Os números dependem da máquina registrada em `results.md`.

## Tópicos do quiz relacionados

`databases` / `relational-algebra`, `databases` / `query-optimisation-and-indexes`, `databases` / `relational-calculus-and-sql`.

## Limites

Sem NULLs, índices, linguagem de consulta ou armazenamento em disco, e as junções são por igualdade em uma única coluna. Fonte das ideias: C. J. Date, *An Introduction to Database Systems*, capítulos 7 (Relational Algebra) e 18 (Optimization).
