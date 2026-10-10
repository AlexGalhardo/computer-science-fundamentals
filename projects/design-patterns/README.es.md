# Patrones de diseño y SOLID

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Los patrones de diseño son soluciones con nombre para problemas de diseño que siempre vuelven, y los principios SOLID son cinco reglas prácticas para mantener las clases y los módulos fáciles de cambiar. Juntos dan un vocabulario común (Strategy, Adapter, Observer, inversión de dependencias) para discutir el diseño, y el criterio para ver cuándo un patrón se paga y cuándo es solo ceremonia.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Patrones de diseño para back-end (`backend-patterns`) | Unos diez patrones en situaciones en las que valen la pena | planificado |
| SOLID antes y después (`solid-before-after`) | Qué evita cada principio | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/design-patterns/`).
- Documentación: planificada (`docs/es/design-patterns/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Design Patterns](https://refactoring.guru/design-patterns), Alexander Shvets, Refactoring Guru. Gratis. El catálogo en línea más claro: cada patrón con el problema, la estructura, ventajas y desventajas y código.
- [Padrões de Projeto](https://refactoring.guru/pt-br/design-patterns), Alexander Shvets, Refactoring Guru. En portugués. Gratis. El mismo catálogo traducido al portugués de Brasil.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/), Robert Nystrom. Gratis en línea, de pago impreso. Gratis en línea: revisita Command, Observer, State y Singleton con notas honestas sobre cuándo no usarlos.

### Libros

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780201633610), Gamma, Helm, Johnson and Vlissides. De pago. El catálogo original de 23 patrones de la "Gang of Four", todavía la referencia para nombres e intención.
- [Head First Design Patterns, 2nd edition](https://wickedlysmart.com/head-first-design-patterns/), Eric Freeman and Elisabeth Robson. De pago. La página de los autores del libro más accesible: cada patrón nace de un problema de diseño que primero empeora.
- [Catalog of Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/), Martin Fowler. Gratis. Resúmenes cortos de los patrones de back-end: Repository, Unit of Work, Data Mapper, Service Layer.
- [Orientação a Objetos e SOLID para Ninjas](https://www.casadocodigo.com.br/products/livro-oo-solid), Maurício Aniche, Casa do Código. En portugués. De pago. Libro corto en portugués que explica cada principio SOLID mediante acoplamiento y cohesión.
- [Clean Code](https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884), Robert C. Martin. De pago. Una de las fuentes del quiz, para nombres, funciones pequeñas y los principios a nivel de clase.

### Cursos y clases

- [Design Patterns](https://www.coursera.org/learn/design-patterns), University of Alberta (Coursera). Gratis como oyente, certificado de pago. Curso corto que aplica patrones creacionales, estructurales y de comportamiento a una aplicación Java.
- [Engenharia de Software Moderna, capítulo 6: Padrões de Projeto](https://engsoftmoderna.info/cap6.html), Marco Tulio Valente, UFMG. En portugués. Gratis. Capítulo gratuito en portugués que presenta diez patrones con motivación y código, además de críticas.

### Artículos y especificaciones

- [The Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), Robert C. Martin. Gratis. El índice del autor con los artículos originales sobre cada uno de los principios que después se llamaron SOLID.
- [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), Barbara Liskov and Jeannette Wing (1994). Gratis. El enunciado formal del principio de sustitución: qué debe preservar un subtipo.
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), Martin Fowler (2004). Gratis. El artículo que dio nombre a la inyección de dependencias y la comparó con el service locator.
- [The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html), Robert C. Martin. Gratis. Texto corto que reformula el principio como: un módulo, un motivo para cambiar, un actor.
- [On the Criteria To Be Used in Decomposing Systems into Modules](https://wstomv.win.tue.nl/edu/2ip30/references/criteria_for_modularization.pdf), David Parnas (1972). Gratis. El origen del ocultamiento de información, la idea que hay debajo de la mayoría de los patrones y principios.

### Documentación oficial

- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript), Refactoring Guru. Gratis. Un ejemplo ejecutable en TypeScript de cada patrón del catálogo.
- [Patterns.dev](https://www.patterns.dev/), Lydia Hallie and Addy Osmani. Gratis. Patrones de diseño, de renderizado y de rendimiento para aplicaciones JavaScript modernas.

### Videos

- [Design Patterns in Object Oriented Programming](https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc), Christopher Okhravi. Gratis. Explicaciones animadas en la pizarra de los principales patrones, siguiendo Head First Design Patterns.

### Práctica y herramientas

- [Refactoring catalog](https://refactoring.guru/refactoring/catalog), Refactoring Guru. Gratis. Las transformaciones paso a paso que se usan para llevar el código existente hacia un patrón.

### Comunidades

- [Software Engineering Stack Exchange: design-patterns tag](https://softwareengineering.stackexchange.com/questions/tagged/design-patterns), Stack Exchange. Gratis. Discusiones sobre cuándo un patrón encaja y cuándo es exceso de ingeniería.
- [Stack Overflow: solid-principles tag](https://stackoverflow.com/questions/tagged/solid-principles), Stack Overflow. Gratis. Dudas concretas sobre la aplicación de cada principio en código real.
