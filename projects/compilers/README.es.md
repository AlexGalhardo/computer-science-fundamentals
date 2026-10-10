# Compiladores

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un compilador traduce un programa de un lenguaje a otro, y un intérprete lo ejecuta directamente. Ambos pasan por las mismas etapas: dividir el texto en tokens, construir un árbol a partir de una gramática, verificarlo y luego generar código o ejecutarlo. Conocer estas etapas le quita el misterio a los mensajes de error, al rendimiento, a la recolección de basura y a toda herramienta que lee código.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Minilenguaje: lexer y parser](mini-language-parser/) | Cómo el texto fuente se convierte en tokens y luego en un árbol | disponible |
| [Intérprete que recorre el árbol](tree-walking-interpreter/) | Cómo se ejecuta un árbol: entornos, ámbitos y closures | disponible |
| [Máquina virtual de bytecode](bytecode-vm/) | Por qué el bytecode se ejecuta más rápido que recorrer un árbol | disponible |
| [Motor de expresiones regulares](regex-engine/) | Cómo una expresión regular se convierte en un autómata | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/compilers/](../../quiz/content/compilers/)
- Documentación: [docs/es/compilers/](../../docs/es/compilers/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza por aquí

- [Crafting Interpreters](https://craftinginterpreters.com/), Robert Nystrom. Gratis en línea, de pago impreso. Gratis en línea: construye el mismo lenguaje dos veces, como intérprete de árbol y como máquina virtual de bytecode.
- [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/), Ruslan Spivak. Gratis. Una serie de blog paciente que hace crecer un intérprete de Pascal un pequeño paso a la vez.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Gratis. Explica la construcción de Thompson y por qué el emparejamiento basado en autómatas evita el tiempo exponencial.

### Libros

- [Compilers: Principles, Techniques, and Tools, 2nd edition (the Dragon Book)](https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472), Aho, Lam, Sethi and Ullman. De pago. El libro de texto que sigue el quiz: análisis léxico, parsing LL y LR, traducción, generación de código y optimización.
- [Introduction to Compilers and Language Design](https://dthain.github.io/books/compiler/), Douglas Thain, University of Notre Dame. Gratis en línea, de pago impreso. Un libro de texto gratuito de un semestre que va del análisis léxico a la generación de código x86.
- [Writing An Interpreter In Go](https://interpreterbook.com/), Thorsten Ball. De pago. Construye un lexer, un parser de Pratt y un evaluador empezando por las pruebas; una continuación agrega un compilador y una VM.
- [The Garbage Collection Handbook, 2nd edition](https://gchandbook.org/), Richard Jones, Antony Hosking and Eliot Moss. De pago. La referencia sobre gestión automática de memoria, desde mark-and-sweep hasta los recolectores concurrentes.

### Cursos y clases

- [CS 143 Compilers](https://web.stanford.edu/class/cs143/), Stanford University. Gratis. Diapositivas y tareas en las que se construye un compilador para el lenguaje COOL fase por fase.
- [CS 6120 Advanced Compilers: The Self-Guided Online Course](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/), Adrian Sampson, Cornell University. Gratis. Videos y tareas sobre representaciones intermedias, análisis de flujo de datos, SSA y optimización.
- [MIT 6.035 Computer Language Engineering](https://ocw.mit.edu/courses/6-035-computer-language-engineering-spring-2010/), MIT OpenCourseWare. Gratis. Notas de clase sobre el pipeline completo, con énfasis en la generación de código y la optimización.

### Artículos y especificaciones

- [The Implementation of Lua 5.0](https://www.lua.org/doc/jucs05.pdf), Ierusalimschy, de Figueiredo and Celes (2005). Gratis. Cómo se diseña una máquina virtual real y pequeña: registros, closures y tablas, por sus autores brasileños.
- [Pratt Parsers: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/), Robert Nystrom. Gratis. La explicación más clara del parsing por precedencia de operadores, la técnica usada en el minilenguaje.

### Documentación oficial

- [LLVM Tutorial: Kaleidoscope](https://llvm.org/docs/tutorial/), LLVM Project. Gratis. El tutorial oficial que implementa un lenguaje pequeño con un generador de código y un JIT reales.
- [WebAssembly Core Specification](https://webassembly.github.io/spec/core/), W3C WebAssembly Community Group. Gratis. Una especificación precisa de un bytecode moderno basado en pila y de sus reglas de validación y ejecución.

### Videos

- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Gratis. Tiene videos cortos sobre parsing, gramáticas, expresiones regulares y recolección de basura.

### Práctica y herramientas

- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Gratis. Escribe código a la izquierda y lee el ensamblador generado a la derecha, para muchos compiladores.
- [AST Explorer](https://astexplorer.net/), Felix Kling. Gratis. Muestra el árbol sintáctico que construyen los parsers reales para un fragmento de código.
- [regex101](https://regex101.com/), Firas Dib. Gratis. Prueba una expresión regular y explica cada parte, con un depurador paso a paso.
- [Expressões Regulares: Guia de Consulta Rápida](https://aurelio.net/regex/guia/), Aurelio Marinho Jargas. En portugués. Gratis. La guía gratuita clásica de expresiones regulares en portugués.

### Comunidades

- [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/), Reddit. Gratis. Una comunidad activa de personas que diseñan e implementan lenguajes.
- [Programming Language Design and Implementation Stack Exchange](https://langdev.stackexchange.com/), Stack Exchange. Gratis. Preguntas y respuestas sobre parsing, sistemas de tipos, intérpretes y compiladores.
