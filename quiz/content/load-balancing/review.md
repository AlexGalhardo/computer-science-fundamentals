# Blind review: load-balancing

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was done

Two independent reviewer agents, one per language, each read only its blind export (`bun run quiz:blind load-balancing` and `bun run quiz:blind load-balancing --lang pt`) and wrote an answers file. Both were compared with `bun run quiz:compare load-balancing <answers>`:

| Reviewer | Questions | Agreements | Disagreements | Notes |
| --- | ---: | ---: | ---: | ---: |
| English | 100 | 100 | 0 | 2 |
| Portuguese | 100 | 100 | 0 | 5 |

## Reviewer notes

Neither reviewer disagreed with the key. They flagged six questions, one of them in both languages.

### load-balancing-reverse-proxy-load-balancer-api-gateway-09

- Reviewer note (English): many real API gateways also balance across replicas, so "the gateway makes both decisions" is defensible. That alternative is wrong only because of its justification.
- Resolution: **question rewritten**. The statement now says that each service runs its replicas behind its own load balancer, so the architecture described has two components and the gateway cannot be making both decisions. Key kept.

### load-balancing-sticky-sessions-08

- Reviewer note (both languages): an HMAC of the address is opaque but cannot be reversed, so "store an HMAC of the address" is imprecise as a fix. The balancer has to compare the value with the one it computes for each known back end.
- Resolution: **question rewritten**. The correct alternative now reads "an opaque value that only the balancer can map to a back end", and the concept explains that the balancer compares the received value with the one computed for each known back end. Key kept.

### load-balancing-tls-termination-01

- Reviewer note (Portuguese): the definition ties TLS termination to plain HTTP towards the back ends, but re-encryption (question 03 of the topic) also terminates TLS at the balancer.
- Resolution: **question rewritten**. The statement now asks for termination "in its plain form (no re-encryption towards the back ends)". Key kept.

### load-balancing-tls-termination-03

- Reviewer note (Portuguese): "recifragem" is an unusual word.
- Resolution: **question rewritten** (Portuguese text only). It now uses "recriptografia", with the English term re-encryption next to it in the concept. Key kept.

### load-balancing-health-checks-and-failover-10

- Reviewer note (Portuguese): "vivacidade" is a strange word for liveness.
- Resolution: **question rewritten** (Portuguese text only). The explanations and the concept now use the established terms liveness and readiness. The alternatives keep "viva" and "pronta", which read naturally. Key kept.

### load-balancing-consistent-hashing-05

- Reviewer note (Portuguese): "faltas no cache" is an odd translation of cache misses.
- Resolution: **question rewritten** (Portuguese text of one wrong alternative). It now says "cache misses". Key kept.

## Facts checked against the running proxies

Both reviewers answered the product-specific questions from memory. The ones below were also checked by the author against the documentation of NGINX 1.30 and Caddy 2.11 and, where a mini-project shows the behaviour, against the running containers of `projects/load-balancing/nginx-vs-caddy` (`nginx:1.30.5-alpine`, `caddy:2.11.7-alpine`):

| Question | Fact | Checked by |
| --- | --- | --- |
| `caddy-configuration-03` | The default `lb_policy` is `random` | Caddy documentation, `reverse_proxy` |
| `caddy-configuration-06` | With no health check and no retry, about one request in three fails for as long as one of three upstreams is down | Documentation, and the integration test "caddy: the default configuration keeps sending requests to a crashed instance" |
| `nginx-configuration-06` | A POST already sent is not passed to the next server unless `non_idempotent` is listed | NGINX documentation, `proxy_next_upstream` |
| `nginx-configuration-09` | `ip_hash` uses the first three octets of an IPv4 address | Documentation, and the integration test "nginx: ip_hash sends a whole /24 network to one instance" |
| `nginx-configuration-10` | Defaults `max_fails=1`, `fail_timeout=10s`, and no periodic probe in open source NGINX | Documentation, and the integration test "nginx: the default configuration already hides a crashed instance" |
| `tls-termination-06` | `proxy_ssl_verify` is `off` by default | NGINX documentation, `ngx_http_proxy_module` |
