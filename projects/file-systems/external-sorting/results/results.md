# Benchmark: external-sorting

Generated at 2026-10-08T02:07:48.259Z. 7 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)
- go: go version go1.27.1 linux/amd64 (golang:1.27.1-bookworm)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| fanin-16 | run-1024k | 250000 | go | 155 ± 15.4 | 144 to 179 | 139 | 134 | 5148 |
| fanin-16 | run-1024k | 250000 | rust | 114 ± 19.5 | 98.8 to 142 | 105 | 71.9 | 3520 |
| fanin-16 | run-1024k | 1000000 | go | 572 ± 14.4 | 558 to 597 | 562 | 470 | 6964 |
| fanin-16 | run-1024k | 1000000 | rust | 496 ± 19.8 | 474 to 532 | 486 | 1103 | 3516 |
| fanin-16 | run-16384k | 250000 | go | 172 ± 29.5 | 140 to 213 | 159 | 103 | 25468 |
| fanin-16 | run-16384k | 250000 | rust | 96.1 ± 9.19 | 89.3 to 111 | 88.7 | 68.2 | 16432 |
| fanin-16 | run-16384k | 1000000 | go | 701 ± 86.9 | 595 to 849 | 690 | 574 | 32412 |
| fanin-16 | run-16384k | 1000000 | rust | 432 ± 36.7 | 401 to 498 | 417 | 1431 | 21280 |
| fanin-16 | run-4096k | 250000 | go | 145 ± 12.4 | 133 to 162 | 132 | 97.9 | 10108 |
| fanin-16 | run-4096k | 250000 | rust | 103 ± 14.6 | 92.6 to 129 | 95.6 | 65.4 | 7088 |
| fanin-16 | run-4096k | 1000000 | go | 509 ± 23.2 | 482 to 542 | 500 | 403 | 10652 |
| fanin-16 | run-4096k | 1000000 | rust | 389 ± 9.72 | 379 to 406 | 382 | 284 | 7080 |
| fanin-2 | run-1024k | 250000 | go | 191 ± 12.6 | 174 to 205 | 179 | 155 | 7268 |
| fanin-2 | run-1024k | 250000 | rust | 171 ± 28.6 | 144 to 209 | 160 | 147 | 3412 |
| fanin-2 | run-1024k | 1000000 | go | 820 ± 38.8 | 772 to 885 | 819 | 792 | 7396 |
| fanin-2 | run-1024k | 1000000 | rust | 971 ± 379 | 764 to 1825 | 763 | 637 | 3504 |
| fanin-2 | run-16384k | 250000 | go | 199 ± 18.5 | 174 to 229 | 185 | 186 | 25372 |
| fanin-2 | run-16384k | 250000 | rust | 157 ± 53.2 | 119 to 267 | 128 | 89.4 | 16420 |
| fanin-2 | run-16384k | 1000000 | go | 893 ± 91.7 | 807 to 1056 | 887 | 958 | 35672 |
| fanin-2 | run-16384k | 1000000 | rust | 833 ± 286 | 580 to 1279 | 629 | 448 | 21288 |
| fanin-2 | run-4096k | 250000 | go | 183 ± 7.02 | 171 to 191 | 173 | 141 | 11260 |
| fanin-2 | run-4096k | 250000 | rust | 197 ± 176 | 111 to 595 | 122 | 101 | 6960 |
| fanin-2 | run-4096k | 1000000 | go | 877 ± 71.1 | 798 to 996 | 847 | 682 | 15468 |
| fanin-2 | run-4096k | 1000000 | rust | 979 ± 219 | 688 to 1305 | 685 | 847 | 7584 |
| fanin-4 | run-1024k | 250000 | go | 219 ± 25.3 | 195 to 270 | 201 | 178 | 6296 |
| fanin-4 | run-1024k | 250000 | rust | 134 ± 24.9 | 112 to 184 | 113 | 95.8 | 3520 |
| fanin-4 | run-1024k | 1000000 | go | 611 ± 21.3 | 590 to 657 | 603 | 506 | 7476 |
| fanin-4 | run-1024k | 1000000 | rust | 669 ± 221 | 506 to 1156 | 534 | 476 | 3416 |
| fanin-4 | run-16384k | 250000 | go | 152 ± 11.1 | 140 to 168 | 139 | 103 | 25244 |
| fanin-4 | run-16384k | 250000 | rust | 104 ± 15.6 | 91.3 to 135 | 94.8 | 60.5 | 16356 |
| fanin-4 | run-16384k | 1000000 | go | 618 ± 34.2 | 576 to 677 | 610 | 471 | 32420 |
| fanin-4 | run-16384k | 1000000 | rust | 606 ± 304 | 430 to 1230 | 428 | 404 | 21252 |
| fanin-4 | run-4096k | 250000 | go | 143 ± 7.96 | 136 to 155 | 131 | 95.0 | 10268 |
| fanin-4 | run-4096k | 250000 | rust | 117 ± 3.47 | 113 to 123 | 98.1 | 80.5 | 7096 |
| fanin-4 | run-4096k | 1000000 | go | 564 ± 36.1 | 525 to 612 | 558 | 496 | 12228 |
| fanin-4 | run-4096k | 1000000 | rust | 619 ± 315 | 427 to 1326 | 450 | 400 | 7100 |
| fanin-64 | run-1024k | 250000 | go | 198 ± 25.9 | 173 to 240 | 181 | 138 | 5284 |
| fanin-64 | run-1024k | 250000 | rust | 121 ± 15.1 | 108 to 149 | 112 | 95.0 | 3460 |
| fanin-64 | run-1024k | 1000000 | go | 814 ± 96.0 | 689 to 934 | 797 | 772 | 6536 |
| fanin-64 | run-1024k | 1000000 | rust | 588 ± 119 | 501 to 768 | 565 | 394 | 3500 |
| fanin-64 | run-16384k | 250000 | go | 289 ± 89.7 | 193 to 423 | 256 | 278 | 25204 |
| fanin-64 | run-16384k | 250000 | rust | 110 ± 24.4 | 93.5 to 164 | 101 | 66.5 | 16436 |
| fanin-64 | run-16384k | 1000000 | go | 899 ± 319 | 608 to 1519 | 884 | 791 | 32356 |
| fanin-64 | run-16384k | 1000000 | rust | 693 ± 646 | 421 to 2158 | 428 | 387 | 21304 |
| fanin-64 | run-4096k | 250000 | go | 295 ± 36.9 | 232 to 343 | 256 | 188 | 10400 |
| fanin-64 | run-4096k | 250000 | rust | 120 ± 12.1 | 107 to 137 | 111 | 77.4 | 7048 |
| fanin-64 | run-4096k | 1000000 | go | 730 ± 96.1 | 597 to 868 | 699 | 469 | 10652 |
| fanin-64 | run-4096k | 1000000 | rust | 538 ± 123 | 426 to 785 | 456 | 344 | 7088 |

## Commands

- `go`: `go/bin/extsort bench fanin-16 run-1024k 250000`
- `rust`: `rust/target/release/extsort bench fanin-16 run-1024k 250000`
- `go`: `go/bin/extsort bench fanin-16 run-1024k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-16 run-1024k 1000000`
- `go`: `go/bin/extsort bench fanin-16 run-16384k 250000`
- `rust`: `rust/target/release/extsort bench fanin-16 run-16384k 250000`
- `go`: `go/bin/extsort bench fanin-16 run-16384k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-16 run-16384k 1000000`
- `go`: `go/bin/extsort bench fanin-16 run-4096k 250000`
- `rust`: `rust/target/release/extsort bench fanin-16 run-4096k 250000`
- `go`: `go/bin/extsort bench fanin-16 run-4096k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-16 run-4096k 1000000`
- `go`: `go/bin/extsort bench fanin-2 run-1024k 250000`
- `rust`: `rust/target/release/extsort bench fanin-2 run-1024k 250000`
- `go`: `go/bin/extsort bench fanin-2 run-1024k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-2 run-1024k 1000000`
- `go`: `go/bin/extsort bench fanin-2 run-16384k 250000`
- `rust`: `rust/target/release/extsort bench fanin-2 run-16384k 250000`
- `go`: `go/bin/extsort bench fanin-2 run-16384k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-2 run-16384k 1000000`
- `go`: `go/bin/extsort bench fanin-2 run-4096k 250000`
- `rust`: `rust/target/release/extsort bench fanin-2 run-4096k 250000`
- `go`: `go/bin/extsort bench fanin-2 run-4096k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-2 run-4096k 1000000`
- `go`: `go/bin/extsort bench fanin-4 run-1024k 250000`
- `rust`: `rust/target/release/extsort bench fanin-4 run-1024k 250000`
- `go`: `go/bin/extsort bench fanin-4 run-1024k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-4 run-1024k 1000000`
- `go`: `go/bin/extsort bench fanin-4 run-16384k 250000`
- `rust`: `rust/target/release/extsort bench fanin-4 run-16384k 250000`
- `go`: `go/bin/extsort bench fanin-4 run-16384k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-4 run-16384k 1000000`
- `go`: `go/bin/extsort bench fanin-4 run-4096k 250000`
- `rust`: `rust/target/release/extsort bench fanin-4 run-4096k 250000`
- `go`: `go/bin/extsort bench fanin-4 run-4096k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-4 run-4096k 1000000`
- `go`: `go/bin/extsort bench fanin-64 run-1024k 250000`
- `rust`: `rust/target/release/extsort bench fanin-64 run-1024k 250000`
- `go`: `go/bin/extsort bench fanin-64 run-1024k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-64 run-1024k 1000000`
- `go`: `go/bin/extsort bench fanin-64 run-16384k 250000`
- `rust`: `rust/target/release/extsort bench fanin-64 run-16384k 250000`
- `go`: `go/bin/extsort bench fanin-64 run-16384k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-64 run-16384k 1000000`
- `go`: `go/bin/extsort bench fanin-64 run-4096k 250000`
- `rust`: `rust/target/release/extsort bench fanin-64 run-4096k 250000`
- `go`: `go/bin/extsort bench fanin-64 run-4096k 1000000`
- `rust`: `rust/target/release/extsort bench fanin-64 run-4096k 1000000`
