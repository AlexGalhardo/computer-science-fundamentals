# Concurrencia

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La concurrencia es el arte de estructurar un programa como varias actividades que avanzan en tiempos superpuestos y comparten estado de forma segura. Es donde viven los bugs más difíciles (condiciones de carrera, deadlocks, inanición), y cada lenguaje responde de una manera: locks y operaciones atómicas, canales, actores o un bucle de eventos. Conocer los modelos permite elegir uno a propósito.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Condición de carrera en el contador](counter-race/) | Por qué el estado compartido sin sincronización pierde actualizaciones, y cuatro formas de corregirlo | disponible |
| [Deadlock: la cena de los filósofos](dining-philosophers/) | Las cuatro condiciones del deadlock y cómo romper una de ellas lo elimina | disponible |
| [Diez mil conexiones](ten-thousand-connections/) | Cómo los bucles de eventos, las goroutines y los procesos de la BEAM manejan muchas conexiones inactivas | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/concurrency/](../../quiz/content/concurrency/)
- Documentación: [docs/es/concurrency/](../../docs/es/concurrency/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratis. La charla y las diapositivas que separan las dos ideas: la concurrencia es estructura, el paralelismo es ejecución.
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/), Allen B. Downey. Gratis. Un libro gratuito de rompecabezas de sincronización, desde el mutex hasta la cena de los filósofos y lectores-escritores.
- [Concorrência e Paralelismo (Parte 1)](https://akitaonrails.com/2019/03/13/akitando-43-concorrencia-e-paralelismo-parte-1-entendendo-back-end-para-iniciantes-parte-3/), Fabio Akita, Akitando. En portugués. Gratis. Un video con transcripción completa en portugués sobre procesos, threads y cuánto le cuestan al sistema operativo.
- [The Deadlock Empire](https://deadlockempire.github.io/), Petr Hudeček and Michal Pokorný. Gratis. Un juego de navegador en el que haces el papel del planificador y rompes programas concurrentes defectuosos.

### Libros

- [Operating Systems: Three Easy Pieces (Concurrency part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratis en línea, de pago impreso. Capítulos gratuitos sobre threads, locks, variables de condición, semáforos y bugs comunes de concurrencia.
- [Java Concurrency in Practice](https://jcip.net/), Brian Goetz and others. De pago. El clásico sobre seguridad entre threads, visibilidad, el modelo de memoria y pools de threads.
- [Rust Atomics and Locks](https://mara.nl/atomics/), Mara Bos. Gratis en línea, de pago impreso. Lectura en línea gratuita: operaciones atómicas, ordenamiento de memoria y cómo construir un mutex y un canal desde cero.
- [Seven Concurrency Models in Seven Weeks](https://pragprog.com/titles/pb7con/seven-concurrency-models-in-seven-weeks/), Paul Butcher. De pago. Compara threads y locks, programación funcional, actores, CSP y paralelismo de datos en ejemplos pequeños.

### Cursos y clases

- [A Tour of Go: Concurrency](https://go.dev/tour/concurrency/1), The Go Authors. Gratis. Ejercicios interactivos sobre goroutines, canales, select y mutexes.
- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Gratis. Las clases de sincronización cubren locks, semáforos, monitores y deadlock con rigor.

### Artículos y especificaciones

- [Communicating Sequential Processes](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf), C. A. R. Hoare (1978). Gratis. El artículo detrás de los canales de Go y de muchos otros lenguajes: procesos que solo se comunican por mensajes.
- [Making reliable distributed systems in the presence of software errors](https://erlang.org/download/armstrong_thesis_2003.pdf), Joe Armstrong (2003). Gratis. La tesis que explica el diseño de Erlang y de la BEAM: procesos aislados, mensajes y supervisión.
- [The C10K problem](http://www.kegel.com/c10k.html), Dan Kegel. Gratis. La página que formuló cómo un servidor puede atender a diez mil clientes, comparando estrategias de E/S.

### Documentación oficial

- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors. Gratis. Las reglas oficiales de cuándo una goroutine tiene la garantía de ver lo que otra escribió.
- [The Rust Programming Language: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html), The Rust Project. Gratis. Cómo la propiedad y los traits Send y Sync convierten las carreras de datos en errores de compilación.
- [Elixir: Processes](https://hexdocs.pm/elixir/processes.html), The Elixir Team. Gratis. La guía oficial para crear procesos, enviar mensajes y mantener estado en el modelo de actores.
- [The Java Tutorials: Concurrency](https://docs.oracle.com/javase/tutorial/essential/concurrency/), Oracle. Gratis. Threads, sincronización, problemas de vivacidad y las utilidades de concurrencia de alto nivel de Java.
- [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), OpenJS Foundation. Gratis. La descripción oficial de las fases del bucle de eventos y de dónde se ejecutan callbacks y promises.

### Videos

- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ), Philip Roberts, JSConf EU. Gratis. La explicación visual más clara de la pila de llamadas, la cola de tareas y el bucle de eventos de JavaScript.
- [In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0), Jake Archibald, JSConf Asia. Gratis. Una mirada más profunda a las tareas, las microtareas y el renderizado en el bucle de eventos del navegador.
- [Concorrência e Paralelismo (Parte 2)](https://www.youtube.com/watch?v=gYJSWs-gp1g), Fabio Akita, Akitando. En portugués. Gratis. La segunda parte de la serie en portugués: cómo se coordinan los threads y cuánto cuestan.

### Práctica y herramientas

- [Go Data Race Detector](https://go.dev/doc/articles/race_detector), The Go Authors. Gratis. Cómo encontrar carreras de datos automáticamente al ejecutar las pruebas.

### Comunidades

- [Stack Overflow: concurrency tag](https://stackoverflow.com/questions/tagged/concurrency), Stack Overflow. Gratis. Preguntas respondidas sobre locks, visibilidad y deadlocks en todos los lenguajes.
- [Elixir Forum](https://elixirforum.com/), Elixir community. Gratis. Un foro amable para dudas sobre procesos, OTP y la BEAM.
