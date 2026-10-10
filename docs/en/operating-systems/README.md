# Operating systems

> Versão em português: [docs/pt/operating-systems/README.md](../../pt/operating-systems/README.md) · Versión en español: [docs/es/operating-systems/README.md](../../es/operating-systems/README.md)

The area has a quiz of 100 questions (`quiz/content/operating-systems/`) and four mini-projects. Source: Tanenbaum, Modern Operating Systems (4th edition), and the MINIX book.

| Mini-project | Teaches | Languages | Quiz topics |
| --- | --- | --- | --- |
| [CPU scheduling simulator](cpu-scheduling.md) | how FCFS, SJF, round-robin, priority and multilevel feedback trade waiting, turnaround and response time | TypeScript, Python | `scheduling` |
| [Paging and TLB simulator](paging-tlb.md) | address translation, TLB hits and misses, page replacement and Belady's anomaly | TypeScript, Rust | `memory-management` |
| [Memory allocator](memory-allocator.md) | first fit, best fit, worst fit and the buddy system, external and internal fragmentation, coalescing | C++, Rust | `memory-management` |
| [Deadlock detection and a mini shell](deadlock-mini-shell.md) | resource allocation graphs, the banker's algorithm, and processes with `fork`, `exec`, pipes and signals | Go, C++ | `deadlocks`, `introduction-and-system-calls`, `processes-and-threads` |

Every mini-project runs with Docker only: `./setup-unix-<name>.sh` or `./setup-windows-<name>.ps1` inside its folder under `projects/operating-systems/`.
