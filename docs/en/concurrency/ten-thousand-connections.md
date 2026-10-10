# Ten thousand connections

> Versão em português: [docs/pt/concurrency/ten-thousand-connections.md](../../pt/concurrency/ten-thousand-connections.md) · Versión en español: [docs/es/concurrency/ten-thousand-connections.md](../../es/concurrency/ten-thousand-connections.md)

Mini-project: [projects/concurrency/ten-thousand-connections](../../../projects/concurrency/ten-thousand-connections/README.md) (MP-CONC-3). Languages: TypeScript, Go, Elixir.

## The problem

A server spends most of its life waiting: for the next request of a client, for a database, for another service. The simplest design gives every connection its own operating-system thread, and that thread blocks while it waits. It works for hundreds of connections and breaks down at tens of thousands:

- each thread reserves a stack (typically 8 MiB of address space on Linux), whether it uses it or not;
- the kernel has to schedule every thread, and switching between threads costs time;
- none of that buys anything, because a waiting connection does no work.

So the question is: what is the cheapest thing that can represent "a connection that is waiting"? The three servers of this mini-project give three answers.

## Three answers

| | TypeScript on Bun | Go | Elixir on the BEAM |
| --- | --- | --- | --- |
| Model | Event loop | Goroutine per connection | Process per connection |
| Who waits | Nobody. A timer and a promise are stored, and the single thread goes back to the loop | The goroutine. The runtime parks it and reuses the thread | The process. The scheduler skips it until a message or a timeout arrives |
| A waiting connection is | A socket and a few small objects | A goroutine stack plus the buffers of `net/http` | A process with its own small heap and stack |
| The code looks | Asynchronous: `await` marks every place where it can pause | Blocking: a plain function that sleeps | Blocking: a plain function that sleeps |
| Processor cores used | One for JavaScript | All | All |
| Long computation in a handler | Blocks every other connection | Preempted by the runtime | Preempted by the scheduler |
| A crash in one connection | An exception to catch, in shared state | A panic, recovered per request by `net/http` | Kills only that process. Nothing is shared |

**Event loop.** One thread asks the operating system which sockets are ready, runs the small piece of code for each one and asks again. `await Bun.sleep(ms)` does not stop the thread: it registers a timer and returns. This is concurrency without parallelism. Its weak point is that one slow callback delays everybody.

**Goroutines.** Go keeps the "one blocking thread per connection" style and makes the thread cheap. A goroutine is scheduled by the Go runtime, not by the kernel, starts with a stack of a few kibibytes that grows on demand, and when it blocks on the network the runtime parks it and runs another one on the same thread. Underneath there is an event loop too (the network poller), hidden from the programmer.

**BEAM processes.** The Erlang virtual machine goes one step further: processes share no memory and talk only by messages. Each one has its own heap and its own garbage collection, and the scheduler preempts a process after a fixed amount of work. A connection is one process, and its crash cannot corrupt another.

## The measurement

The k6 scenario opens 10,000 connections, each one a `GET /delay?ms=30000` that stays open and idle for 30 seconds. While they are held it measures:

- **memory per connection**: the growth of the resident memory of the server, read from `/proc/self/status`, divided by the number of requests in flight that the server reports;
- **latency of new requests**: 50 `POST /echo` per second, with p50, p95 and p99.

Results of the committed run are in [results.md](../../../projects/concurrency/ten-thousand-connections/results/results.md): about 4 KiB per connection on Bun, 16 KiB in Go and 10 KiB in Elixir, with a median latency below one millisecond in all three. The three models pass the test easily, which is the point: none of them spends a thread on a waiting connection.

The comparison is fair because one protocol test suite passes against the three servers, so the client cannot tell them apart.

### What the numbers do not say

- The workload only waits. It says nothing about processor-heavy handlers, where the single thread of the event loop is the limit.
- Memory per connection depends on what the handler keeps alive. A real handler holds parsed requests, sessions and buffers.
- Load generator and servers share one machine, so latency includes the noise of k6 itself and of anything else running. One of two runs showed a p99 of 361 ms for Go, and the other 10.57 ms.

## Local targets only

A load test sends real traffic. Pointed at a host that is not yours, it is an attack, and a typo in an environment variable is enough to do it by accident. This mini-project has three barriers:

1. `load/target.js` accepts only `localhost`, `127.0.0.1`, `[::1]` and the three service names of the docker-compose file. The check runs before k6 opens any connection, and lookalikes such as `http://localhost@example.com` are refused.
2. A test (`k6-refusal-test`) runs k6 with `https://example.com` and passes only if k6 exits with the refusal.
3. The docker network is `internal`: containers on it have no route to the internet.

## Quiz

Topics of the `concurrency` area that this mini-project demonstrates: `async-and-event-loop`, `actor-model-and-beam` and `concurrency-vs-parallelism`.
