# Mini relational DBMS (MP-DB-1)

> Versão em português: [docs/pt/databases/mini-dbms.md](../../pt/databases/mini-dbms.md)

Code: [projects/databases/mini-dbms](../../../projects/databases/mini-dbms). Languages: Rust and Python.

## What it teaches

A relational DBMS answers a query by combining a few operators. This mini-project implements the three that appear in almost every query and shows that the *same* operator can be computed by very different algorithms.

| Operator | Algebra | SQL | What it does |
| --- | --- | --- | --- |
| Selection (restriction) | σ | `WHERE` | keeps the rows that satisfy a condition, with all columns |
| Projection | π | the `SELECT` list | keeps some columns of every row |
| Join | ⋈ | `JOIN ... ON` | combines rows of two tables that have the same key |

## Selection and projection

A table is a heading (column names) and a list of rows. Selection reads every row once and keeps the ones where `column op constant` is true. Without an index there is no shortcut, so the cost is O(n).

Projection keeps the requested columns. Dropping columns can make different rows equal, and here the relational model and SQL disagree:

- in relational algebra a relation is a **set**, so the duplicates disappear;
- in SQL a table is a **multiset**, so they stay unless `DISTINCT` is written.

`project(columns, distinct)` implements both, and the tests check each one against SQLite (`SELECT` and `SELECT DISTINCT`).

## Three ways to compute one join

All three receive two tables and one column of each, and return the pairs of rows whose keys are equal.

```
nested loop          hash join                    sort-merge join

for r in R:          build: for s in S:           sort R by key
  for s in S:          bucket[s.key].add(s)       sort S by key
    if r.k == s.k:   probe: for r in R:           walk both lists together,
      emit(r, s)       emit(r, each s in            advancing the smaller key
                       bucket[r.key])
n * m comparisons    about n + m steps            n log n + m log m, then n + m
```

- **Nested loop** compares every row of R with every row of S. It is the only one that works for any condition (`<`, `<>`, a function), and the only one whose cost is the *product* of the sizes.
- **Hash join** relies on one fact: equal keys have the same hash, so they land in the same bucket. It reads each table once. It needs memory for the hash table and works only for equality.
- **Sort-merge join** relies on order: once both sides are sorted, matching keys meet during a single walk. Duplicate keys form a run on each side, and every row of one run matches every row of the other. If the inputs are already sorted (for example, read through an ordered index), the sort step is free.

A query optimiser chooses among them using the table sizes and the kind of condition. That choice is invisible in SQL, which only says *what* to join.

## How the answers are verified

SQLite is the referee.

- **Python** loads the same random rows into an in-memory SQLite database (module `sqlite3` of the standard library) and compares the engine with `SELECT ... WHERE ...`, `SELECT DISTINCT` and `JOIN ... ON`. Results are compared sorted, because a query without `ORDER BY` promises no order.
- **Rust** has no SQLite in its standard library, and the crate has no dependencies. `python/make_fixtures.py` runs a fixed list of queries on SQLite and writes the tables, the queries and the rows SQLite returned to `fixtures/sqlite_cases.tsv`. The Rust tests run the same queries and compare. A Python test regenerates the file in memory and fails if the committed copy differs, so the expected rows are always SQLite's.
- **Both** run the three joins on 200 random tables with repeated and missing keys and require the same pairs.

## Benchmark

Workload: `R(id, k)` and `S(k, v)` with n rows each. `R.k` is random, `S.k` holds each value from 0 to n-1 once in scrambled order, so the join returns exactly n rows. A hand-written pseudo-random generator with the same constants in both languages makes the tables identical, and each run prints a checksum (number of pairs and the sum of `R.id * S.v`). The checksum is the same for the three algorithms and for the two languages.

```sh
bun run bench -- --project projects/databases/mini-dbms
```

Committed results: [results.md](../../../projects/databases/mini-dbms/results/results.md), also shown by `dashboard/index.html`. Measured section (join only), from the committed run:

| n | nested loop (Rust) | hash (Rust) | sort-merge (Rust) |
| ---: | ---: | ---: | ---: |
| 1,000 | 4.24 ms | 0.25 ms | 0.20 ms |
| 10,000 | 332 ms | 3.05 ms | 2.63 ms |
| 100,000 | not run | 53.9 ms | 107 ms |
| 1,000,000 | not run | 983 ms | 1,597 ms |

How to read it:

- Ten times more rows cost the nested loop about 80 times more time. That is the signature of a quadratic algorithm (the theoretical factor is 100).
- Hash and sort-merge grow close to linearly, and sort-merge loses ground at large sizes because of the `n log n` sort.
- Rust and Python show the same *shape* with different constants: the algorithm decides the growth, the language decides the constant.

The nested loop is capped at 10,000 rows in `bench.json`. One manual Rust run at 100,000 rows took 27.4 s, and 1,000,000 rows would take about 45 minutes per run, so the largest sizes were left out on a shared machine. The numbers depend on the machine recorded in `results.md`.

## Related quiz topics

`databases` / `relational-algebra`, `databases` / `query-optimisation-and-indexes`, `databases` / `relational-calculus-and-sql`.

## Limits

No NULLs, indexes, query language or disk storage, and joins are equi-joins on a single column. Source of the ideas: C. J. Date, *An Introduction to Database Systems*, chapters 7 (Relational Algebra) and 18 (Optimization).
