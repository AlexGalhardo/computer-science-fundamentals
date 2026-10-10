# Design patterns and SOLID

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Design patterns are named solutions to design problems that keep coming back, and the SOLID principles are five rules of thumb for keeping classes and modules easy to change. Together they give a shared vocabulary (Strategy, Adapter, Observer, dependency inversion) for discussing design, and the judgement to see when a pattern pays for itself and when it is only ceremony.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Back-end design patterns (`backend-patterns`) | About ten patterns in situations where they pay off | planned |
| SOLID before and after (`solid-before-after`) | What each principle prevents | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/design-patterns/`).
- Documentation: planned (`docs/en/design-patterns/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Design Patterns](https://refactoring.guru/design-patterns), Alexander Shvets, Refactoring Guru. Free. The clearest online catalogue: each pattern with the problem, the structure, pros and cons and code.
- [Padrões de Projeto](https://refactoring.guru/pt-br/design-patterns), Alexander Shvets, Refactoring Guru. In Portuguese. Free. The same catalogue translated into Brazilian Portuguese.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/), Robert Nystrom. Free online, paid in print. Free online: revisits Command, Observer, State and Singleton with honest notes on when not to use them.

### Books

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780201633610), Gamma, Helm, Johnson and Vlissides. Paid. The original catalogue of 23 patterns by the "Gang of Four", still the reference for names and intent.
- [Head First Design Patterns, 2nd edition](https://wickedlysmart.com/head-first-design-patterns/), Eric Freeman and Elisabeth Robson. Paid. The authors' page of the most approachable book: each pattern grows out of a design problem that gets worse first.
- [Catalog of Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/), Martin Fowler. Free. Short summaries of the back-end patterns: Repository, Unit of Work, Data Mapper, Service Layer.
- [Orientação a Objetos e SOLID para Ninjas](https://www.casadocodigo.com.br/products/livro-oo-solid), Maurício Aniche, Casa do Código. In Portuguese. Paid. A short book in Portuguese that explains each SOLID principle through coupling and cohesion.
- [Clean Code](https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884), Robert C. Martin. Paid. One of the sources of the quiz, for naming, small functions and the class-level principles.

### Courses and lectures

- [Design Patterns](https://www.coursera.org/learn/design-patterns), University of Alberta (Coursera). Free to audit, paid certificate. A short course that applies creational, structural and behavioural patterns to one Java application.
- [Engenharia de Software Moderna, capítulo 6: Padrões de Projeto](https://engsoftmoderna.info/cap6.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese that presents ten patterns with motivation and code, plus criticism.

### Papers and specifications

- [The Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), Robert C. Martin. Free. The author's index of the original articles on each of the principles later named SOLID.
- [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), Barbara Liskov and Jeannette Wing (1994). Free. The formal statement of the substitution principle: what a subtype must preserve.
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), Martin Fowler (2004). Free. The article that named dependency injection and compared it with the service locator.
- [The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html), Robert C. Martin. Free. A short post that restates the principle as: one module, one reason to change, one actor.
- [On the Criteria To Be Used in Decomposing Systems into Modules](https://wstomv.win.tue.nl/edu/2ip30/references/criteria_for_modularization.pdf), David Parnas (1972). Free. The origin of information hiding, the idea under most patterns and principles.

### Official documentation

- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript), Refactoring Guru. Free. A runnable TypeScript example of every pattern in the catalogue.
- [Patterns.dev](https://www.patterns.dev/), Lydia Hallie and Addy Osmani. Free. Design, rendering and performance patterns for modern JavaScript applications.

### Videos

- [Design Patterns in Object Oriented Programming](https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc), Christopher Okhravi. Free. Enthusiastic whiteboard explanations of the main patterns, following Head First Design Patterns.

### Practice and tools

- [Refactoring catalog](https://refactoring.guru/refactoring/catalog), Refactoring Guru. Free. The step-by-step transformations used to move existing code towards a pattern.

### Communities

- [Software Engineering Stack Exchange: design-patterns tag](https://softwareengineering.stackexchange.com/questions/tagged/design-patterns), Stack Exchange. Free. Discussions on when a pattern fits and when it is over-engineering.
- [Stack Overflow: solid-principles tag](https://stackoverflow.com/questions/tagged/solid-principles), Stack Overflow. Free. Concrete questions on applying each principle to real code.
