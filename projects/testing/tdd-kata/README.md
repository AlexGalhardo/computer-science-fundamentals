# tdd-kata

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

The multi-currency money kata, done with test-driven development, where the deliverable is the **git history**: 27 commits that alternate a failing test (red), the smallest change that makes it pass (green) and a clean-up with every test passing (refactor). The final code is about 90 lines. What is worth studying is the order in which they were written.

Code: MP-TEST-2. Full explanation: [docs/en/testing/tdd-kata.md](../../../docs/en/testing/tdd-kata.md).

## Quiz topics it demonstrates

- `testing` / `tdd-cycle`: red, green, refactor; fake it, triangulation and obvious implementation; the to-do list; small steps; refactoring only on a green bar
- `testing` / `unit-tests-isolation`: value objects and equality tested through the public interface

## The problem

Add amounts in different currencies and convert the result, given exchange rates: `$5 + 10 CHF = $10` when 2 CHF buy 1 dollar. The kata is the classic example of the TDD literature. The code and the steps here were written for this repository.

## Run

The only requirement is Docker.

```sh
./setup-unix-tdd-kata.sh        # Linux and macOS
./setup-windows-tdd-kata.ps1    # Windows
```

The script runs the type check and the tests of the finished kata and then checks the rhythm of the git history (see below).

## Tests

```sh
docker compose run --rm ts-test
```

9 tests of the kata, 7 tests of the history checker and 1 test that checks the committed snapshot of the history.

## Demo: checking the history

```sh
git log --reverse --format="%h %s" -- . | docker compose run --rm -T history
```

Git runs on the host and the checker runs in Docker. It reads only the commit prefixes:

| Prefix | Step | Rule |
| --- | --- | --- |
| `test(tdd-kata): red - ...` | a new failing test | only on a green bar: never two failing tests at once |
| `feat(tdd-kata): green - ...` | make it pass | only right after a red: no production code without a failing test |
| `refactor(tdd-kata): ...` | clean up | only on a green bar |

It also requires at least 3 cycles, at least one refactoring, and a history that does not end on red. Commits with any other prefix (the scaffold, this documentation) are not steps and are ignored.

The prefixes are a claim. To prove it, the replay script extracts the code of every step commit and runs the tests in a throw-away container: every `red` commit must fail and every `green` and `refactor` commit must pass.

```sh
./replay-unix-tdd-kata.sh        # or replay-windows-tdd-kata.ps1
```

Result on the committed history: `27 steps replayed, 0 wrong`.

Both commands need git and the full history. In a shallow clone (a CI job with `fetch-depth: 1`) the setup script skips the live check, and the rhythm is still verified by a test on [`ts/HISTORY.txt`](ts/HISTORY.txt), a snapshot of the same `git log`.

**Keep the commits.** Merging this branch with a squash or rebasing it destroys the lesson, and a rebase also changes the hashes linked below.

## Walkthrough

Each step links to its commit. Read the diff of each one: none is larger than a screen.

| # | Step | What happens | Commit |
| --- | --- | --- | --- |
| 1 | red | $5 times 2 is $10 | [`350b73b`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/350b73b) |
| 2 | green | fake it: times returns $10 | [`4009c9b`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4009c9b) |
| 3 | red | triangulate with $5 times 3 | [`37fbac3`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/37fbac3) |
| 4 | green | times multiplies the amount | [`f659df2`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/f659df2) |
| 5 | red | dollars are equal when their amounts are equal | [`09782c5`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/09782c5) |
| 6 | green | obvious implementation: equals compares the amounts | [`c30c7dd`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c30c7dd) |
| 7 | refactor | compare whole values with equals in the tests | [`e03cb61`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e03cb61) |
| 8 | red | 5 CHF times 2 is 10 CHF | [`e81bdce`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e81bdce) |
| 9 | green | copy Dollar into Franc | [`1c184df`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/1c184df) |
| 10 | refactor | pull the amount and equals up into Money | [`737fdc8`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/737fdc8) |
| 11 | red | 5 CHF is not equal to $5 | [`e236d10`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e236d10) |
| 12 | green | equals also compares the currency | [`3726797`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/3726797) |
| 13 | refactor | move times up into Money | [`15eb25a`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/15eb25a) |
| 14 | refactor | create money through Money.dollar and Money.franc | [`4253425`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4253425) |
| 15 | refactor | delete the empty Dollar and Franc subclasses | [`512f11c`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/512f11c) |
| 16 | red | $5 + $5 is $10 | [`17702bc`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/17702bc) |
| 17 | green | fake it: reduce returns $10 | [`5de03f7`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/5de03f7) |
| 18 | red | triangulate with $3 + $4 | [`b46ef1a`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/b46ef1a) |
| 19 | green | reduce returns the sum it was given | [`4d8f892`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4d8f892) |
| 20 | red | 2 CHF is $1 at a rate of 2 | [`214e092`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/214e092) |
| 21 | green | the Bank keeps rates and a Money converts itself | [`912e09e`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/912e09e) |
| 22 | refactor | name the key of a rate | [`c82506d`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c82506d) |
| 23 | red | $5 + 10 CHF is $10 | [`a671f72`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/a671f72) |
| 24 | green | a Sum expression reduces both sides before adding | [`f7eebe5`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/f7eebe5) |
| 25 | red | a sum can be added to and multiplied | [`5cc8402`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/5cc8402) |
| 26 | green | plus and times belong to every Expression | [`c4343b1`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c4343b1) |
| 27 | refactor | group the tests by behaviour | [`326a071`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/326a071) |

The to-do list ([`TODO.md`](TODO.md)) changes along the same commits: an idea that comes up in the middle of a step is written down and left for later.

## What to notice

- **Fake it (steps 2 and 17).** The first green returns a constant. It proves the test can pass and that the test is wired correctly, at almost no cost.
- **Triangulation (steps 3 and 18).** A second example makes the constant impossible, and only then the real code is written.
- **Obvious implementation (step 6).** When the code is clear, it is typed directly. Faking is a way to slow down when unsure, not a ritual.
- **A deliberate sin (step 9).** Franc is a copy of Dollar. Getting to green fast is allowed. Staying there is not: steps 10 to 15 remove the copy.
- **Refactoring finds bugs (steps 10 and 11).** Pulling `equals` up made 5 CHF equal to $5. No test noticed, because no test asked. The next red asks.
- **Tests change in a refactoring too (steps 7, 14 and 27),** but never together with a change in behaviour.
- **The design arrives late (step 24).** `Expression` and `Sum` exist only because a test could not be satisfied without them.

## Structure

```text
ts/src/money.ts            Money, Sum and the Expression interface
ts/src/bank.ts             exchange rates and reduce
ts/tests/money.test.ts     the tests of the kata
ts/scripts/history.ts      the checker of the commit prefixes
ts/HISTORY.txt             snapshot of the git log of this folder
TODO.md                    the to-do list of the kata
```

Dependencies, pinned: `typescript` 7.0.2 and `@types/bun` 1.4.2 for the type check, on `oven/bun:1.4.2`. The kata uses only the test runner built into Bun.
