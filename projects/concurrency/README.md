# Concurrency

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Concurrency is the art of structuring a program as several activities that make progress in overlapping time and share state safely. It is where the hardest bugs live (race conditions, deadlocks, starvation), and each language answers it differently: locks and atomics, channels, actors or an event loop. Knowing the models makes it possible to pick one deliberately.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Counter race condition](counter-race/) | Why unsynchronised shared state loses updates, and four ways to fix it | available |
| [Deadlock: dining philosophers](dining-philosophers/) | The four conditions of deadlock and how breaking one removes it | available |
| [Ten thousand connections](ten-thousand-connections/) | How event loops, goroutines and BEAM processes handle many idle connections | available |

## Quiz and documentation

- Quiz questions: [quiz/content/concurrency/](../../quiz/content/concurrency/)
- Documentation: [docs/en/concurrency/](../../docs/en/concurrency/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Free. The talk and slides that separate the two ideas: concurrency is structure, parallelism is execution.
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/), Allen B. Downey. Free. A free book of synchronisation puzzles, from the mutex to dining philosophers and readers-writers.
- [Concorrência e Paralelismo (Parte 1)](https://akitaonrails.com/2019/03/13/akitando-43-concorrencia-e-paralelismo-parte-1-entendendo-back-end-para-iniciantes-parte-3/), Fabio Akita, Akitando. In Portuguese. Free. A video with full transcript in Portuguese on processes, threads and what they cost the operating system.
- [The Deadlock Empire](https://deadlockempire.github.io/), Petr Hudeček and Michal Pokorný. Free. A browser game in which you play the scheduler and break faulty concurrent programs.

### Books

- [Operating Systems: Three Easy Pieces (Concurrency part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Free online, paid in print. Free chapters on threads, locks, condition variables, semaphores and common concurrency bugs.
- [Java Concurrency in Practice](https://jcip.net/), Brian Goetz and others. Paid. The classic on thread safety, visibility, the memory model and thread pools.
- [Rust Atomics and Locks](https://mara.nl/atomics/), Mara Bos. Free online, paid in print. Free to read online: atomics, memory ordering and how to build a mutex and a channel from scratch.
- [Seven Concurrency Models in Seven Weeks](https://pragprog.com/titles/pb7con/seven-concurrency-models-in-seven-weeks/), Paul Butcher. Paid. Compares threads and locks, functional programming, actors, CSP and data parallelism on small examples.

### Courses and lectures

- [A Tour of Go: Concurrency](https://go.dev/tour/concurrency/1), The Go Authors. Free. Interactive exercises on goroutines, channels, select and mutexes.
- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Free. The synchronisation lectures cover locks, semaphores, monitors and deadlock with rigour.

### Papers and specifications

- [Communicating Sequential Processes](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf), C. A. R. Hoare (1978). Free. The paper behind channels in Go and many other languages: processes that only communicate by messages.
- [Making reliable distributed systems in the presence of software errors](https://erlang.org/download/armstrong_thesis_2003.pdf), Joe Armstrong (2003). Free. The thesis that explains the design of Erlang and the BEAM: isolated processes, messages and supervision.
- [The C10K problem](http://www.kegel.com/c10k.html), Dan Kegel. Free. The page that framed how one server can handle ten thousand clients, comparing I/O strategies.

### Official documentation

- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors. Free. The official rules for when one goroutine is guaranteed to see what another wrote.
- [The Rust Programming Language: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html), The Rust Project. Free. How ownership and the Send and Sync traits turn data races into compile errors.
- [Elixir: Processes](https://hexdocs.pm/elixir/processes.html), The Elixir Team. Free. The official guide to spawning processes, sending messages and keeping state in the actor model.
- [The Java Tutorials: Concurrency](https://docs.oracle.com/javase/tutorial/essential/concurrency/), Oracle. Free. Threads, synchronisation, liveness problems and the high-level concurrency utilities of Java.
- [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), OpenJS Foundation. Free. The official description of the phases of the event loop and where callbacks and promises run.

### Videos

- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ), Philip Roberts, JSConf EU. Free. The clearest visual explanation of the call stack, the task queue and the JavaScript event loop.
- [In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0), Jake Archibald, JSConf Asia. Free. A deeper look at tasks, microtasks and rendering in the browser event loop.
- [Concorrência e Paralelismo (Parte 2)](https://www.youtube.com/watch?v=gYJSWs-gp1g), Fabio Akita, Akitando. In Portuguese. Free. The second part of the series in Portuguese: how threads are coordinated and what they cost.

### Practice and tools

- [Go Data Race Detector](https://go.dev/doc/articles/race_detector), The Go Authors. Free. How to find data races automatically while running tests.

### Communities

- [Stack Overflow: concurrency tag](https://stackoverflow.com/questions/tagged/concurrency), Stack Overflow. Free. Answered questions on locks, visibility and deadlocks in every language.
- [Elixir Forum](https://elixirforum.com/), Elixir community. Free. A friendly forum for questions about processes, OTP and the BEAM.
