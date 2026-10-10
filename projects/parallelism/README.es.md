# Paralelismo

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

El paralelismo es ejecutar cómputos al mismo tiempo en varios núcleos, carriles vectoriales o máquinas para terminar antes. Los procesadores dejaron de volverse más rápidos un núcleo a la vez, así que la velocidad hoy viene de dividir bien el trabajo. La ley de Amdahl, el falso compartido (false sharing) y el ancho de banda de memoria explican por qué duplicar los núcleos rara vez duplica la velocidad, y cómo acercarse a eso.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Escalabilidad por núcleos](scaling-by-cores/) | Cuánto se acelera un programa con más núcleos, y por qué no de forma lineal | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/parallelism/](../../quiz/content/parallelism/)
- Documentación: [docs/es/parallelism/](../../docs/es/parallelism/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se comprobaron cuando se escribió la lista.

### Empieza aquí

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial), Lawrence Livermore National Laboratory. Gratis. Un tutorial largo y claro sobre los conceptos: arquitecturas de memoria, modelos de programación, aceleración y sus límites.
- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratis. Aclara la diferencia entre estructurar un programa de forma concurrente y ejecutarlo en paralelo.
- [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law), Wikipedia. Gratis. La fórmula, su derivación y su relación con la ley de Gustafson, con la gráfica habitual.

### Libros

- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratis. Un libro gratuito en línea sobre cachés de CPU, SIMD, predicción de saltos y cómo medirlos.
- [Is Parallel Programming Hard, And, If So, What Can You Do About It?](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html), Paul E. McKenney. Gratis. Un libro gratuito de un desarrollador del kernel de Linux sobre contadores, bloqueos, particionado y escalabilidad.
- [An Introduction to Parallel Programming, 2nd edition](https://shop.elsevier.com/books/an-introduction-to-parallel-programming/pacheco/978-0-12-804605-0), Peter Pacheco and Matthew Malensek. De pago. Un primer libro de texto sobre programación con memoria compartida y distribuida con Pthreads, OpenMP y MPI.

### Cursos y clases

- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare, Charles Leiserson and Julian Shun. Gratis. Clases sobre programación multinúcleo, condiciones de carrera, work stealing, algoritmos eficientes en caché y medición.
- [CS 149 Parallel Computing](https://gfxcourses.stanford.edu/cs149/fall23), Stanford University, Kayvon Fatahalian and Kunle Olukotun. Gratis. Diapositivas sobre paralelismo de tareas y de datos, SIMD, GPU, planificación y análisis de rendimiento.
- [CMU 15-418 Parallel Computer Architecture and Programming](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/), Carnegie Mellon University. Gratis. El curso que une cada abstracción con el hardware que hay debajo, con las diapositivas de las clases en línea.

### Artículos y especificaciones

- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), Jeffrey Dean and Sanjay Ghemawat, Google (2004). Gratis. El artículo que convirtió map y reduce en el modelo para procesar datos en miles de máquinas.
- [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf), Ulrich Drepper (2007). Gratis. Una referencia profunda sobre cachés de CPU, líneas de caché y falso compartido en código multihilo.
- [The Free Lunch Is Over](http://www.gotw.ca/publications/concurrency-ddj.htm), Herb Sutter (2005). Gratis. El artículo que anunció el fin de las aceleraciones gratuitas de un solo núcleo y el giro hacia el multinúcleo.
- [Cilk: An Efficient Multithreaded Runtime System](https://dspace.mit.edu/handle/1721.1/149259), Blumofe, Joerg, Kuszmaul, Leiserson, Randall and Zhou (1995). Gratis. El artículo sobre el runtime cuyo planificador de work stealing fue adoptado después por Go, Rayon y el pool fork-join de Java.

### Documentación oficial

- [Rayon](https://docs.rs/rayon/latest/rayon/), Rayon developers. Gratis. Documentación de la biblioteca de paralelismo de datos para Rust: iteradores paralelos y join.
- [The Java Tutorials: Fork/Join](https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html), Oracle. Gratis. Un ejemplo oficial breve de cómo dividir una tarea de forma recursiva en un pool con work stealing.
- [OpenMP specifications](https://www.openmp.org/specifications/), OpenMP Architecture Review Board. Gratis. El estándar para bucles y tareas paralelas en C, C++ y Fortran, con documentos de ejemplos.
- [Rust core::arch](https://doc.rust-lang.org/core/arch/index.html), The Rust Project. Gratis. La referencia oficial de los intrínsecos SIMD en Rust, con una visión general de cómo detectar las características de la CPU.

### Videos

- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Gratis. Las clases grabadas, incluidas las de Cilk, condiciones de carrera y el análisis de algoritmos multihilo.

### Práctica y herramientas

- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Gratis. La herramienta de benchmarking de línea de comandos usada en este repositorio: calentamiento, varias ejecuciones y estadísticas.
- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Gratis. Muestra el ensamblador que genera un compilador, la forma más rápida de ver si un bucle fue vectorizado.

### Comunidades

- [Stack Overflow: parallel-processing tag](https://stackoverflow.com/questions/tagged/parallel-processing), Stack Overflow. Gratis. Preguntas prácticas sobre por qué el código paralelo no escala y cómo arreglarlo.
- [r/HPC](https://www.reddit.com/r/HPC/), Reddit. Gratis. Una comunidad sobre computación de alto rendimiento, clústeres y programación paralela.
