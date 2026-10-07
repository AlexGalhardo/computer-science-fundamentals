# Benchmark: scaling-by-cores

Generated at 2026-10-07T23:40:52.587Z. 5 runs per row after 1 warm-up run(s).

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
- cpp: g++ (GCC) 16.2.0 (gcc:16.2.0-trixie)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| mandelbrot-dynamic | 1 | 9000000 | cpp | 5474 ± 283 | 5013 to 5785 | 5423 | 5358 | 38848 |
| mandelbrot-dynamic | 1 | 9000000 | go | 4979 ± 126 | 4835 to 5111 | 4942 | 4448 | 37296 |
| mandelbrot-dynamic | 1 | 9000000 | rust | 6219 ± 252 | 5967 to 6635 | 6030 | 5864 | 37076 |
| mandelbrot-dynamic | 2 | 9000000 | cpp | 2361 ± 114 | 2226 to 2498 | 4649 | 2329 | 38804 |
| mandelbrot-dynamic | 2 | 9000000 | go | 2586 ± 184 | 2423 to 2881 | 5081 | 2426 | 37268 |
| mandelbrot-dynamic | 2 | 9000000 | rust | 3004 ± 312 | 2649 to 3409 | 5897 | 3140 | 37036 |
| mandelbrot-dynamic | 4 | 9000000 | cpp | 1359 ± 138 | 1239 to 1538 | 5196 | 1236 | 38668 |
| mandelbrot-dynamic | 4 | 9000000 | go | 1565 ± 198 | 1364 to 1810 | 5724 | 1500 | 37140 |
| mandelbrot-dynamic | 4 | 9000000 | rust | 1613 ± 132 | 1466 to 1812 | 6103 | 1743 | 37092 |
| mandelbrot-dynamic | 8 | 9000000 | cpp | 730 ± 10.2 | 714 to 738 | 5255 | 765 | 38856 |
| mandelbrot-dynamic | 8 | 9000000 | go | 913 ± 74.1 | 848 to 1021 | 6354 | 751 | 37264 |
| mandelbrot-dynamic | 8 | 9000000 | rust | 1095 ± 101 | 964 to 1215 | 7228 | 1016 | 36696 |
| mandelbrot-seq | 1 | 9000000 | cpp | 5088 ± 409 | 4455 to 5544 | 5040 | 4763 | 38592 |
| mandelbrot-seq | 1 | 9000000 | go | 5696 ± 277 | 5385 to 6137 | 5472 | 5804 | 36704 |
| mandelbrot-seq | 1 | 9000000 | rust | 6189 ± 487 | 5626 to 6902 | 6149 | 6019 | 36980 |
| mandelbrot-seq | 2 | 9000000 | cpp | 5030 ± 273 | 4790 to 5422 | 5022 | 5035 | 38552 |
| mandelbrot-seq | 2 | 9000000 | go | 5362 ± 352 | 4991 to 5869 | 5334 | 4958 | 37232 |
| mandelbrot-seq | 2 | 9000000 | rust | 6152 ± 686 | 5246 to 6813 | 6113 | 6220 | 37108 |
| mandelbrot-seq | 4 | 9000000 | cpp | 4942 ± 305 | 4478 to 5328 | 4912 | 4747 | 38576 |
| mandelbrot-seq | 4 | 9000000 | go | 4788 ± 273 | 4550 to 5221 | 4774 | 4987 | 37360 |
| mandelbrot-seq | 4 | 9000000 | rust | 5922 ± 151 | 5696 to 6085 | 5828 | 5305 | 37168 |
| mandelbrot-seq | 8 | 9000000 | cpp | 4934 ± 160 | 4695 to 5097 | 4921 | 4481 | 38584 |
| mandelbrot-seq | 8 | 9000000 | go | 5733 ± 432 | 5207 to 6238 | 5679 | 5079 | 37244 |
| mandelbrot-seq | 8 | 9000000 | rust | 6277 ± 1244 | 5400 to 8407 | 6082 | 8110 | 36944 |
| mandelbrot-static | 1 | 9000000 | cpp | 5198 ± 325 | 4927 to 5667 | 5154 | 4745 | 38984 |
| mandelbrot-static | 1 | 9000000 | go | 5385 ± 398 | 4934 to 6015 | 5365 | 5669 | 37232 |
| mandelbrot-static | 1 | 9000000 | rust | 6982 ± 394 | 6677 to 7638 | 6461 | 7078 | 37052 |
| mandelbrot-static | 2 | 9000000 | cpp | 2710 ± 218 | 2473 to 3049 | 5082 | 3027 | 38836 |
| mandelbrot-static | 2 | 9000000 | go | 2472 ± 201 | 2239 to 2737 | 4818 | 2503 | 37616 |
| mandelbrot-static | 2 | 9000000 | rust | 4318 ± 852 | 3479 to 5228 | 7413 | 5752 | 37016 |
| mandelbrot-static | 4 | 9000000 | cpp | 2511 ± 168 | 2286 to 2680 | 4981 | 2685 | 38932 |
| mandelbrot-static | 4 | 9000000 | go | 2422 ± 49.0 | 2365 to 2474 | 4923 | 2264 | 37460 |
| mandelbrot-static | 4 | 9000000 | rust | 3541 ± 459 | 2942 to 4129 | 6566 | 3147 | 37108 |
| mandelbrot-static | 8 | 9000000 | cpp | 1907 ± 115 | 1717 to 2013 | 5335 | 2166 | 38960 |
| mandelbrot-static | 8 | 9000000 | go | 1966 ± 195 | 1717 to 2149 | 5567 | 1857 | 37592 |
| mandelbrot-static | 8 | 9000000 | rust | 2050 ± 181 | 1858 to 2287 | 5988 | 2036 | 36892 |
| primes-dynamic | 1 | 9000000 | cpp | 1686 ± 51.0 | 1641 to 1765 | 1662 | 1622 | 4164 |
| primes-dynamic | 1 | 9000000 | go | 2335 ± 398 | 1926 to 2998 | 2004 | 2413 | 2420 |
| primes-dynamic | 1 | 9000000 | rust | 1930 ± 100 | 1840 to 2094 | 1887 | 1947 | 2072 |
| primes-dynamic | 2 | 9000000 | cpp | 922 ± 85.3 | 852 to 1064 | 1804 | 811 | 4136 |
| primes-dynamic | 2 | 9000000 | go | 1319 ± 93.6 | 1207 to 1416 | 2171 | 1433 | 1940 |
| primes-dynamic | 2 | 9000000 | rust | 958 ± 116 | 830 to 1118 | 1745 | 969 | 2196 |
| primes-dynamic | 4 | 9000000 | cpp | 522 ± 85.4 | 459 to 653 | 1901 | 655 | 4188 |
| primes-dynamic | 4 | 9000000 | go | 764 ± 104 | 621 to 913 | 2203 | 608 | 2024 |
| primes-dynamic | 4 | 9000000 | rust | 584 ± 23.4 | 556 to 611 | 2079 | 540 | 2140 |
| primes-dynamic | 8 | 9000000 | cpp | 426 ± 48.5 | 351 to 487 | 2209 | 383 | 4252 |
| primes-dynamic | 8 | 9000000 | go | 534 ± 61.0 | 471 to 636 | 2476 | 478 | 2116 |
| primes-dynamic | 8 | 9000000 | rust | 486 ± 47.5 | 452 to 565 | 2501 | 349 | 2076 |
| primes-seq | 1 | 9000000 | cpp | 1775 ± 249 | 1481 to 2058 | 1706 | 1766 | 3988 |
| primes-seq | 1 | 9000000 | go | 2026 ± 103 | 1901 to 2176 | 1956 | 1920 | 1696 |
| primes-seq | 1 | 9000000 | rust | 1792 ± 188 | 1527 to 1995 | 1722 | 1391 | 1956 |
| primes-seq | 2 | 9000000 | cpp | 1867 ± 181 | 1672 to 2160 | 1815 | 1998 | 4072 |
| primes-seq | 2 | 9000000 | go | 2115 ± 88.4 | 2023 to 2231 | 2049 | 2173 | 2092 |
| primes-seq | 2 | 9000000 | rust | 1572 ± 168 | 1388 to 1833 | 1553 | 1720 | 1892 |
| primes-seq | 4 | 9000000 | cpp | 2181 ± 204 | 1884 to 2382 | 2071 | 1801 | 3960 |
| primes-seq | 4 | 9000000 | go | 1826 ± 162 | 1572 to 1975 | 1805 | 2175 | 2056 |
| primes-seq | 4 | 9000000 | rust | 1572 ± 172 | 1402 to 1841 | 1539 | 1453 | 2016 |
| primes-seq | 8 | 9000000 | cpp | 1878 ± 81.6 | 1785 to 1979 | 1809 | 1867 | 4080 |
| primes-seq | 8 | 9000000 | go | 2079 ± 170 | 1916 to 2315 | 1963 | 1736 | 2248 |
| primes-seq | 8 | 9000000 | rust | 1649 ± 147 | 1413 to 1799 | 1615 | 1658 | 2004 |
| primes-static | 1 | 9000000 | cpp | 1620 ± 117 | 1504 to 1805 | 1611 | 1479 | 4232 |
| primes-static | 1 | 9000000 | go | 1935 ± 34.9 | 1906 to 1986 | 1899 | 1985 | 2064 |
| primes-static | 1 | 9000000 | rust | 1845 ± 413 | 1563 to 2551 | 1819 | 1577 | 2184 |
| primes-static | 2 | 9000000 | cpp | 1192 ± 187 | 988 to 1394 | 1877 | 1192 | 4380 |
| primes-static | 2 | 9000000 | go | 1260 ± 141 | 1050 to 1415 | 1869 | 1279 | 2180 |
| primes-static | 2 | 9000000 | rust | 1122 ± 129 | 948 to 1301 | 1736 | 957 | 2280 |
| primes-static | 4 | 9000000 | cpp | 691 ± 43.5 | 631 to 737 | 1967 | 644 | 4208 |
| primes-static | 4 | 9000000 | go | 1128 ± 230 | 992 to 1535 | 2180 | 1153 | 2360 |
| primes-static | 4 | 9000000 | rust | 662 ± 79.7 | 610 to 796 | 1893 | 659 | 2268 |
| primes-static | 8 | 9000000 | cpp | 400 ± 54.5 | 348 to 493 | 2232 | 384 | 4260 |
| primes-static | 8 | 9000000 | go | 921 ± 296 | 639 to 1340 | 2319 | 398 | 2208 |
| primes-static | 8 | 9000000 | rust | 486 ± 62.3 | 419 to 553 | 2193 | 408 | 2116 |

## Commands

- `cpp`: `cpp/build/scaling mandelbrot-dynamic 9000000 1`
- `go`: `go/bin/scaling mandelbrot-dynamic 9000000 1`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-dynamic 9000000 1`
- `cpp`: `cpp/build/scaling mandelbrot-dynamic 9000000 2`
- `go`: `go/bin/scaling mandelbrot-dynamic 9000000 2`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-dynamic 9000000 2`
- `cpp`: `cpp/build/scaling mandelbrot-dynamic 9000000 4`
- `go`: `go/bin/scaling mandelbrot-dynamic 9000000 4`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-dynamic 9000000 4`
- `cpp`: `cpp/build/scaling mandelbrot-dynamic 9000000 8`
- `go`: `go/bin/scaling mandelbrot-dynamic 9000000 8`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-dynamic 9000000 8`
- `cpp`: `cpp/build/scaling mandelbrot-seq 9000000 1`
- `go`: `go/bin/scaling mandelbrot-seq 9000000 1`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-seq 9000000 1`
- `cpp`: `cpp/build/scaling mandelbrot-seq 9000000 2`
- `go`: `go/bin/scaling mandelbrot-seq 9000000 2`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-seq 9000000 2`
- `cpp`: `cpp/build/scaling mandelbrot-seq 9000000 4`
- `go`: `go/bin/scaling mandelbrot-seq 9000000 4`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-seq 9000000 4`
- `cpp`: `cpp/build/scaling mandelbrot-seq 9000000 8`
- `go`: `go/bin/scaling mandelbrot-seq 9000000 8`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-seq 9000000 8`
- `cpp`: `cpp/build/scaling mandelbrot-static 9000000 1`
- `go`: `go/bin/scaling mandelbrot-static 9000000 1`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-static 9000000 1`
- `cpp`: `cpp/build/scaling mandelbrot-static 9000000 2`
- `go`: `go/bin/scaling mandelbrot-static 9000000 2`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-static 9000000 2`
- `cpp`: `cpp/build/scaling mandelbrot-static 9000000 4`
- `go`: `go/bin/scaling mandelbrot-static 9000000 4`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-static 9000000 4`
- `cpp`: `cpp/build/scaling mandelbrot-static 9000000 8`
- `go`: `go/bin/scaling mandelbrot-static 9000000 8`
- `rust`: `rust/target/release/scaling-by-cores mandelbrot-static 9000000 8`
- `cpp`: `cpp/build/scaling primes-dynamic 9000000 1`
- `go`: `go/bin/scaling primes-dynamic 9000000 1`
- `rust`: `rust/target/release/scaling-by-cores primes-dynamic 9000000 1`
- `cpp`: `cpp/build/scaling primes-dynamic 9000000 2`
- `go`: `go/bin/scaling primes-dynamic 9000000 2`
- `rust`: `rust/target/release/scaling-by-cores primes-dynamic 9000000 2`
- `cpp`: `cpp/build/scaling primes-dynamic 9000000 4`
- `go`: `go/bin/scaling primes-dynamic 9000000 4`
- `rust`: `rust/target/release/scaling-by-cores primes-dynamic 9000000 4`
- `cpp`: `cpp/build/scaling primes-dynamic 9000000 8`
- `go`: `go/bin/scaling primes-dynamic 9000000 8`
- `rust`: `rust/target/release/scaling-by-cores primes-dynamic 9000000 8`
- `cpp`: `cpp/build/scaling primes-seq 9000000 1`
- `go`: `go/bin/scaling primes-seq 9000000 1`
- `rust`: `rust/target/release/scaling-by-cores primes-seq 9000000 1`
- `cpp`: `cpp/build/scaling primes-seq 9000000 2`
- `go`: `go/bin/scaling primes-seq 9000000 2`
- `rust`: `rust/target/release/scaling-by-cores primes-seq 9000000 2`
- `cpp`: `cpp/build/scaling primes-seq 9000000 4`
- `go`: `go/bin/scaling primes-seq 9000000 4`
- `rust`: `rust/target/release/scaling-by-cores primes-seq 9000000 4`
- `cpp`: `cpp/build/scaling primes-seq 9000000 8`
- `go`: `go/bin/scaling primes-seq 9000000 8`
- `rust`: `rust/target/release/scaling-by-cores primes-seq 9000000 8`
- `cpp`: `cpp/build/scaling primes-static 9000000 1`
- `go`: `go/bin/scaling primes-static 9000000 1`
- `rust`: `rust/target/release/scaling-by-cores primes-static 9000000 1`
- `cpp`: `cpp/build/scaling primes-static 9000000 2`
- `go`: `go/bin/scaling primes-static 9000000 2`
- `rust`: `rust/target/release/scaling-by-cores primes-static 9000000 2`
- `cpp`: `cpp/build/scaling primes-static 9000000 4`
- `go`: `go/bin/scaling primes-static 9000000 4`
- `rust`: `rust/target/release/scaling-by-cores primes-static 9000000 4`
- `cpp`: `cpp/build/scaling primes-static 9000000 8`
- `go`: `go/bin/scaling primes-static 9000000 8`
- `rust`: `rust/target/release/scaling-by-cores primes-static 9000000 8`
