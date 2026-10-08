# Results: bpe-tokenizer (TypeScript)

Generated with `docker compose run --rm ts-demo`. Every number is a count, so the file is the same on any machine.
Corpus: `data/corpus.txt` (3196 bytes). Sample: `data/sample.txt` (227 bytes, not part of the corpus).

## Vocabulary size against number of tokens

| Merges | Vocabulary size | Tokens of the sample | Bytes per token | Tokens of the corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1.00 | 3196 |
| 10 | 266 | 196 | 1.16 | 2581 |
| 25 | 281 | 164 | 1.38 | 2201 |
| 50 | 306 | 147 | 1.54 | 1847 |
| 100 | 356 | 119 | 1.91 | 1482 |
| 200 | 456 | 106 | 2.14 | 1107 |
| 300 | 556 | 95 | 2.39 | 896 |

## The first 15 merges

| # | New id | Left | Right | New token | Times seen |
| ---: | ---: | --- | --- | --- | ---: |
| 1 | 256 | `"e"` | `" "` | `"e "` | 106 |
| 2 | 257 | `"s"` | `" "` | `"s "` | 87 |
| 3 | 258 | `"t"` | `"o"` | `"to"` | 77 |
| 4 | 259 | `"e"` | `"n"` | `"en"` | 71 |
| 5 | 260 | `"k"` | `"en"` | `"ken"` | 52 |
| 6 | 261 | `"to"` | `"ken"` | `"token"` | 52 |
| 7 | 262 | `"o"` | `" "` | `"o "` | 49 |
| 8 | 263 | `"t"` | `"e"` | `"te"` | 43 |
| 9 | 264 | `"h"` | `"e "` | `"he "` | 42 |
| 10 | 265 | `"r"` | `" "` | `"r "` | 36 |
| 11 | 266 | `"a"` | `" "` | `"a "` | 34 |
| 12 | 267 | `"t"` | `" "` | `"t "` | 33 |
| 13 | 268 | `"."` | `"\n"` | `".\n"` | 30 |
| 14 | 269 | `"m"` | `" "` | `"m "` | 28 |
| 15 | 270 | `"t"` | `"he "` | `"the "` | 28 |

## The tokens of one sentence

```text
text:       "The tokenizer reads ação, função and 🙂."
characters: 39   bytes: 46   tokens: 11
vocabulary: 556 (256 bytes + 300 merges)

   id  bytes                 text
  293  54 68 65 20           "The "
  332  74 6f 6b 65 6e 69 7a 65 72 20  "tokenizer "
  552  72 65 61 64 73 20     "reads "
  451  61 c3 a7 c3 a3 6f     "ação"
  287  2c 20                 ", "
  386  66 75 6e              "fun"
  307  c3 a7                 "ç"
  309  c3 a3 6f 20           "ão "
  303  61 6e 64 20           "and "
  513  f0 9f 99 82           "🙂"
   46  2e                    "."

boundaries: The |tokenizer |reads |ação|, |fun|ç|ão |and |🙂|.
ids:        293 332 552 451 287 386 307 309 303 513 46
round trip: decode(encode(text)) == text
```
