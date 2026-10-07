# Blind review: networks

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer agreed with the key on all 100 questions and flagged three statements that depended on an unstated convention.

### networks-medium-access-control-04

- Reviewer note: a switch sends a frame only to the destination port after it has learned that address. For an unknown destination it floods, like a hub.
- Resolution: **question rewritten**. The statement now says that the switch has already learned the destination address. Key kept.

### networks-transport-layer-08

- Reviewer note: 16 MSS assumes that the window doubles at the end of each RTT starting from 1. Counting the initial window as the first RTT gives 8 MSS, which is also an alternative.
- Resolution: **question rewritten**. The statement now says that the window doubles at the end of every RTT and asks for the size after 4 complete RTTs. Key kept.

### networks-transport-layer-14

- Reviewer note: 12 RTTs assumes a reduction to half and a growth of 1 MSS per RTT, which the statement did not say.
- Resolution: **question rewritten**. The statement now states both rules. Key kept.
