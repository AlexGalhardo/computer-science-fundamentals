# Máquinas de estados

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una máquina de estados describe un comportamiento como un conjunto finito de estados y las transiciones entre ellos. Es a la vez un modelo teórico (autómatas, lenguajes regulares, máquinas de Turing y los límites de la computación) y una herramienta de diseño práctica: los protocolos, los parsers, las interfaces de usuario y los flujos de trabajo del negocio se vuelven más fáciles de razonar, y las situaciones inválidas se vuelven imposibles de representar, cuando los estados se hacen explícitos.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Máquina de estados de un pedido](order-state-machine/) | Cómo los estados y transiciones explícitos eliminan situaciones inválidas | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/state-machines/](../../quiz/content/state-machines/)
- Documentación: [docs/es/state-machines/](../../docs/es/state-machines/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Welcome to the world of Statecharts](https://statecharts.dev/), statecharts community. Gratis. Una introducción clara a las máquinas de estados y los statecharts, con los problemas que resuelve cada concepto.
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html), Robert Nystrom. Gratis. Parte de una maraña de banderas y llega a las máquinas de estados finitos, las jerarquías y los autómatas de pila.
- [State pattern](https://refactoring.guru/design-patterns/state), Refactoring Guru. Gratis. El patrón State orientado a objetos con diagramas y código, también disponible en español en el sitio.

### Libros

- [Introduction to the Theory of Computation, 3rd edition](https://math.mit.edu/~sipser/book.html), Michael Sipser. De pago. El libro de texto estándar sobre autómatas, lenguajes regulares y libres de contexto, máquinas de Turing y computabilidad.
- [Practical UML Statecharts in C/C++, 2nd edition](https://www.state-machine.com/psicc2), Miro Samek. Gratis. Un libro sobre cómo implementar máquinas de estados jerárquicas en software real, gratis en PDF del autor.

### Cursos y clases

- [MIT 18.404J Theory of Computation](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/), Michael Sipser, MIT OpenCourseWare. Gratis. Clases en video del autor del libro de texto, desde los autómatas finitos hasta la indecidibilidad y la complejidad.
- [CS 103 Mathematical Foundations of Computing](https://web.stanford.edu/class/cs103/), Stanford University. Gratis. Diapositivas y materiales sobre DFA, NFA, expresiones regulares, gramáticas libres de contexto y máquinas de Turing.

### Artículos y especificaciones

- [On Computable Numbers, with an Application to the Entscheidungsproblem](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf), Alan Turing (1936). Gratis. El artículo que definió la máquina de Turing y demostró que algunos problemas no se pueden decidir.
- [State Chart XML (SCXML)](https://www.w3.org/TR/scxml/), W3C. Gratis. Un estándar que fija la semántica de ejecución de los statecharts: guardas, acciones y estados paralelos.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Gratis. Muestra el camino de la expresión regular al NFA y al DFA con pequeños programas en C.
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Gratis. Su diagrama de estados de conexión es la máquina de estados más conocida en un protocolo real.
- [Statecharts in the Making: A Personal Account](https://weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf), David Harel (2007). Gratis. El inventor de los statecharts cuenta cómo se añadieron la jerarquía, los estados paralelos y la comunicación por difusión a los diagramas de estados, y por qué.

### Documentación oficial

- [XState and Stately documentation](https://stately.ai/docs), Stately. Gratis. La documentación de la principal biblioteca de statecharts para TypeScript: estados, eventos, guardas, acciones y actores.
- [gen_statem](https://www.erlang.org/doc/apps/stdlib/gen_statem.html), Erlang/OTP. Gratis. El comportamiento estándar de máquina de estados de la BEAM, usado desde Elixir para protocolos y flujos de trabajo.
- [Mermaid: State diagrams](https://mermaid.js.org/syntax/stateDiagram.html), Mermaid. Gratis. La sintaxis para dibujar diagramas de estados a partir de texto, como hace el miniproyecto desde su código.

### Videos

- [MIT 18.404J Theory of Computation, Fall 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY), Michael Sipser, MIT OpenCourseWare. Gratis. Las clases grabadas del curso anterior.
- [Theory of Computation and Automata Theory](https://www.youtube.com/playlist?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwKOIev), Neso Academy. Gratis. Ejemplos resueltos breves de diseño de DFA, conversión de NFA a DFA, minimización y máquinas de Mealy y Moore.
- [Infinitely Better UIs with Finite Automata](https://www.youtube.com/watch?v=VU1NKX6Qkxc), David Khourshid. Gratis. Una charla sobre por qué las máquinas de estados explícitas hacen predecible la lógica de la interfaz de usuario.

### Práctica y herramientas

- [JFLAP](https://www.jflap.org/), Susan Rodger, Duke University. Gratis. Una herramienta para construir y simular autómatas, gramáticas y máquinas de Turing, y convertir entre ellos.
- [FSM Simulator](https://ivanzuzak.info/noam/webapps/fsm_simulator/), Ivan Zuzak. Gratis. Construye un autómata a partir de una expresión regular en el navegador y recorre una entrada paso a paso.

### Comunidades

- [Computer Science Stack Exchange: automata tag](https://cs.stackexchange.com/questions/tagged/automata), Stack Exchange. Gratis. Preguntas respondidas sobre construcciones de autómatas, demostraciones y lenguajes regulares.
- [XState discussions](https://github.com/statelyai/xstate/discussions), Stately community. Gratis. Donde se responden preguntas prácticas sobre cómo modelar la lógica de una aplicación como máquinas de estados.
