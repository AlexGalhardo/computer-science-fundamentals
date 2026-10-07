# Blind review: operating-systems

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer agreed with the key on all 100 questions and flagged none. It left two observations.

### operating-systems-memory-management-06

- Reviewer note: the statement does not say whether the TLB lookup time also counts on a miss. Only the reading that counts it (130 ns) is among the alternatives; the other reading gives 128 ns, which is not.
- Resolution: **key kept**. Exactly one alternative is reachable, so the question is not ambiguous as written.

### operating-systems-ipc-and-synchronisation-07

- Reviewer note: in implementations where a semaphore may go negative its value does become -1, but the alternative that says so also says that the process keeps running, which makes it wrong either way.
- Resolution: **key kept**.
