# Big O y análisis de algoritmos

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

El análisis de algoritmos es la herramienta para predecir cómo crece el costo de un programa con el tamaño de su entrada, antes de ejecutarlo. Aporta el vocabulario (O, Ω, Θ), las técnicas (conteo de operaciones, recurrencias, análisis amortizado) y los límites (cotas inferiores, P y NP) en los que se apoyan todas las demás áreas de este repositorio cuando dicen que algo es rápido o lento.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Laboratorio de Big O](big-o-lab/) | Cómo medir una función y reconocer su curva de crecimiento | disponible |
| [Teorema maestro interactivo](master-theorem/) | Cómo los tres casos del teorema maestro deciden el costo de una recurrencia | disponible |
| [La cota inferior de la ordenación por comparación](sorting-lower-bound/) | Por qué ninguna ordenación por comparación supera Ω(n lg n) y cómo las ordenaciones por conteo escapan de ese límite | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/big-o/](../../quiz/content/big-o/)
- Documentación: [docs/es/big-o/](../../docs/es/big-o/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Asymptotic notation](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratis. Una primera lectura amable sobre por qué se descartan las constantes y qué significan O, Ω y Θ.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/), Eric Rowell. Gratis. Una página con el costo en tiempo y espacio de las operaciones comunes de las estructuras de datos y de los algoritmos de ordenación.
- [Análise de Algoritmos](https://www.ime.usp.br/~pf/analise_de_algoritmos/), Paulo Feofiloff, IME-USP. En portugués. Gratis. Notas de clase en portugués que cubren notación, recurrencias, invariantes y pruebas de corrección con rigor.

### Libros

- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. De pago. La referencia estándar: capítulos 2 a 4 para notación y recurrencias, 16 para análisis amortizado, 34 para NP-completitud.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Gratis en línea, de pago impreso. Un libro de texto gratuito con un tratamiento claro de recursión, recurrencias y NP-dificultad, además de muchos ejercicios.
- [Algorithms, 4th edition: Analysis of Algorithms](https://algs4.cs.princeton.edu/14analysis/), Robert Sedgewick and Kevin Wayne, Princeton. Gratis. El capítulo del sitio del libro sobre el método científico aplicado al tiempo de ejecución: medir, formular una hipótesis, predecir y verificar.

### Cursos y clases

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare, Demaine, Ku and Solomon. Gratis. Clases, notas y hojas de problemas que aplican el análisis asintótico a cada estructura de datos y algoritmo.
- [MIT 6.042J Mathematics for Computer Science](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/), MIT OpenCourseWare, Tom Leighton and Marten van Dijk. Gratis. Las matemáticas detrás del análisis: inducción, sumatorias, asintótica, recurrencias y conteo.
- [MIT 6.046J Design and Analysis of Algorithms](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/), MIT OpenCourseWare, Demaine, Devadas and Lynch. Gratis. El curso siguiente, con análisis amortizado, aleatorización y clases de complejidad en profundidad.

### Artículos y especificaciones

- [Master theorem (analysis of algorithms)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29), Wikipedia. Gratis. Un enunciado compacto de los tres casos, con ejemplos resueltos y los casos que el teorema no cubre.
- [P vs NP](https://www.claymath.org/millennium/p-vs-np/), Clay Mathematics Institute. Gratis. El enunciado oficial del problema abierto, con la descripción de Stephen Cook.

### Videos

- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratis. Las clases grabadas del curso anterior, desde el modelo de cómputo y la notación asintótica.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratis. Clases en la pizarra que cuentan operaciones paso a paso y resuelven recurrencias a mano.
- [P vs. NP and the Computational Complexity Zoo](https://www.youtube.com/watch?v=YX40hbAHx3s), hackerdashery. Gratis. Una introducción animada de diez minutos a las clases de complejidad y a por qué importa P contra NP.

### Práctica y herramientas

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratis. Animaciones paso a paso en las que se ve el costo de cada operación a medida que cambia la entrada.

### Comunidades

- [Computer Science Stack Exchange: asymptotics tag](https://cs.stackexchange.com/questions/tagged/asymptotics), Stack Exchange. Gratis. Preguntas respondidas sobre notación y pruebas, incluidos los hilos de referencia sobre cómo resolver recurrencias.
- [Stack Overflow: big-o tag](https://stackoverflow.com/questions/tagged/big-o), Stack Overflow. Gratis. Dudas prácticas sobre la complejidad de código real, con respuestas canónicas muy detalladas.
