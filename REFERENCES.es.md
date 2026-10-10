# Referencias

> English version: [REFERENCES.md](REFERENCES.md) · Versão em português: [REFERENCES.pt-BR.md](REFERENCES.pt-BR.md)

Las principales fuentes para estudiar y profundizar en cada área de este repositorio, agrupadas por área en el mismo orden del índice de áreas de [PLAN.md](PLAN.md).

## Cómo se construyó esta lista

- Proviene de una búsqueda en la web en sitios y documentación oficiales, cursos universitarios con material público, libros de texto, papers y especificaciones originales (RFC y similares), libros gratuitos, series de video y comunidades.
- Las fuentes primarias y duraderas van primero: el paper que presentó una idea, la especificación que define un protocolo, el libro de texto que sigue el quiz, el manual oficial de una herramienta.
- Cada enlace se verificó cuando se escribió la lista: un script solicitó cada uno, y tuvo que responder con éxito y ser la página que dice ser. Los pocos sitios que rechazan scripts se confirmaron mediante su feed o API pública, o abriendo la página. Los enlaces que no pudieron verificarse quedaron fuera.
- Los libros apuntan a la página del autor o de la editorial, o a un artículo de enciclopedia cuando el libro está fuera de catálogo, nunca a una copia no oficial. "Gratuito en línea, de pago impreso" significa que el autor o la editorial ofrece el texto legalmente en la web.
- Los papers apuntan a una copia de lectura abierta, en el sitio de un autor, de una editorial, de una institución o de un curso universitario.
- Las descripciones fueron escritas para este repositorio. Nada se copia de las fuentes.
- Las fuentes en portugués están marcadas con "En portugués". Todas las demás están en inglés.
- Las referencias de seguridad son defensivas: cómo ocurren las fallas y cómo prevenirlas.

## Cómo usarla

- Elige un área. Cada sección de abajo trae sus referencias principales, y cada área con mini-proyectos tiene una lista más larga en `projects/<area>/README.es.md`, agrupada en: Empieza aquí, Libros, Cursos y clases, Papers y especificaciones, Documentación oficial, Videos, Práctica y herramientas, Comunidades.
- Empieza con una o dos fuentes, no con todas. En los README de las áreas, "Empieza aquí" se eligió para un primer contacto.
- Combina la lectura con el quiz en `quiz/` y con el mini-proyecto del área: lee, responde, ejecuta, mide.
- La lista es una selección, no es exhaustiva, y los enlaces envejecen. Si alguno se rompe, abre un issue o un pull request.

## General y transversal a las áreas

### Empieza aquí

- [CS50x: Introduction to Computer Science](https://cs50.harvard.edu/x/), Harvard University, David J. Malan. Gratuito. El primer curso de ciencias de la computación más conocido, con clases, hojas de ejercicios y notas públicas.
- [Teach Yourself Computer Science](https://teachyourselfcs.com/), Oz Nova and Myles Byrne. Gratuito. Una lista corta y con opinión, con un libro y un curso en video para cada una de nueve materias centrales.
- [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/), MIT CSAIL. Gratuito. Shell, editores, Git, depuración y profiling: las herramientas que las carreras dan por sabidas y casi nunca enseñan.
- [Computer Science Roadmap](https://roadmap.sh/computer-science), roadmap.sh. Gratuito. Un mapa visual de los temas de una carrera de computación, útil para ver qué falta todavía.

### Libros

- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. De pago. El libro estándar sobre cómo se ejecutan realmente los programas: representación de datos, código máquina, memoria, enlazado y concurrencia.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. El libro de referencia sobre almacenamiento, replicación, transacciones, streams y los compromisos de los sistemas de datos distribuidos.
- [The Architecture of Open Source Applications](https://aosabook.org/en/), edited by Amy Brown and Greg Wilson. Gratuito. Autores de sistemas de código abierto reales explican cómo están construidos y qué cambiarían.
- [Free Programming Books](https://github.com/EbookFoundation/free-programming-books), Free Ebook Foundation. Gratuito. Un gran índice comunitario de libros y cursos legalmente gratuitos, en muchos idiomas, incluidos el portugués y el español.

### Cursos y clases

- [OSSU Computer Science curriculum](https://github.com/ossu/computer-science), Open Source Society University. Gratuito. Un camino completo, similar a una carrera, construido solo con cursos gratuitos en línea, en un orden sugerido.
- [Universidade Brasileira Livre: Ciência da Computação](https://github.com/Universidade-Livre/ciencia-da-computacao), Universidade Brasileira Livre. En portugués. Gratuito. Un currículo brasileño en el espíritu de OSSU, construido con cursos gratuitos en portugués.
- [MIT OpenCourseWare](https://ocw.mit.edu/), Massachusetts Institute of Technology. Gratuito. Videos de clases, notas y exámenes de cursos reales del MIT, la fuente de muchos de los cursos listados más abajo.
- [UNIVESP on YouTube](https://www.youtube.com/@univesptv), Universidade Virtual do Estado de São Paulo. En portugués. Gratuito. Cursos universitarios completos en portugués, incluidos estructuras de datos, sistemas operativos, redes y bases de datos.
- [Curso em Vídeo](https://www.cursoemvideo.com/), Gustavo Guanabara. En portugués. Gratuito. Cursos gratuitos para principiantes en portugués sobre lógica de programación, Python, Java, Git y redes.

### Papers y especificaciones

- [Papers We Love](https://paperswelove.org/), Papers We Love community. Gratuito. Una comunidad que reúne y discute papers clásicos de ciencias de la computación, una buena puerta de entrada a las fuentes primarias.

### Videos

- [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo), Carrie Anne Philbin, Crash Course. Gratuito. Cuarenta episodios cortos que van de los transistores a los sistemas operativos, las redes y la inteligencia artificial.
- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Gratuito. Investigadores explican ideas sueltas de ciencias de la computación en videos de diez minutos.
- [Akitando](https://www.youtube.com/@Akitando), Fabio Akita. En portugués. Gratuito. Videos largos y profundos en portugués sobre fundamentos: back end, concurrencia, memoria, redes, criptografía y carrera.
- [Código Fonte TV](https://www.youtube.com/@codigofontetv), Gabriel Fróes and Vanessa Weber. En portugués. Gratuito. Videos cortos en portugués que definen términos y tecnologías, buenos para un primer contacto con un tema.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Explicaciones animadas de temas de diseño de sistemas como cachés, colas, balanceadores de carga y protocolos.

### Práctica y herramientas

- [Build your own X](https://github.com/codecrafters-io/build-your-own-x), CodeCrafters community. Gratuito. Un índice de tutoriales para reconstruir desde cero una base de datos, un shell, un intérprete y muchas otras herramientas.
- [The System Design Primer](https://github.com/donnemartin/system-design-primer), Donne Martin. Gratuito. Un resumen estructurado de temas de escalabilidad con diagramas y ejercicios de diseño resueltos.
- [AkitaOnRails](https://akitaonrails.com/), Fabio Akita. En portugués. Gratuito. El blog detrás del canal Akitando, con las transcripciones y referencias de cada video.

### Comunidades

- [Hacker News](https://news.ycombinator.com/), Y Combinator. Gratuito. Enlaces y discusión diarios de profesionales, donde reaparecen muchos papers y posts clásicos.
- [Lobsters](https://lobste.rs/), Lobsters community. Gratuito. Una comunidad de enlaces más pequeña, organizada por etiquetas y centrada en programación y ciencias de la computación.
- [Computer Science Stack Exchange](https://cs.stackexchange.com/), Stack Exchange. Gratuito. Preguntas y respuestas del lado teórico: algoritmos, complejidad, autómatas y estructuras de datos.
- [r/compsci](https://www.reddit.com/r/compsci/), Reddit. Gratuito. Subreddit general de ciencias de la computación, bueno para leer recomendaciones y preguntas conceptuales.
- [TabNews](https://www.tabnews.com.br/), Filipe Deschamps and community. En portugués. Gratuito. Una comunidad brasileña de publicaciones y discusiones sobre programación, en portugués.

## Big O y análisis de algoritmos

El análisis de algoritmos es la herramienta para predecir cómo crece el costo de un programa con el tamaño de su entrada, antes de ejecutarlo. Da el vocabulario (O, Ω, Θ), las técnicas (contar operaciones, recurrencias, análisis amortizado) y los límites (cotas inferiores, P y NP) en los que se apoya cada otra área de este repositorio cuando dice que algo es rápido o lento.

- [Asymptotic notation](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratuito. Una primera lectura amable sobre por qué se descartan las constantes y qué significan O, Ω y Θ.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/), Eric Rowell. Gratuito. Una página con el costo en tiempo y espacio de las operaciones comunes de estructuras de datos y de los algoritmos de ordenamiento.
- [Análise de Algoritmos](https://www.ime.usp.br/~pf/analise_de_algoritmos/), Paulo Feofiloff, IME-USP. En portugués. Gratuito. Notas de clase en portugués que cubren notación, recurrencias, invariantes y pruebas de corrección con rigor.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. De pago. La referencia estándar: capítulos 2 a 4 para notación y recurrencias, 16 para análisis amortizado, 34 para NP-completitud.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Gratuito en línea, de pago impreso. Un libro de texto gratuito con un tratamiento claro de recursión, recurrencias y NP-dificultad, además de muchos ejercicios.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare, Demaine, Ku and Solomon. Gratuito. Clases, notas y hojas de problemas que usan análisis asintótico en cada estructura de datos y algoritmo.
- [Master theorem (analysis of algorithms)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29), Wikipedia. Gratuito. Un enunciado compacto de los tres casos con ejemplos resueltos y los casos que el teorema no cubre.
- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratuito. Las clases grabadas del curso anterior, empezando por el modelo de computación y la notación asintótica.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratuito. Clases en pizarra que cuentan operaciones paso a paso y resuelven recurrencias a mano.
- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratuito. Animaciones paso a paso donde se puede ver el costo de cada operación a medida que cambia la entrada.
- [Computer Science Stack Exchange: asymptotics tag](https://cs.stackexchange.com/questions/tagged/asymptotics), Stack Exchange. Gratuito. Preguntas respondidas sobre notación y pruebas, incluidos los hilos de referencia sobre cómo resolver recurrencias.

Lista completa y mini-proyectos: [projects/big-o/README.es.md](projects/big-o/README.es.md)

## Estructuras de datos

Las estructuras de datos son las formas de organizar los datos en memoria y en disco para que las operaciones que necesita un programa sean baratas. Elegir entre un arreglo, una lista enlazada, una tabla hash, un árbol balanceado o un grafo suele ser la decisión que más cambia el costo de un programa, y es la base de las bases de datos, los compiladores, los sistemas operativos y las redes.

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratuito. Animaciones de listas, heaps, tablas hash, árboles de búsqueda y recorridos de grafos, con quizzes.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html), David Galles, University of San Francisco. Gratuito. Páginas interactivas donde insertas y quitas claves y ves cómo se rebalancean los árboles AVL, rojinegros y B.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. En portugués. Gratuito. Notas en portugués sobre listas, pilas, colas, árboles, heaps y hashing, con código C corto.
- [Open Data Structures](https://opendatastructures.org/), Pat Morin. Gratuito. Un libro de texto gratuito que implementa y analiza cada estructura, con ediciones en Java, C++ y pseudocódigo.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito en línea, de pago impreso. El sitio del libro tiene resúmenes, código en Java y ejercicios sobre tablas de símbolos, árboles balanceados, hashing y grafos.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratuito. La primera mitad es un curso de estructuras de datos: secuencias, conjuntos, hashing, árboles binarios, AVL y heaps.
- [CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/), Josh Hug, UC Berkeley. Gratuito. Un curso completo con videos, un libro de texto en línea y proyectos autocalificados en Java.
- [Estrutura de Dados](https://www.youtube.com/playlist?list=PLxI8Can9yAHf8k8LrUePyj0y3lLpigGcl), UNIVESP. En portugués. Gratuito. Un curso universitario completo en portugués usando C: listas, pilas, colas, árboles y ordenamiento.
- [Organization and Maintenance of Large Ordered Indices](https://infolab.usc.edu/csci585/Spring2010/den_ar/indexing.pdf), Rudolf Bayer and Edward McCreight (1970). Gratuito. El informe de investigación de Boeing, publicado como paper en 1972, que presentó el árbol B, el origen de todo índice de base de datos.
- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratuito. Clases grabadas sobre arreglos dinámicos, hashing, heaps binarios, árboles AVL y búsqueda en grafos.
- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratuito. Artículos claros con código sobre árboles de segmentos, árboles de Fenwick, conjuntos disjuntos, tries y algoritmos de grafos.
- [Stack Overflow: data-structures tag](https://stackoverflow.com/questions/tagged/data-structures), Stack Overflow. Gratuito. Un gran archivo de preguntas prácticas sobre cómo elegir e implementar estructuras.

Lista completa y mini-proyectos: [projects/data-structures/README.es.md](projects/data-structures/README.es.md)

## Sistemas operativos

Un sistema operativo es el programa que reparte una máquina entre muchos programas: da a cada proceso la ilusión de tener su propia CPU y memoria, media el acceso a archivos y dispositivos, y evita que los programas se dañen entre sí. Entender procesos, planificación, memoria virtual, sistemas de archivos e interbloqueos explica la mayor parte del comportamiento, y de los problemas de rendimiento, del software real.

- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau, University of Wisconsin. Gratuito en línea, de pago impreso. El libro de SO más amigable: capítulos cortos sobre virtualización, concurrencia y persistencia, con simuladores para las tareas.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. En portugués. Gratuito. Un libro de texto completo y gratuito en portugués, con diapositivas y ejercicios para cada capítulo.
- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. De pago. El libro de texto que sigue el quiz (en su 4.ª edición): procesos, memoria, sistemas de archivos, E/S, interbloqueos y virtualización.
- [Operating System Concepts, 10th edition](https://www.os-book.com/OS10/), Silberschatz, Galvin and Gagne. De pago. El otro libro de texto clásico; su sitio ofrece gratis las diapositivas y los ejercicios de práctica.
- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Gratuito. Diapositivas, lecturas y los proyectos de Pintos de un curso completo de SO.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Un curso guiado por laboratorios construido alrededor de xv6, un pequeño kernel didáctico tipo Unix para RISC-V.
- [The UNIX Time-Sharing System](https://dsf.berkeley.edu/cs262/unix.pdf), Dennis Ritchie and Ken Thompson (1974). Gratuito. El paper que presentó los archivos como flujos de bytes, el shell, los pipes y fork, en unas pocas páginas legibles.
- [Linux man-pages online](https://man7.org/linux/man-pages/), Michael Kerrisk and the man-pages project. Gratuito. La descripción autorizada de cada llamada al sistema y función de biblioteca, como fork, mmap y pipe.
- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Gratuito. Pequeños simuladores en Python de planificación, paginación, TLB y discos, cercanos a los mini-proyectos de esta área.
- [r/osdev](https://www.reddit.com/r/osdev/), Reddit. Gratuito. Una comunidad de personas que escriben sus propios kernels, buena para preguntas de bajo nivel.

Lista completa y mini-proyectos: [projects/operating-systems/README.es.md](projects/operating-systems/README.es.md)

## Redes

Las redes de computadoras son las capas de protocolos que mueven bytes entre máquinas: desde señales en un cable, pasando por tramas, paquetes y rutas, hasta conexiones confiables y las aplicaciones construidas sobre ellas. Casi todo programa hoy habla con otro, así que saber qué garantizan realmente TCP, IP, DNS y Ethernet es lo que separa adivinar de diagnosticar.

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/), Larry Peterson and Bruce Davie. Gratuito. Un libro de texto completo y abierto que explica cada capa a través de los problemas de diseño que resuelve.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), Brian "Beej" Hall. Gratuito. La clásica introducción práctica a los sockets en C: direcciones, TCP, UDP y select.
- [How DNS works](https://howdns.works/), DNSimple. Gratuito. Un cómic corto que sigue una resolución de nombre desde el navegador hasta los servidores raíz.
- [Computer Networking: A Top-Down Approach, 9th edition](https://gaia.cs.umass.edu/kurose_ross/index.php), Jim Kurose and Keith Ross. Gratuito en línea, de pago impreso. El libro de texto más usado; el sitio de los autores ofrece clases en video, diapositivas y laboratorios de Wireshark gratis.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. De pago. El libro de texto de abajo hacia arriba que sigue el quiz (en su 5.ª edición), fuerte en las capas de enlace de datos y MAC.
- [CS 144 Introduction to Computer Networking](https://cs144.github.io/), Stanford University. Gratuito. Notas de clase y laboratorios en los que construyes paso a paso una implementación funcional de TCP.
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Gratuito. La especificación actual de TCP: encabezado, máquina de estados, números de secuencia y retransmisión.
- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), Paul Mockapetris, IETF. Gratuito. El diseño de DNS: el espacio de nombres, las zonas, los resolvedores y las consultas iterativas y recursivas.
- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), Wireshark Foundation. Gratuito. Guía oficial para capturar y leer paquetes, la mejor manera de ver los protocolos de verdad.
- [Networking tutorial](https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW), Ben Eater. Gratuito. Trece videos cortos que van construyendo desde bits en un cable hasta Ethernet, IP, enrutamiento y TCP.
- [Network Engineering Stack Exchange](https://networkengineering.stackexchange.com/), Stack Exchange. Gratuito. Preguntas y respuestas sobre protocolos, subredes, conmutación y enrutamiento.

Lista completa y mini-proyectos: [projects/networks/README.es.md](projects/networks/README.es.md)

## Bases de datos (teoría)

La teoría de bases de datos explica cómo se modelan los datos como relaciones, se consultan con un lenguaje declarativo y se almacenan para que las consultas sigan siendo rápidas y los datos sigan siendo correctos. El modelo relacional, el álgebra relacional, la normalización, los índices y la optimización de consultas son las ideas detrás de toda base de datos SQL, y es lo que permite a un desarrollador diseñar un esquema y leer un plan de consulta en lugar de adivinar.

- [SQLBolt](https://sqlbolt.com/), SQLBolt. Gratuito. Lecciones interactivas cortas que enseñan SQL ejecutando consultas en el navegador.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Gratuito. Un libro gratuito en línea sobre cómo funcionan los índices de árbol B y cómo escribir consultas que los usen.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Gratuito. Un tutorial que escribe un pequeño clon de SQLite en C, desde el REPL hasta el árbol B en disco.
- [Database System Concepts, 7th edition](https://db-book.com/), Silberschatz, Korth and Sudarshan. De pago. Un libro de texto completo; el sitio ofrece diapositivas y ejercicios de práctica gratis para cada capítulo.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Diapositivas, notas, videos y proyectos sobre almacenamiento, índices, ejecución de consultas, optimización y concurrencia.
- [CS 186 Introduction to Database Systems](https://cs186berkeley.net/), UC Berkeley. Gratuito. Notas de curso y ejercicios sobre álgebra relacional, joins, optimización de consultas y normalización.
- [A Relational Model of Data for Large Shared Data Banks](https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf), Edgar F. Codd (1970). Gratuito. El paper que propuso las relaciones, las claves y las formas normales y dio inicio a las bases de datos relacionales.
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf), Hellerstein, Stonebraker and Hamilton (2007). Gratuito. Un extenso panorama de cómo está organizado un DBMS relacional real, desde el parser hasta el gestor de almacenamiento.
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), PostgreSQL Global Development Group. Gratuito. El manual más claro de un sistema real: SQL, índices, el planificador y EXPLAIN.
- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Gratuito. Las clases grabadas de 15-445 y 15-721, además de charlas de ingenieros de bases de datos.
- [RelaX: relational algebra calculator](https://dbis-uibk.github.io/relax/), University of Innsbruck. Gratuito. Ejecuta expresiones de álgebra relacional sobre datos de ejemplo y muestra el árbol de operadores.
- [Database Administrators Stack Exchange](https://dba.stackexchange.com/), Stack Exchange. Gratuito. Preguntas y respuestas sobre diseño de esquemas, normalización, índices y planes de consulta.

Lista completa y mini-proyectos: [projects/databases/README.es.md](projects/databases/README.es.md)

## Algoritmos

Los algoritmos son los métodos paso a paso para resolver un problema: ordenar, buscar, encontrar el camino más corto, elegir la mejor combinación. Estudiarlos enseña un pequeño conjunto de técnicas de diseño (divide y vencerás, elección voraz, programación dinámica, backtracking) que convierten problemas que parecen imposibles a gran escala en programas que terminan.

- [Algorithms](https://www.khanacademy.org/computing/computer-science/algorithms), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratuito. Una unidad amable con texto y ejercicios sobre búsqueda binaria, los ordenamientos clásicos, recursión y búsqueda en grafos.
- [VisuAlgo: Sorting](https://visualgo.net/en/sorting), Steven Halim, National University of Singapore. Gratuito. Anima cada algoritmo de ordenamiento sobre tu propia entrada y cuenta comparaciones e intercambios.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. En portugués. Gratuito. Notas en portugués sobre búsqueda, los ordenamientos clásicos, heapsort, quicksort y backtracking, con invariantes.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. De pago. La referencia estándar sobre ordenamiento, programación dinámica, algoritmos voraces y algoritmos de grafos.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito en línea, de pago impreso. Muy práctico en ordenamiento: el sitio del libro compara los algoritmos y ofrece código Java probado.
- [The Algorithm Design Manual, 3rd edition](https://www.algorist.com/), Steven Skiena. De pago. Enseña a reconocer qué técnica encaja con un problema, con un catálogo de problemas clásicos.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratuito. Clases y hojas de problemas sobre ordenamiento, caminos más cortos y un marco claro para la programación dinámica.
- [Algorithms, Part I](https://www.coursera.org/learn/algorithms-part1), Robert Sedgewick and Kevin Wayne, Princeton (Coursera). Gratuito para auditar, certificado de pago. Curso en video sobre union-find, los algoritmos de ordenamiento, colas de prioridad y árboles de búsqueda, con tareas de programación calificadas.
- [Timsort: listsort.txt](https://github.com/python/cpython/blob/main/Objects/listsort.txt), Tim Peters, CPython. Gratuito. La descripción del propio autor del merge sort híbrido que usa Python, con mediciones.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratuito. Clases en pizarra sobre divide y vencerás, método voraz, programación dinámica y backtracking.
- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratuito. Artículos de referencia con pruebas y código sobre algoritmos de grafos, programación dinámica y más.
- [Codeforces](https://codeforces.com/), Mike Mirzayanov. Gratuito. Concursos y una comunidad muy activa con editoriales que explican cada solución.

Lista completa y mini-proyectos: [projects/algorithms/README.es.md](projects/algorithms/README.es.md)

## Concurrencia

La concurrencia es el arte de estructurar un programa como varias actividades que avanzan en tiempos que se superponen y comparten estado de forma segura. Ahí viven los errores más difíciles (condiciones de carrera, interbloqueos, inanición), y cada lenguaje los resuelve de forma distinta: locks y atómicos, canales, actores o un event loop. Conocer los modelos permite elegir uno de forma deliberada.

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratuito. La charla y las diapositivas que separan las dos ideas: la concurrencia es estructura, el paralelismo es ejecución.
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/), Allen B. Downey. Gratuito. Un libro gratuito de acertijos de sincronización, desde el mutex hasta la cena de los filósofos y lectores-escritores.
- [Concorrência e Paralelismo (Parte 1)](https://akitaonrails.com/2019/03/13/akitando-43-concorrencia-e-paralelismo-parte-1-entendendo-back-end-para-iniciantes-parte-3/), Fabio Akita, Akitando. En portugués. Gratuito. Un video con transcripción completa en portugués sobre procesos, hilos y lo que le cuestan al sistema operativo.
- [Operating Systems: Three Easy Pieces (Concurrency part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratuito en línea, de pago impreso. Capítulos gratuitos sobre hilos, locks, variables de condición, semáforos y errores comunes de concurrencia.
- [Java Concurrency in Practice](https://jcip.net/), Brian Goetz and others. De pago. El clásico sobre seguridad en hilos, visibilidad, el modelo de memoria y los pools de hilos.
- [Rust Atomics and Locks](https://mara.nl/atomics/), Mara Bos. Gratuito en línea, de pago impreso. Gratis para leer en línea: atómicos, orden de memoria y cómo construir un mutex y un canal desde cero.
- [Communicating Sequential Processes](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf), C. A. R. Hoare (1978). Gratuito. El paper detrás de los canales de Go y de muchos otros lenguajes: procesos que solo se comunican mediante mensajes.
- [Making reliable distributed systems in the presence of software errors](https://erlang.org/download/armstrong_thesis_2003.pdf), Joe Armstrong (2003). Gratuito. La tesis que explica el diseño de Erlang y de la BEAM: procesos aislados, mensajes y supervisión.
- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors. Gratuito. Las reglas oficiales de cuándo se garantiza que una goroutine vea lo que otra escribió.
- [The Rust Programming Language: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html), The Rust Project. Gratuito. Cómo la propiedad (ownership) y los traits Send y Sync convierten las carreras de datos en errores de compilación.
- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ), Philip Roberts, JSConf EU. Gratuito. La explicación visual más clara de la pila de llamadas, la cola de tareas y el event loop de JavaScript.
- [Stack Overflow: concurrency tag](https://stackoverflow.com/questions/tagged/concurrency), Stack Overflow. Gratuito. Preguntas respondidas sobre locks, visibilidad e interbloqueos en todos los lenguajes.

Lista completa y mini-proyectos: [projects/concurrency/README.es.md](projects/concurrency/README.es.md)

## Paralelismo

El paralelismo es ejecutar cómputos al mismo tiempo en varios núcleos, carriles vectoriales o máquinas para terminar antes. Los procesadores dejaron de volverse más rápidos núcleo por núcleo, así que la velocidad ahora viene de dividir bien el trabajo. La ley de Amdahl, el false sharing y el ancho de banda de memoria explican por qué duplicar los núcleos rara vez duplica la velocidad, y cómo acercarse a ello.

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial), Lawrence Livermore National Laboratory. Gratuito. Un tutorial largo y sencillo sobre los conceptos: arquitecturas de memoria, modelos de programación, aceleración y sus límites.
- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratuito. Aclara la diferencia entre estructurar un programa de forma concurrente y ejecutarlo en paralelo.
- [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law), Wikipedia. Gratuito. La fórmula, su derivación y su relación con la ley de Gustafson, con el gráfico habitual.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratuito. Un libro gratuito en línea sobre cachés de CPU, SIMD, predicción de saltos y cómo medirlos.
- [Is Parallel Programming Hard, And, If So, What Can You Do About It?](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html), Paul E. McKenney. Gratuito. Un libro gratuito de un desarrollador del kernel de Linux sobre conteo, locking, particionado y escalabilidad.
- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare, Charles Leiserson and Julian Shun. Gratuito. Clases sobre programación multinúcleo, carreras, work stealing, algoritmos eficientes en caché y medición.
- [CS 149 Parallel Computing](https://gfxcourses.stanford.edu/cs149/fall23), Stanford University, Kayvon Fatahalian and Kunle Olukotun. Gratuito. Diapositivas sobre paralelismo de tareas y de datos, SIMD, GPU, planificación y análisis de rendimiento.
- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), Jeffrey Dean and Sanjay Ghemawat, Google (2004). Gratuito. El paper que hizo de map y reduce el modelo para procesar datos en miles de máquinas.
- [Rayon](https://docs.rs/rayon/latest/rayon/), Rayon developers. Gratuito. Documentación de la biblioteca de paralelismo de datos para Rust: iteradores paralelos y join.
- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Gratuito. Las clases grabadas, incluidas las de Cilk, carreras y el análisis de algoritmos multihilo.
- [Stack Overflow: parallel-processing tag](https://stackoverflow.com/questions/tagged/parallel-processing), Stack Overflow. Gratuito. Preguntas prácticas sobre por qué el código paralelo no escala y cómo arreglarlo.
- [Cilk: An Efficient Multithreaded Runtime System](https://dspace.mit.edu/handle/1721.1/149259), Blumofe, Joerg, Kuszmaul, Leiserson, Randall and Zhou (1995). Gratuito. El paper sobre el runtime cuyo planificador de work stealing fue adoptado después por Go, Rayon y el pool fork-join de Java.

Lista completa y mini-proyectos: [projects/parallelism/README.es.md](projects/parallelism/README.es.md)

## Transacciones

Una transacción agrupa varias operaciones para que tengan éxito o fallen juntas y no se corrompan entre sí cuando se ejecutan al mismo tiempo. ACID, los niveles de aislamiento, el locking, la concurrencia multiversión y el write-ahead log son cómo las bases de datos cumplen esa promesa, y las sagas, el patrón outbox y la idempotencia son cómo la cumplen las aplicaciones entre servicios, donde ya no hay una sola transacción de base de datos.

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group. Gratuito. La tabla oficial de qué anomalías previene cada nivel, con ejemplos de lo que realmente ocurre.
- [Consistency Models](https://jepsen.io/consistency), Kyle Kingsbury, Jepsen. Gratuito. Un mapa clicable de modelos de consistencia y aislamiento, cada uno con una definición breve y precisa.
- [Transactions: myths, surprises and opportunities](https://www.youtube.com/watch?v=5ZjhNTM8XU8), Martin Kleppmann, Strange Loop. Gratuito. Una charla que muestra lo que realmente significan ACID y los nombres de los niveles de aislamiento en distintas bases de datos.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. Los capítulos sobre transacciones, los problemas de los sistemas distribuidos y la consistencia son el mejor resumen moderno.
- [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/), Bernstein, Hadzilacos and Goodman. Gratuito. El texto clásico sobre serializabilidad, bloqueo de dos fases, control multiversión y recuperación, gratuito en el sitio del autor.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Clases sobre teoría del control de concurrencia, bloqueo de dos fases, MVCC, logging y recuperación.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS, Robert Morris and Frans Kaashoek. Gratuito. Clases, papers y laboratorios sobre replicación, commit de dos fases y consistencia, con Raft construido a mano.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil (1995). Gratuito. El paper que mostró que los niveles estándar son ambiguos y definió el aislamiento por snapshot y el write skew.
- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem (1987). Gratuito. El origen de la saga: una transacción larga dividida en pasos, cada uno con una acción compensatoria.
- [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), PostgreSQL Global Development Group. Gratuito. El capítulo sobre MVCC, bloqueo explícito, interbloqueos y manejo de fallos de serialización.
- [Hermitage: testing transaction isolation levels](https://github.com/ept/hermitage), Martin Kleppmann. Gratuito. Un conjunto de pruebas que muestra qué anomalías permite realmente cada nivel de aislamiento de bases de datos reales.
- [Database Administrators Stack Exchange: transaction tag](https://dba.stackexchange.com/questions/tagged/transaction), Stack Exchange. Gratuito. Preguntas respondidas sobre aislamiento, bloqueos e interbloqueos en sistemas reales.

Lista completa y mini-proyectos: [projects/transactions/README.es.md](projects/transactions/README.es.md)

## Seguridad

La seguridad de aplicaciones consiste en entender cómo falla el software cuando alguien intenta usarlo de forma indebida, para poder construirlo de modo que no falle. Esta área es defensiva: cada falla (inyección, cross-site scripting, control de acceso roto, almacenamiento débil de contraseñas) se estudia para explicar por qué ocurre y cómo prevenirla, siguiendo la guía de OWASP. Los laboratorios corren solo en local, en Docker, y siempre incluyen el arreglo junto con la falla.

- [OWASP Top 10](https://top10.owasp.org/), OWASP Foundation. Gratuito. La lista de referencia de los riesgos más críticos de las aplicaciones web, con la edición actual y las anteriores, cada riesgo con ejemplos y consejos de prevención.
- [OWASP Top 10 (2021), tradução em português](https://top10.owasp.org/2021/pt-BR/), OWASP Foundation. En portugués. Gratuito. La traducción oficial al portugués de Brasil de la edición 2021, la que sigue el quiz.
- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security), Mozilla. Gratuito. Una puerta de entrada al modelo de seguridad del navegador: política de mismo origen, HTTPS, CSP, cookies y ataques de los que defenderse.
- [Security Engineering, 3rd edition](https://www.cl.cam.ac.uk/archive/rja14/book.html), Ross Anderson. Gratuito en línea, de pago impreso. Un libro de texto amplio y legible sobre cómo se diseñan los sistemas seguros y por qué fallan, con capítulos gratuitos en línea.
- [CS 253 Web Security](https://web.stanford.edu/class/cs253/), Feross Aboukhadijeh, Stanford University. Gratuito. Diapositivas y clases grabadas sobre la política de mismo origen, XSS, CSRF, sesiones, inyección y HTTPS, centradas en las defensas.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), OWASP Foundation. Gratuito. Guías de prevención concisas y prácticas por tema: inyección, XSS, CSRF, sesiones, almacenamiento de contraseñas, carga de archivos y más.
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/projects/asvs), OWASP Foundation. Gratuito. Una lista de verificación de requisitos de seguridad comprobables, útil para convertir consejos en pruebas.
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), IETF. Gratuito. La lista oficial de trampas de JWT y las reglas que las evitan, como fijar el algoritmo.
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Foundation. Gratuito. Por qué las consultas parametrizadas son la defensa principal, con ejemplos en varios lenguajes.
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP Foundation. Gratuito. Qué algoritmos de hash usar (primero Argon2id) y con qué parámetros.
- [OWASP Juice Shop](https://owasp.org/projects/juice-shop), OWASP Foundation. Gratuito. Una aplicación de entrenamiento deliberadamente insegura para ejecutar en local, el modelo de los laboratorios de esta área.
- [Information Security Stack Exchange](https://security.stackexchange.com/), Stack Exchange. Gratuito. Respuestas cuidadosas sobre autenticación, uso de criptografía y defensa de aplicaciones web.

Lista completa y mini-proyectos: [projects/security/README.es.md](projects/security/README.es.md)

## Compiladores

Un compilador traduce un programa de un lenguaje a otro, y un intérprete lo ejecuta directamente. Ambos pasan por las mismas etapas: dividir el texto en tokens, construir un árbol a partir de una gramática, verificarlo y luego generar código o ejecutarlo. Conocer estas etapas quita el misterio a los mensajes de error, al rendimiento, al garbage collection y a toda herramienta que lee código.

- [Crafting Interpreters](https://craftinginterpreters.com/), Robert Nystrom. Gratuito en línea, de pago impreso. Gratis en línea: construye el mismo lenguaje dos veces, como intérprete que recorre el árbol y como máquina virtual de bytecode.
- [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/), Ruslan Spivak. Gratuito. Una serie de blog paciente que hace crecer un intérprete de Pascal en pequeños pasos.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Gratuito. Explica la construcción de Thompson y por qué la coincidencia basada en autómatas evita el tiempo exponencial.
- [Compilers: Principles, Techniques, and Tools, 2nd edition (the Dragon Book)](https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472), Aho, Lam, Sethi and Ullman. De pago. El libro de texto que sigue el quiz: análisis léxico, análisis sintáctico LL y LR, traducción, generación de código y optimización.
- [Introduction to Compilers and Language Design](https://dthain.github.io/books/compiler/), Douglas Thain, University of Notre Dame. Gratuito en línea, de pago impreso. Un libro de texto gratuito de un semestre que va del escaneo a la generación de código x86.
- [CS 143 Compilers](https://web.stanford.edu/class/cs143/), Stanford University. Gratuito. Diapositivas de clase y tareas en las que se construye un compilador para el lenguaje COOL fase por fase.
- [CS 6120 Advanced Compilers: The Self-Guided Online Course](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/), Adrian Sampson, Cornell University. Gratuito. Videos y tareas sobre representaciones intermedias, análisis de flujo de datos, SSA y optimización.
- [The Implementation of Lua 5.0](https://www.lua.org/doc/jucs05.pdf), Ierusalimschy, de Figueiredo and Celes (2005). Gratuito. Cómo se diseña una máquina virtual real y pequeña: registros, closures y tablas, por sus autores brasileños.
- [LLVM Tutorial: Kaleidoscope](https://llvm.org/docs/tutorial/), LLVM Project. Gratuito. El tutorial oficial que implementa un lenguaje pequeño con un generador de código real y JIT.
- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Gratuito. Escribe código a la izquierda y lee el ensamblador generado a la derecha, para muchos compiladores.
- [AST Explorer](https://astexplorer.net/), Felix Kling. Gratuito. Muestra el árbol sintáctico que construyen parsers reales para un fragmento de código.
- [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/), Reddit. Gratuito. Una comunidad activa de personas que diseñan e implementan lenguajes.

Lista completa y mini-proyectos: [projects/compilers/README.es.md](projects/compilers/README.es.md)

## Máquinas de estado

Una máquina de estados describe un comportamiento como un conjunto finito de estados y las transiciones entre ellos. Es a la vez un modelo teórico (autómatas, lenguajes regulares, máquinas de Turing y los límites de la computación) y una herramienta práctica de diseño: protocolos, parsers, interfaces de usuario y flujos de negocio se vuelven más fáciles de razonar, y las situaciones inválidas se vuelven imposibles de representar, cuando los estados se hacen explícitos.

- [Welcome to the world of Statecharts](https://statecharts.dev/), statecharts community. Gratuito. Una introducción sencilla a las máquinas de estados y los statecharts, con los problemas que resuelve cada concepto.
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html), Robert Nystrom. Gratuito. Parte de un enredo de banderas y llega a las máquinas de estados finitos, las jerarquías y los autómatas de pila.
- [State pattern](https://refactoring.guru/design-patterns/state), Refactoring Guru. Gratuito. El patrón State orientado a objetos con diagramas y código, disponible también en portugués y en español en el sitio.
- [Introduction to the Theory of Computation, 3rd edition](https://math.mit.edu/~sipser/book.html), Michael Sipser. De pago. El libro de texto estándar sobre autómatas, lenguajes regulares y libres de contexto, máquinas de Turing y computabilidad.
- [MIT 18.404J Theory of Computation](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/), Michael Sipser, MIT OpenCourseWare. Gratuito. Clases en video del autor del libro de texto, de los autómatas finitos a la indecidibilidad y la complejidad.
- [On Computable Numbers, with an Application to the Entscheidungsproblem](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf), Alan Turing (1936). Gratuito. El paper que definió la máquina de Turing y probó que algunos problemas no pueden decidirse.
- [XState and Stately documentation](https://stately.ai/docs), Stately. Gratuito. La documentación de la principal biblioteca de statecharts para TypeScript: estados, eventos, guardas, acciones y actores.
- [gen_statem](https://www.erlang.org/doc/apps/stdlib/gen_statem.html), Erlang/OTP. Gratuito. El comportamiento estándar de máquina de estados de la BEAM, usado desde Elixir para protocolos y flujos de trabajo.
- [MIT 18.404J Theory of Computation, Fall 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY), Michael Sipser, MIT OpenCourseWare. Gratuito. Las clases grabadas del curso anterior.
- [JFLAP](https://www.jflap.org/), Susan Rodger, Duke University. Gratuito. Una herramienta para construir y simular autómatas, gramáticas y máquinas de Turing, y convertir entre ellos.
- [Computer Science Stack Exchange: automata tag](https://cs.stackexchange.com/questions/tagged/automata), Stack Exchange. Gratuito. Preguntas respondidas sobre construcciones de autómatas, pruebas y lenguajes regulares.
- [Statecharts in the Making: A Personal Account](https://weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf), David Harel (2007). Gratuito. El inventor de los statecharts cuenta cómo se añadieron jerarquía, estados paralelos y comunicación por difusión a los diagramas de estados, y por qué.

Lista completa y mini-proyectos: [projects/state-machines/README.es.md](projects/state-machines/README.es.md)

## Teoría de la información

La teoría de la información mide la información en bits y demuestra hasta dónde pueden comprimirse los datos y con qué fiabilidad pueden enviarse por un canal con ruido. La entropía de Shannon fija el límite al que se acercan Huffman y LZ77, y la redundancia añadida a propósito (paridad, CRC, códigos de Hamming) es lo que permite a las redes y a los discos detectar y reparar errores. Las mismas ideas explican codificaciones de texto como UTF-8 y base64.

- [Journey into information theory](https://www.khanacademy.org/computing/computer-science/informationtheory), Brit Cruise, Khan Academy. Gratuito. Videos cortos que van desde las señales antiguas hasta la entropía, la compresión y la corrección de errores.
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/), Christopher Olah. Gratuito. Explica la entropía, las longitudes óptimas de código y la entropía cruzada con imágenes en lugar de fórmulas.
- [But what are Hamming codes? The origin of error correction](https://www.youtube.com/watch?v=X8jsijhllIA), Grant Sanderson, 3Blue1Brown. Gratuito. Una derivación visual de los códigos de Hamming como un juego de verificaciones de paridad.
- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/), David MacKay. Gratuito en línea, de pago impreso. Un libro de texto completo, gratuito de leer en línea, que cubre codificación de fuente, codificación de canal y códigos correctores de errores.
- [MIT 6.050J Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/), MIT OpenCourseWare, Paul Penfield and Seth Lloyd. Gratuito. Un curso de primer año con notas sobre bits, códigos, compresión, errores, probabilidad y entropía.
- [EE 274 Data Compression: Theory and Applications (notes)](https://stanforddatacompressionclass.github.io/notes/), Stanford University. Gratuito. Notas de clase sobre códigos prefijo, Huffman, codificación aritmética, LZ77 y compresores modernos.
- [A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf), Claude Shannon (1948). Gratuito. El paper fundacional: entropía, el teorema de codificación de fuente y la capacidad del canal, todavía legible hoy.
- [RFC 1951: DEFLATE Compressed Data Format Specification](https://www.rfc-editor.org/rfc/rfc1951), Peter Deutsch, IETF. Gratuito. El formato detrás de gzip, zip y PNG: LZ77 seguido de codificación Huffman, especificado en pocas páginas.
- [A Painless Guide to CRC Error Detection Algorithms](https://www.zlib.net/crc_v3.txt), Ross Williams (1993). Gratuito. La explicación clásica de los CRC, de la división de polinomios a mano a la implementación basada en tablas.
- [Solving Wordle using information theory](https://www.youtube.com/watch?v=v68zYyaEmEA), Grant Sanderson, 3Blue1Brown. Gratuito. Usa un juego de palabras para hacer intuitivos los bits de información y la entropía.
- [The Absolute Minimum Every Software Developer Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/), Joel Spolsky. Gratuito. El ensayo breve que explica los puntos de código, las codificaciones y por qué no existe el texto plano.
- [Computer Science Stack Exchange: information-theory tag](https://cs.stackexchange.com/questions/tagged/information-theory), Stack Exchange. Gratuito. Preguntas respondidas sobre entropía, codificación y límites de la compresión.

Lista completa y mini-proyectos: [projects/information-theory/README.es.md](projects/information-theory/README.es.md)

## Lógica digital

La lógica digital es el nivel donde la computación se vuelve física: números en binario, funciones booleanas, compuertas lógicas y los circuitos hechos con ellas, primero combinacionales (sumadores, multiplexores) y luego secuenciales (flip-flops, registros, contadores). Construir un sumador y luego una pequeña CPU a partir de compuertas muestra que una computadora es una pila de ideas simples, cada una construida sobre la anterior.

- [Nand to Tetris](https://www.nand2tetris.org/), Noam Nisan and Shimon Schocken. Gratuito. El curso que construye una computadora completa desde la compuerta NAND, con herramientas y material de proyectos gratuitos.
- [NandGame](https://nandgame.com/), Olav Junker Kjær. Gratuito. Un juego de navegador con el mismo camino: de una compuerta NAND a un sumador, una ALU y un procesador.
- [Build an 8-bit computer from scratch](https://eater.net/8bit), Ben Eater. Gratuito. Una serie de videos que construye una computadora funcional en protoboards, un módulo a la vez.
- [The Elements of Computing Systems, 2nd edition](https://www.nand2tetris.org/book), Noam Nisan and Shimon Schocken. De pago. El libro de Nand to Tetris: lógica booleana, aritmética, memoria, la CPU y el software que va encima.
- [Code: The Hidden Language of Computer Hardware and Software, 2nd edition](https://codehiddenlanguage.com/), Charles Petzold. De pago. Un camino paciente y no académico desde el código Morse y los relés hasta las compuertas, los sumadores, la memoria y un procesador.
- [MIT 6.004 Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/), MIT OpenCourseWare, Chris Terman. Gratuito. Videos y ejercicios sobre información, compuertas, lógica combinacional y secuencial, y diseño de procesadores.
- [Build a Modern Computer from First Principles: From Nand to Tetris](https://www.coursera.org/learn/build-a-computer), Hebrew University of Jerusalem (Coursera). Gratuito para auditar, certificado de pago. La versión guiada de la parte I de Nand to Tetris, con clases y proyectos verificados automáticamente.
- [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), Claude Shannon (1937 master's thesis). Gratuito. La tesis que mostró que el álgebra de Boole describe los circuitos de conmutación, el inicio del diseño digital.
- [Building an 8-bit breadboard computer!](https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU), Ben Eater. Gratuito. La lista de reproducción completa: reloj, registros, ALU, memoria, contador de programa y lógica de control.
- [Exploring How Computers Work](https://www.youtube.com/watch?v=QZwneRb-zqA), Sebastian Lague. Gratuito. Un recorrido bellamente animado desde las compuertas lógicas hasta un sumador y una pequeña ALU en un simulador.
- [Digital](https://github.com/hneemann/Digital), Helmut Neemann. Gratuito. Un simulador didáctico de circuitos digitales que también genera tablas de verdad y expresiones minimizadas.
- [Electrical Engineering Stack Exchange: digital-logic tag](https://electronics.stackexchange.com/questions/tagged/digital-logic), Stack Exchange. Gratuito. Preguntas respondidas sobre compuertas, minimización, flip-flops y temporización.

Lista completa y mini-proyectos: [projects/digital-logic/README.es.md](projects/digital-logic/README.es.md)

## Electrónica

La electrónica es la capa debajo de la lógica digital: voltaje, corriente, resistencia y potencia, las leyes que los relacionan, los componentes (resistencias, capacitores, bobinas, diodos, transistores) y los instrumentos para medirlos. Para un desarrollador de software explica qué es físicamente un nivel lógico, cómo funciona una fuente de alimentación o un sensor, y cómo leer un esquema y una hoja de datos.

Área solo teórica: no tiene mini-proyecto, así que la lista completa está aquí.

### Empieza aquí

- [Lessons In Electric Circuits](https://www.ibiblio.org/kuphaldt/electricCircuits/), Tony Kuphaldt. Gratuito. Un libro de texto completo y gratuito: corriente continua y alterna, semiconductores, circuitos digitales y tablas de referencia.
- [Electrical engineering](https://www.khanacademy.org/science/electrical-engineering), Khan Academy. Gratuito. Videos y ejercicios sobre análisis de circuitos, desde las leyes de Ohm y Kirchhoff hasta los amplificadores.
- [SparkFun tutorials: concepts](https://learn.sparkfun.com/tutorials/tags/concepts), SparkFun Electronics. Gratuito. Tutoriales ilustrados cortos sobre voltaje, corriente, resistencias, capacitores, diodos y transistores.
- [Instituto Newton C. Braga](https://www.newtoncbraga.com.br/), Newton C. Braga. En portugués. Gratuito. Un sitio muy grande en portugués con cursos, artículos y circuitos prácticos de un autor brasileño clásico.

### Libros

- [Eletrônica, 3rd edition](https://www.clubedohardware.com.br/livros/disponiveis/eletr%C3%B4nica-3%C2%AA-edi%C3%A7%C3%A3o-r34/), Gabriel Torres, Clube do Hardware. En portugués. De pago. La edición actual, en la página de la editorial, del libro que sigue el quiz capítulo por capítulo (en su 2.ª edición).
- [The Art of Electronics, 3rd edition](https://artofelectronics.net/), Paul Horowitz and Winfield Hill. De pago. El libro de referencia del diseño práctico de circuitos, escrito desde el punto de vista del diseñador.
- [Make: Electronics, 3rd edition](https://www.makershed.com/products/make-electronics-3rd-edition-print), Charles Platt. De pago. Un libro para principiantes que enseña mediante experimentos, desde una batería y una resistencia hasta transistores y circuitos integrados.

### Cursos y clases

- [MIT 6.002 Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/), MIT OpenCourseWare, Anant Agarwal. Gratuito. Clases en video sobre análisis de circuitos, equivalentes de Thévenin y Norton, transistores, capacitores e inductores.
- [Engenharia elétrica](https://pt.khanacademy.org/science/electrical-engineering), Khan Academy. En portugués. Gratuito. El curso de análisis de circuitos de Khan Academy traducido al portugués.

### Papers y especificaciones

- [The International System of Units (SI Brochure)](https://www.bipm.org/en/publications/si-brochure), BIPM. Gratuito. La definición oficial de las unidades y los prefijos usados en toda medición.
- [Thévenin's theorem](https://en.wikipedia.org/wiki/Th%C3%A9venin%27s_theorem), Wikipedia. Gratuito. Un enunciado compacto con un ejemplo resuelto y el vínculo con el teorema de Norton.

### Videos

- [EEVblog](https://www.youtube.com/@EEVblog), Dave Jones. Gratuito. Un canal de larga trayectoria con tutoriales de fundamentos, reseñas de instrumentos y desarmados.
- [w2aew](https://www.youtube.com/@w2aew), Alan Wolke. Gratuito. Tutoriales de banco claros sobre osciloscopios, puntas de prueba, transistores y circuitos básicos.
- [Ben Eater](https://www.youtube.com/@BenEater), Ben Eater. Gratuito. Construye circuitos en protoboards y explica cada señal con un multímetro y un osciloscopio.
- [WR Kits](https://www.youtube.com/@canalwrkits), Wagner Rambo. En portugués. Gratuito. Un canal brasileño con miles de lecciones de electrónica analógica y digital y microcontroladores.

### Práctica y herramientas

- [Circuit Simulator Applet](https://www.falstad.com/circuit/), Paul Falstad. Gratuito. Un simulador animado en el navegador donde el flujo de corriente es visible y los valores cambian en vivo.
- [Kit para Montar Circuito DC](https://phet.colorado.edu/pt_BR/simulations/circuit-construction-kit-dc), PhET, University of Colorado Boulder. En portugués. Gratuito. Una simulación de circuitos en portugués para experimentar con la ley de Ohm, serie y paralelo.
- [Tinkercad Circuits](https://www.tinkercad.com/circuits), Autodesk. Gratuito. Una protoboard virtual con componentes, un multímetro y un osciloscopio.
- [KiCad](https://www.kicad.org/), KiCad project. Gratuito. Software de código abierto para dibujar esquemas y placas de circuito.

### Comunidades

- [Electrical Engineering Stack Exchange](https://electronics.stackexchange.com/), Stack Exchange. Gratuito. Respuestas detalladas de ingenieros en ejercicio sobre circuitos, componentes y medición.
- [r/AskElectronics](https://www.reddit.com/r/AskElectronics/), Reddit. Gratuito. Un lugar amable con los principiantes para preguntar sobre circuitos y reparaciones.
- [EEVblog Electronics Community Forum](https://www.eevblog.com/forum/), EEVblog. Gratuito. Un gran foro sobre equipos de prueba, proyectos y preguntas de principiantes.

## Programación orientada a objetos

La programación orientada a objetos organiza un programa como objetos que guardan su propio estado y exponen comportamiento mediante una interfaz. Encapsulación, polimorfismo, herencia y composición son herramientas para controlar cómo se propaga un cambio de una parte a las demás. La mayor parte del código de negocio se escribe así, por lo que saber dónde ayudan las ideas, y dónde producen acoplamiento y code smells, importa todos los días.

- [The Java Tutorials: Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/), Oracle. Gratuito. Una lección oficial breve sobre objetos, clases, herencia, interfaces y paquetes.
- [Curso de Java: Programação Orientada a Objetos](https://www.cursoemvideo.com/curso/java-poo/), Gustavo Guanabara, Curso em Vídeo. En portugués. Gratuito. Un curso en video para principiantes en portugués sobre clases, encapsulación, herencia y polimorfismo.
- [Code Smells](https://refactoring.guru/refactoring/smells), Refactoring Guru. Gratuito. Un catálogo ilustrado de smells, cada uno con sus causas y las refactorizaciones que lo tratan.
- [Effective Java, 3rd edition](https://www.informit.com/store/effective-java-9780134685991), Joshua Bloch. De pago. Consejos concretos sobre diseño de clases, preferir la composición, genéricos, excepciones e inmutabilidad.
- [Refactoring, 2nd edition](https://martinfowler.com/books/refactoring.html), Martin Fowler. De pago. El libro que nombró los code smells y catalogó las refactorizaciones que los eliminan.
- [Practical Object-Oriented Design, 2nd edition](https://sandimetz.com/products), Sandi Metz. De pago. El libro más legible sobre dependencias, duck typing y composición sobre herencia.
- [Java Programming MOOC](https://java-programming.mooc.fi/), University of Helsinki. Gratuito. Un curso gratuito en dos partes con cientos de ejercicios verificados sobre objetos, interfaces, colecciones y streams.
- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Gratuito. Lecturas públicas sobre especificaciones, tipos abstractos de datos, interfaces, igualdad y mutabilidad.
- [The Early History of Smalltalk](https://worrydream.com/EarlyHistoryOfSmalltalk/), Alan Kay (1993). Gratuito. Quien acuñó el término explica qué se pretendía que fueran los objetos y los mensajes.
- [TypeScript Handbook: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), Microsoft. Gratuito. Clases, visibilidad, clases abstractas e interfaces en el lenguaje de referencia de este repositorio.
- [Nothing is Something](https://www.youtube.com/watch?v=OMPfEXIlTVE), Sandi Metz, RailsConf. Gratuito. Una charla sobre reemplazar condicionales y herencia por composición y objetos pequeños.
- [Software Engineering Stack Exchange: object-oriented tag](https://softwareengineering.stackexchange.com/questions/tagged/object-oriented), Stack Exchange. Gratuito. Discusiones de diseño sobre herencia, composición, encapsulación y acoplamiento.

Lista completa y mini-proyectos: [projects/oop/README.es.md](projects/oop/README.es.md)

## Programación funcional

La programación funcional construye programas a partir de funciones puras y datos inmutables, empujando los efectos secundarios hacia los bordes. El código escrito así es más fácil de probar, de razonar y de ejecutar de forma concurrente, porque el resultado de una función depende solo de sus argumentos. Las funciones de orden superior, los closures, el pattern matching y tipos como Option y Result pasaron de Haskell y Elixir a TypeScript, Rust y Java.

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS), Kyle Simpson. Gratuito. Un libro gratuito y pragmático sobre funciones puras, closures, composición e inmutabilidad sin teoría pesada.
- [Elixir School](https://elixirschool.com/pt), Elixir School contributors. En portugués. Gratuito. Lecciones gratuitas de Elixir en portugués (y en muchos otros idiomas): pattern matching, pipes, recursión, procesos.
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/), Scott Wlaschin. Gratuito. La explicación más conocida del manejo de errores con tipos Result, como la imagen de dos vías.
- [Structure and Interpretation of Computer Programs, 2nd edition](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html), Harold Abelson and Gerald Jay Sussman. Gratuito. El clásico sobre abstracción con funciones, recursión, procedimientos de orden superior e intérpretes.
- [Learn You a Haskell for Great Good!](https://learnyouahaskell.github.io/), Miran Lipovača, community edition. Gratuito. Una introducción gratuita y amable a los tipos, el currying, la pereza, los functores y las mónadas.
- [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity), Eric Normand. De pago. Enseña pensamiento funcional en JavaScript separando acciones, cálculos y datos.
- [Programming Languages, Part A](https://www.coursera.org/learn/programming-languages), Dan Grossman, University of Washington (Coursera). Gratuito para auditar, certificado de pago. Un curso exigente de programación funcional en ML: recursión, pattern matching, closures e inferencia de tipos.
- [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf), John Hughes (1990). Gratuito. El paper que sostiene que las funciones de orden superior y la evaluación perezosa son herramientas de modularidad.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Gratuito. El origen de las pruebas basadas en propiedades: enuncias una propiedad y dejas que la herramienta busque un contraejemplo.
- [Elixir: Getting Started](https://hexdocs.pm/elixir/introduction.html), The Elixir Team. Gratuito. La guía oficial: inmutabilidad, pattern matching, recursión, enumerables y streams.
- [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY), Anjana Vakil, JSUnconf. Gratuito. Una charla de treinta minutos para principiantes sobre funciones puras, funciones de orden superior e inmutabilidad.
- [fast-check](https://fast-check.dev/), Nicolas Dubien. Gratuito. La biblioteca de pruebas basadas en propiedades para TypeScript, con una guía para escribir buenas propiedades.

Lista completa y mini-proyectos: [projects/functional-programming/README.es.md](projects/functional-programming/README.es.md)

## Patrones de diseño y SOLID

Los patrones de diseño son soluciones con nombre a problemas de diseño que siguen volviendo, y los principios SOLID son cinco reglas prácticas para mantener las clases y los módulos fáciles de cambiar. Juntos dan un vocabulario compartido (Strategy, Adapter, Observer, inversión de dependencias) para discutir diseño, y el criterio para ver cuándo un patrón se paga solo y cuándo es solo ceremonia.

- [Design Patterns](https://refactoring.guru/design-patterns), Alexander Shvets, Refactoring Guru. Gratuito. El catálogo en línea más claro: cada patrón con el problema, la estructura, ventajas y desventajas, y código.
- [Padrões de Projeto](https://refactoring.guru/pt-br/design-patterns), Alexander Shvets, Refactoring Guru. En portugués. Gratuito. El mismo catálogo traducido al portugués de Brasil.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/), Robert Nystrom. Gratuito en línea, de pago impreso. Gratis en línea: revisita Command, Observer, State y Singleton con notas honestas sobre cuándo no usarlos.
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780201633610), Gamma, Helm, Johnson and Vlissides. De pago. El catálogo original de 23 patrones de la "Gang of Four", todavía la referencia para nombres e intención.
- [Head First Design Patterns, 2nd edition](https://wickedlysmart.com/head-first-design-patterns/), Eric Freeman and Elisabeth Robson. De pago. La página de los autores del libro más accesible: cada patrón nace de un problema de diseño que primero empeora.
- [Catalog of Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/), Martin Fowler. Gratuito. Resúmenes cortos de los patrones de back end: Repository, Unit of Work, Data Mapper, Service Layer.
- [The Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), Robert C. Martin. Gratuito. El índice del autor de los artículos originales sobre cada uno de los principios que luego se llamaron SOLID.
- [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), Barbara Liskov and Jeannette Wing (1994). Gratuito. El enunciado formal del principio de sustitución: lo que un subtipo debe preservar.
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), Martin Fowler (2004). Gratuito. El artículo que nombró la inyección de dependencias y la comparó con el service locator.
- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript), Refactoring Guru. Gratuito. Un ejemplo ejecutable en TypeScript de cada patrón del catálogo.
- [Design Patterns in Object Oriented Programming](https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc), Christopher Okhravi. Gratuito. Explicaciones entusiastas en pizarra de los patrones principales, siguiendo Head First Design Patterns.
- [Software Engineering Stack Exchange: design-patterns tag](https://softwareengineering.stackexchange.com/questions/tagged/design-patterns), Stack Exchange. Gratuito. Discusiones sobre cuándo encaja un patrón y cuándo es sobreingeniería.

Lista completa y mini-proyectos: [projects/design-patterns/README.es.md](projects/design-patterns/README.es.md)

## Arquitectura de software

La arquitectura de software es el conjunto de decisiones que son caras de cambiar: cómo se divide un sistema en partes, hacia dónde apuntan las dependencias y qué atributos de calidad (rendimiento, disponibilidad, facilidad de cambio) se favorecen. Las arquitecturas por capas, hexagonal y limpia, los monolitos y los microservicios, los eventos y CQRS son respuestas a la misma pregunta: cómo mantener las reglas de negocio independientes de los detalles que las rodean.

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin. Gratuito. La publicación original con los círculos concéntricos y la regla de dependencia.
- [Software Architecture Guide](https://martinfowler.com/architecture/), Martin Fowler. Gratuito. Un índice de artículos sobre qué es la arquitectura, los límites de una aplicación, los microservicios y la evolución.
- [Engenharia de Software Moderna, capítulo 7: Arquitetura](https://engsoftmoderna.info/cap7.html), Marco Tulio Valente, UFMG. En portugués. Gratuito. Un capítulo gratuito en portugués sobre capas, MVC, microservicios, colas de mensajes y publicación/suscripción.
- [Clean Architecture](https://www.informit.com/store/clean-architecture-a-craftsmans-guide-to-software-structure-9780134494166), Robert C. Martin. De pago. El libro sobre entidades, casos de uso, adaptadores de interfaz y principios de componentes.
- [Fundamentals of Software Architecture](https://fundamentalsofsoftwarearchitecture.com/), Mark Richards and Neal Ford. De pago. Un panorama de estilos y características de arquitectura, con los compromisos de cada estilo calificados.
- [MIT 6.033 Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/), MIT OpenCourseWare. Gratuito. Clases sobre modularidad, abstracción, capas y el diseño de sistemas grandes, con papers clásicos.
- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), Alistair Cockburn. Gratuito. El artículo original sobre puertos y adaptadores, por su autor.
- [Microservices](https://martinfowler.com/articles/microservices.html), James Lewis and Martin Fowler (2014). Gratuito. El artículo que definió el estilo y sus características, incluidos sus costos.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Michael Nygard (2011). Gratuito. La publicación corta que propuso los registros de decisiones de arquitectura y su formato.
- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), Microsoft Azure Architecture Center. Gratuito. Un catálogo de patrones de sistemas distribuidos con el problema, la solución y las consideraciones.
- [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g), Simon Brown. Gratuito. Una charla de conferencia sobre por qué la mayoría de los diagramas de arquitectura fallan y cómo dibujar otros útiles.
- [Software Engineering Stack Exchange: architecture tag](https://softwareengineering.stackexchange.com/questions/tagged/architecture), Stack Exchange. Gratuito. Discusiones sobre compromisos concretos de arquitectura.

Lista completa y mini-proyectos: [projects/software-architecture/README.es.md](projects/software-architecture/README.es.md)

## Testing

Las pruebas automatizadas son la manera en que un equipo sabe que el software sigue funcionando después de cada cambio. El tema cubre los niveles de pruebas (unitarias, de integración, de extremo a extremo), las técnicas para escribirlas (dobles de prueba, desarrollo guiado por pruebas, pruebas basadas en propiedades y de mutación) y sus modos de fallo, como las pruebas inestables y los números de cobertura que no demuestran nada. Las buenas pruebas son lo que vuelve seguros el refactoring y la entrega continua.

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Ham Vocke. Gratuito. Un largo ejemplo resuelto de pruebas unitarias, de integración, de contrato y de extremo a extremo sobre una aplicación.
- [Engenharia de Software Moderna, capítulo 8: Testes](https://engsoftmoderna.info/cap8.html), Marco Tulio Valente, UFMG. En portugués. Gratuito. Un capítulo gratuito en portugués sobre la pirámide, pruebas unitarias, mocks, TDD, cobertura y pruebas inestables.
- [Test Desiderata](https://testdesiderata.com/), Kent Beck. Gratuito. Doce propiedades de una buena prueba, cada una con un video corto, y los compromisos entre ellas.
- [Test-Driven Development: By Example](https://www.informit.com/store/test-driven-development-by-example-9780321146533), Kent Beck. De pago. La fuente del kata de dinero multimoneda y del ejemplo xUnit reconstruido en esta área.
- [Software Engineering at Google: Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), Winters, Manshreck and Wright. Gratuito. Capítulos gratuitos sobre tamaños de pruebas, pruebas unitarias, dobles de prueba y pruebas más grandes, desde una base de código enorme.
- [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing), Vladimir Khorikov. De pago. Define qué hace valiosa a una prueba unitaria y cuándo los mocks ayudan o perjudican.
- [MIT 6.031 Reading 3: Testing](https://web.mit.edu/6.031/www/sp22/classes/03-testing/), MIT. Gratuito. Una lectura clara sobre elegir casos de prueba particionando el espacio de entrada y cubriendo los límites.
- [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), Martin Fowler. Gratuito. El artículo que separa los tipos de dobles de prueba y los estilos clásico y mockist.
- [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), John Micco, Google Testing Blog. Gratuito. Números y causas de la inestabilidad a escala, y qué se hace al respecto.
- [Playwright documentation](https://playwright.dev/docs/intro), Microsoft. Gratuito. La guía oficial de la herramienta de extremo a extremo de este repositorio: localizadores, auto-espera y trace viewer.
- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM), Ian Cooper. Gratuito. Una charla sobre probar el comportamiento en lugar de los detalles de implementación, volviendo al libro de Kent Beck.
- [Software Quality Assurance and Testing Stack Exchange](https://sqa.stackexchange.com/), Stack Exchange. Gratuito. Preguntas y respuestas sobre diseño de pruebas, automatización y estrategia.

Lista completa y mini-proyectos: [projects/testing/README.es.md](projects/testing/README.es.md)

## Protocolos

Los protocolos de aplicación son los acuerdos que permiten que programas escritos por personas distintas se hablen entre sí. Esta área sigue HTTP desde su semántica (métodos, códigos de estado, encabezados, caché, cookies) pasando por sus tres formatos de transmisión (HTTP/1.1, HTTP/2 y HTTP/3 sobre QUIC), el handshake TLS que va debajo, y los estilos de API construidos encima: REST, GraphQL, JSON-RPC, gRPC, WebSocket y server-sent events.

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), Mozilla. Gratuito. El mejor punto de partida: visión general, mensajes, métodos, códigos de estado, encabezados, caché, cookies y CORS.
- [MDN: HTTP (em português)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP), Mozilla. En portugués. Gratuito. La traducción al portugués de Brasil de las guías y la referencia HTTP de MDN.
- [HTTP/3 explained](https://http3-explained.haxx.se/), Daniel Stenberg. Gratuito. Un libro corto y gratuito del autor de curl sobre por qué existe QUIC y cómo funciona HTTP/3.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), Michael Driscoll. Gratuito. Cada byte de un handshake TLS 1.3 real, anotado y explicado.
- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Gratuito en línea, de pago impreso. Gratis en línea: TCP, TLS, HTTP/1.x, HTTP/2, WebSocket y server-sent events desde el lado del rendimiento.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham and Reschke, IETF. Gratuito. La definición actual de métodos, códigos de estado, encabezados y negociación de contenido para todas las versiones de HTTP.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson and Benfield, IETF. Gratuito. Tramas, flujos, control de flujo y compresión de encabezados en HTTP/2.
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), Mike Bishop, IETF. Gratuito. Cómo se mapea la semántica de HTTP sobre los flujos de QUIC.
- [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm), Roy Fielding (2000). Gratuito. La disertación que definió REST y sus restricciones.
- [GraphQL Specification](https://spec.graphql.org/), GraphQL Foundation. Gratuito. La definición oficial del sistema de tipos, las consultas, la validación y la ejecución.
- [Learn GraphQL](https://graphql.org/learn/), GraphQL Foundation. Gratuito. La introducción oficial a esquemas, consultas, mutaciones y buenas prácticas.
- [Stack Overflow: http tag](https://stackoverflow.com/questions/tagged/http), Stack Overflow. Gratuito. Respuestas canónicas sobre códigos de estado, encabezados, caché y CORS.

Lista completa y mini-proyectos: [projects/protocols/README.es.md](projects/protocols/README.es.md)

## Mensajería

La mensajería permite que los servicios cooperen sin llamarse directamente: un lado publica un mensaje y otro lo procesa más tarde. Las colas, la publicación/suscripción y los logs se diferencian en quién recibe un mensaje, en qué orden y cuántas veces, y esas diferencias deciden si un sistema sobrevive a una caída o a un consumidor lento. Las garantías de entrega, los acuses de recibo, los reintentos, las dead-letter queues y los consumidores idempotentes son el núcleo del tema.

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials), RabbitMQ. Gratuito. Seis tutoriales cortos, en muchos lenguajes, desde una cola simple hasta enrutamiento, topics y RPC.
- [Apache Kafka: Introduction](https://kafka.apache.org/intro), Apache Software Foundation. Gratuito. La visión general oficial de eventos, topics, particiones, productores y consumidores.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn. Gratuito. El ensayo que explica el log de solo añadir como la idea detrás de Kafka y del procesamiento de streams.
- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/), Gregor Hohpe and Bobby Woolf. Gratuito en línea, de pago impreso. El resumen gratuito en línea de los 65 patrones del libro: canales, enrutadores, dead letter channel, idempotent receiver.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. El capítulo sobre procesamiento de streams compara los message brokers con los logs y explica la semántica de entrega.
- [The Optimal RabbitMQ Guide](https://www.cloudamqp.com/rabbitmq-ebook/), CloudAMQP. Gratuito. Un e-book gratuito sobre exchanges, colas, bindings y buenas prácticas, una de las fuentes del quiz.
- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts), RabbitMQ. Gratuito. El modelo del protocolo en palabras sencillas: exchanges, colas, bindings, acuses de recibo y prefetch.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat. Gratuito. Una publicación corta sobre por qué la entrega es at-most-once o at-least-once, y qué aporta la idempotencia.
- [RabbitMQ documentation](https://www.rabbitmq.com/docs), RabbitMQ. Gratuito. Guías sobre colas, acuses de recibo del consumidor, publisher confirms y dead-letter exchanges.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/), Apache Software Foundation. Gratuito. La sección de diseño explica el log, la replicación, los grupos de consumidores, los offsets y las garantías de entrega.
- [BullMQ documentation](https://docs.bullmq.io/), Taskforce.sh. Gratuito. Colas de trabajos sobre Redis: workers, reintentos con backoff, limitación de tasa y flujos.
- [Stack Overflow: rabbitmq tag](https://stackoverflow.com/questions/tagged/rabbitmq), Stack Overflow. Gratuito. Preguntas respondidas sobre exchanges, acuses de recibo y reentrega.

Lista completa y mini-proyectos: [projects/messaging/README.es.md](projects/messaging/README.es.md)

## Balanceo de carga

Un balanceador de carga reparte las peticiones entre varios servidores para que un servicio pueda manejar más tráfico que una sola máquina y sobrevivir a la pérdida de una. El tema cubre dónde ocurre el balanceo (capa de transporte o de aplicación), cómo se elige un servidor (round robin, menos conexiones, hashing), cómo se detectan y evitan los servidores caídos, y los roles relacionados de reverse proxy, terminación de TLS y API gateway.

- [Load Balancing](https://samwho.dev/load-balancing/), Sam Rose. Gratuito. Un ensayo visual interactivo que muestra round robin, menos conexiones y su efecto en la latencia.
- [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), Cloudflare Learning Center. Gratuito. Una definición corta y sencilla con los algoritmos comunes y la idea de los health checks.
- [Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), NGINX. Gratuito. La introducción oficial: un bloque upstream, los métodos de balanceo, los pesos y los health checks pasivos.
- [Site Reliability Engineering: Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Google. Gratuito. Cómo llega el tráfico a un centro de datos: DNS, IP virtuales y hashing consistente a nivel de red.
- [Site Reliability Engineering: Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Google. Gratuito. Por qué las políticas simples fallan a escala, con subsetting y round robin ponderado.
- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger and others (1997). Gratuito. El paper que presentó el hashing consistente, de modo que añadir un servidor mueve pocas claves.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/), Eisenbud and others, Google (2016). Gratuito. Cómo se construye un balanceador de capa 4 con servidores comunes, con su propio hashing consistente.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Gratuito. Por qué las peticiones más lentas dominan en los sistemas grandes y cómo el hedging y el balanceo de carga las reducen.
- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), NGINX. Gratuito. La referencia de cada directiva: least_conn, ip_hash, hash, max_fails, fail_timeout, keepalive.
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), Caddy project. Gratuito. Políticas de balanceo de carga, health checks activos y pasivos, y reintentos en el Caddyfile.
- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratuito. Videos sobre balanceo de capa 4 frente a capa 7, proxies, NGINX y HAProxy.
- [Server Fault: load-balancing tag](https://serverfault.com/questions/tagged/load-balancing), Stack Exchange. Gratuito. Preguntas operativas respondidas por administradores de sistemas.

Lista completa y mini-proyectos: [projects/load-balancing/README.es.md](projects/load-balancing/README.es.md)

## Rendimiento

La ingeniería de rendimiento es medir antes de cambiar: definir qué significa rápido (percentiles de latencia, throughput), producir una carga realista, encontrar con un profiler a dónde se va el tiempo, y solo entonces optimizar. Conecta varias capas, desde las cachés de CPU y la localidad de memoria hasta el comportamiento del runtime, las consultas a bases de datos y la capacidad de un servicio completo, y depende de un buen método de benchmarking para no engañarse a uno mismo.

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Gratuito. La guía oficial de usuarios virtuales, etapas, umbrales y checks, con una página para cada tipo de prueba.
- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg. Gratuito. Una lista de verificación para cualquier recurso: utilización, saturación y errores, un primer método para encontrar cuellos de botella.
- [How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU), Gil Tene. Gratuito. La charla sobre percentiles, por qué los promedios esconden el problema y el error de coordinated omission.
- [Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html), Brendan Gregg. De pago. La referencia sobre metodología y sobre análisis de CPU, memoria, sistema de archivos, disco y red en Linux.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratuito. Un libro gratuito en línea sobre cachés de CPU, disposición de memoria, SIMD y benchmarking, con la multiplicación de matrices como caso.
- [Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book), Denis Bakhvalov. Gratuito. Un libro gratuito sobre medir con contadores de hardware, hacer profiling y corregir fallos de caché y predicciones de salto erróneas.
- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare. Gratuito. Empieza acelerando paso a paso la multiplicación de matrices, y luego cubre medición y cachés.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Gratuito. La página del autor sobre cómo se construyen y se leen los flame graphs, con enlaces a su artículo y charlas.
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group. Gratuito. Cómo leer un plan de consulta y encontrar un índice que falta.
- [Performance Matters](https://www.youtube.com/watch?v=r-TLSBdHe1A), Emery Berger, Strange Loop. Gratuito. Una charla sobre por qué los benchmarks ingenuos engañan y cómo medir y hacer profiling de forma sólida.
- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Gratuito. La herramienta de benchmarking de este repositorio: ejecuciones de calentamiento, repeticiones y resumen estadístico.
- [Stack Overflow: performance tag](https://stackoverflow.com/questions/tagged/performance), Stack Overflow. Gratuito. Famosas respuestas canónicas sobre predicción de saltos, efectos de caché y medición.

Lista completa y mini-proyectos: [projects/performance/README.es.md](projects/performance/README.es.md)

## Caché

Una caché guarda una copia de algo costoso de calcular u obtener, para que la siguiente petición se atienda más rápido. Las cachés están en todos los niveles (navegador, CDN, aplicación, base de datos, CPU), y todas plantean las mismas preguntas: qué guardar, cuándo descartarlo, cómo saber que está obsoleto y qué ocurre cuando muchos clientes fallan a la vez. Responder mal cambia un sistema lento por uno incorrecto.

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), Mozilla. Gratuito. La guía más clara sobre cachés privadas y compartidas, frescura, validación y las directivas de Cache-Control.
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/), Amazon Web Services. Gratuito. Una breve visión general de lazy loading, write-through, tiempo de vida y expulsión.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Gratuito. El patrón de aplicación más común descrito con sus problemas de consistencia y cuándo usarlo.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. Trata las cachés como datos derivados y explica los problemas de consistencia de mantener dos copias.
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), Fielding, Nottingham and Reschke, IETF. Gratuito. La especificación de frescura, validación, invalidación y cada directiva de caché.
- [Scaling Memcache at Facebook](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), Nishtala and others (2013). Gratuito. Cómo una capa de caché muy grande maneja stale sets, thundering herds y consistencia regional.
- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Vattani, Chierichetti and Lowenstein (2015). Gratuito. El paper detrás de la expiración anticipada probabilística, una solución simple para el stampede.
- [Redis documentation](https://redis.io/docs/latest/), Redis. Gratuito. La referencia oficial de tipos de datos, comandos, expiración y caché del lado del cliente.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis. Gratuito. Cómo funcionan las políticas de maxmemory y cómo Redis aproxima LRU y LFU.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Videos animados cortos sobre estrategias de caché, expulsión y los modos de fallo clásicos de las cachés.
- [Stack Overflow: caching tag](https://stackoverflow.com/questions/tagged/caching), Stack Overflow. Gratuito. Preguntas respondidas sobre invalidación, encabezados y diseño de cachés.

Lista completa y mini-proyectos: [projects/cache/README.es.md](projects/cache/README.es.md)

## Limitación de tasa

La limitación de tasa (rate limiting) fija un tope de cuántas peticiones puede hacer un cliente en un período, para proteger un servicio de la sobrecarga, el abuso y el uso desleal. Los algoritmos (ventana fija, ventana deslizante, token bucket, leaky bucket) se diferencian en cómo tratan las ráfagas y en cuánto estado necesitan, y ejecutarlos en varios servidores plantea cuestiones de atomicidad. La otra mitad del tema es el cliente: el estado 429, los encabezados de reintento y el backoff.

- [Visualizing algorithms for rate limiting](https://smudge.ai/blog/ratelimit-algorithms), smudge.ai. Gratuito. Demostraciones interactivas de ventana fija, ventana deslizante y token bucket, lado a lado.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe. Gratuito. Los cuatro tipos de limitador que ejecuta en producción una API de pagos, y por qué existe cada uno.
- [What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/), Cloudflare Learning Center. Gratuito. Una definición corta y sencilla de la idea y de contra qué protege.
- [Site Reliability Engineering: Handling Overload](https://sre.google/sre-book/handling-overload/), Google. Gratuito. Límites por cliente, throttling del lado del cliente y degradación elegante en un servicio grande.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. De pago. La fuente del quiz para el modelado de tráfico con leaky bucket y token bucket.
- [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585), Fielding and Nottingham, IETF. Gratuito. La definición de 429 Too Many Requests y su uso con Retry-After.
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), Wikipedia. Gratuito. El algoritmo, sus parámetros, la fórmula del tamaño de ráfaga y su relación con el leaky bucket.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog. Gratuito. Simulaciones que muestran por qué los clientes que reintentan necesitan aleatoriedad, y no solo retrasos crecientes.
- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), NGINX. Gratuito. La referencia del limitador leaky bucket de NGINX: rate, burst, nodelay y delay.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/), Redis. Gratuito. La página del comando incluye los patrones clásicos de limitadores de tasa y la condición de carrera que deben evitar.
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis. Gratuito. Cómo hacer atómica en el servidor la lógica de leer y luego escribir, la base de los limitadores distribuidos.
- [Stack Overflow: rate-limiting tag](https://stackoverflow.com/questions/tagged/rate-limiting), Stack Overflow. Gratuito. Preguntas respondidas sobre cómo implementar y configurar limitadores.

Lista completa y mini-proyectos: [projects/rate-limiting/README.es.md](projects/rate-limiting/README.es.md)

## Sistemas de archivos

Un sistema de archivos convierte un dispositivo de bloques en bruto en archivos y directorios con nombre que sobreviven a un corte de energía. Debajo de la interfaz familiar están los métodos de asignación, los i-nodos, la gestión del espacio libre y el journaling, y encima están las organizaciones de archivos que usan las bases de datos: registros, índices, árboles B y ordenamiento externo para datos que no caben en memoria. Ambas mitades están moldeadas por un hecho: el almacenamiento es lento, así que lo que cuenta es el número de accesos.

- [Operating Systems: Three Easy Pieces (Persistence part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratuito en línea, de pago impreso. Capítulos gratuitos sobre discos, RAID, archivos y directorios, implementación de sistemas de archivos, journaling y flash.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. En portugués. Gratuito. El libro de texto gratuito en portugués tiene una parte completa sobre archivos, directorios y asignación.
- [Files are hard](https://danluu.com/file-consistency/), Dan Luu. Gratuito. Un panorama de lo difícil que es escribir un archivo de forma segura, con la investigación que encontró los errores.
- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. De pago. La fuente del quiz para archivos, directorios, asignación, espacio libre y journaling.
- [Database Internals](https://www.databass.dev/), Alex Petrov. De pago. La primera mitad trata de las estructuras en disco: formatos de archivo, variantes del árbol B y almacenamiento estructurado en log.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Las clases sobre almacenamiento, árboles B+ y external merge sort coinciden con la segunda mitad de esta área.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Laboratorios sobre el sistema de archivos de xv6: i-nodos, directorios, la caché de búfer y el logging.
- [A Fast File System for UNIX](https://dsf.berkeley.edu/cs262/FFS.pdf), McKusick, Joy, Leffler and Fabry (1984). Gratuito. El paper que presentó los grupos de cilindros y las políticas de disposición, el antecesor de ext2 a ext4.
- [The Ubiquitous B-Tree](https://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer (1979). Gratuito. El panorama clásico de los árboles B y B+ y por qué se adaptan a los discos.
- [ext4 Data Structures and Algorithms](https://docs.kernel.org/filesystems/ext4/), kernel.org. Gratuito. La disposición en disco de un sistema de archivos de producción: grupos de bloques, i-nodos, extents y el journal.
- [SQLite Database File Format](https://www.sqlite.org/fileformat2.html), SQLite. Gratuito. Una descripción completa y legible de cómo se almacenan tablas e índices como páginas de árbol B en un solo archivo.
- [Unix and Linux Stack Exchange: filesystems tag](https://unix.stackexchange.com/questions/tagged/filesystems), Stack Exchange. Gratuito. Preguntas respondidas sobre i-nodos, enlaces, journaling y comportamiento de los sistemas de archivos.

Lista completa y mini-proyectos: [projects/file-systems/README.es.md](projects/file-systems/README.es.md)

## Observabilidad

La observabilidad es la capacidad de entender qué hace un sistema en ejecución a partir de los datos que emite. Los logs, las métricas y las trazas responden preguntas distintas, y juntos permiten explicar una petición lenta a través de varios servicios sin adivinar. El tema también cubre qué medir (indicadores de nivel de servicio), qué prometer (objetivos y presupuestos de error) y cuándo despertar a una persona (alertas).

- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry. Gratuito. Una breve introducción al vocabulario: telemetría, fiabilidad, logs, spans y trazas distribuidas.
- [Site Reliability Engineering: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Google. Gratuito. El capítulo con las cuatro señales de oro y la diferencia entre síntomas y causas.
- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon. Gratuito. Un diagrama y un texto de una página que separan las tres señales según para qué sirve cada una.
- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), Beyer, Jones, Petoff and Murphy (editors), Google. Gratuito. Gratis en línea: objetivos de nivel de servicio, presupuestos de error, monitoreo y alertas tal como se practican en Google.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/), Beyer, Murphy, Rensin, Kawahara and Thorne (editors), Google. Gratuito. La continuación práctica, con ejemplos resueltos de cómo implementar SLO y alertar sobre ellos.
- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Sigelman and others, Google (2010). Gratuito. El paper que definió las trazas, los spans y el muestreo, el modelo detrás de todo sistema de trazado.
- [Trace Context](https://w3c.github.io/trace-context/), W3C. Gratuito. Los encabezados estándar traceparent y tracestate que llevan una traza a través de los servicios.
- [The Site Reliability Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Google. Gratuito. Seis maneras de alertar sobre un objetivo, que terminan con alertas de múltiples ventanas y múltiples tasas de consumo.
- [OpenTelemetry documentation](https://opentelemetry.io/docs/), OpenTelemetry. Gratuito. Conceptos, SDK por lenguaje, el Collector y las convenciones semánticas.
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/), Prometheus Authors. Gratuito. El modelo de datos, los tipos de métricas, PromQL, las reglas de alertas y las buenas prácticas de instrumentación.
- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/), OpenTelemetry. Gratuito. Una tienda completa de microservicios instrumentada con trazas, métricas y logs, para ejecutar en local.
- [Observability Engineering, 2nd edition](https://www.honeycomb.io/observability-engineering-oreilly-book), Charity Majors, Liz Fong-Jones, George Miranda and Austin Parker. Gratuito. El libro que sigue el quiz (en su primera edición), ofrecido como e-book gratuito por Honeycomb tras registrarse.

Lista completa y mini-proyectos: [projects/observability/README.es.md](projects/observability/README.es.md)

## Blockchain

Una blockchain es un libro mayor sobre el que pueden ponerse de acuerdo muchas partes que no confían entre sí, sin una autoridad central. Combina ideas estudiadas en otras partes de este repositorio: las funciones hash y los árboles de Merkle hacen evidente cualquier alteración del historial, las firmas digitales prueban quién puede gastar, y la prueba de trabajo convierte el acuerdo en una cuestión de esfuerzo de cómputo. Estudiarla como estructura de datos y como protocolo separa la ingeniería del bombo publicitario.

- [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4), Grant Sanderson, 3Blue1Brown. Gratuito. Construye la idea paso a paso: un libro mayor público, firmas, hashes, bloques y prueba de trabajo.
- [Blockchain Demo](https://andersbrownworth.com/blockchain/), Anders Brownworth. Gratuito. Una página interactiva donde cambias un bloque y ves romperse los hashes de la cadena.
- [Learn Me A Bitcoin](https://learnmeabitcoin.com/), Greg Walker. Gratuito. Una guía técnica sencilla con diagramas y herramientas sobre claves, transacciones, bloques y minería.
- [Bitcoin and Cryptocurrency Technologies](https://bitcoinbook.cs.princeton.edu/), Narayanan, Bonneau, Felten, Miller and Goldfeder, Princeton. Gratuito en línea, de pago impreso. Un libro de texto universitario con un borrador gratuito en línea: criptografía, consenso, minería y alternativas.
- [Mastering Bitcoin, 3rd edition](https://github.com/bitcoinbook/bitcoinbook), Andreas Antonopoulos and David Harding. Gratuito en línea, de pago impreso. El libro técnico detallado, con su texto completo abierto en GitHub: claves, transacciones, la red y la minería.
- [Bitcoin and Cryptocurrency Technologies](https://www.coursera.org/learn/cryptocurrency), Princeton University (Coursera). Gratuito para auditar, certificado de pago. El curso en video del libro de texto de Princeton.
- [MIT 15.S12 Blockchain and Money](https://ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/), Gary Gensler, MIT OpenCourseWare. Gratuito. Clases que cubren la tecnología y luego juzgan con sobriedad dónde es útil y dónde no.
- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Satoshi Nakamoto (2008). Gratuito. El paper de nueve páginas que sigue el quiz: transacciones, servidor de marcas de tiempo, prueba de trabajo e incentivos.
- [Bitcoin: Um Sistema de Dinheiro Eletrônico Peer-to-Peer](https://bitcoin.org/files/bitcoin-paper/bitcoin_pt_br.pdf), Satoshi Nakamoto, tradução para o português. En portugués. Gratuito. La traducción al portugués de Brasil del paper, alojada en bitcoin.org.
- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/), Bitcoin.org developer documentation. Gratuito. La cadena de bloques, las transacciones, los contratos, las billeteras y la red peer-to-peer, con referencias.
- [Naivecoin: a tutorial for building a cryptocurrency](https://lhartikk.github.io/), Lauri Hartikka. Gratuito. Un tutorial en TypeScript que hace crecer una cadena mínima hasta una con prueba de trabajo y transacciones.
- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/), Stack Exchange. Gratuito. Preguntas técnicas respondidas por desarrolladores del protocolo.

Lista completa y mini-proyectos: [projects/blockchain/README.es.md](projects/blockchain/README.es.md)

## Integración continua

La integración continua significa fusionar cambios pequeños con frecuencia y dejar que un pipeline automatizado compile, haga lint y pruebe cada uno, para que los problemas se encuentren minutos después de introducirse. Alrededor de esa idea están las prácticas que usa este mismo repositorio: workflows en GitHub Actions, caché y artefactos, secretos y permisos, quality gates, estrategias de despliegue, versionado semántico y un changelog.

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler. Gratuito. El artículo de referencia sobre la práctica: una sola línea principal, builds que se autoprueban, retroalimentación rápida, arreglar de inmediato.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), GitHub. Gratuito. La introducción oficial a workflows, eventos, jobs, steps, actions y runners.
- [Engenharia de Software Moderna, capítulo 10: DevOps](https://engsoftmoderna.info/cap10.html), Marco Tulio Valente, UFMG. En portugués. Gratuito. Un capítulo gratuito en portugués sobre control de versiones, integración continua, despliegue y feature flags.
- [Continuous Delivery](https://continuousdelivery.com/), Jez Humble and David Farley. Gratuito en línea, de pago impreso. El sitio del libro resume sus principios: el pipeline de despliegue, la automatización y los lotes pequeños.
- [Software Engineering at Google: Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html), Winters, Manshreck and Wright. Gratuito. Un capítulo gratuito sobre ciclos de retroalimentación rápidos, pruebas previas y posteriores al envío, e inestabilidad.
- [Semantic Versioning 2.0.0](https://semver.org/), Tom Preston-Werner. Gratuito. La especificación de números de versión que usa este repositorio, disponible también en portugués y en español.
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), Conventional Commits contributors. Gratuito. La convención de mensajes de commit que permite a las herramientas derivar versiones y changelogs.
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Olivier Lacan. Gratuito. El formato de changelog de este repositorio y las razones detrás de él.
- [GitHub Actions documentation](https://docs.github.com/en/actions), GitHub. Gratuito. La referencia completa: sintaxis de workflows, contextos, caché, artefactos, matrices y workflows reutilizables.
- [Secure use reference for GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use), GitHub. Gratuito. Consejos oficiales de endurecimiento: tokens de mínimo privilegio, fijar actions y manejar entradas no confiables.
- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Gratuito. Videos semanales del coautor del libro Continuous Delivery sobre pipelines, desarrollo basado en trunk y pruebas.
- [GitHub Community: Actions](https://github.com/orgs/community/discussions/categories/actions), GitHub. Gratuito. El foro oficial para preguntas sobre workflows y runners.

Lista completa y mini-proyectos: [projects/continuous-integration/README.es.md](projects/continuous-integration/README.es.md)

## Ingeniería de software

La ingeniería de software es todo lo que rodea al código y decide si un proyecto tiene éxito: entender qué construir, organizar el trabajo, modelar y diseñar, mantener la calidad, estimar y hacer evolucionar el sistema durante años. Sus textos clásicos, de Brooks a los movimientos ágil y lean, tratan sobre todo de personas y compromisos, y explican por qué añadir programadores a un proyecto atrasado lo atrasa más.

Área solo teórica: no tiene mini-proyecto, así que la lista completa está aquí.

### Empieza aquí

- [Engenharia de Software Moderna](https://engsoftmoderna.info/), Marco Tulio Valente, UFMG. En portugués. Gratuito. Un libro de texto completo en portugués, gratuito en línea: procesos, requisitos, modelos, diseño, pruebas, refactoring y DevOps.
- [Software Engineering at Google](https://abseil.io/resources/swe-book), Titus Winters, Tom Manshreck and Hyrum Wright. Gratuito. Gratis en línea: cómo la cultura, los procesos y las herramientas mantienen sana una base de código a lo largo del tiempo.
- [Manifesto para Desenvolvimento Ágil de Software](https://agilemanifesto.org/iso/ptbr/manifesto.html), Beck and others (2001). En portugués. Gratuito. Los cuatro valores del Manifiesto Ágil en portugués, con un enlace a sus doce principios.

### Libros

- [Software Engineering, 10th edition](https://software-engineering-book.com/), Ian Sommerville. De pago. El libro de texto que sigue el quiz (en su 9.ª edición); el sitio del autor tiene diapositivas, videos y estudios de caso.
- [The Mythical Man-Month, anniversary edition](https://www.informit.com/store/mythical-man-month-essays-on-software-engineering-anniversary-9780201835953), Frederick P. Brooks Jr.. De pago. Los ensayos clásicos sobre por qué los proyectos grandes se atrasan, con "No Silver Bullet" incluido.
- [Clean Code](https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884), Robert C. Martin. De pago. Una fuente del quiz sobre nombres, funciones, comentarios y calidad del código a pequeña escala.
- [Code Simplicity](https://www.codesimplicity.com/), Max Kanat-Alexander. Gratuito en línea, de pago impreso. El sitio del autor, con los ensayos detrás del libro corto sobre simplicidad y el costo del cambio.
- [The Lean Startup](https://theleanstartup.com/), Eric Ries. De pago. El sitio del libro resume el ciclo construir, medir, aprender y el producto mínimo viable.
- [The Pragmatic Programmer, 20th anniversary edition](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/), David Thomas and Andrew Hunt. De pago. Hábitos prácticos de desarrolladores en activo, desde DRY y ortogonalidad hasta estimar.
- [Guide to the Software Engineering Body of Knowledge (SWEBOK)](https://www.computer.org/education/bodies-of-knowledge/software-engineering), IEEE Computer Society. Gratuito. El mapa de áreas de conocimiento de la propia profesión, de descarga gratuita.

### Cursos y clases

- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Gratuito. Lecturas públicas sobre cómo escribir código libre de errores, fácil de entender y preparado para el cambio.
- [UNIVESP on YouTube](https://www.youtube.com/@univesptv), Universidade Virtual do Estado de São Paulo. En portugués. Gratuito. Tiene cursos completos en portugués sobre ingeniería de software y gestión de proyectos.

### Papers y especificaciones

- [No Silver Bullet: Essence and Accident in Software Engineering](https://www.cs.unc.edu/techreports/86-020.pdf), Frederick P. Brooks Jr. (1986). Gratuito. El ensayo que separa la complejidad esencial de la accidental, como informe técnico de la universidad del autor.
- [The WyCash Portfolio Management System](https://c2.com/doc/oopsla92.html), Ward Cunningham (1992). Gratuito. El informe de experiencia donde apareció por primera vez la metáfora de la deuda para el diseño inacabado.
- [TechnicalDebtQuadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html), Martin Fowler. Gratuito. Una nota corta que clasifica la deuda técnica como deliberada o inadvertida, prudente o imprudente.
- [The Scrum Guide](https://scrumguides.org/), Ken Schwaber and Jeff Sutherland. Gratuito. La definición oficial y breve de Scrum, con traducciones al portugués y al español disponibles en el sitio.
- [Unified Modeling Language specification](https://www.omg.org/spec/UML/), Object Management Group. Gratuito. El estándar que define los diagramas de clases, de secuencia, de estados y de casos de uso.
- [Therac-25](https://en.wikipedia.org/wiki/Therac-25), Wikipedia. Gratuito. Un resumen de la máquina de radioterapia cuyas fallas de software mataron a pacientes, con las referencias a la investigación de Leveson y Turner.

### Videos

- [Agile is Dead](https://www.youtube.com/watch?v=a-BOSpxYJ9M), Dave Thomas, GOTO. Gratuito. Un firmante del manifiesto sobre la diferencia entre los valores ágiles y la industria que los rodea.
- [Código Fonte TV](https://www.youtube.com/@codigofontetv), Gabriel Fróes and Vanessa Weber. En portugués. Gratuito. Videos cortos en portugués que explican Scrum, Kanban, requisitos, deuda técnica y otros términos.

### Práctica y herramientas

- [PlantUML](https://plantuml.com/), PlantUML. Gratuito. Dibuja diagramas UML a partir de texto plano, bueno para practicar la notación.
- [Mermaid](https://mermaid.js.org/), Mermaid. Gratuito. Diagramas basados en texto que se renderizan directamente en Markdown en GitHub.

### Comunidades

- [Software Engineering Stack Exchange](https://softwareengineering.stackexchange.com/), Stack Exchange. Gratuito. Preguntas y respuestas sobre proceso, diseño, requisitos y práctica profesional.
- [r/ExperiencedDevs](https://www.reddit.com/r/ExperiencedDevs/), Reddit. Gratuito. Discusión entre desarrolladores en activo sobre proceso, equipos y compromisos.

## Inteligencia artificial y LLMs

La inteligencia artificial moderna es aprendizaje automático a escala: modelos con muchos números ajustables que se entrenan con datos en lugar de programarse a mano. Esta área va de las matemáticas de base (probabilidad, álgebra lineal, descenso de gradiente y retropropagación) a las piezas de un modelo de lenguaje grande (tokens, embeddings, atención, predicción del siguiente token) y de los generadores de imágenes (difusión), y a sus límites y costos.

- [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), Grant Sanderson, 3Blue1Brown. Gratuito. La mejor introducción visual: qué es una red, descenso de gradiente, retropropagación, luego transformers y atención.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), Andrej Karpathy. Gratuito. Un curso en video que programa todo desde cero: un motor de autograd, un modelo de caracteres y luego un GPT.
- [Deep Learning Book](https://www.deeplearningbook.com.br/), Data Science Academy. En portugués. Gratuito. Un libro gratuito en línea en portugués con muchos capítulos cortos, del perceptrón a los transformers.
- [Deep Learning](https://www.deeplearningbook.org/), Ian Goodfellow, Yoshua Bengio and Aaron Courville. Gratuito en línea, de pago impreso. El libro de texto de referencia, gratuito de leer en línea: las matemáticas, la optimización, la regularización y las arquitecturas principales.
- [Dive into Deep Learning](https://d2l.ai/), Zhang, Lipton, Li and Smola. Gratuito. Un libro interactivo gratuito donde cada concepto viene con código ejecutable, incluidos atención y transformers.
- [Speech and Language Processing, 3rd edition draft](https://web.stanford.edu/~jurafsky/slp3/), Dan Jurafsky and James Martin. Gratuito. El borrador gratuito del libro de texto de procesamiento del lenguaje: n-gramas, embeddings, transformers y modelos de lenguaje grandes.
- [CS224N Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/), Stanford University. Gratuito. Diapositivas, notas y tareas sobre vectores de palabras, atención, transformers, preentrenamiento y modelos grandes.
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), Vaswani and others (2017). Gratuito. El paper que presentó el transformer, la arquitectura de los modelos de lenguaje de hoy.
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), Ho, Jain and Abbeel (2020). Gratuito. El paper que hizo prácticos los modelos de difusión para la generación de imágenes.
- [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), Andrej Karpathy. Gratuito. Dos horas que van de un modelo de bigramas a un transformer funcional, línea por línea.
- [micrograd](https://github.com/karpathy/micrograd), Andrej Karpathy. Gratuito. Un diminuto motor de autograd y biblioteca de redes neuronales, lo bastante corto para leerlo de una sentada.
- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Polo Club of Data Science, Georgia Tech. Gratuito. Un pequeño GPT que corre en el navegador, con cada paso visible desde los tokens hasta las probabilidades del siguiente token.

Lista completa y mini-proyectos: [projects/artificial-intelligence/README.es.md](projects/artificial-intelligence/README.es.md)
