# Lógica digital

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La lógica digital es el nivel en el que la computación se vuelve física: números en binario, funciones booleanas, compuertas lógicas y los circuitos hechos con ellas, primero combinacionales (sumadores, multiplexores) y después secuenciales (flip-flops, registros, contadores). Construir un sumador y luego una pequeña CPU a partir de compuertas muestra que un computador es una pila de ideas simples, cada una hecha con la anterior.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Compuertas lógicas, Karnaugh y sumadores](gates-karnaugh-adders/) | Cómo las funciones booleanas se convierten en circuitos | disponible |
| [ALU solo con NAND y una CPU de 4 bits](nand-alu-cpu/) | Cómo se construye un computador a partir de una sola compuerta | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/digital-logic/](../../quiz/content/digital-logic/)
- Documentación: [docs/es/digital-logic/](../../docs/es/digital-logic/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Nand to Tetris](https://www.nand2tetris.org/), Noam Nisan and Shimon Schocken. Gratuito. El curso que construye un computador entero desde la compuerta NAND, con herramientas y material de proyecto gratuitos.
- [NandGame](https://nandgame.com/), Olav Junker Kjær. Gratuito. Un juego de navegador con el mismo camino: de una compuerta NAND a un sumador, una ALU y un procesador.
- [Build an 8-bit computer from scratch](https://eater.net/8bit), Ben Eater. Gratuito. Una serie de videos que construye un computador funcional en protoboards, un módulo a la vez.

### Libros

- [The Elements of Computing Systems, 2nd edition](https://www.nand2tetris.org/book), Noam Nisan and Shimon Schocken. De pago. El libro de Nand to Tetris: lógica booleana, aritmética, memoria, la CPU y el software que va encima.
- [Code: The Hidden Language of Computer Hardware and Software, 2nd edition](https://codehiddenlanguage.com/), Charles Petzold. De pago. Un camino paciente y no académico desde el código Morse y los relés hasta compuertas, sumadores, memoria y un procesador.
- [Digital Design and Computer Architecture, RISC-V edition](https://shop.elsevier.com/books/digital-design-and-computer-architecture-risc-v-edition/harris/978-0-12-820064-3), Sarah Harris and David Harris. De pago. Un libro de texto que va desde las compuertas y los mapas de Karnaugh hasta el diseño secuencial y un procesador completo.

### Cursos y clases

- [MIT 6.004 Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/), MIT OpenCourseWare, Chris Terman. Gratuito. Videos y ejercicios sobre información, compuertas, lógica combinacional y secuencial, y diseño de procesadores.
- [Build a Modern Computer from First Principles: From Nand to Tetris](https://www.coursera.org/learn/build-a-computer), Hebrew University of Jerusalem (Coursera). Gratis como oyente, certificado de pago. La versión guiada de la parte I de Nand to Tetris, con clases y proyectos corregidos automáticamente.
- [Digital Design and Computer Architecture](https://safari.ethz.ch/digitaltechnik/spring2023/doku.php?id=schedule), Onur Mutlu, ETH Zürich. Gratuito. Videos y diapositivas completos de un curso universitario, desde los transistores hasta la microarquitectura.

### Artículos y especificaciones

- [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), Claude Shannon (1937 master's thesis). Gratuito. La tesis que mostró que el álgebra booleana describe los circuitos de conmutación, el inicio del diseño digital.
- [Quine–McCluskey algorithm](https://en.wikipedia.org/wiki/Quine%E2%80%93McCluskey_algorithm), Wikipedia. Gratuito. Un ejemplo resuelto del método tabular de minimización que los mapas de Karnaugh hacen a simple vista.

### Videos

- [Building an 8-bit breadboard computer!](https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU), Ben Eater. Gratuito. La lista de reproducción completa: reloj, registros, ALU, memoria, contador de programa y lógica de control.
- [Exploring How Computers Work](https://www.youtube.com/watch?v=QZwneRb-zqA), Sebastian Lague. Gratuito. Un recorrido bellamente animado de las compuertas lógicas a un sumador y una pequeña ALU en un simulador.
- [Digital Electronics](https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm), Neso Academy. Gratuito. Cientos de lecciones cortas resueltas sobre sistemas de numeración, álgebra booleana, mapas de Karnaugh y flip-flops.

### Práctica y herramientas

- [Digital](https://github.com/hneemann/Digital), Helmut Neemann. Gratuito. Un simulador didáctico de circuitos digitales que también genera tablas de verdad y expresiones minimizadas.
- [CircuitVerse](https://circuitverse.org/), CircuitVerse community. Gratuito. Un simulador de circuitos lógicos en el navegador, con un libro interactivo de lógica digital.
- [HDLBits](https://hdlbits.01xz.net/wiki/Main_Page), Henry Wong. Gratuito. Pequeños ejercicios de Verilog corregidos en línea, de compuertas a máquinas de estados finitos.
- [Logisim-evolution](https://github.com/logisim-evolution/logisim-evolution), Logisim-evolution developers. Gratuito. La herramienta educativa clásica para dibujar y simular circuitos digitales.

### Comunidades

- [Electrical Engineering Stack Exchange: digital-logic tag](https://electronics.stackexchange.com/questions/tagged/digital-logic), Stack Exchange. Gratuito. Preguntas respondidas sobre compuertas, minimización, flip-flops y temporización.
- [r/beneater](https://www.reddit.com/r/beneater/), Reddit. Gratuito. Gente que construye los computadores en protoboard y se ayuda a depurarlos.
