# Testing

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Automated testing is how a team knows that the software still works after each change. The subject covers the levels of tests (unit, integration, end-to-end), the techniques for writing them (test doubles, test-driven development, property-based and mutation testing) and their failure modes, such as flaky tests and coverage numbers that prove nothing. Good tests are what make refactoring and continuous delivery safe.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Full test pyramid (`test-pyramid`) | What each test level is for and what it costs | planned |
| TDD kata with commit history (`tdd-kata`) | The red, green, refactor rhythm | planned |
| Mutation testing (`mutation-testing`) | Why coverage does not measure test quality | planned |
| Flaky test lab (`flaky-tests`) | The usual causes of intermittent tests | planned |
| Mini xUnit from scratch (`mini-xunit`) | How a test framework works inside | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/testing/`).
- Documentation: planned (`docs/en/testing/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Ham Vocke. Free. A long worked example of unit, integration, contract and end-to-end tests on one application.
- [Engenharia de Software Moderna, capítulo 8: Testes](https://engsoftmoderna.info/cap8.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese on the pyramid, unit tests, mocks, TDD, coverage and flaky tests.
- [Test Desiderata](https://testdesiderata.com/), Kent Beck. Free. Twelve properties of a good test, each with a short video, and the trade-offs between them.

### Books

- [Test-Driven Development: By Example](https://www.informit.com/store/test-driven-development-by-example-9780321146533), Kent Beck. Paid. The source of the multi-currency money kata and of the xUnit example rebuilt in this area.
- [Software Engineering at Google: Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), Winters, Manshreck and Wright. Free. Free chapters on test sizes, unit tests, test doubles and larger tests, from a huge codebase.
- [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing), Vladimir Khorikov. Paid. Defines what makes a unit test valuable and when mocks help or harm.
- [xUnit Test Patterns](http://xunitpatterns.com/), Gerard Meszaros. Free online, paid in print. The catalogue of test smells and patterns that defined the vocabulary of test doubles, free online.
- [Effective Software Testing](https://www.manning.com/books/effective-software-testing), Maurício Aniche. Paid. Systematic test design: specification-based testing, boundaries, structural and property-based testing.

### Courses and lectures

- [MIT 6.031 Reading 3: Testing](https://web.mit.edu/6.031/www/sp22/classes/03-testing/), MIT. Free. A clear reading on choosing test cases by partitioning the input space and covering boundaries.

### Papers and specifications

- [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), Martin Fowler. Free. The article that separates the kinds of test doubles and the classical and mockist styles.
- [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), John Micco, Google Testing Blog. Free. Numbers and causes of flakiness at scale, and what is done about it.
- [State of Mutation Testing at Google](https://research.google/pubs/state-of-mutation-testing-at-google/), Goran Petrović and Marko Ivanković (2018). Free. How mutation testing is made practical in code review on a very large codebase.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Free. The paper that introduced property-based testing.
- [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html), Mike Wacker, Google Testing Blog. Free. The argument for the pyramid: why many end-to-end tests give slow and unreliable feedback.

### Official documentation

- [Playwright documentation](https://playwright.dev/docs/intro), Microsoft. Free. The official guide to the end-to-end tool of this repository: locators, auto-waiting and trace viewer.
- [Bun test runner](https://bun.sh/docs/test), Oven. Free. The documentation of the test runner used by the TypeScript mini-projects.
- [Stryker Mutator documentation](https://stryker-mutator.io/docs/), Stryker team. Free. Mutation testing for JavaScript and TypeScript, with an explanation of mutants and the score.
- [fast-check](https://fast-check.dev/), Nicolas Dubien. Free. Property-based testing for TypeScript.

### Videos

- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM), Ian Cooper. Free. A talk on testing behaviour instead of implementation details, going back to Kent Beck's book.
- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Free. Weekly videos on TDD, acceptance testing and test strategy.

### Practice and tools

- [Kata Catalogue](https://codingdojo.org/kata/), Coding Dojo community. Free. A list of small exercises for practising TDD, such as FizzBuzz, Bowling and Roman Numerals.
- [Gilded Rose Refactoring Kata](https://github.com/emilybache/GildedRose-Refactoring-Kata), Emily Bache. Free. Legacy code in dozens of languages for practising characterisation tests and safe refactoring.

### Communities

- [Software Quality Assurance and Testing Stack Exchange](https://sqa.stackexchange.com/), Stack Exchange. Free. Questions and answers on test design, automation and strategy.
- [Ministry of Testing](https://www.ministryoftesting.com/), Ministry of Testing. Free online, paid in print. A large testing community with a forum, articles and events.
