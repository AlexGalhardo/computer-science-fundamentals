# Programación funcional

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La programación funcional construye programas con funciones puras y datos inmutables, empujando los efectos secundarios hacia los bordes. El código escrito así es más fácil de probar, de razonar y de ejecutar de forma concurrente, porque el resultado de una función depende solo de sus argumentos. Las funciones de orden superior, las closures, el pattern matching y tipos como Option y Result han pasado de Haskell y Elixir a TypeScript, Rust y Java.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| Funciones puras y pruebas basadas en propiedades (`pure-functions-properties`) | Por qué el código puro es fácil de probar y qué encuentran las propiedades | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/functional-programming/`).
- Documentación: planificada (`docs/es/functional-programming/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se comprobaron cuando se escribió la lista.

### Empieza aquí

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS), Kyle Simpson. Gratis. Un libro gratuito y pragmático sobre funciones puras, closures, composición e inmutabilidad sin teoría pesada.
- [Elixir School](https://elixirschool.com/pt), Elixir School contributors. En portugués. Gratis. Lecciones gratuitas de Elixir en portugués (y en muchos otros idiomas): pattern matching, pipes, recursión, procesos.
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/), Scott Wlaschin. Gratis. La explicación más conocida del manejo de errores con tipos Result, como una imagen de dos vías.

### Libros

- [Structure and Interpretation of Computer Programs, 2nd edition](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html), Harold Abelson and Gerald Jay Sussman. Gratis. El clásico sobre abstracción con funciones, recursión, procedimientos de orden superior e intérpretes.
- [Learn You a Haskell for Great Good!](https://learnyouahaskell.github.io/), Miran Lipovača, community edition. Gratis. Una introducción gratuita y amigable a los tipos, el currying, la evaluación perezosa, los functores y las mónadas.
- [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity), Eric Normand. De pago. Enseña el pensamiento funcional en JavaScript separando acciones, cálculos y datos.
- [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/), Scott Wlaschin. De pago. Muestra cómo los tipos algebraicos hacen imposible representar estados inválidos en código de negocio.
- [How to Design Programs, 2nd edition](https://htdp.org/), Felleisen, Findler, Flatt and Krishnamurthi. Gratis. Un libro de texto gratuito que enseña el diseño sistemático de programas con funciones y definiciones de datos.

### Cursos y clases

- [Programming Languages, Part A](https://www.coursera.org/learn/programming-languages), Dan Grossman, University of Washington (Coursera). Gratis como oyente, certificado de pago. Un curso exigente de programación funcional en ML: recursión, pattern matching, closures e inferencia de tipos.
- [Haskell MOOC](https://haskell.mooc.fi/), University of Helsinki. Gratis. Un curso en línea gratuito con ejercicios corregidos automáticamente, desde lo básico hasta las mónadas.

### Artículos y especificaciones

- [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf), John Hughes (1990). Gratis. El artículo que defiende que las funciones de orden superior y la evaluación perezosa son herramientas de modularidad.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Gratis. El origen de las pruebas basadas en propiedades: enuncia una propiedad y deja que la herramienta busque un contraejemplo.
- [Out of the Tar Pit](https://curtclifton.net/papers/MoseleyMarks06a.pdf), Ben Moseley and Peter Marks (2006). Gratis. Un ensayo influyente sobre el estado como principal fuente de complejidad en el software.
- [Monads for functional programming](https://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf), Philip Wadler (1995). Gratis. El artículo-tutorial que muestra cómo las mónadas estructuran errores, estado y salida en un lenguaje puro.

### Documentación oficial

- [Elixir: Getting Started](https://hexdocs.pm/elixir/introduction.html), The Elixir Team. Gratis. La guía oficial: inmutabilidad, pattern matching, recursión, enumerables y streams.
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), Microsoft. Gratis. Uniones discriminadas y verificación de exhaustividad, la forma de TypeScript de los tipos algebraicos.
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures), Mozilla. Gratis. Una explicación cuidadosa del alcance léxico y las closures con ejemplos pequeños.

### Videos

- [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY), Anjana Vakil, JSUnconf. Gratis. Una charla de treinta minutos para principiantes sobre funciones puras, funciones de orden superior e inmutabilidad.
- [Simple Made Easy](https://www.infoq.com/presentations/Simple-Made-Easy/), Rich Hickey. Gratis. La charla que separa lo simple de lo fácil y defiende los valores frente al estado mutable.
- [Functional Design Patterns](https://www.youtube.com/watch?v=srQt1NAHYC0), Scott Wlaschin, NDC. Gratis. Una charla que traslada los patrones orientados a objetos a funciones, composición, functores y mónadas.

### Práctica y herramientas

- [fast-check](https://fast-check.dev/), Nicolas Dubien. Gratis. La biblioteca de pruebas basadas en propiedades para TypeScript, con una guía para escribir buenas propiedades.
- [StreamData](https://hexdocs.pm/stream_data/StreamData.html), Andrea Leopardi and the Elixir Team. Gratis. Generación de datos y pruebas basadas en propiedades para Elixir.
- [Exercism: Elixir track](https://exercism.org/tracks/elixir), Exercism. Gratis. Ejercicios con mentoría que entrenan la recursión, el pattern matching y los pipelines.

### Comunidades

- [Elixir Forum](https://elixirforum.com/), Elixir community. Gratis. Un foro acogedor para preguntas sobre diseño funcional en Elixir.
- [r/functionalprogramming](https://www.reddit.com/r/functionalprogramming/), Reddit. Gratis. Discusión entre lenguajes, con muchas recomendaciones de lectura.
