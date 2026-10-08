# References

> Versão em português: [REFERENCES.pt-BR.md](REFERENCES.pt-BR.md)

The main sources for studying and going deeper into every area of this repository, grouped by area in the same order as the area index of [PLAN.md](PLAN.md).

## How this list was built

- It comes from a web search across official sites and documentation, university courses with public material, textbooks, original papers and specifications (RFCs and the like), free books, video series and communities.
- Primary and durable sources come first: the paper that introduced an idea, the specification that defines a protocol, the textbook the quiz follows, the official manual of a tool.
- Every link was checked when the list was written: a script requested each one, and it had to answer successfully and be the page it claims to be. The few sites that refuse scripts were confirmed through their public feed or API, or by opening the page. Links that could not be checked were left out.
- Books point to the page of the author or of the publisher, or to an encyclopedia article when the book is out of the catalogue, never to an unofficial copy. "Free online, paid in print" means the author or publisher offers the text legally on the web.
- Papers point to a copy that is open to read, on the site of an author, a publisher, an institution or a university course.
- Descriptions are written for this repository. Nothing is copied from the sources.
- Sources in Portuguese are marked "In Portuguese". All others are in English.
- Security references are defensive: how flaws happen and how to prevent them.

## How to use it

- Pick an area. Each section below has its main references, and each area with mini-projects has a longer list in `projects/<area>/README.md`, grouped as: Start here, Books, Courses and lectures, Papers and specifications, Official documentation, Videos, Practice and tools, Communities.
- Begin with one or two sources, not all of them. In the area READMEs, "Start here" is chosen for a first contact.
- Pair the reading with the quiz in `quiz/` and with the mini-project of the area: read, answer, run, measure.
- The list is selected, not exhaustive, and links age. If one breaks, open an issue or a pull request.

## General and cross-area

### Start here

- [CS50x: Introduction to Computer Science](https://cs50.harvard.edu/x/), Harvard University, David J. Malan. Free. The best-known first course in computer science, with lectures, problem sets and notes all public.
- [Teach Yourself Computer Science](https://teachyourselfcs.com/), Oz Nova and Myles Byrne. Free. A short, opinionated list of one book and one video course for each of nine core subjects.
- [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/), MIT CSAIL. Free. Shell, editors, Git, debugging and profiling: the tools that degrees assume and rarely teach.
- [Computer Science Roadmap](https://roadmap.sh/computer-science), roadmap.sh. Free. A visual map of the topics of a computer science degree, useful to see what is still missing.

### Books

- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. Paid. The standard book on how programs really run: data representation, machine code, memory, linking and concurrency.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. The reference book for storage, replication, transactions, streams and the trade-offs of distributed data systems.
- [The Architecture of Open Source Applications](https://aosabook.org/en/), edited by Amy Brown and Greg Wilson. Free. Authors of real open source systems explain how they are built and what they would change.
- [Free Programming Books](https://github.com/EbookFoundation/free-programming-books), Free Ebook Foundation. Free. A large community index of legally free books and courses, in many languages including Portuguese.

### Courses and lectures

- [OSSU Computer Science curriculum](https://github.com/ossu/computer-science), Open Source Society University. Free. A full degree-like path built only from free online courses, in a suggested order.
- [Universidade Brasileira Livre: Ciência da Computação](https://github.com/Universidade-Livre/ciencia-da-computacao), Universidade Brasileira Livre. In Portuguese. Free. A Brazilian curriculum in the spirit of OSSU, built from free courses in Portuguese.
- [MIT OpenCourseWare](https://ocw.mit.edu/), Massachusetts Institute of Technology. Free. Lecture videos, notes and exams of real MIT courses, the source of many courses listed below.
- [UNIVESP on YouTube](https://www.youtube.com/@univesptv), Universidade Virtual do Estado de São Paulo. In Portuguese. Free. Complete undergraduate courses in Portuguese, including data structures, operating systems, networks and databases.
- [Curso em Vídeo](https://www.cursoemvideo.com/), Gustavo Guanabara. In Portuguese. Free. Free beginner courses in Portuguese on programming logic, Python, Java, Git and networks.

### Papers and specifications

- [Papers We Love](https://paperswelove.org/), Papers We Love community. Free. A community that collects and discusses classic computer science papers, a good door into primary sources.

### Videos

- [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo), Carrie Anne Philbin, Crash Course. Free. Forty short episodes going from transistors to operating systems, networks and artificial intelligence.
- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Free. Researchers explain single ideas of computer science in ten-minute videos.
- [Akitando](https://www.youtube.com/@Akitando), Fabio Akita. In Portuguese. Free. Long, deep videos in Portuguese on fundamentals: back end, concurrency, memory, networks, cryptography and career.
- [Código Fonte TV](https://www.youtube.com/@codigofontetv), Gabriel Fróes and Vanessa Weber. In Portuguese. Free. Short Portuguese videos that define terms and technologies, good for a first contact with a topic.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Free. Animated explanations of system design topics such as caches, queues, load balancers and protocols.

### Practice and tools

- [Build your own X](https://github.com/codecrafters-io/build-your-own-x), CodeCrafters community. Free. An index of tutorials for rebuilding a database, a shell, an interpreter and many other tools from scratch.
- [The System Design Primer](https://github.com/donnemartin/system-design-primer), Donne Martin. Free. A structured summary of scalability topics with diagrams and worked design exercises.
- [AkitaOnRails](https://akitaonrails.com/), Fabio Akita. In Portuguese. Free. The blog behind the Akitando channel, with the transcripts and references of every video.

### Communities

- [Hacker News](https://news.ycombinator.com/), Y Combinator. Free. Daily links and discussion by practitioners, where many classic papers and posts resurface.
- [Lobsters](https://lobste.rs/), Lobsters community. Free. A smaller, tag-organised link community focused on programming and computer science.
- [Computer Science Stack Exchange](https://cs.stackexchange.com/), Stack Exchange. Free. Questions and answers on the theory side: algorithms, complexity, automata and data structures.
- [r/compsci](https://www.reddit.com/r/compsci/), Reddit. Free. General computer science subreddit, good for reading recommendations and conceptual questions.
- [TabNews](https://www.tabnews.com.br/), Filipe Deschamps and community. In Portuguese. Free. A Brazilian community of posts and discussions about programming, in Portuguese.

## Big O and algorithm analysis

Algorithm analysis is the tool for predicting how the cost of a program grows with the size of its input, before running it. It gives the vocabulary (O, Ω, Θ), the techniques (counting operations, recurrences, amortised analysis) and the limits (lower bounds, P and NP) that every other area in this repository relies on when it says that something is fast or slow.

- [Asymptotic notation](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation), Khan Academy, with Thomas Cormen and Devin Balkcom. Free. A gentle first reading on why constants are dropped and what O, Ω and Θ mean.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/), Eric Rowell. Free. One page with the time and space cost of common data structure operations and sorting algorithms.
- [Análise de Algoritmos](https://www.ime.usp.br/~pf/analise_de_algoritmos/), Paulo Feofiloff, IME-USP. In Portuguese. Free. Lecture notes in Portuguese covering notation, recurrences, invariants and proofs of correctness with rigour.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Paid. The standard reference: chapters 2 to 4 for notation and recurrences, 16 for amortised analysis, 34 for NP-completeness.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Free online, paid in print. A free textbook with a clear treatment of recursion, recurrences and NP-hardness, plus many exercises.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare, Demaine, Ku and Solomon. Free. Lectures, notes and problem sets that use asymptotic analysis on every data structure and algorithm.
- [Master theorem (analysis of algorithms)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29), Wikipedia. Free. A compact statement of the three cases with worked examples and the cases the theorem does not cover.
- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Free. The recorded lectures of the course above, starting from the model of computation and asymptotic notation.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Free. Whiteboard lectures that count operations step by step and solve recurrences by hand.
- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Free. Step-by-step animations where the cost of each operation can be watched as the input changes.
- [Computer Science Stack Exchange: asymptotics tag](https://cs.stackexchange.com/questions/tagged/asymptotics), Stack Exchange. Free. Answered questions about notation and proofs, including the reference threads on solving recurrences.

Full list and mini-projects: [projects/big-o/README.md](projects/big-o/README.md)

## Data structures

Data structures are the ways of organising data in memory and on disk so that the operations a program needs are cheap. Choosing between an array, a linked list, a hash table, a balanced tree or a graph is usually the decision that most changes the cost of a program, and it is the base of databases, compilers, operating systems and networks.

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Free. Animations of lists, heaps, hash tables, search trees and graph traversals, with quizzes.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html), David Galles, University of San Francisco. Free. Interactive pages where you insert and remove keys and watch AVL, red-black and B-trees rebalance.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. In Portuguese. Free. Notes in Portuguese on lists, stacks, queues, trees, heaps and hashing, with short C code.
- [Open Data Structures](https://opendatastructures.org/), Pat Morin. Free. A free textbook that implements and analyses each structure, with editions in Java, C++ and pseudocode.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Free online, paid in print. The book site has summaries, Java code and exercises for symbol tables, balanced trees, hashing and graphs.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Free. The first half is a data structures course: sequences, sets, hashing, binary trees, AVL and heaps.
- [CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/), Josh Hug, UC Berkeley. Free. A complete course with videos, an online textbook and autograded projects in Java.
- [Estrutura de Dados](https://www.youtube.com/playlist?list=PLxI8Can9yAHf8k8LrUePyj0y3lLpigGcl), UNIVESP. In Portuguese. Free. A full undergraduate course in Portuguese using C: lists, stacks, queues, trees and sorting.
- [Organization and Maintenance of Large Ordered Indices](https://infolab.usc.edu/csci585/Spring2010/den_ar/indexing.pdf), Rudolf Bayer and Edward McCreight (1970). Free. The Boeing research report, published as a paper in 1972, that introduced the B-tree, the origin of every database index.
- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Free. Recorded lectures on dynamic arrays, hashing, binary heaps, AVL trees and graph search.
- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Free. Clear articles with code for segment trees, Fenwick trees, disjoint sets, tries and graph algorithms.
- [Stack Overflow: data-structures tag](https://stackoverflow.com/questions/tagged/data-structures), Stack Overflow. Free. A large archive of practical questions on choosing and implementing structures.

Full list and mini-projects: [projects/data-structures/README.md](projects/data-structures/README.md)

## Operating systems

An operating system is the program that shares one machine among many programs: it gives each process the illusion of its own CPU and memory, mediates access to files and devices, and keeps programs from damaging each other. Understanding processes, scheduling, virtual memory, file systems and deadlocks explains most of the behaviour, and most of the performance problems, of real software.

- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau, University of Wisconsin. Free online, paid in print. The friendliest OS textbook: short chapters on virtualisation, concurrency and persistence, with homework simulators.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. In Portuguese. Free. A complete, free textbook in Portuguese, with slides and exercises for every chapter.
- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Paid. The textbook the quiz follows (in its 4th edition): processes, memory, file systems, I/O, deadlocks and virtualisation.
- [Operating System Concepts, 10th edition](https://www.os-book.com/OS10/), Silberschatz, Galvin and Gagne. Paid. The other classic textbook; its site offers the slides and practice exercises for free.
- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Free. Slides, readings and the Pintos projects of a full OS course.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Free. A lab-driven course built around xv6, a small Unix-like teaching kernel for RISC-V.
- [The UNIX Time-Sharing System](https://dsf.berkeley.edu/cs262/unix.pdf), Dennis Ritchie and Ken Thompson (1974). Free. The paper that introduced files as byte streams, the shell, pipes and fork, in a few readable pages.
- [Linux man-pages online](https://man7.org/linux/man-pages/), Michael Kerrisk and the man-pages project. Free. The authoritative description of every system call and library function, such as fork, mmap and pipe.
- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Free. Small Python simulators for scheduling, paging, TLBs and disks, close to the mini-projects of this area.
- [r/osdev](https://www.reddit.com/r/osdev/), Reddit. Free. A community of people writing their own kernels, good for low-level questions.

Full list and mini-projects: [projects/operating-systems/README.md](projects/operating-systems/README.md)

## Networks

Computer networks are the layers of protocols that move bytes between machines: from signals on a wire, through frames, packets and routes, up to reliable connections and the applications built on them. Almost every program today talks to another one, so knowing what TCP, IP, DNS and Ethernet actually guarantee is what separates guessing from diagnosing.

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/), Larry Peterson and Bruce Davie. Free. A full, open textbook that explains each layer through the design problems it solves.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), Brian "Beej" Hall. Free. The classic hands-on introduction to sockets in C: addresses, TCP, UDP and select.
- [How DNS works](https://howdns.works/), DNSimple. Free. A short comic that follows one name resolution from the browser to the root servers.
- [Computer Networking: A Top-Down Approach, 9th edition](https://gaia.cs.umass.edu/kurose_ross/index.php), Jim Kurose and Keith Ross. Free online, paid in print. The most used textbook; the authors' site gives free video lectures, slides and Wireshark labs.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Paid. The bottom-up textbook the quiz follows (in its 5th edition), strong on the data link and MAC layers.
- [CS 144 Introduction to Computer Networking](https://cs144.github.io/), Stanford University. Free. Lecture notes and labs in which you build a working TCP implementation step by step.
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Free. The current TCP specification: header, state machine, sequence numbers and retransmission.
- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), Paul Mockapetris, IETF. Free. The design of DNS: the name space, zones, resolvers and iterative and recursive queries.
- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), Wireshark Foundation. Free. Official guide to capturing and reading packets, the best way to see the protocols for real.
- [Networking tutorial](https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW), Ben Eater. Free. Thirteen short videos building up from bits on a wire to Ethernet, IP, routing and TCP.
- [Network Engineering Stack Exchange](https://networkengineering.stackexchange.com/), Stack Exchange. Free. Questions and answers on protocols, subnetting, switching and routing.

Full list and mini-projects: [projects/networks/README.md](projects/networks/README.md)

## Databases (theory)

Database theory explains how data is modelled as relations, queried with a declarative language and stored so that queries stay fast and data stays correct. The relational model, relational algebra, normalisation, indexes and query optimisation are the ideas behind every SQL database, and they are what lets a developer design a schema and read a query plan instead of guessing.

- [SQLBolt](https://sqlbolt.com/), SQLBolt. Free. Short interactive lessons that teach SQL by running queries in the browser.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Free. A free online book on how B-tree indexes work and how to write queries that use them.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Free. A tutorial that writes a small SQLite clone in C, from the REPL to the B-tree on disk.
- [Database System Concepts, 7th edition](https://db-book.com/), Silberschatz, Korth and Sudarshan. Paid. A complete textbook; the site offers free slides and practice exercises for every chapter.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Free. Slides, notes, videos and projects on storage, indexes, query execution, optimisation and concurrency.
- [CS 186 Introduction to Database Systems](https://cs186berkeley.net/), UC Berkeley. Free. Course notes and exercises on relational algebra, joins, query optimisation and normalisation.
- [A Relational Model of Data for Large Shared Data Banks](https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf), Edgar F. Codd (1970). Free. The paper that proposed relations, keys and normal forms and started relational databases.
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf), Hellerstein, Stonebraker and Hamilton (2007). Free. A long survey of how a real relational DBMS is organised, from the parser to the storage manager.
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), PostgreSQL Global Development Group. Free. The clearest manual of a real system: SQL, indexes, the planner and EXPLAIN.
- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Free. The recorded lectures of 15-445 and 15-721, plus talks by database engineers.
- [RelaX: relational algebra calculator](https://dbis-uibk.github.io/relax/), University of Innsbruck. Free. Runs relational algebra expressions on sample data and shows the operator tree.
- [Database Administrators Stack Exchange](https://dba.stackexchange.com/), Stack Exchange. Free. Questions and answers on schema design, normalisation, indexes and query plans.

Full list and mini-projects: [projects/databases/README.md](projects/databases/README.md)

## Algorithms

Algorithms are the step-by-step methods for solving a problem: sorting, searching, finding the shortest path, choosing the best combination. Studying them teaches a small set of design techniques (divide and conquer, greedy choice, dynamic programming, backtracking) that turn problems that look impossible at scale into programs that finish.

- [Algorithms](https://www.khanacademy.org/computing/computer-science/algorithms), Khan Academy, with Thomas Cormen and Devin Balkcom. Free. A gentle unit with text and exercises on binary search, the classic sorts, recursion and graph search.
- [VisuAlgo: Sorting](https://visualgo.net/en/sorting), Steven Halim, National University of Singapore. Free. Animates each sorting algorithm on your own input and counts comparisons and swaps.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. In Portuguese. Free. Notes in Portuguese on searching, the classic sorts, heapsort, quicksort and backtracking, with invariants.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Paid. The standard reference for sorting, dynamic programming, greedy algorithms and graph algorithms.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Free online, paid in print. Very practical on sorting: the book site compares the algorithms and gives tested Java code.
- [The Algorithm Design Manual, 3rd edition](https://www.algorist.com/), Steven Skiena. Paid. Teaches how to recognise which technique fits a problem, with a catalogue of classic problems.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Free. Lectures and problem sets on sorting, shortest paths and a clear framework for dynamic programming.
- [Algorithms, Part I](https://www.coursera.org/learn/algorithms-part1), Robert Sedgewick and Kevin Wayne, Princeton (Coursera). Free to audit, paid certificate. Video course on union-find, the sorting algorithms, priority queues and search trees, with graded programming tasks.
- [Timsort: listsort.txt](https://github.com/python/cpython/blob/main/Objects/listsort.txt), Tim Peters, CPython. Free. The author's own description of the hybrid merge sort used by Python, with measurements.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Free. Whiteboard lectures on divide and conquer, greedy method, dynamic programming and backtracking.
- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Free. Reference articles with proofs and code for graph algorithms, dynamic programming and more.
- [Codeforces](https://codeforces.com/), Mike Mirzayanov. Free. Contests and a very active community with editorials that explain each solution.

Full list and mini-projects: [projects/algorithms/README.md](projects/algorithms/README.md)

## Concurrency

Concurrency is the art of structuring a program as several activities that make progress in overlapping time and share state safely. It is where the hardest bugs live (race conditions, deadlocks, starvation), and each language answers it differently: locks and atomics, channels, actors or an event loop. Knowing the models makes it possible to pick one deliberately.

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Free. The talk and slides that separate the two ideas: concurrency is structure, parallelism is execution.
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/), Allen B. Downey. Free. A free book of synchronisation puzzles, from the mutex to dining philosophers and readers-writers.
- [Concorrência e Paralelismo (Parte 1)](https://akitaonrails.com/2019/03/13/akitando-43-concorrencia-e-paralelismo-parte-1-entendendo-back-end-para-iniciantes-parte-3/), Fabio Akita, Akitando. In Portuguese. Free. A video with full transcript in Portuguese on processes, threads and what they cost the operating system.
- [Operating Systems: Three Easy Pieces (Concurrency part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Free online, paid in print. Free chapters on threads, locks, condition variables, semaphores and common concurrency bugs.
- [Java Concurrency in Practice](https://jcip.net/), Brian Goetz and others. Paid. The classic on thread safety, visibility, the memory model and thread pools.
- [Rust Atomics and Locks](https://mara.nl/atomics/), Mara Bos. Free online, paid in print. Free to read online: atomics, memory ordering and how to build a mutex and a channel from scratch.
- [Communicating Sequential Processes](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf), C. A. R. Hoare (1978). Free. The paper behind channels in Go and many other languages: processes that only communicate by messages.
- [Making reliable distributed systems in the presence of software errors](https://erlang.org/download/armstrong_thesis_2003.pdf), Joe Armstrong (2003). Free. The thesis that explains the design of Erlang and the BEAM: isolated processes, messages and supervision.
- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors. Free. The official rules for when one goroutine is guaranteed to see what another wrote.
- [The Rust Programming Language: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html), The Rust Project. Free. How ownership and the Send and Sync traits turn data races into compile errors.
- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ), Philip Roberts, JSConf EU. Free. The clearest visual explanation of the call stack, the task queue and the JavaScript event loop.
- [Stack Overflow: concurrency tag](https://stackoverflow.com/questions/tagged/concurrency), Stack Overflow. Free. Answered questions on locks, visibility and deadlocks in every language.

Full list and mini-projects: [projects/concurrency/README.md](projects/concurrency/README.md)

## Parallelism

Parallelism is running computations at the same time on several cores, vector lanes or machines to finish sooner. Processors stopped getting faster one core at a time, so speed now comes from dividing work well. Amdahl's law, false sharing and memory bandwidth explain why doubling the cores rarely doubles the speed, and how to get closer to it.

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial), Lawrence Livermore National Laboratory. Free. A long, plain tutorial on the concepts: memory architectures, programming models, speed-up and its limits.
- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Free. Clears up the difference between structuring a program concurrently and executing it in parallel.
- [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law), Wikipedia. Free. The formula, its derivation and its relation to Gustafson's law, with the usual graph.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Free. A free online book on CPU caches, SIMD, branch prediction and how to measure them.
- [Is Parallel Programming Hard, And, If So, What Can You Do About It?](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html), Paul E. McKenney. Free. A free book by a Linux kernel developer on counting, locking, partitioning and scalability.
- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare, Charles Leiserson and Julian Shun. Free. Lectures on multicore programming, races, work stealing, cache-efficient algorithms and measurement.
- [CS 149 Parallel Computing](https://gfxcourses.stanford.edu/cs149/fall23), Stanford University, Kayvon Fatahalian and Kunle Olukotun. Free. Slides on task and data parallelism, SIMD, GPUs, scheduling and performance analysis.
- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), Jeffrey Dean and Sanjay Ghemawat, Google (2004). Free. The paper that made map and reduce the model for processing data on thousands of machines.
- [Rayon](https://docs.rs/rayon/latest/rayon/), Rayon developers. Free. Documentation of the data parallelism library for Rust: parallel iterators and join.
- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Free. The recorded lectures, including the ones on Cilk, races and the analysis of multithreaded algorithms.
- [Stack Overflow: parallel-processing tag](https://stackoverflow.com/questions/tagged/parallel-processing), Stack Overflow. Free. Practical questions on why parallel code does not scale and how to fix it.
- [Cilk: An Efficient Multithreaded Runtime System](https://dspace.mit.edu/handle/1721.1/149259), Blumofe, Joerg, Kuszmaul, Leiserson, Randall and Zhou (1995). Free. The paper on the runtime whose work-stealing scheduler was later adopted by Go, Rayon and the Java fork-join pool.

Full list and mini-projects: [projects/parallelism/README.md](projects/parallelism/README.md)

## Transactions

A transaction groups several operations so that they succeed or fail together and do not corrupt each other when they run at the same time. ACID, isolation levels, locking, multiversion concurrency and the write-ahead log are how databases keep that promise, and sagas, the outbox pattern and idempotency are how applications keep it across services, where one database transaction is no longer available.

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group. Free. The official table of which anomalies each level prevents, with examples of what really happens.
- [Consistency Models](https://jepsen.io/consistency), Kyle Kingsbury, Jepsen. Free. A clickable map of consistency and isolation models, each with a short precise definition.
- [Transactions: myths, surprises and opportunities](https://www.youtube.com/watch?v=5ZjhNTM8XU8), Martin Kleppmann, Strange Loop. Free. A talk showing what ACID and the isolation level names really mean in different databases.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. The chapters on transactions, distributed systems trouble and consistency are the best modern summary.
- [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/), Bernstein, Hadzilacos and Goodman. Free. The classic text on serialisability, two-phase locking, multiversion control and recovery, free from the author.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Free. Lectures on concurrency control theory, two-phase locking, MVCC, logging and recovery.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS, Robert Morris and Frans Kaashoek. Free. Lectures, papers and labs on replication, two-phase commit and consistency, with Raft built by hand.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil (1995). Free. The paper that showed the standard levels are ambiguous and defined snapshot isolation and write skew.
- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem (1987). Free. The origin of the saga: a long transaction split into steps, each with a compensating action.
- [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), PostgreSQL Global Development Group. Free. The chapter on MVCC, explicit locking, deadlocks and serialisation failure handling.
- [Hermitage: testing transaction isolation levels](https://github.com/ept/hermitage), Martin Kleppmann. Free. A test suite that shows which anomalies each isolation level of real databases actually allows.
- [Database Administrators Stack Exchange: transaction tag](https://dba.stackexchange.com/questions/tagged/transaction), Stack Exchange. Free. Answered questions on isolation, locking and deadlocks in real systems.

Full list and mini-projects: [projects/transactions/README.md](projects/transactions/README.md)

## Security

Application security is about understanding how software fails when someone tries to misuse it, so that it can be built not to. This area is defensive: each flaw (injection, cross-site scripting, broken access control, weak password storage) is studied to explain why it happens and how to prevent it, following the OWASP guidance. The labs run only locally, in Docker, and always ship the fix together with the flaw.

- [OWASP Top 10](https://top10.owasp.org/), OWASP Foundation. Free. The reference list of the most critical web application risks, with the current edition and the earlier ones, each risk with examples and prevention advice.
- [OWASP Top 10 (2021), tradução em português](https://top10.owasp.org/2021/pt-BR/), OWASP Foundation. In Portuguese. Free. The official Brazilian Portuguese translation of the 2021 edition, the one the quiz follows.
- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security), Mozilla. Free. An entry point to the browser security model: same-origin policy, HTTPS, CSP, cookies and attacks to defend against.
- [Security Engineering, 3rd edition](https://www.cl.cam.ac.uk/archive/rja14/book.html), Ross Anderson. Free online, paid in print. A broad, readable textbook on how secure systems are designed and why they fail, with chapters free online.
- [CS 253 Web Security](https://web.stanford.edu/class/cs253/), Feross Aboukhadijeh, Stanford University. Free. Slides and recorded lectures on the same-origin policy, XSS, CSRF, sessions, injection and HTTPS, focused on defences.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), OWASP Foundation. Free. Concise, practical prevention guides by topic: injection, XSS, CSRF, sessions, password storage, file upload and more.
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/projects/asvs), OWASP Foundation. Free. A checklist of verifiable security requirements, useful to turn advice into tests.
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), IETF. Free. The official list of JWT pitfalls and the rules that avoid them, such as fixing the algorithm.
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Foundation. Free. Why parameterised queries are the primary defence, with examples in several languages.
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP Foundation. Free. Which hashing algorithms to use (Argon2id first) and with which parameters.
- [OWASP Juice Shop](https://owasp.org/projects/juice-shop), OWASP Foundation. Free. A deliberately insecure training application to run locally, the model for the labs of this area.
- [Information Security Stack Exchange](https://security.stackexchange.com/), Stack Exchange. Free. Careful answers on authentication, cryptography use and web application defence.

Full list and mini-projects: [projects/security/README.md](projects/security/README.md)

## Compilers

A compiler translates a program from one language into another, and an interpreter runs it directly. Both go through the same stages: splitting text into tokens, building a tree from a grammar, checking it, and then generating code or executing it. Knowing these stages removes the mystery from error messages, performance, garbage collection and every tool that reads code.

- [Crafting Interpreters](https://craftinginterpreters.com/), Robert Nystrom. Free online, paid in print. Free online: builds the same language twice, as a tree-walking interpreter and as a bytecode virtual machine.
- [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/), Ruslan Spivak. Free. A patient blog series that grows a Pascal interpreter one small step at a time.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Free. Explains Thompson's construction and why automata-based matching avoids exponential time.
- [Compilers: Principles, Techniques, and Tools, 2nd edition (the Dragon Book)](https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472), Aho, Lam, Sethi and Ullman. Paid. The textbook the quiz follows: lexing, LL and LR parsing, translation, code generation and optimisation.
- [Introduction to Compilers and Language Design](https://dthain.github.io/books/compiler/), Douglas Thain, University of Notre Dame. Free online, paid in print. A free one-semester textbook that goes from scanning to x86 code generation.
- [CS 143 Compilers](https://web.stanford.edu/class/cs143/), Stanford University. Free. Lecture slides and assignments in which a compiler for the COOL language is built phase by phase.
- [CS 6120 Advanced Compilers: The Self-Guided Online Course](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/), Adrian Sampson, Cornell University. Free. Videos and tasks on intermediate representations, data-flow analysis, SSA and optimisation.
- [The Implementation of Lua 5.0](https://www.lua.org/doc/jucs05.pdf), Ierusalimschy, de Figueiredo and Celes (2005). Free. How a real, small virtual machine is designed: registers, closures and tables, by its Brazilian authors.
- [LLVM Tutorial: Kaleidoscope](https://llvm.org/docs/tutorial/), LLVM Project. Free. The official tutorial that implements a small language with a real code generator and JIT.
- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Free. Type code on the left and read the generated assembly on the right, for many compilers.
- [AST Explorer](https://astexplorer.net/), Felix Kling. Free. Shows the syntax tree real parsers build for a piece of code.
- [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/), Reddit. Free. An active community of people designing and implementing languages.

Full list and mini-projects: [projects/compilers/README.md](projects/compilers/README.md)

## State machines

A state machine describes behaviour as a finite set of states and the transitions between them. It is at once a theoretical model (automata, regular languages, Turing machines and the limits of computation) and a practical design tool: protocols, parsers, user interfaces and business workflows become easier to reason about, and invalid situations become impossible to represent, when the states are made explicit.

- [Welcome to the world of Statecharts](https://statecharts.dev/), statecharts community. Free. A plain introduction to state machines and statecharts, with the problems each concept solves.
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html), Robert Nystrom. Free. Starts from a tangle of flags and arrives at finite state machines, hierarchies and pushdown automata.
- [State pattern](https://refactoring.guru/design-patterns/state), Refactoring Guru. Free. The object-oriented State pattern with diagrams and code, also available in Portuguese on the site.
- [Introduction to the Theory of Computation, 3rd edition](https://math.mit.edu/~sipser/book.html), Michael Sipser. Paid. The standard textbook on automata, regular and context-free languages, Turing machines and computability.
- [MIT 18.404J Theory of Computation](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/), Michael Sipser, MIT OpenCourseWare. Free. Video lectures by the author of the textbook, from finite automata to undecidability and complexity.
- [On Computable Numbers, with an Application to the Entscheidungsproblem](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf), Alan Turing (1936). Free. The paper that defined the Turing machine and proved that some problems cannot be decided.
- [XState and Stately documentation](https://stately.ai/docs), Stately. Free. The documentation of the main statechart library for TypeScript: states, events, guards, actions and actors.
- [gen_statem](https://www.erlang.org/doc/apps/stdlib/gen_statem.html), Erlang/OTP. Free. The standard state machine behaviour of the BEAM, used from Elixir for protocols and workflows.
- [MIT 18.404J Theory of Computation, Fall 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY), Michael Sipser, MIT OpenCourseWare. Free. The recorded lectures of the course above.
- [JFLAP](https://www.jflap.org/), Susan Rodger, Duke University. Free. A tool for building and simulating automata, grammars and Turing machines, and converting between them.
- [Computer Science Stack Exchange: automata tag](https://cs.stackexchange.com/questions/tagged/automata), Stack Exchange. Free. Answered questions on automata constructions, proofs and regular languages.
- [Statecharts in the Making: A Personal Account](https://weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf), David Harel (2007). Free. The inventor of statecharts tells how hierarchy, parallel states and broadcast communication were added to state diagrams, and why.

Full list and mini-projects: [projects/state-machines/README.md](projects/state-machines/README.md)

## Information theory

Information theory measures information in bits and proves how far data can be compressed and how reliably it can be sent over a noisy channel. Shannon's entropy sets the limit that Huffman and LZ77 approach, and redundancy added on purpose (parity, CRC, Hamming codes) is what lets networks and disks detect and repair errors. The same ideas explain text encodings such as UTF-8 and base64.

- [Journey into information theory](https://www.khanacademy.org/computing/computer-science/informationtheory), Brit Cruise, Khan Academy. Free. Short videos that build up from ancient signalling to entropy, compression and error correction.
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/), Christopher Olah. Free. Explains entropy, optimal code lengths and cross-entropy with pictures instead of formulas.
- [But what are Hamming codes? The origin of error correction](https://www.youtube.com/watch?v=X8jsijhllIA), Grant Sanderson, 3Blue1Brown. Free. A visual derivation of Hamming codes as a game of parity checks.
- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/), David MacKay. Free online, paid in print. A complete textbook free to read online, covering source coding, channel coding and error-correcting codes.
- [MIT 6.050J Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/), MIT OpenCourseWare, Paul Penfield and Seth Lloyd. Free. A first-year course with notes on bits, codes, compression, errors, probability and entropy.
- [EE 274 Data Compression: Theory and Applications (notes)](https://stanforddatacompressionclass.github.io/notes/), Stanford University. Free. Lecture notes on prefix codes, Huffman, arithmetic coding, LZ77 and modern compressors.
- [A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf), Claude Shannon (1948). Free. The founding paper: entropy, the source coding theorem and channel capacity, still readable today.
- [RFC 1951: DEFLATE Compressed Data Format Specification](https://www.rfc-editor.org/rfc/rfc1951), Peter Deutsch, IETF. Free. The format behind gzip, zip and PNG: LZ77 followed by Huffman coding, specified in a few pages.
- [A Painless Guide to CRC Error Detection Algorithms](https://www.zlib.net/crc_v3.txt), Ross Williams (1993). Free. The classic explanation of CRCs, from polynomial division by hand to the table-driven implementation.
- [Solving Wordle using information theory](https://www.youtube.com/watch?v=v68zYyaEmEA), Grant Sanderson, 3Blue1Brown. Free. Uses a word game to make bits of information and entropy intuitive.
- [The Absolute Minimum Every Software Developer Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/), Joel Spolsky. Free. The short essay that explains code points, encodings and why plain text does not exist.
- [Computer Science Stack Exchange: information-theory tag](https://cs.stackexchange.com/questions/tagged/information-theory), Stack Exchange. Free. Answered questions on entropy, coding and compression limits.

Full list and mini-projects: [projects/information-theory/README.md](projects/information-theory/README.md)

## Digital logic

Digital logic is the level where computing becomes physical: numbers in binary, Boolean functions, logic gates and the circuits made from them, first combinational (adders, multiplexers) and then sequential (flip-flops, registers, counters). Building an adder and then a small CPU from gates shows that a computer is a stack of simple ideas, each one built from the previous.

- [Nand to Tetris](https://www.nand2tetris.org/), Noam Nisan and Shimon Schocken. Free. The course that builds a whole computer from the NAND gate up, with free tools and project material.
- [NandGame](https://nandgame.com/), Olav Junker Kjær. Free. A browser game with the same path: from one NAND gate to an adder, an ALU and a processor.
- [Build an 8-bit computer from scratch](https://eater.net/8bit), Ben Eater. Free. A video series that builds a working computer on breadboards, one module at a time.
- [The Elements of Computing Systems, 2nd edition](https://www.nand2tetris.org/book), Noam Nisan and Shimon Schocken. Paid. The book of Nand to Tetris: Boolean logic, arithmetic, memory, the CPU and the software above it.
- [Code: The Hidden Language of Computer Hardware and Software, 2nd edition](https://codehiddenlanguage.com/), Charles Petzold. Paid. A patient, non-academic path from Morse code and relays to gates, adders, memory and a processor.
- [MIT 6.004 Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/), MIT OpenCourseWare, Chris Terman. Free. Videos and exercises on information, gates, combinational and sequential logic, and processor design.
- [Build a Modern Computer from First Principles: From Nand to Tetris](https://www.coursera.org/learn/build-a-computer), Hebrew University of Jerusalem (Coursera). Free to audit, paid certificate. The guided version of Nand to Tetris part I, with lectures and automatically checked projects.
- [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), Claude Shannon (1937 master's thesis). Free. The thesis that showed Boolean algebra describes switching circuits, the start of digital design.
- [Building an 8-bit breadboard computer!](https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU), Ben Eater. Free. The complete playlist: clock, registers, ALU, memory, program counter and control logic.
- [Exploring How Computers Work](https://www.youtube.com/watch?v=QZwneRb-zqA), Sebastian Lague. Free. A beautifully animated walk from logic gates to an adder and a small ALU in a simulator.
- [Digital](https://github.com/hneemann/Digital), Helmut Neemann. Free. A teaching simulator for digital circuits that also generates truth tables and minimised expressions.
- [Electrical Engineering Stack Exchange: digital-logic tag](https://electronics.stackexchange.com/questions/tagged/digital-logic), Stack Exchange. Free. Answered questions on gates, minimisation, flip-flops and timing.

Full list and mini-projects: [projects/digital-logic/README.md](projects/digital-logic/README.md)

## Electronics

Electronics is the layer below digital logic: voltage, current, resistance and power, the laws that relate them, the components (resistors, capacitors, coils, diodes, transistors) and the instruments used to measure them. For a software developer it explains what a logic level physically is, how a power supply or a sensor works, and how to read a schematic and a datasheet.

Theory-only area: it has no mini-project, so the full list is here.

### Start here

- [Lessons In Electric Circuits](https://www.ibiblio.org/kuphaldt/electricCircuits/), Tony Kuphaldt. Free. A complete free textbook: direct and alternating current, semiconductors, digital circuits and reference tables.
- [Electrical engineering](https://www.khanacademy.org/science/electrical-engineering), Khan Academy. Free. Videos and exercises on circuit analysis, from Ohm's and Kirchhoff's laws to amplifiers.
- [SparkFun tutorials: concepts](https://learn.sparkfun.com/tutorials/tags/concepts), SparkFun Electronics. Free. Short illustrated tutorials on voltage, current, resistors, capacitors, diodes and transistors.
- [Instituto Newton C. Braga](https://www.newtoncbraga.com.br/), Newton C. Braga. In Portuguese. Free. A very large site in Portuguese with courses, articles and practical circuits by a classic Brazilian author.

### Books

- [Eletrônica, 3rd edition](https://www.clubedohardware.com.br/livros/disponiveis/eletr%C3%B4nica-3%C2%AA-edi%C3%A7%C3%A3o-r34/), Gabriel Torres, Clube do Hardware. In Portuguese. Paid. The current edition, on the publisher's page, of the book the quiz follows chapter by chapter (in its 2nd edition).
- [The Art of Electronics, 3rd edition](https://artofelectronics.net/), Paul Horowitz and Winfield Hill. Paid. The reference book of practical circuit design, written from the designer's point of view.
- [Make: Electronics, 3rd edition](https://www.makershed.com/products/make-electronics-3rd-edition-print), Charles Platt. Paid. A beginner book that teaches by experiments, from a battery and a resistor to transistors and integrated circuits.

### Courses and lectures

- [MIT 6.002 Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/), MIT OpenCourseWare, Anant Agarwal. Free. Video lectures on circuit analysis, Thévenin and Norton equivalents, transistors, capacitors and inductors.
- [Engenharia elétrica](https://pt.khanacademy.org/science/electrical-engineering), Khan Academy. In Portuguese. Free. The Khan Academy circuit analysis course translated into Portuguese.

### Papers and specifications

- [The International System of Units (SI Brochure)](https://www.bipm.org/en/publications/si-brochure), BIPM. Free. The official definition of the units and prefixes used in every measurement.
- [Thévenin's theorem](https://en.wikipedia.org/wiki/Th%C3%A9venin%27s_theorem), Wikipedia. Free. A compact statement with a worked example and the link to Norton's theorem.

### Videos

- [EEVblog](https://www.youtube.com/@EEVblog), Dave Jones. Free. Long-running channel with fundamentals tutorials, instrument reviews and teardowns.
- [w2aew](https://www.youtube.com/@w2aew), Alan Wolke. Free. Clear bench tutorials on oscilloscopes, probes, transistors and basic circuits.
- [Ben Eater](https://www.youtube.com/@BenEater), Ben Eater. Free. Builds circuits on breadboards and explains every signal with a multimeter and an oscilloscope.
- [WR Kits](https://www.youtube.com/@canalwrkits), Wagner Rambo. In Portuguese. Free. A Brazilian channel with thousands of lessons on analogue and digital electronics and microcontrollers.

### Practice and tools

- [Circuit Simulator Applet](https://www.falstad.com/circuit/), Paul Falstad. Free. An animated simulator in the browser where current flow is visible and values change live.
- [Kit para Montar Circuito DC](https://phet.colorado.edu/pt_BR/simulations/circuit-construction-kit-dc), PhET, University of Colorado Boulder. In Portuguese. Free. A circuit simulation in Portuguese for experimenting with Ohm's law, series and parallel.
- [Tinkercad Circuits](https://www.tinkercad.com/circuits), Autodesk. Free. A virtual breadboard with components, a multimeter and an oscilloscope.
- [KiCad](https://www.kicad.org/), KiCad project. Free. Open source software for drawing schematics and circuit boards.

### Communities

- [Electrical Engineering Stack Exchange](https://electronics.stackexchange.com/), Stack Exchange. Free. Detailed answers from practising engineers on circuits, components and measurement.
- [r/AskElectronics](https://www.reddit.com/r/AskElectronics/), Reddit. Free. A beginner-friendly place to ask about circuits and repairs.
- [EEVblog Electronics Community Forum](https://www.eevblog.com/forum/), EEVblog. Free. A large forum on test equipment, projects and beginners' questions.

## Object-oriented programming

Object-oriented programming organises a program as objects that keep their own state and expose behaviour through an interface. Encapsulation, polymorphism, inheritance and composition are tools for controlling how a change in one part spreads to the others. Most business code is written this way, so knowing where the ideas help, and where they produce coupling and code smells, matters every day.

- [The Java Tutorials: Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/), Oracle. Free. A short official lesson on objects, classes, inheritance, interfaces and packages.
- [Curso de Java: Programação Orientada a Objetos](https://www.cursoemvideo.com/curso/java-poo/), Gustavo Guanabara, Curso em Vídeo. In Portuguese. Free. A beginner video course in Portuguese on classes, encapsulation, inheritance and polymorphism.
- [Code Smells](https://refactoring.guru/refactoring/smells), Refactoring Guru. Free. An illustrated catalogue of smells, each with its causes and the refactorings that treat it.
- [Effective Java, 3rd edition](https://www.informit.com/store/effective-java-9780134685991), Joshua Bloch. Paid. Concrete advice on designing classes, favouring composition, generics, exceptions and immutability.
- [Refactoring, 2nd edition](https://martinfowler.com/books/refactoring.html), Martin Fowler. Paid. The book that named the code smells and catalogued the refactorings that remove them.
- [Practical Object-Oriented Design, 2nd edition](https://sandimetz.com/products), Sandi Metz. Paid. The most readable book on dependencies, duck typing and composition over inheritance.
- [Java Programming MOOC](https://java-programming.mooc.fi/), University of Helsinki. Free. A free two-part course with hundreds of checked exercises on objects, interfaces, collections and streams.
- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Free. Public readings on specifications, abstract data types, interfaces, equality and mutability.
- [The Early History of Smalltalk](https://worrydream.com/EarlyHistoryOfSmalltalk/), Alan Kay (1993). Free. The person who coined the term explains what objects and messages were meant to be.
- [TypeScript Handbook: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), Microsoft. Free. Classes, visibility, abstract classes and interfaces in the reference language of this repository.
- [Nothing is Something](https://www.youtube.com/watch?v=OMPfEXIlTVE), Sandi Metz, RailsConf. Free. A talk on replacing conditionals and inheritance with composition and small objects.
- [Software Engineering Stack Exchange: object-oriented tag](https://softwareengineering.stackexchange.com/questions/tagged/object-oriented), Stack Exchange. Free. Design discussions on inheritance, composition, encapsulation and coupling.

Full list and mini-projects: [projects/oop/README.md](projects/oop/README.md)

## Functional programming

Functional programming builds programs from pure functions and immutable data, pushing side effects to the edges. Code written this way is easier to test, to reason about and to run concurrently, because a function's result depends only on its arguments. Higher-order functions, closures, pattern matching and types such as Option and Result have moved from Haskell and Elixir into TypeScript, Rust and Java.

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS), Kyle Simpson. Free. A pragmatic free book on pure functions, closures, composition and immutability without heavy theory.
- [Elixir School](https://elixirschool.com/pt), Elixir School contributors. In Portuguese. Free. Free lessons on Elixir in Portuguese (and many other languages): pattern matching, pipes, recursion, processes.
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/), Scott Wlaschin. Free. The best-known explanation of error handling with Result types, as a picture of two tracks.
- [Structure and Interpretation of Computer Programs, 2nd edition](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html), Harold Abelson and Gerald Jay Sussman. Free. The classic on abstraction with functions, recursion, higher-order procedures and interpreters.
- [Learn You a Haskell for Great Good!](https://learnyouahaskell.github.io/), Miran Lipovača, community edition. Free. A friendly free introduction to types, currying, laziness, functors and monads.
- [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity), Eric Normand. Paid. Teaches functional thinking in JavaScript by separating actions, calculations and data.
- [Programming Languages, Part A](https://www.coursera.org/learn/programming-languages), Dan Grossman, University of Washington (Coursera). Free to audit, paid certificate. A demanding course on functional programming in ML: recursion, pattern matching, closures and type inference.
- [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf), John Hughes (1990). Free. The paper that argues higher-order functions and lazy evaluation are tools for modularity.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Free. The origin of property-based testing: state a property and let the tool search for a counterexample.
- [Elixir: Getting Started](https://hexdocs.pm/elixir/introduction.html), The Elixir Team. Free. The official guide: immutability, pattern matching, recursion, enumerables and streams.
- [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY), Anjana Vakil, JSUnconf. Free. A thirty-minute beginner talk on pure functions, higher-order functions and immutability.
- [fast-check](https://fast-check.dev/), Nicolas Dubien. Free. The property-based testing library for TypeScript, with a guide to writing good properties.

Full list and mini-projects: [projects/functional-programming/README.md](projects/functional-programming/README.md)

## Design patterns and SOLID

Design patterns are named solutions to design problems that keep coming back, and the SOLID principles are five rules of thumb for keeping classes and modules easy to change. Together they give a shared vocabulary (Strategy, Adapter, Observer, dependency inversion) for discussing design, and the judgement to see when a pattern pays for itself and when it is only ceremony.

- [Design Patterns](https://refactoring.guru/design-patterns), Alexander Shvets, Refactoring Guru. Free. The clearest online catalogue: each pattern with the problem, the structure, pros and cons and code.
- [Padrões de Projeto](https://refactoring.guru/pt-br/design-patterns), Alexander Shvets, Refactoring Guru. In Portuguese. Free. The same catalogue translated into Brazilian Portuguese.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/), Robert Nystrom. Free online, paid in print. Free online: revisits Command, Observer, State and Singleton with honest notes on when not to use them.
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780201633610), Gamma, Helm, Johnson and Vlissides. Paid. The original catalogue of 23 patterns by the "Gang of Four", still the reference for names and intent.
- [Head First Design Patterns, 2nd edition](https://wickedlysmart.com/head-first-design-patterns/), Eric Freeman and Elisabeth Robson. Paid. The authors' page of the most approachable book: each pattern grows out of a design problem that gets worse first.
- [Catalog of Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/), Martin Fowler. Free. Short summaries of the back-end patterns: Repository, Unit of Work, Data Mapper, Service Layer.
- [The Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), Robert C. Martin. Free. The author's index of the original articles on each of the principles later named SOLID.
- [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), Barbara Liskov and Jeannette Wing (1994). Free. The formal statement of the substitution principle: what a subtype must preserve.
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), Martin Fowler (2004). Free. The article that named dependency injection and compared it with the service locator.
- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript), Refactoring Guru. Free. A runnable TypeScript example of every pattern in the catalogue.
- [Design Patterns in Object Oriented Programming](https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc), Christopher Okhravi. Free. Enthusiastic whiteboard explanations of the main patterns, following Head First Design Patterns.
- [Software Engineering Stack Exchange: design-patterns tag](https://softwareengineering.stackexchange.com/questions/tagged/design-patterns), Stack Exchange. Free. Discussions on when a pattern fits and when it is over-engineering.

Full list and mini-projects: [projects/design-patterns/README.md](projects/design-patterns/README.md)

## Software architecture

Software architecture is the set of decisions that are expensive to change: how a system is split into parts, which way the dependencies point, and which quality attributes (performance, availability, ease of change) are favoured. Layered, hexagonal and clean architectures, monoliths and microservices, events and CQRS are answers to the same question: how to keep the business rules independent from the details around them.

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin. Free. The original post with the concentric circles and the dependency rule.
- [Software Architecture Guide](https://martinfowler.com/architecture/), Martin Fowler. Free. An index of articles on what architecture is, application boundaries, microservices and evolution.
- [Engenharia de Software Moderna, capítulo 7: Arquitetura](https://engsoftmoderna.info/cap7.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese on layers, MVC, microservices, message queues and publish/subscribe.
- [Clean Architecture](https://www.informit.com/store/clean-architecture-a-craftsmans-guide-to-software-structure-9780134494166), Robert C. Martin. Paid. The book on entities, use cases, interface adapters and component principles.
- [Fundamentals of Software Architecture](https://fundamentalsofsoftwarearchitecture.com/), Mark Richards and Neal Ford. Paid. A survey of architecture styles and characteristics, with the trade-offs of each style rated.
- [MIT 6.033 Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/), MIT OpenCourseWare. Free. Lectures on modularity, abstraction, layering and the design of large systems, with classic papers.
- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), Alistair Cockburn. Free. The original article on ports and adapters, by its author.
- [Microservices](https://martinfowler.com/articles/microservices.html), James Lewis and Martin Fowler (2014). Free. The article that defined the style and its characteristics, including its costs.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Michael Nygard (2011). Free. The short post that proposed architecture decision records and their format.
- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), Microsoft Azure Architecture Center. Free. A catalogue of distributed system patterns with the problem, the solution and the considerations.
- [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g), Simon Brown. Free. A conference talk on why most architecture diagrams fail and how to draw useful ones.
- [Software Engineering Stack Exchange: architecture tag](https://softwareengineering.stackexchange.com/questions/tagged/architecture), Stack Exchange. Free. Discussions of concrete architecture trade-offs.

Full list and mini-projects: [projects/software-architecture/README.md](projects/software-architecture/README.md)

## Testing

Automated testing is how a team knows that the software still works after each change. The subject covers the levels of tests (unit, integration, end-to-end), the techniques for writing them (test doubles, test-driven development, property-based and mutation testing) and their failure modes, such as flaky tests and coverage numbers that prove nothing. Good tests are what make refactoring and continuous delivery safe.

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Ham Vocke. Free. A long worked example of unit, integration, contract and end-to-end tests on one application.
- [Engenharia de Software Moderna, capítulo 8: Testes](https://engsoftmoderna.info/cap8.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese on the pyramid, unit tests, mocks, TDD, coverage and flaky tests.
- [Test Desiderata](https://testdesiderata.com/), Kent Beck. Free. Twelve properties of a good test, each with a short video, and the trade-offs between them.
- [Test-Driven Development: By Example](https://www.informit.com/store/test-driven-development-by-example-9780321146533), Kent Beck. Paid. The source of the multi-currency money kata and of the xUnit example rebuilt in this area.
- [Software Engineering at Google: Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), Winters, Manshreck and Wright. Free. Free chapters on test sizes, unit tests, test doubles and larger tests, from a huge codebase.
- [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing), Vladimir Khorikov. Paid. Defines what makes a unit test valuable and when mocks help or harm.
- [MIT 6.031 Reading 3: Testing](https://web.mit.edu/6.031/www/sp22/classes/03-testing/), MIT. Free. A clear reading on choosing test cases by partitioning the input space and covering boundaries.
- [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), Martin Fowler. Free. The article that separates the kinds of test doubles and the classical and mockist styles.
- [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), John Micco, Google Testing Blog. Free. Numbers and causes of flakiness at scale, and what is done about it.
- [Playwright documentation](https://playwright.dev/docs/intro), Microsoft. Free. The official guide to the end-to-end tool of this repository: locators, auto-waiting and trace viewer.
- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM), Ian Cooper. Free. A talk on testing behaviour instead of implementation details, going back to Kent Beck's book.
- [Software Quality Assurance and Testing Stack Exchange](https://sqa.stackexchange.com/), Stack Exchange. Free. Questions and answers on test design, automation and strategy.

Full list and mini-projects: [projects/testing/README.md](projects/testing/README.md)

## Protocols

Application protocols are the agreements that let programs written by different people talk to each other. This area follows HTTP from its semantics (methods, status codes, headers, caching, cookies) through its three wire formats (HTTP/1.1, HTTP/2 and HTTP/3 over QUIC), the TLS handshake underneath, and the API styles built on top: REST, GraphQL, JSON-RPC, gRPC, WebSocket and server-sent events.

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), Mozilla. Free. The best starting point: overview, messages, methods, status codes, headers, caching, cookies and CORS.
- [MDN: HTTP (em português)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP), Mozilla. In Portuguese. Free. The Brazilian Portuguese translation of the MDN HTTP guides and reference.
- [HTTP/3 explained](https://http3-explained.haxx.se/), Daniel Stenberg. Free. A short free book by the author of curl on why QUIC exists and how HTTP/3 works.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), Michael Driscoll. Free. Every byte of a real TLS 1.3 handshake, annotated and explained.
- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Free online, paid in print. Free online: TCP, TLS, HTTP/1.x, HTTP/2, WebSocket and server-sent events from the performance side.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham and Reschke, IETF. Free. The current definition of methods, status codes, headers and content negotiation for every HTTP version.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson and Benfield, IETF. Free. Frames, streams, flow control and header compression in HTTP/2.
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), Mike Bishop, IETF. Free. How HTTP semantics are mapped onto QUIC streams.
- [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm), Roy Fielding (2000). Free. The dissertation that defined REST and its constraints.
- [GraphQL Specification](https://spec.graphql.org/), GraphQL Foundation. Free. The official definition of the type system, queries, validation and execution.
- [Learn GraphQL](https://graphql.org/learn/), GraphQL Foundation. Free. The official introduction to schemas, queries, mutations and best practices.
- [Stack Overflow: http tag](https://stackoverflow.com/questions/tagged/http), Stack Overflow. Free. Canonical answers on status codes, headers, caching and CORS.

Full list and mini-projects: [projects/protocols/README.md](projects/protocols/README.md)

## Messaging

Messaging lets services cooperate without calling each other directly: one side publishes a message and another processes it later. Queues, publish/subscribe and logs differ in who receives a message, in which order, and how many times, and those differences decide whether a system survives a crash or a slow consumer. Delivery guarantees, acknowledgements, retries, dead-letter queues and idempotent consumers are the core of the subject.

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials), RabbitMQ. Free. Six short tutorials, in many languages, from a simple queue to routing, topics and RPC.
- [Apache Kafka: Introduction](https://kafka.apache.org/intro), Apache Software Foundation. Free. The official overview of events, topics, partitions, producers and consumers.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn. Free. The essay that explains the append-only log as the idea behind Kafka and stream processing.
- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/), Gregor Hohpe and Bobby Woolf. Free online, paid in print. The free online summary of the book's 65 patterns: channels, routers, dead letter channel, idempotent receiver.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. The chapter on stream processing compares message brokers with logs and explains delivery semantics.
- [The Optimal RabbitMQ Guide](https://www.cloudamqp.com/rabbitmq-ebook/), CloudAMQP. Free. A free e-book on exchanges, queues, bindings and best practices, one of the sources of the quiz.
- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts), RabbitMQ. Free. The protocol model in plain words: exchanges, queues, bindings, acknowledgements and prefetch.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat. Free. A short post on why delivery is at-most-once or at-least-once, and what idempotency buys.
- [RabbitMQ documentation](https://www.rabbitmq.com/docs), RabbitMQ. Free. Guides on queues, consumer acknowledgements, publisher confirms and dead-letter exchanges.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/), Apache Software Foundation. Free. The design section explains the log, replication, consumer groups, offsets and delivery guarantees.
- [BullMQ documentation](https://docs.bullmq.io/), Taskforce.sh. Free. Job queues on Redis: workers, retries with backoff, rate limiting and flows.
- [Stack Overflow: rabbitmq tag](https://stackoverflow.com/questions/tagged/rabbitmq), Stack Overflow. Free. Answered questions on exchanges, acknowledgements and redelivery.

Full list and mini-projects: [projects/messaging/README.md](projects/messaging/README.md)

## Load balancing

A load balancer spreads requests over several servers so that a service can handle more traffic than one machine and survive the loss of one. The topic covers where the balancing happens (transport or application layer), how a server is chosen (round robin, least connections, hashing), how dead servers are detected and avoided, and the related roles of reverse proxy, TLS termination and API gateway.

- [Load Balancing](https://samwho.dev/load-balancing/), Sam Rose. Free. An interactive visual essay that shows round robin, least connections and their effect on latency.
- [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), Cloudflare Learning Center. Free. A short plain definition with the common algorithms and the idea of health checks.
- [Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), NGINX. Free. The official introduction: an upstream block, the balancing methods, weights and passive health checks.
- [Site Reliability Engineering: Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Google. Free. How traffic reaches a datacentre: DNS, virtual IPs and consistent hashing at the network level.
- [Site Reliability Engineering: Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Google. Free. Why simple policies fail at scale, with subsetting and weighted round robin.
- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger and others (1997). Free. The paper that introduced consistent hashing, so that adding a server moves few keys.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/), Eisenbud and others, Google (2016). Free. How a layer 4 balancer is built from commodity servers, with its own consistent hashing.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Free. Why the slowest requests dominate large systems and how hedging and load balancing reduce them.
- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), NGINX. Free. The reference of every directive: least_conn, ip_hash, hash, max_fails, fail_timeout, keepalive.
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), Caddy project. Free. Load balancing policies, active and passive health checks and retries in the Caddyfile.
- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Free. Videos on layer 4 against layer 7 balancing, proxies, NGINX and HAProxy.
- [Server Fault: load-balancing tag](https://serverfault.com/questions/tagged/load-balancing), Stack Exchange. Free. Operational questions answered by system administrators.

Full list and mini-projects: [projects/load-balancing/README.md](projects/load-balancing/README.md)

## Performance

Performance engineering is measuring before changing: defining what fast means (latency percentiles, throughput), producing a realistic load, finding where the time goes with a profiler, and only then optimising. It connects several layers, from CPU caches and memory locality to runtime behaviour, database queries and the capacity of a whole service, and it depends on a sound benchmarking method to avoid fooling yourself.

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Free. The official guide to virtual users, stages, thresholds and checks, with a page on each test type.
- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg. Free. A checklist for any resource: utilisation, saturation and errors, a first method for finding bottlenecks.
- [How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU), Gil Tene. Free. The talk on percentiles, why averages hide the problem and the coordinated omission mistake.
- [Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html), Brendan Gregg. Paid. The reference on methodology and on CPU, memory, file system, disk and network analysis in Linux.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Free. A free online book on CPU caches, memory layout, SIMD and benchmarking, with matrix multiplication as a case.
- [Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book), Denis Bakhvalov. Free. A free book on measuring with hardware counters, profiling and fixing cache misses and branch mispredictions.
- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare. Free. Starts by speeding up matrix multiplication step by step, then covers measurement and caches.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Free. The author's page on how flame graphs are built and read, with links to his article and talks.
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group. Free. How to read a query plan and find a missing index.
- [Performance Matters](https://www.youtube.com/watch?v=r-TLSBdHe1A), Emery Berger, Strange Loop. Free. A talk on why naive benchmarks mislead and how to measure and profile soundly.
- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Free. The benchmarking tool of this repository: warm-up runs, repetitions and statistical summary.
- [Stack Overflow: performance tag](https://stackoverflow.com/questions/tagged/performance), Stack Overflow. Free. Famous canonical answers on branch prediction, cache effects and measurement.

Full list and mini-projects: [projects/performance/README.md](projects/performance/README.md)

## Cache

A cache keeps a copy of something expensive to compute or fetch, so that the next request is served faster. Caches sit at every level (browser, CDN, application, database, CPU), and they all raise the same questions: what to keep, when to throw it away, how to know it is stale, and what happens when many clients miss at once. Getting those answers wrong trades a slow system for an incorrect one.

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), Mozilla. Free. The clearest guide to private and shared caches, freshness, validation and the Cache-Control directives.
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/), Amazon Web Services. Free. A short overview of lazy loading, write-through, time to live and eviction.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Free. The most common application pattern described with its consistency issues and when to use it.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. Treats caches as derived data and explains the consistency problems of keeping two copies.
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), Fielding, Nottingham and Reschke, IETF. Free. The specification of freshness, validation, invalidation and every cache directive.
- [Scaling Memcache at Facebook](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), Nishtala and others (2013). Free. How a very large cache tier deals with stale sets, thundering herds and regional consistency.
- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Vattani, Chierichetti and Lowenstein (2015). Free. The paper behind probabilistic early expiration, a simple fix for the stampede.
- [Redis documentation](https://redis.io/docs/latest/), Redis. Free. The official reference for data types, commands, expiration and client-side caching.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis. Free. How maxmemory policies work and how Redis approximates LRU and LFU.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Free. Short animated videos on caching strategies, eviction and the classic cache failure modes.
- [Stack Overflow: caching tag](https://stackoverflow.com/questions/tagged/caching), Stack Overflow. Free. Answered questions on invalidation, headers and cache design.

Full list and mini-projects: [projects/cache/README.md](projects/cache/README.md)

## Rate limiting

Rate limiting caps how many requests a client may make in a period, to protect a service from overload, abuse and unfair use. The algorithms (fixed window, sliding window, token bucket, leaky bucket) differ in how they treat bursts and in how much state they need, and running them across several servers raises questions of atomicity. The other half of the subject is the client: the 429 status, retry headers and backoff.

- [Visualizing algorithms for rate limiting](https://smudge.ai/blog/ratelimit-algorithms), smudge.ai. Free. Interactive demonstrations of fixed window, sliding window and token bucket, side by side.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe. Free. The four kinds of limiter a payments API runs in production, and why each exists.
- [What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/), Cloudflare Learning Center. Free. A short plain definition of the idea and of what it protects against.
- [Site Reliability Engineering: Handling Overload](https://sre.google/sre-book/handling-overload/), Google. Free. Per-customer limits, client-side throttling and graceful degradation in a large service.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Paid. The source of the quiz for traffic shaping with the leaky bucket and the token bucket.
- [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585), Fielding and Nottingham, IETF. Free. The definition of 429 Too Many Requests and its use with Retry-After.
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), Wikipedia. Free. The algorithm, its parameters, the burst size formula and its relation to the leaky bucket.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog. Free. Simulations that show why retrying clients need randomness, not only growing delays.
- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), NGINX. Free. The reference of the leaky bucket limiter of NGINX: rate, burst, nodelay and delay.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/), Redis. Free. The command page includes the classic rate limiter patterns and the race they must avoid.
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis. Free. How to make read-then-write logic atomic on the server, the basis of distributed limiters.
- [Stack Overflow: rate-limiting tag](https://stackoverflow.com/questions/tagged/rate-limiting), Stack Overflow. Free. Answered questions on implementing and configuring limiters.

Full list and mini-projects: [projects/rate-limiting/README.md](projects/rate-limiting/README.md)

## File systems

A file system turns a raw block device into named files and directories that survive a power failure. Below the familiar interface are allocation methods, i-nodes, free space management and journaling, and above it are the file organisations that databases use: records, indexes, B-trees and external sorting for data that does not fit in memory. Both halves are shaped by one fact: storage is slow, so the number of accesses is what counts.

- [Operating Systems: Three Easy Pieces (Persistence part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Free online, paid in print. Free chapters on disks, RAID, files and directories, file system implementation, journaling and flash.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. In Portuguese. Free. The free Portuguese textbook has a full part on files, directories and allocation.
- [Files are hard](https://danluu.com/file-consistency/), Dan Luu. Free. A survey of how hard it is to write a file safely, with the research that found the bugs.
- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Paid. The source of the quiz for files, directories, allocation, free space and journaling.
- [Database Internals](https://www.databass.dev/), Alex Petrov. Paid. The first half is about on-disk structures: file formats, B-tree variants and log-structured storage.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Free. The lectures on storage, B+ trees and external merge sort match the second half of this area.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Free. Labs on the xv6 file system: i-nodes, directories, the buffer cache and logging.
- [A Fast File System for UNIX](https://dsf.berkeley.edu/cs262/FFS.pdf), McKusick, Joy, Leffler and Fabry (1984). Free. The paper that introduced cylinder groups and layout policies, the ancestor of ext2 to ext4.
- [The Ubiquitous B-Tree](https://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer (1979). Free. The classic survey of B-trees and B+ trees and why they suit disks.
- [ext4 Data Structures and Algorithms](https://docs.kernel.org/filesystems/ext4/), kernel.org. Free. The on-disk layout of a production file system: block groups, i-nodes, extents and the journal.
- [SQLite Database File Format](https://www.sqlite.org/fileformat2.html), SQLite. Free. A complete, readable description of how tables and indexes are stored as B-tree pages in one file.
- [Unix and Linux Stack Exchange: filesystems tag](https://unix.stackexchange.com/questions/tagged/filesystems), Stack Exchange. Free. Answered questions on i-nodes, links, journaling and file system behaviour.

Full list and mini-projects: [projects/file-systems/README.md](projects/file-systems/README.md)

## Observability

Observability is the ability to understand what a running system is doing from the data it emits. Logs, metrics and traces answer different questions, and together they let someone explain a slow request across several services without guessing. The subject also covers what to measure (service level indicators), what to promise (objectives and error budgets) and when to wake a person up (alerting).

- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry. Free. A short introduction to the vocabulary: telemetry, reliability, logs, spans and distributed traces.
- [Site Reliability Engineering: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Google. Free. The chapter with the four golden signals and the difference between symptoms and causes.
- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon. Free. A one-page diagram and text that separate the three signals by what they are good at.
- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), Beyer, Jones, Petoff and Murphy (editors), Google. Free. Free online: service level objectives, error budgets, monitoring and alerting as practised at Google.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/), Beyer, Murphy, Rensin, Kawahara and Thorne (editors), Google. Free. The practical sequel, with worked examples of implementing SLOs and alerting on them.
- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Sigelman and others, Google (2010). Free. The paper that defined traces, spans and sampling, the model behind every tracing system.
- [Trace Context](https://w3c.github.io/trace-context/), W3C. Free. The standard traceparent and tracestate headers that carry a trace across services.
- [The Site Reliability Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Google. Free. Six ways to alert on an objective, ending with multi-window, multi-burn-rate alerts.
- [OpenTelemetry documentation](https://opentelemetry.io/docs/), OpenTelemetry. Free. Concepts, language SDKs, the Collector and semantic conventions.
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/), Prometheus Authors. Free. The data model, metric types, PromQL, alerting rules and instrumentation best practices.
- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/), OpenTelemetry. Free. A complete microservices shop instrumented with traces, metrics and logs, to run locally.
- [Observability Engineering, 2nd edition](https://www.honeycomb.io/observability-engineering-oreilly-book), Charity Majors, Liz Fong-Jones, George Miranda and Austin Parker. Free. The book the quiz follows (in its first edition), offered as a free e-book by Honeycomb after registration.

Full list and mini-projects: [projects/observability/README.md](projects/observability/README.md)

## Blockchain

A blockchain is a ledger that many parties who do not trust each other can agree on without a central authority. It combines ideas studied elsewhere in this repository: hash functions and Merkle trees make the history tamper-evident, digital signatures prove who may spend, and proof of work turns agreement into a question of computing effort. Studying it as a data structure and a protocol separates the engineering from the hype.

- [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4), Grant Sanderson, 3Blue1Brown. Free. Builds the idea step by step: a public ledger, signatures, hashes, blocks and proof of work.
- [Blockchain Demo](https://andersbrownworth.com/blockchain/), Anders Brownworth. Free. An interactive page where you change a block and watch the hashes of the chain break.
- [Learn Me A Bitcoin](https://learnmeabitcoin.com/), Greg Walker. Free. A plain technical guide with diagrams and tools for keys, transactions, blocks and mining.
- [Bitcoin and Cryptocurrency Technologies](https://bitcoinbook.cs.princeton.edu/), Narayanan, Bonneau, Felten, Miller and Goldfeder, Princeton. Free online, paid in print. A university textbook with a free draft online: cryptography, consensus, mining and alternatives.
- [Mastering Bitcoin, 3rd edition](https://github.com/bitcoinbook/bitcoinbook), Andreas Antonopoulos and David Harding. Free online, paid in print. The detailed technical book, with its full text open on GitHub: keys, transactions, the network and mining.
- [Bitcoin and Cryptocurrency Technologies](https://www.coursera.org/learn/cryptocurrency), Princeton University (Coursera). Free to audit, paid certificate. The video course of the Princeton textbook.
- [MIT 15.S12 Blockchain and Money](https://ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/), Gary Gensler, MIT OpenCourseWare. Free. Lectures that cover the technology and then judge soberly where it is and is not useful.
- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Satoshi Nakamoto (2008). Free. The nine-page paper that the quiz follows: transactions, timestamp server, proof of work and incentives.
- [Bitcoin: Um Sistema de Dinheiro Eletrônico Peer-to-Peer](https://bitcoin.org/files/bitcoin-paper/bitcoin_pt_br.pdf), Satoshi Nakamoto, tradução para o português. In Portuguese. Free. The Brazilian Portuguese translation of the paper, hosted by bitcoin.org.
- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/), Bitcoin.org developer documentation. Free. The block chain, transactions, contracts, wallets and the peer-to-peer network, with references.
- [Naivecoin: a tutorial for building a cryptocurrency](https://lhartikk.github.io/), Lauri Hartikka. Free. A TypeScript tutorial that grows a minimal chain into one with proof of work and transactions.
- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/), Stack Exchange. Free. Technical questions answered by protocol developers.

Full list and mini-projects: [projects/blockchain/README.md](projects/blockchain/README.md)

## Continuous integration

Continuous integration means merging small changes often and letting an automated pipeline build, lint and test each one, so that problems are found minutes after they are introduced. Around that idea sit the practices this repository itself uses: workflows on GitHub Actions, caching and artifacts, secrets and permissions, quality gates, deployment strategies, semantic versioning and a changelog.

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler. Free. The reference article on the practice: one mainline, self-testing builds, fast feedback, fix at once.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), GitHub. Free. The official introduction to workflows, events, jobs, steps, actions and runners.
- [Engenharia de Software Moderna, capítulo 10: DevOps](https://engsoftmoderna.info/cap10.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese on version control, continuous integration, deployment and feature flags.
- [Continuous Delivery](https://continuousdelivery.com/), Jez Humble and David Farley. Free online, paid in print. The site of the book summarises its principles: the deployment pipeline, automation and small batches.
- [Software Engineering at Google: Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html), Winters, Manshreck and Wright. Free. A free chapter on fast feedback loops, presubmit and post-submit testing and flakiness.
- [Semantic Versioning 2.0.0](https://semver.org/), Tom Preston-Werner. Free. The specification of version numbers used by this repository, also available in Portuguese.
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), Conventional Commits contributors. Free. The commit message convention that lets tools derive versions and changelogs.
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Olivier Lacan. Free. The changelog format of this repository and the reasons behind it.
- [GitHub Actions documentation](https://docs.github.com/en/actions), GitHub. Free. The complete reference: workflow syntax, contexts, caching, artifacts, matrices and reusable workflows.
- [Secure use reference for GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use), GitHub. Free. Official hardening advice: least-privilege tokens, pinning actions and handling untrusted input.
- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Free. Weekly videos by the co-author of the Continuous Delivery book on pipelines, trunk-based development and testing.
- [GitHub Community: Actions](https://github.com/orgs/community/discussions/categories/actions), GitHub. Free. The official forum for questions about workflows and runners.

Full list and mini-projects: [projects/continuous-integration/README.md](projects/continuous-integration/README.md)

## Software engineering

Software engineering is everything around the code that decides whether a project succeeds: understanding what to build, organising the work, modelling and designing, keeping quality, estimating, and evolving the system for years. Its classic texts, from Brooks to the agile and lean movements, are mostly about people and trade-offs, and they explain why adding programmers to a late project makes it later.

Theory-only area: it has no mini-project, so the full list is here.

### Start here

- [Engenharia de Software Moderna](https://engsoftmoderna.info/), Marco Tulio Valente, UFMG. In Portuguese. Free. A complete textbook in Portuguese, free online: processes, requirements, models, design, tests, refactoring and DevOps.
- [Software Engineering at Google](https://abseil.io/resources/swe-book), Titus Winters, Tom Manshreck and Hyrum Wright. Free. Free online: how culture, processes and tools keep a codebase healthy over time.
- [Manifesto para Desenvolvimento Ágil de Software](https://agilemanifesto.org/iso/ptbr/manifesto.html), Beck and others (2001). In Portuguese. Free. The four values of the Agile Manifesto in Portuguese, with a link to its twelve principles.

### Books

- [Software Engineering, 10th edition](https://software-engineering-book.com/), Ian Sommerville. Paid. The textbook the quiz follows (in its 9th edition); the author's site has slides, videos and case studies.
- [The Mythical Man-Month, anniversary edition](https://www.informit.com/store/mythical-man-month-essays-on-software-engineering-anniversary-9780201835953), Frederick P. Brooks Jr.. Paid. The classic essays on why large projects are late, with "No Silver Bullet" included.
- [Clean Code](https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884), Robert C. Martin. Paid. A source of the quiz for naming, functions, comments and code quality at the small scale.
- [Code Simplicity](https://www.codesimplicity.com/), Max Kanat-Alexander. Free online, paid in print. The author's site, with the essays behind the short book on simplicity and the cost of change.
- [The Lean Startup](https://theleanstartup.com/), Eric Ries. Paid. The site of the book summarises the build, measure, learn loop and the minimum viable product.
- [The Pragmatic Programmer, 20th anniversary edition](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/), David Thomas and Andrew Hunt. Paid. Practical habits of working developers, from DRY and orthogonality to estimating.
- [Guide to the Software Engineering Body of Knowledge (SWEBOK)](https://www.computer.org/education/bodies-of-knowledge/software-engineering), IEEE Computer Society. Free. The profession's own map of knowledge areas, free to download.

### Courses and lectures

- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Free. Public readings on writing code that is safe from bugs, easy to understand and ready for change.
- [UNIVESP on YouTube](https://www.youtube.com/@univesptv), Universidade Virtual do Estado de São Paulo. In Portuguese. Free. Has full Portuguese courses on software engineering and project management.

### Papers and specifications

- [No Silver Bullet: Essence and Accident in Software Engineering](https://www.cs.unc.edu/techreports/86-020.pdf), Frederick P. Brooks Jr. (1986). Free. The essay that separates essential from accidental complexity, as a technical report of the author's university.
- [The WyCash Portfolio Management System](https://c2.com/doc/oopsla92.html), Ward Cunningham (1992). Free. The experience report where the debt metaphor for unfinished design first appeared.
- [TechnicalDebtQuadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html), Martin Fowler. Free. A short note that classifies technical debt as deliberate or inadvertent, prudent or reckless.
- [The Scrum Guide](https://scrumguides.org/), Ken Schwaber and Jeff Sutherland. Free. The official short definition of Scrum, with a Portuguese translation available on the site.
- [Unified Modeling Language specification](https://www.omg.org/spec/UML/), Object Management Group. Free. The standard that defines class, sequence, state and use case diagrams.
- [Therac-25](https://en.wikipedia.org/wiki/Therac-25), Wikipedia. Free. A summary of the radiation therapy machine whose software faults killed patients, with the references to the investigation by Leveson and Turner.

### Videos

- [Agile is Dead](https://www.youtube.com/watch?v=a-BOSpxYJ9M), Dave Thomas, GOTO. Free. A signatory of the manifesto on the difference between the agile values and the industry around them.
- [Código Fonte TV](https://www.youtube.com/@codigofontetv), Gabriel Fróes and Vanessa Weber. In Portuguese. Free. Short Portuguese videos explaining Scrum, Kanban, requirements, technical debt and other terms.

### Practice and tools

- [PlantUML](https://plantuml.com/), PlantUML. Free. Draws UML diagrams from plain text, good for practising the notation.
- [Mermaid](https://mermaid.js.org/), Mermaid. Free. Text-based diagrams that render directly in Markdown on GitHub.

### Communities

- [Software Engineering Stack Exchange](https://softwareengineering.stackexchange.com/), Stack Exchange. Free. Questions and answers on process, design, requirements and professional practice.
- [r/ExperiencedDevs](https://www.reddit.com/r/ExperiencedDevs/), Reddit. Free. Discussion among working developers on process, teams and trade-offs.

## Artificial intelligence and LLMs

Modern artificial intelligence is machine learning at scale: models with many adjustable numbers that are trained on data instead of being programmed by hand. This area goes from the mathematics underneath (probability, linear algebra, gradient descent and backpropagation) to the pieces of a large language model (tokens, embeddings, attention, next-token prediction) and of image generators (diffusion), and to their limits and costs.

- [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), Grant Sanderson, 3Blue1Brown. Free. The best visual introduction: what a network is, gradient descent, backpropagation, then transformers and attention.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), Andrej Karpathy. Free. A video course that codes everything from scratch: an autograd engine, a character model, then a GPT.
- [Deep Learning Book](https://www.deeplearningbook.com.br/), Data Science Academy. In Portuguese. Free. A free online book in Portuguese with many short chapters, from the perceptron to transformers.
- [Deep Learning](https://www.deeplearningbook.org/), Ian Goodfellow, Yoshua Bengio and Aaron Courville. Free online, paid in print. The reference textbook, free to read online: the mathematics, optimisation, regularisation and the main architectures.
- [Dive into Deep Learning](https://d2l.ai/), Zhang, Lipton, Li and Smola. Free. A free interactive book where every concept comes with runnable code, including attention and transformers.
- [Speech and Language Processing, 3rd edition draft](https://web.stanford.edu/~jurafsky/slp3/), Dan Jurafsky and James Martin. Free. The free draft textbook of language processing: n-grams, embeddings, transformers and large language models.
- [CS224N Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/), Stanford University. Free. Slides, notes and assignments on word vectors, attention, transformers, pre-training and large models.
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), Vaswani and others (2017). Free. The paper that introduced the transformer, the architecture of today's language models.
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), Ho, Jain and Abbeel (2020). Free. The paper that made diffusion models practical for image generation.
- [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), Andrej Karpathy. Free. Two hours that go from a bigram model to a working transformer, line by line.
- [micrograd](https://github.com/karpathy/micrograd), Andrej Karpathy. Free. A tiny autograd engine and neural network library, short enough to read in one sitting.
- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Polo Club of Data Science, Georgia Tech. Free. A small GPT running in the browser, with every step from tokens to the next-token probabilities visible.

Full list and mini-projects: [projects/artificial-intelligence/README.md](projects/artificial-intelligence/README.md)
