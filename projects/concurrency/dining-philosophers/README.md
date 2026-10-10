# dining-philosophers

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Five philosophers sit at a round table with five forks, one between each pair. To eat, a philosopher needs the two forks next to him. If all five pick up the left fork at the same moment, each one waits forever for the right fork, which is in the hand of a neighbour. That is a deadlock. This mini-project builds the table that freezes, in Go and Java, shows how to read the thread dump of the frozen program, and then fixes it in two ways: lock ordering and a waiter (a semaphore).

The longer explanation, with the four conditions of deadlock, is in [docs/en/concurrency/dining-philosophers.md](../../../docs/en/concurrency/dining-philosophers.md).

> The `naive` strategy is **deliberately wrong** and labelled as such in the code.

## Quiz topics it demonstrates

- `concurrency` / `deadlock-livelock-starvation`: the four conditions, circular wait, lock ordering, reading a thread dump
- `concurrency` / `classic-problems`: the dining philosophers and their fixes
- `concurrency` / `semaphores-and-monitors`: a counting semaphore used as a waiter

## Run

The only requirement is Docker.

```sh
./setup-unix-dining-philosophers.sh        # Linux and macOS
./setup-windows-dining-philosophers.ps1    # Windows
```

The script builds the two images and runs every test. It takes about three minutes, because each fix dines for 60 seconds.

## Structure

| Folder | Forks | Waiter |
| --- | --- | --- |
| `go/` | `sync.Mutex` | a buffered channel with 4 slots |
| `java/` | `synchronized` on a `Fork` object | `java.util.concurrent.Semaphore` with 4 permits |

Both implement the same three strategies:

| Strategy | What each philosopher does | Result |
| --- | --- | --- |
| `naive` | left fork, then right fork | deadlock |
| `ordered` | the fork with the lower number first | no deadlock: the circle of waiting cannot close |
| `waiter` | asks the waiter for a seat first, and only 4 of the 5 may be seated | no deadlock: a circle needs all five |

Between the first and the second fork every philosopher pauses for 1 ms. The pause makes the unlucky timing common, so the naive table freezes in milliseconds instead of once in a long while. The fixes use the same pause.

## Tests

```sh
docker compose run --rm go-test
docker compose run --rm java-test
```

| What is tested | How |
| --- | --- |
| The naive table deadlocks in at least 9 of 10 runs | a timeout on progress: nobody ate for 500 ms. In Java the JVM must also report the five threads in a lock cycle (`ThreadMXBean.findDeadlockedThreads`) |
| `ordered` and `waiter` run for 60 seconds with every philosopher eating | the meal counter of each philosopher must be above zero and the table must never stall for 2 seconds |
| `ordered` really takes the lower fork first | unit test of the fork order |

`SOAK_SECONDS=5` shortens the long dinner, for example `docker compose run --rm -e SOAK_SECONDS=5 go-test`.

Formatters and compilers run in the same containers, before the tests: `gofmt` and `go vet`, Spotless with google-java-format and `javac -Xlint:all -Werror`. golangci-lint uses the configuration at the repository root:

```sh
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Demo

```sh
docker compose run --rm go-demo
docker compose run --rm java-demo
```

Each strategy dines for 3 seconds. Output committed in [results/demo-go.txt](results/demo-go.txt) and [results/demo-java.txt](results/demo-java.txt):

```text
strategy deadlock   meals per philosopher
naive    true       [0 0 0 0 0]
ordered  false      [189 377 754 2266 191]
waiter   false      [1468 1468 1469 1468 1470]
```

Two things to notice. The naive table served nothing: it froze on the first round. And `ordered` never freezes but is unfair: philosopher 3 ate about twelve times more than philosopher 0. Lock ordering removes the deadlock, not the starvation risk. In the 60-second test every philosopher still ate thousands of times in Go, and at least a hundred times in Java.

## The thread dump of the deadlock, line by line

```sh
docker compose run --rm java-dump    # jstack on the frozen JVM
docker compose run --rm go-dump      # the stack of every goroutine
```

The full captures are in [results/thread-dump-java.txt](results/thread-dump-java.txt) and [results/goroutine-dump-go.txt](results/goroutine-dump-go.txt).

### Java (`jstack`)

A thread dump lists every thread of the JVM. The ones that matter are the five philosophers. This is the first of them, and the other four have the same shape:

| Line of the dump | What it says |
| --- | --- |
| `"philosopher-0" #34 [30] daemon prio=5 os_prio=0 cpu=1.15ms elapsed=3.25s tid=0x0000798fe8174070 nid=30 waiting for monitor entry  [0x0000798f97afe000]` | The thread name we gave it, its number in the JVM (`#34`) and in the operating system (`[30]`, `nid=30`). `cpu=1.15ms` against `elapsed=3.25s`: in more than three seconds of life it used one millisecond of processor. It is not working, it is stuck. `waiting for monitor entry` means it is at the door of a `synchronized` block |
| `java.lang.Thread.State: BLOCKED (on object monitor)` | The state of the thread. `BLOCKED` is exactly "waiting for a lock that another thread holds". A thread that sleeps or waits for a notification would be `TIMED_WAITING` or `WAITING` |
| `at philosophers.Table.lambda$run$0(Table.java:122)` | Where it stopped: inside the philosopher loop of `Table.run`, at the inner `synchronized`, the one for the second fork |
| `- waiting to lock <0x0000000716236fd0> (a philosophers.Table$Fork)` | The lock it wants: the object at address `...6fd0`, which is a `Fork`. This is its second fork |
| `- locked <0x0000000716236fc0> (a philosophers.Table$Fork)` | The lock it already holds: the `Fork` at `...6fc0`, its first fork. Holding one and waiting for another is the "hold and wait" condition, visible in two lines |
| `at philosophers.Table$$Lambda/0x0000000063041410.run(Unknown Source)` | The lambda passed to `new Thread(...)`. It has no source line because the JVM generates this class at run time |
| `at java.lang.Thread.runWith(java.base@25.0.4.1/Thread.java:1487)` and `at java.lang.Thread.run(java.base@25.0.4.1/Thread.java:1474)` | The bottom of every thread stack: the JDK code that started the thread |

Follow the addresses and the circle appears. `philosopher-0` waits for `...6fd0`, and in the next block `philosopher-1` has `locked <...6fd0>` and waits for `...6fe0`, and so on until `philosopher-4`, which waits for `...6fc0`, held by `philosopher-0`.

Nobody has to follow the addresses by hand, because the JVM does it and prints the cycle at the end of the dump:

| Line of the dump | What it says |
| --- | --- |
| `Found one Java-level deadlock:` | The JVM walked the graph "thread waits for a lock held by thread" and found a cycle. "Java-level" means the locks are Java monitors, not native ones |
| `"philosopher-0":` | First thread of the cycle |
| `waiting to lock monitor 0x0000798f78002430 (object 0x0000000716236fd0, a philosophers.Table$Fork),` | What it waits for. The object address is the same `...6fd0` of the stack above. The monitor address is the internal lock structure of the JVM for that object |
| `which is held by "philosopher-1"` | The owner of that lock. This is one edge of the cycle: 0 waits for 1 |
| `"philosopher-1": ... which is held by "philosopher-2"` | The next edges, with the same two lines each: 1 waits for 2, 2 for 3, 3 for 4 |
| `"philosopher-4": ... which is held by "philosopher-0"` | The edge that closes the circle: 4 waits for 0. This is the "circular wait" condition, written out by the JVM |
| `Java stack information for the threads listed above:` | The stacks of the threads in the cycle are repeated below this line, so the report can be read alone |
| `Found 1 deadlock.` | The summary. A healthy JVM prints no such section |

### Go (goroutine dump)

Go has no built-in cycle report, but the dump has the same information. One block per goroutine:

| Line of the dump | What it says |
| --- | --- |
| `goroutine 19 [sync.Mutex.Lock]:` | Goroutine number 19 and, in brackets, why it is not running: it is blocked inside `sync.Mutex.Lock`. A goroutine stuck for more than a minute also shows the time, for example `[sync.Mutex.Lock, 2 minutes]` |
| `internal/sync.runtime_SemacquireMutex(0x0?, 0x0?, 0x0?)` and `/usr/local/go/src/runtime/sema.go:95 +0x25` | The deepest frame: the runtime put the goroutine to sleep on the internal semaphore of the mutex. Every frame takes two lines: the function, then the file and line |
| `internal/sync.(*Mutex).lockSlow(0x1a9431996008)` | The slow path of `Lock`, taken when the mutex is already held. The argument is the address of the mutex: `...6008`. The forks are a slice of 8-byte mutexes starting at `...6000`, so this is fork 1 |
| `internal/sync.(*Mutex).Lock(...)` and `sync.(*Mutex).Lock(...)` | The public `Lock` call. `(...)` means the compiler inlined the function, so its arguments are not shown |
| `dining-philosophers.Run.func1()` and `/src/philosophers.go:112 +0x1fe` | Our code: the philosopher loop, stopped at line 112, `table[second].Lock()`. It already locked its first fork two lines above |
| `sync.(*WaitGroup).Go.func1()` | The wrapper that `wg.Go` puts around our function |
| `created by sync.(*WaitGroup).Go in goroutine 1` | Who started this goroutine: the main goroutine |

The five philosopher goroutines (19 to 23) are all in `[sync.Mutex.Lock]` at the same line 112, waiting for the mutexes at `...6008`, `...6010`, `...6018`, `...6020` and `...6000`: forks 1, 2, 3, 4 and 0. Each waits for the fork that the next one took first. The dump does not say who holds a mutex, because a Go mutex has no owner: the circle is deduced from the code.

Goroutine 1 is `[running]`: it is the main goroutine writing the dump. If it were blocked too, the Go runtime would stop the program by itself with `fatal error: all goroutines are asleep - deadlock!`. That check only works when every goroutine is stuck, which is rare in a real server.
