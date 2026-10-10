# pure-functions-properties

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

The same small code base in TypeScript and Elixir. It teaches **why pure code is easy to test and what property-based tests find**: one rule written impure and pure, a property that catches a bug the example tests miss and shrinks it to the smallest input, and a pipeline built by composing pure functions.

Full explanation: [docs/en/functional-programming/pure-functions-properties.md](../../../docs/en/functional-programming/pure-functions-properties.md).

## The three lessons

1. **Impure and pure versions of the same rule** (`checkout`). The impure version reads the clock and keeps a hidden counter, so the same order gives different answers. The pure version receives the instant as an argument and is tested with plain values, with no mock.
2. **Properties** (`prop`, `codec`, `normalize`). A property is a rule that must hold for every input, checked with hundreds of generated inputs: round trip (`decode(encode(x)) == x`), idempotence (`normalize(normalize(x)) == normalize(x)`) and invariants (`0 <= discount <= subtotal`). The property-testing library is written here, in about 150 lines per language, with no dependency.
3. **Composition and pipelines** (`pipeline`). A sales report as five small steps, joined with a `pipe` function in TypeScript and with the `|>` operator in Elixir.

## The seeded bug and its shrunk counterexample

`decodeBuggy` (`decode_buggy` in Elixir) reads the run length with `\d` instead of `\d+`, so it understands only one digit. The five example tests in [`cases.json`](cases.json) pass against it, because no example has a run of 10 or more equal characters.

The round-trip property fails on it. With the default seed (42), both languages report the same thing:

```text
round trip, buggy decoder: FAILED on run 1 (seed 42)
  original counterexample: "aaaaaaaaaccccccccbbbbbbbbbb"
  shrunk in 6 steps to:   "aaaaaaaaaa"
  encode -> "10a", buggy decode -> ""
```

The shrunk counterexample is **`"aaaaaaaaaa"`**: ten times the letter `a`. It is the smallest input that shows the bug. Nine characters encode as `9a` and decode correctly; ten encode as `10a`, the buggy decoder reads the pair `0a`, and the text disappears. The 27-character string the generator found first says "something is wrong"; the 10-character one says what.

## Quiz topics it demonstrates

- `functional-programming` / `pure-functions`: purity, hidden inputs and outputs, why a pure function needs no mock, why a property-based test needs a pure function.
- `functional-programming` / `higher-order-functions`: `map`, `filter` and `reduce` as the steps of the pipeline and of the generators.
- `functional-programming` / `composition-currying`: `pipe`, the `|>` operator, curried steps such as `onlyStatus("paid")`, the types of the steps having to fit.
- `functional-programming` / `side-effects`: functional core and imperative shell, the clock as an argument, the random generator with explicit state (the seed).
- `functional-programming` / `elixir-typescript-style`: the same pipeline in both styles.

## Run

The only requirement is Docker.

```sh
./setup-unix-pure-functions-properties.sh        # Linux and macOS
./setup-windows-pure-functions-properties.ps1    # Windows
```

The script builds the two images, runs the tests of both languages and runs the demo of both.

## Demo

```sh
docker compose run --rm ts-demo
docker compose run --rm elixir-demo
```

Each demo prints the impure and the pure checkout side by side, the property finding the seeded bug with the original and the shrunk counterexample, and the sales report.

## Tests

```sh
docker compose run --rm ts-test        # 30 tests
docker compose run --rm elixir-test    # format check and 19 tests
```

The counts differ only because Bun reports each shared example as one test and the Elixir suite loops over them inside one test. Both suites read the examples and the expected results from the same [`cases.json`](cases.json) and have the same properties. TypeScript has one test more, "the input is not modified", which has no meaning in Elixir, where data cannot be modified.

## Structure

| Path | What it is |
| --- | --- |
| `cases.json` | Examples and expected results shared by both languages |
| `ts/src/prop.ts`, `elixir/lib/pure_functions_properties/prop.ex` | The property-testing library: pure random generator, generators with shrinking, `check` |
| `ts/src/codec.ts`, `elixir/lib/pure_functions_properties/codec.ex` | Run-length codec, with the correct decoder and the one with the seeded bug |
| `ts/src/checkout.ts`, `elixir/lib/pure_functions_properties/checkout.ex` | The impure version, the pure version and the imperative shell of the same rule |
| `ts/src/normalize.ts`, `elixir/lib/pure_functions_properties/normalize.ex` | An idempotent normaliser |
| `ts/src/pipeline.ts`, `elixir/lib/pure_functions_properties/pipeline.ex` | The sales report pipeline |
| `ts/src/cli.ts`, `elixir/lib/mix/tasks/demo.ex` | The demo |

## Notes

- The code marked `SEEDED BUG` and `IMPURE` is wrong or impure on purpose. It is there to be compared with the version next to it.
- There are no dependencies. The property-testing library is a teaching version: real projects should use fast-check (TypeScript) or StreamData (Elixir), which have many more generators and better shrinking.
- Both languages use the same random formula and draw in the same order, so the same seed gives the same inputs in both.
