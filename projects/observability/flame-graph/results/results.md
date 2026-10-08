# Before and after the fix

Written by `docker compose run --rm bench` on 2026-10-08.

Requests per second: median of the runs, then the slowest and the fastest run, then (max - min) / median.

| Service | Runtime | Before | After | Factor |
| --- | --- | --- | --- | --- |
| Go | go1.27.1 | 222 (191 to 246, spread 24.8%) | 3133 (2666 to 3994, spread 42.4%) | **14.1x** |
| TypeScript (Bun) | bun 1.4.2 | 405 (398 to 430, spread 7.9%) | 22894 (20947 to 24549, spread 15.7%) | **56.5x** |

## How it was measured

- Machine: AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical CPUs, 15.6 GiB of memory, kernel 6.18.33.2-microsoft-standard-WSL2.
- Limits: each server: 1 CPU, 256 MB; load generator: 2 CPUs, 256 MB (docker-compose.yml).
- Load: closed loop, bun 1.4.2 (ts/src/load.ts), 16 concurrent connections, local target on the internal docker-compose network.
- Each variant: 2 s of warm-up (discarded), then 5 runs of 5 s.
- The two variants of a service run in the same process and return the same body, so the only difference is the code path.
- The factor is specific to this workload and this machine. Run the command again to get yours.
