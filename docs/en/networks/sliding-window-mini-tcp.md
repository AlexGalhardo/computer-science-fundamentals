# Sliding window and a mini TCP

> Versão em português: [docs/pt/networks/sliding-window-mini-tcp.md](../../pt/networks/sliding-window-mini-tcp.md)

Mini-project: [`projects/networks/sliding-window-mini-tcp`](../../../projects/networks/sliding-window-mini-tcp/README.md). Languages: Go and Elixir. Quiz topics: `networks` / `data-link-layer` and `networks` / `transport-layer`.

## The problem

A network delivers packets on a best-effort basis: a packet may be lost, arrive twice, or arrive after a packet sent later. Applications want the opposite: every byte, once, in order. The protocols in this mini-project build the second thing out of the first using only three tools: **sequence numbers**, **acknowledgements** and **timers**.

## Part 1: the simulated channel

`go/channel` (and `elixir/lib/sliding_window_mini_tcp/channel.ex`) models one direction of a link. Handing it a packet at tick `now` returns the ticks at which copies arrive:

| Result | Meaning |
| --- | --- |
| no arrival | the packet was lost |
| two arrivals | the packet was duplicated |
| an arrival later than that of a newer packet | reordering |

Every random decision comes from one generator seeded by the configuration. The same seed gives the same losses at the same ticks, which a test checks by comparing two traces. A reproducible channel is what makes a protocol bug debuggable.

## Part 2: three protocols, one engine

`go/arq` describes a protocol by two numbers, the send window and the receive window:

| Protocol | Send window | Receive window | Acknowledgement | On timeout |
| --- | --- | --- | --- | --- |
| stop-and-wait | 1 | 1 | cumulative | resend the frame |
| go-back-N | N | 1 | cumulative | resend the whole window |
| selective repeat | N | N | one per frame | resend only the frame that expired |

The simulated link carries one frame per tick with a delay of 5 ticks, so a round trip is at least 10 ticks. That is why stop-and-wait delivers about 0.09 frames per tick with no loss: it sends one frame and idles for the rest of the round trip. A window fills that idle time.

### Sequence numbers wrap around

Frames carry a 16-bit sequence number. Each side recovers the real position from the distance to the edge of its window, modulo 2^16. For this to be unambiguous the window is limited: 2^n - 1 for go-back-N and 2^(n-1) for selective repeat, because a receiver that buffers must never see its old window and its new window overlap. `MaxWindow` encodes the rule and a test checks it with 3 bits (7 and 4).

The classic 1-bit stop-and-wait is correct only on a channel that keeps order. This channel reorders, so all three protocols use the 16-bit space.

### What the simulation shows

From [results/results.md](../../../projects/networks/sliding-window-mini-tcp/results/results.md), a 256 KiB file in 256 frames, window of 8:

| loss | protocol | ticks | frames sent | efficiency |
| --- | --- | --- | --- | --- |
| 0% | stop-and-wait | 2878 | 256 | 100.0% |
| 0% | go-back-N | 1832 | 522 | 49.0% |
| 0% | selective repeat | 444 | 256 | 100.0% |
| 20% | stop-and-wait | 6933 | 417 | 61.4% |
| 20% | go-back-N | 5099 | 1154 | 22.2% |
| 20% | selective repeat | 2037 | 417 | 61.4% |

- Go-back-N retransmits even with 0% loss. The channel still reorders 20% of the copies, and a receiver that accepts only the next frame in order throws the early ones away. Reordering costs go-back-N as much as loss does.
- Selective repeat and stop-and-wait send exactly the same number of frames: both resend only what was actually lost. Selective repeat just does it several times faster.
- Every row ends with the same SHA-256 as the original file, at every loss rate.

## Part 3: the mini TCP over UDP

`go/minitcp` runs on real UDP sockets on the loopback interface. Loss is injected where each socket sends, in both directions, because loopback itself practically never drops a packet.

| Mechanism | How it appears in the code |
| --- | --- |
| Three-way handshake | SYN, SYN+ACK, ACK with initial sequence numbers; later segments must acknowledge the receiver's number, so strays are ignored |
| Byte sequence numbers | `seq` is the number of the first byte of the payload, 32 bits, compared with wrap-around arithmetic |
| Cumulative ACK | `ack` is the next byte expected; an extra `sack` field names the segment that triggered the ACK, used by selective repeat |
| Retransmission timeout | smoothed round-trip time plus four times the deviation; doubled on timeout; Karn's rule skips retransmitted segments |
| Orderly close | FIN, FIN+ACK, and the receiver lingers to repeat its last answer, like TIME_WAIT |
| Integrity | CRC-32 on every segment, SHA-256 on the whole file |

The sender can recover from loss in the same three ways as the simulation. Measured on the committed run (10 MB, 5% loss in each direction, 3 runs):

| protocol | MB/s (mean ± std dev) | segments sent | timeouts |
| --- | --- | --- | --- |
| stop-and-wait | 3.96 ± 0.14 | 9186 | 852 |
| go-back-N, window 32 | 7.43 ± 0.54 | 22323 | 438 |
| selective repeat, window 32 | 15.72 ± 0.30 | 9079 | 209 |

Go-back-N sends about two and a half times the segments to move the same file. These times depend on the machine and on scheduling, so they are not reproducible to the digit; the report records the processor and the runtime, and what holds across runs is the order of the three.

## Why Elixir too

The Elixir version repeats the simulation as a pure function. The whole transfer is one immutable struct; each tick is a pipeline of four functions that return the next struct; the loop is recursion with one clause per situation. The random generator is a value threaded through the calls, so determinism needs no discipline: there is no hidden state to forget. The numbers differ from the Go table because the two languages use different generators, but each one is repeatable on its own.

## Limits

- No congestion control: the window is fixed. Slow start and AIMD are quiz material, not implemented here.
- No flow control window advertised by the receiver.
- One connection per socket, one direction of data.
- The mini TCP is not interoperable with real TCP. It is a teaching protocol and runs only on the loopback interface.

## Verifying

```sh
cd projects/networks/sliding-window-mini-tcp
docker compose run --rm -T go-test
docker compose run --rm -T elixir-test
docker compose run --rm -T go-demo
```
