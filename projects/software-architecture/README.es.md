# Arquitectura de software

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La arquitectura de software es el conjunto de decisiones que son costosas de cambiar: cómo se divide un sistema en partes, hacia dónde apuntan las dependencias y qué atributos de calidad (rendimiento, disponibilidad, facilidad de cambio) se favorecen. Las arquitecturas en capas, hexagonal y limpia, los monolitos y los microservicios, los eventos y CQRS son respuestas a la misma pregunta: cómo mantener las reglas de negocio independientes de los detalles que las rodean.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| Aplicación con arquitectura limpia (`clean-architecture-app`) | Cómo la regla de dependencia mantiene las reglas de negocio libres de frameworks | planeado |

## Quiz y documentación

- Preguntas del quiz: planeado (`quiz/content/software-architecture/`).
- Documentación: planeado (`docs/es/software-architecture/`).
- Referencias de todas las áreas: [REFERENCES.md](../../REFERENCES.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Cada enlace fue verificado cuando se escribió la lista.

### Empieza aquí

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin. Gratis. La publicación original con los círculos concéntricos y la regla de dependencia.
- [Software Architecture Guide](https://martinfowler.com/architecture/), Martin Fowler. Gratis. Un índice de artículos sobre qué es la arquitectura, los límites de una aplicación, los microservicios y la evolución.
- [Engenharia de Software Moderna, capítulo 7: Arquitetura](https://engsoftmoderna.info/cap7.html), Marco Tulio Valente, UFMG. En portugués. Gratis. Un capítulo gratuito en portugués sobre capas, MVC, microservicios, colas de mensajes y publicación/suscripción.
- [The C4 model for visualising software architecture](https://c4model.com/), Simon Brown. Gratis. Una forma sencilla de dibujar la arquitectura en cuatro niveles: contexto, contenedores, componentes y código.

### Libros

- [Clean Architecture](https://www.informit.com/store/clean-architecture-a-craftsmans-guide-to-software-structure-9780134494166), Robert C. Martin. De pago. El libro sobre entidades, casos de uso, adaptadores de interfaz y principios de componentes.
- [Fundamentals of Software Architecture](https://fundamentalsofsoftwarearchitecture.com/), Mark Richards y Neal Ford. De pago. Un panorama de estilos y características de arquitectura, con los compromisos (trade-offs) de cada estilo calificados.
- [Architecture Patterns with Python](https://www.cosmicpython.com/), Harry Percival y Bob Gregory. Gratis en línea, de pago en papel. Gratis en línea: repository, unit of work, eventos y CQRS aplicados paso a paso con pruebas.
- [Arquitetura Limpa na Prática](https://hotmart.com/pt-br/marketplace/produtos/livro-arquitetura-limpa-na-pratica/O59619511K), Otávio Lemos. En portugués. De pago. Un libro brasileño breve que aplica la arquitectura limpia a una API en TypeScript, una de las fuentes del quiz.
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/), Eric Evans. Gratis. Un resumen gratuito de las definiciones y los patrones del libro de Domain-Driven Design.
- [A Philosophy of Software Design, 2nd edition](https://web.stanford.edu/~ouster/cgi-bin/aposd.php), John Ousterhout. De pago. Un libro breve sobre complejidad, módulos profundos y ocultamiento de información.

### Cursos y conferencias

- [MIT 6.033 Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/), MIT OpenCourseWare. Gratis. Clases sobre modularidad, abstracción, capas y el diseño de sistemas grandes, con papers clásicos.

### Papers y especificaciones

- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), Alistair Cockburn. Gratis. El artículo original sobre puertos y adaptadores, por su autor.
- [Microservices](https://martinfowler.com/articles/microservices.html), James Lewis y Martin Fowler (2014). Gratis. El artículo que definió el estilo y sus características, incluidos sus costos.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Michael Nygard (2011). Gratis. La publicación breve que propuso los registros de decisiones de arquitectura y su formato.
- [How Do Committees Invent?](https://www.melconway.com/Home/Committees_Paper.html), Melvin Conway (1968). Gratis. El origen de la ley de Conway: los sistemas reflejan la estructura de comunicación de quienes los construyen.
- [Big Ball of Mud](http://www.laputan.org/mud/), Brian Foote y Joseph Yoder (1997). Gratis. Un estudio franco de la arquitectura más común de todas y de las fuerzas que la producen.
- [CQRS](https://martinfowler.com/bliki/CQRS.html), Martin Fowler. Gratis. Una explicación breve y cautelosa de la separación entre el modelo de lectura y el modelo de escritura.

### Documentación oficial

- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), Microsoft Azure Architecture Center. Gratis. Un catálogo de patrones de sistemas distribuidos con el problema, la solución y las consideraciones.
- [Architectural Decision Records](https://adr.github.io/), organización ADR en GitHub. Gratis. Plantillas, herramientas y ejemplos para escribir registros de decisiones.
- [The Twelve-Factor App](https://12factor.net/), Adam Wiggins. Gratis. Doce reglas para construir servicios fáciles de desplegar y de escalar.

### Videos

- [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g), Simon Brown. Gratis. Una charla de conferencia sobre por qué fallan la mayoría de los diagramas de arquitectura y cómo dibujar diagramas útiles.
- [Full Cycle](https://www.youtube.com/@FullCycle), Wesley Willians. En portugués. Gratis. Un canal brasileño con charlas y clases sobre arquitectura, microservicios y domain-driven design.
- [Rodrigo Branas](https://www.youtube.com/@RodrigoBranas), Rodrigo Branas. En portugués. Gratis. Un canal brasileño con clases en portugués sobre arquitectura limpia, domain-driven design y SOLID.

### Práctica y herramientas

- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), Sander Verweij. Gratis. Valida y dibuja las dependencias de un proyecto TypeScript, útil para hacer cumplir la regla de dependencia.

### Comunidades

- [Software Engineering Stack Exchange: architecture tag](https://softwareengineering.stackexchange.com/questions/tagged/architecture), Stack Exchange. Gratis. Discusiones sobre compromisos concretos de arquitectura.
