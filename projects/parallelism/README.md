# Parallelism

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Parallelism is running computations at the same time on several cores, vector lanes or machines to finish sooner. Processors stopped getting faster one core at a time, so speed now comes from dividing work well. Amdahl's law, false sharing and memory bandwidth explain why doubling the cores rarely doubles the speed, and how to get closer to it.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Scaling by cores](scaling-by-cores/) | How much a program speeds up with more cores, and why not linearly | available |

## Quiz and documentation

- Quiz questions: [quiz/content/parallelism/](../../quiz/content/parallelism/)
- Documentation: [docs/en/parallelism/](../../docs/en/parallelism/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial), Lawrence Livermore National Laboratory. Free. A long, plain tutorial on the concepts: memory architectures, programming models, speed-up and its limits.
- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Free. Clears up the difference between structuring a program concurrently and executing it in parallel.
- [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law), Wikipedia. Free. The formula, its derivation and its relation to Gustafson's law, with the usual graph.

### Books

- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Free. A free online book on CPU caches, SIMD, branch prediction and how to measure them.
- [Is Parallel Programming Hard, And, If So, What Can You Do About It?](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html), Paul E. McKenney. Free. A free book by a Linux kernel developer on counting, locking, partitioning and scalability.
- [An Introduction to Parallel Programming, 2nd edition](https://shop.elsevier.com/books/an-introduction-to-parallel-programming/pacheco/978-0-12-804605-0), Peter Pacheco and Matthew Malensek. Paid. A first textbook on shared and distributed memory programming with Pthreads, OpenMP and MPI.

### Courses and lectures

- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare, Charles Leiserson and Julian Shun. Free. Lectures on multicore programming, races, work stealing, cache-efficient algorithms and measurement.
- [CS 149 Parallel Computing](https://gfxcourses.stanford.edu/cs149/fall23), Stanford University, Kayvon Fatahalian and Kunle Olukotun. Free. Slides on task and data parallelism, SIMD, GPUs, scheduling and performance analysis.
- [CMU 15-418 Parallel Computer Architecture and Programming](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/), Carnegie Mellon University. Free. The course that pairs each abstraction with the hardware below it, with lecture slides online.

### Papers and specifications

- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), Jeffrey Dean and Sanjay Ghemawat, Google (2004). Free. The paper that made map and reduce the model for processing data on thousands of machines.
- [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf), Ulrich Drepper (2007). Free. A deep reference on CPU caches, cache lines and false sharing in multithreaded code.
- [The Free Lunch Is Over](http://www.gotw.ca/publications/concurrency-ddj.htm), Herb Sutter (2005). Free. The article that announced the end of free single-core speed-ups and the turn to multicore.
- [Cilk: An Efficient Multithreaded Runtime System](https://dspace.mit.edu/handle/1721.1/149259), Blumofe, Joerg, Kuszmaul, Leiserson, Randall and Zhou (1995). Free. The paper on the runtime whose work-stealing scheduler was later adopted by Go, Rayon and the Java fork-join pool.

### Official documentation

- [Rayon](https://docs.rs/rayon/latest/rayon/), Rayon developers. Free. Documentation of the data parallelism library for Rust: parallel iterators and join.
- [The Java Tutorials: Fork/Join](https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html), Oracle. Free. A short official example of dividing a task recursively on a work-stealing pool.
- [OpenMP specifications](https://www.openmp.org/specifications/), OpenMP Architecture Review Board. Free. The standard for parallel loops and tasks in C, C++ and Fortran, with examples documents.
- [Rust core::arch](https://doc.rust-lang.org/core/arch/index.html), The Rust Project. Free. The official reference for SIMD intrinsics in Rust, with an overview of how to detect CPU features.

### Videos

- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Free. The recorded lectures, including the ones on Cilk, races and the analysis of multithreaded algorithms.

### Practice and tools

- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Free. The command-line benchmarking tool used in this repository: warm-up, several runs and statistics.
- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Free. Shows the assembly a compiler generates, the quickest way to see whether a loop was vectorised.

### Communities

- [Stack Overflow: parallel-processing tag](https://stackoverflow.com/questions/tagged/parallel-processing), Stack Overflow. Free. Practical questions on why parallel code does not scale and how to fix it.
- [r/HPC](https://www.reddit.com/r/HPC/), Reddit. Free. A community on high-performance computing, clusters and parallel programming.
