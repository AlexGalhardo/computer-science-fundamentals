# Blind review: concurrency

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes and how they were resolved

The reviewer agreed with the key on all 100 questions in the first round, but flagged 11 of them. Ten questions were changed and answered again by a second reviewer who had seen neither the key nor the first round. The second round also agreed with the key on all ten.

| Question | Note of the reviewer | Resolution |
| --- | --- | --- |
| `concurrency-atomics-and-memory-models-02` | The statement pointed at "the example", which is shown only after the answer | `question rewritten`: the scenario is now described in the statement. Key unchanged |
| `concurrency-atomics-and-memory-models-06` | Same | `question rewritten`: statement now carries the Go scenario. Key unchanged. The `GOMAXPROCS(1)` distractor stays wrong: the data race remains and the goroutine can still be preempted between the read and the write |
| `concurrency-classic-problems-02` | Same | `question rewritten`: statement names the `ArrayBlockingQueue`. Key unchanged |
| `concurrency-classic-problems-06` | Same | `question rewritten`: statement lists the acquire and release order of both methods. Key unchanged |
| `concurrency-deadlock-livelock-starvation-02` | Same | `question rewritten`: the four edges of the graph are in the statement. Key unchanged |
| `concurrency-deadlock-livelock-starvation-06` | Same | `question rewritten`: the nested `synchronized` code is in the statement. Key unchanged |
| `concurrency-deadlock-livelock-starvation-10` | Same | `question rewritten`: statement says which thread holds and waits for which fork. Key unchanged |
| `concurrency-semaphores-and-monitors-02` | Same | `question rewritten`: the `while` loop around `wait()` is in the statement. Key unchanged |
| `concurrency-semaphores-and-monitors-06` | Same, and the answer depended on `if` against `while` | `question rewritten`: statement shows `if (items.isEmpty()) { wait(); }` and `notifyAll()`. Key unchanged |
| `concurrency-race-conditions-12` | The correct alternative gave an incomplete reason: rustc first rejects the closure because `thread::spawn` needs `'static` (E0373), the multiple mutable borrow comes second. Second round: the statement did not say that the program prints | `question rewritten`: correct alternative and its explanation now give the lifetime reason first, and the statement says that the program prints `counter`. Key unchanged |
| `concurrency-race-conditions-06` | "No process may wait forever" is a weak second candidate | `key kept`: the statement says the other process is in a long computation that ends, so nobody waits forever. The condition broken is that a process outside its critical region blocks another |
