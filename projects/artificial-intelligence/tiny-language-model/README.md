# tiny-language-model

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

It teaches **how a language model predicts the next token, from counting to self-attention**. Two models learn the same small text, character by character. The first is a bigram table made by counting. The second is a decoder-only transformer whose forward pass and backpropagation are written by hand with NumPy, with no deep-learning framework. On text neither of them trained on, the transformer has a loss of 0.662 against 1.741 for the bigram, and the demo shows why: it uses clues that sit several characters back. The same trained model is then sampled with greedy decoding, temperature, top-k and top-p, and a table measures how each setting changes the entropy and the variety of what it writes.

Full explanation: [docs/en/artificial-intelligence/tiny-language-model.md](../../../docs/en/artificial-intelligence/tiny-language-model.md).

## Quiz topics it demonstrates

- `artificial-intelligence` / `language-models`: next-token prediction, the bigram model made by counting, cross-entropy and perplexity on held-out text, the generation loop, sampling with greedy decoding, temperature, top-k and top-p.
- `artificial-intelligence` / `attention-transformer`: query, key and value, softmax weights, the causal mask, position embeddings, multi-head attention, the structure of a block (attention, MLP, residual connections, layer normalisation).
- `artificial-intelligence` / `probability-statistics`: a row of counts turned into a probability distribution, softmax, cross-entropy, entropy in bits, drawing a sample with a seeded generator.
- `artificial-intelligence` / `training`: backpropagation by the chain rule, the gradient check with centred differences, the Adam optimiser, mini-batches, training loss against held-out loss.

## Run

The only requirement is Docker.

```sh
./setup-unix-tiny-language-model.sh        # Linux and macOS
./setup-windows-tiny-language-model.ps1    # Windows
```

The script builds the image, runs the tests, then runs the demo, which trains both models and rewrites `results/`. Nothing is downloaded at run time and the containers have no network.

## Structure

| Path | What it is |
| --- | --- |
| `python/corpus.py` | the seeded generator of the text, the split into training and held-out lines, the character vocabulary, and `line_kind`, which says whether a line obeys the grammar |
| `python/bigram.py` | the bigram model: counts, add-one smoothing, loss, perplexity, sampling |
| `python/transformer.py` | the transformer: forward pass, backward pass by hand, cross-entropy, Adam, the training loop |
| `python/sampling.py` | temperature, top-k, top-p, greedy, entropy, and the generation loop |
| `python/experiment.py` | the one experiment shared by the tests and the demo: seeds, sizes, the probes, the sampling table, the attention example |
| `python/svg.py` | the loss curve and the attention heat map, written as SVG text |
| `python/demo.py` | prints the tables and writes `results/` |
| `python/test_*.py`, `python/conftest.py` | the tests. The model is trained once per test run |
| `results/` | committed output of the demo: `results.md`, `loss-curve.svg`, `attention.svg` |

Python only (`python:3.14.8-slim-trixie`), with one dependency, `numpy==2.5.3`. No PyTorch and no TensorFlow: writing attention and its gradient by hand is the lesson. Nothing is imported from another mini-project. The tokens are single characters: cutting text into bigger tokens is the subject of [bpe-tokenizer](../bpe-tokenizer/).

Decisions worth knowing:

- **The text is generated**, by a small grammar with four kinds of line, each one hiding a clue several characters back: `ana has a cat. she likes it.` (the pronoun depends on the name), `the red cats see a dog.` (the verb agrees with the subject), `tom says 4+5=9.` (the digit depends on both numbers) and `([x]y){z}` (the closing bracket must match). Without such clues a transformer could not beat a bigram.
- **Held-out lines are never training lines.** The generator keeps a line only the first time it draws it, so the 2400 lines are all different. They are shuffled and the last 240 are held out. A test checks that the two sets do not intersect.
- **Pre-norm** blocks (layer normalisation before attention and before the MLP), ReLU in the MLP, learned position embeddings, no dropout.
- **Sizes**: context of 32 characters, d_model 48, 4 heads, 2 blocks, 62 253 parameters, float32. Adam for 1000 steps with batches of 32 windows.
- **One BLAS thread** (`OPENBLAS_NUM_THREADS=1` in the Dockerfile): the matrices are tiny, more threads only slow them down, and the result is the same on every run.

## Tests

```sh
docker compose run --rm python-test
```

It runs `ruff check`, `ruff format --check` and 53 tests, in about half a minute. The model is trained once, by the same function and seed as the demo. Each acceptance criterion has its tests:

| Criterion | Test | What it measures |
| --- | --- | --- |
| MP-AI-4.1 | `test_every_row_is_a_probability_distribution`, `test_sampling_is_reproducible_with_a_fixed_seed` | every row of the bigram table sums to 1, and the same seed writes the same text |
| MP-AI-4.2 | `test_the_transformer_beats_the_bigram_on_heldout_text`, `test_no_heldout_line_is_a_training_line` | held-out loss 0.662 against 1.741, required to be at least 0.5 nat lower |
| MP-AI-4.2 | `test_backpropagation_matches_the_numerical_gradient` | the hand-written gradient of every parameter group agrees with centred differences in float64 (relative error below 1e-6) |
| MP-AI-4.3 | `test_lower_temperature_gives_less_varied_output`, `test_top_k_and_top_p_lower_the_entropy_of_plain_sampling` | the entropy of the samples falls with the temperature, and top-k and top-p lower it |
| MP-AI-4.4 | `test_the_demo_writes_the_results` | the demo writes the table and both figures |

Other tests cover the causal mask (changing the last token changes no earlier prediction, and the upper triangle of the attention weights is exactly zero), position embeddings, Adam, the grammar checker and the worked examples of the docs.

## Demo

```sh
docker compose run --rm python-demo    # writes results/results.md and two SVG figures
```

The output below is copied from [`results/results.md`](results/results.md).

**Loss on held-out text**, cross-entropy in nats, lower is better:

| Model | Context it sees | Train loss | Held-out loss | Held-out perplexity |
| --- | --- | ---: | ---: | ---: |
| Uniform guess, ln(45) | nothing |  | 3.807 | 45.00 |
| Bigram (counting) | 1 character | 1.730 | 1.741 | 5.70 |
| Transformer | up to 32 characters | 0.640 | 0.662 | 1.94 |

![Loss curve](results/loss-curve.svg)

**What the context buys.** The probability each model gives to the character the grammar demands next (`_` is a space):

| Context | Right next | Wrong next | Bigram: P(right) | Bigram: P(wrong) | Transformer: P(right) | Transformer: P(wrong) |
| --- | :---: | :---: | ---: | ---: | ---: | ---: |
| `ana_has_a_cat._` | `s` | `h` | 0.141 | 0.077 | 0.982 | 0.011 |
| `leo_has_a_cat._` | `h` | `s` | 0.077 | 0.141 | 0.980 | 0.014 |
| `the_old_dogs_see` | `_` | `s` | 0.395 | 0.099 | 0.999 | 0.000 |
| `the_old_dog_see` | `s` | `_` | 0.099 | 0.395 | 0.998 | 0.001 |
| `tom_says_4+5=` | `9` | `1` | 0.091 | 0.417 | 0.433 | 0.410 |
| `tom_says_7+8=1` | `5` | `.` | 0.051 | 0.110 | 0.350 | 0.000 |
| `{[x]` | `}` | `]` | 0.065 | 0.100 | 0.210 | 0.005 |
| `[{x}` | `]` | `}` | 0.113 | 0.099 | 0.327 | 0.009 |

The bigram gives the same numbers to "ana" and to "leo": it only sees the space. The transformer is nearly certain about the pronoun and the agreement, and almost never closes a bracket with the wrong kind (after `{[x]` it may also continue with a letter or open another bracket, so 0.210 for `}` is not a mistake). The sums are the rule it has only half learned.

**Sampling controls**, 100 lines per setting, same seed:

| Setting | Mean entropy (bits) | Distinct lines of 100 | Grammatical lines of 100 | First line written |
| --- | ---: | ---: | ---: | --- |
| greedy | 0.000 | 1 | 100 | `the new cat sees a cup.` |
| temperature 0.2 | 0.304 | 66 | 100 | `the old cups see a cup.` |
| temperature 0.5 | 0.520 | 97 | 95 | `the old bags see a cat.` |
| temperature 1.0 | 0.856 | 99 | 73 | `ana says 5+8=14.` |
| temperature 1.5 | 1.464 | 100 | 38 | `[9=1ups find a k map.` |
| temperature 1.0, top-k 3 | 0.380 | 86 | 85 | `leo says 4+9=14.` |
| temperature 1.0, top-p 0.9 | 0.751 | 99 | 87 | `[[x[y]{zx}x]}x` |
| temperature 1.5, top-k 3 | 0.464 | 92 | 72 | `leo says 4+9=14.` |
| temperature 1.5, top-p 0.9 | 1.039 | 99 | 67 | `[[x(y){z(yzyy)}]` |

Mean entropy is the entropy of the distribution each character was really drawn from. Lower temperature, lower entropy, fewer different lines, and more of them correct. Greedy writes the same line 100 times. For comparison, the bigram table writes lines such as `likeog w cu2+8=6it.`, and none of its 100 lines is grammatical.

**Attention.** One head on the held-out line `the sad cups see a hat.`. The grey triangle is the causal mask. In the outlined row the model stands on the last letter of "see" and must decide whether an "s" follows. This head puts 0.98 of its weight on the "s" of "cups", four characters back:

![Attention map](results/attention.svg)

There is no dashboard: the tables and the two figures in [`results/`](results/) are the result.

## Limits

- The corpus is synthetic and tiny (47 kB, 45 characters), built to make context matter. The numbers say nothing about real language.
- The sums are only half learned in 1000 steps: after `4+5=` the model gives 0.433 to `9`, and 27 of the 100 lines written at temperature 1.0 break a rule. Longer training helps, but the test run would no longer fit in its time budget.
- Held-out lines are new combinations of words the model saw during training, not new words.
- The losses come from float32 training. On the same machine a rerun gives the same file. On another processor the last decimals may differ, which is why the tests use margins and not exact values.
- The held-out text is scored in consecutive windows of 32 characters, so the first characters of each window are predicted with little context. This makes the transformer look slightly worse than it is.
- No key-value cache: generation runs the whole window again for every new character. No dropout, no weight decay, no learning-rate warm-up, no weight tying.
- The brief asked for a module-scoped training fixture. It is session-scoped here, so the model is trained once for all the test files and not once per file.
