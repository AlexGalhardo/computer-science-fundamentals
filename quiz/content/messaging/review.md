# Blind review: messaging

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## How the review was run

One round, by a fresh reviewer agent that received only `quiz/.review/messaging.blind.json` (`bun run quiz:blind messaging`, English) and never saw `quiz/content/`. It answered the 100 questions, agreed with the key on all of them, and flagged 5 questions with a note plus 2 remarks. `bun run quiz:compare messaging <answers>` was run before and after the fixes below, with 0 disagreements both times. The fixes changed statements and one alternative, never a key or a position.

The reviewer also reported that its answers were spread evenly over the five positions, that no correct alternative was recognisable by its form, and that every computed answer was reproduced (15 s, 12,000, 180, offsets 2 and 4, partitions 2 and 4, 600 and 1,800, Q1 Q2 Q4, 2 members).

## Notes raised by the reviewer and their resolution

| Question | Note | Resolution |
| --- | --- | --- |
| `messaging-ack-retry-dlq-04` | The endless requeue loop holds for a classic queue. A quorum queue in RabbitMQ 4 has a default delivery limit of 20, so the message would be dropped or dead-lettered | question rewritten: the statement now says the consumer reads from a classic queue. Key kept |
| `messaging-ordering-partitioning-05` | "FIFO queue" is ambiguous: in an SQS FIFO queue the second message of the same group would not be delivered while the first is in flight | question rewritten: the statement now says an ordinary broker queue that hands messages out in FIFO order, with no message groups. Key kept |
| `messaging-delivery-guarantees-11` | The timeline treats auto-commit as a timer event, but in the Java client it runs inside `poll()`, which the statement did not say the consumer keeps calling | question rewritten: the statement now says the consumer keeps calling `poll()`. Key kept |
| `messaging-backpressure-06` | "The whole backlog" in the consumer's memory is an idealisation: the broker pushes at network speed, and with large messages the second consumer would get a part | question rewritten: the messages are now small, and the alternative says the memory balloons with the backlog and the second consumer stays nearly idle. Key kept |
| `messaging-kafka-topics-partitions-offsets-10` | 50 is exact only if the group already has its partitions when the 50 records are produced | question rewritten: the statement now says the records are produced after the group joined and received its partitions. Key kept |
| `messaging-ordering-partitioning-09` | Remark, not flagged: two alternatives start with "Partitions 2 and 4", which helps elimination | key kept: the two differ in the consequence (Kafka holding a record back across partitions), which is the misconception the distractor tests |
| `messaging-bullmq-redis-03` | Remark, not flagged: the snippet used a `queue` variable whose name was not shown, while the worker listens on `payments` | question rewritten: the snippet now creates `new Queue("payments", ...)`. Key kept |

## Form checks

- Correct position: 20 questions on each index, assigned by a seeded pseudo-random shuffle (no rotation).
- Length: the correct alternative is strictly the longest in 19 of 100 questions (chance is 20).
- Difficulty: 40 basic, 40 intermediate, 20 advanced.
- 19 questions carry a `snippet`. No statement depends on `example` (no question has one).
