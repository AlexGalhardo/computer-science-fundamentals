# Blind review: cache

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was run

Two reviewers, one per language, each a fresh agent that received only the blind file (`quiz/.review/cache.blind.json`, copied to a folder of its own) and never saw `quiz/content/`. Both worked every trace and number out step by step.

| Round | Blind file | Result |
| --- | --- | --- |
| English | `bun run quiz:blind cache` | 100 answered, 0 disagreements, 2 questions flagged with a note |
| Portuguese | `bun run quiz:blind cache --lang pt` | 100 answered, 0 disagreements, 2 questions flagged with a note |

Both answer files were compared with `bun run quiz:compare cache <answers.json>`. Neither reviewer checked facts on the web: they answered from their own knowledge. The facts were checked against redis.io and the RFCs by the writers (see below).

## Notes raised by the reviewers and their resolution

| Question | Note | Resolution |
| --- | --- | --- |
| `cache-consistency-trade-offs-04` | English reviewer: "any read between the two steps puts the old value back" is overstated, it needs a read that misses | question rewritten: the alternative now says "a read between the two steps can put the old value back", and the concept says "a read that misses inside it". Key kept |
| `cache-redis-data-structures-persistence-07` | English reviewer: with `appendfsync everysec` a slow background fsync can stretch the loss beyond one second | key kept: "about the last second" is the figure of the Redis documentation. The explanation of the correct alternative now says that a slow disk can stretch the window a little |
| `cache-redis-data-structures-persistence-10` | Portuguese reviewer: since Redis 7.0 the AOF has a base file that may be in RDB format, which could make "loads `dump.rdb` and then replays the AOF" look plausible | key kept: that base file belongs to the AOF and is not `dump.rdb`. The explanation of that distractor now says so |
| `cache-stampede-penetration-avalanche-01` | Portuguese reviewer: the idiom is "estouro da manada", not "estouro de manada"; and "thundering herd" is given as an exact synonym of cache stampede | question rewritten (form only): "estouro da manada" is now used in the whole area, including the name of the topic in `coverage.json`. Key kept: the statement lists the names by which the problem is commonly known, which is how the source material uses them |

The changes above were made after the reviewers answered. They change no key and no computed value, and `bun run quiz:validate cache --strict` passes after them.

## Checks made by the authors

- The questions were written by four writer agents, two topics each. The area owner read the statement, the snippet and the alternatives of all 100 questions in English before the blind review, and sampled the Portuguese text and the explanations. Every trace and computed value (eviction order, misses, remaining TTL, freshness, hit rate, average latency, number of flushed updates) was recomputed by the owner, and again by both blind reviewers.
- Sources consulted by the writers: RFC 9111 (sections 3.5, 4.2, 4.3.4 and 5.2), RFC 9110 (validators and conditional requests), RFC 5861, RFC 8246, and on redis.io the pages of `EXPIRE`, `TTL`, `SET`, `GETEX`, `KEYS`, `PERSIST`, `INCR`, `SADD`, `LPUSH`, `ZRANGE`, key eviction, persistence, replication, data types, HyperLogLog and transactions, plus the default values in `redis.conf`.
- The correct alternative was written first and then moved to a seeded pseudo-random position: 20 questions per index. It is strictly the longest alternative in 5 of 100 questions.
- No statement depends on `example`: no question of the area has one. Headers, command sessions, traces and timelines are in `snippet`.

## Known weaknesses

- Not verified on a page of its own, and answered from general knowledge of Redis: the cursor behaviour of `SCAN` (concept of `invalidation-ttl-09`), that `KEYS` blocks other clients because commands run one at a time (same question), and the extra memory used by copy-on-write during `BGSAVE` (`redis-data-structures-persistence-09`).
- The policies `allkeys-lrm` and `volatile-lrm` of recent Redis versions are not covered. `eviction-policies-09` says "read or written longest ago" so that only `volatile-lru` fits.
- Ideas of the outline that have no question of their own and appear only in concepts or distractors: heuristic freshness, `must-revalidate`, `stale-if-error`, the request directive `Cache-Control: no-cache`, the cache key of a CDN, Belady's optimal algorithm, the FIFO anomaly and `volatile-ttl`.
