# Results: sliding-window-mini-tcp

- Command: `docker compose run --rm -T go-demo` (inside the container: `go run ./cmd/demo`)
- Flags: mb=10 loss=0.05 runs=3 window=32
- Runtime: go1.27.1 on linux/amd64
- Machine: AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical CPUs, measured inside a Docker container with no network

## Simulated channel

File of 262144 bytes in frames of 1024 bytes. Link of 1 frame per tick, delay of 5 ticks, 5% duplication, 20% of the copies delayed by up to 6 extra ticks, seed 2026. Window of 8 frames for go-back-N and selective repeat.

| loss | protocol | ticks | frames sent | retransmissions | efficiency | frames per tick | intact (SHA-256) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0% | stop-and-wait | 2878 | 256 | 0 | 100.0% | 0.089 | yes |
| 0% | go-back-n | 1832 | 522 | 266 | 49.0% | 0.140 | yes |
| 0% | selective-repeat | 444 | 256 | 0 | 100.0% | 0.577 | yes |
| 5% | stop-and-wait | 3506 | 281 | 25 | 91.1% | 0.073 | yes |
| 5% | go-back-n | 2620 | 677 | 421 | 37.8% | 0.098 | yes |
| 5% | selective-repeat | 835 | 281 | 25 | 91.1% | 0.307 | yes |
| 10% | stop-and-wait | 4421 | 319 | 63 | 80.3% | 0.058 | yes |
| 10% | go-back-n | 3311 | 801 | 545 | 32.0% | 0.077 | yes |
| 10% | selective-repeat | 1538 | 319 | 63 | 80.3% | 0.166 | yes |
| 20% | stop-and-wait | 6933 | 417 | 161 | 61.4% | 0.037 | yes |
| 20% | go-back-n | 5099 | 1154 | 898 | 22.2% | 0.050 | yes |
| 20% | selective-repeat | 2037 | 417 | 161 | 61.4% | 0.126 | yes |
| 30% | stop-and-wait | 9685 | 527 | 271 | 48.6% | 0.026 | yes |
| 30% | go-back-n | 6435 | 1470 | 1214 | 17.4% | 0.040 | yes |
| 30% | selective-repeat | 3364 | 527 | 271 | 48.6% | 0.076 | yes |

## Mini TCP over UDP

Transfer of 10 MB (10000000 bytes) between two UDP sockets on 127.0.0.1, segments of 1200 bytes, 5% of the datagrams dropped in each direction, 3 runs per protocol. Window of 32 segments for go-back-N and selective repeat.

| protocol | MB/s mean | MB/s std dev | MB/s min | MB/s max | segments sent | retransmissions | timeouts | datagrams dropped | intact (SHA-256) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| stop-and-wait | 3.96 | 0.14 | 3.84 | 4.15 | 9186 | 852 | 852 | 850 | yes |
| go-back-n | 7.43 | 0.54 | 6.68 | 7.89 | 22323 | 13989 | 438 | 2152 | yes |
| selective-repeat | 15.72 | 0.30 | 15.36 | 16.10 | 9079 | 745 | 209 | 840 | yes |

The counters are those of the last run of each protocol.
