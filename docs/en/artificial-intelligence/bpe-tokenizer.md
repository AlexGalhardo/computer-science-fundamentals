# BPE tokenizer

> Versão em português: [docs/pt/artificial-intelligence/bpe-tokenizer.md](../../pt/artificial-intelligence/bpe-tokenizer.md) · Versión en español: [docs/es/artificial-intelligence/bpe-tokenizer.md](../../es/artificial-intelligence/bpe-tokenizer.md)

Mini-project MP-AI-1, in [`projects/artificial-intelligence/bpe-tokenizer`](../../../projects/artificial-intelligence/bpe-tokenizer). It teaches how text becomes tokens, and why a model counts tokens and not words. The background is section 7 of [the area page](README.md#7-tokens-and-tokenisation).

## The problem

A neural network computes on numbers, so a text must become a list of integers. Giving one number to each word needs a huge vocabulary and still fails on a word it never saw. Giving one number to each character works for any text but makes the sequences very long. Byte-pair encoding sits in between: it starts from the smallest units and learns, from a corpus, which neighbours appear together so often that they deserve a token of their own.

## Text is bytes

The tokenizer never looks at letters. It reads the UTF-8 bytes of the text:

| Text | Characters | Bytes |
| --- | ---: | --- |
| `a` | 1 | `61` |
| `é` | 1 | `c3 a9` |
| `🙂` | 1 | `f0 9f 99 82` |

A byte has 256 values, so the base vocabulary has exactly 256 tokens, ids 0 to 255, and every possible text can be written with them. That is why the tests pass on Japanese, Russian, Greek and Hebrew text although the corpus has none.

## Training

```text
ids = the bytes of the corpus
repeat N times:
    count every pair of neighbours in ids
    take the most frequent pair (a, b)
    create a new token with the next free id
    replace every "a b" in ids by the new token
```

The first merges learned from `data/corpus.txt`:

| # | New id | Left | Right | New token | Times seen |
| ---: | ---: | --- | --- | --- | ---: |
| 1 | 256 | `"e"` | `" "` | `"e "` | 106 |
| 2 | 257 | `"s"` | `" "` | `"s "` | 87 |
| 3 | 258 | `"t"` | `"o"` | `"to"` | 77 |
| 4 | 259 | `"e"` | `"n"` | `"en"` | 71 |
| 5 | 260 | `"k"` | `"en"` | `"ken"` | 52 |
| 6 | 261 | `"to"` | `"ken"` | `"token"` | 52 |

Merge 5 uses the token created by merge 4, and merge 6 joins two merged tokens: after six steps the word that the corpus repeats most, "token", is a single token. Nobody told the algorithm what a word is. It found a frequent run of bytes.

Each merge adds one token, so **vocabulary size = 256 + number of merges**.

### The tie-break rule

When two pairs have the same count, some rule must choose. This project takes the pair with the smaller left id and then the smaller right id. The choice is arbitrary, but it has to be written down: the TypeScript and Python versions produce the same 300 merges only because they share this rule, and the tests compare both with `data/expected-merges.json`.

## Encoding and decoding

- **Encode**: turn the text into bytes and replay the merges in the order they were learned. The order matters, because merge 6 needs the tokens that merges 3 and 5 created.
- **Decode**: replace each id by its bytes, join them and read the result as UTF-8.

No information is lost in either direction, so `decode(encode(text)) == text` for any text. The tests check it on ASCII, on accented text, on emoji (including a family emoji made of several code points) and on scripts absent from the corpus.

A token is a run of bytes and may stop in the middle of a character. With few merges the four bytes of 🙂 are four tokens, and none of them is valid text by itself. The CLI prints such a token as `<f0>` instead of a broken character.

## Vocabulary size against number of tokens

The same texts encoded with the first N merges:

| Merges | Vocabulary size | Tokens of the sample | Bytes per token | Tokens of the corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1.00 | 3196 |
| 10 | 266 | 196 | 1.16 | 2581 |
| 25 | 281 | 164 | 1.38 | 2201 |
| 50 | 306 | 147 | 1.54 | 1847 |
| 100 | 356 | 119 | 1.91 | 1482 |
| 200 | 456 | 106 | 2.14 | 1107 |
| 300 | 556 | 95 | 2.39 | 896 |

Three things to read in it:

1. With no merges a token is a byte: 227 tokens for 227 bytes.
2. Every merge lowers the count or keeps it. More vocabulary means fewer tokens.
3. The corpus shrinks faster (to 28% of its bytes) than the sample (to 42%). The merges were chosen to compress the corpus, and they transfer only partly to a text the tokenizer did not train on. The same happens in real tokenizers with a language that was rare in their training data: the text costs more tokens.

## Why models count tokens

A model runs once for each token it reads and once for each token it writes, so the token is the unit of its work, of its limits and of its price. The demo sentence shows why counting words or characters would be the wrong measure:

```text
"The tokenizer reads ação, função and 🙂."
characters: 39   bytes: 46   tokens: 11   (words: 7)
boundaries: The |tokenizer |reads |ação|, |fun|ç|ão |and |🙂|.
```

"tokenizer " is one token because the corpus is full of it. "função" is three. In another tokenizer, trained on other text, the same sentence would have a different count.

## What a production tokenizer adds

- A corpus of gigabytes and tens of thousands of merges.
- A first split of the text into words and punctuation, so that a merge never crosses a word boundary.
- Special tokens that are not text, such as the marker of the end of a document.
- Faster data structures. The loop here recounts every pair at each step, which is fine for 3 kB.

## Run it

```sh
cd projects/artificial-intelligence/bpe-tokenizer
./setup-unix-bpe-tokenizer.sh
docker compose run --rm ts-cli "any sentence you like"
```
