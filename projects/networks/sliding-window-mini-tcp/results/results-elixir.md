# Results: sliding-window-mini-tcp (Elixir)

- Command: `docker compose run --rm -T elixir-demo`
- Runtime: Elixir 1.20.4 on Erlang/OTP 28

## Simulated channel

File of 262144 bytes in frames of 1024 bytes. Link of 1 frame per tick, delay of 5 ticks, 5% duplication, 20% of the copies delayed by up to 6 extra ticks, seed 2026. Window of 8 frames for go-back-N and selective repeat.

| loss | protocol | ticks | frames sent | retransmissions | intact (SHA-256) |
| --- | --- | --- | --- | --- | --- |
| 0% | stop-and-wait | 2871 | 256 | 0 | yes |
| 0% | go-back-n | 1280 | 421 | 165 | yes |
| 0% | selective-repeat | 444 | 256 | 0 | yes |
| 5% | stop-and-wait | 3614 | 287 | 31 | yes |
| 5% | go-back-n | 2202 | 600 | 344 | yes |
| 5% | selective-repeat | 967 | 287 | 31 | yes |
| 10% | stop-and-wait | 4386 | 316 | 60 | yes |
| 10% | go-back-n | 2563 | 661 | 405 | yes |
| 10% | selective-repeat | 1335 | 316 | 60 | yes |
| 20% | stop-and-wait | 6927 | 418 | 162 | yes |
| 20% | go-back-n | 4579 | 1058 | 802 | yes |
| 20% | selective-repeat | 2317 | 418 | 162 | yes |
| 30% | stop-and-wait | 9635 | 527 | 271 | yes |
| 30% | go-back-n | 6346 | 1442 | 1186 | yes |
| 30% | selective-repeat | 3134 | 527 | 271 | yes |
