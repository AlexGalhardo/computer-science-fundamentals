# Estructuras de datos

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Las estructuras de datos son las formas de organizar datos en memoria y en disco para que las operaciones que un programa necesita sean baratas. Elegir entre un arreglo, una lista enlazada, una tabla hash, un árbol balanceado o un grafo suele ser la decisión que más cambia el costo de un programa, y es la base de las bases de datos, los compiladores, los sistemas operativos y las redes.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Mapa de dispersión desde cero](hash-map/) | Cómo se resuelven las colisiones y por qué importa el factor de carga | disponible |
| [Algoritmos en grafos](graph-algorithms/) | Caminos mínimos, ordenamiento topológico y árboles generadores sobre la misma biblioteca de grafos | disponible |
| [Árbol B en disco](b-tree-on-disk/) | Por qué las bases de datos usan árboles anchos: menos lecturas de página | disponible |
| [Caché LRU, filtro de Bloom y trie](lru-bloom-trie/) | Tres estructuras detrás de las cachés, las pruebas de pertenencia y la búsqueda por prefijo | disponible |
| [Árboles de búsqueda balanceados](balanced-trees/) | Cómo un árbol sin balanceo degenera y cómo las rotaciones lo evitan | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/data-structures/](../../quiz/content/data-structures/)
- Documentación: [docs/es/data-structures/](../../docs/es/data-structures/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratis. Animaciones de listas, heaps, tablas hash, árboles de búsqueda y recorridos de grafos, con cuestionarios.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html), David Galles, University of San Francisco. Gratis. Páginas interactivas en las que insertas y eliminas claves y ves cómo los árboles AVL, rojo-negros y B se rebalancean.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. En portugués. Gratis. Notas en portugués sobre listas, pilas, colas, árboles, heaps y hashing, con código C corto.

### Libros

- [Open Data Structures](https://opendatastructures.org/), Pat Morin. Gratis. Libro de texto gratuito que implementa y analiza cada estructura, con ediciones en Java, C++ y pseudocódigo.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratis en línea, de pago impreso. El sitio del libro trae resúmenes, código Java y ejercicios de tablas de símbolos, árboles balanceados, hashing y grafos.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. De pago. La referencia para las demostraciones: heaps, tablas hash, árboles rojo-negros, árboles B y representaciones de grafos.

### Cursos y clases

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratis. La primera mitad es un curso de estructuras de datos: secuencias, conjuntos, hashing, árboles binarios, AVL y heaps.
- [CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/), Josh Hug, UC Berkeley. Gratis. Un curso completo con videos, libro en línea y proyectos en Java con corrección automática.
- [Estrutura de Dados](https://www.youtube.com/playlist?list=PLxI8Can9yAHf8k8LrUePyj0y3lLpigGcl), UNIVESP. En portugués. Gratis. Una asignatura completa de pregrado en portugués usando C: listas, pilas, colas, árboles y ordenamiento.
- [MIT 6.851 Advanced Data Structures](https://ocw.mit.edu/courses/6-851-advanced-data-structures-spring-2012/), MIT OpenCourseWare, Erik Demaine. Gratis. Para profundizar: estructuras persistentes, árboles cache-oblivious, estructuras sucintas y grafos dinámicos.

### Artículos y especificaciones

- [Organization and Maintenance of Large Ordered Indices](https://infolab.usc.edu/csci585/Spring2010/den_ar/indexing.pdf), Rudolf Bayer and Edward McCreight (1970). Gratis. El informe de investigación de Boeing, publicado como artículo en 1972, que introdujo el árbol B, el origen de todo índice de base de datos.
- [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), Wikipedia. Gratis. Un buen panorama de la estructura del artículo de Burton Bloom de 1970, con la fórmula de falsos positivos y variantes.

### Documentación oficial

- [Rust std::collections](https://doc.rust-lang.org/std/collections/index.html), The Rust Project. Gratis. Guía oficial sobre cuándo usar cada colección, con el costo de cada operación en una tabla.

### Videos

- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratis. Clases grabadas sobre arreglos dinámicos, hashing, heaps binarios, árboles AVL y búsqueda en grafos.
- [Data Structures](https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P), mycodeschool. Gratis. Videos pacientes en la pizarra sobre listas enlazadas, pilas, colas, árboles y grafos en C y C++.

### Práctica y herramientas

- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratis. Artículos claros con código sobre árboles de segmentos, árboles de Fenwick, union-find, tries y algoritmos en grafos.

### Comunidades

- [Stack Overflow: data-structures tag](https://stackoverflow.com/questions/tagged/data-structures), Stack Overflow. Gratis. Un gran archivo de preguntas prácticas sobre cómo elegir e implementar estructuras.
- [r/algorithms](https://www.reddit.com/r/algorithms/), Reddit. Gratis. Discusión sobre algoritmos y estructuras de datos, desde dudas de tareas hasta resultados de investigación.
