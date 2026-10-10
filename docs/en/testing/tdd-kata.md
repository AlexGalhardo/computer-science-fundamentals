# TDD kata with commit history (MP-TEST-2)

> Versão em português: [docs/pt/testing/tdd-kata.md](../../pt/testing/tdd-kata.md) · Versión en español: [docs/es/testing/tdd-kata.md](../../es/testing/tdd-kata.md)

Mini-project: [`projects/testing/tdd-kata`](../../../projects/testing/tdd-kata/README.md). Quiz topics: `tdd-cycle`, `unit-tests-isolation`.

## The concept

Test-driven development is a rhythm of three steps, always in the same order:

```text
   +-----------+   write the smallest code   +-----------+
   |    RED    | --------------------------> |   GREEN   |
   | a failing |                             | all tests |
   |   test    | <-------------------------- |   pass    |
   +-----------+     next item of the list   +-----------+
                                               |       ^
                                               v       |
                                             +-----------+
                                             | REFACTOR  |  remove duplication,
                                             | still all |  behaviour unchanged
                                             |  passing  |
                                             +-----------+
```

- **Red.** Write one test for behaviour that does not exist yet, and watch it fail. A test that was never seen failing has not shown that it can detect anything.
- **Green.** Write the least code that makes it pass. Ugly is allowed: a constant, a copy of another class.
- **Refactor.** With every test passing, remove the mess made in the previous step. No new behaviour here.

Two rules follow: no production code without a failing test that asks for it, and no clean-up while a test is failing.

## The mini-project

The deliverable is the git history of the folder: 27 step commits (10 red, 10 green, 7 refactor) that solve the multi-currency money problem, `$5 + 10 CHF = $10` at a rate of 2. The [README](../../../projects/testing/tdd-kata/README.md) has the walkthrough, one line and one link per commit.

The commit prefix carries the step:

| Prefix | Step |
| --- | --- |
| `test(tdd-kata): red - ...` | a new failing test |
| `feat(tdd-kata): green - ...` | the change that makes it pass |
| `refactor(tdd-kata): ...` | a clean-up on a green bar |

## Three ways to get to green

| Strategy | When | In the kata |
| --- | --- | --- |
| Fake it | You are not sure of the code. Return a constant, then let the next step force the real thing | `times` returns `$10`; `reduce` returns `$10` |
| Triangulation | A fake is in place. A second example with another value makes the constant impossible | `$5 times 3`; `$3 + $4` |
| Obvious implementation | The code is clear in your head. Type it | `equals` compares the amounts |

They are gears, not a ritual. A surprise (an unexpected red) is the signal to shift down to smaller steps.

## How the design appeared

Nothing was drawn before the first test. The design came from removing duplication:

1. `Dollar` alone, then `Franc` as a shameless copy to get a test green.
2. The copy is removed in small refactorings: `equals` goes up into `Money`, then `times`, then the subclasses are empty and are deleted.
3. Pulling `equals` up made 5 CHF equal to $5. No test complained, because none asked. The next red test asked, and the currency entered the comparison.
4. `$5 + 10 CHF` could not be answered with a `Money`, because the result depends on a rate. That test is what created `Sum` and the `Expression` interface.

## How the history is checked

- **Prefixes** (`ts/scripts/history.ts`, in Docker): a state machine over the commit subjects. Red only on a green bar, green only right after a red, refactor only on a green bar, no history ending on red, at least 3 cycles and one refactoring. The checker has its own tests, one per way of breaking the rhythm.
- **Replay** (`replay-unix-tdd-kata.sh`): the prefixes are a claim, so the script extracts the code of each step commit and runs the tests in a throw-away container. Every red commit fails and every green and refactor commit passes: `27 steps replayed, 0 wrong`.
- **Snapshot** (`ts/HISTORY.txt`): a copy of the `git log` of the folder, checked by a test, for places where the history does not exist (a shallow CI clone).

Because the lesson is the history, the branch must be merged without squash and without rebase.

## Limits

- The history shows the order of the steps, not the thinking between them. The to-do list (`TODO.md`) records part of it.
- A history this tidy is a teaching device. Real work has false starts. The point is the direction: test first, small steps, clean on green.
- TDD produces a regression suite and a design that is easy to test. It does not replace integration tests, and it is hard to apply to user interfaces and to code whose result is not known in advance.

## Run

```sh
./setup-unix-tdd-kata.sh        # Linux and macOS
./setup-windows-tdd-kata.ps1    # Windows
```
