# Cache strategies and stampede (MP-CACHE-1)

> Versão em português: [docs/pt/cache/cache-strategies.md](../../pt/cache/cache-strategies.md)

Mini-project: [`projects/cache/cache-strategies`](../../../projects/cache/cache-strategies/README.md). Quiz topics: `caching-strategies`, `consistency-trade-offs`, `stampede-penetration-avalanche`, `invalidation-ttl`.

## The problem

A cache is a second copy of data whose original lives somewhere slower, here Redis in front of PostgreSQL. Reading the copy is fast. The hard part is that there are now two places to change on every write, and no transaction covers both: PostgreSQL can commit and Redis can fail, or the other way round, and two requests can reach the two systems in different orders.

Every caching strategy is an answer to one question: **on a write, who is changed, in which order, and when is the client told "done"?**

## The shared read path

All three strategies of the mini-project read the same way, called lazy loading:

```
value = GET product:7              hit  -> answer
                                   miss -> SELECT in PostgreSQL
                                           SET product:7 value PX <time to live>
                                           answer
```

The time to live is not an optimisation. It is the safety net: the upper bound on how long a wrong copy can survive, whatever went wrong.

## Three ways to write

| Strategy | What a write does | The client hears "done" after | What it guarantees | What it does not |
| --- | --- | --- | --- | --- |
| Cache-aside | `UPDATE` in the database, then `DEL` of the key | database and delete | The next read loads the new value | A read that was already in flight can put the old value back |
| Write-through | `UPDATE` in the database, then `SET` of the key | database and cache | The next read is a hit and is fresh | Two concurrent writers can leave the cache with the older value; no atomicity across the two stores |
| Write-behind | `SET` of the key and an entry in a pending queue; the database later, in batches | cache only | The cheapest write, and many writes to one key become one database write | Durability: what was acknowledged and not yet flushed is lost if Redis loses its memory |

### Cache-aside: why delete, and the race that remains

The write deletes the key instead of storing the new value. Two writers that both store can reach Redis in the opposite order of their commits and leave the older value there. A delete carries no value, so it cannot be wrong: the next reader fetches the truth.

One race is left, and the tests replay it step by step:

```
reader: GET  -> miss
reader: SELECT -> old price
writer: UPDATE new price (commit)
writer: DEL key              (nothing to delete yet)
reader: SET key = old price  <- stale until the time to live ends
```

It needs a read that is slower than a whole write, so it is rare, and it is the reason a cache-aside entry always has a time to live.

### Write-through

The database goes first. If it rejects the write, the cache is never touched (there is a test for that). If the database commits and the `SET` fails, the cache keeps the old value until the time to live ends: the two steps are not atomic. The price is on the writer, who waits for two round-trips.

Write-through also caches data that may never be read. That is why its entries carry a time to live too.

### Write-behind

The write goes to the cached key and to a Redis hash of pending writes, one field per product, and the client is answered. A timer (200 ms in the mini-project) renames the hash atomically, sends all of it to PostgreSQL as one `UPDATE`, and deletes it. Ten writes to the same product inside one interval are one row of that batch.

Two consequences, each with a test:

- Until the flush, the database is **behind** the cache. Anything that reads PostgreSQL directly (a report, another service) sees the old value. A cache miss must look at the pending queue before the database, or it would cache the old value again.
- If Redis loses its memory before the flush, the client was told "saved" and the write is gone. Write-behind is for data where that loss is acceptable (counters, last-seen timestamps), or it needs a durable queue instead of a cache.

## The cache stampede

One popular key expires. Until somebody stores a new copy, every request sees a miss, and each one runs the same expensive query. In the experiment the query takes 100 ms and 300 users read the key, so all 300 arrive inside the gap. The connection pool has 20 connections, the queries queue for them, and the slowest reader waits more than a second for a value that one query would have produced.

Two fixes are implemented.

**Lock (single flight across instances).** On a miss, the request tries `SET lock token NX PX 10000`. Only one caller gets `OK`: it queries the database, stores the value and releases the lock. The others wait a few milliseconds and read the cache again. Three details matter:

- The lock has an expiry (`PX`), so a holder that crashes does not block everybody forever.
- The release is "delete only if the token is still mine", done in a Lua script so that the comparison and the delete are one atomic step. A plain `DEL` could remove a lock that expired and now belongs to someone else.
- After winning the lock, the cache is checked again. A slow request can win the lock just after the previous winner stored the value.

**Early refresh.** The cached value carries a "refresh after" instant that comes before the real expiry. The first request that reads the value after that instant takes the lock and reloads it in the background, and every request, including that one, keeps receiving the copy that is still valid. The key never actually expires while it is in use, so nobody waits. A cold cache has nothing to serve, and that single case falls back to the lock.

A well-known variant is probabilistic early expiration: each request decides at random to refresh early, with a probability that grows as the expiry approaches, which needs no lock. The mini-project uses a fixed window plus the lock because it gives exactly one query per refresh, which is what the experiment counts.

A longer time to live does not fix a stampede. It makes it rarer and the data staler, and each expiry is still paid by the whole herd.

## Results

The committed tables are in the [README](../../../projects/cache/cache-strategies/README.md#results) and in `results/results.md`, with the machine and the versions.

**Stampede.** Without protection the median expiry cost 299 database queries, about one per reader (the smallest burst was 260, the largest 300). With the lock and with the early refresh every expiry cost exactly 1. The slowest request of the unprotected runs took more than a second; with early refresh the latency stays flat because nobody waits for the reload.

How "queries per expiry" is counted: the API counts the queries that load the hot key. A query that starts while no other load of that key is running opens a new expiry, and the queries that start while one is still running belong to the same expiry. The cold start counts as the first expiry.

**Hit rate and latency.** How to read the second table without fooling yourself:

- The hit rate grows with the time to live in every strategy, because fewer reads find the key expired. The price is staleness, which this table does not show.
- With a 5 s time to live and a 5 s measurement, almost nothing expires inside the run. That row shows the ceiling: what is left are the misses caused by writes (cache-aside deletes the key) and by products read for the first time.
- Write-through and write-behind should hit slightly more often than cache-aside, because a write leaves the new value in the cache instead of removing it. With 2% of writes the expected difference is about two percentage points, which is smaller than the spread between rounds of the committed run, so the table does not show it reliably.
- The write latency is where the strategies differ most: write-behind answers after touching only Redis, the other two wait for PostgreSQL. Write-behind also sends far fewer statements to the database, because each flush is one statement.
- The runs are short and the machine was shared with other work. Latency differences of a few milliseconds between rows are noise.

## Limits of the lab

- One API instance. The lock is in Redis, so it would work across instances, but the count of queries per expiry lives in the memory of the API process.
- The expensive query is simulated with `pg_sleep`.
- Redis runs without persistence and without a memory limit, so eviction never happens here.
- Cache penetration and avalanche are covered by the quiz, not by this mini-project.

## Sources

- Redis documentation: [`SET`](https://redis.io/docs/latest/commands/set/) (the `NX` and `PX` options and the lock pattern), [`EXPIRE`](https://redis.io/docs/latest/commands/expire/), [key eviction](https://redis.io/docs/latest/develop/reference/eviction/), [persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/).
- RFC 9111, HTTP Caching, and RFC 5861 for `stale-while-revalidate`, the HTTP form of serving a copy while it is refreshed.
