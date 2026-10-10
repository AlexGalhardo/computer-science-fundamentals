# Hash map from scratch

> Versão em português: [docs/pt/data-structures/hash-map.md](../../pt/data-structures/hash-map.md) · Versión en español: [docs/es/data-structures/hash-map.md](../../es/data-structures/hash-map.md)

Mini-project: [projects/data-structures/hash-map](../../../projects/data-structures/hash-map). Languages: C++, Rust, TypeScript. Quiz topic: `data-structures` / `hash-tables`.

## The idea

A hash map turns a key into an array index with a hash function, so a lookup goes straight to one position instead of searching. There are far more possible keys than positions, so two different keys will sometimes get the same index. That is a **collision**, and the two classic ways of resolving it are the two implementations of this mini-project.

## Separate chaining

Each position (bucket) holds a linked list with every entry that hashed there.

```text
bucket 0: (8, h) -> (4, d)
bucket 1: (5, e)
bucket 2: empty
bucket 3: (7, g) -> (3, c)
```

- `put` walks the list to look for the key and, when it is new, links a node at the head.
- `get` walks the same list.
- `remove` unlinks one node.

A collision only makes one list longer. The cost of an operation is the length of the list, which on average is the load factor.

## Open addressing with linear probing

Every entry lives in the array itself. When the position given by the hash is taken, the next one is tried, then the next, wrapping around at the end.

```text
h(k) = k mod 7        insert 10, 17, 24, 3

index:   0    1    2    3    4    5    6
       [  ] [  ] [  ] [10] [17] [24] [ 3]
```

A search follows the same sequence and stops when it finds the key or an **empty** position.

### Why deletion needs tombstones

An empty position means "no key ever probed past here". If removing 10 simply emptied index 3, a search for 17 would start at index 3, find it empty and wrongly answer "absent". So removal writes a **tombstone**: searches walk over it, and an insertion may reuse it.

Tombstones still lengthen every probe. The implementations count them together with the live entries, and rebuilding the table (rehash) throws them all away.

## Load factor and rehashing

The load factor is the number of entries divided by the number of positions. When it passes a limit (0.75 for chaining and 0.5 for probing by default) the table doubles, and every entry is inserted again, because the index `hash % capacity` depends on the capacity. A rehash costs O(n), but doubling makes it rare enough for insertion to stay O(1) amortised.

For a search that fails, the expected work is:

| Load factor | Chaining (entries examined) | Linear probing (positions examined) |
| ---: | ---: | ---: |
| 0.25 | 0.25 | 1.4 |
| 0.5 | 0.5 | 2.5 |
| 0.75 | 0.75 | 8.5 |
| 0.9 | 0.9 | 50.5 |

Chaining grows linearly. Linear probing follows about (1 + 1/(1 - a)^2) / 2, because occupied positions merge into long runs (**primary clustering**): a key that lands anywhere in a run has to walk to its end, and makes it longer.

## What the tests prove

- **Property tests** run 20,000 random operations per seed on our map and on the map of the language, and compare every answer. A weak hash (`key % 4`) forces collisions on almost every operation.
- **Resize**: the load factor never passes the limit during 10,000 insertions.
- **Tombstones**: with three colliding keys, a `get` after delete-then-insert returns the right value.

## What the benchmark shows

`bun run bench -- --project hash-map` builds tables at loads 0.25, 0.5, 0.75 and 0.9 with 200,000 keys and times 400,000 lookups, half of them for missing keys. The committed table is [results/results.md](../../../projects/data-structures/hash-map/results/results.md).

In the committed run, the lookups of linear probing at load 0.9 took between 3 and 4.5 times longer than at load 0.5 in all three languages, while chaining stayed within the noise of the machine. Differences smaller than the standard deviation, which is large below load 0.75 on a shared machine, are not conclusions. At low loads the larger table costs more cache misses, which is why "emptier" is not always faster.

## Run it

```sh
cd projects/data-structures/hash-map
./setup-unix-hash-map.sh          # or ./setup-windows-hash-map.ps1
```
