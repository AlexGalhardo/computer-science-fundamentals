# Rate limiting

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Rate limiting caps how many requests a client may make in a period, to protect a service from overload, abuse and unfair use. The algorithms (fixed window, sliding window, token bucket, leaky bucket) differ in how they treat bursts and in how much state they need, and running them across several servers raises questions of atomicity. The other half of the subject is the client: the 429 status, retry headers and backoff.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Rate limiter algorithms (`rate-limiter`) | How each algorithm treats bursts | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/rate-limiting/`).
- Documentation: planned (`docs/en/rate-limiting/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Visualizing algorithms for rate limiting](https://smudge.ai/blog/ratelimit-algorithms), smudge.ai. Free. Interactive demonstrations of fixed window, sliding window and token bucket, side by side.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe. Free. The four kinds of limiter a payments API runs in production, and why each exists.
- [What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/), Cloudflare Learning Center. Free. A short plain definition of the idea and of what it protects against.

### Books

- [Site Reliability Engineering: Handling Overload](https://sre.google/sre-book/handling-overload/), Google. Free. Per-customer limits, client-side throttling and graceful degradation in a large service.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Paid. The source of the quiz for traffic shaping with the leaky bucket and the token bucket.

### Papers and specifications

- [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585), Fielding and Nottingham, IETF. Free. The definition of 429 Too Many Requests and its use with Retry-After.
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), Wikipedia. Free. The algorithm, its parameters, the burst size formula and its relation to the leaky bucket.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog. Free. Simulations that show why retrying clients need randomness, not only growing delays.
- [RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/), IETF HTTPAPI Working Group. Free. The draft standard for telling clients their quota and when it resets.
- [Rate Limiting, Cells, and GCRA](https://brandur.org/rate-limiting), Brandur Leach. Free. Explains the generic cell rate algorithm, a leaky bucket that needs only one timestamp per key.
- [How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/), Julien Desgats, Cloudflare. Free. The sliding window counter approximation and its measured error at scale.
- [Using load shedding to avoid overload](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/), David Yanacek, Amazon Builders' Library. Free. Why a server should reject excess work early instead of becoming slow for everyone.

### Official documentation

- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), NGINX. Free. The reference of the leaky bucket limiter of NGINX: rate, burst, nodelay and delay.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/), Redis. Free. The command page includes the classic rate limiter patterns and the race they must avoid.
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis. Free. How to make read-then-write logic atomic on the server, the basis of distributed limiters.
- [Rate limits for the GitHub REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), GitHub. Free. A real public API explaining primary and secondary limits and its response headers.
- [Go: golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate), The Go Authors. Free. A small token bucket implementation worth reading for its interface.

### Videos

- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Free. Short animated explanations of the rate limiting algorithms from the System Design Interview book.

### Practice and tools

- [Rate Limiting with NGINX](https://blog.nginx.org/blog/rate-limiting-nginx), NGINX Community Blog. Free. A worked configuration that shows the effect of burst and nodelay.

### Communities

- [Stack Overflow: rate-limiting tag](https://stackoverflow.com/questions/tagged/rate-limiting), Stack Overflow. Free. Answered questions on implementing and configuring limiters.
