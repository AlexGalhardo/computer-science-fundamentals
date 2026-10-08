# Blind review: testing

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer was an independent sub-agent that read only `quiz/.review/testing.blind.json`. It agreed with the key on all 100 questions and left 3 notes. None claimed a second defensible alternative.

- `testing-coverage-mutation-05`: "6 were analysed by hand and classified as equivalent" could be read as only 6 of the 18 survivors having been analysed. Resolution: **question rewritten**. The statement now says that all 18 survivors were analysed and 6 of them were classified as equivalent, in both languages. The key did not change (42 / 54, about 78%).
- `testing-flaky-tests-05`: every alternative carried its own formula ("which is 1 minus 0.98 to the power of 50"), so the reader only had to recognise the expression. Resolution: **question rewritten**. The alternatives are now bare percentages, the statement gives 0.98^50 ≈ 0.364 so no calculator is needed, and the formulas moved to the explanations. The key did not change (64%).
- `testing-tdd-cycle-08`: a refactoring as the first commit of the history shown is unusual, and `c5` is an attractive distractor. Resolution: **key kept**. The snippet says that every test passes before `c1`, so `c1` is the only production change made on a green bar that stays green, and `c5` turns a red test green, which is the green step, not a refactoring.

After these edits the validation ran again (`bun run quiz:validate testing --strict`: 100 questions, 0 errors, 0 warnings). No key changed, so the comparison stays at 100 agreements.

Before the review, an authoring pass measured the length tell in both directions. The first drafts over-corrected: the correct alternative was never the longest and was the strictly shortest in 31 (PT) and 30 (EN) of 100 questions, a pattern a student could learn. Fourteen correct alternatives were extended with true, non-revealing wording. The correct alternative is now strictly the longest in 14 questions and strictly the shortest in 18 (PT) and 17 (EN), around the 20 expected by chance.

Limit of this review: `quiz:blind` exports only the English text, so the reviewer could not check that the Portuguese and English versions say the same thing.
