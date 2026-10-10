# http-versions

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

One page with **200 small images**, served by the same Caddy over **HTTP/1.1, HTTP/2 and HTTP/3**, and loaded by a real Chromium. The mini-project teaches what multiplexing and QUIC change for a page with many resources: how the protocol is negotiated, why HTTP/1.1 suffers as soon as the network has latency, what one connection carrying every request looks like, and what packet loss does to each version.

Explanation of the concepts: [docs/en/protocols/http-versions.md](../../../docs/en/protocols/http-versions.md).

## The lab

| Port | Network condition | Highest version offered | Negotiated by the browser |
| ---: | --- | --- | --- |
| 8001, 8002, 8003 | no shaping | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |
| 8101, 8102, 8103 | latency: `netem delay 50ms` | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |
| 8201, 8202, 8203 | latency and loss: `netem delay 50ms loss 2%` | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |

- All nine ports use TLS, with a certificate from **Caddy's internal certificate authority**, created inside the container. No public CA and no public domain.
- The host name is `site.http-versions.test`, an alias on the internal docker-compose network. `.test` is a reserved top-level domain.
- Latency and loss are injected with `tc netem` on the outgoing packets of the Caddy container, split by source port ([caddy/entrypoint.sh](caddy/entrypoint.sh)). That container is the only one with the `NET_ADMIN` capability.
- Nothing is published on the host and no container reaches the internet (`internal: true`).

## Total load time per protocol and condition

Measured by `docker compose run --rm bench` (machine and method in [results/results.md](results/results.md)): 10 cold loads per port, each in a new browser context (empty cache, new connection), ports interleaved.

| Condition | Protocol | Port | Mean (ms) | Std dev (ms) | Median (ms) | Min (ms) | Max (ms) | Connection setup (ms) | Half of the images (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| no shaping | HTTP/1.1 | 8001 | 598 | 149 | 561 | 395 | 915 | 2 | 359 |
| no shaping | HTTP/2 | 8002 | 605 | 214 | 533 | 455 | 1175 | 2 | 405 |
| no shaping | HTTP/3 | 8003 | 926 | 365 | 786 | 536 | 1585 | 2 | 775 |
| latency (`netem delay 50ms`) | HTTP/1.1 | 8101 | 2455 | 191 | 2453 | 2211 | 2811 | 102 | 1351 |
| latency (`netem delay 50ms`) | HTTP/2 | 8102 | 742 | 78 | 752 | 615 | 847 | 102 | 533 |
| latency (`netem delay 50ms`) | HTTP/3 | 8103 | 735 | 73 | 721 | 642 | 877 | 52 | 518 |
| latency and loss (`netem delay 50ms loss 2%`) | HTTP/1.1 | 8201 | 2539 | 191 | 2470 | 2294 | 2846 | 127 | 1385 |
| latency and loss (`netem delay 50ms loss 2%`) | HTTP/2 | 8202 | 1024 | 333 | 987 | 675 | 1567 | 102 | 645 |
| latency and loss (`netem delay 50ms loss 2%`) | HTTP/3 | 8203 | 1159 | 484 | 1009 | 678 | 2041 | 53 | 732 |

How to read it:

- **With no latency the version barely matters.** A round trip costs almost nothing, so six connections taking turns are as good as one multiplexed connection. Most of the 0.4 to 0.6 s is the browser's own work (decoding and laying out 200 images in a headless Chromium inside a container), not the network. HTTP/3 is the slowest here: QUIC runs in user space, in both the browser and Caddy, and costs more CPU per packet than TCP in the kernel. The differences between HTTP/1.1 and HTTP/2 are inside the standard deviation.
- **With 50 ms of latency HTTP/1.1 takes about 3.3 times longer** (2455 ms against 742 ms). The browser opens six connections per origin and each one carries one request at a time, so 200 images need about 34 rounds, and each round costs one round trip: 34 x 50 ms is about 1.7 s on top of the rest. HTTP/2 and HTTP/3 send the 200 requests at once on one connection.
- **Connection setup shows QUIC's handshake.** TCP then TLS 1.3 needs two round trips before the first request (about 102 ms), QUIC does transport and TLS together in one (about 52 ms).
- **With 2% loss, HTTP/3 was not faster than HTTP/2 in this run.** The two means (1024 and 1159 ms) differ by less than their standard deviations (333 and 484 ms), so this run shows no difference. See the limits below before concluding anything about head-of-line blocking.

### Limits of this measurement

- The injected loss is random and independent per packet, on the server-to-client direction only, and the page is small (about 400 kB). Each load sees only a handful of lost packets, which is why the spread under loss is large.
- "Total load time" is the worst metric for seeing QUIC's advantage. QUIC removes head-of-line blocking **between streams**: a lost packet delays only the image it belongs to, while over TCP it delays everything behind it. But the load event waits for the **last** image, and that one waits for its retransmission in both protocols.
- TCP here is the Linux kernel implementation and QUIC is two user-space implementations (Chromium and Caddy's quic-go), with different loss-recovery tuning. The table compares those implementations on this machine, not the protocols in the abstract.
- One machine shared with other workloads, 10 loads per cell. This is not a ranking.

## Waterfalls

Open [dashboard/index.html](dashboard/index.html) in a browser (from disk, no server needed). It draws the three waterfalls of the chosen condition from the committed `results/results.js`: one bar per image, on the same time axis. With latency, HTTP/1.1 is a wide triangle whose steps are groups of six images, and HTTP/2 and HTTP/3 are narrow blocks.

## Quiz topics it demonstrates

Area `protocols`:

- `http2`: multiplexing, the connection limit per origin of HTTP/1.1, negotiation with ALPN, TCP head-of-line blocking
- `http3-quic`: QUIC over UDP, the one round trip handshake, discovery with `Alt-Svc`, behaviour under loss
- `tls-handshake`: ALPN, round trips of the handshake

## Run

The only requirement is Docker.

```sh
./setup-unix-http-versions.sh        # Linux and macOS
./setup-windows-http-versions.ps1    # Windows
```

The script builds the two images, starts Caddy, runs the typecheck and the tests, and removes the containers.

## Measurement (the demo)

```sh
docker compose run --rm bench && docker compose down -v
```

It takes about two minutes, prints the table and rewrites `results/results.md`, `results/results.json` and `results/results.js` (the data of the dashboard). `BENCH_RUNS` (default 10) changes the number of loads per port. To change the conditions, edit `NETEM_LATENCY` and `NETEM_LATENCY_LOSS` in `docker-compose.yml`.

`tc netem` needs a Linux kernel with the `sch_netem`, `sch_prio` and `cls_u32` modules. It worked on Docker Desktop for Windows (WSL 2 kernel 6.18). If the kernel lacks them, the Caddy container exits at start with the `tc` error.

## Tests

```sh
docker compose run --rm ts-test && docker compose down -v
```

| File | What it proves |
| --- | --- |
| `ts/tests/protocol.spec.ts` | for each of the nine ports, the document and the 200 images were carried by the expected protocol (`nextHopProtocol`). The HTTP/1.1 port does not negotiate `h2`. The h3 port advertises `Alt-Svc`, and a browser that was not told starts with `h2` |
| `ts/tests/unit.spec.ts` | the generated page and images, the port grid and its `tc` mask, the refusal of non-local targets, the statistics and the report |

## How the browser trusts the lab certificate

No browser trusts Caddy's internal CA, and turning certificate checks off would hide real mistakes. The tests instead read the certificate the lab server presents, compute the SHA-256 of its public key, and start Chromium with `--ignore-certificate-errors-spki-list=<that hash>`: certificate checking stays on, with exactly one extra key accepted. `--origin-to-force-quic-on` makes the browser use QUIC on the h3 ports from the first request (see `ts/src/browser.ts`).

## Structure

| Path | Content |
| --- | --- |
| `caddy/Caddyfile` | nine listeners, protocols per listener, internal TLS |
| `caddy/entrypoint.sh` | `tc netem` by source port, then Caddy |
| `ts/src/site.ts` | the page and the 200 PNG tiles, generated when the Caddy image is built |
| `ts/src/browser.ts` | Chromium flags, one cold page load, timings from the browser |
| `ts/src/report.ts`, `ts/bench/measure.spec.ts` | statistics, table, waterfall data, the measurement |
| `dashboard/` | the static page with the three waterfalls |

## Versions

| Component | Version |
| --- | --- |
| Caddy | 2.11.7 (`caddy:2.11.7-alpine`) |
| Playwright and its Chromium | 1.63.0 (`mcr.microsoft.com/playwright:v1.63.0-noble`, Chromium 153) |
| Bun | 1.4.2 (`oven/bun:1.4.2`) |
| Zod | 4.6.5 |
| Tailwind CSS | 4.3.3 (dashboard CSS, built with `bun run dashboard:css`) |
