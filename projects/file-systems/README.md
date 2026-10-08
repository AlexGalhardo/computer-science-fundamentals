# File systems

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A file system turns a raw block device into named files and directories that survive a power failure. Below the familiar interface are allocation methods, i-nodes, free space management and journaling, and above it are the file organisations that databases use: records, indexes, B-trees and external sorting for data that does not fit in memory. Both halves are shaped by one fact: storage is slow, so the number of accesses is what counts.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| File organisation and indexes (`file-organisation`) | How records, free lists and indexes live inside a file | planned |
| External sorting (`external-sorting`) | How to sort a file larger than memory | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/file-systems/`).
- Documentation: planned (`docs/en/file-systems/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Operating Systems: Three Easy Pieces (Persistence part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Free online, paid in print. Free chapters on disks, RAID, files and directories, file system implementation, journaling and flash.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. In Portuguese. Free. The free Portuguese textbook has a full part on files, directories and allocation.
- [Files are hard](https://danluu.com/file-consistency/), Dan Luu. Free. A survey of how hard it is to write a file safely, with the research that found the bugs.

### Books

- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Paid. The source of the quiz for files, directories, allocation, free space and journaling.
- [Database Internals](https://www.databass.dev/), Alex Petrov. Paid. The first half is about on-disk structures: file formats, B-tree variants and log-structured storage.
- [Practical File System Design with the Be File System](http://www.nobius.org/dbg/practical-file-system-design.pdf), Dominic Giampaolo. Free. A book by the designer of a real file system, released as a free PDF on the author's site.

### Courses and lectures

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Free. The lectures on storage, B+ trees and external merge sort match the second half of this area.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Free. Labs on the xv6 file system: i-nodes, directories, the buffer cache and logging.

### Papers and specifications

- [A Fast File System for UNIX](https://dsf.berkeley.edu/cs262/FFS.pdf), McKusick, Joy, Leffler and Fabry (1984). Free. The paper that introduced cylinder groups and layout policies, the ancestor of ext2 to ext4.
- [The Design and Implementation of a Log-Structured File System](https://people.eecs.berkeley.edu/~brewer/cs262/LFS.pdf), Mendel Rosenblum and John Ousterhout (1992). Free. Writes everything sequentially to a log, the idea later used by flash storage and LSM trees.
- [The Ubiquitous B-Tree](https://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer (1979). Free. The classic survey of B-trees and B+ trees and why they suit disks.
- [The Google File System](https://research.google/pubs/the-google-file-system/), Ghemawat, Gobioff and Leung (2003). Free. How a file system is designed when files are huge and machines fail all the time.
- [All File Systems Are Not Created Equal](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/pillai), Pillai and others (2014). Free. A study of the crash-consistency assumptions applications make and file systems break.

### Official documentation

- [ext4 Data Structures and Algorithms](https://docs.kernel.org/filesystems/ext4/), kernel.org. Free. The on-disk layout of a production file system: block groups, i-nodes, extents and the journal.
- [SQLite Database File Format](https://www.sqlite.org/fileformat2.html), SQLite. Free. A complete, readable description of how tables and indexes are stored as B-tree pages in one file.
- [inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html), Linux man-pages project. Free. What an i-node stores: type, permissions, link count, sizes and timestamps.
- [PostgreSQL: Database Physical Storage](https://www.postgresql.org/docs/current/storage.html), PostgreSQL Global Development Group. Free. How a real database lays out pages, free space maps and large values in files.

### Videos

- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Free. The recorded lectures on storage, index structures and sorting.

### Practice and tools

- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Free. Simulators for disks, RAID, a very simple file system and journaling.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Free. A tutorial that stores rows in pages and then in a B-tree, close to the mini-projects of this area.

### Communities

- [Unix and Linux Stack Exchange: filesystems tag](https://unix.stackexchange.com/questions/tagged/filesystems), Stack Exchange. Free. Answered questions on i-nodes, links, journaling and file system behaviour.
- [LWN.net Kernel index](https://lwn.net/Kernel/Index/), LWN.net. Free online, paid in print. Years of careful articles on Linux file systems and storage, organised by topic.
