# Blind review: performance

- Date: 2026-10-07
- Questions answered without the answer key: 100, twice (one independent reviewer on the English text, another on the Portuguese text)
- Agreements: 100 of 100 in English, 100 of 100 in Portuguese
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

Both reviewers agreed with the key on all 100 questions. The English reviewer flagged one pair of questions and the Portuguese reviewer flagged seven ids. Each note gets a resolution.

### performance-capacity-planning-queueing-06 and performance-database-performance-10

- Reviewer note (both reviewers): the two questions are near duplicates, with the same scenario, the same numbers (pool of 10 connections, 50 ms per request) and the same answer (200 req/s).
- Resolution: **question rewritten** (`capacity-planning-queueing-06`). It now asks the inverse problem with other numbers: the smallest pool for 300 req/s, 20 ms per request and at most 75% of the connections busy. Worked twice: demand 300 × 0.02 = 6 busy connections, 6 / 0.75 = 8; and 8 connections serve 8 / 0.02 = 400 req/s, 300 / 400 = 75%. Each wrong alternative is one named slip (6 ignores the headroom, 5 multiplies by 0.75, 15 divides 300 by 20, 60 reads 20 ms as 0.2 s). The rewritten text was written after the blind pass, so it was checked by the author only. `database-performance-10`: **key kept**, unchanged.

### performance-capacity-planning-queueing-01, performance-capacity-planning-queueing-02 and performance-latency-throughput-percentiles-07

- Reviewer note (Portuguese): the letter "x" is used as the multiplication sign, while other questions use "×".
- Resolution: **question rewritten** (typography only). Every " x " used as a multiplication sign in `capacity-planning-queueing.json`, `latency-throughput-percentiles.json` and `profiling-flame-graphs.json` is now "×", in both languages. Keys kept.

### performance-k6-fundamentals-09

- Reviewer note (Portuguese): the answer is clear, but `r.json('items').length` throws a TypeError when `items` is absent instead of recording a failed check, so the 96 failed checks only make sense if `items` came back as an empty array.
- Resolution: **question rewritten**. The check in the snippet is now `r.json('total') > 0`, which is simply false when the field is missing or zero, in both languages. Key kept.

### performance-runtime-performance-05

- Reviewer note (Portuguese): the comment of the snippet was left in English in the Portuguese version, and the statement spells out the rule that no other callback runs while synchronous code is executing, which reduces the question to 3 × 200 ms.
- Resolution: **question rewritten** for the comment, now in Portuguese. The rule stays in the statement on purpose: it is the convention the answer depends on, the question is of intermediate level (apply the rule and compute), and without it "about 0 ms" could be argued by someone assuming another execution model. Key kept.
