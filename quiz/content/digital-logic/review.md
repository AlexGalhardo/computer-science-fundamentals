# Blind review: digital-logic

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was run

Two independent reviewer agents answered the area, each seeing only `quiz/.review/digital-logic.blind.json`:

1. English export (`bun run quiz:blind digital-logic`): 100 of 100 answers equal to the key.
2. Portuguese export (`bun run quiz:blind digital-logic --lang pt`): 100 of 100 answers equal to the key. This second pass exists because the blind file carries one language only, so the first reviewer could not check the Portuguese text.

Every computed answer was also recomputed by a script before the review (base conversions, two's complement, Gray, Karnaugh covers by truth-table equivalence, adder and flag cases, flip-flop and latch sequences, converter steps).

## Reviewer notes

Both reviewers flagged the same question. No other note was attached.

### digital-logic-analog-to-digital-conversion-04

- Note of the first reviewer (English): 1023 µs assumes that the worst case of a digital-ramp converter is 2^N - 1 clock cycles. Some textbooks quote 2^N cycles, and the statement did not say which convention applies.
- Resolution: **question rewritten**. The statement now says that the counter starts at zero, must reach the maximum code in the worst case, and that one cycle is counted per counter step. Key kept.
- Note of the second reviewer (Portuguese, after the first rewrite): no ambiguity left, but the distractors were weak and the most common counting mistake, 1024 µs (2^N cycles), was missing.
- Resolution: **question rewritten**. The distractor "100 µs" (N squared, a filler) was replaced by "1024 µs", with an explanation of the off-by-one between the number of codes and the number of steps. Key kept. This last distractor was added after both passes, so it was not seen by a blind reviewer; with the convention stated in the statement, 1023 steps is the only value consistent with a count from 0 to 1023.
