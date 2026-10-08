# Load balancing

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A load balancer spreads requests over several servers so that a service can handle more traffic than one machine and survive the loss of one. The topic covers where the balancing happens (transport or application layer), how a server is chosen (round robin, least connections, hashing), how dead servers are detected and avoided, and the related roles of reverse proxy, TLS termination and API gateway.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| NGINX against Caddy (`nginx-vs-caddy`) | How balancing algorithms distribute requests and survive a dead node | planned |
| Hand-written L7 load balancer (`l7-load-balancer`) | What a load balancer does on every request | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/load-balancing/`).
- Documentation: planned (`docs/en/load-balancing/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Load Balancing](https://samwho.dev/load-balancing/), Sam Rose. Free. An interactive visual essay that shows round robin, least connections and their effect on latency.
- [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), Cloudflare Learning Center. Free. A short plain definition with the common algorithms and the idea of health checks.
- [Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), NGINX. Free. The official introduction: an upstream block, the balancing methods, weights and passive health checks.

### Books

- [Site Reliability Engineering: Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Google. Free. How traffic reaches a datacentre: DNS, virtual IPs and consistent hashing at the network level.
- [Site Reliability Engineering: Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Google. Free. Why simple policies fail at scale, with subsetting and weighted round robin.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. The chapters on replication and partitioning explain request routing and rebalancing.

### Papers and specifications

- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger and others (1997). Free. The paper that introduced consistent hashing, so that adding a server moves few keys.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/), Eisenbud and others, Google (2016). Free. How a layer 4 balancer is built from commodity servers, with its own consistent hashing.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Free. Why the slowest requests dominate large systems and how hedging and load balancing reduce them.
- [The Power of Two Random Choices: A Survey of Techniques and Results](https://www.eecs.harvard.edu/~michaelm/postscripts/handbook2001.pdf), Mitzenmacher, Richa and Sitaraman (2001). Free. The mathematics behind picking the less loaded of two random servers.
- [Implementing health checks](https://aws.amazon.com/builders-library/implementing-health-checks/), David Yanacek, Amazon Builders' Library. Free. The kinds of health checks, what each one detects and how they can cause outages.

### Official documentation

- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), NGINX. Free. The reference of every directive: least_conn, ip_hash, hash, max_fails, fail_timeout, keepalive.
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), Caddy project. Free. Load balancing policies, active and passive health checks and retries in the Caddyfile.
- [HAProxy documentation](https://docs.haproxy.org/), HAProxy. Free. The manual of the classic open source balancer, for comparing options and vocabulary.
- [Envoy: Load balancing](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/overview), Envoy Project Authors. Free. A clear description of balancer types, outlier detection, zone awareness and panic thresholds.
- [Go: httputil.ReverseProxy](https://pkg.go.dev/net/http/httputil#ReverseProxy), The Go Authors. Free. The standard library building block for writing a layer 7 proxy in Go.

### Videos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Free. Videos on layer 4 against layer 7 balancing, proxies, NGINX and HAProxy.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Free. Short animated videos on balancing algorithms, reverse proxies and API gateways.

### Practice and tools

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Free. The load testing tool used to drive the balancers in the mini-projects, on local targets only.

### Communities

- [Server Fault: load-balancing tag](https://serverfault.com/questions/tagged/load-balancing), Stack Exchange. Free. Operational questions answered by system administrators.
- [Caddy Community](https://caddy.community/), Caddy project. Free. The official forum, where the maintainers answer configuration questions.
