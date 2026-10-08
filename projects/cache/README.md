# Cache

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A cache keeps a copy of something expensive to compute or fetch, so that the next request is served faster. Caches sit at every level (browser, CDN, application, database, CPU), and they all raise the same questions: what to keep, when to throw it away, how to know it is stale, and what happens when many clients miss at once. Getting those answers wrong trades a slow system for an incorrect one.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Cache strategies and stampede (`cache-strategies`) | How caching patterns behave and how they fail | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/cache/`).
- Documentation: planned (`docs/en/cache/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), Mozilla. Free. The clearest guide to private and shared caches, freshness, validation and the Cache-Control directives.
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/), Amazon Web Services. Free. A short overview of lazy loading, write-through, time to live and eviction.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Free. The most common application pattern described with its consistency issues and when to use it.
- [Caching Tutorial for Web Authors and Webmasters](https://mnot.net/cache_docs/), Mark Nottingham. Free. A classic plain tutorial on how browser and proxy caches decide what to store and serve.

### Books

- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. Treats caches as derived data and explains the consistency problems of keeping two copies.
- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. Paid. The chapter on the memory hierarchy explains locality and how CPU caches work.

### Papers and specifications

- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), Fielding, Nottingham and Reschke, IETF. Free. The specification of freshness, validation, invalidation and every cache directive.
- [Scaling Memcache at Facebook](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), Nishtala and others (2013). Free. How a very large cache tier deals with stale sets, thundering herds and regional consistency.
- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Vattani, Chierichetti and Lowenstein (2015). Free. The paper behind probabilistic early expiration, a simple fix for the stampede.
- [RFC 5861: HTTP Cache-Control Extensions for Stale Content](https://www.rfc-editor.org/rfc/rfc5861), Mark Nottingham, IETF. Free. The definition of stale-while-revalidate and stale-if-error.
- [TinyLFU: A Highly Efficient Cache Admission Policy](https://arxiv.org/abs/1512.00727), Einziger, Friedman and Manes (2015). Free. A modern eviction design that combines frequency and recency, used in the Caffeine library.
- [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/), Matt Brinkley and Jas Chhabra, Amazon Builders' Library. Free. Hard-won advice on when a cache is worth it and how it becomes a source of outages.

### Official documentation

- [Redis documentation](https://redis.io/docs/latest/), Redis. Free. The official reference for data types, commands, expiration and client-side caching.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis. Free. How maxmemory policies work and how Redis approximates LRU and LFU.
- [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), Redis. Free. The trade-offs between snapshots (RDB) and the append-only file (AOF).
- [NGINX Content Caching](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/), F5 NGINX. Free. How a reverse proxy cache is configured, including cache locking against stampedes.
- [Cloudflare Cache documentation](https://developers.cloudflare.com/cache/), Cloudflare. Free. How a CDN decides what to cache, for how long and how purging works.

### Videos

- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Free. Short animated videos on caching strategies, eviction and the classic cache failure modes.

### Practice and tools

- [Caffeine: Efficiency](https://github.com/ben-manes/caffeine/wiki/Efficiency), Ben Manes. Free. Hit-rate comparisons of eviction policies on real traces.
- [REDbot](https://redbot.org/), Mark Nottingham. Free. Checks the caching headers of a URL you own and explains what caches will do with them.

### Communities

- [Stack Overflow: caching tag](https://stackoverflow.com/questions/tagged/caching), Stack Overflow. Free. Answered questions on invalidation, headers and cache design.
- [r/redis](https://www.reddit.com/r/redis/), Reddit. Free. Community questions on Redis usage and operation.
