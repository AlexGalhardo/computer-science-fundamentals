# Profiles

Written by `docker compose run --rm flame`. Samples are stack samples taken by the CPU profiler of each runtime while the load generator was running.

| Service | Variant | Samples | Inside the handler | Inside the hot function | Share of the handler |
| --- | --- | --- | --- | --- | --- |
| Go | before | 414 | 296 | 268 | 90.5% |
| Go | after | 297 | 225 | 0 | 0.0% |
| TypeScript (Bun) | before | 2708 | 2689 | 2673 | 99.4% |
| TypeScript (Bun) | after | 238 | 148 | 0 | 0.0% |

Hot function: `flame-graph/report.compileRegex` in Go, `buildPriceIndex` in TypeScript. The share counts the function and everything it calls.
