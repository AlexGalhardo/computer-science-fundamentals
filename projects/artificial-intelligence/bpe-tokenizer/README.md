# bpe-tokenizer

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

It teaches **how text becomes tokens, and why a model counts tokens and not words**. A byte-pair encoding (BPE) tokenizer is trained on a small corpus written for the project, encodes and decodes any text without loss, shows the tokens of a sentence with their ids and boundaries, and tables how the number of tokens of the same text falls as the vocabulary grows.

Full explanation: [docs/en/artificial-intelligence/bpe-tokenizer.md](../../../docs/en/artificial-intelligence/bpe-tokenizer.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `tokenization`: what a token is, BPE training (count the pairs, merge the most frequent), vocabulary size = 256 bytes + merges, UTF-8 bytes as the base vocabulary, lossless encode and decode, more merges giving fewer tokens, tokens against words and characters.

## Run

The only requirement is Docker.

```sh
./setup-unix-bpe-tokenizer.sh        # Linux and macOS
./setup-windows-bpe-tokenizer.ps1    # Windows
```

The script builds both images, runs the tests, runs the two demos and shows the tokens of one sentence.

## Structure

| Path | What it is |
| --- | --- |
| `data/corpus.txt` | the training text, in English and Portuguese, written for this project |
| `data/sample.txt` | a text that is not in the corpus, used to count tokens |
| `data/expected-table.json`, `data/expected-merges.json` | the table and the merges both implementations must reproduce |
| `ts/src/bpe.ts` | the tokenizer: `train`, `encode`, `decode` |
| `ts/src/cli.ts` | shows the tokens of a sentence |
| `ts/src/demo.ts` | prints the tables and writes `results/results-ts.md` |
| `python/bpe.py`, `python/cli.py`, `python/demo.py` | the same in Python, writing `results/results-python.md` |
| `results/` | committed results of both languages |

TypeScript is the reference implementation (`oven/bun:1.4.2`). Python (`python:3.14.8-slim-trixie`) is here because the lesson changes: `bytes` is a built-in type, so "a token is a run of bytes" is visible in the code, and getting the same vocabulary in two languages shows that the algorithm is fully specified only when the tie-break rule is written down. Neither implementation has runtime dependencies.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

The Python service also runs `ruff check` and `ruff format --check`. Both suites check the round trip on ASCII, accented, emoji and never-seen text, and compare their table and their merges with the files in `data/`, which is how "identical in both languages" is verified.

## Demo

One command prints the tokens of a sentence:

```sh
docker compose run --rm ts-cli "The tokenizer reads ação, função and 🙂."
docker compose run --rm python-cli --merges 50 "The tokenizer reads ação, função and 🙂."
```

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

39 characters, 46 bytes, 11 tokens: three different counts for the same sentence. "ação" is in the corpus and became one token. "função" is not a frequent enough unit, so it is cut into three known pieces.

The table "vocabulary size against number of tokens" comes from the demos:

```sh
docker compose run --rm ts-demo        # writes results/results-ts.md
docker compose run --rm python-demo    # writes results/results-python.md
```

| Merges | Vocabulary size | Tokens of the sample | Bytes per token | Tokens of the corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1.00 | 3196 |
| 10 | 266 | 196 | 1.16 | 2581 |
| 25 | 281 | 164 | 1.38 | 2201 |
| 50 | 306 | 147 | 1.54 | 1847 |
| 100 | 356 | 119 | 1.91 | 1482 |
| 200 | 456 | 106 | 2.14 | 1107 |
| 300 | 556 | 95 | 2.39 | 896 |

There is no dashboard: the tables in [`results/`](results/) are the result, and they are counts, so they are the same on every machine.

## Limits

The corpus has about 3 kB, so the vocabulary is tiny and tuned to that text. A production tokenizer is trained on gigabytes, has tens of thousands of merges, splits the text into words before merging and adds special tokens such as the end-of-text marker. None of that changes the algorithm shown here.
