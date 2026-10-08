# Benchmark: cache-friendly-matrix

Generated at 2026-10-08T01:30:40.633Z. 3 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- cpp: g++ (GCC) 16.2.0 (gcc:16.2.0-trixie)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| blocked-32 | default | 256 | cpp | 61.6 ± 17.9 | 47.5 to 81.8 | 45.5 | 6.34 | 5652 |
| blocked-32 | default | 256 | rust | 75.7 ± 6.02 | 69.3 to 81.2 | 45.7 | 9.26 | 4032 |
| blocked-32 | default | 512 | cpp | 339 ± 11.1 | 328 to 350 | 315 | 77.1 | 11796 |
| blocked-32 | default | 512 | rust | 291 ± 8.76 | 281 to 297 | 275 | 51.0 | 10272 |
| blocked-32 | default | 1000 | cpp | 676 ± 143 | 511 to 771 | 490 | 613 | 27024 |
| blocked-32 | default | 1000 | rust | 654 ± 69.5 | 575 to 706 | 596 | 509 | 25476 |
| blocked-32 | default | 1024 | cpp | 767 ± 97.0 | 691 to 876 | 681 | 873 | 28140 |
| blocked-32 | default | 1024 | rust | 527 ± 77.4 | 441 to 591 | 508 | 433 | 26452 |
| blocked-32 | default | 1500 | cpp | 2080 ± 191 | 1860 to 2206 | 1887 | 1832 | 56284 |
| blocked-32 | default | 1500 | rust | 1757 ± 166 | 1583 to 1915 | 1656 | 1789 | 54764 |
| blocked-64 | default | 256 | cpp | 87.9 ± 27.1 | 60.5 to 115 | 48.5 | 7.59 | 5712 |
| blocked-64 | default | 256 | rust | 84.3 ± 27.4 | 59.1 to 113 | 45.5 | 9.23 | 4172 |
| blocked-64 | default | 512 | cpp | 403 ± 34.5 | 370 to 439 | 344 | 60.9 | 11936 |
| blocked-64 | default | 512 | rust | 411 ± 75.4 | 337 to 487 | 346 | 58.0 | 10228 |
| blocked-64 | default | 1000 | cpp | 612 ± 65.5 | 540 to 669 | 487 | 545 | 27036 |
| blocked-64 | default | 1000 | rust | 415 ± 58.1 | 369 to 480 | 385 | 403 | 25232 |
| blocked-64 | default | 1024 | cpp | 551 ± 45.3 | 503 to 594 | 514 | 559 | 28136 |
| blocked-64 | default | 1024 | rust | 574 ± 264 | 317 to 845 | 557 | 323 | 26448 |
| blocked-64 | default | 1500 | cpp | 1566 ± 17.4 | 1546 to 1580 | 1526 | 1452 | 56352 |
| blocked-64 | default | 1500 | rust | 1360 ± 760 | 784 to 2222 | 1352 | 1082 | 54804 |
| interchanged | default | 256 | cpp | 35.2 ± 4.42 | 30.4 to 39.2 | 31.6 | 6.85 | 5888 |
| interchanged | default | 256 | rust | 44.9 ± 4.47 | 41.5 to 49.9 | 31.7 | 5.45 | 4088 |
| interchanged | default | 512 | cpp | 201 ± 25.4 | 173 to 223 | 196 | 34.1 | 11960 |
| interchanged | default | 512 | rust | 382 ± 19.7 | 360 to 398 | 309 | 53.2 | 10136 |
| interchanged | default | 1000 | cpp | 382 ± 73.8 | 313 to 460 | 378 | 264 | 27032 |
| interchanged | default | 1000 | rust | 499 ± 78.5 | 412 to 564 | 450 | 377 | 25532 |
| interchanged | default | 1024 | cpp | 438 ± 49.7 | 401 to 494 | 430 | 591 | 28192 |
| interchanged | default | 1024 | rust | 946 ± 213 | 809 to 1191 | 597 | 576 | 26572 |
| interchanged | default | 1500 | cpp | 1968 ± 530 | 1360 to 2336 | 1744 | 1793 | 56392 |
| interchanged | default | 1500 | rust | 1575 ± 141 | 1420 to 1695 | 1312 | 1232 | 54540 |
| naive | default | 256 | cpp | 147 ± 9.52 | 141 to 158 | 142 | 25.3 | 5788 |
| naive | default | 256 | rust | 187 ± 45.7 | 148 to 237 | 159 | 26.7 | 3772 |
| naive | default | 512 | cpp | 2764 ± 351 | 2516 to 3166 | 2649 | 435 | 11856 |
| naive | default | 512 | rust | 1741 ± 63.2 | 1703 to 1814 | 1731 | 418 | 9968 |
| naive | default | 1000 | cpp | 1402 ± 224 | 1209 to 1648 | 1374 | 1085 | 27080 |
| naive | default | 1000 | rust | 1930 ± 214 | 1717 to 2145 | 1761 | 1874 | 25400 |
| naive | default | 1024 | cpp | 6636 ± 703 | 5830 to 7122 | 6626 | 5712 | 28232 |
| naive | default | 1024 | rust | 6454 ± 176 | 6251 to 6568 | 5798 | 6720 | 26296 |
| naive | default | 1500 | cpp | 5524 ± 755 | 4691 to 6163 | 5381 | 5135 | 56488 |
| naive | default | 1500 | rust | 26648 ± 5773 | 19988 to 30218 | 23120 | 29469 | 54212 |

## Commands

- `cpp`: `cpp/build/bench blocked-32 256`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-32 256`
- `cpp`: `cpp/build/bench blocked-32 512`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-32 512`
- `cpp`: `cpp/build/bench blocked-32 1000`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-32 1000`
- `cpp`: `cpp/build/bench blocked-32 1024`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-32 1024`
- `cpp`: `cpp/build/bench blocked-32 1500`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-32 1500`
- `cpp`: `cpp/build/bench blocked-64 256`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-64 256`
- `cpp`: `cpp/build/bench blocked-64 512`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-64 512`
- `cpp`: `cpp/build/bench blocked-64 1000`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-64 1000`
- `cpp`: `cpp/build/bench blocked-64 1024`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-64 1024`
- `cpp`: `cpp/build/bench blocked-64 1500`
- `rust`: `rust/target/release/cache-friendly-matrix blocked-64 1500`
- `cpp`: `cpp/build/bench interchanged 256`
- `rust`: `rust/target/release/cache-friendly-matrix interchanged 256`
- `cpp`: `cpp/build/bench interchanged 512`
- `rust`: `rust/target/release/cache-friendly-matrix interchanged 512`
- `cpp`: `cpp/build/bench interchanged 1000`
- `rust`: `rust/target/release/cache-friendly-matrix interchanged 1000`
- `cpp`: `cpp/build/bench interchanged 1024`
- `rust`: `rust/target/release/cache-friendly-matrix interchanged 1024`
- `cpp`: `cpp/build/bench interchanged 1500`
- `rust`: `rust/target/release/cache-friendly-matrix interchanged 1500`
- `cpp`: `cpp/build/bench naive 256`
- `rust`: `rust/target/release/cache-friendly-matrix naive 256`
- `cpp`: `cpp/build/bench naive 512`
- `rust`: `rust/target/release/cache-friendly-matrix naive 512`
- `cpp`: `cpp/build/bench naive 1000`
- `rust`: `rust/target/release/cache-friendly-matrix naive 1000`
- `cpp`: `cpp/build/bench naive 1024`
- `rust`: `rust/target/release/cache-friendly-matrix naive 1024`
- `cpp`: `cpp/build/bench naive 1500`
- `rust`: `rust/target/release/cache-friendly-matrix naive 1500`
