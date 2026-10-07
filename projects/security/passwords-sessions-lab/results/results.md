# Password storage: hashes per second

Generated at 2026-10-07T23:30:47.510Z by `docker compose run --rm bench`.

Workload: one fake password ("lab-fake-password"), hashed repeatedly. Each scheme ran 1 warm-up run (discarded) and 5 measured runs on one thread, one hash at a time. A run computes the number of hashes in the "Hashes per run" column, and its rate is that number divided by the elapsed time. The table shows the median, the slowest and the fastest of the 5 runs.

| Scheme | Parameters | Hashes per run | Hashes/s (median) | Hashes/s (min) | Hashes/s (max) | Time per hash (median) | Cost of one hash against MD5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| plain text | no hash at all | 200,000 | **1,736,518,108** | 56,340,187 | 1,909,654,257 | 1 ns | none (not a hash) |
| MD5 | unsalted, node:crypto | 200,000 | **843,636** | 797,901 | 890,710 | 1.19 µs | 1.00x |
| salted SHA-256 | 16-byte salt, one round, node:crypto | 200,000 | **548,724** | 500,384 | 624,058 | 1.82 µs | 1.54x |
| Argon2id (lab policy) | m=19456 KiB (19 MiB), t=2, p=1, random 16-byte salt | 10 | **22** | 19.5 | 23.1 | 45.4 ms | 38,283x |
| Argon2id (stronger) | m=65536 KiB (64 MiB), t=3, p=1, random 16-byte salt | 2 | **3.5** | 3.2 | 3.8 | 285.4 ms | 240,816x |

- **Hashes/s** is how many passwords this machine turns into a stored value per second. Read it from the side of somebody who stole the table: it is also how many guesses per second one CPU core could test. Lower is better for the defender.
- **Cost of one hash against MD5** is the MD5 median rate divided by the rate of the row.
- "plain text" is not a hash: the row only shows that storing the password as it is costs nothing, and reading it back costs nothing either. Its rate is the speed of an empty loop, so its spread means nothing.
- This is a measurement of the functions. Nothing here compares against a stored hash or tries candidate passwords.

## Environment

| Item | Value |
| --- | --- |
| Machine | AMD Ryzen 7 5700X3D 8-Core Processor, 16 logical cores, 15.6 GiB visible to the container |
| Operating system (container) | Linux 6.18.33.2-microsoft-standard-WSL2 (x64) |
| Runtime | Bun 1.4.2 (oven/bun:1.4.2), TypeScript run directly by Bun |
| Hash functions | MD5 and SHA-256 from node:crypto, Argon2id from the built-in Bun.password |
| Argon2 parameters | lab policy: Argon2id v=19, m=19456 KiB, t=2, p=1; stronger row: m=65536 KiB, t=3, p=1 |
| Runs | 5 measured, 1 warm-up discarded |
| Concurrency | one thread, one hash at a time |
| Peak memory of the benchmark process | 121,696 KiB |
| Command | `docker compose run --rm bench` |

Numbers depend on the machine. Compare the schemes with each other, not with another computer.
