# Mutation testing (MP-TEST-3)

> Versão em português: [docs/pt/testing/mutation-testing.md](../../pt/testing/mutation-testing.md)

Mini-project: [`projects/testing/mutation-testing`](../../../projects/testing/mutation-testing/README.md). Quiz topic: `coverage-mutation`.

## The concept

**Coverage** answers "which lines did the tests execute?". It does not answer "would the tests notice if this line were wrong?". A test with no assertion executes a line as well as the best test in the world.

**Mutation testing** asks the second question directly:

```
original program ---- mutate one token ----> mutant           (a + b  becomes  a - b)
                                                |
                                         run the test suite
                                                |
                       +------------------------+------------------------+
                       |                                                 |
              a test fails: KILLED                         every test passes: SURVIVED
           the suite noticed the bug                 the suite accepts the bug as correct
```

```
mutation score = killed mutants / all mutants
```

A mutant is a model of a real slip: a wrong operator, a boundary off by one, a wrong constant. A suite that kills most mutants would probably notice most slips of the same kind.

## What the mini-project shows

One module (`shipping.ts`, the price of a delivery) and two suites:

| | Weak suite | Strong suite |
| --- | --- | --- |
| Line coverage | 100% | 100% |
| Typical assertion | `typeof cents === "number"`, `toBeGreaterThan(0)` | `toBe(1700)`, values on each boundary |
| Mutants killed | 4 of 19 | 18 of 19 |
| Mutation score | 21.1% | 94.7% |

The coverage column is identical. The last line is not. That is the whole lesson: coverage is a necessary condition (a line never executed is certainly not tested) and not a sufficient one.

## Reading the survivors

Each surviving mutant is a question the suite did not ask. Three examples from the report:

| Mutant | Why the weak suite lets it live | The test that kills it |
| --- | --- | --- |
| `150` to `151` (price per kg) | the result is still a positive number | `expect(shippingCents(3 kg)).toBe(650)` |
| `>=` to `>` (distance 100 km) | no test uses exactly 100 km | a test at 99 km and one at 100 km |
| `<=` to `<` (30 kg limit) | no test uses exactly 30 kg | `isAccepted(30 kg)` is `true`, `isAccepted(30.5 kg)` is `false` |

Boundary mutants die only on the boundary value. Mutation testing and boundary-value analysis point at the same tests from two directions.

## The equivalent mutant

```ts
if (parcel.weightKg > FREE_WEIGHT_KG) {                       // mutant: >=
	cents = cents + (parcel.weightKg - FREE_WEIGHT_KG) * CENTS_PER_EXTRA_KG;
}
```

With `>=` the branch is also taken at exactly 2 kg, where it adds `(2 - 2) * 150 = 0`. The mutant is a different text with the same behaviour, so no test can kill it. Deciding whether a mutant is equivalent is undecidable in general, so tools report the raw score and people review the survivors. A target of 100% is therefore not always reachable, and chasing it blindly is as mistaken as chasing a coverage number.

## How the mutator works

`ts/src/mutator.ts`, about 100 lines, no dependency:

1. **Tokenize.** One regular expression splits the source into comments, strings, identifiers, numbers, operators and the rest. Longer tokens come first, so `>=` is one token.
2. **Mutate.** For each operator or number, produce one copy of the source with that single token replaced (`+` and `-` swapped, `<` to `<=`, `&&` and `||` swapped, `!` removed, `n` to `n + 1`).
3. **Run.** For each mutant, write the file into a scratch copy of the project and run one suite, with a time limit, because a mutant can create an endless loop.
4. **Count.** Exit code 0 means survived, anything else means killed.

Before any mutant, each suite runs on the original code: a suite that is already red would "kill" everything for the wrong reason.

## Cost and limits

- The cost is `mutants x time of the suite`. Here 19 mutants and a suite of milliseconds. In a real project there are thousands of mutants, so tools run only the tests that cover the mutated line, stop at the first failing test and mutate only changed code.
- This mutator works on tokens, not on the syntax tree. It cannot tell a generic `<T>` from a comparison. It has a handful of operators and none that removes a statement.
- A high score says the assertions are sensitive to small changes. It says nothing about missing requirements: code that was never written has no mutants.

## Run

```sh
./setup-unix-mutation-testing.sh        # Linux and macOS
./setup-windows-mutation-testing.ps1    # Windows
```
