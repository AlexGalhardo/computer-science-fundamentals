# Memory limit: sorting a file 10 times larger than the container memory

Output of the two `*-limit` services, committed as text. Times depend on the machine and on what else it was running. The run counts, the checksum and the order of magnitude of the peak memory do not.

- Commands: `docker compose run --rm rust-limit` and `docker compose run --rm go-limit`
- Images: `rust:1.99.0-slim-trixie` and `golang:1.27.1-bookworm`
- Container limit, set in `docker-compose.yml`: `mem_limit: 32m` and `memswap_limit: 32m` (32 MiB of memory, no swap)
- Run on Docker Engine 29.8.1 (Docker Desktop, kernel 6.18.33.2-microsoft-standard-WSL2, cgroup v2), AMD Ryzen 7 5700X3D, 2026-10-08, with other workloads on the same machine

## How the limit is checked

1. **The kernel enforces it.** docker-compose gives each `*-limit` container 32 MiB and no swap. The program prints the limit it sees in `/sys/fs/cgroup/memory.max`: 33554432 bytes.
2. **The program measures itself.** After sorting, it reads `VmHWM` ("high water mark", the peak resident memory of the process) from `/proc/self/status` and exits with an error unless it is below the limit.
3. **The limit is proved to be real.** Under the same limit, `extsort in-memory-check 32` generates the same file and sorts it by loading it whole. The kernel kills it, and the setup script requires that failure.

| Language | Input | Runs | Merge passes | Peak resident memory (VmHWM) | Share of the 32 MiB limit | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Rust | 335,544,323 bytes (10.0 times the limit) | 41 | 2 | 11,476 KiB (11.2 MiB) | 35% | sorted, same lines as the input |
| Go | 335,544,323 bytes (10.0 times the limit) | 41 | 2 | 20,352 KiB (19.9 MiB) | 62% | sorted, same lines as the input |
| Rust, in memory | the same file | - | - | - | - | killed by the kernel, exit code 137 |
| Go, in memory | the same file | - | - | - | - | killed by the kernel, exit code 137 |

## Rust

```
language: rust
memory limit: 32 MiB (cgroup memory.max: 33554432)
input: 6711152 lines, 335544323 bytes (10.0 times the limit)
run size: 8388608 bytes, fan-in 8
fdatasync after every 4 MiB written
initial runs: 41, merge passes: 2
time: run generation 22404 ms, merge 34144 ms
output: sorted, same lines as the input (checksum 6ff139763bb20ecadc8543b2a27f2914)
peak resident memory (VmHWM): 11476 KiB = 11.2 MiB
cgroup memory.peak, which also counts page cache: 33554432 bytes
OK: peak resident memory stayed under 32 MiB
```

## Go

```
language: go
memory limit: 32 MiB (cgroup memory.max: 33554432)
input: 6711152 lines, 335544323 bytes (10.0 times the limit)
run size: 8388608 bytes, fan-in 8
fdatasync after every 4 MiB written
initial runs: 41, merge passes: 2
time: run generation 24367 ms, merge 80463 ms
output: sorted, same lines as the input (checksum 6ff139763bb20ecadc8543b2a27f2914)
peak resident memory (VmHWM): 20352 KiB = 19.9 MiB
cgroup memory.peak, which also counts page cache: 33566720 bytes
OK: peak resident memory stayed under 32 MiB
```

## Reading

- A second run on the same machine, as part of the setup script, gave 11,472 KiB for Rust and 21,236 KiB (20.7 MiB) for Go. The peak of Rust repeats almost exactly. The peak of Go moves by about 1 MiB between runs, because it depends on when the garbage collector runs.
- Both programs sort 320 MiB with a run buffer of 8 MiB. Rust peaks at 11.2 MiB: the 8 MiB buffer, the index of 8 bytes per line (about 1.3 MiB for 168,000 lines) and the buffers of the files. Go peaks at 19.9 MiB: the same data plus the runtime and garbage that the collector had not yet released.
- The two languages print the same checksum, because they generate the same file from the same seed and write the same sorted output.
- `memory.peak` of the cgroup reaches the limit in both. That number includes the page cache of the files being read and written, which the kernel fills up to the limit and reclaims when it needs room. The memory of the process itself is the `VmHWM` line.
- The first version of this demo was killed while it was only writing the input file, with less than 1 MiB of its own memory: the written pages were waiting in the page cache faster than the disk took them, and a cgroup cannot drop pages that are not on disk yet. Calling `fdatasync` every 4 MiB bounds those pages. It is also why the times above are long: the disk, not the sort, sets the pace.
