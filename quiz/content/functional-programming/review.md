# Blind review: functional-programming

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer (an independent sub-agent that read only the blind export) agreed with the key on all 100 questions and flagged five statements or alternatives. All five were rewritten, the batch was exported again and the comparison was rerun with the same answers: 100 agreements.

The author also found one flaw before the review, by running every code fragment: `functional-programming-elixir-typescript-style-05` used a map with two keys, and the order in which a map is enumerated is not guaranteed (Elixir 1.20 on OTP 28 printed `[b: 4, a: 2]`). The question now uses a map with one key.

### functional-programming-pure-functions-06

- Reviewer note: the second half of the correct alternative ("nothing fails to happen") is cryptic.
- Resolution: **question rewritten**. The alternative now says that the stored value equals a fresh result and that no side effect is skipped. Key kept.

### functional-programming-pure-functions-12

- Reviewer note: the correct alternative alludes to shrinking without naming it and is hard to parse.
- Resolution: **question rewritten**. The alternative now names shrinking. Key kept.

### functional-programming-recursion-tail-calls-04

- Reviewer note: the premise is loose, because Elixir does have `for` (comprehensions). What it lacks is a loop with a mutable counter.
- Resolution: **question rewritten**. The statement now says that Elixir has no `while` and no `for` loop with a mutable counter. Key kept.

### functional-programming-composition-currying-08

- Reviewer note: the answer depends on the left-to-right convention of `pipe`, which this statement did not restate. With the opposite reading another alternative would be right.
- Resolution: **question rewritten**. The statement now defines `pipe(f, g)(x)` as `g(f(x))`. Key kept.

### functional-programming-adts-pattern-matching-10

- Reviewer note: 7 values holds only when objects with extra fields are not counted, since TypeScript object types are structurally open.
- Resolution: **question rewritten**. The statement now counts only values with exactly the declared fields. Key kept.
