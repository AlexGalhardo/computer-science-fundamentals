# Operating systems

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

An operating system is the program that shares one machine among many programs: it gives each process the illusion of its own CPU and memory, mediates access to files and devices, and keeps programs from damaging each other. Understanding processes, scheduling, virtual memory, file systems and deadlocks explains most of the behaviour, and most of the performance problems, of real software.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [CPU scheduling simulator](cpu-scheduling/) | How scheduling policies trade waiting time, response time and fairness | available |
| [Paging and TLB simulator](paging-tlb/) | How virtual addresses are translated and what page replacement costs | available |
| [Memory allocator](memory-allocator/) | How allocation strategies fragment memory | available |
| [Deadlock detection and a mini shell](deadlock-mini-shell/) | Resource allocation graphs, the banker's algorithm, and processes with pipes | available |

## Quiz and documentation

- Quiz questions: [quiz/content/operating-systems/](../../quiz/content/operating-systems/)
- Documentation: [docs/en/operating-systems/](../../docs/en/operating-systems/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau, University of Wisconsin. Free online, paid in print. The friendliest OS textbook: short chapters on virtualisation, concurrency and persistence, with homework simulators.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. In Portuguese. Free. A complete, free textbook in Portuguese, with slides and exercises for every chapter.
- [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo), Carrie Anne Philbin, Crash Course. Free. Episodes 18 to 20 give a ten-minute overview of operating systems, memory and files before the books.

### Books

- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Paid. The textbook the quiz follows (in its 4th edition): processes, memory, file systems, I/O, deadlocks and virtualisation.
- [Operating System Concepts, 10th edition](https://www.os-book.com/OS10/), Silberschatz, Galvin and Gagne. Paid. The other classic textbook; its site offers the slides and practice exercises for free.
- [The Linux Programming Interface](https://man7.org/tlpi/), Michael Kerrisk. Paid. The definitive guide to Linux system calls: processes, signals, pipes, files and memory mappings.
- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. Paid. Explains virtual memory, exceptions, processes and dynamic memory allocation from the programmer's side.

### Courses and lectures

- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Free. Slides, readings and the Pintos projects of a full OS course.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Free. A lab-driven course built around xv6, a small Unix-like teaching kernel for RISC-V.
- [Sistemas Operacionais](https://www.youtube.com/playlist?list=PLxI8Can9yAHeK7GUEGxMsqoPRmJKwI9Jw), UNIVESP. In Portuguese. Free. A full undergraduate course in Portuguese on processes, scheduling, memory and file systems.

### Papers and specifications

- [The UNIX Time-Sharing System](https://dsf.berkeley.edu/cs262/unix.pdf), Dennis Ritchie and Ken Thompson (1974). Free. The paper that introduced files as byte streams, the shell, pipes and fork, in a few readable pages.
- [xv6: a simple, Unix-like teaching operating system](https://pdos.csail.mit.edu/6.1810/2024/xv6/book-riscv-rev4.pdf), Russ Cox, Frans Kaashoek and Robert Morris. Free. A short book that walks through the source of a complete small kernel, line by line.

### Official documentation

- [Linux man-pages online](https://man7.org/linux/man-pages/), Michael Kerrisk and the man-pages project. Free. The authoritative description of every system call and library function, such as fork, mmap and pipe.
- [The Linux Kernel documentation](https://docs.kernel.org/), kernel.org. Free. Official documentation of the scheduler, memory management and file systems of a production kernel.

### Practice and tools

- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Free. Small Python simulators for scheduling, paging, TLBs and disks, close to the mini-projects of this area.
- [xv6-riscv](https://github.com/mit-pdos/xv6-riscv), MIT PDOS. Free. The source of the teaching kernel, small enough to read completely.
- [Writing an OS in Rust](https://os.phil-opp.com/), Philipp Oppermann. Free. A blog series that builds a small kernel step by step: boot, interrupts, paging and heap allocation.

### Communities

- [r/osdev](https://www.reddit.com/r/osdev/), Reddit. Free. A community of people writing their own kernels, good for low-level questions.
- [Stack Overflow: operating-system tag](https://stackoverflow.com/questions/tagged/operating-system), Stack Overflow. Free. Answered conceptual and practical questions about processes, memory and system calls.
