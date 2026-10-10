# LRU cache, Bloom filter and trie

> Versão em português: [docs/pt/data-structures/lru-bloom-trie.md](../../pt/data-structures/lru-bloom-trie.md) · Versión en español: [docs/es/data-structures/lru-bloom-trie.md](../../es/data-structures/lru-bloom-trie.md)

Mini-project: [projects/data-structures/lru-bloom-trie](../../../projects/data-structures/lru-bloom-trie). Languages: TypeScript, Go. Quiz topics: `data-structures` / `arrays-and-lists`, `hash-tables`, `binary-trees-and-traversals`.

Three structures, each one the standard answer to a question that real systems ask all the time.

| Question | Structure | Cost |
| --- | --- | --- |
| The cache is full. What do I throw away? | LRU cache | O(1) per `get` and `put` |
| Is this key certainly absent, so that I can skip the expensive lookup? | Bloom filter | O(k) per operation, a few bits per key |
| Which words start with these letters? | Trie | O(length of the prefix + size of the answer) |

## LRU cache

LRU means least recently used: when the cache is full, the entry that has gone longest without being read or written is evicted. Two structures are combined:

```text
hash map:   key -> node                     (finds a node in O(1))

list:       newest <-> ... <-> ... <-> oldest
            every get or put moves its node to the front
            eviction removes the node at the back
```

The list has to be **doubly** linked. A `get` reaches a node in the middle of the list through the map and has to unlink it. Unlinking needs the predecessor of the node, and only a `previous` pointer gives it without walking the list. With a singly linked list, `get` would be O(n).

The TypeScript version keeps explicit `newest` and `oldest` ends. The Go version closes the list into a ring with a sentinel node, which removes the special cases of the first and last node. Both pass the same property test against a reference model.

## Bloom filter

A Bloom filter is a set that stores no keys, only an array of m bits.

- `add(key)`: k hash functions choose k positions, and those bits are set to 1.
- `mightContain(key)`: the same k positions are read. Any 0 means **definitely not added**. All 1 means **probably added**.

Bits are never cleared, so a key that was added is always reported: there are **no false negatives**. A key that was never added may find its k bits set by other keys: that is a **false positive**, and its probability after n keys is

```text
p = (1 - e^(-k n / m))^k
```

For a wanted rate p, the best size is m = -n ln p / (ln 2)^2 bits and the best number of hashes is k = (m / n) ln 2. About 10 bits per key and 7 hashes give 1%.

The k positions come from two hashes combined as h1 + i * h2 (double hashing), which behaves like k independent functions.

Typical use: in front of something expensive, such as a disk read or a network call. If the filter says "no", the expensive step is skipped with certainty. If it says "yes", the real lookup runs and settles the question.

Measured in the committed run (200,000 probes that were never added):

| Bits | Hashes | Keys | Theory | Measured (Go) | Measured (TypeScript) | False negatives |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 200,000 | 7 | 20,000 | 0.82% | 0.81% | 0.83% | 0 |
| 100,000 | 3 | 10,000 | 1.74% | 1.75% | 1.71% | 0 |
| 64,000 | 2 | 16,000 | 15.48% | 15.52% | 15.60% | 0 |
| 150,000 | 5 | 30,000 | 10.09% | 10.11% | 10.27% | 0 |

## Trie

A trie is a tree in which each edge is one character, so each path from the root spells a prefix.

```text
(root)
  c
  └─ a
     ├─ r *          car
     │  ├─ d *       card
     │  └─ e *       care
     └─ t *          cat

* marks the end of a word
```

Words with a common start share their first nodes. To list every word with a prefix, the search walks down the characters of the prefix and then collects the subtree below, depth first. The cost is the length of the prefix plus the size of the answer, whatever the number of stored words. A linear filter has to look at every word.

A node can be the end of a word and the middle of longer ones ("car" inside "card"), so the end of a word is an explicit flag.

## What the tests prove

- **LRU**: the eviction order matches a reference model after every one of 40,000 random operations (capacities 1 to 8).
- **Bloom filter**: no false negative, and the measured false-positive rate is within 20% of the formula in four configurations.
- **Trie**: over 100,000 words, prefix search returns the same set as a linear filter for 305 prefixes.

## Run it

```sh
cd projects/data-structures/lru-bloom-trie
./setup-unix-lru-bloom-trie.sh          # or ./setup-windows-lru-bloom-trie.ps1
docker compose run --rm go-test lbt_demo
```
