# Functional programming

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Functional programming builds programs from pure functions and immutable data, pushing side effects to the edges. Code written this way is easier to test, to reason about and to run concurrently, because a function's result depends only on its arguments. Higher-order functions, closures, pattern matching and types such as Option and Result have moved from Haskell and Elixir into TypeScript, Rust and Java.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Pure functions and property-based tests (`pure-functions-properties`) | Why pure code is easy to test and what properties find | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/functional-programming/`).
- Documentation: planned (`docs/en/functional-programming/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS), Kyle Simpson. Free. A pragmatic free book on pure functions, closures, composition and immutability without heavy theory.
- [Elixir School](https://elixirschool.com/pt), Elixir School contributors. In Portuguese. Free. Free lessons on Elixir in Portuguese (and many other languages): pattern matching, pipes, recursion, processes.
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/), Scott Wlaschin. Free. The best-known explanation of error handling with Result types, as a picture of two tracks.

### Books

- [Structure and Interpretation of Computer Programs, 2nd edition](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html), Harold Abelson and Gerald Jay Sussman. Free. The classic on abstraction with functions, recursion, higher-order procedures and interpreters.
- [Learn You a Haskell for Great Good!](https://learnyouahaskell.github.io/), Miran Lipovača, community edition. Free. A friendly free introduction to types, currying, laziness, functors and monads.
- [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity), Eric Normand. Paid. Teaches functional thinking in JavaScript by separating actions, calculations and data.
- [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/), Scott Wlaschin. Paid. Shows how algebraic data types make invalid states impossible to represent in business code.
- [How to Design Programs, 2nd edition](https://htdp.org/), Felleisen, Findler, Flatt and Krishnamurthi. Free. A free textbook that teaches systematic program design with functions and data definitions.

### Courses and lectures

- [Programming Languages, Part A](https://www.coursera.org/learn/programming-languages), Dan Grossman, University of Washington (Coursera). Free to audit, paid certificate. A demanding course on functional programming in ML: recursion, pattern matching, closures and type inference.
- [Haskell MOOC](https://haskell.mooc.fi/), University of Helsinki. Free. A free online course with automatically checked exercises, from basics to monads.

### Papers and specifications

- [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf), John Hughes (1990). Free. The paper that argues higher-order functions and lazy evaluation are tools for modularity.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Free. The origin of property-based testing: state a property and let the tool search for a counterexample.
- [Out of the Tar Pit](https://curtclifton.net/papers/MoseleyMarks06a.pdf), Ben Moseley and Peter Marks (2006). Free. An influential essay on state as the main source of complexity in software.
- [Monads for functional programming](https://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf), Philip Wadler (1995). Free. The tutorial paper that shows monads structuring errors, state and output in a pure language.

### Official documentation

- [Elixir: Getting Started](https://hexdocs.pm/elixir/introduction.html), The Elixir Team. Free. The official guide: immutability, pattern matching, recursion, enumerables and streams.
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), Microsoft. Free. Discriminated unions and exhaustiveness checking, the TypeScript form of algebraic data types.
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures), Mozilla. Free. A careful explanation of lexical scope and closures with small examples.

### Videos

- [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY), Anjana Vakil, JSUnconf. Free. A thirty-minute beginner talk on pure functions, higher-order functions and immutability.
- [Simple Made Easy](https://www.infoq.com/presentations/Simple-Made-Easy/), Rich Hickey. Free. The talk that separates simple from easy and argues for values over mutable state.
- [Functional Design Patterns](https://www.youtube.com/watch?v=srQt1NAHYC0), Scott Wlaschin, NDC. Free. A talk that maps object-oriented patterns to functions, composition, functors and monads.

### Practice and tools

- [fast-check](https://fast-check.dev/), Nicolas Dubien. Free. The property-based testing library for TypeScript, with a guide to writing good properties.
- [StreamData](https://hexdocs.pm/stream_data/StreamData.html), Andrea Leopardi and the Elixir Team. Free. Data generation and property-based testing for Elixir.
- [Exercism: Elixir track](https://exercism.org/tracks/elixir), Exercism. Free. Exercises with mentoring that train recursion, pattern matching and pipelines.

### Communities

- [Elixir Forum](https://elixirforum.com/), Elixir community. Free. A welcoming forum for questions on functional design in Elixir.
- [r/functionalprogramming](https://www.reddit.com/r/functionalprogramming/), Reddit. Free. Discussion across languages, with many reading recommendations.
