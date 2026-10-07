# hash-map

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A hash map written from scratch, twice: with **separate chaining** (a linked list per bucket) and with **open addressing** (linear probing inside one array). It teaches how collisions are resolved, why deletion in open addressing needs tombstones, and why the load factor decides the speed of a lookup.

Full explanation: [docs/en/data-structures/hash-map.md](../../../docs/en/data-structures/hash-map.md).

## Quiz topics it demonstrates

- `data-structures` / `hash-tables`: collisions, separate chaining, linear probing, tombstones, load factor, rehashing, primary clustering.
- `data-structures` / `arrays-and-lists`: the linked list inside each bucket and the removal of a node without a special case for the head.

## Run

The only requirement is Docker.

```sh
./setup-unix-hash-map.sh        # Linux and macOS
./setup-windows-hash-map.ps1    # Windows
```

The script builds one pinned image per language and runs the tests in each. The C++ and Rust images also run the format check and the linter (clang-format, rustfmt, clippy). TypeScript is formatted and linted with Biome and type-checked from the repository root: `bunx biome check projects/data-structures/hash-map` and `bunx tsc --noEmit -p projects/data-structures/hash-map/ts`.

## Structure

| Path | Content |
| --- | --- |
| `cpp/hash_map.hpp` | `ChainingMap` and `ProbingMap` in C++23, keys `uint64_t` |
| `rust/src/lib.rs` | the same two maps in Rust, keys `u64` |
| `ts/src/hash-map.ts` | the same two maps in TypeScript, keys are unsigned 32-bit integers |
| `*/bench.*`, `rust/src/bench.rs` | benchmark programs that honour the repository contract |
| `bench.json` | the benchmark grid: 3 languages, 2 strategies, 4 load factors |
| `results/` | committed results of the last benchmark run |
| `dashboard/` | static page that draws `results/results.js` |

All three implementations expose `put`, `get`, `remove`, size, capacity and load factor, and take the hash function as a parameter so that tests can force collisions.

## Tests

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
docker compose run --rm ts-test
```

- **Property tests**: 5 seeds of 20,000 random `put`, `get` and `remove` operations each, for both strategies and for a good and a deliberately weak hash. Every answer is compared with the map of the language (`std::unordered_map`, `HashMap`, `Map`).
- **Resize**: 10,000 insertions never let the load factor pass the limit, and every key survives the rehashes.
- **Tombstones**: after deleting one of three colliding keys and inserting another, `get` still returns the right values.

## Benchmark

```sh
bun run bench -- --project hash-map
```

Run it from the repository root. Each row builds a table with exactly the requested load factor (no resize), then times 200,000 lookups of stored keys and 200,000 lookups of missing keys. Results go to `results/` and the page `dashboard/index.html` opens straight from disk.

Read [results/results.md](results/results.md) with the `section` column and the `Variant` column (the load factor). The cap of 200,000 keys keeps the run short on a shared machine. The numbers are noisy below load 0.75, so only the jump of linear probing at 0.9 is a safe conclusion.
