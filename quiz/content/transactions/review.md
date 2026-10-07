# Blind review: transactions

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was run

Two rounds, each by a fresh reviewer agent that received only the blind file and never saw `quiz/content/`.

| Round | Blind file | Result |
| --- | --- | --- |
| 1 | `bun run quiz:blind transactions --lang en` | 100 answered, 0 disagreements, 10 questions flagged with a note |
| 2 | Same questions after the fixes below, with the `example` of each question included and the correct positions reshuffled | 100 answered, 0 disagreements, 1 question flagged with a note |

Round 2 exists because round 1 exposed two problems of form, not of content:

- The blind export drops the `example` field, so the reviewer had to guess the code of 8 questions whose statement says "the example". The round 2 blind file was generated with the examples.
- The correct alternative advanced by one position from question to question inside each topic, so the key was predictable from the position. The correct alternative of every question was moved to a seeded pseudo-random position, keeping 20 questions per index.

## Notes raised by the reviewers and their resolution

| Question | Note | Resolution |
| --- | --- | --- |
| `transactions-deadlocks-04` | Running each UPDATE in its own transaction also removes the deadlock, so two alternatives were defensible | question rewritten: the statement now asks for the change that removes the deadlock "while keeping each transfer atomic". Key kept |
| `transactions-logging-recovery-07` | Near duplicate of `transactions-acid-properties-12` (`synchronous_commit = off`) | question rewritten: it now covers media failure, restoring a backup and replaying the archived log |
| `transactions-locking-09` | "Nobody waits in line" is too absolute: concurrent UPDATEs of the same row still wait briefly for the row lock | question rewritten: the alternative now says "Nobody holds a lock while deciding". Key kept |
| `transactions-acid-properties-08`, `transactions-idempotency-08`, `transactions-isolation-levels-anomalies-15`, `transactions-locking-06`, `transactions-locking-10`, `transactions-locking-11`, `transactions-mvcc-09`, `transactions-saga-outbox-05` | Round 1: answered by guessing the missing example | key kept: in round 2 the reviewer saw the example and agreed with the key, with no note |
| `transactions-cap-consistency-models-06`, `transactions-cap-consistency-models-08`, `transactions-isolation-levels-anomalies-16`, `transactions-saga-outbox-10` | Round 1: the correct alternative is the longest or the most detailed, a light effect | key kept: the distractors have similar length. Left as a known weakness of form |

## Third round (2026-10-07, after integration)

Two changes were made after the area was merged, so the whole area was blind-reviewed again by a new reviewer.

- **Alternative lengths.** The correct alternative was strictly the longest in 38 of 100 questions. 21 questions had distractors made more specific or the correct alternative tightened, with no change to any key or explanation. It is now the longest in 18.
- **Statements that depended on `example`.** The reviewer flagged 15 statements that referred to code or a diagram stored in `example`, which the quiz shows only after the answer. Resolution: **question rewritten** for `acid-properties-07`, `-08`, `-09`, `idempotency-08`, `isolation-levels-anomalies-09`, `-12`, `-13`, `-15`, `locking-06`, `-10`, `-11`, `mvcc-04`, `-08`, `-09` and `saga-outbox-05`: the material moved to `snippet`, shown with the statement.

Result: the reviewer agreed with the answer key on all 100 questions, before and after the snippets were added, and confirmed that no snippet gives the answer away. **Key kept** everywhere.

