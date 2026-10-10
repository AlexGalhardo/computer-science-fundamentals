# lru-bloom-trie

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Three small structures that sit behind everyday systems, written in TypeScript and in Go: an **LRU cache** with O(1) `get` and `put` (what a cache does when it is full), a **Bloom filter** with configurable size and number of hashes (a membership test in a few bits per key, with false positives and no false negatives), and a **trie** (prefix search, as in autocomplete).

Full explanation: [docs/en/data-structures/lru-bloom-trie.md](../../../docs/en/data-structures/lru-bloom-trie.md).

## Quiz topics it demonstrates

- `data-structures` / `arrays-and-lists`: the doubly linked list, and why the LRU cache needs both pointers to unlink a node in O(1).
- `data-structures` / `hash-tables`: the hash map from key to node in the cache, and hash functions used as bit selectors in the Bloom filter.
- `data-structures` / `binary-trees-and-traversals`: the trie is a tree with many children per node, listed with a depth-first traversal.
- `data-structures` / `abstract-data-types`: each structure is tested against a simple reference model that has the same interface.

## Run

The only requirement is Docker.

```sh
./setup-unix-lru-bloom-trie.sh        # Linux and macOS
./setup-windows-lru-bloom-trie.ps1    # Windows
```

The script builds one pinned image per language and runs the tests in each. The Go image also runs `gofmt`, `go vet` and `golangci-lint`. TypeScript is formatted and linted with Biome and type-checked from the repository root: `bunx biome check projects/data-structures/lru-bloom-trie` and `bunx tsc --noEmit -p projects/data-structures/lru-bloom-trie/ts`.

## Structure

| Path | Content |
| --- | --- |
| `ts/src/lru-cache.ts`, `go/lru.go` | LRU cache: hash map plus doubly linked list |
| `ts/src/bloom-filter.ts`, `go/bloom.go` | Bloom filter: bit array, double hashing, sizing formulas |
| `ts/src/trie.ts`, `go/trie.go` | trie: insert, exact search, prefix listing in alphabetical order |
| `ts/src/words.ts`, `go/words.go` | deterministic generator of the 100,000 test words |
| `ts/demo.ts`, `go/cmd/demo` | the demo |
| `results/demo-output.md` | committed output of the demo |

There are no dependencies in either language.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm go-test
```

- **LRU cache**: for capacities 1 to 8, 5,000 random `get` and `put` operations each are compared with a reference model (a plain list kept in order of use). The value returned, the key evicted and the whole order of the keys must match after every operation.
- **Bloom filter**: four configurations, from 4 to 10 bits per key. No key that was added is ever reported absent, and the false-positive rate measured with 200,000 keys that were never added stays within 20% of the theoretical rate (1 - e^(-kn/m))^k. In the committed run the difference was under 3%.
- **Trie**: over 100,000 generated words, 305 prefixes return exactly the same set as a linear filter with `startsWith`.

## Demo

```sh
docker compose run --rm ts-test bun run demo.ts
docker compose run --rm go-test lbt_demo
```

Prints an LRU trace with evictions, the measured against the theoretical false-positive rate of the Bloom filter, and prefix searches over 100,000 words. Committed output: [results/demo-output.md](results/demo-output.md).
