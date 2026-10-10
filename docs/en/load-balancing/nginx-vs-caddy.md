# NGINX against Caddy

> Versão em português: [docs/pt/load-balancing/nginx-vs-caddy.md](../../pt/load-balancing/nginx-vs-caddy.md) · Versión en español: [docs/es/load-balancing/nginx-vs-caddy.md](../../es/load-balancing/nginx-vs-caddy.md)

Mini-project: [projects/load-balancing/nginx-vs-caddy](../../../projects/load-balancing/nginx-vs-caddy/README.md) (MP-LB-1). Languages: configuration files and TypeScript.

## The problem

One server has a ceiling. To go past it you run several copies of the application and put something in front that decides, for every request, which copy answers. That something is a load balancer, and two decisions define it:

- **Who gets the next request?** The balancing algorithm.
- **What if the chosen one is dead?** Health checks and retries.

NGINX and Caddy both answer these questions, with different words and, more importantly, with different defaults. The mini-project puts the same three instances behind both and measures.

## The algorithms

| Algorithm | What it looks at | Promise | Weak point |
| --- | --- | --- | --- |
| Round robin | A counter | Equal shares | Blind to load: a slow instance still gets its full share |
| Weighted round robin | A counter and a weight | Shares proportional to the weights | The weights are a guess made in advance |
| Least connections | Requests in progress | The busiest instance gets less | Needs the counters to be shared by every worker of the balancer |
| IP hash | The client address | The same client reaches the same instance | Uneven when many users share one address, and NGINX hashes only the first three octets of IPv4 |

### Why least connections gives one ninth to a slow instance

The lab makes `api-3` answer in 40 ms and the others in 10 ms, and keeps 30 requests in flight. Least connections keeps about 10 on each instance. An instance holding 10 requests of 10 ms finishes 1000 per second, and one holding 10 requests of 40 ms finishes 250 per second:

```text
rate     = in flight / time per request
api-1    = 10 / 0.010 s = 1000 requests/s
api-2    = 10 / 0.010 s = 1000 requests/s
api-3    = 10 / 0.040 s =  250 requests/s
share of api-3 = 250 / 2250 = 1/9 = 11.1%
```

Measured: 12.0% on NGINX and 12.3% on Caddy. Round robin, under the same load, sends one third of the requests to the slow instance, where they pile up.

### Where the client address comes from

IP hash needs the address of the client, and behind any proxy the TCP connection comes from the proxy. The address then travels in `X-Forwarded-For`, a header that any client can also write. Both configurations say explicitly whom they believe: `set_real_ip_from` in NGINX and `trusted_proxies` in Caddy. In the lab that is the private network of docker-compose. On the internet it must be only the addresses of your own proxies, otherwise a client can choose its own "address" and, with it, its instance.

## When an instance fails

There are two ways to find out that a back end is dead:

- **Passive check**: the balancer watches the real requests. A failure costs at least one real request, and after a penalty period a real request is used to try again.
- **Active check**: the balancer sends its own probe at a fixed interval, with or without traffic.

And there is what to do with the request that found the failure: answer with an error, or **retry** it on another instance. A retry is always safe when the connection was never opened. After the request was sent it is safe only for idempotent requests such as GET, because a POST may already have been executed.

The lab breaks `api-3` in two ways:

| Failure | What the proxy sees | What reveals it |
| --- | --- | --- |
| Crash | Connection refused, immediately | The first attempt |
| Freeze | Connection accepted, no answer | Only a timeout |

Results, with 100 requests per second and a failure of 4 s (full table in [results/failure.md](../../../projects/load-balancing/nginx-vs-caddy/results/failure.md)):

| | NGINX default | Caddy default | Both, tuned |
| --- | --- | --- | --- |
| Crash | 0 errors | 133 errors, for as long as the instance is down | 0 errors |
| Freeze | 33 errors, 92 slow | 34 errors, 92 slow | 0 errors, 34 slow for about 1 s |

The lessons:

1. **Defaults are a design decision of each product.** NGINX retries on the next server after a connection error and skips the failed server for 10 s. Caddy does neither until asked (`lb_try_duration`, `fail_duration`, `health_uri`).
2. **Timeouts are part of health checking.** With a 60 s timeout a frozen back end holds requests for 60 s. Nothing else in the configuration matters until the timeout is short.
3. **Open source NGINX has no active check.** The `health_check` directive belongs to the commercial version. Its passive check is the pair `max_fails` and `fail_timeout`.
4. **NGINX resolves upstream names once.** If the container of an instance is recreated with another address, NGINX keeps the old one. The lab hit this while it was being written: after the instances were recreated, weights 3, 2, 1 were being applied to the wrong instances. The `resolve` parameter with a `resolver` fixes it.

## The two configurations side by side

| Idea | NGINX | Caddy |
| --- | --- | --- |
| Group of back ends | `upstream name { server ...; }` plus `proxy_pass http://name;` | `reverse_proxy a b c` |
| Default algorithm | Weighted round robin | `random` |
| Least connections | `least_conn;` | `lb_policy least_conn` |
| Hash of the client address | `ip_hash;` | `lb_policy client_ip_hash` |
| Passive check | `max_fails=1 fail_timeout=10s` (defaults) | `fail_duration`, off by default |
| Active check | Commercial version only | `health_uri`, `health_interval` |
| Retry | `proxy_next_upstream error timeout` (default) | `lb_try_duration`, off by default |
| Trusted proxies | `set_real_ip_from`, `real_ip_header` | `trusted_proxies` |

## Local targets only

The load generator is a small TypeScript program, and it follows the same rule as k6 in the other mini-projects: every target is checked against a closed list (loopback and the service names of the compose file) before the first request, a test proves that `https://example.com` is refused, and the back ends live on a docker network marked `internal`.

## Quiz

Topics of the `load-balancing` area that this mini-project demonstrates: `balancing-algorithms`, `health-checks-and-failover`, `sticky-sessions`, `nginx-configuration`, `caddy-configuration`, `reverse-proxy-load-balancer-api-gateway` and `layer-4-vs-layer-7`.
