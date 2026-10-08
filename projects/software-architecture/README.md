# Software architecture

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Software architecture is the set of decisions that are expensive to change: how a system is split into parts, which way the dependencies point, and which quality attributes (performance, availability, ease of change) are favoured. Layered, hexagonal and clean architectures, monoliths and microservices, events and CQRS are answers to the same question: how to keep the business rules independent from the details around them.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Clean architecture application (`clean-architecture-app`) | How the dependency rule keeps business rules free of frameworks | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/software-architecture/`).
- Documentation: planned (`docs/en/software-architecture/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin. Free. The original post with the concentric circles and the dependency rule.
- [Software Architecture Guide](https://martinfowler.com/architecture/), Martin Fowler. Free. An index of articles on what architecture is, application boundaries, microservices and evolution.
- [Engenharia de Software Moderna, capítulo 7: Arquitetura](https://engsoftmoderna.info/cap7.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese on layers, MVC, microservices, message queues and publish/subscribe.
- [The C4 model for visualising software architecture](https://c4model.com/), Simon Brown. Free. A simple way to draw architecture at four levels: context, containers, components and code.

### Books

- [Clean Architecture](https://www.informit.com/store/clean-architecture-a-craftsmans-guide-to-software-structure-9780134494166), Robert C. Martin. Paid. The book on entities, use cases, interface adapters and component principles.
- [Fundamentals of Software Architecture](https://fundamentalsofsoftwarearchitecture.com/), Mark Richards and Neal Ford. Paid. A survey of architecture styles and characteristics, with the trade-offs of each style rated.
- [Architecture Patterns with Python](https://www.cosmicpython.com/), Harry Percival and Bob Gregory. Free online, paid in print. Free online: repository, unit of work, events and CQRS applied step by step with tests.
- [Arquitetura Limpa na Prática](https://hotmart.com/pt-br/marketplace/produtos/livro-arquitetura-limpa-na-pratica/O59619511K), Otávio Lemos. In Portuguese. Paid. A short Brazilian book that applies clean architecture to a TypeScript API, a source of the quiz.
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/), Eric Evans. Free. A free summary of the definitions and patterns of the Domain-Driven Design book.
- [A Philosophy of Software Design, 2nd edition](https://web.stanford.edu/~ouster/cgi-bin/aposd.php), John Ousterhout. Paid. A short book on complexity, deep modules and information hiding.

### Courses and lectures

- [MIT 6.033 Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/), MIT OpenCourseWare. Free. Lectures on modularity, abstraction, layering and the design of large systems, with classic papers.

### Papers and specifications

- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), Alistair Cockburn. Free. The original article on ports and adapters, by its author.
- [Microservices](https://martinfowler.com/articles/microservices.html), James Lewis and Martin Fowler (2014). Free. The article that defined the style and its characteristics, including its costs.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Michael Nygard (2011). Free. The short post that proposed architecture decision records and their format.
- [How Do Committees Invent?](https://www.melconway.com/Home/Committees_Paper.html), Melvin Conway (1968). Free. The source of Conway's law: systems mirror the communication structure of those who build them.
- [Big Ball of Mud](http://www.laputan.org/mud/), Brian Foote and Joseph Yoder (1997). Free. A frank study of the most common architecture of all and the forces that produce it.
- [CQRS](https://martinfowler.com/bliki/CQRS.html), Martin Fowler. Free. A short, cautious explanation of separating the read model from the write model.

### Official documentation

- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), Microsoft Azure Architecture Center. Free. A catalogue of distributed system patterns with the problem, the solution and the considerations.
- [Architectural Decision Records](https://adr.github.io/), ADR GitHub organisation. Free. Templates, tools and examples for writing decision records.
- [The Twelve-Factor App](https://12factor.net/), Adam Wiggins. Free. Twelve rules for building services that are easy to deploy and to scale.

### Videos

- [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g), Simon Brown. Free. A conference talk on why most architecture diagrams fail and how to draw useful ones.
- [Full Cycle](https://www.youtube.com/@FullCycle), Wesley Willians. In Portuguese. Free. A Brazilian channel with talks and lessons on architecture, microservices and domain-driven design.
- [Rodrigo Branas](https://www.youtube.com/@RodrigoBranas), Rodrigo Branas. In Portuguese. Free. A Brazilian channel with lessons in Portuguese on clean architecture, domain-driven design and SOLID.

### Practice and tools

- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), Sander Verweij. Free. Validates and draws the dependencies of a TypeScript project, useful to enforce the dependency rule.

### Communities

- [Software Engineering Stack Exchange: architecture tag](https://softwareengineering.stackexchange.com/questions/tagged/architecture), Stack Exchange. Free. Discussions of concrete architecture trade-offs.
