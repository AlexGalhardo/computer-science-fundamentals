# Prisma, Drizzle and raw SQL (MP-TX-3)

> Versão em português: [docs/pt/transactions/orm-vs-sql.md](../../pt/transactions/orm-vs-sql.md)

Mini-project: [`projects/transactions/orm-vs-sql`](../../../projects/transactions/orm-vs-sql/README.md). Quiz topic: `acid-properties` (transactions through an ORM).

## The question

An ORM lets you write `post.findMany(...)` instead of SQL. That saves typing and gives types, and it also hides two things you still need to know: **which SQL is sent** and **how many statements are sent**. This mini-project makes both visible.

## Three levels of abstraction

| Approach | You write | You get |
| --- | --- | --- |
| Raw SQL (`pg`) | The SQL text, with `$1` parameters | Full control. No type checks between the SQL and the code: the row types are a promise you make |
| Drizzle | A query builder that mirrors SQL (`select().from().innerJoin()`) | Types derived from the schema, and SQL that is almost exactly what you wrote |
| Prisma | What you want (`select`, `where`, relations) | The highest level. Prisma decides how to fetch, so the SQL can surprise you |

The schema is created once, by `ts/sql/schema.sql`. Prisma and Drizzle only describe the existing tables, so the comparison is about querying.

## What the captured SQL shows

The tests record every statement each approach sends and write it next to the query (`ts/src/queries/*.captured.sql`). Things worth opening:

- **All three bind parameters** (`$1`, `$2`). None writes the value into the SQL text, which is the defence against SQL injection.
- **`posts-with-author`**: raw SQL and Drizzle send one `JOIN`. Prisma sends **two statements**: the posts, then `SELECT ... FROM authors WHERE id IN (...)`, and joins the rows in the application. Same rows, different plan, and the reason this query has the largest gap in the latency table.
- **`add-post-with-comment`**: the two inserts travel between a `BEGIN` and a `COMMIT` in all three. Prisma's query log shows the `COMMIT` but not the `BEGIN`, a reminder that an ORM log is not always the whole conversation.
- **`n-plus-one-naive`**: 151 almost identical statements. Seeing them in a file is more convincing than any explanation.

## Transactions through an ORM

`add-post-with-comment` inserts a post and a comment atomically. The rule is the same in the three approaches: inside the transaction, **every statement goes through the transaction handle** (`tx`), which is bound to one connection. A statement sent through the global client runs on another connection, outside the transaction, and survives a rollback. The tests force the second insert to fail (a `CHECK` on the comment length) and assert that the post is gone in all three.

## N+1

To list N authors with their posts, the naive code runs 1 query for the authors and 1 query per author: N + 1 round trips. Each one is fast. The sum is not. The fix is to fetch all the posts in one statement (`WHERE author_id = ANY(...)` or `IN (...)`), 2 statements in total, and to group them in memory. With Prisma the fix is to ask for the relation in the same call.

In the measured run, 150 authors cost 151 statements against 2, and the fix was about 25 to 33 times faster, **with the database on the same machine**. With a real network between application and database each round trip costs far more, and so does N+1.

## Reading the latency table

The committed numbers are in the [README](../../../projects/transactions/orm-vs-sql/README.md#latency-per-approach) and in `results/results.md`.

- Drizzle stayed 15 to 22% above raw SQL, and Prisma 29 to 89% above, in this run.
- The absolute difference is a fraction of a millisecond per query. It matters on a hot path that runs thousands of times, and it is irrelevant next to one avoidable N+1.
- The database is local, so the query itself is cheap and the library overhead is as visible as it can be. Over a real network the relative difference shrinks.
- This is one machine, one data size (200 authors, about 800 posts) and one version of each library. It is not a ranking of tools.

The repository benchmark runner (`bun run bench`, hyperfine) measures whole processes with no network, so it does not fit a benchmark that needs a database. This one measures in-process, with warm-up discarded, several rounds and the spread reported, and records machine, versions and command.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-TX-3.1 the three approaches return identical rows | `tests/queries.test.ts`, "the same five queries in the three approaches" |
| MP-TX-3.2 generated SQL committed next to each query | `tests/queries.test.ts`, "captured SQL", which writes `ts/src/queries/*.captured.sql` |
| MP-TX-3.3 latency table, N+1 above 100 statements, fix with 2 | `docker compose run --rm bench` writes the tables. `tests/queries.test.ts`, "N+1", asserts 151 and 2 |

## Run

```sh
cd projects/transactions/orm-vs-sql
./setup-unix-orm-vs-sql.sh        # or ./setup-windows-orm-vs-sql.ps1
docker compose run --rm bench && docker compose down -v
```
