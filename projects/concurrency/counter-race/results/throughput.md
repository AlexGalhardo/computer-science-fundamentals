# Counter race: throughput by number of workers

Derived from `results.json` (generated at 2026-10-07T23:00:16.357Z) by `throughput.ts`. Machine and runtime versions are in [results.md](results.md).

Each cell is millions of increments per second: 1,000,000 increments divided by the time of the measured section (one run, after the hyperfine runs). The total work is the same in every column, split among the workers.

| Language | Implementation | 1 worker | 2 workers | 4 workers | 8 workers | Final value with 8 workers |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| elixir | actor | 4.5 | 4.5 | 3.7 | 3.6 | 1000000 |
| go | atomic | 475.1 | 172.7 | 105.7 | 74.5 | 1000000 |
| java | atomic | 36.1 | 33.2 | 18.2 | 13.2 | 1000000 |
| rust | atomic | 124.2 | 105.6 | 76.7 | 68.0 | 1000000 |
| ts | atomic | 31.1 | 16.2 | 18.9 | 10.2 | 1000000 |
| go | buggy | 702.2 | 276.0 | 183.7 | 156.6 | 242427 |
| java | buggy | 49.5 | 41.4 | 33.2 | 22.4 | 688294 |
| rust | buggy | 581.7 | 188.4 | 165.5 | 127.6 | 342508 |
| ts | buggy | 28.8 | 14.4 | 21.2 | 14.3 | 302127 |
| go | channel | 2.0 | 2.3 | 2.1 | 2.0 | 1000000 |
| rust | channel | 21.5 | 20.3 | 19.9 | 19.9 | 1000000 |
| elixir | get-then-set | 0.8 | 0.7 | 0.7 | 0.7 | 156932 |
| ts | message | 0.8 | 0.9 | 0.7 | 0.9 | 1000000 |
| go | mutex | 193.9 | 133.9 | 68.8 | 38.2 | 1000000 |
| java | mutex | 30.7 | 27.6 | 11.7 | 17.1 | 1000000 |
| rust | mutex | 196.6 | 90.1 | 48.5 | 48.3 | 1000000 |
| ts | mutex | 13.8 | 8.9 | 8.3 | 6.0 | 1000000 |
| java | queue | 5.0 | 2.1 | 2.7 | 1.4 | 1000000 |

A final value below 1,000,000 means lost updates. The buggy versions are fast because they are wrong: they skip the work that makes the answer right.
