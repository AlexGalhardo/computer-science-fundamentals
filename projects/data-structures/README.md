# Data structures

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Data structures are the ways of organising data in memory and on disk so that the operations a program needs are cheap. Choosing between an array, a linked list, a hash table, a balanced tree or a graph is usually the decision that most changes the cost of a program, and it is the base of databases, compilers, operating systems and networks.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Hash map from scratch](hash-map/) | How collisions are resolved and why the load factor matters | available |
| [Graph algorithms](graph-algorithms/) | Shortest paths, ordering and spanning trees on the same graph library | available |
| [B-tree on disk](b-tree-on-disk/) | Why databases use wide trees: fewer page reads | available |
| [LRU cache, bloom filter and trie](lru-bloom-trie/) | Three structures behind caches, membership tests and prefix search | available |
| [Balanced search trees](balanced-trees/) | How an unbalanced tree degenerates and how rotations prevent it | available |

## Quiz and documentation

- Quiz questions: [quiz/content/data-structures/](../../quiz/content/data-structures/)
- Documentation: [docs/en/data-structures/](../../docs/en/data-structures/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Free. Animations of lists, heaps, hash tables, search trees and graph traversals, with quizzes.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html), David Galles, University of San Francisco. Free. Interactive pages where you insert and remove keys and watch AVL, red-black and B-trees rebalance.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. In Portuguese. Free. Notes in Portuguese on lists, stacks, queues, trees, heaps and hashing, with short C code.

### Books

- [Open Data Structures](https://opendatastructures.org/), Pat Morin. Free. A free textbook that implements and analyses each structure, with editions in Java, C++ and pseudocode.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Free online, paid in print. The book site has summaries, Java code and exercises for symbol tables, balanced trees, hashing and graphs.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Paid. The reference for the proofs: heaps, hash tables, red-black trees, B-trees and graph representations.

### Courses and lectures

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Free. The first half is a data structures course: sequences, sets, hashing, binary trees, AVL and heaps.
- [CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/), Josh Hug, UC Berkeley. Free. A complete course with videos, an online textbook and autograded projects in Java.
- [Estrutura de Dados](https://www.youtube.com/playlist?list=PLxI8Can9yAHf8k8LrUePyj0y3lLpigGcl), UNIVESP. In Portuguese. Free. A full undergraduate course in Portuguese using C: lists, stacks, queues, trees and sorting.
- [MIT 6.851 Advanced Data Structures](https://ocw.mit.edu/courses/6-851-advanced-data-structures-spring-2012/), MIT OpenCourseWare, Erik Demaine. Free. For going deeper: persistent structures, cache-oblivious trees, succinct structures and dynamic graphs.

### Papers and specifications

- [Organization and Maintenance of Large Ordered Indices](https://infolab.usc.edu/csci585/Spring2010/den_ar/indexing.pdf), Rudolf Bayer and Edward McCreight (1970). Free. The Boeing research report, published as a paper in 1972, that introduced the B-tree, the origin of every database index.
- [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), Wikipedia. Free. A good survey of the structure from Burton Bloom's 1970 paper, with the false positive formula and variants.

### Official documentation

- [Rust std::collections](https://doc.rust-lang.org/std/collections/index.html), The Rust Project. Free. Official guidance on when to use each collection, with the cost of every operation in a table.

### Videos

- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Free. Recorded lectures on dynamic arrays, hashing, binary heaps, AVL trees and graph search.
- [Data Structures](https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P), mycodeschool. Free. Patient whiteboard videos on linked lists, stacks, queues, trees and graphs in C and C++.

### Practice and tools

- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Free. Clear articles with code for segment trees, Fenwick trees, disjoint sets, tries and graph algorithms.

### Communities

- [Stack Overflow: data-structures tag](https://stackoverflow.com/questions/tagged/data-structures), Stack Overflow. Free. A large archive of practical questions on choosing and implementing structures.
- [r/algorithms](https://www.reddit.com/r/algorithms/), Reddit. Free. Discussion of algorithms and data structures, from homework doubts to research results.
