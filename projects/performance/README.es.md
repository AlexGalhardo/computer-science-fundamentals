# Performance

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La ingeniería de rendimiento consiste en medir antes de cambiar: definir qué significa rápido (percentiles de latencia, rendimiento), producir una carga realista, descubrir con un profiler a dónde va el tiempo y solo entonces optimizar. Conecta varias capas, desde los cachés de CPU y la localidad de memoria hasta el comportamiento del runtime, las consultas a la base de datos y la capacidad de un servicio completo, y depende de un método sólido de benchmarking para no engañarse a uno mismo.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Bun contra Node (`bun-vs-node`) | Cómo el runtime y el modelo de procesos cambian el rendimiento | planeado |
| Escenarios de prueba de carga con k6 (`k6-scenarios`) | Qué revelan las pruebas de carga, estrés, pico y resistencia | planeado |
| Multiplicación de matrices amigable con el caché (`cache-friendly-matrix`) | Cómo la localidad de memoria cambia la velocidad con el mismo Big O | planeado |

## Quiz y documentación

- Preguntas del quiz: planeadas (`quiz/content/performance/`).
- Documentación: planeada (`docs/es/performance/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza por aquí

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Gratis. La guía oficial de usuarios virtuales, etapas, umbrales y checks, con una página para cada tipo de prueba.
- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg. Gratis. Una lista de verificación para cualquier recurso: utilización, saturación y errores, un primer método para encontrar cuellos de botella.
- [How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU), Gil Tene. Gratis. La charla sobre percentiles, por qué los promedios esconden el problema y el error de la omisión coordinada.

### Libros

- [Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html), Brendan Gregg. De pago. La referencia en metodología y en análisis de CPU, memoria, sistema de archivos, disco y red en Linux.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratis. Libro en línea gratuito sobre cachés de CPU, disposición de memoria, SIMD y benchmarks, con la multiplicación de matrices como caso.
- [Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book), Denis Bakhvalov. Gratis. Libro gratuito sobre medición con contadores de hardware, profiling y corrección de fallos de caché y errores de predicción de saltos.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Gratis. La guía práctica de índices de bases de datos y de lectura de planes de ejecución.

### Cursos y clases

- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare. Gratis. Empieza acelerando la multiplicación de matrices paso a paso y luego cubre medición y cachés.

### Artículos y especificaciones

- [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf), Ulrich Drepper (2007). Gratis. La referencia profunda sobre cachés de CPU, TLBs y cómo la disposición de los datos decide la velocidad.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Gratis. La página del autor sobre cómo se construyen y se leen los flame graphs, con enlaces a su artículo y sus charlas.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Gratis. Por qué los percentiles altos importan más a medida que un sistema crece, y técnicas para domarlos.
- [Producing Wrong Data Without Doing Anything Obviously Wrong!](https://users.cs.northwestern.edu/~robby/courses/322-2013-spring/mytkowicz-wrong-data.pdf), Mytkowicz, Diwan, Hauswirth and Sweeney (2009). Gratis. Muestra cómo el tamaño del entorno y el orden de enlazado sesgan los benchmarks, una lección de método de medición.
- [Latency Numbers Every Programmer Should Know](https://gist.github.com/jboner/2841832), Jonas Bonér, after Jeff Dean and Peter Norvig. Gratis. La tabla de órdenes de magnitud, desde una referencia al caché hasta un paquete que cruza el océano.

### Documentación oficial

- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group. Gratis. Cómo leer un plan de consulta y encontrar un índice que falta.
- [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), OpenJS Foundation. Gratis. La explicación oficial de por qué un callback lento perjudica a todos los clientes de un servidor Node.js.
- [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/), PM2. Gratis. Cómo una aplicación Node.js se reparte entre todos los núcleos de CPU.
- [Bun documentation](https://bun.sh/docs), Oven. Gratis. El runtime que se compara con Node.js en el miniproyecto.
- [perf: Linux profiling with performance counters](https://perfwiki.github.io/main/), Linux perf community. Gratis. La wiki de la herramienta perf de Linux, con un tutorial de muestreo y conteo de eventos.

### Videos

- [Performance Matters](https://www.youtube.com/watch?v=r-TLSBdHe1A), Emery Berger, Strange Loop. Gratis. Charla sobre por qué los benchmarks ingenuos engañan y cómo medir y hacer profiling con solidez.
- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Gratis. Las clases grabadas del curso anterior.

### Práctica y herramientas

- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Gratis. La herramienta de benchmark de este repositorio: ejecuciones de calentamiento, repeticiones y resumen estadístico.
- [FlameGraph](https://github.com/brendangregg/FlameGraph), Brendan Gregg. Gratis. Los scripts originales que transforman muestras de pila del profiler en un flame graph.

### Comunidades

- [Stack Overflow: performance tag](https://stackoverflow.com/questions/tagged/performance), Stack Overflow. Gratis. Respuestas canónicas famosas sobre predicción de saltos, efectos de caché y medición.
- [Brendan Gregg's Blog](https://www.brendangregg.com/blog/), Brendan Gregg. Gratis. Textos sobre análisis de rendimiento, herramientas y metodología del autor de los flame graphs.
