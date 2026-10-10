# Sistemas operativos

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un sistema operativo es el programa que reparte una máquina entre muchos programas: da a cada proceso la ilusión de tener su propia CPU y memoria, media el acceso a archivos y dispositivos, e impide que los programas se dañen entre sí. Entender procesos, planificación, memoria virtual, sistemas de archivos e interbloqueos (deadlocks) explica la mayor parte del comportamiento, y de los problemas de rendimiento, del software real.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Simulador de planificación de CPU](cpu-scheduling/) | Cómo las políticas de planificación equilibran tiempo de espera, tiempo de respuesta y equidad | disponible |
| [Simulador de paginación y TLB](paging-tlb/) | Cómo se traducen las direcciones virtuales y cuánto cuesta reemplazar páginas | disponible |
| [Asignador de memoria](memory-allocator/) | Cómo las estrategias de asignación fragmentan la memoria | disponible |
| [Detección de deadlocks y un mini shell](deadlock-mini-shell/) | Grafos de asignación de recursos, el algoritmo del banquero y procesos con pipes | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/operating-systems/](../../quiz/content/operating-systems/)
- Documentación: [docs/es/operating-systems/](../../docs/es/operating-systems/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Cada enlace se verificó cuando se escribió la lista.

### Empieza aquí

- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi y Andrea Arpaci-Dusseau, University of Wisconsin. Gratuito en línea, de pago en papel. El libro de texto de sistemas operativos más amigable: capítulos cortos sobre virtualización, concurrencia y persistencia, con simuladores para practicar.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. En portugués. Gratuito. Un libro de texto completo y gratuito en portugués, con diapositivas y ejercicios para cada capítulo.
- [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo), Carrie Anne Philbin, Crash Course. Gratuito. Los episodios 18 a 20 dan una visión general de diez minutos sobre sistemas operativos, memoria y archivos antes de pasar a los libros.

### Libros

- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum y Herbert Bos. De pago. El libro de texto que sigue el quiz (en su 4.ª edición): procesos, memoria, sistemas de archivos, E/S, deadlocks y virtualización.
- [Operating System Concepts, 10th edition](https://www.os-book.com/OS10/), Silberschatz, Galvin y Gagne. De pago. El otro libro de texto clásico; su sitio ofrece gratis las diapositivas y los ejercicios de práctica.
- [The Linux Programming Interface](https://man7.org/tlpi/), Michael Kerrisk. De pago. La guía definitiva de las llamadas al sistema de Linux: procesos, señales, pipes, archivos y mapeos de memoria.
- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant y David R. O'Hallaron. De pago. Explica memoria virtual, excepciones, procesos y asignación dinámica de memoria desde el lado del programador.

### Cursos y clases

- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Gratuito. Diapositivas, lecturas y los proyectos Pintos de un curso completo de sistemas operativos.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Un curso guiado por laboratorios, construido alrededor de xv6, un pequeño kernel didáctico tipo Unix para RISC-V.
- [Sistemas Operacionais](https://www.youtube.com/playlist?list=PLxI8Can9yAHeK7GUEGxMsqoPRmJKwI9Jw), UNIVESP. En portugués. Gratuito. Un curso completo de pregrado en portugués sobre procesos, planificación, memoria y sistemas de archivos.

### Artículos y especificaciones

- [The UNIX Time-Sharing System](https://dsf.berkeley.edu/cs262/unix.pdf), Dennis Ritchie y Ken Thompson (1974). Gratuito. El artículo que introdujo los archivos como flujos de bytes, el shell, los pipes y fork, en unas pocas páginas legibles.
- [xv6: a simple, Unix-like teaching operating system](https://pdos.csail.mit.edu/6.1810/2024/xv6/book-riscv-rev4.pdf), Russ Cox, Frans Kaashoek y Robert Morris. Gratuito. Un libro corto que recorre, línea por línea, el código fuente de un kernel pequeño y completo.

### Documentación oficial

- [Linux man-pages online](https://man7.org/linux/man-pages/), Michael Kerrisk y el proyecto man-pages. Gratuito. La descripción autorizada de cada llamada al sistema y función de biblioteca, como fork, mmap y pipe.
- [The Linux Kernel documentation](https://docs.kernel.org/), kernel.org. Gratuito. Documentación oficial del planificador, la gestión de memoria y los sistemas de archivos de un kernel de producción.

### Práctica y herramientas

- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Gratuito. Pequeños simuladores en Python para planificación, paginación, TLBs y discos, cercanos a los mini-proyectos de esta área.
- [xv6-riscv](https://github.com/mit-pdos/xv6-riscv), MIT PDOS. Gratuito. El código fuente del kernel didáctico, lo bastante pequeño como para leerlo completo.
- [Writing an OS in Rust](https://os.phil-opp.com/), Philipp Oppermann. Gratuito. Una serie de artículos que construye un kernel pequeño paso a paso: arranque, interrupciones, paginación y asignación de heap.

### Comunidades

- [r/osdev](https://www.reddit.com/r/osdev/), Reddit. Gratuito. Una comunidad de personas que escriben sus propios kernels, buena para preguntas de bajo nivel.
- [Stack Overflow: operating-system tag](https://stackoverflow.com/questions/tagged/operating-system), Stack Overflow. Gratuito. Preguntas conceptuales y prácticas con respuesta sobre procesos, memoria y llamadas al sistema.
