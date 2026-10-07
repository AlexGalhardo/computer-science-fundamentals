# Benchmark: sorting-race

Generated at 2026-10-07T23:32:28.815Z. 3 runs per row after 1 warm-up run(s).

## Machine

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

## Runtimes

- ts: 1.4.2 (oven/bun:1.4.2)
- cpp: g++ (GCC) 16.2.0 (gcc:16.2.0-trixie)
- python: Python 3.14.8 (python:3.14.8-slim-trixie)
- java: openjdk 25.0.4.1 2026-08-18 LTS (eclipse-temurin:25.0.4.1_1-jdk-noble)
- elixir: 1.20.4 (elixir:1.20.4-otp-28-slim)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (rust:1.99.0-slim-trixie)
- go: go version go1.27.1 linux/amd64 (golang:1.27.1-bookworm)

## Results

`process` is the whole process measured by hyperfine (mean ± standard deviation, with the range). `CPU` is user plus system time of the process: above `process` means several cores worked. `section` is the measured section reported by the program, without start-up.

| Implementation | Variant | n | Language | process (ms) | range (ms) | CPU (ms) | section (ms) | peak memory (KiB) |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| bubble | random | 1000 | cpp | 23.5 ± 5.26 | 17.4 to 26.8 | 8.50 | 0.60 | 3884 |
| bubble | random | 1000 | elixir | 1082 ± 132 | 945 to 1208 | 1533 | 9.78 | 86536 |
| bubble | random | 1000 | go | 38.5 ± 2.94 | 35.8 to 41.7 | 14.0 | 0.37 | 2980 |
| bubble | random | 1000 | java | 303 ± 68.3 | 248 to 379 | 229 | 2.02 | 45596 |
| bubble | random | 1000 | python | 419 ± 34.7 | 388 to 456 | 357 | 63.4 | 10840 |
| bubble | random | 1000 | rust | 23.1 ± 4.73 | 20.1 to 28.6 | 8.32 | 0.75 | 2084 |
| bubble | random | 1000 | ts | 92.2 ± 2.93 | 90.2 to 95.6 | 78.5 | 1.87 | 32940 |
| bubble | random | 2000 | cpp | 26.4 ± 8.22 | 21.5 to 35.9 | 14.9 | 2.12 | 3776 |
| bubble | random | 2000 | elixir | 1685 ± 276 | 1515 to 2004 | 2251 | 43.0 | 86208 |
| bubble | random | 2000 | go | 43.3 ± 4.33 | 38.3 to 46.0 | 21.3 | 2.24 | 2956 |
| bubble | random | 2000 | java | 332 ± 53.1 | 285 to 390 | 310 | 2.67 | 47288 |
| bubble | random | 2000 | python | 512 ± 75.4 | 444 to 593 | 394 | 301 | 11004 |
| bubble | random | 2000 | rust | 60.9 ± 19.7 | 41.6 to 81.0 | 30.4 | 3.49 | 1804 |
| bubble | random | 2000 | ts | 207 ± 68.5 | 137 to 274 | 159 | 10.0 | 33808 |
| bubble | random | 10000 | cpp | 339 ± 20.6 | 321 to 362 | 326 | 69.0 | 4028 |
| bubble | random | 10000 | elixir | 2579 ± 64.2 | 2522 to 2648 | 3140 | 1205 | 89980 |
| bubble | random | 10000 | go | 383 ± 76.7 | 309 to 462 | 331 | 63.6 | 2768 |
| bubble | random | 10000 | java | 535 ± 37.7 | 496 to 572 | 631 | 82.1 | 49204 |
| bubble | random | 10000 | python | 8703 ± 360 | 8411 to 9105 | 8620 | 7319 | 11432 |
| bubble | random | 10000 | rust | 536 ± 182 | 415 to 746 | 418 | 108 | 2080 |
| bubble | random | 10000 | ts | 584 ± 30.1 | 549 to 604 | 571 | 252 | 33816 |
| heap | random | 1000 | cpp | 26.5 ± 3.12 | 23.2 to 29.4 | 5.30 | 0.03 | 3836 |
| heap | random | 1000 | elixir | 917 ± 189 | 749 to 1121 | 1793 | 0.52 | 86456 |
| heap | random | 1000 | go | 52.0 ± 14.8 | 36.4 to 66.0 | 12.5 | 0.04 | 2896 |
| heap | random | 1000 | java | 330 ± 103 | 218 to 421 | 275 | 0.16 | 45580 |
| heap | random | 1000 | python | 205 ± 35.3 | 174 to 244 | 86.6 | 1.72 | 10612 |
| heap | random | 1000 | rust | 22.7 ± 4.03 | 19.0 to 27.0 | 3.92 | 0.04 | 1808 |
| heap | random | 1000 | ts | 103 ± 41.9 | 71.5 to 150 | 47.7 | 0.22 | 28116 |
| heap | random | 2000 | cpp | 12.6 ± 2.11 | 11.1 to 15.0 | 4.14 | 0.10 | 3792 |
| heap | random | 2000 | elixir | 926 ± 406 | 671 to 1394 | 1806 | 1.41 | 88504 |
| heap | random | 2000 | go | 49.9 ± 7.20 | 41.6 to 54.4 | 14.6 | 0.12 | 2792 |
| heap | random | 2000 | java | 262 ± 26.3 | 233 to 283 | 309 | 0.32 | 47300 |
| heap | random | 2000 | python | 360 ± 53.5 | 318 to 421 | 114 | 4.24 | 10840 |
| heap | random | 2000 | rust | 17.5 ± 3.14 | 14.9 to 21.0 | 5.38 | 0.10 | 2036 |
| heap | random | 2000 | ts | 88.3 ± 3.86 | 83.8 to 90.9 | 49.4 | 0.32 | 32160 |
| heap | random | 10000 | cpp | 14.7 ± 0.96 | 13.8 to 15.7 | 6.50 | 0.52 | 3936 |
| heap | random | 10000 | elixir | 1115 ± 484 | 752 to 1664 | 1643 | 10.9 | 97608 |
| heap | random | 10000 | go | 48.4 ± 25.4 | 25.1 to 75.5 | 17.9 | 0.70 | 3096 |
| heap | random | 10000 | java | 262 ± 25.6 | 239 to 289 | 313 | 1.96 | 48964 |
| heap | random | 10000 | python | 1088 ± 767 | 563 to 1968 | 306 | 38.4 | 11648 |
| heap | random | 10000 | rust | 26.2 ± 7.52 | 18.6 to 33.7 | 9.87 | 0.89 | 2048 |
| heap | random | 10000 | ts | 148 ± 53.8 | 95.8 to 203 | 65.0 | 1.16 | 33444 |
| heap | random | 100000 | cpp | 110 ± 22.7 | 93.1 to 136 | 67.4 | 10.4 | 4664 |
| heap | random | 100000 | elixir | 1576 ± 10.1 | 1569 to 1587 | 2284 | 197 | 163288 |
| heap | random | 100000 | go | 162 ± 12.6 | 149 to 174 | 82.9 | 7.85 | 5100 |
| heap | random | 100000 | java | 612 ± 144 | 511 to 777 | 497 | 18.9 | 56560 |
| heap | random | 100000 | python | 1337 ± 302 | 1093 to 1675 | 938 | 713 | 21156 |
| heap | random | 100000 | rust | 80.6 ± 19.8 | 61.2 to 101 | 55.1 | 9.68 | 3540 |
| heap | random | 100000 | ts | 505 ± 104 | 387 to 585 | 273 | 20.4 | 47432 |
| heap | random | 200000 | cpp | 246 ± 9.13 | 236 to 254 | 152 | 22.3 | 5836 |
| heap | random | 200000 | elixir | 1220 ± 93.2 | 1117 to 1299 | 2148 | 758 | 206048 |
| heap | random | 200000 | go | 314 ± 38.7 | 275 to 352 | 174 | 20.7 | 6844 |
| heap | random | 200000 | java | 661 ± 85.2 | 584 to 753 | 645 | 29.9 | 66524 |
| heap | random | 200000 | python | 2183 ± 317 | 1842 to 2468 | 1830 | 1294 | 32424 |
| heap | random | 200000 | rust | 275 ± 100 | 206 to 390 | 168 | 20.4 | 4660 |
| heap | random | 200000 | ts | 574 ± 99.0 | 462 to 651 | 461 | 48.5 | 60004 |
| insertion | random | 1000 | cpp | 16.9 ± 3.50 | 12.9 to 19.5 | 4.17 | 0.16 | 3776 |
| insertion | random | 1000 | elixir | 1042 ± 71.6 | 987 to 1123 | 1711 | 1.53 | 86772 |
| insertion | random | 1000 | go | 34.7 ± 4.23 | 30.3 to 38.8 | 11.8 | 0.20 | 3108 |
| insertion | random | 1000 | java | 151 ± 13.1 | 140 to 166 | 181 | 0.58 | 45420 |
| insertion | random | 1000 | python | 290 ± 21.8 | 271 to 314 | 204 | 27.4 | 10840 |
| insertion | random | 1000 | rust | 13.7 ± 2.96 | 11.1 to 16.9 | 3.47 | 0.08 | 2076 |
| insertion | random | 1000 | ts | 67.2 ± 10.7 | 55.1 to 75.1 | 60.1 | 0.78 | 32504 |
| insertion | random | 2000 | cpp | 20.6 ± 8.56 | 13.3 to 30.0 | 6.94 | 0.84 | 3792 |
| insertion | random | 2000 | elixir | 1158 ± 198 | 930 to 1285 | 1817 | 8.92 | 88688 |
| insertion | random | 2000 | go | 48.0 ± 8.87 | 39.3 to 57.0 | 17.4 | 0.52 | 2904 |
| insertion | random | 2000 | java | 303 ± 66.6 | 226 to 348 | 288 | 0.66 | 46844 |
| insertion | random | 2000 | python | 572 ± 44.0 | 522 to 607 | 456 | 126 | 10764 |
| insertion | random | 2000 | rust | 142 ± 29.4 | 124 to 176 | 14.8 | 0.61 | 2160 |
| insertion | random | 2000 | ts | 273 ± 58.4 | 219 to 335 | 210 | 4.01 | 32716 |
| insertion | random | 10000 | cpp | 121 ± 20.3 | 101 to 142 | 98.1 | 12.8 | 3952 |
| insertion | random | 10000 | elixir | 1812 ± 272 | 1500 to 2003 | 2067 | 562 | 97140 |
| insertion | random | 10000 | go | 256 ± 38.2 | 218 to 295 | 187 | 18.3 | 3144 |
| insertion | random | 10000 | java | 422 ± 89.8 | 342 to 519 | 502 | 12.1 | 49296 |
| insertion | random | 10000 | python | 3979 ± 254 | 3741 to 4246 | 3828 | 4317 | 11648 |
| insertion | random | 10000 | rust | 136 ± 16.6 | 118 to 151 | 99.2 | 23.4 | 2028 |
| insertion | random | 10000 | ts | 460 ± 74.2 | 409 to 545 | 424 | 104 | 33444 |
| merge | random | 1000 | cpp | 15.2 ± 2.28 | 13.7 to 17.8 | 3.90 | 0.03 | 3808 |
| merge | random | 1000 | elixir | 2166 ± 712 | 1604 to 2966 | 1839 | 0.23 | 84948 |
| merge | random | 1000 | go | 49.2 ± 4.46 | 44.8 to 53.7 | 14.4 | 0.04 | 2812 |
| merge | random | 1000 | java | 197 ± 11.8 | 184 to 207 | 228 | 0.14 | 47384 |
| merge | random | 1000 | python | 232 ± 56.7 | 194 to 297 | 121 | 2.13 | 10812 |
| merge | random | 1000 | rust | 17.1 ± 3.55 | 14.5 to 21.1 | 3.81 | 0.03 | 1844 |
| merge | random | 1000 | ts | 74.6 ± 24.4 | 48.9 to 97.5 | 48.5 | 0.36 | 28320 |
| merge | random | 2000 | cpp | 34.3 ± 11.8 | 22.0 to 45.5 | 5.30 | 0.08 | 3808 |
| merge | random | 2000 | elixir | 1635 ± 414 | 1382 to 2113 | 1410 | 0.49 | 87356 |
| merge | random | 2000 | go | 43.1 ± 10.8 | 33.9 to 55.1 | 13.4 | 0.12 | 2928 |
| merge | random | 2000 | java | 280 ± 37.3 | 255 to 323 | 375 | 0.23 | 47876 |
| merge | random | 2000 | python | 268 ± 12.8 | 254 to 279 | 118 | 4.48 | 10964 |
| merge | random | 2000 | rust | 13.4 ± 2.40 | 11.8 to 16.1 | 3.17 | 0.09 | 1956 |
| merge | random | 2000 | ts | 45.6 ± 6.43 | 40.9 to 53.0 | 32.2 | 0.33 | 32468 |
| merge | random | 10000 | cpp | 42.1 ± 28.0 | 24.5 to 74.4 | 9.95 | 0.60 | 3948 |
| merge | random | 10000 | elixir | 1827 ± 558 | 1368 to 2447 | 1710 | 2.94 | 92848 |
| merge | random | 10000 | go | 52.6 ± 14.7 | 42.7 to 69.5 | 33.4 | 0.63 | 3436 |
| merge | random | 10000 | java | 236 ± 19.7 | 222 to 259 | 307 | 1.32 | 48928 |
| merge | random | 10000 | python | 909 ± 369 | 484 to 1152 | 343 | 32.7 | 12620 |
| merge | random | 10000 | rust | 86.5 ± 21.5 | 62.1 to 103 | 18.1 | 0.65 | 1956 |
| merge | random | 10000 | ts | 75.4 ± 6.22 | 68.3 to 79.9 | 58.1 | 1.55 | 34900 |
| merge | random | 100000 | cpp | 216 ± 98.8 | 120 to 317 | 86.9 | 10.3 | 5012 |
| merge | random | 100000 | elixir | 2075 ± 596 | 1649 to 2755 | 1883 | 60.3 | 162332 |
| merge | random | 100000 | go | 186 ± 26.8 | 162 to 215 | 91.4 | 11.8 | 6984 |
| merge | random | 100000 | java | 320 ± 56.6 | 283 to 385 | 400 | 9.93 | 59088 |
| merge | random | 100000 | python | 1184 ± 63.6 | 1146 to 1258 | 763 | 579 | 21596 |
| merge | random | 100000 | rust | 86.3 ± 4.63 | 81.7 to 91.0 | 62.9 | 7.84 | 3340 |
| merge | random | 100000 | ts | 371 ± 71.7 | 290 to 426 | 256 | 19.9 | 49916 |
| merge | random | 200000 | cpp | 480 ± 149 | 353 to 644 | 168 | 18.1 | 6424 |
| merge | random | 200000 | elixir | 2286 ± 342 | 2087 to 2680 | 2240 | 211 | 181012 |
| merge | random | 200000 | go | 297 ± 17.7 | 279 to 315 | 167 | 21.5 | 8648 |
| merge | random | 200000 | java | 504 ± 119 | 389 to 626 | 544 | 24.3 | 70288 |
| merge | random | 200000 | python | 1745 ± 166 | 1577 to 1908 | 1340 | 1121 | 32364 |
| merge | random | 200000 | rust | 132 ± 21.6 | 114 to 156 | 110 | 14.2 | 4968 |
| merge | random | 200000 | ts | 328 ± 23.4 | 306 to 353 | 328 | 47.1 | 62028 |
| quick | random | 1000 | cpp | 19.4 ± 5.49 | 16.0 to 25.7 | 3.35 | 0.02 | 3900 |
| quick | random | 1000 | elixir | 1365 ± 352 | 1042 to 1740 | 1593 | 0.21 | 86336 |
| quick | random | 1000 | go | 34.7 ± 0.84 | 34.1 to 35.6 | 10.9 | 0.02 | 3108 |
| quick | random | 1000 | java | 206 ± 54.0 | 145 to 246 | 215 | 0.11 | 48100 |
| quick | random | 1000 | python | 415 ± 64.1 | 357 to 483 | 97.7 | 1.42 | 10948 |
| quick | random | 1000 | rust | 17.6 ± 8.47 | 12.2 to 27.4 | 2.80 | 0.02 | 2016 |
| quick | random | 1000 | ts | 179 ± 71.1 | 127 to 260 | 51.2 | 0.16 | 27476 |
| quick | random | 2000 | cpp | 51.7 ± 23.9 | 34.7 to 79.0 | 9.61 | 0.06 | 3808 |
| quick | random | 2000 | elixir | 1532 ± 409 | 1115 to 1932 | 1540 | 0.53 | 88372 |
| quick | random | 2000 | go | 36.2 ± 3.23 | 32.4 to 38.0 | 11.5 | 0.05 | 2708 |
| quick | random | 2000 | java | 279 ± 79.3 | 190 to 340 | 363 | 0.24 | 48120 |
| quick | random | 2000 | python | 814 ± 276 | 502 to 1028 | 123 | 2.80 | 10888 |
| quick | random | 2000 | rust | 41.4 ± 29.2 | 19.1 to 74.5 | 8.50 | 0.07 | 1904 |
| quick | random | 2000 | ts | 144 ± 54.4 | 110 to 207 | 48.4 | 0.25 | 31180 |
| quick | random | 10000 | cpp | 24.2 ± 7.40 | 19.3 to 32.7 | 8.52 | 0.57 | 3792 |
| quick | random | 10000 | elixir | 874 ± 121 | 759 to 1000 | 1535 | 3.68 | 95352 |
| quick | random | 10000 | go | 43.7 ± 2.91 | 41.2 to 46.9 | 15.2 | 0.48 | 3016 |
| quick | random | 10000 | java | 286 ± 70.1 | 213 to 353 | 288 | 1.04 | 49484 |
| quick | random | 10000 | python | 607 ± 82.2 | 526 to 690 | 215 | 19.3 | 11784 |
| quick | random | 10000 | rust | 21.1 ± 6.42 | 17.1 to 28.5 | 6.61 | 0.53 | 2060 |
| quick | random | 10000 | ts | 130 ± 51.2 | 94.5 to 188 | 60.5 | 1.37 | 33984 |
| quick | random | 100000 | cpp | 299 ± 90.8 | 206 to 387 | 76.3 | 7.22 | 4456 |
| quick | random | 100000 | elixir | 1793 ± 243 | 1577 to 2056 | 2072 | 69.7 | 191952 |
| quick | random | 100000 | go | 304 ± 20.0 | 284 to 323 | 104 | 7.80 | 4412 |
| quick | random | 100000 | java | 480 ± 59.6 | 415 to 533 | 482 | 8.39 | 57004 |
| quick | random | 100000 | python | 805 ± 200 | 647 to 1029 | 545 | 412 | 21612 |
| quick | random | 100000 | rust | 93.8 ± 23.2 | 73.1 to 119 | 59.9 | 8.93 | 3504 |
| quick | random | 100000 | ts | 442 ± 173 | 248 to 577 | 366 | 12.8 | 48220 |
| quick | random | 200000 | cpp | 436 ± 183 | 328 to 647 | 159 | 15.7 | 5484 |
| quick | random | 200000 | elixir | 1526 ± 164 | 1393 to 1709 | 2408 | 126 | 249368 |
| quick | random | 200000 | go | 570 ± 80.2 | 515 to 662 | 211 | 17.0 | 7256 |
| quick | random | 200000 | java | 663 ± 234 | 483 to 927 | 705 | 22.1 | 67172 |
| quick | random | 200000 | python | 1378 ± 230 | 1230 to 1644 | 1029 | 742 | 32508 |
| quick | random | 200000 | rust | 143 ± 22.7 | 122 to 167 | 105 | 13.5 | 4816 |
| quick | random | 200000 | ts | 288 ± 8.69 | 280 to 297 | 421 | 27.1 | 60828 |
| radix | random | 1000 | cpp | 13.1 ± 1.07 | 12.2 to 14.3 | 3.23 | 0.01 | 3724 |
| radix | random | 1000 | elixir | 617 ± 94.0 | 512 to 693 | 1584 | 0.90 | 86664 |
| radix | random | 1000 | go | 38.6 ± 3.40 | 35.2 to 42.0 | 12.0 | 0.01 | 2908 |
| radix | random | 1000 | java | 238 ± 77.6 | 173 to 324 | 196 | 0.36 | 45036 |
| radix | random | 1000 | python | 223 ± 79.7 | 170 to 314 | 74.6 | 1.01 | 10324 |
| radix | random | 1000 | rust | 92.5 ± 47.0 | 41.5 to 134 | 4.74 | 0.01 | 1900 |
| radix | random | 1000 | ts | 74.9 ± 8.04 | 68.5 to 84.0 | 34.5 | 0.23 | 28740 |
| radix | random | 2000 | cpp | 36.2 ± 5.80 | 32.8 to 42.9 | 3.78 | 0.01 | 3776 |
| radix | random | 2000 | elixir | 584 ± 20.5 | 561 to 600 | 1448 | 1.65 | 88768 |
| radix | random | 2000 | go | 56.3 ± 14.6 | 39.6 to 66.7 | 14.5 | 0.03 | 3048 |
| radix | random | 2000 | java | 220 ± 54.9 | 157 to 260 | 230 | 0.30 | 47104 |
| radix | random | 2000 | python | 244 ± 177 | 131 to 448 | 77.9 | 2.18 | 10864 |
| radix | random | 2000 | rust | 53.5 ± 30.6 | 33.2 to 88.7 | 12.4 | 0.01 | 1832 |
| radix | random | 2000 | ts | 80.5 ± 1.03 | 79.5 to 81.6 | 38.0 | 0.51 | 28884 |
| radix | random | 10000 | cpp | 32.1 ± 6.49 | 24.7 to 36.5 | 9.09 | 0.06 | 3960 |
| radix | random | 10000 | elixir | 845 ± 125 | 707 to 950 | 1669 | 6.21 | 98612 |
| radix | random | 10000 | go | 123 ± 12.3 | 111 to 136 | 27.6 | 0.13 | 2720 |
| radix | random | 10000 | java | 237 ± 31.5 | 217 to 273 | 295 | 0.33 | 49268 |
| radix | random | 10000 | python | 282 ± 39.3 | 254 to 327 | 160 | 9.60 | 12064 |
| radix | random | 10000 | rust | 34.1 ± 4.08 | 29.9 to 38.0 | 5.72 | 0.07 | 1904 |
| radix | random | 10000 | ts | 87.5 ± 14.2 | 74.3 to 102 | 54.4 | 0.97 | 34680 |
| radix | random | 100000 | cpp | 100 ± 31.9 | 65.0 to 127 | 32.7 | 1.24 | 5224 |
| radix | random | 100000 | elixir | 1016 ± 109 | 916 to 1132 | 2006 | 79.6 | 157572 |
| radix | random | 100000 | go | 99.1 ± 17.4 | 86.4 to 119 | 38.4 | 0.84 | 6864 |
| radix | random | 100000 | java | 568 ± 141 | 420 to 701 | 481 | 3.85 | 58816 |
| radix | random | 100000 | python | 633 ± 114 | 501 to 706 | 513 | 195 | 21060 |
| radix | random | 100000 | rust | 40.5 ± 13.1 | 28.2 to 54.3 | 15.7 | 0.78 | 3604 |
| radix | random | 100000 | ts | 332 ± 148 | 203 to 493 | 325 | 4.82 | 50044 |
| radix | random | 200000 | cpp | 295 ± 90.2 | 194 to 366 | 65.7 | 2.27 | 6640 |
| radix | random | 200000 | elixir | 1162 ± 319 | 945 to 1528 | 2011 | 242 | 203620 |
| radix | random | 200000 | go | 202 ± 31.4 | 176 to 237 | 71.7 | 1.68 | 8864 |
| radix | random | 200000 | java | 530 ± 55.8 | 469 to 579 | 578 | 3.60 | 70376 |
| radix | random | 200000 | python | 1014 ± 192 | 870 to 1231 | 804 | 566 | 32572 |
| radix | random | 200000 | rust | 85.4 ± 13.2 | 72.2 to 98.6 | 37.4 | 1.53 | 4984 |
| radix | random | 200000 | ts | 599 ± 178 | 398 to 735 | 439 | 37.2 | 65024 |

## Commands

- `cpp`: `cpp/build/bench bubble random 1000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- bubble random 1000`
- `go`: `go/bin/bench bubble random 1000`
- `java`: `java -cp java/out Bench bubble random 1000`
- `python`: `python python/bench.py bubble random 1000`
- `rust`: `rust/target/release/sorting-race bubble random 1000`
- `ts`: `bun run ts/src/bench.ts bubble random 1000`
- `cpp`: `cpp/build/bench bubble random 2000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- bubble random 2000`
- `go`: `go/bin/bench bubble random 2000`
- `java`: `java -cp java/out Bench bubble random 2000`
- `python`: `python python/bench.py bubble random 2000`
- `rust`: `rust/target/release/sorting-race bubble random 2000`
- `ts`: `bun run ts/src/bench.ts bubble random 2000`
- `cpp`: `cpp/build/bench bubble random 10000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- bubble random 10000`
- `go`: `go/bin/bench bubble random 10000`
- `java`: `java -cp java/out Bench bubble random 10000`
- `python`: `python python/bench.py bubble random 10000`
- `rust`: `rust/target/release/sorting-race bubble random 10000`
- `ts`: `bun run ts/src/bench.ts bubble random 10000`
- `cpp`: `cpp/build/bench heap random 1000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- heap random 1000`
- `go`: `go/bin/bench heap random 1000`
- `java`: `java -cp java/out Bench heap random 1000`
- `python`: `python python/bench.py heap random 1000`
- `rust`: `rust/target/release/sorting-race heap random 1000`
- `ts`: `bun run ts/src/bench.ts heap random 1000`
- `cpp`: `cpp/build/bench heap random 2000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- heap random 2000`
- `go`: `go/bin/bench heap random 2000`
- `java`: `java -cp java/out Bench heap random 2000`
- `python`: `python python/bench.py heap random 2000`
- `rust`: `rust/target/release/sorting-race heap random 2000`
- `ts`: `bun run ts/src/bench.ts heap random 2000`
- `cpp`: `cpp/build/bench heap random 10000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- heap random 10000`
- `go`: `go/bin/bench heap random 10000`
- `java`: `java -cp java/out Bench heap random 10000`
- `python`: `python python/bench.py heap random 10000`
- `rust`: `rust/target/release/sorting-race heap random 10000`
- `ts`: `bun run ts/src/bench.ts heap random 10000`
- `cpp`: `cpp/build/bench heap random 100000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- heap random 100000`
- `go`: `go/bin/bench heap random 100000`
- `java`: `java -cp java/out Bench heap random 100000`
- `python`: `python python/bench.py heap random 100000`
- `rust`: `rust/target/release/sorting-race heap random 100000`
- `ts`: `bun run ts/src/bench.ts heap random 100000`
- `cpp`: `cpp/build/bench heap random 200000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- heap random 200000`
- `go`: `go/bin/bench heap random 200000`
- `java`: `java -cp java/out Bench heap random 200000`
- `python`: `python python/bench.py heap random 200000`
- `rust`: `rust/target/release/sorting-race heap random 200000`
- `ts`: `bun run ts/src/bench.ts heap random 200000`
- `cpp`: `cpp/build/bench insertion random 1000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- insertion random 1000`
- `go`: `go/bin/bench insertion random 1000`
- `java`: `java -cp java/out Bench insertion random 1000`
- `python`: `python python/bench.py insertion random 1000`
- `rust`: `rust/target/release/sorting-race insertion random 1000`
- `ts`: `bun run ts/src/bench.ts insertion random 1000`
- `cpp`: `cpp/build/bench insertion random 2000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- insertion random 2000`
- `go`: `go/bin/bench insertion random 2000`
- `java`: `java -cp java/out Bench insertion random 2000`
- `python`: `python python/bench.py insertion random 2000`
- `rust`: `rust/target/release/sorting-race insertion random 2000`
- `ts`: `bun run ts/src/bench.ts insertion random 2000`
- `cpp`: `cpp/build/bench insertion random 10000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- insertion random 10000`
- `go`: `go/bin/bench insertion random 10000`
- `java`: `java -cp java/out Bench insertion random 10000`
- `python`: `python python/bench.py insertion random 10000`
- `rust`: `rust/target/release/sorting-race insertion random 10000`
- `ts`: `bun run ts/src/bench.ts insertion random 10000`
- `cpp`: `cpp/build/bench merge random 1000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- merge random 1000`
- `go`: `go/bin/bench merge random 1000`
- `java`: `java -cp java/out Bench merge random 1000`
- `python`: `python python/bench.py merge random 1000`
- `rust`: `rust/target/release/sorting-race merge random 1000`
- `ts`: `bun run ts/src/bench.ts merge random 1000`
- `cpp`: `cpp/build/bench merge random 2000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- merge random 2000`
- `go`: `go/bin/bench merge random 2000`
- `java`: `java -cp java/out Bench merge random 2000`
- `python`: `python python/bench.py merge random 2000`
- `rust`: `rust/target/release/sorting-race merge random 2000`
- `ts`: `bun run ts/src/bench.ts merge random 2000`
- `cpp`: `cpp/build/bench merge random 10000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- merge random 10000`
- `go`: `go/bin/bench merge random 10000`
- `java`: `java -cp java/out Bench merge random 10000`
- `python`: `python python/bench.py merge random 10000`
- `rust`: `rust/target/release/sorting-race merge random 10000`
- `ts`: `bun run ts/src/bench.ts merge random 10000`
- `cpp`: `cpp/build/bench merge random 100000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- merge random 100000`
- `go`: `go/bin/bench merge random 100000`
- `java`: `java -cp java/out Bench merge random 100000`
- `python`: `python python/bench.py merge random 100000`
- `rust`: `rust/target/release/sorting-race merge random 100000`
- `ts`: `bun run ts/src/bench.ts merge random 100000`
- `cpp`: `cpp/build/bench merge random 200000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- merge random 200000`
- `go`: `go/bin/bench merge random 200000`
- `java`: `java -cp java/out Bench merge random 200000`
- `python`: `python python/bench.py merge random 200000`
- `rust`: `rust/target/release/sorting-race merge random 200000`
- `ts`: `bun run ts/src/bench.ts merge random 200000`
- `cpp`: `cpp/build/bench quick random 1000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- quick random 1000`
- `go`: `go/bin/bench quick random 1000`
- `java`: `java -cp java/out Bench quick random 1000`
- `python`: `python python/bench.py quick random 1000`
- `rust`: `rust/target/release/sorting-race quick random 1000`
- `ts`: `bun run ts/src/bench.ts quick random 1000`
- `cpp`: `cpp/build/bench quick random 2000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- quick random 2000`
- `go`: `go/bin/bench quick random 2000`
- `java`: `java -cp java/out Bench quick random 2000`
- `python`: `python python/bench.py quick random 2000`
- `rust`: `rust/target/release/sorting-race quick random 2000`
- `ts`: `bun run ts/src/bench.ts quick random 2000`
- `cpp`: `cpp/build/bench quick random 10000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- quick random 10000`
- `go`: `go/bin/bench quick random 10000`
- `java`: `java -cp java/out Bench quick random 10000`
- `python`: `python python/bench.py quick random 10000`
- `rust`: `rust/target/release/sorting-race quick random 10000`
- `ts`: `bun run ts/src/bench.ts quick random 10000`
- `cpp`: `cpp/build/bench quick random 100000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- quick random 100000`
- `go`: `go/bin/bench quick random 100000`
- `java`: `java -cp java/out Bench quick random 100000`
- `python`: `python python/bench.py quick random 100000`
- `rust`: `rust/target/release/sorting-race quick random 100000`
- `ts`: `bun run ts/src/bench.ts quick random 100000`
- `cpp`: `cpp/build/bench quick random 200000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- quick random 200000`
- `go`: `go/bin/bench quick random 200000`
- `java`: `java -cp java/out Bench quick random 200000`
- `python`: `python python/bench.py quick random 200000`
- `rust`: `rust/target/release/sorting-race quick random 200000`
- `ts`: `bun run ts/src/bench.ts quick random 200000`
- `cpp`: `cpp/build/bench radix random 1000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- radix random 1000`
- `go`: `go/bin/bench radix random 1000`
- `java`: `java -cp java/out Bench radix random 1000`
- `python`: `python python/bench.py radix random 1000`
- `rust`: `rust/target/release/sorting-race radix random 1000`
- `ts`: `bun run ts/src/bench.ts radix random 1000`
- `cpp`: `cpp/build/bench radix random 2000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- radix random 2000`
- `go`: `go/bin/bench radix random 2000`
- `java`: `java -cp java/out Bench radix random 2000`
- `python`: `python python/bench.py radix random 2000`
- `rust`: `rust/target/release/sorting-race radix random 2000`
- `ts`: `bun run ts/src/bench.ts radix random 2000`
- `cpp`: `cpp/build/bench radix random 10000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- radix random 10000`
- `go`: `go/bin/bench radix random 10000`
- `java`: `java -cp java/out Bench radix random 10000`
- `python`: `python python/bench.py radix random 10000`
- `rust`: `rust/target/release/sorting-race radix random 10000`
- `ts`: `bun run ts/src/bench.ts radix random 10000`
- `cpp`: `cpp/build/bench radix random 100000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- radix random 100000`
- `go`: `go/bin/bench radix random 100000`
- `java`: `java -cp java/out Bench radix random 100000`
- `python`: `python python/bench.py radix random 100000`
- `rust`: `rust/target/release/sorting-race radix random 100000`
- `ts`: `bun run ts/src/bench.ts radix random 100000`
- `cpp`: `cpp/build/bench radix random 200000`
- `elixir`: `elixir -pa elixir/_build/prod/lib/sorting_race/ebin -e "SortingRace.Bench.main(System.argv())" -- radix random 200000`
- `go`: `go/bin/bench radix random 200000`
- `java`: `java -cp java/out Bench radix random 200000`
- `python`: `python python/bench.py radix random 200000`
- `rust`: `rust/target/release/sorting-race radix random 200000`
- `ts`: `bun run ts/src/bench.ts radix random 200000`
