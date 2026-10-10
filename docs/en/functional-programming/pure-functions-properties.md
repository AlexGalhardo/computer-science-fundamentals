# Pure functions and property-based tests

> Versão em português: [docs/pt/functional-programming/pure-functions-properties.md](../../pt/functional-programming/pure-functions-properties.md) · Versión en español: [docs/es/functional-programming/pure-functions-properties.md](../../es/functional-programming/pure-functions-properties.md)

Mini-project MP-FP-1, in [`projects/functional-programming/pure-functions-properties`](../../../projects/functional-programming/pure-functions-properties). It teaches why pure code is easy to test and what property-based tests find. Languages: TypeScript and Elixir.

## Two versions of one rule

The rule: add up the items of an order and apply the coupon if it has not expired.

The impure version asks the system what time it is and keeps a counter of receipts outside the function. It has a **hidden input** (the clock) and a **hidden output** (the counter). The same order, priced twice, gives two different results, and a test of "an expired coupon gives no discount" would have to replace the clock.

The pure version takes the instant as a second argument:

```ts
priceOrder(order, now) // { subtotalCents, discountCents, totalCents }
```

Everything it needs comes in through the arguments and everything it does is in the return value. Its tests build values, call the function and compare, with no mock. The reading of the real clock is moved to `checkoutNow`, a three-line function at the edge of the program: the imperative shell around a functional core.

In Elixir the hidden counter lives in the process dictionary, the closest thing the language has to a mutable global. The pure version uses two function clauses and a guard instead of an `if`: one clause matches a coupon that is still valid, the other catches everything else, including no coupon.

## What a property is

An example test says "for this input, I expect this output". A property says "for every input, this rule holds", and a tool checks it with hundreds of generated inputs. Three kinds of rule appear here:

| Kind | Rule | Where |
| --- | --- | --- |
| Round trip | `decode(encode(text)) == text` | `codec` |
| Idempotence | `normalize(normalize(name)) == normalize(name)` | `normalize` |
| Invariant | `0 <= discount <= subtotal` and `total == subtotal - discount` | `checkout` |
| Invariant | the full report adds up to the paid lines | `pipeline` |

None of these rules needs the expected output to be known in advance. That is what lets the inputs be random.

## The library, in three parts

The stack of the repository has no property-testing library, so the mini-project writes a small one (`prop.ts`, `prop.ex`). It is short enough to read in one sitting.

**A pure random generator.** The state of the generator is one 32-bit number, the seed. `randomInt(seed, min, max)` returns the number and the next seed. Nothing is stored anywhere, so the same seed replays exactly the same run. This is the standard way of keeping randomness out of the impure part of a program.

**Generators that know how to shrink.** A generator is two functions: `generate(seed)` produces a value, and `shrink(value)` lists simpler versions of it, the simplest first. Integers shrink towards zero by halving the distance. Lists shrink by dropping halves, then single elements, then by shrinking one element. Tuples shrink one position at a time.

**The `check` loop.** It generates values until one makes the property false. Then it shrinks: it takes the first simpler candidate that still fails and starts again from it, until no candidate fails. What is left is a local minimum, usually the smallest input a person would have written.

Shrinking runs the property many more times, on inputs chosen after the failure. It works only because the property is pure: a second run on the same input cannot give another answer.

## The seeded bug

The codec is run-length encoding: `aaabcc` becomes `3a1b2c`. The buggy decoder reads the count with `\d` instead of `\d+`.

The five examples pass against the buggy decoder. They are the examples a person writes: short strings, a single character, the empty string, nine equal characters. None has a run of ten.

The round-trip property fails:

```text
original counterexample: "aaaaaaaaaccccccccbbbbbbbbbb"
shrunk in 6 steps to:   "aaaaaaaaaa"
encode -> "10a", buggy decode -> ""
```

The shrunk counterexample, ten times `a`, points straight at the cause: something goes wrong when the count needs two digits.

### The generator matters

A string of random letters almost never contains ten equal letters in a row. With an alphabet of three letters the chance at a given position is about 1 in 20,000. A property fed with such strings would pass and prove nothing.

The generator used here, `runString`, builds a string out of runs: it draws a letter and a length from 1 to 12, several times. Long runs are then common. Choosing what the generator produces is part of writing the property, in the same way that choosing the examples is part of writing an example test.

## Composition and the pipeline

The sales report is five steps: keep the paid orders, compute the total of each line, add the totals by category, rank them, take the first three.

In Elixir the pipe operator writes them in the order in which they happen:

```elixir
orders
|> only_status("paid")
|> line_totals()
|> totals_by_category()
|> ranked()
|> Enum.take(top)
```

TypeScript has no pipe operator, so the mini-project defines a `pipe` function, which is a reduction over a list of functions:

```ts
pipe(onlyStatus("paid"), lineTotals, totalsByCategory, ranked, take(top))
```

`onlyStatus("paid")` and `take(top)` are curried: the first call fixes a setting and returns the one-argument function that fits in the chain. The type of `pipe` requires the output of each step to be the input of the next, so a step in the wrong place is a compile error.

Both implementations read the same orders and the same expected report from `cases.json`. Two categories tie at 6000 cents, and the ranking breaks the tie by name so that the result does not depend on the order of the input.

## What to try

- Change `\d` to `\d+` in the buggy decoder and run the demo again: the property passes.
- Replace `runString("abc", 6, 12)` by `runString("abc", 1, 9)`, a single run of at most 9 characters: the property passes against the buggy decoder, because the generator can no longer build the failing input.
- Remove the tie-break from `ranked` and see which test notices.
- Run `check` with another seed and compare the original counterexample and the shrunk one.

## Limits

The library is a teaching version. It has no size parameter that grows with the run, no generator combinators such as `map` and `filter` with shrinking through them, and its string shrinking has one candidate written for this codec (replacing every occurrence of a letter by the first letter of the alphabet). Real projects should use fast-check in TypeScript or StreamData in Elixir.

## Related quiz topics

Area `functional-programming`: `pure-functions`, `higher-order-functions`, `composition-currying`, `side-effects`, `elixir-typescript-style`.
