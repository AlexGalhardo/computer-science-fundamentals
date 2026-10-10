# embeddings-vector-search

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

It teaches **how meaning becomes a vector and how similar vectors are found**. Word vectors are built by counting which words appear near each other in a corpus generated for the project, with no neural network. The nearest neighbours of a word turn out to be the words of its group. A brute-force search is compared with a random-plane index (LSH) that makes far fewer comparisons and is sometimes wrong. And a question retrieves the passages most likely to answer it, which is the search step of RAG.

Full explanation: [docs/en/artificial-intelligence/embeddings-vector-search.md](../../../docs/en/artificial-intelligence/embeddings-vector-search.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `embeddings`: the distributional hypothesis, co-occurrence counts, PPMI weighting, a word as a row of numbers, cosine similarity, nearest neighbours, brute force against an approximate index, recall (how often the index finds the true nearest vector).
- `artificial-intelligence` / `linear-algebra`: dot product, norm, normalising a vector to length 1, cosine similarity as a dot product, a search as one matrix-vector product.
- `artificial-intelligence` / `using-llms`: the retrieval step of RAG, embedding a question and the passages in the same way, top-k passages by score, what an unknown word does to the search.

## Run

The only requirement is Docker.

```sh
./setup-unix-embeddings-vector-search.sh        # Linux and macOS
./setup-windows-embeddings-vector-search.ps1    # Windows
```

The script builds both images, runs the tests, runs the two demos and retrieves the passages for one question.

## Structure

| Path | What it is |
| --- | --- |
| `data/corpus.txt` | 2400 short sentences written by the seeded generator, about 8 groups of 10 words (animals, foods, vehicles, colours, weather, instruments, devices, professions) |
| `data/groups.json` | the 80 test words and their groups. Only the tests and the demo read it, never the code that builds the vectors |
| `data/passages.json` | 30 short passages written by hand for the retrieval demo |
| `data/questions.json` | 10 demo questions with the passage each one should retrieve |
| `data/queries.txt` | 400 new generated sentences, the queries of the search experiment |
| `data/expected.json` | the neighbours, the comparisons table and the retrieved passages that both implementations must reproduce |
| `ts/src/generate-corpus.ts` | the generator of `corpus.txt`, `queries.txt` and `groups.json` |
| `ts/src/rng.ts` | the seeded random generator (mulberry32), written by hand |
| `ts/src/embeddings.ts` | co-occurrence counts, PPMI, cosine, nearest neighbours |
| `ts/src/search.ts` | brute force and the random-plane index |
| `ts/src/retrieval.ts` | a text as the weighted average of its word vectors, and the ranking of the passages |
| `ts/src/experiments.ts`, `ts/src/demo.ts` | the three experiments and the tables of `results/results-ts.md` |
| `ts/src/cli.ts` | prints the passages retrieved for a question |
| `python/*.py` | the same modules in Python with NumPy, writing `results/results-python.md` |
| `results/` | committed results of both languages |

TypeScript is the reference implementation (`oven/bun:1.4.2`, no dependencies): every dot product is a visible loop. Python (`python:3.14.8-slim-trixie` with `numpy==2.5.3`) is here because the lesson changes: the same search is **one matrix-vector product**, `vectors @ query`, and the truth for all 400 queries is one matrix product, `queries @ vectors.T`. That line is what a vector database runs for an exact search, and it explains why brute force stays competitive for longer than the comparison counts suggest.

Getting the same tables in two languages needs every random choice to be reproducible in both. The built-in random generators differ, so `rng.ts` and `rng.py` implement the same 32-bit generator, and the planes use only additions (no `log` or `cos`, whose last digit may differ between languages).

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

The Python service also runs `ruff check` and `ruff format --check`. Each suite has tests named after the acceptance criteria (`MP-AI-3.1`, `MP-AI-3.2`, `MP-AI-3.3`) and compares its neighbours, its comparisons table and its retrieved passages with `data/expected.json`, which is how "the same in both languages" is verified. The TypeScript suite also checks that the generator still writes the committed corpus byte for byte.

## Demo

One command prints the passages retrieved for a question:

```sh
docker compose run --rm ts-search "Which animal guards the farm at night?"
docker compose run --rm python-search "Which animal guards the farm at night?"
```

```text
question: "Which animal guards the farm at night?"
words used: guards farm night
not in the vocabulary: animal
compared with 30 passages by brute force

1. score 0.666  p01  The farm dog
   A farm dog sleeps lightly beside the barn. At night it guards the yard and barks when a fox comes near the hens. In the morning the farmer rewards it with a bone.
2. score 0.315  p08  Night trains
   A night train crosses the country while its passengers sleep in narrow beds. It stops at small stations in the dark, and the engine is changed at the border before sunrise.
3. score 0.282  p15  The first snow
   The first snow of winter usually falls at night and melts by noon. Real cold comes later, when frost hardens the ground and the snow stays on the hills for weeks.
```

A question that shares no content word with the passages it finds works only through the word vectors ("drizzle" and "hail" are near "rain" and "snow"):

```text
question: "Will drizzle or hail come tomorrow?"
words used: drizzle hail
not in the vocabulary: come tomorrow
compared with 30 passages by brute force

1. score 0.558  p13  A summer storm
2. score 0.382  p14  Morning fog
3. score 0.361  p15  The first snow
```

The three tables come from the demos:

```sh
docker compose run --rm ts-demo        # writes results/results-ts.md
docker compose run --rm python-demo    # writes results/results-python.md
```

**Word vectors (MP-AI-3.1).** The 5 nearest neighbours of one word of each group, by cosine similarity:

| Word | Group | 5 nearest neighbours (cosine similarity) |
| --- | --- | --- |
| dog | animals | wolf 0.689, cat 0.674, cow 0.669, rabbit 0.640, deer 0.631 |
| bread | foods | stew 0.657, cake 0.611, rice 0.611, pasta 0.599, soup 0.577 |
| car | vehicles | ship 0.715, tram 0.667, van 0.653, truck 0.643, plane 0.624 |
| red | colours | purple 0.729, yellow 0.724, blue 0.716, black 0.707, pink 0.703 |
| rain | weather | thunder 0.793, sunshine 0.779, drizzle 0.749, hail 0.745, fog 0.650 |
| piano | instruments | harp 0.596, flute 0.561, organ 0.542, cello 0.532, trumpet 0.506 |
| laptop | devices | monitor 0.565, keyboard 0.550, server 0.549, tablet 0.531, phone 0.529 |
| doctor | professions | plumber 0.708, nurse 0.646, lawyer 0.643, engineer 0.625, teacher 0.619 |

Over the 80 test words, 99.8% of the 5 nearest neighbours belong to the group of the word (399 of 400, and 79 words have all 5 in their group). The one outsider is "behind" as the fifth neighbour of "rabbit": the corpus uses "behind" only in sentences about animals. The vocabulary has 760 words, and the neighbours are searched among all of them, not only among the test words.

| Weighting | Mean cosine, same group | Mean cosine, different groups | Gap |
| --- | ---: | ---: | ---: |
| raw counts | 0.964 | 0.820 | 0.144 |
| PPMI | 0.650 | 0.031 | 0.619 |

With raw counts, two words of different groups still have a cosine of 0.82, because every row is dominated by the same frequent columns ("the", "a", "and"). PPMI brings unrelated words down to 0.03.

**Brute force against the index (MP-AI-3.2).** Indexed: the 1927 sentences of the corpus with distinct content words, one vector of 760 numbers each. Queries: the 400 sentences of `data/queries.txt`, none of them in the corpus.

| Search | Tables | Bits | Probing | Same top result as brute force | Vectors compared (average) | Plane dot products | Total | Share of brute force |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| brute force | - | - | - | 100.0% | 1927 | 0 | 1927 | 100.0% |
| index | 1 | 12 | no | 37.0% | 9.8 | 12 | 21.8 | 1.1% |
| index | 4 | 12 | no | 82.8% | 51.5 | 48 | 99.5 | 5.2% |
| index | 8 | 12 | no | 94.3% | 84.4 | 96 | 180.4 | 9.4% |
| index | 8 | 10 | no | 97.3% | 117.1 | 80 | 197.1 | 10.2% |
| index | 2 | 10 | 1 bit | 94.3% | 113.1 | 20 | 133.1 | 6.9% |
| **index (chosen)** | 4 | 12 | 1 bit | 98.5% | 172.5 | 48 | 220.5 | 11.4% |
| index | 8 | 12 | 1 bit | 100.0% | 250.1 | 96 | 346.1 | 18.0% |

The chosen setting returns the same top result as brute force in 98.5% of the queries with 11.4% of the dot products. The fastest setting does 1.1% of the work and is right only 37.0% of the time. "Plane dot products" is the cost of computing the bucket keys of the query, which an honest count must include.

**Retrieval (MP-AI-3.3).** All 10 demo questions of `data/questions.json` retrieve the expected passage first. The full table, with the three passages and the scores of each question, is in [`results/results-ts.md`](results/results-ts.md).

There is no dashboard: the tables in [`results/`](results/) are the result. The two languages wrote the same tables.

## Limits

- The corpus is generated from templates, so its groups are much cleaner than in real text. That is why 99.8% of the neighbours are right, and why even raw counts rank the neighbours well here (100.0%). What raw counts lose is the contrast between related and unrelated words, shown in the second table.
- A text vector is an average, so word order is lost: "the dog chased the cat" and "the cat chased the dog" get the same vector.
- A word outside the vocabulary is ignored, and so is every form the corpus never showed. The question "Why does the sea rise and fall?" retrieves "The street band" first and the right passage, "Tides", second: the passage says "rises" and "falls", which are different words for a model with no notion of word forms, while "fall" appears in the wrong passage.
- The idf weights are counted on 2492 sentences, too few to recognise function words, so a stop list of 90 words is used when a text is embedded.
- Each word vector has 760 numbers, one per word of the vocabulary, and most of them are zero. Real embeddings are dense and short (hundreds of numbers), produced by a trained model.
- 1927 vectors is small. At this size brute force is fast enough and no index is needed. The index is shown because the cost of brute force grows with the number of vectors, and at millions of vectors it matters. Real systems use better indexes than random planes (HNSW graphs, inverted files with quantisation).
- The agreement and the comparison counts depend on the seed of the planes. The committed seed is 42. Five other seeds, tried by hand and not part of the test suite, gave 99.0% to 99.8% agreement for the chosen setting, with 132 to 167 vectors compared on average.
