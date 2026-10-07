# mini-dbms

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A mini relational DBMS small enough to read in one sitting. It teaches how **selection** and **projection** work on an in-memory table, and how three algorithms answer the same join: **nested loop**, **hash join** and **sort-merge join**. The same engine is written in Rust and in Python, every answer is checked against SQLite, and a benchmark shows at which table size the nested loop falls behind.

Full explanation: [docs/en/databases/mini-dbms.md](../../../docs/en/databases/mini-dbms.md).

## Quiz topics it demonstrates

- `databases` / `relational-algebra`: selection, projection (with and without duplicates) and natural join.
- `databases` / `query-optimisation-and-indexes`: cost of the nested-loop join, and which join algorithm applies to which condition.
- `databases` / `relational-calculus-and-sql`: an SQL table keeps duplicate rows unless `DISTINCT` is written.

## Run

The only requirement is Docker.

```sh
./setup-unix-mini-dbms.sh        # Linux and macOS
./setup-windows-mini-dbms.ps1    # Windows
```

The script builds the two pinned images and runs, for each language, the formatter check, the linter and the tests.

## Structure

| Path | Content |
| --- | --- |
| `rust/src/table.rs`, `python/table.py` | table, selection, projection |
| `rust/src/join.rs`, `python/joins.py` | nested-loop, hash and sort-merge join |
| `rust/src/workload.rs`, `python/workload.py` | the benchmark tables and the checksum, identical in both languages |
| `rust/src/main.rs`, `python/bench.py` | benchmark entry points (benchmark contract of the repository) |
| `python/make_fixtures.py`, `fixtures/sqlite_cases.tsv` | queries and the rows SQLite returned for them |
| `python/demo.py` | a tour of the operators on two tiny tables |
| `bench.json`, `results/`, `dashboard/` | benchmark grid, committed results and static dashboard |

The Rust crate has no dependencies and the Python code uses only the standard library (`sqlite3` included).

## Tests

```sh
docker compose run --rm rust-test
docker compose run --rm python-test
```

- Python compares selection, projection and the three joins with SQLite on random tables.
- Rust has no SQLite in its standard library, so it compares with `fixtures/sqlite_cases.tsv`, which was written by SQLite. A Python test fails if that file no longer matches what SQLite answers.
- Both languages check that the three joins return the same rows on 200 random tables.

To regenerate the fixture after changing the queries (run from this folder; on Windows PowerShell use `${PWD}` instead of `$PWD`):

```sh
docker compose run --rm -v "$PWD/fixtures:/app/fixtures" python-test python make_fixtures.py
```

## Demo

```sh
docker compose run --rm python-test python demo.py
```

## Benchmark

From the repository root (needs [Bun](https://bun.sh) on the host, everything measured runs in Docker):

```sh
bun run bench -- --project projects/databases/mini-dbms
```

It rewrites `results/`. Open `dashboard/index.html` to see the chart, or read [results/results.md](results/results.md). Summary of the committed run (measured section, join only):

| n | nested loop (Rust) | hash (Rust) | sort-merge (Rust) | nested loop (Python) | hash (Python) | sort-merge (Python) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 4.24 ms | 0.25 ms | 0.20 ms | 44.8 ms | 0.42 ms | 1.10 ms |
| 10,000 | 332 ms | 3.05 ms | 2.63 ms | 4,113 ms | 23.9 ms | 25.4 ms |
| 100,000 | not run | 53.9 ms | 107 ms | not run | 112 ms | 307 ms |
| 1,000,000 | not run | 983 ms | 1,597 ms | not run | 2,161 ms | 2,652 ms |

**Where the nested loop falls behind:** at once. With 10 times more rows it takes about 80 to 90 times longer (quadratic), while the other two grow close to linearly (10 to 25 times per step in most rows; one Python row is noisier, because the machine was shared). At 10,000 rows the Rust nested loop is already 100 times slower than the Rust hash join.

**Cap, stated honestly:** the nested loop is measured only up to 10,000 rows (`maxN` in `bench.json`). A single manual run in Rust at 100,000 rows took 27.4 s, and 1,000,000 rows would take about 100 times that, around 45 minutes per run. The machine is shared with other containers, so those sizes were left out. Hash and sort-merge run the full range, 10^3 to 10^6.

## Limits

No NULLs, no indexes, no query language and no disk storage: tables are lists of rows in memory, and joins are equi-joins on one column. Those are deliberate cuts to keep the three algorithms in view.
