# Blind review: big-o

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The first pass found a defect of the format, not of the answer key: 10 statements depended on a code fragment that was stored in `example`, which the quiz shows only after the answer, so the reviewer had to guess 5 of them. Resolution: **question rewritten** for those 10 questions (`counting-operations-01`, `-03`, `-05`, `-06`, `-08`, `-09`, `loop-invariants-05`, `-08`, `space-complexity-03`, `-06`): the fragment moved to the new `snippet` field, shown with the statement. The reviewer then answered the 10 again from the code, agreed with the key on all of them, and confirmed that no snippet gives the answer away.
