# NGINX against Caddy: one instance fails during load

Generated at 2026-10-08T00:58:16.456Z.

## Machine

- CPU seen by Docker: AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores
- Memory seen by Docker: 15.6 GiB
- Proxies: nginx:1.30.5-alpine and caddy:2.11.7-alpine
- Back ends and load generator: bun 1.4.2, on the same machine and docker network as the proxies
- Command: `docker compose --profile lab run --rm lab`

## Method

Each run sends 100 requests per second for 14 s (1400 requests, open loop) through one proxy. At 2 s the instance `api-3` fails for 4 s and then comes back. The client gives up on a request after 3 s.

- **crash**: the instance closes its listening socket and every open connection, like a process that died. New connections are refused immediately.
- **freeze**: the instance keeps accepting connections and answers nothing until the failure ends, like a process stuck in a lock or in a long pause.
- **default**: three upstreams and round robin, nothing else. **tuned**: timeouts, retries and health checks, as written in `nginx/nginx.conf` and `caddy/Caddyfile`.
- **Errors**: requests with no answer or an answer other than 200.
- **Slow**: requests answered with 200 after more than 250 ms.
- **Recovery time**: from the failure to the moment the last lost or slow request was sent. Zero means that no client noticed.
- **Back in rotation**: from the return of the instance to its first answer through the proxy.

Every cell is the median of the runs, with the smallest and largest value in parentheses.

| Proxy | Configuration | Failure | Runs | Errors | Slow | Recovery time (ms) | Back in rotation (ms) |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| nginx | default | crash | 3 | 0 (0 to 0) | 0 (0 to 0) | 0 (0 to 0) | 6980 (6979 to 6980) |
| nginx | tuned | crash | 3 | 0 (0 to 0) | 0 (0 to 0) | 0 (0 to 0) | 3980 (3980 to 3980) |
| caddy | default | crash | 3 | 133 (133 to 134) | 0 (0 to 0) | 4000 (3999 to 4010) | 30 (29 to 40) |
| caddy | tuned | crash | 3 | 0 (0 to 0) | 0 (0 to 0) | 0 (0 to 0) | 691 (690 to 700) |
| nginx | default | freeze | 3 | 33 (33 to 34) | 92 (92 to 92) | 3740 (3740 to 3750) | 10 (9 to 20) |
| nginx | tuned | freeze | 3 | 0 (0 to 0) | 34 (34 to 34) | 999 (999 to 1010) | 1900 (1890 to 1910) |
| caddy | default | freeze | 3 | 34 (33 to 34) | 92 (91 to 92) | 3740 (3730 to 3750) | 20 (10 to 30) |
| caddy | tuned | freeze | 3 | 0 (0 to 0) | 34 (34 to 34) | 1007 (989 to 1010) | 1018 (999 to 1019) |
