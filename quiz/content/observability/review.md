# Blind review: observability

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was run

Two rounds, one per language, each by a fresh reviewer agent that received only the blind file and never saw `quiz/content/` or the mini-projects.

| Round | Blind file | Result |
| --- | --- | --- |
| 1 | `bun run quiz:blind observability` (English) | 100 answered, 0 disagreements, 4 questions flagged with a note |
| 2 | `bun run quiz:blind observability --lang pt` (Portuguese) | 100 answered, 0 disagreements, 7 questions flagged with a note |

Both reviewers worked every computed answer (error budgets, burn rates, percentiles, rates, series counts, self times, sampling estimates) and found exactly one matching alternative each time. The Portuguese reviewer found no missing accent and no mistranslation.

The fixes below were made after the two rounds. None changes a key, so the rounds were not repeated; `bun run quiz:validate observability --strict` passes after them with no warning.

## Notes raised by the reviewers and their resolution

| Question | Round | Note | Resolution |
| --- | --- | --- | --- |
| `observability-alerting-04` | EN, PT | The snippet of `alerting-05` shows the factor 14.4 on a 1-hour window, which gives the answer away | question rewritten: it now asks for the burn rate that spends 5% of a 30-day budget in 6 hours (0.05 × 720 / 6 = 6; check: burn rate 1 spends 6/720 = 0.8333% in 6 hours, and 5 / 0.8333 = 6). New distractors, each from a named wrong computation. Position of the key kept |
| `observability-distributed-tracing-07` | EN, PT | The alternatives quoted total durations ("with 900 ms") next to a question about self time, which reads as if they were self times | question rewritten: the alternatives are now only the span names. Key kept |
| `observability-three-signals-09` | EN | The correct alternative was the only one with a second clause naming the right tool (exemplars) | question rewritten: the correct alternative no longer names exemplars; the explanation and the concept still do. Key kept |
| `observability-three-signals-05` | PT | The correct alternative was the only one quoting a computed number | question rewritten: the correct alternative now gives a reason in words, like the others. Key kept. The figures in the diagram keep the plain form `2100 ms` because they are a column of a table |
| `observability-monitoring-vs-observability-01` | PT | The correct alternative was the shortest, and its Portuguese was compressed | question rewritten (Portuguese alternative only): "a partir das saídas" instead of "pelas saídas". Key kept |
| `observability-three-signals-08` and `observability-distributed-tracing-11` | EN, PT | Near duplicates: both multiply a count of kept traces by the sample rate. The figure "50,000 requests per minute" is not needed | key kept: the repetition is deliberate. `three-signals-08` contrasts traces with metrics (a metric counts before sampling), `distributed-tracing-11` is about recording the sample rate on the event. The total traffic is there to feed two distractors (the total itself and 1% of it) |
| `observability-three-signals-05` and `observability-distributed-tracing-07` | PT | Both are about self time | key kept: the first reads a trace to name the culprit, the second applies the definition of self time. Different numbers and trees |
| `observability-metric-types-cardinality-04` and `observability-monitoring-vs-observability-03` | PT | `user_id` is the high-cardinality answer in both | key kept: the idea is central to two topics (why metrics cannot carry it, why observability needs it), and the two questions ask opposite things about it |
| `observability-prometheus-grafana-loki-tempo-03` | PT | Strictly, TraceQL returns traces (spansets) that contain the matching spans, not bare spans | key kept: the statement asks what the query selects, which is spans; the explanation of the correct alternative and the concept say that Tempo returns the traces containing them |

## Form checks

Measured on the final files:

- Correct index: 22, 19, 21, 19 and 19 questions for the indexes 0 to 4, placed pseudo-randomly inside each topic.
- Difficulty: 41 basic, 39 intermediate, 20 advanced.
- The correct alternative is strictly the longest in about 10 of 100 questions in each language (19 over the two languages), and strictly the shortest in about as many, both below the 20% expected by chance.
- No statement depends on `example`. Log lines, queries, rules and trace trees needed to answer are in `snippet`.
