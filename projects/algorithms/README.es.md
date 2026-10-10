# Algoritmos

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Los algoritmos son los métodos paso a paso para resolver un problema: ordenar, buscar, hallar el camino más corto, elegir la mejor combinación. Estudiarlos enseña un pequeño conjunto de técnicas de diseño (divide y vencerás, elección voraz, programación dinámica, backtracking) que convierten problemas que parecen imposibles a escala en programas que terminan.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Carrera de ordenación](sorting-race/) | Cómo se comportan los mismos algoritmos entre lenguajes y formas de entrada, y cómo se relaciona el tiempo medido con el Big O | disponible |
| [Programación dinámica](dynamic-programming/) | Cómo la memoización y la tabulación eliminan el trabajo repetido | disponible |
| [Viajante de comercio](travelling-salesman/) | Dónde la fuerza bruta deja de ser viable y qué sacrifica una heurística | disponible |
| [Quicksort híbrido](hybrid-quicksort/) | Cómo el pivote y el umbral para arreglos pequeños cambian el quicksort en la práctica | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/algorithms/](../../quiz/content/algorithms/)
- Documentación: [docs/es/algorithms/](../../docs/es/algorithms/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Algorithms](https://www.khanacademy.org/computing/computer-science/algorithms), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratis. Una unidad suave con textos y ejercicios sobre búsqueda binaria, las ordenaciones clásicas, recursión y búsqueda en grafos.
- [VisuAlgo: Sorting](https://visualgo.net/en/sorting), Steven Halim, National University of Singapore. Gratis. Anima cada algoritmo de ordenación con tu propia entrada y cuenta comparaciones e intercambios.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. En portugués. Gratis. Notas en portugués sobre búsqueda, las ordenaciones clásicas, heapsort, quicksort y backtracking, con invariantes.

### Libros

- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. De pago. La referencia estándar para ordenación, programación dinámica, algoritmos voraces y algoritmos en grafos.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratis en línea, de pago impreso. Muy práctico en ordenación: el sitio del libro compara los algoritmos y ofrece código Java probado.
- [The Algorithm Design Manual, 3rd edition](https://www.algorist.com/), Steven Skiena. De pago. Enseña a reconocer qué técnica sirve para un problema, con un catálogo de problemas clásicos.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Gratis en línea, de pago impreso. Un libro de texto gratuito con capítulos excelentes sobre backtracking, programación dinámica y algoritmos voraces.
- [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf), Antti Laaksonen. Gratis. Un libro compacto que va de la ordenación a la programación dinámica y los grafos mediante problemas.

### Cursos y clases

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratis. Clases y listas de problemas sobre ordenación, caminos mínimos y un marco claro para la programación dinámica.
- [Algorithms, Part I](https://www.coursera.org/learn/algorithms-part1), Robert Sedgewick and Kevin Wayne, Princeton (Coursera). Gratis como oyente, certificado de pago. Curso en video sobre union-find, los algoritmos de ordenación, colas de prioridad y árboles de búsqueda, con tareas de programación calificadas.
- [Algorithms Illuminated](https://www.algorithmsilluminated.org/), Tim Roughgarden, Stanford. Gratis en línea, de pago impreso. El sitio de la serie de libros reúne las videoclases gratuitas sobre divide y vencerás, algoritmos voraces y programación dinámica.

### Artículos y especificaciones

- [Timsort: listsort.txt](https://github.com/python/cpython/blob/main/Objects/listsort.txt), Tim Peters, CPython. Gratis. La descripción hecha por el propio autor de la ordenación híbrida que usa Python, con mediciones.
- [Pattern-defeating Quicksort](https://arxiv.org/abs/2106.05123), Orson Peters (2021). Gratis. Un quicksort híbrido moderno, usado en bibliotecas de Rust y C++, explicado por su autor.
- [A Note on Two Problems in Connexion with Graphs](https://ir.cwi.nl/pub/9256/9256D.pdf), Edsger W. Dijkstra (1959). Gratis. El artículo de tres páginas con el algoritmo de camino mínimo y un algoritmo de árbol de expansión mínima.

### Videos

- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratis. Clases en pizarra sobre divide y vencerás, método voraz, programación dinámica y backtracking.
- [15 Sorting Algorithms in 6 Minutes](https://www.youtube.com/watch?v=kPRA0W1kECg), Timo Bingmann. Gratis. Una visualización famosa con sonido que hace reconocible el comportamiento de cada ordenación.
- [Graph Theory Playlist](https://www.youtube.com/playlist?list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P), William Fiset. Gratis. Explicaciones animadas de caminos mínimos, árboles de expansión, ordenación topológica y viajante de comercio.

### Práctica y herramientas

- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratis. Artículos de referencia con demostraciones y código para algoritmos en grafos, programación dinámica y más.
- [CSES Problem Set](https://cses.fi/problemset/), Antti Laaksonen, University of Helsinki. Gratis. Una colección graduada de problemas por técnica, con juez en línea.
- [beecrowd](https://beecrowd.com/), beecrowd. En portugués. Gratis. Un juez en línea brasileño con enunciados en portugués, muy usado en asignaturas universitarias.
- [Advent of Code](https://adventofcode.com/), Eric Wastl. Gratis. Acertijos anuales que premian elegir el algoritmo correcto en lugar de la fuerza bruta.

### Comunidades

- [Codeforces](https://codeforces.com/), Mike Mirzayanov. Gratis. Competencias y una comunidad muy activa, con editoriales que explican cada solución.
- [Stack Overflow: algorithm tag](https://stackoverflow.com/questions/tagged/algorithm), Stack Overflow. Gratis. Un gran archivo de preguntas respondidas sobre cómo elegir e implementar algoritmos.
- [r/algorithms](https://www.reddit.com/r/algorithms/), Reddit. Gratis. Discusión sobre algoritmos, desde dudas de estudio hasta resultados recientes.
