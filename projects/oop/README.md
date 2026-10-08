# Object-oriented programming

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Object-oriented programming organises a program as objects that keep their own state and expose behaviour through an interface. Encapsulation, polymorphism, inheritance and composition are tools for controlling how a change in one part spreads to the others. Most business code is written this way, so knowing where the ideas help, and where they produce coupling and code smells, matters every day.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Same domain in OOP and functional style (`oop-vs-functional`) | What changes when the same rules are written with objects or with functions | planned |
| Executable code smell catalogue (`code-smells`) | How to recognise and remove common smells | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/oop/`).
- Documentation: planned (`docs/en/oop/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [The Java Tutorials: Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/), Oracle. Free. A short official lesson on objects, classes, inheritance, interfaces and packages.
- [Curso de Java: Programação Orientada a Objetos](https://www.cursoemvideo.com/curso/java-poo/), Gustavo Guanabara, Curso em Vídeo. In Portuguese. Free. A beginner video course in Portuguese on classes, encapsulation, inheritance and polymorphism.
- [Code Smells](https://refactoring.guru/refactoring/smells), Refactoring Guru. Free. An illustrated catalogue of smells, each with its causes and the refactorings that treat it.

### Books

- [Effective Java, 3rd edition](https://www.informit.com/store/effective-java-9780134685991), Joshua Bloch. Paid. Concrete advice on designing classes, favouring composition, generics, exceptions and immutability.
- [Refactoring, 2nd edition](https://martinfowler.com/books/refactoring.html), Martin Fowler. Paid. The book that named the code smells and catalogued the refactorings that remove them.
- [Practical Object-Oriented Design, 2nd edition](https://sandimetz.com/products), Sandi Metz. Paid. The most readable book on dependencies, duck typing and composition over inheritance.
- [Orientação a Objetos e SOLID para Ninjas](https://www.casadocodigo.com.br/products/livro-oo-solid), Maurício Aniche, Casa do Código. In Portuguese. Paid. A short book in Portuguese on cohesion, coupling and class design, one of the sources of the quiz.
- [Think Java, 2nd edition](https://greenteapress.com/wp/think-java-2e/), Allen Downey and Chris Mayfield. Free. A free introductory textbook that reaches objects, inheritance and class design step by step.

### Courses and lectures

- [Java Programming MOOC](https://java-programming.mooc.fi/), University of Helsinki. Free. A free two-part course with hundreds of checked exercises on objects, interfaces, collections and streams.
- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Free. Public readings on specifications, abstract data types, interfaces, equality and mutability.
- [Apostila Java e Orientação a Objetos](https://www.alura.com.br/apostila-java-orientacao-objetos), Caelum and Alura. In Portuguese. Free. The free course handout in Portuguese used by a generation of Brazilian Java developers.

### Papers and specifications

- [The Early History of Smalltalk](https://worrydream.com/EarlyHistoryOfSmalltalk/), Alan Kay (1993). Free. The person who coined the term explains what objects and messages were meant to be.
- [CodeSmell](https://martinfowler.com/bliki/CodeSmell.html), Martin Fowler. Free. A short note on what a smell is: a surface sign worth investigating, not a rule.

### Official documentation

- [TypeScript Handbook: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), Microsoft. Free. Classes, visibility, abstract classes and interfaces in the reference language of this repository.
- [The Rust Programming Language: Object-Oriented Programming Features](https://doc.rust-lang.org/book/ch18-00-oop.html), The Rust Project. Free. How a language without inheritance provides encapsulation and polymorphism through traits.
- [Elixir: Protocols](https://hexdocs.pm/elixir/protocols.html), The Elixir Team. Free. Polymorphism in a functional language, for comparing with interfaces and dynamic dispatch.

### Videos

- [Nothing is Something](https://www.youtube.com/watch?v=OMPfEXIlTVE), Sandi Metz, RailsConf. Free. A talk on replacing conditionals and inheritance with composition and small objects.
- [Object-Oriented Programming is Bad](https://www.youtube.com/watch?v=QM1iUe6IofM), Brian Will. Free. A well-argued critique, useful to understand the limits of the paradigm.
- [Curso de POO Java](https://www.youtube.com/playlist?list=PLHz_AreHm4dkqe2aR0tQK74m8SFe-aGsY), Gustavo Guanabara, Curso em Vídeo. In Portuguese. Free. The YouTube playlist of the Portuguese object-oriented programming course listed above.

### Practice and tools

- [Refactoring catalog](https://refactoring.guru/refactoring/catalog), Refactoring Guru. Free. Each refactoring with a before and after example and the smell it treats.
- [Exercism](https://exercism.org/), Exercism. Free. Practice exercises with mentoring in Java, TypeScript and dozens of other languages.

### Communities

- [Software Engineering Stack Exchange: object-oriented tag](https://softwareengineering.stackexchange.com/questions/tagged/object-oriented), Stack Exchange. Free. Design discussions on inheritance, composition, encapsulation and coupling.
- [Stack Overflow: oop tag](https://stackoverflow.com/questions/tagged/oop), Stack Overflow. Free. Answered practical questions on object-oriented code in every language.
