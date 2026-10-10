# Counter race condition

> Versão em português: [docs/pt/concurrency/counter-race.md](../../pt/concurrency/counter-race.md) · Versión en español: [docs/es/concurrency/counter-race.md](../../es/concurrency/counter-race.md)

Mini-project: [projects/concurrency/counter-race](../../../projects/concurrency/counter-race/README.md) (MP-CONC-1). Languages: Go, Rust, Java, TypeScript, Elixir.

## The problem

`counter++` is not one step. The processor reads the value, adds 1 and writes the result back. When two threads run those three steps at the same time, this can happen:

```text
thread A            thread B            counter
read 41                                 41
                    read 41             41
add 1 (42)
                    add 1 (42)
write 42                                42
                    write 42            42   <- two increments, the counter grew by one
```

One update was lost. Nothing crashed and no error was raised. The program just gives a wrong answer, a different one on every run. In the mini-project, 8 workers do 1,000,000 increments in total and the buggy counter typically ends between 150,000 and 700,000.

The three steps are a **critical section**: a piece of code that only one thread at a time may run. Every fix is a way to guarantee that.

## Why the bug hides

A race needs unlucky timing, and small tests rarely have it. Three things in this mini-project exist only to make the bug show every time:

- A **starting gate**. All workers wait and leave together. Without it the first worker often finishes before the last one starts.
- **Real reads and writes**. An optimising compiler may turn a loop of 125,000 increments into a single `+= 125000`. The race is still there, but it almost never shows. The Rust version uses volatile reads and writes, and the Java version uses a `volatile` field, to keep one read and one write per increment. With a plain Java field we measured the bug hiding in 8 of 10 runs once the JIT compiler had warmed up.
- **Repetition**. The test runs the experiment 30 times and requires lost updates in at least 24. A data race only loses updates while the workers really run in parallel, so on a busy machine a run now and then loses nothing; the margin keeps the test from failing for that reason.

`volatile` in Java deserves attention: it guarantees that a read sees the last write (visibility), and nothing more. `count++` on a volatile field is still three steps and still loses updates.

## The four fixes

| Fix | Idea | Cost |
| --- | --- | --- |
| Mutex | Only the holder of the lock runs the critical section. The others wait | Waiting, and a lock and an unlock per increment |
| Atomic operation | The processor does read, add and write as one indivisible instruction | Works for one variable. Two variables that change together still need a lock |
| Channel or message passing | One thread owns the number. The others send it messages, handled one at a time | A queue operation per increment, the slowest of the four |
| Actor | The same idea as a language feature: an Elixir process keeps the state in its own loop and has a mailbox | Same as above. In exchange, the state can never be shared by accident |

The first two share the memory and protect it. The last two do not share the memory at all.

### Message passing does not remove every race

The Elixir folder also has a deliberately wrong function, `get_then_set`: it asks the owner for the value and then sends back the value plus one. Each message is handled alone, but two processes can both read 41 and both set 42. It is the same lost update, one level up. The rule is the same in every model: the whole operation must be **one** indivisible step. With a lock that is one critical section, and with an actor it is one message.

## What each language does about it

- **Go** compiles the bug without a warning. The race detector (`go test -race`, `go build -race`) finds it at run time: it remembers which goroutine touched each address and under which lock, and reports two unsynchronised accesses where one is a write.
- **Rust** refuses to compile the bug. A value shared by threads must be `Sync`, and a number written through a shared reference is not. The buggy version needs `UnsafeCell` and a false `unsafe impl Sync` to exist, which is why it is labelled as deliberately wrong. A data race is undefined behaviour in Rust.
- **Java** compiles the bug without a warning and the JDK has no dynamic race detector. The usual tooling is static: the field declares its lock with `@GuardedBy("this")` and the Error Prone compiler plugin reports every access made without that lock.
- **TypeScript** workers share nothing by default. A race needs a `SharedArrayBuffer`. `Atomics.add` is the atomic fix, and a mutex can be built from `Atomics.compareExchange`, `Atomics.wait` and `Atomics.notify`.
- **Elixir** processes share no memory, so there is no data race to write. Higher-level races, like `get_then_set`, are still possible.

## Results

Captured detector output: [race-detector-go.txt](../../../projects/concurrency/counter-race/results/race-detector-go.txt) and [race-detector-java.txt](../../../projects/concurrency/counter-race/results/race-detector-java.txt).

Throughput with 1, 2, 4 and 8 workers: [throughput.md](../../../projects/concurrency/counter-race/results/throughput.md), with the machine in [results.md](../../../projects/concurrency/counter-race/results/results.md). The main lesson of the table is that a shared counter gets slower with more workers, not faster: every core needs the same memory location, so they take turns.

## Quiz

Topics of the `concurrency` area that this mini-project demonstrates: `race-conditions`, `mutexes-and-locks`, `atomics-and-memory-models`, `message-passing-and-channels` and `actor-model-and-beam`.
