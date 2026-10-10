# HTTP/1.1, HTTP/2 and HTTP/3 (MP-PROTO-2)

> Versão em português: [docs/pt/protocols/http-versions.md](../../pt/protocols/http-versions.md) · Versión en español: [docs/es/protocols/http-versions.md](../../es/protocols/http-versions.md)

Mini-project: [`projects/protocols/http-versions`](../../../projects/protocols/http-versions/README.md). Quiz topics: `http2`, `http3-quic`, `tls-handshake`.

## The question

The three versions carry the same thing: methods, status codes, headers and bodies did not change. What changed is **how the messages are put on the wire**, and that decides how many requests can be in flight at the same time and what one lost packet costs. A page with 200 small images makes the difference visible, because its load time depends on concurrency, not on bandwidth.

## What each version changes

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| Transport | TCP | TCP | QUIC, over UDP |
| Message format | text | binary frames | binary frames |
| Requests in flight per connection | 1 | many (streams) | many (streams) |
| What browsers do about it | about 6 connections per origin | 1 connection | 1 connection |
| Header compression | none | HPACK | QPACK |
| Handshake before the first request (with TLS 1.3) | 2 round trips | 2 round trips | 1 round trip |
| A lost packet delays | its connection | every stream of the connection | only its own stream |

### HTTP/1.1: one request at a time per connection

A connection carries one request, waits for the whole response, and only then carries the next. Browsers work around it by opening about six connections per origin. With 200 images that is 34 rounds of six, and every round costs a round trip. On a link with no latency nobody notices. With 50 ms per round trip the page takes about 1.7 s longer.

### HTTP/2: multiplexing

HTTP/2 splits every message into binary **frames** tagged with a **stream** number, so frames of many requests can be interleaved on one connection and put back together at the other side. The browser sends the 200 requests at once, and the cost of the round trip is paid about once, not 34 times.

What is left is **head-of-line blocking in TCP**. TCP delivers bytes in order. When one packet is lost, everything received after it waits in the kernel until the retransmission arrives, even the frames of streams that lost nothing. One connection means that one lost packet stalls every stream.

### HTTP/3: QUIC

QUIC is a transport built on UDP that knows about streams. Each stream is delivered in order by itself, so a lost packet delays only the streams whose data it carried. QUIC also merges the transport handshake with TLS 1.3: one round trip instead of two. And because it runs in user space, inside the browser and the server, it costs more CPU per packet than kernel TCP.

## Negotiation: how the client and the server agree on a version

- **HTTP/1.1 or HTTP/2: ALPN.** Inside the TLS handshake the client lists the protocols it speaks (`h2`, `http/1.1`) and the server picks one. No extra round trip. On port 8001 the server offers only `http/1.1`, on 8002 it offers both and `h2` wins.
- **HTTP/3: Alt-Svc.** HTTP/3 is on UDP, so it cannot be chosen inside a TCP handshake. A browser with no prior knowledge starts over TCP, and the server tells it in a response header that the same origin is also available over QUIC: `alt-svc: h3=":8003"`. The browser uses HTTP/3 from the next connection. The test asserts both halves: the header is there, and the first document of an untold browser arrives over `h2`.
- For the measurement the browser is started with `--origin-to-force-quic-on`, so that the very first load already uses HTTP/3 and the three versions are compared on a cold connection.

The test for each port does not trust the configuration. It asks the browser which protocol carried the document and each image (`nextHopProtocol` of the Resource Timing API).

## TLS inside the lab

Every port uses TLS, with `tls internal` in the Caddyfile: Caddy creates its own certificate authority inside the container and issues the certificate for `site.http-versions.test`. Nothing public is involved. The browser is not told to ignore certificate errors. It receives the SHA-256 of the public key of the lab certificate (`--ignore-certificate-errors-spki-list`), read by the test from the server itself, and accepts that one key.

## Injected latency and loss

`tc netem` is the network emulator of the Linux kernel. `caddy/entrypoint.sh` attaches it to the outgoing interface of the Caddy container and selects packets by **source port**, so one server offers the three conditions at once:

```text
prio qdisc (3 bands)
  band 1                              ports 80xx   untouched
  band 2  netem delay 50ms            ports 81xx   filter: sport & 0xfffc == 8100
  band 3  netem delay 50ms loss 2%    ports 82xx   filter: sport & 0xfffc == 8200
```

Three details:

- The shaping is on the server's outgoing packets because that is the direction the images travel. The delay is one-way, so it adds about 50 ms to a round trip.
- Segmentation offload is turned off (`ethtool -K eth0 tso off gso off gro off`). With it on, the kernel hands netem one large buffer that becomes many TCP segments later, and one "drop" would discard all of them.
- This needs the `NET_ADMIN` capability, given to the Caddy container only. It lets the container configure its own interface, inside its own network namespace.

## Reading the results

The committed table is in the [README](../../../projects/protocols/http-versions/README.md#total-load-time-per-protocol-and-condition) and in `results/results.md`.

- No shaping: the versions are within the standard deviation of each other, except HTTP/3, which is slower because of the CPU cost of QUIC in user space. Most of the time is the browser's work.
- Latency: HTTP/1.1 takes about 3.3 times longer than HTTP/2 and HTTP/3, which are equal. This is multiplexing, the main lesson of the mini-project.
- Connection setup: about 102 ms for TCP + TLS 1.3 and about 52 ms for QUIC, with a 50 ms round trip. Two round trips against one.
- Latency and loss: HTTP/2 and HTTP/3 both get slower and noisier, and **this measurement does not show HTTP/3 ahead**. The difference between them is smaller than the standard deviation.

Why the textbook advantage of QUIC under loss does not appear here, and what the measurement can and cannot say:

- The load event waits for the last image. Removing head-of-line blocking helps the images that were **not** hit by a loss to finish early. It does not help the one that was hit, and the total is decided by that one.
- The page is small and the loss is random, so each load sees a handful of losses. A larger transfer, or bursts of loss, would separate the two more.
- The comparison is between implementations: kernel TCP with decades of loss-recovery tuning against user-space QUIC stacks.

## The waterfall

`dashboard/index.html` draws, for the chosen condition, one bar per image for each version, from the committed `results/results.js`. A bar starts when the browser wanted the image and ends when its last byte arrived. With latency:

- HTTP/1.1 is a wide triangle. All bars start early, and most of each bar is time spent **waiting for one of the six connections**. The right edge is a staircase with steps of six images.
- HTTP/2 and HTTP/3 are narrow blocks: every request leaves at once.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-PROTO-2.1 page with 200 images over the three versions | `ts/tests/protocol.spec.ts`: one test per port (9 ports) asserts `nextHopProtocol` of the document and of the 200 images |
| MP-PROTO-2.2 measurement with and without latency and loss | `docker compose run --rm bench` writes the table of total load time per protocol and condition to `results/results.md` |
| MP-PROTO-2.3 waterfall visual | `dashboard/index.html` draws the three waterfalls from the committed `results/results.js` |

## Run

```sh
cd projects/protocols/http-versions
./setup-unix-http-versions.sh        # or ./setup-windows-http-versions.ps1
docker compose run --rm bench && docker compose down -v
```
