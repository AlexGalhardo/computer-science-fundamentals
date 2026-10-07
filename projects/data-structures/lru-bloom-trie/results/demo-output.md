# Demo output

Output of `docker compose run --rm go-test lbt_demo`, committed as text (image `golang:1.27.1-bookworm`, 2026-10-07). The TypeScript demo (`docker compose run --rm ts-test bun run demo.ts`) prints the same LRU trace. Its Bloom filter and trie numbers differ slightly, because each language uses its own hash function and its own word generator.

```
== LRU cache, capacity 3 ==
put(a, 1)  stored             newest -> oldest: a
put(b, 2)  stored             newest -> oldest: b a
put(c, 3)  stored             newest -> oldest: c b a
get(a)     hit 1              newest -> oldest: a c b
put(d, 4)  stored, evicted b  newest -> oldest: d a c
get(b)     miss               newest -> oldest: d a c
put(e, 5)  stored, evicted c  newest -> oldest: e d a

== Bloom filter: measured against theoretical false-positive rate ==
bits      hashes  keys    bits/key  theory    measured  false negatives
200000    7       20000   10.0      0.82%     0.81%     0
100000    3       10000   10.0      1.74%     1.75%     0
64000     2       16000   4.0       15.48%    15.52%    0
150000    5       30000   5.0       10.09%    10.11%    0

== Trie: prefix search over 100,000 generated words ==
prefix "a": 8470 words (linear filter: 8470), first: aaa, aaaad, aaab, aaabfakai
prefix "ab": 677 words (linear filter: 677), first: aba, abaa, abaaafcfa, abaabba
prefix "abc": 68 words (linear filter: 68), first: abc, abcaaaklek, abcacgadie, abcad
prefix "abcd": 4 words (linear filter: 4), first: abcd, abcdb, abcdc, abcdkfefe
prefix "zz": 0 words (linear filter: 0), first: -
```

For comparison, the Bloom filter rows measured by the TypeScript demo in the same session were 0.83%, 1.71%, 15.60% and 10.27%, with 0 false negatives.
