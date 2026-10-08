# Big O and algorithm analysis

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Algorithm analysis is the tool for predicting how the cost of a program grows with the size of its input, before running it. It gives the vocabulary (O, Ω, Θ), the techniques (counting operations, recurrences, amortised analysis) and the limits (lower bounds, P and NP) that every other area in this repository relies on when it says that something is fast or slow.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Big O lab](big-o-lab/) | How to measure a function and recognise its growth curve | available |
| [Interactive master theorem](master-theorem/) | How the three cases of the master theorem decide the cost of a recurrence | available |
| [The lower bound of comparison sorting](sorting-lower-bound/) | Why no comparison sort beats Ω(n lg n) and how counting sorts escape it | available |

## Quiz and documentation

- Quiz questions: [quiz/content/big-o/](../../quiz/content/big-o/)
- Documentation: [docs/en/big-o/](../../docs/en/big-o/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Asymptotic notation](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation), Khan Academy, with Thomas Cormen and Devin Balkcom. Free. A gentle first reading on why constants are dropped and what O, Ω and Θ mean.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/), Eric Rowell. Free. One page with the time and space cost of common data structure operations and sorting algorithms.
- [Análise de Algoritmos](https://www.ime.usp.br/~pf/analise_de_algoritmos/), Paulo Feofiloff, IME-USP. In Portuguese. Free. Lecture notes in Portuguese covering notation, recurrences, invariants and proofs of correctness with rigour.

### Books

- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Paid. The standard reference: chapters 2 to 4 for notation and recurrences, 16 for amortised analysis, 34 for NP-completeness.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Free online, paid in print. A free textbook with a clear treatment of recursion, recurrences and NP-hardness, plus many exercises.
- [Algorithms, 4th edition: Analysis of Algorithms](https://algs4.cs.princeton.edu/14analysis/), Robert Sedgewick and Kevin Wayne, Princeton. Free. The book site chapter on the scientific method for running time: measure, hypothesise, predict, verify.

### Courses and lectures

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare, Demaine, Ku and Solomon. Free. Lectures, notes and problem sets that use asymptotic analysis on every data structure and algorithm.
- [MIT 6.042J Mathematics for Computer Science](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/), MIT OpenCourseWare, Tom Leighton and Marten van Dijk. Free. The mathematics behind the analysis: induction, sums, asymptotics, recurrences and counting.
- [MIT 6.046J Design and Analysis of Algorithms](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/), MIT OpenCourseWare, Demaine, Devadas and Lynch. Free. The follow-up course, with amortised analysis, randomisation and complexity classes in depth.

### Papers and specifications

- [Master theorem (analysis of algorithms)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29), Wikipedia. Free. A compact statement of the three cases with worked examples and the cases the theorem does not cover.
- [P vs NP](https://www.claymath.org/millennium/p-vs-np/), Clay Mathematics Institute. Free. The official statement of the open problem, with Stephen Cook's description of it.

### Videos

- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Free. The recorded lectures of the course above, starting from the model of computation and asymptotic notation.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Free. Whiteboard lectures that count operations step by step and solve recurrences by hand.
- [P vs. NP and the Computational Complexity Zoo](https://www.youtube.com/watch?v=YX40hbAHx3s), hackerdashery. Free. A ten-minute animated introduction to complexity classes and why P versus NP matters.

### Practice and tools

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Free. Step-by-step animations where the cost of each operation can be watched as the input changes.

### Communities

- [Computer Science Stack Exchange: asymptotics tag](https://cs.stackexchange.com/questions/tagged/asymptotics), Stack Exchange. Free. Answered questions about notation and proofs, including the reference threads on solving recurrences.
- [Stack Overflow: big-o tag](https://stackoverflow.com/questions/tagged/big-o), Stack Overflow. Free. Practical questions on the complexity of real code, with very detailed canonical answers.
