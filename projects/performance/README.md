# Performance

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Performance engineering is measuring before changing: defining what fast means (latency percentiles, throughput), producing a realistic load, finding where the time goes with a profiler, and only then optimising. It connects several layers, from CPU caches and memory locality to runtime behaviour, database queries and the capacity of a whole service, and it depends on a sound benchmarking method to avoid fooling yourself.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Bun against Node (`bun-vs-node`) | How runtime and process model change throughput | planned |
| Load test scenarios with k6 (`k6-scenarios`) | What load, stress, spike and soak tests each reveal | planned |
| Cache-friendly matrix multiplication (`cache-friendly-matrix`) | How memory locality changes speed with the same Big O | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/performance/`).
- Documentation: planned (`docs/en/performance/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Free. The official guide to virtual users, stages, thresholds and checks, with a page on each test type.
- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg. Free. A checklist for any resource: utilisation, saturation and errors, a first method for finding bottlenecks.
- [How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU), Gil Tene. Free. The talk on percentiles, why averages hide the problem and the coordinated omission mistake.

### Books

- [Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html), Brendan Gregg. Paid. The reference on methodology and on CPU, memory, file system, disk and network analysis in Linux.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Free. A free online book on CPU caches, memory layout, SIMD and benchmarking, with matrix multiplication as a case.
- [Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book), Denis Bakhvalov. Free. A free book on measuring with hardware counters, profiling and fixing cache misses and branch mispredictions.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Free. The practical guide to database indexes and to reading execution plans.

### Courses and lectures

- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare. Free. Starts by speeding up matrix multiplication step by step, then covers measurement and caches.

### Papers and specifications

- [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf), Ulrich Drepper (2007). Free. The deep reference on CPU caches, TLBs and how data layout decides speed.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Free. The author's page on how flame graphs are built and read, with links to his article and talks.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Free. Why high percentiles matter more as a system grows, and techniques to tame them.
- [Producing Wrong Data Without Doing Anything Obviously Wrong!](https://users.cs.northwestern.edu/~robby/courses/322-2013-spring/mytkowicz-wrong-data.pdf), Mytkowicz, Diwan, Hauswirth and Sweeney (2009). Free. Shows how environment size and link order bias benchmarks, a lesson in measurement method.
- [Latency Numbers Every Programmer Should Know](https://gist.github.com/jboner/2841832), Jonas Bonér, after Jeff Dean and Peter Norvig. Free. The table of orders of magnitude, from a cache reference to a packet across the ocean.

### Official documentation

- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group. Free. How to read a query plan and find a missing index.
- [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), OpenJS Foundation. Free. The official explanation of why one slow callback hurts every client of a Node.js server.
- [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/), PM2. Free. How one Node.js application is spread over all CPU cores.
- [Bun documentation](https://bun.sh/docs), Oven. Free. The runtime compared with Node.js in the mini-project.
- [perf: Linux profiling with performance counters](https://perfwiki.github.io/main/), Linux perf community. Free. The wiki of the Linux perf tool, with a tutorial on sampling and counting events.

### Videos

- [Performance Matters](https://www.youtube.com/watch?v=r-TLSBdHe1A), Emery Berger, Strange Loop. Free. A talk on why naive benchmarks mislead and how to measure and profile soundly.
- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Free. The recorded lectures of the course above.

### Practice and tools

- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Free. The benchmarking tool of this repository: warm-up runs, repetitions and statistical summary.
- [FlameGraph](https://github.com/brendangregg/FlameGraph), Brendan Gregg. Free. The original scripts that turn profiler stack samples into a flame graph.

### Communities

- [Stack Overflow: performance tag](https://stackoverflow.com/questions/tagged/performance), Stack Overflow. Free. Famous canonical answers on branch prediction, cache effects and measurement.
- [Brendan Gregg's Blog](https://www.brendangregg.com/blog/), Brendan Gregg. Free. Posts on performance analysis, tools and methodology by the author of flame graphs.
