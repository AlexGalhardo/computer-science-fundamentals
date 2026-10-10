# Algorithms

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Algorithms are the step-by-step methods for solving a problem: sorting, searching, finding the shortest path, choosing the best combination. Studying them teaches a small set of design techniques (divide and conquer, greedy choice, dynamic programming, backtracking) that turn problems that look impossible at scale into programs that finish.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Sorting race](sorting-race/) | How the same algorithms behave across languages and input shapes, and how measured time relates to Big O | available |
| [Dynamic programming](dynamic-programming/) | How memoisation and tabulation remove repeated work | available |
| [Travelling salesman](travelling-salesman/) | Where brute force stops being usable and what a heuristic trades away | available |
| [Hybrid quicksort](hybrid-quicksort/) | How the pivot and the small-array threshold change quicksort in practice | available |

## Quiz and documentation

- Quiz questions: [quiz/content/algorithms/](../../quiz/content/algorithms/)
- Documentation: [docs/en/algorithms/](../../docs/en/algorithms/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Algorithms](https://www.khanacademy.org/computing/computer-science/algorithms), Khan Academy, with Thomas Cormen and Devin Balkcom. Free. A gentle unit with text and exercises on binary search, the classic sorts, recursion and graph search.
- [VisuAlgo: Sorting](https://visualgo.net/en/sorting), Steven Halim, National University of Singapore. Free. Animates each sorting algorithm on your own input and counts comparisons and swaps.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. In Portuguese. Free. Notes in Portuguese on searching, the classic sorts, heapsort, quicksort and backtracking, with invariants.

### Books

- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Paid. The standard reference for sorting, dynamic programming, greedy algorithms and graph algorithms.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Free online, paid in print. Very practical on sorting: the book site compares the algorithms and gives tested Java code.
- [The Algorithm Design Manual, 3rd edition](https://www.algorist.com/), Steven Skiena. Paid. Teaches how to recognise which technique fits a problem, with a catalogue of classic problems.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Free online, paid in print. A free textbook with excellent chapters on backtracking, dynamic programming and greedy algorithms.
- [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf), Antti Laaksonen. Free. A compact book that goes from sorting to dynamic programming and graphs through problems.

### Courses and lectures

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Free. Lectures and problem sets on sorting, shortest paths and a clear framework for dynamic programming.
- [Algorithms, Part I](https://www.coursera.org/learn/algorithms-part1), Robert Sedgewick and Kevin Wayne, Princeton (Coursera). Free to audit, paid certificate. Video course on union-find, the sorting algorithms, priority queues and search trees, with graded programming tasks.
- [Algorithms Illuminated](https://www.algorithmsilluminated.org/), Tim Roughgarden, Stanford. Free online, paid in print. The site of the book series links the free video lectures on divide and conquer, greedy and dynamic programming.

### Papers and specifications

- [Timsort: listsort.txt](https://github.com/python/cpython/blob/main/Objects/listsort.txt), Tim Peters, CPython. Free. The author's own description of the hybrid merge sort used by Python, with measurements.
- [Pattern-defeating Quicksort](https://arxiv.org/abs/2106.05123), Orson Peters (2021). Free. A modern hybrid quicksort, used in Rust and C++ libraries, explained by its author.
- [A Note on Two Problems in Connexion with Graphs](https://ir.cwi.nl/pub/9256/9256D.pdf), Edsger W. Dijkstra (1959). Free. The three-page paper with the shortest path algorithm and a minimum spanning tree algorithm.

### Videos

- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Free. Whiteboard lectures on divide and conquer, greedy method, dynamic programming and backtracking.
- [15 Sorting Algorithms in 6 Minutes](https://www.youtube.com/watch?v=kPRA0W1kECg), Timo Bingmann. Free. A famous visualisation with sound that makes the behaviour of each sort recognisable.
- [Graph Theory Playlist](https://www.youtube.com/playlist?list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P), William Fiset. Free. Animated explanations of shortest paths, spanning trees, topological sort and the travelling salesman.

### Practice and tools

- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Free. Reference articles with proofs and code for graph algorithms, dynamic programming and more.
- [CSES Problem Set](https://cses.fi/problemset/), Antti Laaksonen, University of Helsinki. Free. A graded collection of problems by technique, with an online judge.
- [beecrowd](https://beecrowd.com/), beecrowd. In Portuguese. Free. A Brazilian online judge with statements in Portuguese, widely used in university courses.
- [Advent of Code](https://adventofcode.com/), Eric Wastl. Free. Yearly puzzles that reward choosing the right algorithm over brute force.

### Communities

- [Codeforces](https://codeforces.com/), Mike Mirzayanov. Free. Contests and a very active community with editorials that explain each solution.
- [Stack Overflow: algorithm tag](https://stackoverflow.com/questions/tagged/algorithm), Stack Overflow. Free. A large archive of answered questions on choosing and implementing algorithms.
- [r/algorithms](https://www.reddit.com/r/algorithms/), Reddit. Free. Discussion of algorithms, from study doubts to recent results.
